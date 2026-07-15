import React, { createContext, useContext, useState, useEffect } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { 
  doc, 
  getDoc, 
  setDoc, 
  getDocFromServer, 
  collection, 
  query, 
  where, 
  onSnapshot, 
  orderBy, 
  limit,
  Timestamp 
} from "firebase/firestore";
import { auth, db, handleFirestoreError, OperationType } from "../firebase/config";
import { UserProfile, Notification, SystemSetting } from "../types";

interface Toast {
  id: string;
  type: "success" | "error" | "warning" | "info";
  message: string;
}

interface AppContextType {
  user: UserProfile | null;
  firebaseUser: any | null;
  loading: boolean;
  currentView: string;
  setView: (view: string) => void;
  toasts: Toast[];
  showToast: (message: string, type: "success" | "error" | "warning" | "info") => void;
  removeToast: (id: string) => void;
  refreshUserProfile: () => Promise<void>;
  logout: () => Promise<void>;
  systemSettings: SystemSetting | null;
  notifications: Notification[];
  favorites: string[];
  toggleFavorite: (donorId: string) => void;
  isFavorite: (donorId: string) => boolean;
  onlineStatusText: string;
  updateOnlineStatus: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [firebaseUser, setFirebaseUser] = useState<any | null>(null);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentView, setCurrentView] = useState("home");
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [systemSettings, setSystemSettings] = useState<SystemSetting | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);

  // Show Toast Toast Notification Helper
  const showToast = (message: string, type: "success" | "error" | "warning" | "info" = "info") => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => removeToast(id), 5000);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // 1. Connection Validation as mandated by Firebase Skill
  useEffect(() => {
    async function testConnection() {
      try {
        await getDocFromServer(doc(db, "test", "connection"));
        console.log("Firebase Connection verified successfully.");
      } catch (error: any) {
        if (error instanceof Error && error.message.includes("the client is offline")) {
          console.error("Please check your Firebase configuration. Client is offline.");
          showToast("নেটওয়ার্ক সংযোগ পাওয়া যায়নি। অনুগ্রহ করে ইন্টারনেট সংযোগ চেক করুন।", "error");
        }
      }
    }
    testConnection();
  }, []);

  // 2. Fetch System Settings & Initialize Default Settings if needed
  useEffect(() => {
    const settingsRef = doc(db, "settings", "global");
    const unsubscribe = onSnapshot(settingsRef, async (snapshot) => {
      if (snapshot.exists()) {
        setSystemSettings(snapshot.data() as SystemSetting);
      } else {
        // Initialize default global settings
        const defaultSettings: SystemSetting = {
          id: "global",
          registrationEnabled: true,
          bloodRequestsEnabled: true,
          donationsEnabled: true,
          homepageNotice: "স্বাগতম! Donate Blood প্ল্যাটফর্মে আপনার রক্তদানের তথ্য সংরক্ষণ করুন এবং অন্যকে জীবন বাঁচাতে সাহায্য করুন।",
          maintenanceMode: false
        };
        try {
          await setDoc(settingsRef, defaultSettings);
          setSystemSettings(defaultSettings);
        } catch (err) {
          console.error("Failed to set default settings:", err);
        }
      }
    }, (error) => {
      console.error("Settings Subscription Error:", error);
    });

    return () => unsubscribe();
  }, []);

  // 3. User Authorization & Setup Listeners
  useEffect(() => {
    let unsubscribeUserDoc: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, async (fUser) => {
      setFirebaseUser(fUser);
      
      if (unsubscribeUserDoc) {
        unsubscribeUserDoc();
        unsubscribeUserDoc = null;
      }

      if (fUser) {
        setLoading(true);
        const isMasterAdmin = fUser.email === "info.shorif0000@gmail.com" || fUser.email === "geminiprozksi@gmail.com";
        const userDocRef = doc(db, "users", fUser.uid);

        unsubscribeUserDoc = onSnapshot(userDocRef, async (userSnapshot) => {
          if (userSnapshot.exists()) {
            const userData = userSnapshot.data() as UserProfile;
            
            if (userData.banned || userData.blocked) {
              showToast("আপনার অ্যাকাউন্টটি স্থায়ীভাবে বা সাময়িকভাবে ব্লক করা হয়েছে।", "error");
              await signOut(auth);
              setUser(null);
              setCurrentView("home");
            } else {
              if (isMasterAdmin && !userData.isAdmin) {
                userData.isAdmin = true;
                userData.profileCompleted = true;
                await setDoc(userDocRef, { isAdmin: true, profileCompleted: true }, { merge: true });
              }
              setUser(userData);
              
              // If user is an admin, immediately force the admin view, otherwise check profile completed status
              if (userData.isAdmin || isMasterAdmin) {
                setCurrentView("admin");
              } else if (!userData.profileCompleted) {
                // If they are on auth or registering, move them to profile-setup
                setCurrentView((prev) => {
                  if (prev === "auth" || prev === "register-details" || prev === "home") {
                    return "profile-setup";
                  }
                  return prev;
                });
              } else {
                // If they are on auth, move them to home since their profile is already completed!
                setCurrentView((prev) => {
                  if (prev === "auth" || prev === "register-details") {
                    return "home";
                  }
                  return prev;
                });
              }
            }
          } else {
            if (isMasterAdmin) {
              // Auto-create master admin profile
              const adminProfile: UserProfile = {
                uid: fUser.uid,
                phone: "01700000000",
                fullName: "অ্যাডমিন (Shorif)",
                bloodGroup: "O+",
                role: "both",
                profileCompleted: true,
                createdAt: Timestamp.now(),
                lastDonationDate: null,
                donationAvailable: true,
                blocked: false,
                banned: false,
                isAdmin: true,
                profilePicture: ""
              };
              await setDoc(userDocRef, adminProfile);
              setUser(adminProfile);
              setCurrentView("admin");
            } else {
              // User authenticated but no profile exists yet (registration in progress)
              setUser(null);
              setCurrentView((prev) => {
                if (prev === "auth" || prev === "home") {
                  return "register-details";
                }
                return prev;
              });
            }
          }
          setLoading(false);
        }, (error) => {
          console.error("User doc listener error:", error);
          setLoading(false);
        });
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeUserDoc) {
        unsubscribeUserDoc();
      }
    };
  }, []);

  // 3b. /admin path routing effect
  useEffect(() => {
    if (loading) return;
    const handleUrlRouting = () => {
      const path = window.location.pathname;
      const hash = window.location.hash;
      if (path === "/admin" || hash === "#admin" || hash === "/admin" || path.endsWith("/admin")) {
        if (user) {
          if (user.isAdmin) {
            setCurrentView("admin");
          } else {
            setCurrentView("home");
            showToast("দুঃখিত, এই পেজটি শুধুমাত্র অ্যাডমিনদের জন্য সংরক্ষিত।", "error");
          }
        } else {
          setCurrentView("admin-login");
          showToast("অ্যাডমিন প্যানেলে প্রবেশ করতে প্রথমে লগইন করুন।", "info");
        }
      }
    };
    handleUrlRouting();
    window.addEventListener("hashchange", handleUrlRouting);
    return () => window.removeEventListener("hashchange", handleUrlRouting);
  }, [user, loading]);

  // 4. Real-time Notifications Listener for Logged-In User
  useEffect(() => {
    if (!firebaseUser) {
      setNotifications([]);
      return;
    }

    const q = query(
      collection(db, "notifications"),
      where("userId", "==", firebaseUser.uid),
      orderBy("createdAt", "desc"),
      limit(50)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list: Notification[] = [];
      snapshot.forEach((doc) => {
        list.push({ ...doc.data() as Notification, id: doc.id });
      });
      setNotifications(list);
    }, (error) => {
      // Non-blocking error handling
      console.warn("Notifications subscriber error:", error);
    });

    return () => unsubscribe();
  }, [firebaseUser]);

  // 5. Load favorites from local storage
  useEffect(() => {
    const storedFavorites = localStorage.getItem("favorite_donors");
    if (storedFavorites) {
      try {
        setFavorites(JSON.parse(storedFavorites));
      } catch (err) {
        console.error("Error reading favorites:", err);
      }
    }
  }, []);

  const toggleFavorite = (donorId: string) => {
    setFavorites((prev) => {
      const updated = prev.includes(donorId)
        ? prev.filter((id) => id !== donorId)
        : [...prev, donorId];
      localStorage.setItem("favorite_donors", JSON.stringify(updated));
      showToast(
        prev.includes(donorId) 
          ? "প্রিয় তালিকা থেকে মুছে ফেলা হয়েছে।" 
          : "প্রিয় তালিকায় যোগ করা হয়েছে।", 
        "success"
      );
      return updated;
    });
  };

  const isFavorite = (donorId: string) => favorites.includes(donorId);

  const setView = (view: string) => {
    // If user is admin, force them to stay in the admin view. They cannot visit regular user pages.
    if (user?.isAdmin) {
      if (view !== "admin") {
        setCurrentView("admin");
        return;
      }
    }
    // If not logged in, prevent accessing protected features (profile-setup, requests)
    if (!user && (view === "profile-setup" || view === "requests")) {
      showToast("অনুগ্রহ করে প্রথমে লগইন অথবা সাইন আপ করুন! (Please login first or sign up)", "warning");
      setCurrentView("auth");
      return;
    }
    // Specific checks for admin view
    if (view === "admin") {
      if (!user) {
        setCurrentView("admin-login");
        return;
      } else if (!user.isAdmin) {
        showToast("দুঃখিত, এই পেজটি শুধুমাত্র অ্যাডমিনদের জন্য সংরক্ষিত।", "error");
        setCurrentView("home");
        return;
      }
    }
    // If in maintenance mode and user is not admin, prevent moving to other views
    if (systemSettings?.maintenanceMode && !user?.isAdmin && view !== "home" && view !== "support") {
      showToast("দুঃখিত, প্ল্যাটফর্মটি বর্তমানে রক্ষণাবেক্ষণের কাজ চলছে।", "warning");
      return;
    }
    setCurrentView(view);
  };

  const refreshUserProfile = async () => {
    if (!firebaseUser) return;
    try {
      const userDocRef = doc(db, "users", firebaseUser.uid);
      const userSnapshot = await getDoc(userDocRef);
      if (userSnapshot.exists()) {
        setUser(userSnapshot.data() as UserProfile);
      }
    } catch (error) {
      console.error("Error refreshing profile:", error);
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      setUser(null);
      setFirebaseUser(null);
      setCurrentView("home");
      showToast("সফলভাবে লগআউট করা হয়েছে।", "success");
    } catch (error) {
      showToast("লগআউট করতে সমস্যা হয়েছে। আবার চেষ্টা করুন।", "error");
    }
  };

  // Online Last Seen Simulation (Always return active / online for current, simulated statuses for others)
  const [onlineStatusText, setOnlineStatusText] = useState("এখন অনলাইনে");
  const updateOnlineStatus = () => {
    setOnlineStatusText("এখন অনলাইনে");
  };

  return (
    <AppContext.Provider
      value={{
        user,
        firebaseUser,
        loading,
        currentView,
        setView,
        toasts,
        showToast,
        removeToast,
        refreshUserProfile,
        logout,
        systemSettings,
        notifications,
        favorites,
        toggleFavorite,
        isFavorite,
        onlineStatusText,
        updateOnlineStatus
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return context;
};
