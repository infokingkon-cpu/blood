import React, { useState } from "react";
import { useApp } from "../contexts/AppContext";
import { addDoc, collection, Timestamp } from "firebase/firestore";
import { db } from "../firebase/config";
import { Mail, Phone, MessageSquare, Landmark, ShieldQuestion, HelpCircle, FileText, Send } from "lucide-react";
import { motion } from "motion/react";

export const SupportPage: React.FC = () => {
  const { showToast, user } = useApp();
  const [activeForm, setActiveForm] = useState<"support" | "feedback">("support");
  const [loading, setLoading] = useState(false);

  // Support Form State
  const [supName, setSupName] = useState(user?.fullName || "");
  const [supPhone, setSupPhone] = useState(user?.phone || "");
  const [supSubject, setSupSubject] = useState("");
  const [supMessage, setSupMessage] = useState("");

  // Feedback Form State
  const [feedType, setFeedType] = useState<"issue" | "feedback" | "suggestion">("feedback");
  const [feedMessage, setFeedMessage] = useState("");

  // Handle Support submit
  const handleSupportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supName.trim() || !supPhone.trim() || !supSubject.trim() || !supMessage.trim()) {
      showToast("অনুগ্রহ করে সব তথ্য প্রদান করুন।", "warning");
      return;
    }

    setLoading(true);
    try {
      await addDoc(collection(db, "support_messages"), {
        name: supName.trim(),
        phone: supPhone.trim(),
        subject: supSubject.trim(),
        message: supMessage.trim(),
        createdAt: Timestamp.now()
      });
      showToast("আপনার বার্তা সফলভাবে এডমিন টিমের কাছে পাঠানো হয়েছে। ধন্যবাদ!", "success");
      setSupSubject("");
      setSupMessage("");
    } catch (err) {
      console.error("Support Submit Error:", err);
      showToast("বার্তা পাঠাতে সমস্যা হয়েছে। আবার চেষ্টা করুন।", "error");
    } finally {
      setLoading(false);
    }
  };

  // Handle Feedback submit
  const handleFeedbackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      showToast("ফিডব্যাক পাঠানোর জন্য দয়া করে আগে লগইন করুন।", "warning");
      return;
    }
    if (!feedMessage.trim()) {
      showToast("অনুগ্রহ করে আপনার মূল্যবান মতামত বা মেসেজটি লিখুন।", "warning");
      return;
    }

    setLoading(true);
    try {
      await addDoc(collection(db, "feedback"), {
        userId: user.uid,
        userName: user.fullName,
        userPhone: user.phone,
        type: feedType,
        message: feedMessage.trim(),
        createdAt: Timestamp.now()
      });
      showToast("আপনার মূল্যবান মতামত সফলভাবে সংরক্ষিত হয়েছে।", "success");
      setFeedMessage("");
    } catch (err) {
      console.error("Feedback Submit Error:", err);
      showToast("সংরক্ষণ করতে সমস্যা হয়েছে। আবার চেষ্টা করুন।", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6 md:py-8">
      
      {/* Title block */}
      <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-100 shadow-sm text-center">
        <h2 className="text-2xl font-black text-slate-800 tracking-tight">সাহায্য ও পরামর্শ কেন্দ্র 🤝</h2>
        <p className="text-slate-500 text-xs md:text-sm mt-1 font-medium">
          আপনার যেকোনো জিজ্ঞাসা বা প্ল্যাটফর্ম উন্নত করতে মতামত আমাদের কাছে অত্যন্ত মূল্যবান
        </p>

        {/* Tab triggers */}
        <div className="flex justify-center gap-2 mt-6">
          <button
            onClick={() => setActiveForm("support")}
            className={`py-2 px-5 text-xs font-bold rounded-xl transition-all ${
              activeForm === "support"
                ? "bg-slate-950 text-white shadow-md"
                : "bg-slate-50 text-slate-600 hover:bg-slate-100"
            }`}
          >
            এডমিন সাপোর্ট (Contact Admin)
          </button>
          <button
            onClick={() => setActiveForm("feedback")}
            className={`py-2 px-5 text-xs font-bold rounded-xl transition-all ${
              activeForm === "feedback"
                ? "bg-slate-950 text-white shadow-md"
                : "bg-slate-50 text-slate-600 hover:bg-slate-100"
            }`}
          >
            মতামত ও অভিযোগ (Feedback)
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
        
        {/* Info Column */}
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-5">
          <h3 className="font-extrabold text-slate-800 text-sm border-b pb-2">জরুরি প্রয়োজনে যোগাযোগ</h3>
          
          <div className="flex gap-3 items-start">
            <div className="p-2.5 bg-red-50 text-red-500 rounded-xl mt-0.5">
              <Phone className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs text-slate-400 block font-bold">মোবাইল ফোন নম্বর</span>
              <a href="tel:+8801700000000" className="text-sm font-extrabold text-slate-800 hover:text-red-500 transition-colors">+৮৮০১৭০০-০০০০০০</a>
            </div>
          </div>

          <div className="flex gap-3 items-start">
            <div className="p-2.5 bg-blue-50 text-blue-500 rounded-xl mt-0.5">
              <Mail className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs text-slate-400 block font-bold">ইমেইল ঠিকানা</span>
              <a href="mailto:support@donateblood.com" className="text-sm font-extrabold text-slate-800 hover:text-blue-500 transition-colors">support@donateblood.com</a>
            </div>
          </div>

          <div className="p-4 bg-slate-50 border rounded-2xl text-[11px] leading-relaxed text-slate-500 font-medium">
            💡 <strong>মনে রাখবেন:</strong> Donate Blood একটি সম্পূর্ণ অলাভজনক প্ল্যাটফর্ম। কোন প্রকার আর্থিক লেনদেনের অনুরোধে সাড়া দিবেন না। প্রতারণার শিকার হলে সাথে সাথে এডমিন সাপোর্ট লাইনে অভিযোগ দিন।
          </div>
        </div>

        {/* Interactive Form Column */}
        <div className="md:col-span-2">
          {activeForm === "support" ? (
            /* Contact Admin Support Form */
            <motion.div
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white p-6 md:p-8 rounded-3xl border border-slate-100 shadow-sm"
            >
              <h3 className="font-extrabold text-slate-800 text-base mb-4 flex items-center gap-1.5">
                <FileText className="w-5 h-5 text-red-500" /> এডমিন প্যানেলে টিকিট পাঠান
              </h3>

              <form onSubmit={handleSupportSubmit} className="space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-slate-500 mb-1.5 uppercase tracking-wider">আপনার নাম</label>
                    <input
                      type="text"
                      required
                      value={supName}
                      onChange={(e) => setSupName(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-red-500 text-slate-800 font-semibold"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-500 mb-1.5 uppercase tracking-wider">মোবাইল নম্বর</label>
                    <input
                      type="tel"
                      required
                      value={supPhone}
                      onChange={(e) => setSupPhone(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-red-500 text-slate-800 font-semibold"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-500 mb-1.5 uppercase tracking-wider">বার্তার বিষয় (Subject)</label>
                  <input
                    type="text"
                    required
                    placeholder="যেমন: রক্তদাতার ভুল নম্বর সম্পর্কিত অভিযোগ"
                    value={supSubject}
                    onChange={(e) => setSupSubject(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-red-500 text-slate-800 font-semibold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-500 mb-1.5 uppercase tracking-wider">বার্তার বিবরণ (Message)</label>
                  <textarea
                    required
                    rows={4}
                    placeholder="আপনার বার্তা বা অভিযোগটি বিস্তারিত লিখুন..."
                    value={supMessage}
                    onChange={(e) => setSupMessage(e.target.value)}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-red-500 text-slate-800 font-medium"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl shadow-lg transition-all flex items-center justify-center gap-1.5 text-xs uppercase"
                >
                  {loading ? "পাঠানো হচ্ছে..." : "বার্তা পাঠান"} <Send className="w-3.5 h-3.5" />
                </button>
              </form>
            </motion.div>
          ) : (
            /* User Feedback form */
            <motion.div
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white p-6 md:p-8 rounded-3xl border border-slate-100 shadow-sm"
            >
              <h3 className="font-extrabold text-slate-800 text-base mb-4 flex items-center gap-1.5">
                <MessageSquare className="w-5 h-5 text-indigo-500" /> মতামত ও সুনির্দিষ্ট পরামর্শ
              </h3>

              {!user ? (
                <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                  <ShieldQuestion className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                  <p className="text-slate-600 font-bold text-sm">অনুগ্রহ করে আগে লগইন করুন</p>
                  <p className="text-slate-400 text-xs mt-1">ফিডব্যাক সাবমিট করার জন্য লগইন করা আবশ্যক।</p>
                </div>
              ) : (
                <form onSubmit={handleFeedbackSubmit} className="space-y-4 text-xs">
                  <div>
                    <label className="block font-bold text-slate-500 mb-1.5 uppercase tracking-wider">পরামর্শের ধরন</label>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() => setFeedType("feedback")}
                        className={`py-2 px-3 border rounded-xl font-bold transition-all ${
                          feedType === "feedback"
                            ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                            : "border-slate-200 text-slate-600 hover:bg-slate-50"
                        }`}
                      >
                        মতামত / প্রশংসা
                      </button>
                      <button
                        type="button"
                        onClick={() => setFeedType("issue")}
                        className={`py-2 px-3 border rounded-xl font-bold transition-all ${
                          feedType === "issue"
                            ? "border-red-500 bg-red-50 text-red-700"
                            : "border-slate-200 text-slate-600 hover:bg-slate-50"
                        }`}
                      >
                        সমস্যা জানানো
                      </button>
                      <button
                        type="button"
                        onClick={() => setFeedType("suggestion")}
                        className={`py-2 px-3 border rounded-xl font-bold transition-all ${
                          feedType === "suggestion"
                            ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                            : "border-slate-200 text-slate-600 hover:bg-slate-50"
                        }`}
                      >
                        ফিচার প্রস্তাবনা
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-500 mb-1.5 uppercase tracking-wider">আপনার পরামর্শ বা মতামত</label>
                    <textarea
                      required
                      rows={5}
                      placeholder="আমাদের অ্যাপের পারফর্মেন্স সম্পর্কে কোন পরামর্শ বা নতুন আইডিয়ার কথা লিখে জানান..."
                      value={feedMessage}
                      onChange={(e) => setFeedMessage(e.target.value)}
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-red-500 text-slate-800 font-medium"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg transition-all flex items-center justify-center gap-1.5 text-xs"
                  >
                    {loading ? "সংরক্ষণ করা হচ্ছে..." : "ফিডব্যাক পাঠান"} <Send className="w-3.5 h-3.5" />
                  </button>
                </form>
              )}
            </motion.div>
          )}
        </div>

      </div>

    </div>
  );
};
