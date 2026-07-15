import React, { useState, useEffect } from "react";
import { useApp } from "../contexts/AppContext";
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword 
} from "firebase/auth";
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  doc, 
  getDoc,
  setDoc,
  Timestamp 
} from "firebase/firestore";
import { auth, db } from "../firebase/config";
import { Phone, Lock, User, Heart, ChevronRight, Send, ShieldCheck, HelpCircle } from "lucide-react";
import { motion } from "motion/react";
import { getApiUrl } from "../utils/api";

export const AuthPage: React.FC = () => {
  const { showToast, setView } = useApp();
  const [isLogin, setIsLogin] = useState(true);
  const [isAdminMode, setIsAdminMode] = useState(false);
  
  // Auth Form Fields
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  
  // Register Multi-step state
  const [registerStep, setRegisterStep] = useState(1); // 1: Phone & Send OTP, 2: OTP verify, 3: Details registration
  const [otpCode, setOtpCode] = useState("");
  const [fullName, setFullName] = useState("");
  const [bloodGroup, setBloodGroup] = useState("A+");
  const [role, setRole] = useState<"donor" | "receiver" | "both">("both");
  
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [timer, setTimer] = useState<number>(0);

  // Countdown timer effect for OTP resend
  useEffect(() => {
    let interval: any;
    if (timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timer]);
  
  // No client-side fallback/bypass state is used.
  
  const bloodGroups = ["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"];

  // Handle Login
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setLoading(true);

    const input = phone.trim();
    if (!input || !password.trim()) {
      setErrorMsg("অনুগ্রহ করে লগইন তথ্য এবং পাসওয়ার্ড প্রদান করুন।");
      setLoading(false);
      return;
    }

    // Email direct input fallback
    const isEmail = input.includes("@") || input.endsWith(".com");
    if (isEmail) {
      if (input === "info.shorif0000@gmail.com" || input === "geminiprozksi@gmail.com") {
        try {
          const authResult = await signInWithEmailAndPassword(auth, input, password);
          localStorage.setItem(`show_onboarding_${authResult.user.uid}`, "true");
          showToast("অ্যাডমিন হিসেবে সফলভাবে লগইন করা হয়েছে।", "success");
          setView("admin");
        } catch (err: any) {
          console.error("Admin Login Error:", err);
          setErrorMsg("ভুল ইমেইল অথবা পাসওয়ার্ড। অনুগ্রহ করে আবার চেষ্টা করুন।");
        } finally {
          setLoading(false);
        }
        return;
      } else {
        setErrorMsg("সাধারণ ইউজাররা ইমেইল দিয়ে লগইন করতে পারবেন না। অনুগ্রহ করে মোবাইল নম্বর ও পাসওয়ার্ড ব্যবহার করুন।");
        setLoading(false);
        return;
      }
    }

    // Phone Login
    const cleanedPhone = input;
    if (!cleanedPhone.match(/^01[3-9]\d{8}$/)) {
      setErrorMsg("অনুগ্রহ করে সঠিক ১১ ডিজিটের মোবাইল নম্বর দিন (যেমন: 017XXXXXXXX)।");
      setLoading(false);
      return;
    }

    try {
      // 1. Check if banned/blocked in firestore users collection
      const userQuery = query(collection(db, "users"), where("phone", "==", cleanedPhone));
      const userSnap = await getDocs(userQuery);
      
      if (!userSnap.empty) {
        const userData = userSnap.docs[0].data();
        if (userData.banned || userData.blocked) {
          setErrorMsg("এই মোবাইল নম্বরটি স্থায়ীভাবে নিষিদ্ধ করা হয়েছে।");
          setLoading(false);
          return;
        }
      }

      // Check banned list specifically
      const bannedDoc = await getDoc(doc(db, "banned_phone_numbers", cleanedPhone));
      if (bannedDoc.exists()) {
        setErrorMsg("এই মোবাইল নম্বরটি স্থায়ীভাবে নিষিদ্ধ করা হয়েছে।");
        setLoading(false);
        return;
      }

      const virtualEmail = `${cleanedPhone}@donateblood.com`;
      const authResult = await signInWithEmailAndPassword(auth, virtualEmail, password);
      localStorage.setItem(`show_onboarding_${authResult.user.uid}`, "true");
      showToast("সফলভাবে লগইন করা হয়েছে।", "success");
      setView("home");
    } catch (err: any) {
      console.error("Login Error:", err);
      if (err.code === "auth/user-not-found" || err.code === "auth/wrong-password" || err.code === "auth/invalid-credential") {
        setErrorMsg("মোবাইল নম্বর অথবা পাসওয়ার্ড ভুল। অনুগ্রহ করে সঠিক তথ্য দিন।");
      } else {
        setErrorMsg("লগইন করতে সমস্যা হয়েছে। আবার চেষ্টা করুন।");
      }
    } finally {
      setLoading(false);
    }
  };

  // Step 1: Send OTP for registration
  const handleSendOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMsg("");
    setLoading(true);

    const cleanedPhone = phone.trim();
    if (!cleanedPhone.match(/^01[3-9]\d{8}$/)) {
      setErrorMsg("অনুগ্রহ করে সঠিক বাংলাদেশী মোবাইল নম্বর দিন (যেমন: 017XXXXXXXX)।");
      setLoading(false);
      return;
    }

    const reqUrl = getApiUrl("/api/otp/request");

    try {
      // Always do Firestore pre-checks first on the client side
      try {
        const userQuery = query(collection(db, "users"), where("phone", "==", cleanedPhone));
        const userSnap = await getDocs(userQuery);
        if (!userSnap.empty) {
          setErrorMsg("এই মোবাইল নম্বরটি ইতিমধ্যে নিবন্ধিত রয়েছে। অনুগ্রহ করে লগইন করুন।");
          setLoading(false);
          return;
        }

        // Check if banned
        const bannedDoc = await getDoc(doc(db, "banned_phone_numbers", cleanedPhone));
        if (bannedDoc.exists()) {
          setErrorMsg("এই মোবাইল নম্বরটি স্থায়ীভাবে নিষিদ্ধ করা হয়েছে।");
          setLoading(false);
          return;
        }
      } catch (firestoreErr) {
        console.warn("Client-side Firestore checks skipped or failed:", firestoreErr);
      }

      console.log(`[Frontend] Initiating POST request to otp/request: ${reqUrl}`);
      const response = await fetch(reqUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: cleanedPhone }),
      });

      const text = await response.text();
      let data: any = {};
      try {
        data = JSON.parse(text);
      } catch (e) {
        data = { success: false, error: "Invalid JSON response from server", text };
      }

      // Format and print detailed logs
      const debugObj = data.debug || {};
      const endpointStr = debugObj.endpoint || reqUrl;
      const apiLoadedStr = debugObj.apiLoaded || `VITE_SMS_API_KEY: ${import.meta.env.VITE_SMS_API_KEY ? "Loaded" : "Not Loaded"}`;
      const requestUrlStr = debugObj.requestUrl || `${reqUrl} (POST)`;
      const responseStatusStr = response.status.toString();
      const responseBodyStr = debugObj.responseBody || text;
      const errorStackStr = debugObj.errorStack || "None";

      console.log(`
==================== START REQUEST ====================
Phone: ${cleanedPhone}
Endpoint: ${endpointStr}
API Loaded: ${apiLoadedStr}
Request URL: ${requestUrlStr}
Response Status: ${responseStatusStr}
Response Body: ${responseBodyStr}
Error Stack: ${errorStackStr}
==================== END REQUEST ====================
`);

      if (response.ok && data.success) {
        showToast("আপনার মোবাইলে একটি ৬ ডিজিটের যাচাইকরণ কোড পাঠানো হয়েছে।", "success");
        setTimer(60); // Start 60 second countdown
        setRegisterStep(2);
      } else {
        const errMsgDetail = data.error || "কোড পাঠাতে ব্যর্থ হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।";
        const providerDetail = data.providerResponse ? ` (SMS Gateway Response: ${data.providerResponse})` : "";
        setErrorMsg(`${errMsgDetail}${providerDetail}`);
      }
    } catch (err: any) {
      console.error("send-otp failed with exception:", err);

      console.log(`
==================== START REQUEST ====================
Phone: ${cleanedPhone}
Endpoint: ${reqUrl}
API Loaded: VITE_SMS_API_KEY: Unknown
Request URL: ${reqUrl} (POST)
Response Status: Fetch Exception
Response Body: None
Error Stack: ${err.stack || err.toString()}
==================== END REQUEST ====================
`);
      setErrorMsg(`ওটিপি পাঠানোর সময় নেটওয়ার্ক ত্রুটি ঘটেছে: ${err.message || err}`);
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify OTP
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setLoading(true);

    if (!otpCode.trim()) {
      setErrorMsg("অনুগ্রহ করে যাচাইকরণ কোডটি প্রদান করুন।");
      setLoading(false);
      return;
    }

    const verifyUrl = getApiUrl("/api/otp/verify");

    try {
      console.log(`[Frontend] Initiating POST request to otp/verify: ${verifyUrl}`);
      const response = await fetch(verifyUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: phone.trim(), otp: otpCode.trim() }),
      });

      const text = await response.text();
      let data: any = {};
      try {
        data = JSON.parse(text);
      } catch (e) {
        data = { success: false, error: "Invalid JSON response from server", text };
      }

      console.log(`
==================== START REQUEST ====================
Phone: ${phone.trim()}
Endpoint: ${verifyUrl}
API Loaded: YES
Request URL: ${verifyUrl} (POST)
Response Status: ${response.status}
Response Body: ${text}
Error Stack: None
==================== END REQUEST ====================
`);

      if (response.ok && data.success) {
        showToast("যাচাইকরণ সফল হয়েছে। এবার প্রোফাইলের বাকি তথ্য পূরণ করুন।", "success");
        setRegisterStep(3);
      } else {
        setErrorMsg(data.error || "ভুল কোড। অনুগ্রহ করে সঠিক কোডটি দিন।");
      }
    } catch (err: any) {
      console.error("verify-otp failed with exception:", err);

      console.log(`
==================== START REQUEST ====================
Phone: ${phone.trim()}
Endpoint: ${verifyUrl}
API Loaded: YES
Request URL: ${verifyUrl} (POST)
Response Status: Fetch Exception
Response Body: None
Error Stack: ${err.stack || err.toString()}
==================== END REQUEST ====================
`);
      setErrorMsg(`ওটিপি যাচাই করার সময় নেটওয়ার্ক ত্রুটি ঘটেছে: ${err.message || err}`);
    } finally {
      setLoading(false);
    }
  };

  // Step 3: Registration Complete & Save Profile
  const handleRegisterDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setLoading(true);

    if (!fullName.trim() || !password.trim()) {
      setErrorMsg("অনুগ্রহ করে আপনার নাম এবং একটি পাসওয়ার্ড প্রদান করুন।");
      setLoading(false);
      return;
    }

    if (password.trim().length < 6) {
      setErrorMsg("নিরাপত্তার স্বার্থে পাসওয়ার্ড কমপক্ষে ৬ ডিজিটের হওয়া আবশ্যক।");
      setLoading(false);
      return;
    }

    const cleanedPhone = phone.trim();
    const virtualEmail = `${cleanedPhone}@donateblood.com`;

    try {
      // Create user auth account
      const authResult = await createUserWithEmailAndPassword(auth, virtualEmail, password);
      const user = authResult.user;

      // Save user profile to Firestore
      const userProfile = {
        uid: user.uid,
        phone: cleanedPhone,
        fullName: fullName.trim(),
        bloodGroup,
        role,
        profileCompleted: false, // Redirects user to complete setup
        createdAt: Timestamp.now(),
        lastDonationDate: null,
        donationAvailable: true,
        blocked: false,
        banned: false,
        isAdmin: false
      };

      await setDoc(doc(db, "users", user.uid), userProfile);
      
      localStorage.setItem(`show_onboarding_${user.uid}`, "true");
      showToast("আপনার অ্যাকাউন্ট সফলভাবে তৈরি হয়েছে!", "success");
      setView("profile-setup");
    } catch (err: any) {
      console.error("Registration final step error:", err);
      if (err.code === "auth/email-already-in-use") {
        // Fallback: If auth/email-already-in-use is thrown, but the user is here registering, 
        // it means their Firestore document was deleted but their Auth credential was left behind.
        // We can attempt to sign in with this password. If it works, we re-create their Firestore doc cleanly!
        try {
          const signInResult = await signInWithEmailAndPassword(auth, virtualEmail, password);
          const user = signInResult.user;

          const userProfile = {
            uid: user.uid,
            phone: cleanedPhone,
            fullName: fullName.trim(),
            bloodGroup,
            role,
            profileCompleted: false,
            createdAt: Timestamp.now(),
            lastDonationDate: null,
            donationAvailable: true,
            blocked: false,
            banned: false,
            isAdmin: false
          };

          await setDoc(doc(db, "users", user.uid), userProfile);
          
          localStorage.setItem(`show_onboarding_${user.uid}`, "true");
          showToast("আপনার অ্যাকাউন্টটি সফলভাবে পুনরায় সক্রিয় করা হয়েছে!", "success");
          setView("profile-setup");
        } catch (signInErr: any) {
          console.error("Autologin workaround check failed:", signInErr);
          setErrorMsg("এই মোবাইল নম্বর দিয়ে ইতিমধ্যে অ্যাকাউন্ট রয়েছে। আপনি যদি পূর্ববর্তী অ্যাকাউন্ট ডিলেট করে থাকেন, তবে পূর্ববর্তী পাসওয়ার্ড দিয়ে লগইন করার চেষ্টা করুন অথবা নতুন পাসওয়ার্ড দিয়ে পুনরায় চেষ্টা করুন।");
        }
      } else {
        setErrorMsg("অ্যাকাউন্ট তৈরিতে সমস্যা হয়েছে। পুনরায় চেষ্টা করুন।");
      }
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setIsLogin(true);
    setPhone("");
    setPassword("");
    setRegisterStep(1);
    setOtpCode("");
    setFullName("");
    setBloodGroup("A+");
    setRole("both");
    setErrorMsg("");
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-3xl shadow-xl border border-slate-100 p-8 max-w-md w-full"
      >
        <div className="text-center mb-6">
          <div className="inline-flex p-3 bg-red-50 rounded-2xl mb-3">
            <Heart className="w-8 h-8 text-red-500 fill-red-500 animate-pulse" />
          </div>
          <h2 className="text-3xl font-extrabold text-slate-800 tracking-tight">Donate Blood</h2>
          <p className="text-slate-500 text-sm mt-1.5 font-medium">
            {isLogin ? "রক্ত দিয়ে জীবন বাঁচান" : "নতুন অ্যাকাউন্ট নিবন্ধন"}
          </p>
        </div>

        {errorMsg && (
          <div className="bg-rose-50 border border-rose-200 text-rose-800 p-3.5 rounded-xl text-sm font-medium mb-5">
            {errorMsg}
          </div>
        )}

        {isLogin ? (
          /* LOGIN FORM */
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                মোবাইল নম্বর
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                  <Phone className="w-4 h-4" />
                </span>
                <input
                  type="tel"
                  placeholder="যেমন: 017XXXXXXXX"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-red-500 focus:bg-white transition-all text-slate-800 font-medium"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">পাসওয়ার্ড</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                  <Lock className="w-4 h-4" />
                </span>
                <input
                  type="password"
                  placeholder="আপনার পাসওয়ার্ড দিন"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-red-500 focus:bg-white transition-all text-slate-800 font-medium"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-red-500 hover:bg-red-600 disabled:bg-red-300 text-white font-bold rounded-xl shadow-lg shadow-red-500/10 transition-all flex items-center justify-center gap-2 text-sm mt-2 cursor-pointer"
            >
              {loading ? "অপেক্ষা করুন..." : "লগইন করুন"} <ChevronRight className="w-4 h-4" />
            </button>

            <div className="text-center pt-4 border-t border-slate-100">
              <span className="text-slate-500 text-xs font-medium">অ্যাকাউন্ট নেই? </span>
              <button
                type="button"
                onClick={() => { setIsLogin(false); setRegisterStep(1); setErrorMsg(""); }}
                className="text-red-500 hover:text-red-600 text-xs font-bold transition-colors ml-1 cursor-pointer"
              >
                নিবন্ধন করুন
              </button>
            </div>
          </form>
        ) : (
          /* MULTI-STEP REGISTRATION FORM */
          <div>
            {/* Step Progress indicators */}
            <div className="flex items-center justify-center gap-3 mb-6">
              <span className={`w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold ${registerStep >= 1 ? "bg-red-500 text-white" : "bg-slate-100 text-slate-400"}`}>১</span>
              <div className={`h-0.5 w-10 ${registerStep >= 2 ? "bg-red-500" : "bg-slate-100"}`} />
              <span className={`w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold ${registerStep >= 2 ? "bg-red-500 text-white" : "bg-slate-100 text-slate-400"}`}>২</span>
              <div className={`h-0.5 w-10 ${registerStep >= 3 ? "bg-red-500" : "bg-slate-100"}`} />
              <span className={`w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold ${registerStep >= 3 ? "bg-red-500 text-white" : "bg-slate-100 text-slate-400"}`}>৩</span>
            </div>

            {registerStep === 1 && (
              /* STEP 1: Phone submission for OTP */
              <form onSubmit={handleSendOtp} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">মোবাইল নম্বর দিন</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                      <Phone className="w-4 h-4" />
                    </span>
                    <input
                      type="tel"
                      placeholder="যেমন: 017XXXXXXXX"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-red-500 focus:bg-white transition-all text-slate-800 font-medium"
                    />
                  </div>
                  <p className="text-[11px] text-slate-400 font-medium mt-1.5 leading-normal">
                    * আপনার দেওয়া মোবাইল নম্বরে ৩ মিনিট মেয়াদী একটি ওটিপি (OTP) যাচাইকরণ কোড পাঠানো হবে।
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 px-4 bg-red-500 hover:bg-red-600 disabled:bg-red-300 text-white font-bold rounded-xl shadow-lg shadow-red-500/10 transition-all flex items-center justify-center gap-2 text-sm"
                >
                  {loading ? "কোড পাঠানো হচ্ছে..." : "কোড পাঠান"} <Send className="w-4 h-4" />
                </button>
              </form>
            )}

            {registerStep === 2 && (
              /* STEP 2: Verify OTP */
              <form onSubmit={handleVerifyOtp} className="space-y-4">
                <div className="text-center p-3 bg-slate-50 rounded-2xl border border-slate-100 mb-2">
                  <span className="text-slate-500 text-xs block mb-1">যাচাইকরণ কোড পাঠানো হয়েছে</span>
                  <span className="font-bold text-slate-700 text-sm">{phone}</span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">ওটিপি কোড (OTP)</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                      <ShieldCheck className="w-4 h-4" />
                    </span>
                    <input
                      type="text"
                      placeholder="৬ ডিজিটের কোড দিন"
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-red-500 focus:bg-white transition-all text-slate-800 font-bold tracking-widest text-center"
                    />
                  </div>
                </div>

                {/* Countdown Timer or Resend Button */}
                <div className="text-center py-1">
                  {timer > 0 ? (
                    <p className="text-xs text-slate-500 font-medium">
                      আবার কোড পাঠানোর জন্য <span className="font-bold text-red-500">{timer}</span> সেকেন্ড অপেক্ষা করুন
                    </p>
                  ) : (
                    <button
                      type="button"
                      disabled={loading}
                      onClick={() => handleSendOtp()}
                      className="text-red-500 hover:text-red-600 disabled:text-slate-400 font-bold text-xs transition-colors cursor-pointer"
                    >
                      কোড পুনরায় পাঠান (Resend OTP)
                    </button>
                  )}
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => { setRegisterStep(1); setErrorMsg(""); }}
                    className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-all text-sm"
                  >
                    পিছনে যান
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-[2] py-3 bg-red-500 hover:bg-red-600 disabled:bg-red-300 text-white font-bold rounded-xl shadow-lg transition-all text-sm"
                  >
                    {loading ? "যাচাই করা হচ্ছে..." : "যাচাই করুন"}
                  </button>
                </div>
              </form>
            )}

            {registerStep === 3 && (
              /* STEP 3: Complete Register Details */
              <form onSubmit={handleRegisterDetails} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">আপনার সম্পূর্ণ নাম</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                      <User className="w-4 h-4" />
                    </span>
                    <input
                      type="text"
                      placeholder="যেমন: মোঃ আল-আমিন"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-red-500 focus:bg-white transition-all text-slate-800 font-medium"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">রক্তের গ্রুপ</label>
                    <select
                      value={bloodGroup}
                      onChange={(e) => setBloodGroup(e.target.value)}
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-red-500 focus:bg-white transition-all text-slate-800 font-bold"
                    >
                      {bloodGroups.map((group) => (
                        <option key={group} value={group}>{group}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">পাসওয়ার্ড</label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                        <Lock className="w-3.5 h-3.5" />
                      </span>
                      <input
                        type="password"
                        placeholder="কমপক্ষে ৬ ডিজিট"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full pl-9 pr-3 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-red-500 focus:bg-white transition-all text-slate-800 font-medium"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">আপনি কোন কাজের জন্য নিবন্ধিত হতে চান?</label>
                  <div className="flex flex-col gap-2">
                    <label className={`flex items-center gap-3 p-3 border rounded-xl cursor-pointer transition-all ${role === "donor" ? "border-red-500 bg-red-50/50" : "border-slate-200 hover:bg-slate-50"}`}>
                      <input
                        type="radio"
                        name="role"
                        checked={role === "donor"}
                        onChange={() => setRole("donor")}
                        className="text-red-500 focus:ring-red-500 h-4 w-4"
                      />
                      <span className="text-xs font-bold text-slate-700">আমি রক্ত দিতে চাই</span>
                    </label>

                    <label className={`flex items-center gap-3 p-3 border rounded-xl cursor-pointer transition-all ${role === "receiver" ? "border-red-500 bg-red-50/50" : "border-slate-200 hover:bg-slate-50"}`}>
                      <input
                        type="radio"
                        name="role"
                        checked={role === "receiver"}
                        onChange={() => setRole("receiver")}
                        className="text-red-500 focus:ring-red-500 h-4 w-4"
                      />
                      <span className="text-xs font-bold text-slate-700">আমি রক্ত নিতে চাই</span>
                    </label>

                    <label className={`flex items-center gap-3 p-3 border rounded-xl cursor-pointer transition-all ${role === "both" ? "border-red-500 bg-red-50/50" : "border-slate-200 hover:bg-slate-50"}`}>
                      <input
                        type="radio"
                        name="role"
                        checked={role === "both"}
                        onChange={() => setRole("both")}
                        className="text-red-500 focus:ring-red-500 h-4 w-4"
                      />
                      <span className="text-xs font-bold text-slate-700">আমি রক্ত দিতে ও নিতে চাই</span>
                    </label>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 px-4 bg-red-500 hover:bg-red-600 disabled:bg-red-300 text-white font-bold rounded-xl shadow-lg shadow-red-500/10 transition-all flex items-center justify-center gap-2 text-sm"
                >
                  {loading ? "অপেক্ষা করুন..." : "নিবন্ধন সম্পন্ন করুন"} <ChevronRight className="w-4 h-4" />
                </button>
              </form>
            )}

            <div className="text-center pt-4 border-t border-slate-100 mt-4">
              <span className="text-slate-500 text-xs font-medium">ইতিমধ্যে অ্যাকাউন্ট আছে? </span>
              <button
                type="button"
                onClick={resetForm}
                className="text-red-500 hover:text-red-600 text-xs font-bold transition-colors ml-1"
              >
                লগইন করুন
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
};
