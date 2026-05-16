import React, { useCallback, useState } from "react";
import {
  Send,
  Sparkles,
  Type,
  Image as LucideImage,
  LogOut,
  Smartphone,
  RefreshCw,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Settings
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/src/lib/utils";
import { useStoryFlow } from "@/src/hooks/useStoryFlow";
import LoginScreen from "@/src/components/LoginScreen";
import InstanceSelector from "@/src/components/InstanceSelector";
import StoryGenerator from "@/src/components/StoryGenerator";
import ManualPoster from "@/src/components/ManualPoster";
import StoryPreview from "@/src/components/StoryPreview";
import SlideEditor from "@/src/components/SlideEditor";
import AnalyticsDashboard from "@/src/components/AnalyticsDashboard";
import SettingsModal from "@/src/components/SettingsModal";

export default function App() {
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const {
    isLoggedIn, loginError, handleLogin, handleLogout,
    userId, backendConfig, saveBackendConfig,
    prompt, setPrompt, manualContent, setManualContent, manualBgColor, setManualBgColor,
    mode, setMode, persona, setPersona, structure, setStructure,
    autoStyling, setAutoStyling, aestheticMode, setAestheticMode,
    format, setFormat, imageUrl, setImageUrl, imageSource, setImageSource,
    uploadedImage, setUploadedImage, handleFileUpload,
    instanceName, setInstanceName, availableInstances, isLoadingInstances, fetchInstances,
    isGenerating, isPosting, isEnhancing, postingProgress,
    generatedContent, setGeneratedContent, status,
    connectionStatus, history, isServerReady,
    isAutoPlaying, setIsAutoPlaying, progress,
    generateWithAI, postToWA, enhanceManualContent, fetchHistory, deleteHistoryItem, getAnalytics,
    goToSlide, updateSlideText, updateSlideBg, deleteSlide,
  } = useStoryFlow({ onStatusChange: setStatusMessage });

  const handlePrevSlide = useCallback(() => {
    if (generatedContent) {
      goToSlide(Math.max(0, generatedContent.currentIndex - 1));
    }
  }, [generatedContent, goToSlide]);

  const handleNextSlide = useCallback(() => {
    if (generatedContent) {
      goToSlide(Math.min(generatedContent.parts.length - 1, generatedContent.currentIndex + 1));
    }
  }, [generatedContent, goToSlide]);

  const finalImage = imageSource === "upload" ? uploadedImage : imageUrl;

  // Login Screen
  if (!isLoggedIn) {
    return (
      <LoginScreen />
    );
  }

  return (
    <div className="min-h-screen bg-[#f8f9fa] text-[#1c1e21] font-sans p-4 md:p-8 pb-20">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">

        {/* Left Column: Configuration (6 cols) */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="lg:col-span-6 space-y-6"
        >
          <header className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="bg-[#25D366] p-2 rounded-xl">
                  <Smartphone className="text-white w-6 h-6" />
                </div>
                <h1 className="text-2xl font-bold tracking-tight">StoryFlow WA</h1>
              </div>
              <p className="text-gray-500">Buat konten story memukau dengan AI & WA Backend</p>
            </div>

            <div className="flex items-center justify-end gap-3 flex-wrap">
              <button
                onClick={() => setIsSettingsOpen(true)}
                className="p-2 text-gray-400 hover:text-gray-800 transition-colors"
                title="Pengaturan Backend"
              >
                <Settings className="w-5 h-5" />
              </button>
              <button
                onClick={handleLogout}
                className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                title="Keluar"
              >
                <LogOut className="w-5 h-5" />
              </button>
              <div className={cn(
                "px-4 py-2 rounded-full text-xs font-bold flex items-center gap-2 border transition-all",
                connectionStatus === "connected" ? "bg-green-50 text-green-600 border-green-200" :
                connectionStatus === "disconnected" ? "bg-red-50 text-red-600 border-red-200" :
                "bg-gray-50 text-gray-400 border-gray-200"
              )}>
                <div className={cn(
                  "w-2 h-2 rounded-full",
                  connectionStatus === "connected" ? "bg-green-500 animate-pulse" :
                  connectionStatus === "disconnected" ? "bg-red-500" :
                  "bg-gray-300"
                )} />
                {connectionStatus === "connected" ? "Backend Terhubung" :
                 connectionStatus === "disconnected" ? "Backend Terputus" :
                 "Memeriksa Koneksi..."}
              </div>
            </div>
          </header>

          <section className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 space-y-6">
            {status && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn(
                  "p-4 rounded-xl flex items-center gap-3 text-sm font-medium mb-4",
                  status.type === "success" ? "bg-green-50 text-green-700 border border-green-100" : "bg-red-50 text-red-700 border border-red-100"
                )}
              >
                {status.type === "success" ? <CheckCircle2 className="w-5 h-5 shrink-0" /> : <AlertCircle className="w-5 h-5 shrink-0" />}
                {status.message}
              </motion.div>
            )}

            {/* Config warning */}
            {!backendConfig?.baseUrl && (
               <div className="p-4 bg-amber-50 border border-amber-100 rounded-2xl text-amber-900 text-sm font-medium flex items-start gap-3">
                 <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-amber-600" />
                 <div>
                   <p className="font-bold">Backend Belum Diatur</p>
                   <p className="text-amber-700 text-xs mt-1">Silakan klik tombol pengaturan <Settings className="inline w-3 h-3" /> di pojok kanan atas untuk memasukkan URL backend WhatsApp (Evolution API / WAHA) Anda.</p>
                 </div>
               </div>
            )}

            {isServerReady === false && (
              <div className="p-4 bg-amber-50 border border-amber-100 rounded-2xl text-amber-700 text-xs font-medium mb-4 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                Backend API tidak merespon. Jika di lokal, pastikan npm run dev berjalan. Jika di Vercel, pastikan konfigurasi API sudah benar.
              </div>
            )}

            {/* Mode Toggle */}
            <div className="flex p-1 bg-gray-100 rounded-2xl w-fit">
              <button
                onClick={() => setMode("ai")}
                className={cn(
                  "px-6 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2",
                  mode === "ai" ? "bg-white shadow-sm text-[#1c1e21]" : "text-gray-500 hover:text-gray-700"
                )}
              >
                <Sparkles className="w-4 h-4" /> Buat dengan AI
              </button>
              <button
                onClick={() => setMode("manual")}
                className={cn(
                  "px-6 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2",
                  mode === "manual" ? "bg-white shadow-sm text-[#1c1e21]" : "text-gray-500 hover:text-gray-700"
                )}
              >
                <Type className="w-4 h-4" /> Posting Manual
              </button>
            </div>

            {/* Instance Configuration */}
            {backendConfig && backendConfig.baseUrl && (
              <InstanceSelector
                instanceName={instanceName}
                onInstanceChange={setInstanceName}
                availableInstances={availableInstances}
                isLoadingInstances={isLoadingInstances}
                onRefresh={fetchInstances}
              />
            )}

            {/* AI Mode Inputs */}
            {mode === "ai" && (
              <StoryGenerator
                prompt={prompt}
                onPromptChange={setPrompt}
                persona={persona}
                onPersonaChange={setPersona}
                structure={structure}
                onStructureChange={setStructure}
                autoStyling={autoStyling}
                onAutoStylingChange={setAutoStyling}
                aestheticMode={aestheticMode}
                onAestheticModeChange={setAestheticMode}
                isGenerating={isGenerating}
                onGenerate={generateWithAI}
              />
            )}

            {/* Manual Mode Inputs */}
            {mode === "manual" && (
              <ManualPoster
                manualContent={manualContent}
                onManualContentChange={setManualContent}
                manualBgColor={manualBgColor}
                onManualBgColorChange={setManualBgColor}
                autoStyling={autoStyling}
                onAutoStylingChange={setAutoStyling}
                aestheticMode={aestheticMode}
                onAestheticModeChange={setAestheticMode}
                isEnhancing={isEnhancing}
                onEnhance={enhanceManualContent}
              />
            )}

            {/* Format Selection */}
            <div className="space-y-2">
              <label className="text-sm font-semibold">Format</label>
              <div className="flex gap-2">
                <button
                  onClick={() => setFormat("text")}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-2 p-3 rounded-xl border transition-all",
                    format === "text" ? "bg-[#25D366] text-white border-[#25D366]" : "bg-gray-50 border-gray-200 hover:border-gray-300"
                  )}
                >
                  <Type className="w-4 h-4" /> Teks
                </button>
                <button
                  onClick={() => setFormat("image")}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-2 p-3 rounded-xl border transition-all",
                    format === "image" ? "bg-[#25D366] text-white border-[#25D366]" : "bg-gray-50 border-gray-200 hover:border-gray-300"
                  )}
                >
                  <LucideImage className="w-4 h-4" /> Gambar
                </button>
              </div>
            </div>

            {format === "image" && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="space-y-4"
              >
                <div className="flex p-1 bg-gray-100 rounded-xl w-fit text-xs">
                  <button
                    onClick={() => setImageSource("ai")}
                    className={cn(
                      "px-4 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1",
                      imageSource === "ai" ? "bg-white shadow-sm text-[#1c1e21]" : "text-gray-500 hover:text-gray-700"
                    )}
                  >
                    <Sparkles className="w-3 h-3" /> AI Generated
                  </button>
                  <button
                    onClick={() => setImageSource("url")}
                    className={cn(
                      "px-4 py-1.5 rounded-lg font-bold transition-all",
                      imageSource === "url" ? "bg-white shadow-sm text-[#1c1e21]" : "text-gray-500 hover:text-gray-700"
                    )}
                  >
                    URL Gambar
                  </button>
                  <button
                    onClick={() => setImageSource("upload")}
                    className={cn(
                      "px-4 py-1.5 rounded-lg font-bold transition-all",
                      imageSource === "upload" ? "bg-white shadow-sm text-[#1c1e21]" : "text-gray-500 hover:text-gray-700"
                    )}
                  >
                    Unggah Gambar
                  </button>
                </div>

                {imageSource === "ai" ? (
                  <div className="p-4 bg-green-50 border border-green-100 rounded-2xl">
                    <div className="flex items-center gap-3">
                      <div className="bg-[#25D366]/10 p-2 rounded-lg">
                        <Sparkles className="w-5 h-5 text-[#25D366]" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-800">AI Image Generator Aktif</p>
                        <p className="text-[10px] text-gray-500 leading-relaxed mt-0.5">
                          Gambar akan otomatis dihasilkan berdasarkan deskripsi story Anda saat klik tombol "Buat dengan AI".
                        </p>
                      </div>
                    </div>
                  </div>
                ) : imageSource === "url" ? (
                  <div className="space-y-2">
                    <label className="text-sm font-semibold">URL Gambar</label>
                    <input
                      type="text"
                      value={imageUrl}
                      onChange={(e) => setImageUrl(e.target.value)}
                      placeholder="https://example.com/gambar.jpg"
                      className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-[#25D366]"
                    />
                  </div>
                ) : (
                  <div className="space-y-2">
                    <label className="text-sm font-semibold">Unggah Gambar</label>
                    <div className="relative group">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileUpload}
                        className="hidden"
                        id="image-upload"
                      />
                      <label
                        htmlFor="image-upload"
                        className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-200 rounded-2xl cursor-pointer bg-gray-50 hover:bg-gray-100 hover:border-[#25D366] transition-all group"
                      >
                        {uploadedImage ? (
                          <div className="relative w-full h-full p-2">
                            <img
                              src={uploadedImage}
                              alt="Uploaded"
                              className="w-full h-full object-contain rounded-lg"
                            />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center rounded-lg transition-opacity">
                              <RefreshCw className="text-white w-6 h-6" />
                            </div>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center justify-center pt-5 pb-6">
                            <LucideImage className="w-8 h-8 text-gray-400 mb-2" />
                            <p className="text-xs text-gray-500">Klik untuk unggah gambar</p>
                          </div>
                        )}
                      </label>
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </section>
        </motion.div>

        {/* Right Column: Preview & Action (6 cols) */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="lg:col-span-6 flex flex-col"
        >
          <div className="flex-1 bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col sticky top-8">
            <h2 className="text-lg font-bold mb-6 flex items-center gap-2">
              <Smartphone className="w-5 h-5 text-gray-400" />
              Pratinjau
            </h2>

            <StoryPreview
              generatedContent={generatedContent}
              format={format}
              imageSource={imageSource}
              imageUrl={imageUrl}
              uploadedImage={uploadedImage}
              isAutoPlaying={isAutoPlaying}
              onToggleAutoPlay={() => setIsAutoPlaying(!isAutoPlaying)}
              progress={progress}
              onSlideChange={goToSlide}
            />

            {generatedContent && generatedContent.parts.length > 0 && (
              <SlideEditor
                generatedContent={generatedContent}
                onTextChange={updateSlideText}
                onBgChange={updateSlideBg}
                onDeleteSlide={deleteSlide}
                onPrevSlide={handlePrevSlide}
                onNextSlide={handleNextSlide}
                onFocus={() => setIsAutoPlaying(false)}
              />
            )}

            {generatedContent && (
              <div className="mt-6 space-y-4">
                {generatedContent.parts.length > 1 && (
                  <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl text-blue-700 text-[10px] font-medium flex items-center gap-2">
                    <Sparkles className="w-3 h-3" />
                    Konten otomatis dipotong menjadi {generatedContent.parts.length} story agar muat di WhatsApp.
                  </div>
                )}

                <div className="flex gap-2">
                  <button
                    onClick={mode === "ai" ? generateWithAI : enhanceManualContent}
                    disabled={isGenerating || isEnhancing || (mode === "manual" && !manualContent)}
                    className="flex-1 bg-gray-100 text-gray-700 p-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-gray-200 transition-all disabled:opacity-50"
                  >
                    {isGenerating || isEnhancing ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <RefreshCw className="w-5 h-5" />
                    )}
                    {mode === "ai" ? "Buat Ulang" : "Perbaiki"}
                  </button>
                  <button
                    onClick={postToWA}
                    disabled={isPosting || (format === "image" && !finalImage) || connectionStatus !== "connected" || !backendConfig}
                    className="flex-[2] bg-[#25D366] text-white p-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-[#1ebe57] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-green-200"
                  >
                    {isPosting ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        {postingProgress ? `Posting ${postingProgress.current}/${postingProgress.total}...` : "Memproses..."}
                      </>
                    ) : (
                      <>
                        <Send className="w-5 h-5" />
                        {generatedContent.parts.length > 1 ? `Posting ${generatedContent.parts.length} Story` : "Posting ke WhatsApp"}
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </motion.div>

        {/* History & Analytics Section */}
        <AnalyticsDashboard
          analytics={getAnalytics()}
          history={history}
          onDeleteItem={deleteHistoryItem}
          onRefresh={fetchHistory}
        />
      </div>

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        initialConfig={backendConfig}
        onSave={saveBackendConfig}
      />
    </div>
  );
}
