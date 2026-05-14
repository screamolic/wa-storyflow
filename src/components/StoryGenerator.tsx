import { motion } from "motion/react";
import { Sparkles, User, Layout, Loader2, List, Languages } from "lucide-react";
import { cn } from "@/src/lib/utils";
import type { Persona, Structure } from "@/src/types";
import {
  PERSONAS_GROUPED,
  STRUCTURES_GROUPED,
  PERSONA_TO_STRUCTURE_CATEGORIES,
} from "@/src/constants";

interface StoryGeneratorProps {
  prompt: string;
  onPromptChange: (value: string) => void;
  persona: Persona;
  onPersonaChange: (value: Persona) => void;
  structure: Structure;
  onStructureChange: (value: Structure) => void;
  autoStyling: boolean;
  onAutoStylingChange: (value: boolean) => void;
  aestheticMode: boolean;
  onAestheticModeChange: (value: boolean) => void;
  isGenerating: boolean;
  onGenerate: () => void;
}

export default function StoryGenerator({
  prompt,
  onPromptChange,
  persona,
  onPersonaChange,
  structure,
  onStructureChange,
  autoStyling,
  onAutoStylingChange,
  aestheticMode,
  onAestheticModeChange,
  isGenerating,
  onGenerate,
}: StoryGeneratorProps) {
  // Find persona category
  const personaCategory = Object.entries(PERSONAS_GROUPED).find(([_, items]) =>
    Object.keys(items).includes(persona)
  )?.[0];

  const allowedCategories = personaCategory
    ? PERSONA_TO_STRUCTURE_CATEGORIES[personaCategory]
    : [];

  const filteredStructures = Object.entries(STRUCTURES_GROUPED).filter(([category]) =>
    allowedCategories.includes(category)
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="space-y-2">
        <label className="text-sm font-semibold flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-[#25D366]" />
          Tentang apa story ini?
        </label>
        <textarea
          value={prompt}
          onChange={(e) => onPromptChange(e.target.value)}
          placeholder="contoh: Kasih tips rahasia jualan online yang jarang orang tahu, dong!"
          className="w-full h-32 p-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-[#25D366] focus:border-transparent transition-all resize-none outline-none"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-semibold flex items-center gap-2">
            <User className="w-4 h-4 text-gray-400" />
            Persona (Gaya Bahasa)
          </label>
          <select
            value={persona}
            onChange={(e) => onPersonaChange(e.target.value as Persona)}
            className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-[#25D366]"
          >
            {Object.entries(PERSONAS_GROUPED).map(([category, items]) => (
              <optgroup key={category} label={category}>
                {Object.keys(items).map((key) => (
                  <option key={key} value={key}>
                    {key}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-semibold flex items-center gap-2">
            <Layout className="w-4 h-4 text-gray-400" />
            Struktur & Angle
          </label>
          <select
            value={structure}
            onChange={(e) => onStructureChange(e.target.value as Structure)}
            className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-[#25D366]"
          >
            {filteredStructures.map(([category, items]) => (
              <optgroup key={category} label={category}>
                {Object.keys(items).map((key) => (
                  <option key={key} value={key}>
                    {key}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>
      </div>

      {/* Output Enhancements */}
      <div className="space-y-3 p-4 bg-gray-50 rounded-2xl border border-gray-100">
        <p className="text-sm font-semibold text-gray-600 mb-2">Opsi Output & Enhancements</p>
        <div className="flex flex-wrap gap-4">
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
              Auto Formatting WhatsApp (*Bold*, _Italic_)
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
              Estetik Mode ✨ (Spasi elegan & Emojis)
            </span>
          </label>
        </div>
      </div>

      <button
        onClick={onGenerate}
        disabled={isGenerating || !prompt}
        className="w-full bg-[#1c1e21] text-white p-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-black transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isGenerating ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : (
          <Sparkles className="w-5 h-5" />
        )}
        Buat dengan AI
      </button>
    </motion.div>
  );
}
