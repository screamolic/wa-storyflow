import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Save, Server, Key, Link2 } from "lucide-react";

export default function SettingsModal({
  isOpen,
  onClose,
  initialConfig,
  onSave
}: {
  isOpen: boolean;
  onClose: () => void;
  initialConfig: any;
  onSave: (config: any) => void;
}) {
  const [backendType, setBackendType] = useState(initialConfig?.backendType || "evolution");
  const [baseUrl, setBaseUrl] = useState(initialConfig?.baseUrl || "");
  const [apiKey, setApiKey] = useState(initialConfig?.apiKey || "");
  const [instanceName, setInstanceName] = useState(initialConfig?.instanceName || "");

  useEffect(() => {
    if (initialConfig) {
      setBackendType(initialConfig.backendType || "evolution");
      setBaseUrl(initialConfig.baseUrl || "");
      setApiKey(initialConfig.apiKey || "");
      setInstanceName(initialConfig.instanceName || "");
    }
  }, [initialConfig]);

  if (!isOpen) return null;

  const handleSave = () => {
    onSave({ backendType, baseUrl, apiKey, instanceName });
    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Server className="w-5 h-5 text-gray-400" />
              Pengaturan Backend
            </h2>
            <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold">Tipe Backend WhatsApp</label>
              <select
                value={backendType}
                onChange={(e) => setBackendType(e.target.value)}
                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-[#25D366]"
              >
                <option value="evolution">Evolution API</option>
                <option value="waha">WAHA (WhatsApp HTTP API)</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold">Base URL</label>
              <div className="relative">
                <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={baseUrl}
                  onChange={(e) => setBaseUrl(e.target.value)}
                  placeholder="https://api.example.com"
                  className="w-full pl-10 p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-[#25D366]"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold">Global API Key</label>
              <div className="relative">
                <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                  className="w-full pl-10 p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-[#25D366]"
                />
              </div>
            </div>

            <button
              onClick={handleSave}
              className="w-full bg-[#1c1e21] text-white p-4 rounded-xl font-bold hover:bg-black transition-all flex items-center justify-center gap-2 mt-4"
            >
              <Save className="w-5 h-5" /> Simpan Pengaturan
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
