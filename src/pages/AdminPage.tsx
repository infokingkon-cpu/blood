import React, { useState, useEffect } from "react";
import { useApp } from "../contexts/AppContext";
import { 
  collection, 
  query, 
  getDocs, 
  doc, 
  setDoc,
  updateDoc, 
  deleteDoc, 
  addDoc, 
  onSnapshot, 
  Timestamp, 
  orderBy, 
  limit,
  where
} from "firebase/firestore";
import { db, auth } from "../firebase/config";
import { 
  ShieldCheck, 
  Users, 
  Heart, 
  FileText, 
  AlertTriangle, 
  Settings, 
  LogOut, 
  Search, 
  Filter, 
  UserMinus, 
  Slash, 
  UserCheck, 
  Volume2, 
  LifeBuoy, 
  MessageSquare,
  History,
  AlertOctagon,
  Wrench,
  ShieldAlert,
  User,
  CheckCircle,
  Unlock
} from "lucide-react";
import { motion } from "motion/react";
import { getApiUrl } from "../utils/api";

export const AdminPage: React.FC = () => {
  const { user, showToast, setView, systemSettings, logout } = useApp();
  const [activeTab, setActiveTab] = useState<"stats" | "users" | "requests" | "directory" | "reports" | "feedback" | "support" | "settings" | "logs" | "completed_donations">("stats");
  
  // Checking admin permission
  if (!user?.isAdmin) {
    return (
      <div className="max-w-md mx-auto text-center py-20 p-4">
        <div className="p-4 bg-red-50 text-red-500 rounded-3xl inline-block mb-4 border border-red-100">
          <ShieldAlert className="w-12 h-12" />
        </div>
        <h3 className="text-xl font-extrabold text-slate-800">অ্যাক্সেস অস্বীকৃত! 🛑</h3>
        <p className="text-slate-500 text-xs mt-1.5 leading-relaxed font-medium">
          দুঃখিত, এই পেজটি শুধুমাত্র Donate Blood অ্যাডমিনদের জন্য সংরক্ষিত। আপনার কাছে প্রয়োজনীয় অ্যাক্সেস রাইটস নেই।
        </p>
        <button
          onClick={() => setView("home")}
          className="mt-6 py-2 px-6 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs transition-all shadow-md"
        >
          হোমপেজে ফিরে যান
        </button>
      </div>
    );
  }

  // Admin states
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalDonors: 0,
    totalRequests: 0,
    totalVolunteers: 0,
    totalHospitals: 0,
    totalReports: 0,
    totalFeedback: 0,
    totalSupport: 0
  });

  const [usersList, setUsersList] = useState<any[]>([]);
  const [requestsList, setRequestsList] = useState<any[]>([]);
  const [donorPostsList, setDonorPostsList] = useState<any[]>([]);
  const [requestSubTab, setRequestSubTab] = useState<"blood" | "donor">("blood");
  const [hospitalsList, setHospitalsList] = useState<any[]>([]);
  const [volunteersList, setVolunteersList] = useState<any[]>([]);
  const [reportsList, setReportsList] = useState<any[]>([]);
  const [feedbackList, setFeedbackList] = useState<any[]>([]);
  const [supportList, setSupportList] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [completedDonationsList, setCompletedDonationsList] = useState<any[]>([]);
  
  const [loading, setLoading] = useState(false);
  
  // Search & Filter
  const [searchQuery, setSearchQuery] = useState("");
  const [filterBlood, setFilterBlood] = useState("");
  const [filterDistrict, setFilterDistrict] = useState("");
  const [filterRole, setFilterRole] = useState("");

  // Settings state
  const [regEnabled, setRegEnabled] = useState(systemSettings?.registrationEnabled ?? true);
  const [reqEnabled, setReqEnabled] = useState(systemSettings?.bloodRequestsEnabled ?? true);
  const [donEnabled, setDonEnabled] = useState(systemSettings?.donationsEnabled ?? true);
  const [noticeText, setNoticeText] = useState(systemSettings?.homepageNotice ?? "");
  const [maintenanceMode, setMaintenanceMode] = useState(systemSettings?.maintenanceMode ?? false);

  // Synchronize settings with database when loaded
  React.useEffect(() => {
    if (systemSettings) {
      setRegEnabled(systemSettings.registrationEnabled ?? true);
      setReqEnabled(systemSettings.bloodRequestsEnabled ?? true);
      setDonEnabled(systemSettings.donationsEnabled ?? true);
      setNoticeText(systemSettings.homepageNotice ?? "");
      setMaintenanceMode(systemSettings.maintenanceMode ?? false);
    }
  }, [systemSettings]);
  
  // Announcement publishing
  const [announcementMsg, setAnnouncementMsg] = useState("");

  // Custom Confirmation Modal state
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void | Promise<void>;
  }>({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => {}
  });

  const triggerConfirm = (title: string, message: string, onConfirm: () => void | Promise<void>) => {
    setConfirmModal({
      isOpen: true,
      title,
      message,
      onConfirm
    });
  };

  // Fetch admin stats & collections
  const loadStats = async () => {
    try {
      const uSnap = await getDocs(collection(db, "users"));
      const rSnap = await getDocs(collection(db, "blood_requests"));
      const vSnap = await getDocs(collection(db, "volunteers"));
      const hSnap = await getDocs(collection(db, "hospitals"));
      const repSnap = await getDocs(collection(db, "reports"));
      const fSnap = await getDocs(collection(db, "feedback"));
      const sSnap = await getDocs(collection(db, "support_messages"));

      let usersCount = uSnap.size;
      let donorsCount = 0;
      uSnap.forEach((doc) => {
        const u = doc.data();
        if (u.role === "donor" || u.role === "both") donorsCount++;
      });

      setStats({
        totalUsers: usersCount,
        totalDonors: donorsCount,
        totalRequests: rSnap.size,
        totalVolunteers: vSnap.size,
        totalHospitals: hSnap.size,
        totalReports: repSnap.size,
        totalFeedback: fSnap.size,
        totalSupport: sSnap.size
      });
    } catch (err) {
      console.error("Failed to load admin stats:", err);
    }
  };

  const loadUsers = async () => {
    setLoading(true);
    try {
      const snap = await getDocs(collection(db, "users"));
      const list: any[] = [];
      snap.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() });
      });
      setUsersList(list);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadRequests = async () => {
    setLoading(true);
    try {
      const snap = await getDocs(query(collection(db, "blood_requests"), orderBy("createdAt", "desc")));
      const list: any[] = [];
      snap.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() });
      });
      setRequestsList(list);

      const donorSnap = await getDocs(query(collection(db, "donor_posts"), orderBy("createdAt", "desc")));
      const donorList: any[] = [];
      donorSnap.forEach((doc) => {
        donorList.push({ id: doc.id, ...doc.data() });
      });
      setDonorPostsList(donorList);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadHospitals = async () => {
    try {
      const snap = await getDocs(query(collection(db, "hospitals"), orderBy("createdAt", "desc")));
      const list: any[] = [];
      snap.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() });
      });
      setHospitalsList(list);
    } catch (err) {
      console.error(err);
    }
  };

  const loadVolunteers = async () => {
    try {
      const snap = await getDocs(query(collection(db, "volunteers"), orderBy("createdAt", "desc")));
      const list: any[] = [];
      snap.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() });
      });
      setVolunteersList(list);
    } catch (err) {
      console.error(err);
    }
  };

  const loadReports = async () => {
    try {
      const snap = await getDocs(query(collection(db, "reports"), orderBy("createdAt", "desc")));
      const list: any[] = [];
      snap.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() });
      });
      setReportsList(list);
    } catch (err) {
      console.error(err);
    }
  };

  const loadFeedback = async () => {
    try {
      const snap = await getDocs(query(collection(db, "feedback"), orderBy("createdAt", "desc")));
      const list: any[] = [];
      snap.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() });
      });
      setFeedbackList(list);
    } catch (err) {
      console.error(err);
    }
  };

  const loadSupport = async () => {
    try {
      const snap = await getDocs(query(collection(db, "support_messages"), orderBy("createdAt", "desc")));
      const list: any[] = [];
      snap.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() });
      });
      setSupportList(list);
    } catch (err) {
      console.error(err);
    }
  };

  const loadLogs = async () => {
    try {
      const snap = await getDocs(query(collection(db, "admin_logs"), orderBy("createdAt", "desc"), limit(50)));
      const list: any[] = [];
      snap.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() });
      });
      setAuditLogs(list);
    } catch (err) {
      console.error(err);
    }
  };

  const loadCompletedDonations = async () => {
    setLoading(true);
    try {
      const snap = await getDocs(query(collection(db, "completed_donations"), orderBy("createdAt", "desc")));
      const list: any[] = [];
      snap.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() });
      });
      setCompletedDonationsList(list);
    } catch (err) {
      console.error(err);
      showToast("রক্তদান সম্পন্ন তালিকা লোড করতে সমস্যা হয়েছে।", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCompletedDonation = async (id: string) => {
    if (!window.confirm("আপনি কি নিশ্চিতভাবে এই সম্পন্ন রক্তদান রেকর্ডটি মুছে ফেলতে চান? এটি ডিলিট করলে রক্তদাতার লক রিমুভ হবে না।")) return;
    try {
      await deleteDoc(doc(db, "completed_donations", id));
      showToast("সম্পন্ন রক্তদান রেকর্ড মুছে ফেলা হয়েছে।", "success");
      loadCompletedDonations();
    } catch (err) {
      console.error(err);
      showToast("রেকর্ড মুছে ফেলতে ব্যর্থ হয়েছে।", "error");
    }
  };

  useEffect(() => {
    loadStats();
    if (activeTab === "users") loadUsers();
    if (activeTab === "requests") loadRequests();
    if (activeTab === "directory") {
      loadHospitals();
      loadVolunteers();
    }
    if (activeTab === "reports") loadReports();
    if (activeTab === "feedback") loadFeedback();
    if (activeTab === "support") loadSupport();
    if (activeTab === "logs") loadLogs();
    if (activeTab === "completed_donations") loadCompletedDonations();
  }, [activeTab]);

  // Log admin action helper
  const logAdminAction = async (action: string, targetUserId: string, details: string) => {
    try {
      await addDoc(collection(db, "admin_logs"), {
        adminId: user.uid,
        adminName: user.fullName,
        action,
        targetUserId,
        details,
        createdAt: Timestamp.now()
      });
    } catch (err) {
      console.error("Admin Log Write Error:", err);
    }
  };

  // User Actions: Block
  const handleBlockUser = async (userId: string, isBlocked: boolean) => {
    try {
      await updateDoc(doc(db, "users", userId), { blocked: isBlocked });
      showToast(isBlocked ? "ইউজার অ্যাকাউন্টটি ব্লক করা হয়েছে।" : "ইউজার অ্যাকাউন্টটি আনব্লক করা হয়েছে।", "success");
      await logAdminAction(isBlocked ? "Block User" : "Unblock User", userId, `User block state set to ${isBlocked}`);
      loadUsers();
    } catch (err) {
      showToast("অ্যাকশন ব্যর্থ হয়েছে। দয়া করে আবার চেষ্টা করুন।", "error");
    }
  };

  // User Actions: Unlock Donation Lock (3-month lockout removal)
  const handleUnlockUserDonation = async (userId: string, fullName: string) => {
    if (!window.confirm(`আপনি কি নিশ্চিতভাবে ${fullName} এর ৩ মাসের রক্তদান লকটি এখনই খুলে দিতে চান? লক খুলে দিলে তিনি অবিলম্বে আবার রক্ত দিতে পারবেন এবং নতুন পোস্ট বা রিকোয়েস্ট তৈরি করতে পারবেন।`)) return;
    try {
      await updateDoc(doc(db, "users", userId), { 
        bloodDonationLockedUntil: null 
      });
      showToast(`${fullName} এর রক্তদান লক সফলভাবে খুলে দেওয়া হয়েছে।`, "success");
      await logAdminAction("Unlock Donation Cooldown", userId, `Removed blood donation lock and cooldown timer early for ${fullName}`);
      loadUsers();
    } catch (err) {
      console.error(err);
      showToast("লক খুলতে ব্যর্থ হয়েছে।", "error");
    }
  };

  // User Actions: Permanent Ban Phone
  const handleBanPhone = (userId: string, phone: string) => {
    triggerConfirm(
      "মোবাইল নম্বর স্থায়ীভাবে ব্যান করুন",
      `আপনি কি নিশ্চিতভাবে এই মোবাইল নম্বরটি (${phone}) স্থায়ীভাবে নিষিদ্ধ করতে চান? এর অ্যাকাউন্ট এবং অথেনটিকেশন মুছে দেওয়া হবে।`,
      async () => {
        try {
          // 1. Delete user from Firebase Auth first
          const idToken = await auth.currentUser?.getIdToken();
          if (idToken) {
            await fetch(getApiUrl("/api/delete-auth-user"), {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${idToken}`
              },
              body: JSON.stringify({ uid: userId })
            });
          }

          // 2. Delete user document from firestore
          await deleteDoc(doc(db, "users", userId));

          // 3. Save phone number inside banned_phone_numbers collection
          await setDoc(doc(db, "banned_phone_numbers", phone), {
            phone,
            reason: "Admin permanently banned user due to violation/fraud complaints",
            createdAt: Timestamp.now()
          });

          showToast("মোবাইল নম্বরটি স্থায়ীভাবে নিষিদ্ধ এবং অ্যাকাউন্ট মুছে ফেলা হয়েছে।", "success");
          await logAdminAction("Ban Phone", userId, `Permanently banned phone: ${phone}`);
          loadUsers();
          loadStats();
        } catch (err) {
          console.error(err);
          showToast("নিষিদ্ধ করতে সমস্যা হয়েছে। আবার চেষ্টা করুন।", "error");
        }
      }
    );
  };

  // Close Report
  const handleCloseReport = async (reportId: string) => {
    try {
      await updateDoc(doc(db, "reports", reportId), { status: "closed" });
      showToast("রিপোর্টটি বন্ধ করা হয়েছে।", "success");
      loadReports();
    } catch (err) {
      showToast("সমস্যা হয়েছে। আবার চেষ্টা করুন।", "error");
    }
  };

  // User Actions: Delete User Account (With full cascading cleanup)
  const handleDeleteUser = (userId: string, name: string, phone?: string) => {
    triggerConfirm(
      "ইউজার অ্যাকাউন্ট ডিলেট করুন",
      `আপনি কি নিশ্চিতভাবে এই ইউজার অ্যাকাউন্টটি (${name}) এবং এর সাথে সম্পর্কিত সকল রক্তের আবেদন, সরাসরি অনুরোধ, ফিডব্যাক, নোটিফিকেশন ও অন্যান্য তথ্য ডিলেট করতে চান?`,
      async () => {
        try {
          // 1. Delete user from Firebase Auth first
          const idToken = await auth.currentUser?.getIdToken();
          if (idToken) {
            await fetch(getApiUrl("/api/delete-auth-user"), {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${idToken}`
              },
              body: JSON.stringify({ uid: userId })
            });
          }

          // 2. Cascade delete related collections from Firestore
          
          // A. Delete blood_requests where userId == userId
          const requestsSnap = await getDocs(query(collection(db, "blood_requests"), where("userId", "==", userId)));
          for (const d of requestsSnap.docs) {
            await deleteDoc(d.ref);
          }

          // B. Delete direct_requests where requesterId == userId OR donorId == userId
          const directReq1 = await getDocs(query(collection(db, "direct_requests"), where("requesterId", "==", userId)));
          for (const d of directReq1.docs) {
            await deleteDoc(d.ref);
          }
          const directReq2 = await getDocs(query(collection(db, "direct_requests"), where("donorId", "==", userId)));
          for (const d of directReq2.docs) {
            await deleteDoc(d.ref);
          }

          // C. Delete donor_posts where userId == userId
          const donorPostsSnap = await getDocs(query(collection(db, "donor_posts"), where("userId", "==", userId)));
          for (const d of donorPostsSnap.docs) {
            await deleteDoc(d.ref);
          }

          // D. Delete notifications where userId == userId
          const notificationsSnap = await getDocs(query(collection(db, "notifications"), where("userId", "==", userId)));
          for (const d of notificationsSnap.docs) {
            await deleteDoc(d.ref);
          }

          // E. Delete donation_history where donorId == userId
          const donationHistorySnap = await getDocs(query(collection(db, "donation_history"), where("donorId", "==", userId)));
          for (const d of donationHistorySnap.docs) {
            await deleteDoc(d.ref);
          }

          // F. Delete reports where reporterId == userId OR reportedUserId == userId
          const reports1 = await getDocs(query(collection(db, "reports"), where("reporterId", "==", userId)));
          for (const d of reports1.docs) {
            await deleteDoc(d.ref);
          }
          const reports2 = await getDocs(query(collection(db, "reports"), where("reportedUserId", "==", userId)));
          for (const d of reports2.docs) {
            await deleteDoc(d.ref);
          }

          // G. Delete feedback where userId == userId
          const feedbackSnap = await getDocs(query(collection(db, "feedback"), where("userId", "==", userId)));
          for (const d of feedbackSnap.docs) {
            await deleteDoc(d.ref);
          }

          // H. Delete support_messages where phone == phone
          if (phone) {
            const supportSnap = await getDocs(query(collection(db, "support_messages"), where("phone", "==", phone)));
            for (const d of supportSnap.docs) {
              await deleteDoc(d.ref);
            }
          }

          // 3. Delete main user document from firestore
          await deleteDoc(doc(db, "users", userId));

          showToast("ইউজার অ্যাকাউন্ট এবং এর সকল তথ্য সফলভাবে ডিলেট করা হয়েছে।", "success");
          await logAdminAction("Delete User", userId, `Deleted user account and all cascade data: ${name}`);
          loadUsers();
          loadStats();
        } catch (err) {
          console.error(err);
          showToast("ডিলেট করতে সমস্যা হয়েছে। আবার চেষ্টা করুন।", "error");
        }
      }
    );
  };

  // Delete Blood Request
  const handleDeleteRequest = (requestId: string, patientName: string) => {
    triggerConfirm(
      "রক্তের আবেদন ডিলেট করুন",
      `আপনি কি নিশ্চিতভাবে এই রক্তের আবেদনটি (রোগী: ${patientName}) ডিলেট করতে চান?`,
      async () => {
        try {
          await deleteDoc(doc(db, "blood_requests", requestId));
          showToast("রক্তের আবেদনটি সফলভাবে ডিলেট করা হয়েছে।", "success");
          await logAdminAction("Delete Blood Request", "", `Deleted blood request for: ${patientName} (${requestId})`);
          loadRequests();
          loadStats();
        } catch (err) {
          showToast("ডিলেট করতে সমস্যা হয়েছে।", "error");
        }
      }
    );
  };

  // Delete Donor Post
  const handleDeleteDonorPost = (postId: string, donorName: string) => {
    triggerConfirm(
      "রক্তদাতা পোস্ট ডিলেট করুন",
      `আপনি কি নিশ্চিতভাবে এই রক্তদাতা পোস্টটি (দাতা: ${donorName}) ডিলেট করতে চান?`,
      async () => {
        try {
          await deleteDoc(doc(db, "donor_posts", postId));
          showToast("রক্তদাতা পোস্টটি সফলভাবে ডিলেট করা হয়েছে।", "success");
          await logAdminAction("Delete Donor Post", "", `Deleted donor post for: ${donorName} (${postId})`);
          loadRequests();
          loadStats();
        } catch (err) {
          showToast("ডিলেট করতে সমস্যা হয়েছে।", "error");
        }
      }
    );
  };

  // Delete Hospital
  const handleDeleteHospital = (hospitalId: string, name: string) => {
    triggerConfirm(
      "হাসপাতাল/ব্লাড ব্যাংক ডিলেট করুন",
      `আপনি কি নিশ্চিতভাবে এই হাসপাতাল/ব্লাড ব্যাংকটি (${name}) ডিলেট করতে চান?`,
      async () => {
        try {
          await deleteDoc(doc(db, "hospitals", hospitalId));
          showToast("হাসপাতাল/ব্লাড ব্যাংকটি সফলভাবে ডিলেট করা হয়েছে।", "success");
          await logAdminAction("Delete Hospital", "", `Deleted hospital: ${name}`);
          loadHospitals();
          loadStats();
        } catch (err) {
          showToast("ডিলেট করতে সমস্যা হয়েছে।", "error");
        }
      }
    );
  };

  // Delete Volunteer
  const handleDeleteVolunteer = (volunteerId: string, name: string) => {
    triggerConfirm(
      "স্বেচ্ছাসেবক ডিলেট করুন",
      `আপনি কি নিশ্চিতভাবে এই স্বেচ্ছাসেবকটি (${name}) ডিলেট করতে চান?`,
      async () => {
        try {
          await deleteDoc(doc(db, "volunteers", volunteerId));
          showToast("স্বেচ্ছাসেবকটি সফলভাবে ডিলেট করা হয়েছে।", "success");
          await logAdminAction("Delete Volunteer", "", `Deleted volunteer: ${name}`);
          loadVolunteers();
          loadStats();
        } catch (err) {
          showToast("ডিলেট করতে সমস্যা হয়েছে।", "error");
        }
      }
    );
  };

  // Delete Feedback
  const handleDeleteFeedback = (feedbackId: string) => {
    triggerConfirm(
      "ফিডব্যাক ডিলেট করুন",
      "আপনি কি নিশ্চিতভাবে এই ফিডব্যাকটি ডিলেট করতে চান?",
      async () => {
        try {
          await deleteDoc(doc(db, "feedback", feedbackId));
          showToast("ফিডব্যাকটি সফলভাবে ডিলেট করা হয়েছে।", "success");
          loadFeedback();
          loadStats();
        } catch (err) {
          showToast("ডিলেট করতে সমস্যা হয়েছে।", "error");
        }
      }
    );
  };

  // Delete Support ticket
  const handleDeleteSupport = (supportId: string) => {
    triggerConfirm(
      "সাপোর্ট টিকিট ডিলেট করুন",
      "আপনি কি নিশ্চিতভাবে এই সাপোর্ট টিকিটটি ডিলেট করতে চান?",
      async () => {
        try {
          await deleteDoc(doc(db, "support_messages", supportId));
          showToast("সাপোর্ট টিকিটটি সফলভাবে ডিলেট করা হয়েছে।", "success");
          loadSupport();
          loadStats();
        } catch (err) {
          showToast("ডিলেট করতে সমস্যা হয়েছে।", "error");
        }
      }
    );
  };

  // Delete Report
  const handleDeleteReport = (reportId: string) => {
    triggerConfirm(
      "রিপোর্ট ডিলেট করুন",
      "আপনি কি নিশ্চিতভাবে এই রিপোর্টটি ডিলেট করতে চান?",
      async () => {
        try {
          await deleteDoc(doc(db, "reports", reportId));
          showToast("রিপোর্টটি সফলভাবে ডিলেট করা হয়েছে।", "success");
          loadReports();
          loadStats();
        } catch (err) {
          showToast("ডিলেট করতে সমস্যা হয়েছে।", "error");
        }
      }
    );
  };

  // Update System Settings
  const handleUpdateSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await setDoc(doc(db, "settings", "global"), {
        id: "global",
        registrationEnabled: regEnabled,
        bloodRequestsEnabled: reqEnabled,
        donationsEnabled: donEnabled,
        homepageNotice: noticeText,
        maintenanceMode
      });
      showToast("সিস্টেম সেটিংস সফলভাবে আপডেট করা হয়েছে।", "success");
    } catch (err) {
      showToast("আপডেট করতে ব্যর্থ হয়েছে।", "error");
    }
  };

  // Publish Announcement
  const handlePublishAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!announcementMsg.trim()) {
      showToast("ঘোষণা খালি হওয়া যাবে না।", "warning");
      return;
    }

    try {
      await addDoc(collection(db, "announcements"), {
        message: announcementMsg.trim(),
        active: true,
        createdAt: Timestamp.now()
      });
      showToast("নতুন ঘোষণা সফলভাবে হোমপেজে প্রকাশিত হয়েছে।", "success");
      setAnnouncementMsg("");
    } catch (err) {
      showToast("ঘোষণা প্রকাশ করতে সমস্যা হয়েছে।", "error");
    }
  };

  // Filtering users
  const filteredUsers = usersList.filter((item) => {
    const textMatch = searchQuery === "" || 
      item.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) || 
      item.phone?.includes(searchQuery) ||
      item.uid?.includes(searchQuery);
    
    if (!textMatch) return false;
    if (filterBlood && item.bloodGroup !== filterBlood) return false;
    if (filterDistrict && !item.district?.toLowerCase().includes(filterDistrict.toLowerCase())) return false;
    
    if (filterRole) {
      if (filterRole === "donor" && item.role !== "donor") return false;
      if (filterRole === "receiver" && item.role !== "receiver") return false;
    }
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto p-4 space-y-6 md:py-8">
      
      {/* Admin Panel Header */}
      <div className="bg-slate-900 text-white p-6 md:p-8 rounded-3xl flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-red-500/20 text-red-400 rounded-2xl border border-red-500/30">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-2xl font-black tracking-tight">Donate Blood অ্যাডমিন কন্ট্রোল 🛡️</h2>
            <p className="text-slate-400 text-xs md:text-sm mt-1 font-medium">প্ল্যাটফর্মের সর্বজনীন তদারকি, ইউজার মডারেশন এবং সিস্টেম সেটিংস</p>
          </div>
        </div>

        <button
          onClick={logout}
          className="py-2.5 px-5 bg-white/10 hover:bg-white/20 text-white border border-white/10 rounded-2xl text-xs font-bold flex items-center gap-1.5 transition-all self-start md:self-auto"
        >
          <LogOut className="w-4 h-4" /> মডারেটর ড্যাশবোর্ড থেকে বের হোন
        </button>
      </div>

      {/* Admin Panel Sidebar/Navigation Tabs */}
      <div className="flex flex-wrap gap-2 border-b pb-3 border-slate-100">
        <button
          onClick={() => setActiveTab("stats")}
          className={`py-2 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === "stats" ? "bg-red-500 text-white shadow-sm" : "bg-slate-50 text-slate-600 hover:bg-slate-100"
          }`}
        >
          <Users className="w-4 h-4 inline mr-1" /> পরিসংখ্যান (Stats)
        </button>
        <button
          onClick={() => setActiveTab("users")}
          className={`py-2 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === "users" ? "bg-red-500 text-white shadow-sm" : "bg-slate-50 text-slate-600 hover:bg-slate-100"
          }`}
        >
          <Users className="w-4 h-4 inline mr-1" /> ইউজার তালিকা
        </button>
        <button
          onClick={() => setActiveTab("requests")}
          className={`py-2 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === "requests" ? "bg-red-500 text-white shadow-sm" : "bg-slate-50 text-slate-600 hover:bg-slate-100"
          }`}
        >
          <Heart className="w-4 h-4 inline mr-1 animate-pulse" /> রক্তের আবেদনসমূহ ({stats.totalRequests})
        </button>
        <button
          onClick={() => setActiveTab("completed_donations")}
          className={`py-2 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === "completed_donations" ? "bg-red-500 text-white shadow-sm" : "bg-slate-50 text-slate-600 hover:bg-slate-100"
          }`}
        >
          <CheckCircle className="w-4 h-4 inline mr-1" /> সম্পন্ন রক্তদান সমূহ ({completedDonationsList.length})
        </button>
        <button
          onClick={() => setActiveTab("directory")}
          className={`py-2 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === "directory" ? "bg-red-500 text-white shadow-sm" : "bg-slate-50 text-slate-600 hover:bg-slate-100"
          }`}
        >
          <ShieldCheck className="w-4 h-4 inline mr-1" /> হাসপাতাল ও স্বেচ্ছাসেবক ({stats.totalHospitals + stats.totalVolunteers})
        </button>
        <button
          onClick={() => setActiveTab("reports")}
          className={`py-2 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === "reports" ? "bg-red-500 text-white shadow-sm" : "bg-slate-50 text-slate-600 hover:bg-slate-100"
          }`}
        >
          <AlertTriangle className="w-4 h-4 inline mr-1" /> রিপোর্ট তালিকা ({stats.totalReports})
        </button>
        <button
          onClick={() => setActiveTab("feedback")}
          className={`py-2 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === "feedback" ? "bg-red-500 text-white shadow-sm" : "bg-slate-50 text-slate-600 hover:bg-slate-100"
          }`}
        >
          <MessageSquare className="w-4 h-4 inline mr-1" /> মতামত ({stats.totalFeedback})
        </button>
        <button
          onClick={() => setActiveTab("support")}
          className={`py-2 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === "support" ? "bg-red-500 text-white shadow-sm" : "bg-slate-50 text-slate-600 hover:bg-slate-100"
          }`}
        >
          <LifeBuoy className="w-4 h-4 inline mr-1" /> সাপোর্ট টিকিট ({stats.totalSupport})
        </button>
        <button
          onClick={() => setActiveTab("settings")}
          className={`py-2 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === "settings" ? "bg-red-500 text-white shadow-sm" : "bg-slate-50 text-slate-600 hover:bg-slate-100"
          }`}
        >
          <Settings className="w-4 h-4 inline mr-1" /> সেটিংস ও নোটিশ
        </button>
        <button
          onClick={() => setActiveTab("logs")}
          className={`py-2 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === "logs" ? "bg-red-500 text-white shadow-sm" : "bg-slate-50 text-slate-600 hover:bg-slate-100"
          }`}
        >
          <History className="w-4 h-4 inline mr-1" /> অডিট লগ (Logs)
        </button>
      </div>

      {/* RENDER ACTIVE TAB */}
      
      {activeTab === "stats" && (
        /* GENERAL STATS PANEL */
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between">
            <div>
              <span className="text-slate-400 text-[11px] font-bold block uppercase tracking-wider">মোট নিবন্ধিত ইউজার</span>
              <span className="text-3xl font-black text-slate-800">{stats.totalUsers}</span>
            </div>
            <div className="p-4 bg-red-50 text-red-500 rounded-2xl"><Users className="w-6 h-6" /></div>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between">
            <div>
              <span className="text-slate-400 text-[11px] font-bold block uppercase tracking-wider">মোট রক্তদাতা</span>
              <span className="text-3xl font-black text-slate-800">{stats.totalDonors}</span>
            </div>
            <div className="p-4 bg-emerald-50 text-emerald-500 rounded-2xl"><Heart className="w-6 h-6" /></div>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between">
            <div>
              <span className="text-slate-400 text-[11px] font-bold block uppercase tracking-wider">রক্তের আবেদনসমূহ</span>
              <span className="text-3xl font-black text-slate-800">{stats.totalRequests}</span>
            </div>
            <div className="p-4 bg-blue-50 text-blue-500 rounded-2xl"><FileText className="w-6 h-6" /></div>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between">
            <div>
              <span className="text-slate-400 text-[11px] font-bold block uppercase tracking-wider">স্বেচ্ছাসেবক ও হাসপাতাল</span>
              <span className="text-3xl font-black text-slate-800">{stats.totalVolunteers + stats.totalHospitals}</span>
            </div>
            <div className="p-4 bg-amber-50 text-amber-500 rounded-2xl"><ShieldCheck className="w-6 h-6" /></div>
          </div>

          {/* Quick Notice Panel */}
          <div className="md:col-span-4 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
            <h3 className="font-extrabold text-slate-800 text-sm mb-3">হোমপেজে জরুরি নোটিশ বা এনাউন্সমেন্ট</h3>
            <form onSubmit={handlePublishAnnouncement} className="flex gap-3">
              <input
                type="text"
                required
                placeholder="যেমন: আগামী শুক্রবার মিরপুর ব্লাড ডোনেশন ক্যাম্প অনুষ্ঠিত হবে। বিনামূল্যে রক্তদান করুন।"
                value={announcementMsg}
                onChange={(e) => setAnnouncementMsg(e.target.value)}
                className="flex-1 p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-red-500 text-slate-800"
              />
              <button
                type="submit"
                className="py-2.5 px-6 bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-md"
              >
                <Volume2 className="w-4 h-4" /> ঘোষণা প্রকাশ করুন
              </button>
            </form>
          </div>
        </div>
      )}

      {activeTab === "users" && (
        /* USER LIST / MODERATION */
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden space-y-4 p-6">
          {/* Filters Row */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                <Search className="w-4 h-4" />
              </span>
              <input
                type="text"
                placeholder="নাম বা মোবাইল নম্বর খুঁজুন..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-red-500"
              />
            </div>

            <select
              value={filterBlood}
              onChange={(e) => setFilterBlood(e.target.value)}
              className="p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none"
            >
              <option value="">রক্তের গ্রুপ (সকল)</option>
              {["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"].map((g) => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>

            <input
              type="text"
              placeholder="জেলা লিখুন (যেমন: ঢাকা)..."
              value={filterDistrict}
              onChange={(e) => setFilterDistrict(e.target.value)}
              className="p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none"
            />

            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none"
            >
              <option value="">রোল (সকল)</option>
              <option value="donor">রক্তদাতা</option>
              <option value="receiver">গ্রহীতা</option>
            </select>
          </div>

          {/* Table Container */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50 text-slate-400 font-bold uppercase tracking-wider">
                  <th className="p-4">নাম</th>
                  <th className="p-4">মোবাইল নম্বর</th>
                  <th className="p-4">গ্রুপ</th>
                  <th className="p-4">এলাকা</th>
                  <th className="p-4">স্ট্যাটাস</th>
                  <th className="p-4 text-center">অ্যাকশন</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 text-slate-700 font-medium">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="text-center p-8 text-slate-400">লোডিং...</td>
                  </tr>
                ) : filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center p-8 text-slate-400">কোন ইউজার পাওয়া যায়নি।</td>
                  </tr>
                ) : (
                  filteredUsers.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50/50">
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400">
                            {u.profilePicture ? (
                              <img src={u.profilePicture} alt="" className="w-8 h-8 rounded-full object-cover" />
                            ) : (
                              <User className="w-4 h-4 text-slate-400" />
                            )}
                          </div>
                          <div>
                            <span className="font-bold text-slate-800">{u.fullName}</span>
                            <span className="text-[10px] text-slate-400 block uppercase font-bold tracking-wider">{u.role}</span>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 font-bold">
                        <div>{u.phone}</div>
                        {u.additionalPhones && u.additionalPhones.map((p: string, idx: number) => (
                          <div key={idx} className="text-[10px] text-slate-500 font-semibold">{p} (অতিরিক্ত)</div>
                        ))}
                      </td>
                      <td className="p-4">
                        <span className="inline-flex py-0.5 px-2 bg-red-100 text-red-700 rounded-full font-bold">
                          {u.bloodGroup}
                        </span>
                      </td>
                      <td className="p-4">{u.upazila}, {u.district}</td>
                      <td className="p-4 space-y-1">
                        {u.blocked ? (
                          <span className="text-red-500 bg-red-50 px-2 py-0.5 rounded border border-red-100 text-[10px] font-bold block text-center">অ্যাকাউন্ট ব্লকড</span>
                        ) : (
                          <span className="text-emerald-500 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100 text-[10px] font-bold block text-center">সক্রিয়</span>
                        )}
                        {u.bloodDonationLockedUntil && u.bloodDonationLockedUntil.toDate && new Date(u.bloodDonationLockedUntil.toDate()) > new Date() && (
                          <span className="text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-100 text-[10px] font-bold block text-center">
                            লকড: {new Date(u.bloodDonationLockedUntil.toDate()).toLocaleDateString("bn-BD")}
                          </span>
                        )}
                      </td>
                      <td className="p-4">
                        <div className="flex justify-center gap-1 flex-wrap">
                          {u.blocked ? (
                            <button
                              onClick={() => handleBlockUser(u.id, false)}
                              className="py-1 px-2.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded border border-emerald-100 font-bold text-[10px] cursor-pointer"
                            >
                              আনব্লক
                            </button>
                          ) : (
                            <button
                              onClick={() => handleBlockUser(u.id, true)}
                              className="py-1 px-2.5 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded border border-rose-100 font-bold text-[10px] cursor-pointer"
                            >
                              ব্লক করুন
                            </button>
                          )}
                          {u.bloodDonationLockedUntil && u.bloodDonationLockedUntil.toDate && new Date(u.bloodDonationLockedUntil.toDate()) > new Date() && (
                            <button
                              onClick={() => handleUnlockUserDonation(u.id, u.fullName)}
                              className="py-1 px-2 bg-amber-500 hover:bg-amber-600 text-white rounded font-bold text-[10px] flex items-center gap-0.5 cursor-pointer"
                            >
                              <Unlock className="w-3 h-3" /> লক মুক্ত করুন
                            </button>
                          )}
                          <button
                            onClick={() => handleBanPhone(u.id, u.phone)}
                            className="py-1 px-2.5 bg-slate-950 text-white hover:bg-slate-900 rounded font-bold text-[10px] flex items-center gap-0.5 cursor-pointer"
                          >
                            <AlertOctagon className="w-3 h-3" /> ব্যান
                          </button>
                          <button
                            onClick={() => handleDeleteUser(u.id, u.fullName, u.phone)}
                            className="py-1 px-2.5 bg-red-500 text-white hover:bg-red-600 rounded font-bold text-[10px] cursor-pointer"
                          >
                            ডিলেট
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === "reports" && (
        /* REPORTS QUEUE */
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 space-y-4">
          <h3 className="font-extrabold text-slate-800 text-sm">অভিযোগ ও রিপোর্ট তালিকা</h3>
          {reportsList.length === 0 ? (
            <p className="text-slate-400 text-center py-8">কোন অভিযোগ পাওয়া যায়নি।</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {reportsList.map((item) => (
                <div key={item.id} className="border border-slate-100 p-5 rounded-2xl space-y-3 bg-slate-50/50">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-xs font-bold text-rose-500 block">অভিযোগের কারণ: {item.reason}</span>
                      <span className="text-[10px] text-slate-400">রিপোর্টকারী আইডি: {item.reporterId}</span>
                    </div>
                    {item.status === "pending" ? (
                      <span className="bg-amber-50 border border-amber-200 text-amber-700 text-[10px] font-bold px-2 py-0.5 rounded-full">তদন্তধীন</span>
                    ) : (
                      <span className="bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded-full">নিষ্পত্তি সম্পন্ন</span>
                    )}
                  </div>
                  
                  <div className="p-3 bg-white rounded-xl border border-slate-100 text-xs text-slate-700 font-medium">
                    অভিযুক্ত ইউজার আইডি: <strong className="text-slate-900">{item.reportedUserId}</strong>
                  </div>

                  <div className="flex justify-end gap-2 mt-2">
                    {item.status === "pending" && (
                      <button
                        onClick={() => handleCloseReport(item.id)}
                        className="py-1 px-3.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg text-[10px] font-bold border border-emerald-100 cursor-pointer"
                      >
                        অভিযোগ বন্ধ করুন
                      </button>
                    )}
                    <button
                      onClick={() => handleDeleteReport(item.id)}
                      className="py-1 px-3.5 bg-red-50 hover:bg-red-100 text-red-700 rounded-lg text-[10px] font-bold border border-red-100 cursor-pointer"
                    >
                      রিপোর্ট ডিলেট
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === "feedback" && (
        /* FEEDBACK QUEUE */
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 space-y-4">
          <h3 className="font-extrabold text-slate-800 text-sm">ইউজার মতামত ও অভিযোগ</h3>
          {feedbackList.length === 0 ? (
            <p className="text-slate-400 text-center py-8">কোন মতামত বা ফিডব্যাক পাওয়া যায়নি।</p>
          ) : (
            <div className="space-y-4">
              {feedbackList.map((item) => (
                <div key={item.id} className="border border-slate-100 p-5 rounded-2xl bg-slate-50/20">
                  <div className="flex justify-between items-center text-xs mb-2">
                    <span className="font-bold text-slate-700">প্রেরক: {item.userName || "ইউজার"} ({item.userPhone})</span>
                    <div className="flex items-center gap-2">
                      <span className="bg-indigo-50 text-indigo-700 border border-indigo-100 text-[10px] font-bold rounded-lg px-2 py-0.5 uppercase tracking-wider">{item.type}</span>
                      <button
                        onClick={() => handleDeleteFeedback(item.id)}
                        className="text-red-500 hover:text-red-600 font-bold text-[10px] bg-red-50 border border-red-100 px-2 py-0.5 rounded-lg cursor-pointer"
                      >
                        ডিলেট
                      </button>
                    </div>
                  </div>
                  <p className="text-slate-600 text-xs font-medium leading-relaxed bg-white p-3.5 rounded-xl border border-slate-100">{item.message}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === "support" && (
        /* SUPPORT QUEUES */
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 space-y-4">
          <h3 className="font-extrabold text-slate-800 text-sm">সাপোর্ট টিকিট সমূহ</h3>
          {supportList.length === 0 ? (
            <p className="text-slate-400 text-center py-8">কোন সাপোর্ট টিকিট বা মেসেজ পাওয়া যায়নি।</p>
          ) : (
            <div className="space-y-4">
              {supportList.map((item) => (
                <div key={item.id} className="border border-slate-100 p-5 rounded-2xl bg-slate-50/20">
                  <div className="flex justify-between items-center text-xs mb-2">
                    <span className="font-bold text-slate-700">টিকিট প্রেরক: {item.name} ({item.phone})</span>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-slate-400">{item.createdAt?.toDate ? new Date(item.createdAt.toDate()).toLocaleDateString("bn-BD") : "আজ"}</span>
                      <button
                        onClick={() => handleDeleteSupport(item.id)}
                        className="text-red-500 hover:text-red-600 font-bold text-[10px] bg-red-50 border border-red-100 px-2 py-0.5 rounded-lg cursor-pointer"
                      >
                        ডিলেট
                      </button>
                    </div>
                  </div>
                  <h4 className="font-bold text-slate-800 text-xs mb-1">বিষয়: {item.subject}</h4>
                  <p className="text-slate-600 text-xs font-medium leading-relaxed bg-white p-3.5 rounded-xl border border-slate-100">{item.message}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === "requests" && (
        /* REQUESTS & DONOR POSTS MODERATION */
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 space-y-5">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b pb-3 border-slate-100">
            <div className="space-y-2">
              <h3 className="font-extrabold text-slate-800 text-sm flex items-center gap-2">আবেদন ও রিকোয়েস্ট ম্যানেজমেন্ট 📋</h3>
              <div className="flex gap-2">
                <button
                  onClick={() => setRequestSubTab("blood")}
                  className={`py-1 px-3 rounded-lg text-[11px] font-bold cursor-pointer transition-colors ${
                    requestSubTab === "blood"
                      ? "bg-red-500 text-white shadow-xs"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  রক্তের আবেদনসমূহ ({requestsList.length})
                </button>
                <button
                  onClick={() => setRequestSubTab("donor")}
                  className={`py-1 px-3 rounded-lg text-[11px] font-bold cursor-pointer transition-colors ${
                    requestSubTab === "donor"
                      ? "bg-red-500 text-white shadow-xs"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  রক্তদাতাদের পোস্টসমূহ ({donorPostsList.length})
                </button>
              </div>
            </div>
            <button
              onClick={loadRequests}
              className="py-1 px-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[10px] font-bold border border-slate-200 cursor-pointer self-end md:self-auto"
            >
              রিফ্রেশ করুন 🔄
            </button>
          </div>

          {requestSubTab === "blood" ? (
            requestsList.length === 0 ? (
              <p className="text-slate-400 text-center py-8">কোন রক্তের আবেদন পাওয়া যায়নি।</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50 text-slate-400 font-bold uppercase tracking-wider">
                      <th className="p-4">রোগীর নাম</th>
                      <th className="p-4">গ্রুপ</th>
                      <th className="p-4">পরিমাণ (ব্যাগ)</th>
                      <th className="p-4">হাসপাতাল ও জেলা</th>
                      <th className="p-4">মোবাইল নম্বর</th>
                      <th className="p-4 text-center">অ্যাকশন</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 text-slate-700 font-medium">
                    {requestsList.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50/50">
                        <td className="p-4">
                          <div>
                            <span className="font-bold text-slate-800">{item.patientName}</span>
                            <span className="text-[10px] text-slate-400 block">রোগ: {item.disease || item.details || "উল্লেখ নেই"}</span>
                          </div>
                        </td>
                        <td className="p-4">
                          <span className="inline-flex py-0.5 px-2 bg-red-100 text-red-700 rounded-full font-bold">
                            {item.bloodGroup}
                          </span>
                        </td>
                        <td className="p-4 font-bold">{item.unitsNeeded || item.units || 1} ব্যাগ</td>
                        <td className="p-4">
                          <div>
                            <span className="font-bold text-slate-800">{item.hospitalName}</span>
                            <span className="text-[10px] text-slate-400 block">{item.upazila || item.area || ""}, {item.district}</span>
                          </div>
                        </td>
                        <td className="p-4 font-bold">{item.phone || item.contactPhone}</td>
                        <td className="p-4 text-center">
                          <button
                            onClick={() => handleDeleteRequest(item.id, item.patientName)}
                            className="py-1.5 px-3 bg-red-50 text-red-600 hover:bg-red-100 border border-red-100 rounded-lg font-bold text-[10px] cursor-pointer"
                          >
                            ডিলেট আবেদন
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          ) : (
            donorPostsList.length === 0 ? (
              <p className="text-slate-400 text-center py-8">কোন রক্তদাতা পোস্ট পাওয়া যায়নি।</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50 text-slate-400 font-bold uppercase tracking-wider">
                      <th className="p-4">রক্তদাতার নাম</th>
                      <th className="p-4">গ্রুপ</th>
                      <th className="p-4">উপজেলা ও জেলা</th>
                      <th className="p-4">মোবাইল নম্বর</th>
                      <th className="p-4 text-center">অবস্থা</th>
                      <th className="p-4 text-center">অ্যাকশন</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 text-slate-700 font-medium">
                    {donorPostsList.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50/50">
                        <td className="p-4">
                          <div>
                            <span className="font-bold text-slate-800">{item.name}</span>
                          </div>
                        </td>
                        <td className="p-4">
                          <span className="inline-flex py-0.5 px-2 bg-red-100 text-red-700 rounded-full font-bold">
                            {item.bloodGroup}
                          </span>
                        </td>
                        <td className="p-4">
                          <div>
                            <span className="text-slate-800 font-bold">{item.upazila}</span>
                            <span className="text-[10px] text-slate-400 block">{item.district}</span>
                          </div>
                        </td>
                        <td className="p-4 font-bold">{item.phone || item.mobile}</td>
                        <td className="p-4 text-center">
                          {item.paused ? (
                            <span className="px-2 py-0.5 bg-amber-50 text-amber-600 border border-amber-100 rounded text-[10px] font-bold">নিষ্ক্রিয় (Paused)</span>
                          ) : (
                            <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded text-[10px] font-bold">সক্রিয় (Active)</span>
                          )}
                        </td>
                        <td className="p-4 text-center">
                          <button
                            onClick={() => handleDeleteDonorPost(item.id, item.name)}
                            className="py-1.5 px-3 bg-red-50 text-red-600 hover:bg-red-100 border border-red-100 rounded-lg font-bold text-[10px] cursor-pointer"
                          >
                            ডিলেট পোস্ট
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          )}
        </div>
      )}

      {activeTab === "directory" && (
        /* DIRECTORY (HOSPITALS & VOLUNTEERS) MODERATION */
        <div className="space-y-6">
          {/* Hospitals Panel */}
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 space-y-4">
            <h3 className="font-extrabold text-slate-800 text-sm border-b pb-2 border-slate-100">হাসপাতাল ও ব্লাড ব্যাংক ({hospitalsList.length})</h3>
            
            {hospitalsList.length === 0 ? (
              <p className="text-slate-400 text-center py-8">কোন হাসপাতাল বা ব্লাড ব্যাংক তালিকাভুক্ত নেই।</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50 text-slate-400 font-bold uppercase tracking-wider">
                      <th className="p-4">হাসপাতালের নাম</th>
                      <th className="p-4">ঠিকানা</th>
                      <th className="p-4">যোগাযোগ নম্বর</th>
                      <th className="p-4 text-center">অ্যাকশন</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 text-slate-700 font-medium">
                    {hospitalsList.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50/50">
                        <td className="p-4 font-bold text-slate-800">{item.name}</td>
                        <td className="p-4">{item.address || item.area || "উল্লেখ নেই"}, {item.district}</td>
                        <td className="p-4 font-bold">{item.phone}</td>
                        <td className="p-4 text-center">
                          <button
                            onClick={() => handleDeleteHospital(item.id, item.name)}
                            className="py-1.5 px-3 bg-red-50 text-red-600 hover:bg-red-100 border border-red-100 rounded-lg font-bold text-[10px] cursor-pointer"
                          >
                            ডিলেট করুন
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Volunteers Panel */}
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 space-y-4">
            <h3 className="font-extrabold text-slate-800 text-sm border-b pb-2 border-slate-100">স্বেচ্ছাসেবক তালিকা ({volunteersList.length})</h3>
            
            {volunteersList.length === 0 ? (
              <p className="text-slate-400 text-center py-8">কোন স্বেচ্ছাসেবক তালিকাভুক্ত নেই।</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50 text-slate-400 font-bold uppercase tracking-wider">
                      <th className="p-4">স্বেচ্ছাসেবকের নাম</th>
                      <th className="p-4">এলাকা</th>
                      <th className="p-4">মোবাইল নম্বর</th>
                      <th className="p-4 text-center">অ্যাকশন</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 text-slate-700 font-medium">
                    {volunteersList.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50/50">
                        <td className="p-4 font-bold text-slate-800">{item.name}</td>
                        <td className="p-4">{item.area}, {item.district}</td>
                        <td className="p-4 font-bold">{item.phone}</td>
                        <td className="p-4 text-center">
                          <button
                            onClick={() => handleDeleteVolunteer(item.id, item.name)}
                            className="py-1.5 px-3 bg-red-50 text-red-600 hover:bg-red-100 border border-red-100 rounded-lg font-bold text-[10px] cursor-pointer"
                          >
                            ডিলেট করুন
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === "settings" && (
        /* SYSTEM SETTINGS & MAINTENANCE */
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 md:p-8">
          <h3 className="font-extrabold text-slate-800 text-sm mb-5 border-b pb-2 flex items-center gap-1.5">
            <Wrench className="w-5 h-5 text-red-500" /> সিস্টেম সেটিংস কন্ট্রোল
          </h3>

          <form onSubmit={handleUpdateSettings} className="space-y-6 text-xs font-semibold">
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <label className="flex items-center gap-3 p-4 border rounded-2xl cursor-pointer hover:bg-slate-50 transition-all">
                <input
                  type="checkbox"
                  checked={regEnabled}
                  onChange={(e) => setRegEnabled(e.target.checked)}
                  className="w-4 h-4 text-red-500 focus:ring-red-500 rounded"
                />
                <div>
                  <span className="text-slate-700 font-bold block text-xs">নতুন ইউজার নিবন্ধন</span>
                  <span className="text-[10px] text-slate-400 font-medium">নিবন্ধন অপশন অন/অফ করতে টিক দিন</span>
                </div>
              </label>

              <label className="flex items-center gap-3 p-4 border rounded-2xl cursor-pointer hover:bg-slate-50 transition-all">
                <input
                  type="checkbox"
                  checked={reqEnabled}
                  onChange={(e) => setReqEnabled(e.target.checked)}
                  className="w-4 h-4 text-red-500 focus:ring-red-500 rounded"
                />
                <div>
                  <span className="text-slate-700 font-bold block text-xs">রক্তের জন্য সাধারণ আবেদন</span>
                  <span className="text-[10px] text-slate-400 font-medium">রক্তের আবেদন পোস্ট খোলা/বন্ধ</span>
                </div>
              </label>

              <label className="flex items-center gap-3 p-4 border rounded-2xl cursor-pointer hover:bg-slate-50 transition-all">
                <input
                  type="checkbox"
                  checked={donEnabled}
                  onChange={(e) => setDonEnabled(e.target.checked)}
                  className="w-4 h-4 text-red-500 focus:ring-red-500 rounded"
                />
                <div>
                  <span className="text-slate-700 font-bold block text-xs">রক্তদানের তথ্য দাখিল</span>
                  <span className="text-[10px] text-slate-400 font-medium">নিবন্ধিতদের রক্তদান সম্পন্ন করা অপশন</span>
                </div>
              </label>
            </div>

            <div className="p-4 bg-amber-50/50 border border-amber-200 rounded-2xl">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={maintenanceMode}
                  onChange={(e) => setMaintenanceMode(e.target.checked)}
                  className="w-4 h-4 text-amber-600 focus:ring-amber-500 rounded mt-1"
                />
                <div>
                  <span className="text-amber-800 font-bold block text-xs">প্ল্যাটফর্ম মেইনটেন্যান্স মোড (Maintenance Mode)</span>
                  <span className="text-[11px] text-amber-600 font-medium block mt-0.5">
                    * চালু করলে শুধুমাত্র অ্যাডমিনরা অ্যাপ অ্যাক্সেস করতে পারবেন। সাধারণ ইউজাররা একটি মেইনটেন্যান্স মেসেজ দেখতে পাবেন।
                  </span>
                </div>
              </label>
            </div>

            <div>
              <label className="block text-slate-500 mb-2 uppercase tracking-wider">হোমপেজে প্রদর্শিত সাধারণ বিজ্ঞপ্তি (Notice Panel)</label>
              <textarea
                rows={3}
                value={noticeText}
                onChange={(e) => setNoticeText(e.target.value)}
                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-800 font-medium focus:outline-none focus:border-red-500"
              />
            </div>

            <button
              type="submit"
              className="py-3 px-6 bg-slate-900 hover:bg-slate-800 text-white font-extrabold rounded-xl transition-all shadow-md self-start"
            >
              সেটিংস আপডেট করুন
            </button>
          </form>
        </div>
      )}

      {activeTab === "logs" && (
        /* AUDIT LOGS DISPLAY */
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 space-y-4">
          <h3 className="font-extrabold text-slate-800 text-sm">অ্যাডমিন অ্যাক্টিভিটি অডিট লগ</h3>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50 text-slate-400 font-bold uppercase tracking-wider">
                  <th className="p-4">অ্যাডমিন</th>
                  <th className="p-4">অ্যাকশন</th>
                  <th className="p-4">টার্গেট ইউজার আইডি</th>
                  <th className="p-4">বিস্তারিত</th>
                  <th className="p-4">সময়কাল</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 text-slate-700 font-medium font-mono">
                {auditLogs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center p-8 text-slate-400">কোন অ্যাক্টিভিটি লগ পাওয়া যায়নি।</td>
                  </tr>
                ) : (
                  auditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50/50">
                      <td className="p-4 font-bold text-slate-800">{log.adminName}</td>
                      <td className="p-4">
                        <span className="py-0.5 px-2 bg-slate-100 rounded text-slate-800 border font-bold">
                          {log.action}
                        </span>
                      </td>
                      <td className="p-4 text-slate-500">{log.targetUserId || "-"}</td>
                      <td className="p-4 text-slate-600 font-sans font-medium">{log.details}</td>
                      <td className="p-4 font-sans text-slate-400">
                        {log.createdAt?.toDate ? new Date(log.createdAt.toDate()).toLocaleString("bn-BD") : "এখনই"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === "completed_donations" && (
        /* COMPLETED DONATIONS REGISTER LOGS */
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 space-y-5">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
            <div>
              <h3 className="font-extrabold text-slate-800 text-sm flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-emerald-500 fill-emerald-50 text-emerald-500" /> সম্পন্ন রক্তদানের রেকর্ড বুক 📑
              </h3>
              <p className="text-[11px] text-slate-400 font-semibold mt-0.5 leading-relaxed">
                প্লাটফর্মে নিবন্ধিত ইউজার এবং রোগীদের সাহায্যার্থে রক্তদান সম্পন্ন করার সকল সফল রেকর্ডের সম্পূর্ণ তথ্যপঞ্জি।
              </p>
            </div>
            <button
              onClick={loadCompletedDonations}
              className="py-1.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all cursor-pointer"
            >
              রিফ্রেশ করুন 🔄
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50 text-slate-400 font-bold uppercase tracking-wider">
                  <th className="p-4">রক্তदाता</th>
                  <th className="p-4">রক্তদাতার ফোন নম্বর</th>
                  <th className="p-4">রক্তগ্রহীতা</th>
                  <th className="p-4">রক্তগ্রহীতার ফোন নম্বর</th>
                  <th className="p-4">হাসপাতাল ও ঠিকানা</th>
                  <th className="p-4">রক্তদানের তারিখ</th>
                  <th className="p-4">অ্যাডমিন অ্যাকশন</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 text-slate-700 font-semibold font-sans">
                {completedDonationsList.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center p-12 text-slate-400">
                      <div className="space-y-2">
                        <AlertTriangle className="w-8 h-8 text-slate-300 mx-auto" />
                        <p className="font-extrabold text-xs">কোন সম্পন্ন রক্তদানের রেকর্ড পাওয়া যায়নি।</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  completedDonationsList.map((don) => (
                    <tr key={don.id} className="hover:bg-slate-50/50">
                      <td className="p-4 font-bold text-slate-800">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0 animate-ping" style={{ animationDuration: '3s' }} />
                          <div>
                            <span className="font-extrabold text-slate-800 block">{don.donorName || "অজানা দাতা"}</span>
                            {don.donorId && (
                              <span className="inline-block text-[8px] text-indigo-500 font-black uppercase font-mono mt-0.5 bg-indigo-50 px-1 border border-indigo-100 rounded">নিবন্ধিত দাতা</span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="p-4 font-mono font-medium text-slate-600">{don.donorPhone || don.donorMobile || "-"}</td>
                      <td className="p-4 font-medium text-slate-700">{don.recipientName || don.patientName || "-"}</td>
                      <td className="p-4 font-mono font-medium text-slate-600">{don.recipientPhone || don.phone || "-"}</td>
                      <td className="p-4 text-slate-600 max-w-[200px] truncate leading-normal">
                        <span className="font-bold text-slate-800 block text-[11px] truncate">{don.hospitalName || "-"}</span>
                        <span className="text-[10px] text-slate-400 truncate block mt-0.5">{don.hospitalAddress || don.address || "-"}</span>
                      </td>
                      <td className="p-4 font-sans font-bold text-red-500">
                        {don.donationDate || "অজানা তারিখ"}
                      </td>
                      <td className="p-4">
                        <button
                          onClick={() => handleDeleteCompletedDonation(don.id)}
                          className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 hover:text-rose-700 rounded-lg border border-rose-100 transition-colors cursor-pointer text-[10px] font-black"
                        >
                          মুছে ফেলুন (Remove)
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Custom Confirmation Modal */}
      {confirmModal.isOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl max-w-sm w-full p-6 border border-slate-100 shadow-2xl space-y-4"
          >
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 text-red-600 mb-3">
                <ShieldAlert className="h-6 w-6" />
              </div>
              <h3 className="text-md font-extrabold text-slate-800 leading-6">
                {confirmModal.title}
              </h3>
              <p className="text-xs text-slate-500 font-medium mt-2 leading-relaxed">
                {confirmModal.message}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
                className="flex-1 py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-xl text-xs cursor-pointer transition-all border border-slate-200"
              >
                বাতিল করুন
              </button>
              <button
                type="button"
                onClick={async () => {
                  setConfirmModal(prev => ({ ...prev, isOpen: false }));
                  await confirmModal.onConfirm();
                }}
                className="flex-1 py-2.5 px-4 bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl text-xs cursor-pointer transition-all shadow-md shadow-red-100"
              >
                নিশ্চিত করুন
              </button>
            </div>
          </motion.div>
        </div>
      )}

    </div>
  );
};
