import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Save, Server, Key, Link2, Sparkles, RefreshCw } from "lucide-react";

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

  const [aiProvider, setAiProvider] = useState(initialConfig?.aiProvider || "gemini");
  const [aiModel, setAiModel] = useState(initialConfig?.aiModel || "");
  const [aiEndpoint, setAiEndpoint] = useState(initialConfig?.aiEndpoint || "");
  const [aiApiKey, setAiApiKey] = useState(initialConfig?.aiApiKey || "");

  const [availableModels, setAvailableModels] = useState<{id: string, name: string}[]>([]);
  const [isLoadingModels, setIsLoadingModels] = useState(false);
  const [fetchError, setFetchError] = useState("");

  useEffect(() => {
    if (initialConfig) {
      setBackendType(initialConfig.backendType || "evolution");
      setBaseUrl(initialConfig.baseUrl || "");
      setApiKey(initialConfig.apiKey || "");
      setInstanceName(initialConfig.instanceName || "");
      setAiProvider(initialConfig.aiProvider || "gemini");
      setAiModel(initialConfig.aiModel || "");
      setAiEndpoint(initialConfig.aiEndpoint || "");
      setAiApiKey(initialConfig.aiApiKey || "");
    }
  }, [initialConfig, isOpen]);

  if (!isOpen) return null;

  const handleSave = () => {
    onSave({ backendType, baseUrl, apiKey, instanceName, aiProvider, aiModel, aiEndpoint, aiApiKey });
    onClose();
  };

  const handleProviderChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newProvider = e.target.value;
    setAiProvider(newProvider);
    setAvailableModels([]);
    if (newProvider === 'openai') {
      if (!aiEndpoint || aiEndpoint === 'https://api.anthropic.com/v1') {
        setAiEndpoint('https://api.openai.com/v1');
      }
    } else if (newProvider === 'claude') {
      if (!aiEndpoint || aiEndpoint === 'https://api.openai.com/v1') {
        setAiEndpoint('https://api.anthropic.com/v1');
      }
    } else {
      setAiEndpoint('');
    }
  };

  const fetchModels = async () => {
    if (!aiApiKey) {
      setFetchError("Silakan isi API Key terlebih dahulu");
      return;
    }
    setFetchError("");
    setIsLoadingModels(true);
    try {
      if (aiProvider === 'openai') {
        const url = (aiEndpoint || "https://api.openai.com/v1").replace(/\/$/, '') + '/models';
        const res = await fetch(url, {
          headers: {
            "Authorization": `Bearer ${aiApiKey}`
          }
        });
        if (!res.ok) throw new Error("Gagal mengambil model");
        const data = await res.json();
        if (data.data) {
          setAvailableModels(data.data.map((m: any) => ({ id: m.id, name: m.id })));
        }
      } else if (aiProvider === 'claude') {
        const url = (aiEndpoint || "https://api.anthropic.com/v1").replace(/\/$/, '') + '/models';
        const res = await fetch(url, {
          headers: {
            "x-api-key": aiApiKey,
            "anthropic-version": "2023-06-01",
            "anthropic-dangerous-direct-browser-access": "true"
          }
        });
        if (!res.ok) throw new Error("Gagal mengambil model");
        const data = await res.json();
        if (data.data) {
          setAvailableModels(data.data.map((m: any) => ({ id: m.id, name: m.display_name || m.name || m.id })));
        }
      }
    } catch (err: any) {
      setFetchError(err.message || "Terjadi kesalahan");
    } finally {
      setIsLoadingModels(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white rounded-3xl p-5 w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <Server className="w-4 h-4 text-gray-400" />
              Pengaturan Sistem
            </h2>
            <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-4">
            {/* WhatsApp Config */}
            <div className="space-y-3">
              <h3 className="font-bold text-gray-700 flex items-center gap-2 mb-1 border-b pb-1 text-sm">
                <i className="lab la-whatsapp text-lg text-green-500"></i> WhatsApp API
              </h3>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-600">Tipe Backend WhatsApp</label>
                <select
                  value={backendType}
                  onChange={(e) => setBackendType(e.target.value)}
                  className="w-full p-2 text-sm bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-[#25D366]"
                >
                  <option value="evolution">Evolution API</option>
                  <option value="waha">WAHA (WhatsApp HTTP API)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-600">Base URL</label>
                <div className="relative">
                  <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                  <input
                    type="text"
                    value={baseUrl}
                    onChange={(e) => setBaseUrl(e.target.value)}
                    placeholder="https://api.example.com"
                    className="w-full pl-9 p-2 text-sm bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-[#25D366]"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-600">Global API Key</label>
                <div className="relative">
                  <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                  <input
                    type="password"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                    className="w-full pl-9 p-2 text-sm bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-[#25D366]"
                  />
                </div>
              </div>
            </div>

            {/* AI Config */}
            <div className="space-y-3 pt-2">
              <h3 className="font-bold text-gray-700 flex items-center gap-2 mb-1 border-b pb-1 text-sm">
                <Sparkles className="w-4 h-4 text-indigo-500" /> AI API (LLM)
              </h3>
              
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-600">Provider AI</label>
                <select
                  value={aiProvider}
                  onChange={handleProviderChange}
                  className="w-full p-2 text-sm bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="gemini">Google Gemini (Default)</option>
                  <option value="openai">OpenAI (ChatGPT)</option>
                  <option value="claude">Anthropic Claude</option>
                </select>
              </div>

              {aiProvider !== 'gemini' ? (
                <>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-gray-600">API Endpoint (Opsional)</label>
                    <div className="relative">
                      <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                      <input
                        type="text"
                        value={aiEndpoint}
                        onChange={(e) => setAiEndpoint(e.target.value)}
                        placeholder="https://api.openai.com/v1"
                        className="w-full pl-9 p-2 text-sm bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-gray-600">API Key AI</label>
                    <div className="relative">
                      <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                      <input
                        type="password"
                        value={aiApiKey}
                        onChange={(e) => setAiApiKey(e.target.value)}
                        placeholder="sk-xxxxxxxxxxxxxxxx"
                        className="w-full pl-9 p-2 text-sm bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-gray-600 flex items-center justify-between">
                      Nama Model
                      <button 
                        onClick={fetchModels}
                        disabled={isLoadingModels}
                        className="text-[10px] text-indigo-500 flex items-center gap-1 hover:text-indigo-700 disabled:opacity-50"
                      >
                         <RefreshCw className={`w-3 h-3 ${isLoadingModels ? 'animate-spin' : ''}`} /> Refresh Model
                      </button>
                    </label>
                    
                    {fetchError && <p className="text-[10px] text-red-500">{fetchError}</p>}
                    
                    {availableModels.length > 0 ? (
                      <select
                        value={aiModel}
                        onChange={(e) => setAiModel(e.target.value)}
                        className="w-full p-2 text-sm bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
                      >
                        <option value="">-- Pilih Model --</option>
                        {availableModels.map(m => (
                          <option key={m.id} value={m.id}>{m.name}</option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type="text"
                        value={aiModel}
                        onChange={(e) => setAiModel(e.target.value)}
                        placeholder={aiProvider === 'openai' ? "gpt-4o" : aiProvider === 'claude' ? "claude-3-5-sonnet-20240620" : "Default model akan digunakan jika kosong"}
                        className="w-full p-2 text-sm bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    )}
                  </div>
                </>
              ) : (
                 <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-600">Nama Model (Opsional)</label>
                  <input
                    type="text"
                    value={aiModel}
                    onChange={(e) => setAiModel(e.target.value)}
                    placeholder="gemini-2.5-pro"
                    className="w-full p-2 text-sm bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              )}
            </div>

            <button
              onClick={handleSave}
              className="w-full bg-[#1c1e21] text-white p-3 rounded-xl font-bold hover:bg-black transition-all flex items-center justify-center gap-2 mt-2 text-sm"
            >
              <Save className="w-4 h-4" /> Simpan Pengaturan
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
