import { FormEvent } from "react";
import { motion } from "motion/react";
import { Lock } from "lucide-react";

interface LoginScreenProps {
  appPassword: string;
  onPasswordChange: (value: string) => void;
  loginError: string;
  onLogin: (e: FormEvent) => void;
}

export default function LoginScreen({
  appPassword,
  onPasswordChange,
  loginError,
  onLogin,
}: LoginScreenProps) {
  return (
    <div className="min-h-screen bg-[#f8f9fa] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white p-8 rounded-[2.5rem] shadow-xl border border-gray-100 text-center"
      >
        <div className="bg-[#25D366] w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-green-100">
          <Lock className="text-white w-8 h-8" />
        </div>
        <h1 className="text-2xl font-bold mb-2">Akses Terbatas</h1>
        <p className="text-gray-500 mb-8 text-sm">
          Masukkan password aplikasi untuk melanjutkan ke StoryFlow WA.
        </p>

        <form onSubmit={onLogin} className="space-y-4">
          <input
            type="password"
            value={appPassword}
            onChange={(e) => onPasswordChange(e.target.value)}
            placeholder="Password Aplikasi"
            className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-[#25D366] outline-none transition-all text-center font-bold tracking-widest"
            autoFocus
          />
          {loginError && <p className="text-red-500 text-xs font-medium">{loginError}</p>}
          <button
            type="submit"
            className="w-full bg-[#1c1e21] text-white p-4 rounded-2xl font-bold hover:bg-black transition-all shadow-lg"
          >
            Masuk Sekarang
          </button>
        </form>
        <p className="mt-8 text-[10px] text-gray-400 uppercase tracking-widest font-bold">
          StoryFlow WA &copy; 2026
        </p>
      </motion.div>
    </div>
  );
}
