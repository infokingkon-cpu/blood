import React, { useState } from "react";
import { useApp } from "../contexts/AppContext";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase/config";
import { ShieldCheck, Lock, Mail, Heart, Eye, EyeOff, ArrowLeft } from "lucide-react";
import { motion } from "motion/react";

export const AdminLoginPage: React.FC = () => {
  const { showToast, setView } = useApp();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setLoading(true);

    const inputEmail = email.trim();
    if (!inputEmail || !password.trim()) {
      setErrorMsg("অনুগ্রহ করে আপনার অ্যাডমিন ইমেইল এবং পাসওয়ার্ড দিন।");
      setLoading(false);
      return;
    }

    if (inputEmail !== "info.shorif0000@gmail.com" && inputEmail !== "geminiprozksi@gmail.com") {
      setErrorMsg("অ্যাক্সেস অস্বীকৃত! শুধুমাত্র অনুমোদিত প্রধান অ্যাডমিন ইমেইল ব্যবহার করতে পারবেন।");
      setLoading(false);
      return;
    }

    try {
      const authResult = await signInWithEmailAndPassword(auth, inputEmail, password);
      localStorage.setItem(`show_onboarding_${authResult.user.uid}`, "true");
      showToast("অ্যাডমিন কন্ট্রোল প্যানেলে সফলভাবে লগইন করা হয়েছে।", "success");
      setView("admin");
    } catch (err: any) {
      console.error("Admin Portal Login Error:", err);
      setErrorMsg("ভুল ইমেইল বা পাসওয়ার্ড। অনুগ্রহ করে আপনার তথ্য পুনরায় চেক করুন।");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Abstract Background Accents */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-2xl relative z-10 space-y-6"
      >
        {/* Header/Title */}
        <div className="text-center space-y-2">
          <div className="mx-auto w-14 h-14 bg-red-500/20 text-red-500 rounded-2xl flex items-center justify-center border border-red-500/30">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-black text-white tracking-tight pt-2">
            Donate Blood অ্যাডমিন সাইন-ইন
          </h2>
          <p className="text-xs text-slate-400 font-medium">
            শুধুমাত্র অনুমোদিত অ্যাডমিন এবং মডারেটরদের জন্য সংরক্ষিত
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleAdminLogin} className="space-y-4 pt-2">
          {errorMsg && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold rounded-2xl text-center"
            >
              {errorMsg}
            </motion.div>
          )}

          {/* Email input */}
          <div className="space-y-1.5">
            <label className="text-xs font-extrabold text-slate-300 block">
              অ্যাডমিন ইমেইল এড্রেস
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500">
                <Mail className="w-4 h-4" />
              </span>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="যেমন: info.shorif0000@gmail.com"
                className="w-full pl-10 pr-4 py-3 bg-slate-950 border border-slate-800 text-white rounded-2xl text-xs font-semibold focus:outline-none focus:border-red-500 transition-colors placeholder:text-slate-600"
              />
            </div>
          </div>

          {/* Password input */}
          <div className="space-y-1.5">
            <label className="text-xs font-extrabold text-slate-300 block">
              গোপন পাসওয়ার্ড
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500">
                <Lock className="w-4 h-4" />
              </span>
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="আপনার পাসওয়ার্ড দিন"
                className="w-full pl-10 pr-10 py-3 bg-slate-950 border border-slate-800 text-white rounded-2xl text-xs font-semibold focus:outline-none focus:border-red-500 transition-colors placeholder:text-slate-600"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-white transition-colors cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-red-500 hover:bg-red-600 text-white font-extrabold text-xs rounded-2xl cursor-pointer shadow-lg shadow-red-500/20 hover:shadow-red-500/35 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              "অ্যাডমিন হিসেবে প্রবেশ করুন"
            )}
          </button>
        </form>

        {/* Back option */}
        <div className="border-t border-slate-800 pt-4 flex justify-between items-center text-[11px] font-bold">
          <button
            type="button"
            onClick={() => setView("home")}
            className="text-slate-400 hover:text-white transition-colors flex items-center gap-1 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> হোমপেজে ফিরুন
          </button>
          <span className="text-slate-600">Donate Blood © ২০২৬</span>
        </div>
      </motion.div>
    </div>
  );
};
