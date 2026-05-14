import { useState, useEffect, useCallback, type FormEvent, type ChangeEvent } from "react";
import axios from "axios";
import type {
  Format,
  Mode,
  Persona,
  Structure,
  ImageSource,
  ConnectionStatus,
  StoryPart,
  GeneratedContent,
  PostingProgress,
  StatusMessage,
  EvolutionInstance,
  HistoryEntry,
  AnalyticsData,
  PostStoryPayload,
} from "@/src/types";
import {
  BG_COLORS,
  PERSONAS_GROUPED,
  STRUCTURES_GROUPED,
  PERSONA_TO_STRUCTURE_CATEGORIES,
} from "@/src/constants";

import { generateStoryContent, enhanceStoryContent, generateAIImage } from "@/src/lib/gemini";

/**
 * Map API errors to user-friendly Indonesian messages.
 * Handles Gemini quota (429), network failures, and Evolution API errors.
 */
function mapApiError(
  error: unknown,
  context: "ai" | "evolution" | "network"
): StatusMessage {
  const err = error as {
    response?: { status?: number; data?: any };
    message?: string;
    code?: string;
    status?: number;
  };

  const status = err.response?.status || err.status;
  const isNetworkError = err.code === "ECONNABORTED" || err.code === "ERR_NETWORK" || err.message?.includes("Network Error");

  // Gemini / AI errors
  if (context === "ai") {
    if (status === 429 || err.message?.includes("quota") || err.message?.includes("429")) {
      return {
        type: "error",
        message:
          "Kuota AI habis hari ini. Tunggu besok atau upgrade plan di https://aistudio.google.com/apikey",
      };
    }
    if (status === 403 || err.message?.includes("API key not valid")) {
      return {
        type: "error",
        message: "API key Gemini tidak valid. Cek konfigurasi di .env.",
      };
    }
    if (status === 404) {
      return {
        type: "error",
        message: "Model AI tidak ditemukan. Periksa nama model di konfigurasi.",
      };
    }
    if (isNetworkError || err.message?.includes("fetch")) {
      return {
        type: "error",
        message: "Tidak bisa terhubung ke layanan AI. Periksa koneksi internet (Timeout/Network Error).",
      };
    }
    
    const serverMessage = err.response?.data?.error || err.message;
    return {
      type: "error",
      message: `Gagal membuat konten dengan AI: ${serverMessage}`,
    };
  }

  // Evolution API errors
  if (context === "evolution") {
    if (status === 401 || status === 403) {
      return {
        type: "error",
        message: "API key Evolution tidak valid atau tidak memiliki akses. Cek konfigurasi.",
      };
    }
    if (status === 404) {
      return {
        type: "error",
        message: "Instance WhatsApp tidak ditemukan. Periksa nama instance.",
      };
    }
    if (status && status >= 500) {
      return {
        type: "error", // Using error just to show it, but message says it might have succeeded
        message: `Mendapat respon ${status} dari server. Namun, story Anda mungkin tetap berhasil diposting. Silakan periksa aplikasi WhatsApp Anda untuk memastikan tidak ada duplikat.`,
      };
    }
    if (isNetworkError || err.message?.includes("fetch")) {
      return {
        type: "error",
        message: "Koneksi ke Evolution API terputus atau timeout. Namun, story mungkin tetap berhasil diposting di latar belakang. Silakan cek WhatsApp Anda.",
      };
    }
    // Extract error details from response if available
    const data = err.response?.data;
    const detail = data?.message || data?.error || data?.response?.message || err.message || "Terjadi kesalahan.";
    
    if (typeof detail === 'string' && detail.toLowerCase().includes("timeout")) {
      return {
        type: "error", // Use error visually but the text implies success could happen
        message: "Proses upload/pengiriman timeout dari server. Story Anda mungkin tetap berhasil diposting di WhatsApp secara berurutan. Silakan cek aplikasi WhatsApp Anda.",
      };
    }

    return {
      type: "error",
      message: `Evolution API error: ${typeof detail === 'string' ? detail : JSON.stringify(detail)}`,
    };
  }

  // Generic network errors
  if (isNetworkError) {
    return {
      type: "error",
      message: "Tidak bisa terhubung ke server. Periksa koneksi internet Anda.",
    };
  }

  return {
    type: "error",
    message: err.message || "Terjadi kesalahan. Silakan coba lagi.",
  };
}

function splitTextIntoStories(text: string): string[] {
  if (!text) return [];

  const rawParts = text.split(/\n\n|\n(?=\d\.)/);
  const finalParts: string[] = [];
  let currentChunk = "";

  const pushChunk = (chunk: string) => {
    const trimmed = chunk.trim();
    if (trimmed) finalParts.push(trimmed);
  };

  rawParts.forEach((part) => {
    const trimmedPart = part.trim();
    if (!trimmedPart) return;

    if (currentChunk && currentChunk.length + trimmedPart.length + 2 > 500) {
      pushChunk(currentChunk);
      currentChunk = trimmedPart;
    } else {
      currentChunk = currentChunk ? `${currentChunk}\n\n${trimmedPart}` : trimmedPart;
    }

    if (currentChunk.length > 500) {
      const tempChunk = currentChunk;
      currentChunk = "";

      const sentences = tempChunk.match(/[^.!?]+[.!?]+(?:\s|$)|[^.!?]+$/g) || [tempChunk];

      sentences.forEach((sentence) => {
        const s = sentence.trim();
        if (!s) return;

        if (currentChunk && currentChunk.length + s.length + 1 > 500) {
          pushChunk(currentChunk);
          currentChunk = s;
        } else {
          currentChunk = currentChunk ? `${currentChunk} ${s}` : s;
        }
      });
    }
  });

  pushChunk(currentChunk);

  return finalParts.length > 0 ? finalParts : [text];
}

export interface UseStoryFlowOptions {
  onStatusChange: (status: StatusMessage | null) => void;
}

export function useStoryFlow({ onStatusChange }: UseStoryFlowOptions) {
  // --- Auth State ---
  const [appPassword, setAppPassword] = useState(
    localStorage.getItem("storyflow_password") || ""
  );
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loginError, setLoginError] = useState("");

  // --- Input State ---
  const [prompt, setPrompt] = useState("");
  const [manualContent, setManualContent] = useState("");
  const [manualBgColor, setManualBgColor] = useState(BG_COLORS[0]);
  const [mode, setMode] = useState<Mode>("ai");
  const [persona, setPersona] = useState<Persona>("Bestie Santai");
  const [structure, setStructure] = useState<Structure>("Storytelling (Hook-Story-Offer)");
  const [autoStyling, setAutoStyling] = useState(true);
  const [aestheticMode, setAestheticMode] = useState(false);
  const [format, setFormat] = useState<Format>("text");
  const [imageUrl, setImageUrl] = useState("");
  const [imageSource, setImageSource] = useState<ImageSource>("url");
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);

  // --- Sync Structure with Persona ---
  useEffect(() => {
    // Find category of current persona
    const personaCategory = Object.entries(PERSONAS_GROUPED).find(([_, items]) =>
      Object.keys(items).includes(persona)
    )?.[0];

    if (!personaCategory) return;

    const allowedCategories = PERSONA_TO_STRUCTURE_CATEGORIES[personaCategory] || [];
    
    // Check if current structure is allowed
    const isAllowed = Object.entries(STRUCTURES_GROUPED).some(([cat, items]) => {
      return allowedCategories.includes(cat) && Object.keys(items).includes(structure);
    });

    if (!isAllowed) {
      // Set to first available structure in the first allowed category
      const firstAllowedCat = allowedCategories[0];
      if (firstAllowedCat && STRUCTURES_GROUPED[firstAllowedCat as keyof typeof STRUCTURES_GROUPED]) {
        const firstStruct = Object.keys(STRUCTURES_GROUPED[firstAllowedCat as keyof typeof STRUCTURES_GROUPED])[0];
        setStructure(firstStruct as Structure);
      }
    }
  }, [persona, structure]);

  // --- Instance State ---
  const [instanceName, setInstanceName] = useState("");
  const [availableInstances, setAvailableInstances] = useState<EvolutionInstance[]>([]);
  const [isLoadingInstances, setIsLoadingInstances] = useState(false);

  // --- Loading State ---
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPosting, setIsPosting] = useState(false);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [postingProgress, setPostingProgress] = useState<PostingProgress | null>(null);

  // --- Content State ---
  const [generatedContent, setGeneratedContent] = useState<GeneratedContent | null>(null);
  const [status, setStatus] = useState<StatusMessage | null>(null);

  // --- Connection State ---
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>("checking");
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [isServerReady, setIsServerReady] = useState<boolean | null>(null);

  // --- Auto-play State ---
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [progress, setProgress] = useState(0);

  // --- Wrapper for status ---
  const wrapStatus = useCallback(
    (s: StatusMessage | null) => {
      setStatus(s);
      onStatusChange(s);
    },
    [onStatusChange]
  );

  // --- Auto-play logic ---
  useEffect(() => {
    if (!isAutoPlaying || !generatedContent || generatedContent.parts.length <= 1) {
      setProgress(0);
      return;
    }

    const duration = 5000;
    const interval = 50;
    const increment = (interval / duration) * 100;

    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          setGeneratedContent((curr) => {
            if (!curr) return null;
            const nextIndex = (curr.currentIndex + 1) % curr.parts.length;
            return { ...curr, currentIndex: nextIndex };
          });
          return 0;
        }
        return prev + increment;
      });
    }, interval);

    return () => clearInterval(timer);
  }, [isAutoPlaying, generatedContent?.currentIndex, generatedContent?.parts.length]);

  // Reset progress when slide changes manually
  useEffect(() => {
    setProgress(0);
  }, [generatedContent?.currentIndex]);

  // Configure axios with password header
  useEffect(() => {
    if (appPassword) {
      axios.defaults.headers.common["x-app-password"] = appPassword;
    }
  }, [appPassword]);

  // Init + polling
  useEffect(() => {
    const init = async () => {
      await checkServer();
      if (appPassword) {
        try {
          // Verify password by fetching history
          const res = await axios.get("/api/history", {
            headers: { "x-app-password": appPassword },
          });
          setHistory(res.data);
          setIsLoggedIn(true);
          
          // Only fetch these if verify succeeded
          checkConnection();
          fetchInstances();
        } catch (err: any) {
          console.warn("[Auth] Session invalid or expired:", err.message);
          setIsLoggedIn(false);
          // If we got a 401, clear the stored password
          if (err.response?.status === 401) {
            handleLogout();
          }
        }
      }
    };
    init();
  }, []);

  // Polling logic - separate from init
  useEffect(() => {
    if (!isLoggedIn) return;

    const interval = setInterval(() => {
      checkServer();
      checkConnection();
      fetchHistory();
      fetchInstances();
    }, 30000);

    return () => clearInterval(interval);
  }, [isLoggedIn, appPassword]);

  const checkServer = async (retries = 3): Promise<boolean> => {
    try {
      const res = await axios.get("/api/ping");
      if (res.data.status === "pong") {
        setIsServerReady(true);
        return true;
      }
      setIsServerReady(false);
      return false;
    } catch {
      if (retries > 0) {
        await new Promise((resolve) => setTimeout(resolve, 2000));
        return checkServer(retries - 1);
      }
      setIsServerReady(false);
      return false;
    }
  };

  const fetchInstances = async () => {
    setIsLoadingInstances(true);
    try {
      const res = await axios.get("/api/instances");
      let instances: unknown[] = [];
      if (Array.isArray(res.data)) {
        instances = res.data;
      } else if (res.data && Array.isArray(res.data.instances)) {
        instances = res.data.instances;
      }

      const normalizedInstances = instances.map((item: Record<string, unknown>) => {
        if (item.instance && typeof item.instance === "object") {
          const inst = item.instance as Record<string, unknown>;
          return {
            ...inst,
            instanceName: (inst.instanceName || inst.name) as string,
            connectionStatus: (inst.connectionStatus || inst.status) as string,
          };
        }
        return {
          ...item,
          instanceName: (item.instanceName || item.name) as string,
          connectionStatus: (item.connectionStatus || item.status) as string,
        };
      });

      setAvailableInstances(normalizedInstances);

      if (normalizedInstances.length > 0 && !instanceName) {
        const firstConnected = normalizedInstances.find(
          (inst) => inst.connectionStatus === "CONNECTED" || inst.connectionStatus === "open"
        );
        if (firstConnected) {
          setInstanceName(firstConnected.instanceName);
        }
      }
    } catch (error: unknown) {
      const err = error as { response?: { data?: any; status?: number }; message?: string };
      if (err.response?.status === 401) {
        handleLogout();
        return;
      }
      console.error(
        "Gagal mengambil daftar instance:",
        (err.response?.data as string) || err.message
      );
      if (err.response?.status === 500) {
        const data = err.response.data as Record<string, string> | undefined;
        if (data?.error?.includes("configuration is missing")) {
          wrapStatus({
            type: "error",
            message: "Konfigurasi Evolution API belum diatur di Secrets.",
          });
        }
      }
    } finally {
      setIsLoadingInstances(false);
    }
  };

  // Update preview automatically in manual mode
  useEffect(() => {
    if (mode === "manual") {
      setGeneratedContent((prev) => {
        const newParts = splitTextIntoStories(manualContent).map((p) => ({
          text: p,
          backgroundColor: manualBgColor,
          font: 1,
        }));

        const nextIndex = prev && prev.currentIndex < newParts.length ? prev.currentIndex : 0;

        return {
          parts: newParts,
          currentIndex: nextIndex,
        };
      });
    }
  }, [manualContent, mode, manualBgColor]);

  const checkConnection = async () => {
    try {
      const res = await axios.get("/api/health-check");
      if (res.data.status === "connected") {
        setConnectionStatus("connected");
      } else {
        setConnectionStatus("disconnected");
      }
    } catch {
      setConnectionStatus("disconnected");
    }
  };

  const fetchHistory = async () => {
    if (!appPassword && !isLoggedIn) return;
    try {
      const res = await axios.get("/api/history");
      setHistory(res.data);
    } catch (error: unknown) {
      const err = error as { response?: { status?: number }; message?: string };
      if (err.response?.status === 401) {
        console.warn("[Auth] 401 Unauthorized fetching history. Logging out.");
        handleLogout();
      } else {
        console.error("Gagal mengambil log aktivitas:", err.message);
      }
    }
  };

  const deleteHistoryItem = async (id: number) => {
    try {
      await axios.delete(`/api/history/${id}`, {
        headers: { "x-app-password": appPassword },
      });
      setHistory((prev) => prev.filter((item) => item.id !== id));
    } catch (error: unknown) {
      const err = error as { message?: string };
      console.error("Gagal menghapus riwayat:", err.message);
    }
  };

  const getAnalytics = (): AnalyticsData => {
    const total = history.length;
    const success = history.filter((h) => h.status === "SUCCESS").length;
    const failed = history.filter((h) => h.status === "FAILED").length;
    const textCount = history.filter((h) => h.type === "text").length;
    const imageCount = history.filter((h) => h.type === "image").length;

    return { total, success, failed, textCount, imageCount };
  };

  // --- AI Generation ---
  const enhanceManualContent = async () => {
    if (!manualContent) return;
    setIsEnhancing(true);
    try {
      const text = await enhanceStoryContent({
        content: manualContent,
        autoStyling,
        aestheticMode,
      });

      setManualContent(text || manualContent);
      wrapStatus({ type: "success", message: "Konten berhasil dipercantik!" });
    } catch (error) {
      console.error("Enhancement Error:", error);
      wrapStatus(mapApiError(error, "ai"));
    } finally {
      setIsEnhancing(false);
    }
  };

  const generateWithAI = async () => {
    if (!prompt) return;
    setIsGenerating(true);
    wrapStatus(null);

    try {
      if (format === "image" && imageSource === "ai") {
        const aiImg = await generateAIImage(prompt);
        setImageUrl(aiImg);
      }

      const fullText = await generateStoryContent({
        prompt,
        persona,
        structure,
        format,
        autoStyling,
        aestheticMode,
      });
      const parts = format === "text" ? splitTextIntoStories(fullText) : [fullText];
      const randomBg = BG_COLORS[Math.floor(Math.random() * BG_COLORS.length)];

      setGeneratedContent({
        parts: parts.map((p) => ({
          text: p,
          backgroundColor: randomBg,
          font: 1,
        })),
        currentIndex: 0,
      });
    } catch (error) {
      console.error("Generation Error:", error);
      wrapStatus(mapApiError(error, "ai"));
    } finally {
      setIsGenerating(false);
    }
  };

  const postToWA = async () => {
    const partsToPost = generatedContent?.parts;
    const finalImage = imageSource === "upload" ? uploadedImage : imageUrl;

    if (!partsToPost || partsToPost.length === 0) return;
    if (format === "image" && !finalImage) return;

    setIsPosting(true);
    wrapStatus(null);
    setPostingProgress({ current: 0, total: partsToPost.length });

    try {
      for (let i = 0; i < partsToPost.length; i++) {
        setPostingProgress({ current: i + 1, total: partsToPost.length });
        const part = partsToPost[i];

        const payload: PostStoryPayload = {
          type: format,
          content: format === "text" ? part.text : finalImage,
          caption: format === "image" ? part.text : undefined,
          backgroundColor: part.backgroundColor || "#000000",
          font: part.font || 1,
          instanceName: instanceName || undefined,
        };

        await axios.post("/api/post-story", payload);

        if (partsToPost.length > 1 && i < partsToPost.length - 1) {
          await new Promise((resolve) => setTimeout(resolve, 1500));
        }
      }

      wrapStatus({ type: "success", message: `${partsToPost.length} Story berhasil diposting!` });
      fetchHistory();
    } catch (error: unknown) {
      console.error("Post Error:", error);
      wrapStatus(mapApiError(error, "evolution"));
      fetchHistory();
    } finally {
      setIsPosting(false);
      setPostingProgress(null);
    }
  };

  const handleFileUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setUploadedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setLoginError("");
    try {
      const tempAxios = axios.create({
        headers: { "x-app-password": appPassword },
      });
      await tempAxios.get("/api/history");

      localStorage.setItem("storyflow_password", appPassword);
      axios.defaults.headers.common["x-app-password"] = appPassword;
      setIsLoggedIn(true);
      fetchInstances();
      checkConnection();
    } catch (err: unknown) {
      const error = err as { response?: { status?: number } };
      if (error.response?.status === 401) {
        setLoginError("Password salah. Silakan coba lagi.");
      } else {
        setLoginError("Gagal terhubung ke server.");
      }
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("storyflow_password");
    setAppPassword("");
    setIsLoggedIn(false);
    delete axios.defaults.headers.common["x-app-password"];
  };

  // --- Slide helpers ---
  const goToSlide = useCallback((index: number) => {
    setGeneratedContent((prev) => {
      if (!prev) return null;
      const clamped = Math.max(0, Math.min(index, prev.parts.length - 1));
      return { ...prev, currentIndex: clamped };
    });
  }, []);

  const updateSlideText = useCallback((text: string) => {
    setGeneratedContent((prev) => {
      if (!prev) return null;
      const newParts = [...prev.parts];
      newParts[prev.currentIndex] = { ...newParts[prev.currentIndex], text };
      return { ...prev, parts: newParts };
    });
  }, []);

  const updateSlideBg = useCallback((bg: string) => {
    setGeneratedContent((prev) => {
      if (!prev) return null;
      const newParts = [...prev.parts];
      newParts[prev.currentIndex] = { ...newParts[prev.currentIndex], backgroundColor: bg };
      return { ...prev, parts: newParts };
    });
  }, []);

  const deleteSlide = useCallback(() => {
    setGeneratedContent((prev) => {
      if (!prev || prev.parts.length <= 1) return prev; // Don't delete if it's the only slide
      const newParts = [...prev.parts];
      newParts.splice(prev.currentIndex, 1);
      const nextIndex = Math.min(prev.currentIndex, newParts.length - 1);
      return { ...prev, parts: newParts, currentIndex: nextIndex };
    });
  }, []);

  return {
    // Auth
    appPassword,
    setAppPassword,
    isLoggedIn,
    loginError,
    handleLogin,
    handleLogout,

    // Input
    prompt,
    setPrompt,
    manualContent,
    setManualContent,
    manualBgColor,
    setManualBgColor,
    mode,
    setMode,
    persona,
    setPersona,
    structure,
    setStructure,
    autoStyling,
    setAutoStyling,
    aestheticMode,
    setAestheticMode,
    format,
    setFormat,
    imageUrl,
    setImageUrl,
    imageSource,
    setImageSource,
    uploadedImage,
    setUploadedImage,
    handleFileUpload,

    // Instances
    instanceName,
    setInstanceName,
    availableInstances,
    isLoadingInstances,
    fetchInstances,

    // Loading
    isGenerating,
    isPosting,
    isEnhancing,
    postingProgress,

    // Content
    generatedContent,
    setGeneratedContent,
    status,
    setStatus: wrapStatus,

    // Connection
    connectionStatus,
    history,
    isServerReady,

    // Auto-play
    isAutoPlaying,
    setIsAutoPlaying,
    progress,

    // Actions
    generateWithAI,
    postToWA,
    enhanceManualContent,
    fetchHistory,
    deleteHistoryItem,
    getAnalytics,

    // Slide helpers
    goToSlide,
    updateSlideText,
    updateSlideBg,
    deleteSlide,
  };
}
