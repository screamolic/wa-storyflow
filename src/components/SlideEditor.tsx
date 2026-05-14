import { motion } from "motion/react";
import { CheckCircle2, Type, Trash2 } from "lucide-react";
import { cn } from "@/src/lib/utils";
import type { GeneratedContent } from "@/src/types";
import { BG_COLORS } from "@/src/constants";

interface SlideEditorProps {
  generatedContent: GeneratedContent;
  onTextChange: (text: string) => void;
  onBgChange: (bg: string) => void;
  onDeleteSlide: () => void;
  onPrevSlide: () => void;
  onNextSlide: () => void;
  onFocus: () => void;
}

export default function SlideEditor({
  generatedContent,
  onTextChange,
  onBgChange,
  onDeleteSlide,
  onPrevSlide,
  onNextSlide,
  onFocus,
}: SlideEditorProps) {
  const currentPart = generatedContent.parts[generatedContent.currentIndex];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-6 p-4 bg-gray-50 rounded-2xl border border-gray-100 space-y-4"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
          <Type className="w-3 h-3" />
          Edit Slide {generatedContent.currentIndex + 1}
        </h3>
        <div className="flex flex-wrap items-center gap-3 sm:justify-end">
          <div className="flex items-center gap-2">
            <button
              onClick={onDeleteSlide}
              disabled={generatedContent.parts.length <= 1}
              className="text-gray-400 hover:text-red-500 disabled:opacity-30 disabled:hover:text-gray-400 transition-colors"
              title="Hapus Slide"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <span className="text-[10px] text-green-500 font-bold flex items-center gap-1 whitespace-nowrap">
              <CheckCircle2 className="w-3 h-3" />
              Tersimpan
            </span>
          </div>
          <div className="flex flex-wrap gap-1 max-w-[150px] sm:max-w-none">
            {BG_COLORS.map((color) => (
              <button
                key={color}
                onClick={() => onBgChange(color)}
                className={cn(
                  "w-4 h-4 rounded-full border border-white shadow-sm transition-transform hover:scale-125",
                  currentPart.backgroundColor === color && "ring-2 ring-[#25D366] ring-offset-1"
                )}
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
        </div>
      </div>

      <textarea
        value={currentPart.text}
        onFocus={onFocus}
        onChange={(e) => onTextChange(e.target.value)}
        placeholder="Edit teks story..."
        className="w-full p-3 bg-white border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#25D366] min-h-[100px] resize-none font-medium"
      />

      <div className="flex items-center justify-between">
        <span
          className={cn(
            "text-[10px] font-bold",
            currentPart.text.length > 700 ? "text-red-500" : "text-gray-400"
          )}
        >
          {currentPart.text.length} / 700 karakter
        </span>
        <div className="flex gap-2">
          <button
            onClick={onPrevSlide}
            disabled={generatedContent.currentIndex === 0}
            className="text-[10px] font-bold text-[#25D366] disabled:opacity-30"
          >
            SEBELUMNYA
          </button>
          <button
            onClick={onNextSlide}
            disabled={
              generatedContent.parts.length <= 1 ||
              generatedContent.currentIndex === generatedContent.parts.length - 1
            }
            className="text-[10px] font-bold text-[#25D366] disabled:opacity-30"
          >
            BERIKUTNYA
          </button>
        </div>
      </div>
    </motion.div>
  );
}
