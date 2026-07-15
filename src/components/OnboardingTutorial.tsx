import React, { useState } from "react";
import { User, PlusCircle, Search, PhoneCall, CheckSquare, Award, ArrowRight, ArrowLeft, X } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface OnboardingTutorialProps {
  onComplete?: () => void;
  onClose?: () => void;
}

export const OnboardingTutorial: React.FC<OnboardingTutorialProps> = ({ onComplete, onClose }) => {
  const [step, setStep] = useState(0);

  const steps = [
    {
      title: "Donate Blood-এ আপনাকে স্বাগতম! 🩸",
      description: "রক্তদাতা এবং রক্তগ্রহীতাদের মাঝে দ্রুত ও নিরাপদ যোগাযোগ তৈরি করার জন্য এটি একটি সম্পূর্ণ বিনামূল্যে সেবা। চলুন দেখে নেওয়া যাক কীভাবে এটি কাজ করে।",
      icon: <Award className="w-16 h-16 text-red-500 animate-pulse" />,
    },
    {
      title: "১. প্রোফাইল সম্পূর্ণ করুন 👤",
      description: "নিবন্ধন করার পর আপনার ঠিকানা, জেলা, উপজেলা এবং রক্তের গ্রুপ সিলেক্ট করে প্রোফাইলটি ১০০% সম্পূর্ণ করুন। অসম্পূর্ণ প্রোফাইল দিয়ে রক্তদানের পোস্ট করা যাবে না।",
      icon: <User className="w-16 h-16 text-blue-500" />,
    },
    {
      title: "২. রক্তদাতার পোস্ট তৈরি করুন 🩸",
      description: "রক্তদাতা হিসেবে পোস্ট তৈরি করার পর আপনার সচলতা বা 'Availability' স্বয়ংক্রিয়ভাবে অন (Active) হয়ে যাবে। আপনি যখন রক্ত দিতে প্রস্তুত নন, তখন এটি সাময়িকভাবে অফ (Inactive) করে রাখতে পারবেন।",
      icon: <PlusCircle className="w-16 h-16 text-green-500" />,
    },
    {
      title: "৩. ডোনার ও রক্তের আবেদন খুঁজুন 🔍",
      description: "আমাদের উন্নত সার্চ সিস্টেমের মাধ্যমে রক্তের গ্রুপ, বিভাগ, জেলা বা উপজেলা অনুযায়ী তাৎক্ষণিকভাবে রক্তদাতা অথবা রক্তের জরুরি আবেদন খুঁজে বের করুন।",
      icon: <Search className="w-16 h-16 text-orange-500" />,
    },
    {
      title: "৪. সরাসরি যোগাযোগ করুন 📞",
      description: "রক্তদাতার প্রোফাইল দেখে সরাসরি 'কল করুন' অথবা 'WhatsApp'-এ চ্যাট করুন। তাছাড়া ইন-আপ আবেদনের মাধ্যমে রক্তদাতার কাছে রিকোয়েস্ট পাঠাতে পারেন।",
      icon: <PhoneCall className="w-16 h-16 text-indigo-500" />,
    },
    {
      title: "৫. রক্তদান সম্পন্ন নিশ্চিত করুন ✅",
      description: "রক্ত দেওয়া সফলভাবে শেষ হলে 'আমি রক্ত দিয়েছি' বাটনে ক্লিক করে তথ্য সংরক্ষণ করুন। এর পর আপনার অ্যাকাউন্ট ৩ মাসের জন্য অফলাইনে থাকবে এবং একটি লাইভ কাউন্টডাউন শুরু হবে।",
      icon: <CheckSquare className="w-16 h-16 text-teal-500" />,
    }
  ];

  const handleNext = () => {
    if (step < steps.length - 1) {
      setStep((prev) => prev + 1);
    } else {
      if (onComplete) onComplete();
      if (onClose) onClose();
    }
  };

  const handlePrev = () => {
    if (step > 0) {
      setStep((prev) => prev - 1);
    }
  };

  const handleClose = () => {
    if (onComplete) onComplete();
    if (onClose) onClose();
  };

  return (
    <div 
      id="onboarding-overlay" 
      onClick={handleClose}
      className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4 z-50 cursor-pointer"
    >
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-100 flex flex-col relative cursor-default"
      >
        {/* Skip button */}
        <button 
          onClick={handleClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors p-2 hover:bg-slate-50 rounded-full z-10 cursor-pointer"
          aria-label="Skip onboarding"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Content Area */}
        <div className="p-8 flex-1 flex flex-col items-center text-center mt-4">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col items-center"
            >
              <div className="p-4 bg-slate-50 rounded-2xl mb-6">
                {steps[step].icon}
              </div>
              <h3 className="text-2xl font-bold text-slate-800 tracking-tight mb-3">
                {steps[step].title}
              </h3>
              <p className="text-slate-600 leading-relaxed max-w-sm">
                {steps[step].description}
              </p>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Indicator dots */}
        <div className="flex justify-center gap-1.5 pb-2">
          {steps.map((_, idx) => (
            <div
              key={idx}
              className={`h-2 rounded-full transition-all duration-300 ${
                idx === step ? "w-6 bg-red-500" : "w-2 bg-slate-200"
              }`}
            />
          ))}
        </div>

        {/* Footer actions */}
        <div className="p-6 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          <button
            onClick={handlePrev}
            disabled={step === 0}
            className={`flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-xl transition-all ${
              step === 0
                ? "text-gray-300 cursor-not-allowed"
                : "text-slate-600 hover:bg-slate-100 active:scale-95"
            }`}
          >
            <ArrowLeft className="w-4 h-4" /> পূর্ববর্তী
          </button>

          <button
            onClick={handleNext}
            className="flex items-center gap-1.5 px-6 py-2.5 bg-red-500 hover:bg-red-600 active:scale-95 text-white text-sm font-semibold rounded-xl shadow-md shadow-red-500/10 transition-all"
          >
            {step === steps.length - 1 ? "শুরু করুন" : "পরবর্তী"} <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </motion.div>
    </div>
  );
};
