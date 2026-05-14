import { motion } from "motion/react";
import { Type, Sparkles, Loader2, Palette } from "lucide-react";
import { cn } from "@/src/lib/utils";
import { BG_COLORS } from "@/src/constants";

interface ManualPosterProps {
  manualContent: string;
  onManualContentChange: (value: string) => void;
  manualBgColor: string;
  onManualBgColorChange: (value: string) => void;
  autoStyling: boolean;
  onAutoStylingChange: (value: boolean) => void;
  aestheticMode: boolean;
  onAestheticModeChange: (value: boolean) => void;
  isEnhancing: boolean;
  onEnhance: () => void;
}

export default function ManualPoster({
  manualContent,
  onManualContentChange,
  manualBgColor,
  onManualBgColorChange,
  autoStyling,
  onAutoStylingChange,
  aestheticMode,
  onAestheticModeChange,
  isEnhancing,
  onEnhance,
}: ManualPosterProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="space-y-2">
        <label className="text-sm font-semibold flex items-center gap-2">
          <Type className="w-4 h-4 text-[#25D366]" />
          Konten Story
        </label>
        <textarea
          value={manualContent}
          onChange={(e) => onManualContentChange(e.target.value)}
          placeholder="Tulis konten story Anda di sini..."
          className="w-full h-40 p-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-[#25D366] focus:border-transparent transition-all resize-none outline-none"
        />

        <div className="flex flex-wrap gap-2">
          <button
            onClick={onEnhance}
            disabled={isEnhancing || !manualContent}
            className="flex-1 flex items-center justify-center gap-2 p-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold transition-all disabled:opacity-50"
          >
            {isEnhancing ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <Sparkles className="w-3 h-3 text-[#25D366]" />
            )}
            Percantik Konten (AI)
          </button>
        </div>
      </div>

      {/* AI Enhancements for Manual Mode */}
      <div className="flex flex-wrap gap-4 p-4 bg-gray-50 rounded-2xl border border-gray-100">
        <label className="flex items-center gap-2 cursor-pointer group">
          <div className="relative">
            <input
              type="checkbox"
              checked={autoStyling}
              onChange={(e) => onAutoStylingChange(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-10 h-5 bg-gray-200 rounded-full peer peer-checked:bg-[#25D366] transition-all" />
            <div className="absolute left-1 top-1 w-3 h-3 bg-white rounded-full peer-checked:translate-x-5 transition-all" />
          </div>
          <span className="text-xs font-bold text-gray-600 group-hover:text-gray-900 transition-colors">
            Auto Styling
          </span>
        </label>

        <label className="flex items-center gap-2 cursor-pointer group">
          <div className="relative">
            <input
              type="checkbox"
              checked={aestheticMode}
              onChange={(e) => onAestheticModeChange(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-10 h-5 bg-gray-200 rounded-full peer peer-checked:bg-[#25D366] transition-all" />
            <div className="absolute left-1 top-1 w-3 h-3 bg-white rounded-full peer-checked:translate-x-5 transition-all" />
          </div>
          <span className="text-xs font-bold text-gray-600 group-hover:text-gray-900 transition-colors">
            Estetik Mode ✨
          </span>
        </label>
      </div>

      <div className="space-y-3">
        <label className="text-sm font-semibold flex items-center gap-2">
          <Palette className="w-4 h-4 text-gray-400" />
          Warna Latar
        </label>
        <div className="flex flex-wrap gap-2 sm:gap-3">
          {BG_COLORS.map((color) => (
            <button
              key={color}
              onClick={() => onManualBgColorChange(color)}
              className={cn(
                "w-7 h-7 sm:w-8 sm:h-8 rounded-full border-2 transition-all shadow-sm",
                manualBgColor === color ? "border-black scale-110 ring-2 ring-white" : "border-transparent hover:scale-110"
              )}
              style={{ backgroundColor: color }}
            />
          ))}
        </div>
      </div>
    </motion.div>
  );
}
