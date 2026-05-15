import { motion } from "motion/react";
import {
  BarChart3,
  History,
  Type,
  Image as LucideImage,
  Clock,
  Smartphone,
  Trash2,
  RefreshCw,
} from "lucide-react";
import { cn } from "@/src/lib/utils";
import type { HistoryEntry, AnalyticsData } from "@/src/types";

interface AnalyticsDashboardProps {
  analytics: AnalyticsData;
  history: HistoryEntry[];
  onDeleteItem: (id: string | number) => void;
  onRefresh: () => void;
}

export default function AnalyticsDashboard({
  analytics,
  history,
  onDeleteItem,
  onRefresh,
}: AnalyticsDashboardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="lg:col-span-12 grid grid-cols-1 lg:grid-cols-12 gap-8 mt-8"
    >
      {/* Analytics Cards */}
      <div className="lg:col-span-4 space-y-4">
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-[#25D366]" />
            Statistik Story
          </h3>

          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
              <div className="text-[10px] font-black uppercase text-gray-400 mb-1">Total Post</div>
              <div className="text-2xl font-black text-gray-900">{analytics.total}</div>
            </div>
            <div className="p-4 bg-green-50 rounded-2xl border border-green-100">
              <div className="text-[10px] font-black uppercase text-green-600 mb-1">Berhasil</div>
              <div className="text-2xl font-black text-green-700">{analytics.success}</div>
            </div>
            <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100">
              <div className="text-[10px] font-black uppercase text-blue-600 mb-1">Teks</div>
              <div className="text-2xl font-black text-blue-700">{analytics.textCount}</div>
            </div>
            <div className="p-4 bg-purple-50 rounded-2xl border border-purple-100">
              <div className="text-[10px] font-black uppercase text-purple-600 mb-1">Gambar</div>
              <div className="text-2xl font-black text-purple-700">{analytics.imageCount}</div>
            </div>
          </div>

          {analytics.failed > 0 && (
            <div className="mt-4 p-4 bg-red-50 rounded-2xl border border-red-100 flex items-center justify-between">
              <span className="text-xs font-bold text-red-600 uppercase">Gagal</span>
              <span className="text-xl font-black text-red-700">{analytics.failed}</span>
            </div>
          )}
        </div>
      </div>

      {/* History List */}
      <div className="lg:col-span-8">
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 h-full">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold flex items-center gap-2">
              <History className="w-5 h-5 text-gray-400" />
              Riwayat Aktivitas
            </h3>
            <button
              onClick={onRefresh}
              className="text-[10px] font-bold text-[#25D366] uppercase tracking-widest hover:underline"
            >
              Refresh
            </button>
          </div>

          <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
            {history.length === 0 ? (
              <div className="text-center py-12 text-gray-400 italic text-sm">
                Belum ada riwayat posting.
              </div>
            ) : (
              history.map((item) => (
                <div
                  key={item.id}
                  className="group p-4 bg-gray-50 rounded-2xl border border-gray-100 hover:border-[#25D366]/30 transition-all flex items-center gap-4"
                >
                  <div
                    className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
                      item.type === "text"
                        ? "bg-blue-100 text-blue-600"
                        : "bg-purple-100 text-purple-600"
                    )}
                  >
                    {item.type === "text" ? (
                      <Type className="w-5 h-5" />
                    ) : (
                      <LucideImage className="w-5 h-5" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className={cn(
                          "text-[8px] font-black uppercase px-2 py-0.5 rounded-full",
                          item.status === "SUCCESS"
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"
                        )}
                      >
                        {item.status}
                      </span>
                      <span className="text-[10px] text-gray-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(item.timestamp).toLocaleString("id-ID", {
                          hour: "2-digit",
                          minute: "2-digit",
                          day: "2-digit",
                          month: "short",
                        })}
                      </span>
                    </div>
                    <div className="text-sm font-bold text-gray-900 truncate pr-4">
                      {item.preview}
                    </div>
                    <div className="text-[10px] text-gray-400 flex items-center gap-1">
                      <Smartphone className="w-3 h-3" />
                      {item.instance}
                    </div>
                    {item.status === "FAILED" && item.error && (
                      <div className="mt-2 text-[10px] text-red-600 bg-red-50 p-2 rounded-lg break-all hidden group-hover:block transition-all">
                        <span className="font-bold block mb-0.5">Detail Error:</span>
                        {item.error}
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => onDeleteItem(item.id)}
                    className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                    title="Hapus dari riwayat"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
