import { Settings, RefreshCw, Loader2, CheckCircle2, Phone, User } from "lucide-react";
import type { EvolutionInstance } from "@/src/api/types";

interface InstanceSelectorProps {
  instanceName: string;
  onInstanceChange: (value: string) => void;
  availableInstances: EvolutionInstance[];
  isLoadingInstances: boolean;
  onRefresh: () => void;
}

/**
 * Format phone number for display (e.g. 6281234567890 → +62 812-3456-7890)
 */
function formatPhone(raw: string): string {
  const cleaned = raw.replace(/\D/g, "");
  if (cleaned.startsWith("62")) {
    const rest = cleaned.slice(2);
    return `+62 ${rest.slice(0, 3)}-${rest.slice(3, 7)}-${rest.slice(7)}`;
  }
  return `+${cleaned.slice(0, 2)} ${cleaned.slice(2, 6)}-${cleaned.slice(6, 10)}`;
}

export default function InstanceSelector({
  instanceName,
  onInstanceChange,
  availableInstances,
  isLoadingInstances,
  onRefresh,
}: InstanceSelectorProps) {
  const isConnected = (inst: EvolutionInstance) =>
    inst.connectionStatus === "CONNECTED" || inst.connectionStatus === "open";

  return (
    <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-sm font-bold flex items-center gap-2">
          <Settings className="w-4 h-4 text-gray-400" />
          Instance Target
        </label>
        <button
          onClick={onRefresh}
          disabled={isLoadingInstances}
          className="text-[10px] text-[#25D366] uppercase tracking-widest font-bold hover:underline flex items-center gap-1"
        >
          {isLoadingInstances ? (
            <Loader2 className="w-3 h-3 animate-spin" />
          ) : (
            <RefreshCw className="w-3 h-3" />
          )}
          Perbarui
        </button>
      </div>

      {availableInstances.length > 0 ? (
        <div className="space-y-2">
          {/* Instance cards */}
          <div className="max-h-64 overflow-y-auto space-y-2 pr-1">
            {availableInstances.map((inst) => {
              const connected = isConnected(inst);
              const isSelected = inst.instanceName === instanceName;
              return (
                <button
                  key={inst.instanceName}
                  onClick={() => onInstanceChange(inst.instanceName)}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all text-left ${
                    isSelected
                      ? "border-[#25D366] bg-green-50 shadow-sm"
                      : "border-gray-200 bg-white hover:border-gray-300"
                  }`}
                >
                  {/* Profile picture */}
                  <div className="relative shrink-0">
                    {inst.profilePictureUrl ? (
                      <img
                        src={inst.profilePictureUrl}
                        alt={inst.instanceName}
                        className="w-10 h-10 rounded-full object-cover bg-gray-100"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = "none";
                          (e.target as HTMLImageElement).nextElementSibling?.classList.remove("hidden");
                        }}
                      />
                    ) : null}
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center bg-[#25D366] ${
                        inst.profilePictureUrl ? "hidden" : ""
                      }`}
                    >
                      <User className="w-5 h-5 text-white" />
                    </div>
                    {/* Connection indicator */}
                    <div
                      className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white ${
                        connected ? "bg-green-500" : "bg-red-400"
                      }`}
                    />
                  </div>

                  {/* Instance info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-gray-900 truncate">
                        {inst.profileName || inst.instanceName}
                      </span>
                      {connected && (
                        <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
                      )}
                    </div>
                    {inst.phoneNumber && (
                      <div className="flex items-center gap-1 mt-0.5">
                        <Phone className="w-3 h-3 text-gray-400" />
                        <span className="text-xs text-gray-500">{formatPhone(inst.phoneNumber)}</span>
                      </div>
                    )}
                    {!inst.phoneNumber && inst.ownerJid && (
                      <div className="text-xs text-gray-400 truncate">{inst.ownerJid}</div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
          <p className="text-[10px] text-gray-400 px-1">
            {availableInstances.length} instance terdeteksi.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          <input
            type="text"
            value={instanceName}
            onChange={(e) => onInstanceChange(e.target.value)}
            placeholder="Nama Instance (masukkan manual)"
            className="w-full p-3 bg-white border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-[#25D366] text-sm"
          />
          <p className="text-[10px] text-amber-600 px-1 font-medium">
            Tidak ada instance terdeteksi. Masukkan manual atau cek koneksi API.
          </p>
        </div>
      )}
    </div>
  );
}
