import { AnimatePresence, motion } from "motion/react";
import {
  User,
  Smartphone,
  RefreshCw,
  Sparkles,
  CheckCircle2,
} from "lucide-react";
import { cn } from "@/src/lib/utils";
import type { GeneratedContent, Format } from "@/src/types";

interface StoryPreviewProps {
  generatedContent: GeneratedContent | null;
  format: Format;
  imageSource: "url" | "upload" | "ai";
  imageUrl: string;
  uploadedImage: string | null;
  isAutoPlaying: boolean;
  onToggleAutoPlay: () => void;
  progress: number;
  onSlideChange: (index: number) => void;
}

export default function StoryPreview({
  generatedContent,
  format,
  imageSource,
  imageUrl,
  uploadedImage,
  isAutoPlaying,
  onToggleAutoPlay,
  progress,
  onSlideChange,
}: StoryPreviewProps) {
  const finalImage = imageSource === "upload" ? uploadedImage : imageUrl;

  return (
    <div className="flex-1 flex flex-col items-center justify-center bg-gray-100 rounded-2xl p-4 min-h-[400px] relative">
      <AnimatePresence mode="wait">
        {generatedContent && generatedContent.parts.length > 0 ? (
          <motion.div
            key={`preview-${generatedContent.currentIndex}`}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="w-full max-w-[320px] aspect-[9/19] bg-black rounded-[2.5rem] border-[6px] border-gray-900 shadow-2xl overflow-hidden relative flex flex-col group"
          >
            {/* Navigation Tap Areas */}
            <div className="absolute inset-0 z-40 flex">
              <div
                className="w-1/3 h-full cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation();
                  onSlideChange(Math.max(0, generatedContent.currentIndex - 1));
                }}
              />
              <div
                className="w-2/3 h-full cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation();
                  const nextIndex =
                    (generatedContent.currentIndex + 1) % generatedContent.parts.length;
                  onSlideChange(nextIndex);
                }}
              />
            </div>

            {/* Story Progress Bars */}
            <div className="absolute top-4 left-4 right-4 flex gap-1 z-50">
              {generatedContent.parts.map((_, idx) => (
                <div
                  key={idx}
                  className="h-0.5 flex-1 bg-white/30 rounded-full overflow-hidden"
                >
                  <motion.div
                    className="h-full bg-white"
                    initial={{ width: 0 }}
                    animate={{
                      width:
                        idx < generatedContent.currentIndex
                          ? "100%"
                          : idx === generatedContent.currentIndex
                            ? `${progress}%`
                            : "0%",
                    }}
                    transition={{ ease: "linear", duration: idx === generatedContent.currentIndex ? 0.05 : 0.2 }}
                  />
                </div>
              ))}
            </div>

            {/* Mock Header */}
            <div className="absolute top-8 left-4 right-4 flex items-center justify-between z-50">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-gray-600 border border-white/20 flex items-center justify-center overflow-hidden">
                  <User className="w-5 h-5 text-gray-400" />
                </div>
                <div className="flex flex-col">
                  <span className="text-white text-[10px] font-bold leading-none">Anda</span>
                  <span className="text-white/60 text-[8px]">Baru saja</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleAutoPlay();
                  }}
                  className="p-1 hover:bg-white/10 rounded-full transition-colors"
                >
                  {isAutoPlaying ? (
                    <RefreshCw className="w-3 h-3 text-white animate-spin-slow" />
                  ) : (
                    <Sparkles className="w-3 h-3 text-white" />
                  )}
                </button>
              </div>
            </div>

            {format === "text" ? (
              <div
                className={cn(
                  "flex-1 flex items-center justify-center p-5 text-center text-white font-medium leading-tight overflow-hidden",
                  generatedContent.parts[generatedContent.currentIndex].text.length > 300
                    ? "text-sm"
                    : "text-lg"
                )}
                style={{
                  backgroundColor:
                    generatedContent.parts[generatedContent.currentIndex].backgroundColor,
                  fontFamily: "'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
                }}
              >
                <div className="max-h-full whitespace-pre-wrap break-words overflow-hidden">
                  {generatedContent.parts[generatedContent.currentIndex].text}
                </div>
              </div>
            ) : (
              <>
                <div className="flex-1 bg-gray-900 overflow-hidden flex items-center justify-center">
                  {finalImage ? (
                    <img
                      src={finalImage}
                      alt="Preview"
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-500 italic text-sm">
                      Gambar belum tersedia
                    </div>
                  )}
                </div>
                <div className="absolute bottom-0 left-0 right-0 p-4 pt-10 bg-gradient-to-t from-black/90 via-black/40 to-transparent text-white text-xs max-h-[40%] overflow-hidden z-20">
                  <div className="whitespace-pre-wrap break-words overflow-hidden">
                    {generatedContent.parts[generatedContent.currentIndex].text}
                  </div>
                </div>
              </>
            )}

            {/* Navigation Hints (Visible on Hover) */}
            <div className="absolute inset-0 flex z-10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
              <div className="flex-1 bg-gradient-to-r from-black/20 to-transparent" />
              <div className="flex-1 bg-gradient-to-l from-black/20 to-transparent" />
            </div>
          </motion.div>
        ) : (
          <div className="text-center space-y-2 text-gray-400">
            <Smartphone className="w-12 h-12 mx-auto opacity-20" />
            <p>Buat konten untuk melihat pratinjau</p>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
