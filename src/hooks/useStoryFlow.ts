import { useState, useEffect, useCallback, type FormEvent, type ChangeEvent } from "react";
import axios from "axios";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc, setDoc, onSnapshot, collection, query, orderBy, limit, deleteDoc, addDoc, getDocs } from "firebase/firestore";
import { auth, db } from "@/src/lib/firebase";

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

function mapApiError(
  error: unknown,
  context: "ai" | "evolution" | "network"
): StatusMessage {
  const err = error as any;
  const status = err.response?.status || err.status;
  const isNetworkError = err.code === "ECONNABORTED" || err.code === "ERR_NETWORK" || err.message?.includes("Network Error");

  if (context === "ai") {
    if (status === 429 || err.message?.includes("quota") || err.message?.includes("429")) {
      return { type: "error", message: "Kuota AI habis hari ini. Tunggu besok atau upgrade." };
    }
    if (status === 403 || err.message?.includes("API key not valid")) {
      return { type: "error", message: "API key Gemini tidak valid." };
    }
    if (status === 404) {
      return { type: "error", message: "Model AI tidak ditemukan." };
    }
    if (isNetworkError || err.message?.includes("fetch")) {
      return { type: "error", message: "Tidak bisa terhubung ke layanan AI (Timeout/Network Error)." };
    }
    const serverMessage = err.response?.data?.error || err.message;
    return { type: "error", message: `Gagal membuat konten dengan AI: ${serverMessage}` };
  }

  if (context === "evolution") {
    if (status === 401 || status === 403) {
      return { type: "error", message: "API key WhatsApp backend tidak valid atau unauthorized. Cek Pengaturan." };
    }
    if (status === 404) {
      return { type: "error", message: "Instance WhatsApp tidak ditemukan. Periksa nama instance." };
    }
    if (status && status >= 500) {
      return { type: "error", message: `Mendapat respon ${status} dari server. Story Anda mungkin tetap berhasil.` };
    }
    if (isNetworkError || err.message?.includes("fetch")) {
      return { type: "error", message: "Koneksi ke API terputus atau timeout. Story mungkin tetap berhasil diposting." };
    }
    const data = err.response?.data;
    const detail = data?.message || data?.error || data?.response?.message || err.message || "Terjadi kesalahan.";
    
    if (typeof detail === 'string' && detail.toLowerCase().includes("timeout")) {
      return { type: "error", message: "Proses upload/pengiriman timeout. Story mungkin berhasil berurutan." };
    }
    return { type: "error", message: `WhatsApp backend error: ${typeof detail === 'string' ? detail : JSON.stringify(detail)}` };
  }

  if (isNetworkError) {
    return { type: "error", message: "Tidak bisa terhubung ke server. Periksa koneksi internet Anda." };
  }
  return { type: "error", message: err.message || "Terjadi kesalahan. Silakan coba lagi." };
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

export interface BackendConfig {
  backendType: "evolution" | "waha" | "custom";
  baseUrl: string;
  apiKey: string;
  aiProvider?: string;
  aiModel?: string;
  aiEndpoint?: string;
  aiApiKey?: string;
}

export function useStoryFlow({ onStatusChange }: UseStoryFlowOptions) {
  const [appPassword, setAppPassword] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [userId, setUserId] = useState<string | null>(null);
  
  const [backendConfig, setBackendConfig] = useState<BackendConfig | null>(null);

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

  useEffect(() => {
    const personaCategory = Object.entries(PERSONAS_GROUPED).find(([_, items]) =>
      Object.keys(items).includes(persona)
    )?.[0];
    if (!personaCategory) return;
    const allowedCategories = PERSONA_TO_STRUCTURE_CATEGORIES[personaCategory] || [];
    const isAllowed = Object.entries(STRUCTURES_GROUPED).some(([cat, items]) => {
      return allowedCategories.includes(cat) && Object.keys(items).includes(structure);
    });
    if (!isAllowed) {
      const firstAllowedCat = allowedCategories[0];
      if (firstAllowedCat && STRUCTURES_GROUPED[firstAllowedCat as keyof typeof STRUCTURES_GROUPED]) {
        const firstStruct = Object.keys(STRUCTURES_GROUPED[firstAllowedCat as keyof typeof STRUCTURES_GROUPED])[0];
        setStructure(firstStruct as Structure);
      }
    }
  }, [persona, structure]);

  const [instanceName, setInstanceName] = useState("");
  const [availableInstances, setAvailableInstances] = useState<EvolutionInstance[]>([]);
  const [isLoadingInstances, setIsLoadingInstances] = useState(false);

  const [isGenerating, setIsGenerating] = useState(false);
  const [isPosting, setIsPosting] = useState(false);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [postingProgress, setPostingProgress] = useState<PostingProgress | null>(null);

  const [generatedContent, setGeneratedContent] = useState<GeneratedContent | null>(null);
  const [status, setStatus] = useState<StatusMessage | null>(null);

  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>("checking");
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [isServerReady, setIsServerReady] = useState<boolean | null>(null);

  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [progress, setProgress] = useState(0);

  const wrapStatus = useCallback((s: StatusMessage | null) => {
    setStatus(s);
    onStatusChange(s);
  }, [onStatusChange]);

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

  useEffect(() => {
    setProgress(0);
  }, [generatedContent?.currentIndex]);

  const getHeaders = () => {
    const headers: Record<string, string> = {};
    if (appPassword) {
      headers["x-app-password"] = appPassword;
    }
    if (backendConfig) {
      headers["x-whatsapp-config"] = JSON.stringify(backendConfig);
    }
    return headers;
  };

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUserId(user.uid);
        setIsLoggedIn(true);
        const unsubConfig = onSnapshot(doc(db, "users", user.uid, "whatsappConfig", "default"), (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data();
            setBackendConfig({
              backendType: data.backendType || "evolution",
              baseUrl: data.baseUrl || "",
              apiKey: data.apiKey || "",
              aiProvider: data.aiProvider || "gemini",
              aiModel: data.aiModel || "",
              aiEndpoint: data.aiEndpoint || "",
              aiApiKey: data.aiApiKey || "",
            });
            if (data.instanceName) {
              setInstanceName(data.instanceName);
            }
          }
        }, (error) => {
          console.error("Error fetching config:", error);
        });
        checkServer();
        fetchHistory();
        return () => unsubConfig();
      } else {
        setUserId(null);
        setIsLoggedIn(false);
        setBackendConfig(null);
      }
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (backendConfig) {
      checkConnection();
      fetchInstances();
    }
  }, [backendConfig]);

  useEffect(() => {
    if (!isLoggedIn) return;
    const interval = setInterval(() => {
      checkServer();
      if (backendConfig) {
         checkConnection();
         fetchInstances();
      }
      fetchHistory();
    }, 30000);
    return () => clearInterval(interval);
  }, [isLoggedIn, backendConfig]);

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
      const res = await axios.get("/api/instances", { headers: getHeaders() });
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
      console.error("Gagal mengambil daftar instance:", (err.response?.data as string) || err.message);
      if (err.response?.status === 500) {
        const data = err.response.data as Record<string, string> | undefined;
        if (data?.error?.includes("configuration is missing")) {
          wrapStatus({ type: "error", message: "Konfigurasi WhatsApp backend belum diatur di Pengaturan." });
        }
      }
    } finally {
      setIsLoadingInstances(false);
    }
  };

  useEffect(() => {
    if (mode === "manual") {
      setGeneratedContent((prev) => {
        const newParts = splitTextIntoStories(manualContent).map((p) => ({
          text: p,
          backgroundColor: manualBgColor,
          font: 1,
        }));
        const nextIndex = prev && prev.currentIndex < newParts.length ? prev.currentIndex : 0;
        return { parts: newParts, currentIndex: nextIndex };
      });
    }
  }, [manualContent, mode, manualBgColor]);

  const checkConnection = async () => {
    try {
      await axios.get("/api/instances", { headers: getHeaders() });
      setConnectionStatus("connected");
    } catch {
      setConnectionStatus("disconnected");
    }
  };

  const fetchHistory = async () => {
    if (!isLoggedIn || !userId) return;
    try {
      const q = query(
        collection(db, "users", userId, "history"),
        orderBy("timestamp", "desc"),
        limit(50)
      );
      const snapshot = await getDocs(q);
      const docsData = snapshot.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          timestamp: new Date(data.timestamp).toISOString(),
          type: data.type,
          instance: data.instance,
          status: data.status,
          preview: data.preview,
          details: data.details,
          error: data.error,
        } as HistoryEntry;
      });
      setHistory(docsData);
    } catch (error: unknown) {
      console.error("Error fetching history:", error);
    }
  };

  const deleteHistoryItem = async (id: number | string) => {
    if (!userId) return;
    try {
      await deleteDoc(doc(db, "users", userId, "history", String(id)));
      setHistory((prev) => prev.filter((item) => item.id !== id));
    } catch (error: unknown) {
      console.error("Error deleting history item:", error);
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

  const enhanceManualContent = async () => {
    if (!manualContent) return;
    setIsEnhancing(true);
    try {
      const text = await enhanceStoryContent({
        content: manualContent,
        autoStyling,
        aestheticMode,
        aiConfig: backendConfig,
      });
      setManualContent(text || manualContent);
      wrapStatus({ type: "success", message: "Konten berhasil dipercantik!" });
    } catch (error) {
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
        const aiImg = await generateAIImage(prompt, backendConfig);
        setImageUrl(aiImg);
      }
      const fullText = await generateStoryContent({
        prompt,
        persona,
        structure,
        format,
        autoStyling,
        aestheticMode,
        aiConfig: backendConfig,
      });
      const parts = format === "text" ? splitTextIntoStories(fullText) : [fullText];
      const randomBg = BG_COLORS[Math.floor(Math.random() * BG_COLORS.length)];
      setGeneratedContent({
        parts: parts.map((p) => ({ text: p, backgroundColor: randomBg, font: 1 })),
        currentIndex: 0,
      });
    } catch (error) {
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
        const payload: PostStoryPayload & { config?: BackendConfig } = {
          type: format,
          content: format === "text" ? part.text : finalImage,
          caption: format === "image" ? part.text : undefined,
          backgroundColor: part.backgroundColor || "#000000",
          font: part.font || 1,
          instanceName: instanceName || undefined,
        };
        
        if (backendConfig) {
           payload.config = backendConfig;
        }

        let resultData: any = null;
        try {
          const res = await axios.post("/api/post-story", payload, { headers: getHeaders() });
          resultData = res.data;
          
          if (userId) {
            await addDoc(collection(db, "users", userId, "history"), {
              userId,
              timestamp: Date.now(),
              type: format,
              instance: instanceName || "default",
              status: "SUCCESS",
              preview: format === "text" ? part.text.substring(0, 100) : "Image Story",
              details: format === "text" ? part.text : (part.text || "Image Story")
            });
          }
        } catch (postErr: any) {
          if (userId) {
            const errorMsg = postErr.response?.data || postErr.message;
            await addDoc(collection(db, "users", userId, "history"), {
              userId,
              timestamp: Date.now(),
              type: format,
              instance: instanceName || "default",
              status: "FAILED",
              preview: format === "text" ? part.text.substring(0, 100) : "Image Story",
              error: typeof errorMsg === "string" ? errorMsg : JSON.stringify(errorMsg)
            });
          }
          throw postErr; // re-throw to be caught in the outer catch block
        }

        if (partsToPost.length > 1 && i < partsToPost.length - 1) {
          await new Promise((resolve) => setTimeout(resolve, 1500));
        }
      }
      wrapStatus({ type: "success", message: `${partsToPost.length} Story berhasil diposting!` });
      fetchHistory();
    } catch (error: unknown) {
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
  };

  const handleLogout = () => {
    signOut(auth);
  };

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
      if (!prev || prev.parts.length <= 1) return prev;
      const newParts = [...prev.parts];
      newParts.splice(prev.currentIndex, 1);
      const nextIndex = Math.min(prev.currentIndex, newParts.length - 1);
      return { ...prev, parts: newParts, currentIndex: nextIndex };
    });
  }, []);

  const saveBackendConfig = async (newConfig: BackendConfig & { instanceName?: string }) => {
     if (!userId) return;
     try {
       await setDoc(doc(db, "users", userId, "whatsappConfig", "default"), {
         ...newConfig,
         updatedAt: Date.now()
       });
       if (newConfig.instanceName) {
         setInstanceName(newConfig.instanceName);
       }
       wrapStatus({ type: "success", message: "Konfigurasi WhatsApp backend berhasil disimpan." });
       checkConnection();
       fetchInstances();
     } catch (err) {
       console.error("Save config error", err);
       wrapStatus({ type: "error", message: "Gagal menyimpan konfigurasi backend." });
     }
  };

  return {
    appPassword, setAppPassword,
    isLoggedIn, loginError, handleLogin, handleLogout,
    userId, backendConfig, saveBackendConfig,
    prompt, setPrompt,
    manualContent, setManualContent,
    manualBgColor, setManualBgColor,
    mode, setMode,
    persona, setPersona,
    structure, setStructure,
    autoStyling, setAutoStyling,
    aestheticMode, setAestheticMode,
    format, setFormat,
    imageUrl, setImageUrl,
    imageSource, setImageSource,
    uploadedImage, setUploadedImage,
    handleFileUpload,
    instanceName, setInstanceName,
    availableInstances, isLoadingInstances, fetchInstances,
    isGenerating, isPosting, isEnhancing, postingProgress,
    generatedContent, setGeneratedContent, status, setStatus: wrapStatus,
    connectionStatus, history, isServerReady,
    isAutoPlaying, setIsAutoPlaying, progress,
    generateWithAI, postToWA, enhanceManualContent, fetchHistory, deleteHistoryItem, getAnalytics,
    goToSlide, updateSlideText, updateSlideBg, deleteSlide,
  };
}
