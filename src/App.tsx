import React, { useState } from "react";
import { AppProvider, useApp } from "./contexts/AppContext";
import { ToastContainer } from "./components/ToastContainer";
import { HomePage } from "./pages/HomePage";
import { AuthPage } from "./pages/AuthPage";
import { ProfileSetupPage } from "./pages/ProfileSetupPage";
import { DirectoryPage } from "./pages/DirectoryPage";
import { SupportPage } from "./pages/SupportPage";
import { RequestsDashboardPage } from "./pages/RequestsDashboardPage";
import { AdminPage } from "./pages/AdminPage";
import { AdminLoginPage } from "./pages/AdminLoginPage";
import { OnboardingTutorial } from "./components/OnboardingTutorial";
import { doc, updateDoc, writeBatch, collection, getDocs, query, where } from "firebase/firestore";
import { db } from "./firebase/config";

import { 
  Heart, 
  User, 
  Menu, 
  X, 
  Bell, 
  Building2, 
  HelpCircle, 
  Inbox, 
  ShieldCheck, 
  LogOut, 
  Sparkles,
  PhoneCall,
  Check,
  Trash2
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

const AppContent: React.FC = () => {
  const { 
    user, 
    firebaseUser, 
    loading, 
    currentView, 
    setView, 
    logout, 
    notifications, 
    showToast 
  } = useApp();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notifDropdownOpen, setNotifDropdownOpen] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);

  // Check if onboarding tutorial should be displayed
  React.useEffect(() => {
    if (user?.uid) {
      const showFlag = localStorage.getItem(`show_onboarding_${user.uid}`);
      if (showFlag === "true") {
        setShowTutorial(true);
        localStorage.removeItem(`show_onboarding_${user.uid}`);
      }
    }
  }, [user?.uid]);

  // Mark all notifications as read
  const handleMarkAllRead = async () => {
    if (!user?.uid) return;
    try {
      const q = query(
        collection(db, "notifications"),
        where("userId", "==", user.uid),
        where("read", "==", false)
      );
      const snap = await getDocs(q);
      const batch = writeBatch(db);
      snap.forEach((d) => {
        batch.update(d.ref, { read: true });
      });
      await batch.commit();
      showToast("সব নোটিফিকেশন পড়া হয়েছে বলে চিহ্নিত করা হয়েছে।", "success");
    } catch (err) {
      console.error(err);
    }
  };

  // Clear all notifications
  const handleClearNotifications = async () => {
    if (!user?.uid) return;
    try {
      const q = query(collection(db, "notifications"), where("userId", "==", user.uid));
      const snap = await getDocs(q);
      const batch = writeBatch(db);
      snap.forEach((d) => {
        batch.delete(d.ref);
      });
      await batch.commit();
      showToast("সব নোটিফিকেশন মুছে ফেলা হয়েছে।", "success");
    } catch (err) {
      console.error(err);
    }
  };

  const renderActiveView = () => {
    if (loading) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[70vh] text-center">
          <div className="relative flex items-center justify-center">
            <div className="w-16 h-16 border-4 border-red-500 border-t-transparent rounded-full animate-spin" />
            <Heart className="w-6 h-6 text-red-500 absolute animate-pulse" />
          </div>
          <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mt-5">প্ল্যাটফর্ম লোড হচ্ছে...</p>
        </div>
      );
    }

    switch (currentView) {
      case "home":
        return <HomePage />;
      case "auth":
        return <AuthPage />;
      case "profile-setup":
        return <ProfileSetupPage />;
      case "directory":
        return <DirectoryPage />;
      case "support":
        return <SupportPage />;
      case "requests":
        return <RequestsDashboardPage />;
      case "admin":
        return <AdminPage />;
      case "admin-login":
        return <AdminLoginPage />;
      default:
        return <HomePage />;
    }
  };

  if (user?.isAdmin || currentView === "admin" || currentView === "admin-login") {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col justify-between">
        <main className="flex-1 animate-fade-in">
          {currentView === "admin-login" ? <AdminLoginPage /> : <AdminPage />}
        </main>
        <ToastContainer />
      </div>
    );
  }

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="min-h-screen bg-slate-50/50 flex flex-col justify-between">
      
      {/* Onboarding Tutorial Overlay */}
      {showTutorial && (
        <OnboardingTutorial 
          onClose={() => setShowTutorial(false)} 
          onComplete={() => setShowTutorial(false)} 
        />
      )}
      
      {/* GLOBAL HEADER */}
      <header className="bg-white border-b border-slate-100 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
          
          {/* Logo */}
          <button 
            onClick={() => setView("home")}
            className="flex items-center gap-2 hover:scale-102 transition-transform cursor-pointer"
          >
            <div className="w-10 h-10 rounded-2xl bg-red-500 flex items-center justify-center text-white shadow-lg shadow-red-500/20">
              <Heart className="w-5 h-5 fill-white" />
            </div>
            <div className="text-left">
              <span className="font-black text-slate-800 text-sm tracking-tight block">Donate Blood 🩸</span>
            </div>
          </button>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-1.5 text-xs font-extrabold text-slate-600">
            <button
              onClick={() => setView("home")}
              className={`py-2 px-3.5 rounded-xl transition-all cursor-pointer ${
                currentView === "home" ? "bg-red-50 text-red-600" : "hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              হোমপেজ
            </button>
            <button
              onClick={() => setView("directory")}
              className={`py-2 px-3.5 rounded-xl transition-all cursor-pointer ${
                currentView === "directory" ? "bg-red-50 text-red-600" : "hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              Hospital & Donate Blood
            </button>
            <button
              onClick={() => setView("support")}
              className={`py-2 px-3.5 rounded-xl transition-all cursor-pointer ${
                currentView === "support" ? "bg-red-50 text-red-600" : "hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              সাহায্য ও সাপোর্ট
            </button>
            <button
              onClick={() => setShowTutorial(true)}
              className="py-2 px-3.5 rounded-xl transition-all cursor-pointer text-indigo-600 hover:bg-slate-50 border border-indigo-100 bg-indigo-50/10 hover:text-indigo-900 font-extrabold flex items-center gap-1 shrink-0"
              title="ইউজার গাইড দেখতে ক্লিক করুন"
            >
              <HelpCircle className="w-3.5 h-3.5" /> ইউজার গাইড
            </button>

            {user && (
              <button
                onClick={() => setView("requests")}
                className={`py-2 px-3.5 rounded-xl transition-all cursor-pointer ${
                  currentView === "requests" ? "bg-red-50 text-red-600" : "hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                আবেদন ড্যাশবোর্ড
              </button>
            )}

            {user?.isAdmin && (
              <button
                onClick={() => setView("admin")}
                className={`py-2 px-3.5 rounded-xl transition-all cursor-pointer border border-red-100 flex items-center gap-1 bg-red-50/20 ${
                  currentView === "admin" ? "bg-slate-900 text-white border-slate-900" : "text-red-600 hover:bg-red-50"
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5" /> অ্যাডমিন প্যানেল
              </button>
            )}
          </nav>

          {/* User Section & Notifications */}
          <div className="flex items-center gap-3">
            
            {/* Notifications Center (Only if user logged in) */}
            {user && (
              <div className="relative">
                <button
                  onClick={() => setNotifDropdownOpen(!notifDropdownOpen)}
                  className="p-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-100 rounded-xl text-slate-500 relative transition-colors"
                >
                  <Bell className="w-4 h-4" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white font-extrabold text-[9px] w-4 h-4 rounded-full flex items-center justify-center border-2 border-white animate-bounce">
                      {unreadCount}
                    </span>
                  )}
                </button>

                {/* Dropdown popup */}
                <AnimatePresence>
                  {notifDropdownOpen && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setNotifDropdownOpen(false)} />
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="absolute right-0 mt-2 w-72 bg-white rounded-2xl border border-slate-100 shadow-xl z-50 overflow-hidden"
                      >
                        <div className="p-3 bg-slate-50 border-b flex items-center justify-between text-xs font-bold text-slate-600">
                          <span>বিজ্ঞপ্তি সমূহ ({unreadCount})</span>
                          <div className="flex gap-2">
                            <button onClick={handleMarkAllRead} className="text-red-500 hover:underline flex items-center gap-0.5">
                              <Check className="w-3 h-3" /> সব পড়ুন
                            </button>
                            <button onClick={handleClearNotifications} className="text-slate-400 hover:text-slate-600">
                              <Trash2 className="w-3 h-3" /> মুছুন
                            </button>
                          </div>
                        </div>

                        <div className="max-h-60 overflow-y-auto divide-y divide-slate-50">
                          {notifications.length === 0 ? (
                            <p className="p-4 text-center text-xs text-slate-400 font-bold">কোন নতুন নোটিফিকেশন নেই</p>
                          ) : (
                            notifications.map((n) => (
                              <div key={n.id} className={`p-3 text-[11px] leading-relaxed transition-colors ${!n.read ? "bg-red-50/20 font-bold text-slate-800" : "text-slate-500"}`}>
                                <p className="font-extrabold text-slate-800">{n.title}</p>
                                <p className="mt-0.5">{n.message}</p>
                              </div>
                            ))
                          )}
                        </div>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>
            )}

            {/* Auth Button/Dropdown */}
            {user ? (
              <div className="hidden lg:flex items-center gap-2.5">
                <button
                  onClick={() => setView("profile-setup")}
                  className="flex items-center gap-2 cursor-pointer bg-slate-50 border p-1 pr-3.5 rounded-xl hover:bg-slate-100 transition-colors"
                >
                  <div className="w-8 h-8 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-500 relative shrink-0">
                    {user.profilePicture ? (
                      <img src={user.profilePicture} alt="" className="w-8 h-8 rounded-lg object-cover" />
                    ) : (
                      <User className="w-4 h-4 text-slate-500" />
                    )}
                  </div>
                  <div className="text-left text-[11px] leading-tight">
                    <span className="font-black text-slate-800 block">{user.fullName}</span>
                    <span className="text-slate-400 block">{user.bloodGroup} গ্রুপ</span>
                  </div>
                </button>

                <button
                  onClick={logout}
                  className="p-2.5 bg-slate-50 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-xl border border-slate-100 transition-all cursor-pointer"
                  title="লগআউট করুন"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setView("auth")}
                className="hidden lg:flex items-center gap-1.5 py-2.5 px-5 bg-red-500 hover:bg-red-600 text-white font-extrabold text-xs rounded-xl shadow-md shadow-red-500/10 cursor-pointer transition-all active:scale-95"
              >
                <User className="w-4 h-4" /> লগইন / নিবন্ধন
              </button>
            )}

            {/* Hamburger (Mobile Toggle) */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 bg-slate-50 hover:bg-slate-100 border rounded-xl text-slate-500 lg:hidden cursor-pointer"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

          </div>

        </div>
      </header>

      {/* MOBILE DRAWER */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-30 lg:hidden" onClick={() => setMobileMenuOpen(false)} />
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              className="fixed top-0 bottom-0 left-0 w-72 bg-white z-40 shadow-2xl p-6 flex flex-col justify-between lg:hidden"
            >
              <div className="space-y-6">
                {/* Drawer Logo */}
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-2xl bg-red-500 flex items-center justify-center text-white shadow-lg shadow-red-500/20">
                    <Heart className="w-5 h-5 fill-white" />
                  </div>
                  <div>
                    <span className="font-black text-slate-800 text-sm block">Donate Blood 🩸</span>
                  </div>
                </div>

                {/* User Card inside mobile drawer */}
                {user && (
                  <button 
                    onClick={() => { setView("profile-setup"); setMobileMenuOpen(false); }}
                    className="w-full flex items-center gap-3 p-3 bg-slate-50 border rounded-2xl hover:bg-slate-100 transition-colors text-left"
                  >
                    <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-500 shrink-0">
                      {user.profilePicture ? (
                        <img src={user.profilePicture} alt="" className="w-10 h-10 rounded-xl object-cover" />
                      ) : (
                        <User className="w-5 h-5 text-slate-500" />
                      )}
                    </div>
                    <div>
                      <span className="font-extrabold text-slate-800 text-xs block">{user.fullName}</span>
                      <span className="text-[10px] text-slate-400 block font-semibold">{user.bloodGroup} রক্তের গ্রুপ</span>
                    </div>
                  </button>
                )}

                {/* Mobile Links */}
                <nav className="flex flex-col gap-2 text-xs font-black text-slate-600">
                  <button
                    onClick={() => { setView("home"); setMobileMenuOpen(false); }}
                    className={`p-3 rounded-xl transition-all text-left ${currentView === "home" ? "bg-red-50 text-red-600" : "hover:bg-slate-50"}`}
                  >
                    হোমপেজ
                  </button>
                  <button
                    onClick={() => { setView("directory"); setMobileMenuOpen(false); }}
                    className={`p-3 rounded-xl transition-all text-left ${currentView === "directory" ? "bg-red-50 text-red-600" : "hover:bg-slate-50"}`}
                  >
                    Hospital & Donate Blood
                  </button>
                  <button
                    onClick={() => { setView("support"); setMobileMenuOpen(false); }}
                    className={`p-3 rounded-xl transition-all text-left ${currentView === "support" ? "bg-red-50 text-red-600" : "hover:bg-slate-50"}`}
                  >
                    সাহায্য ও সাপোর্ট
                  </button>
                  <button
                    onClick={() => { setShowTutorial(true); setMobileMenuOpen(false); }}
                    className="p-3 rounded-xl transition-all text-left border border-indigo-100 bg-indigo-50/20 text-indigo-600 font-black flex items-center gap-1.5"
                  >
                    <HelpCircle className="w-4 h-4" /> ইউজার গাইড
                  </button>

                  {user && (
                    <button
                      onClick={() => { setView("requests"); setMobileMenuOpen(false); }}
                      className={`p-3 rounded-xl transition-all text-left ${currentView === "requests" ? "bg-red-50 text-red-600" : "hover:bg-slate-50"}`}
                    >
                      আবেদন ড্যাশবোর্ড
                    </button>
                  )}

                  {user?.isAdmin && (
                    <button
                      onClick={() => { setView("admin"); setMobileMenuOpen(false); }}
                      className={`p-3 rounded-xl transition-all text-left border border-red-100 flex items-center gap-1.5 ${
                        currentView === "admin" ? "bg-slate-900 text-white" : "text-red-600 hover:bg-red-50"
                      }`}
                    >
                      <ShieldCheck className="w-4 h-4" /> অ্যাডমিন প্যানেল
                    </button>
                  )}
                </nav>
              </div>

              {/* Drawer Bottom Action (Login/Logout) */}
              <div>
                {user ? (
                  <button
                    onClick={() => { logout(); setMobileMenuOpen(false); }}
                    className="w-full py-3 bg-rose-50 hover:bg-rose-100 text-rose-600 font-extrabold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5"
                  >
                    <LogOut className="w-4 h-4" /> লগআউট করুন
                  </button>
                ) : (
                  <button
                    onClick={() => { setView("auth"); setMobileMenuOpen(false); }}
                    className="w-full py-3 bg-red-500 hover:bg-red-600 text-white font-extrabold text-xs rounded-xl shadow-lg transition-all flex items-center justify-center gap-1.5"
                  >
                    <User className="w-4 h-4" /> লগইন / নিবন্ধন
                  </button>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* MAIN VIEWPORT */}
      <main className="flex-1 pb-16">
        {renderActiveView()}
      </main>

      {/* TOAST NOTIFICATION STACK */}
      <ToastContainer />

      {/* FOOTER */}
      <footer className="bg-white border-t border-slate-100 py-6 text-center text-xs text-slate-400 font-medium">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <p>© {new Date().getFullYear()} Donate Blood। রক্তদাতা এবং রক্তগ্রহীতাদের মাঝে দ্রুত ও নিরাপদ যোগাযোগের সহজ মাধ্যম।</p>
          <div className="flex justify-center gap-4 text-[11px] font-bold text-slate-500">
            <button onClick={() => setView("support")} className="hover:text-red-500 transition-colors">যোগাযোগ</button>
            <span>•</span>
            <button onClick={() => setView("directory")} className="hover:text-red-500 transition-colors">ডিরেক্টরি</button>
          </div>
        </div>
      </footer>

    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
