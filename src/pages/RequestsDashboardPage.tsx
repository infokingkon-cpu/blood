import React, { useState, useEffect } from "react";
import { useApp } from "../contexts/AppContext";
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  doc, 
  updateDoc, 
  addDoc, 
  deleteDoc,
  onSnapshot, 
  orderBy, 
  Timestamp 
} from "firebase/firestore";
import { db } from "../firebase/config";
import { 
  Heart, 
  Inbox, 
  Send, 
  User, 
  Phone, 
  MapPin, 
  Building2, 
  AlertCircle, 
  CheckCircle2, 
  XCircle, 
  Clock,
  ExternalLink,
  Trash2,
  Edit3,
  Check,
  Plus,
  X,
  Calendar,
  Globe,
  MessageSquare,
  Lock,
  PlusCircle,
  ToggleLeft,
  ToggleRight
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { bangladeshLocations } from "../utils/bangladeshLocations";

export const RequestsDashboardPage: React.FC = () => {
  const { user, showToast, refreshUserProfile } = useApp();
  const [activeTab, setActiveTab] = useState<"incoming" | "outgoing" | "donor_post">("incoming");
  const [loading, setLoading] = useState(false);
  
  // Requests data
  const [incomingReqs, setIncomingReqs] = useState<any[]>([]);
  const [outgoingReqs, setOutgoingReqs] = useState<any[]>([]);

  // Setup Subscription for Incoming Requests
  useEffect(() => {
    if (!user?.uid) return;

    setLoading(true);
    const qIncoming = query(
      collection(db, "direct_requests"),
      where("donorId", "==", user.uid),
      orderBy("createdAt", "desc")
    );

    const unsubscribeIncoming = onSnapshot(qIncoming, (snapshot) => {
      const list: any[] = [];
      snapshot.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() });
      });
      setIncomingReqs(list);
      setLoading(false);
    }, (error) => {
      console.error("Incoming Requests Sub error:", error);
      setLoading(false);
    });

    return () => unsubscribeIncoming();
  }, [user?.uid]);

  // Setup Subscription for Outgoing Requests
  useEffect(() => {
    if (!user?.uid) return;

    const qOutgoing = query(
      collection(db, "direct_requests"),
      where("requesterId", "==", user.uid),
      orderBy("createdAt", "desc")
    );

    const unsubscribeOutgoing = onSnapshot(qOutgoing, (snapshot) => {
      const list: any[] = [];
      snapshot.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() });
      });
      setOutgoingReqs(list);
    }, (error) => {
      console.error("Outgoing Requests Sub error:", error);
    });

    return () => unsubscribeOutgoing();
  }, [user?.uid]);

  // Setup Subscription for current user's Donor Post
  const [myDonorPost, setMyDonorPost] = useState<any>(null);
  const [loadingDonorPost, setLoadingDonorPost] = useState(true);

  useEffect(() => {
    if (!user?.uid) return;

    const q = query(
      collection(db, "donor_posts"),
      where("userId", "==", user.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        const docsList: any[] = [];
        snapshot.forEach((doc) => {
          docsList.push({ id: doc.id, ...doc.data() });
        });
        setMyDonorPost(docsList[0]);
      } else {
        setMyDonorPost(null);
      }
      setLoadingDonorPost(false);
    }, (error) => {
      console.error("Donor Post Sub error:", error);
      setLoadingDonorPost(false);
    });

    return () => unsubscribe();
  }, [user?.uid]);

  // Real-time Countdown timer for Blood Donation Lock
  const [timeRemaining, setTimeRemaining] = useState<string>("");

  useEffect(() => {
    if (!user?.bloodDonationLockedUntil) {
      setTimeRemaining("");
      return;
    }

    const lockTime = user.bloodDonationLockedUntil.toDate ? user.bloodDonationLockedUntil.toDate() : new Date(user.bloodDonationLockedUntil);
    
    if (lockTime <= new Date()) {
      setTimeRemaining("");
      return;
    }

    const interval = setInterval(() => {
      const now = new Date().getTime();
      const difference = lockTime.getTime() - now;

      if (difference <= 0) {
        setTimeRemaining("");
        clearInterval(interval);
        refreshUserProfile();
      } else {
        const days = Math.floor(difference / (1000 * 60 * 60 * 24));
        const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((difference % (1000 * 60)) / 1000);

        setTimeRemaining(`${days} দিন ${hours} ঘণ্টা ${minutes} মিনিট ${seconds} সেকেন্ড`);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [user?.bloodDonationLockedUntil]);

  // Donor Post Form States
  const [showPostForm, setShowPostForm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [donorName, setDonorName] = useState("");
  const [donorPhone, setDonorPhone] = useState("");
  const [donorBloodGroup, setDonorBloodGroup] = useState("");
  const [donorDivision, setDonorDivision] = useState("");
  const [donorDistrict, setDonorDistrict] = useState("");
  const [donorUpazila, setDonorUpazila] = useState("");
  const [donorAddress, setDonorAddress] = useState("");
  const [donorWhatsApp, setDonorWhatsApp] = useState("");
  const [donorFacebook, setDonorFacebook] = useState("");
  const [donorTimesDonated, setDonorTimesDonated] = useState("1");
  const [donorLastDonatedAt, setDonorLastDonatedAt] = useState("কখনো না");
  const [donorNotes, setDonorNotes] = useState("");

  // Report Donation Form States
  const [showDonationModal, setShowDonationModal] = useState(false);
  const [recName, setRecName] = useState("");
  const [recPhone, setRecPhone] = useState("");
  const [recHospital, setRecHospital] = useState("");
  const [donationNotes, setDonationNotes] = useState("");

  // Custom inline delete confirm state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Pre-populate fields on edit / initialization
  useEffect(() => {
    if (myDonorPost) {
      setDonorName(myDonorPost.name || user?.fullName || "");
      setDonorPhone(myDonorPost.phone || user?.phone || "");
      setDonorBloodGroup(myDonorPost.bloodGroup || user?.bloodGroup || "");
      setDonorDivision(myDonorPost.division || user?.division || "");
      setDonorDistrict(myDonorPost.district || user?.district || "");
      setDonorUpazila(myDonorPost.upazila || user?.upazila || "");
      setDonorAddress(myDonorPost.address || user?.address || "");
      setDonorWhatsApp(myDonorPost.whatsApp || user?.whatsAppNumber || "");
      setDonorFacebook(myDonorPost.facebook || user?.facebookProfile || "");
      setDonorTimesDonated(String(myDonorPost.timesDonated || "1"));
      setDonorLastDonatedAt(myDonorPost.lastDonatedAt || "কখনো না");
      setDonorNotes(myDonorPost.notes || "");
    } else {
      setDonorName(user?.fullName || "");
      setDonorPhone(user?.phone || "");
      setDonorBloodGroup(user?.bloodGroup || "");
      setDonorDivision(user?.division || "");
      setDonorDistrict(user?.district || "");
      setDonorUpazila(user?.upazila || "");
      setDonorAddress(user?.address || "");
      setDonorWhatsApp(user?.whatsAppNumber || "");
      setDonorFacebook(user?.facebookProfile || "");
      setDonorTimesDonated("1");
      setDonorLastDonatedAt("কখনো না");
      setDonorNotes("");
    }
  }, [myDonorPost, user]);

  const districts = bangladeshLocations.find(d => d.name === donorDivision)?.districts || [];
  const upazilas = districts.find(d => d.name === donorDistrict)?.upazilas || [];

  // Submit / Update Donor Post
  const handleSubmitDonorPost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.uid) return;

    if (!donorName || !donorPhone || !donorBloodGroup || !donorDivision || !donorDistrict || !donorUpazila) {
      showToast("দয়া করে প্রয়োজনীয় সব ক্ষেত্র পূরণ করুন।", "warning");
      return;
    }

    try {
      const postData = {
        userId: user.uid,
        name: donorName,
        phone: donorPhone,
        bloodGroup: donorBloodGroup,
        division: donorDivision,
        district: donorDistrict,
        upazila: donorUpazila,
        address: donorAddress,
        whatsApp: donorWhatsApp,
        facebook: donorFacebook,
        timesDonated: Number(donorTimesDonated) || 0,
        lastDonatedAt: donorLastDonatedAt,
        notes: donorNotes,
        paused: false,
        createdAt: Timestamp.now(),
        image: user.profilePicture || ""
      };

      if (myDonorPost?.id) {
        // Update existing post
        await updateDoc(doc(db, "donor_posts", myDonorPost.id), postData);
        showToast("আপনার রক্তদাতা পোস্ট সফলভাবে আপডেট করা হয়েছে।", "success");
      } else {
        // Create new post
        await addDoc(collection(db, "donor_posts"), postData);
        showToast("অভিনন্দন! আপনার রক্তদাতা পোস্ট সফলভাবে তৈরি করা হয়েছে।", "success");
      }

      setShowPostForm(false);
      setIsEditing(false);
    } catch (err) {
      console.error("Save donor post error:", err);
      showToast("পোস্টটি সংরক্ষণ করতে ত্রুটি ঘটেছে। অনুগ্রহ করে আবার চেষ্টা করুন।", "error");
    }
  };

  // Toggle donor availability paused state
  const handleTogglePause = async () => {
    if (!myDonorPost?.id) return;
    try {
      const newPausedState = !myDonorPost.paused;
      await updateDoc(doc(db, "donor_posts", myDonorPost.id), {
        paused: newPausedState
      });
      showToast(newPausedState ? "আপনার পোস্টটি সাময়িকভাবে বন্ধ (ইনঅ্যাক্টিভ) করা হয়েছে।" : "আপনার পোস্টটি পুনরায় সচল (অ্যাক্টিভ) করা হয়েছে।", "success");
    } catch (err) {
      console.error("Toggle pause error:", err);
      showToast("অবস্থা পরিবর্তন করতে সমস্যা হয়েছে।", "error");
    }
  };

  // Delete Donor Post
  const handleDeleteDonorPost = async () => {
    if (!myDonorPost?.id) return;

    try {
      await deleteDoc(doc(db, "donor_posts", myDonorPost.id));
      showToast("আপনার রক্তদাতা পোস্টটি সফলভাবে মুছে ফেলা হয়েছে।", "warning");
      setShowDeleteConfirm(false);
    } catch (err) {
      console.error("Delete donor post error:", err);
      showToast("মুছে ফেলতে সমস্যা হয়েছে।", "error");
    }
  };

  // Confirm Reported Donation Flow (4 Month Lock)
  const handleConfirmDonation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.uid) return;

    try {
      const lockDurationDays = 120; // 4 months
      const lockExpiryDate = new Date();
      lockExpiryDate.setDate(lockExpiryDate.getDate() + lockDurationDays);

      // 1. Update user profile lock expiry and counters
      const updatedTimesDonated = (user.timesDonated || 0) + 1;
      await updateDoc(doc(db, "users", user.uid), {
        bloodDonationLockedUntil: Timestamp.fromDate(lockExpiryDate),
        timesDonated: updatedTimesDonated,
        lastDonationDate: Timestamp.now()
      });

      // 2. Pause & update donor post if they have one
      if (myDonorPost?.id) {
        await updateDoc(doc(db, "donor_posts", myDonorPost.id), {
          bloodDonationLockedUntil: Timestamp.fromDate(lockExpiryDate),
          paused: true,
          timesDonated: updatedTimesDonated,
          lastDonatedAt: new Date().toLocaleDateString("bn-BD")
        });
      }

      // 3. Store donation history
      await addDoc(collection(db, "donation_history"), {
        donorId: user.uid,
        recipientName: recName || "অনির্ধারিত",
        recipientHospital: recHospital || "অনির্ধারিত",
        recipientPhone: recPhone || "অনির্ধারিত",
        donationDate: Timestamp.now(),
        notes: donationNotes || "",
        createdAt: Timestamp.now()
      });

      // 4. Create internal app notification
      await addDoc(collection(db, "notifications"), {
        userId: user.uid,
        title: "মহৎ কাজের জন্য আপনাকে ধন্যবাদ! ❤️🩸",
        message: `আপনার রক্তদানের তথ্যটি সফলভাবে নিবন্ধিত হয়েছে। রক্ত সুরক্ষার্থে আগামী ৪ মাসের জন্য আপনার নতুন আবেদন ও সচলতা সাময়িকভাবে লক করা হয়েছে।`,
        createdAt: Timestamp.now(),
        read: false
      });

      await refreshUserProfile();
      showToast("রক্তদান সফলভাবে নিবন্ধিত হয়েছে এবং ৪ মাসের লক কার্যকর করা হয়েছে।", "success");
      setShowDonationModal(false);

      // Reset
      setRecName("");
      setRecHospital("");
      setRecPhone("");
      setDonationNotes("");
    } catch (err) {
      console.error("Confirm donation error:", err);
      showToast("রক্তদান নিবন্ধনে সমস্যা হয়েছে। দয়া করে আবার চেষ্টা করুন।", "error");
    }
  };

  // Handle Request Actions: Accept
  const handleAccept = async (reqId: string, requesterId: string) => {
    try {
      const reqRef = doc(db, "direct_requests", reqId);
      await updateDoc(reqRef, { status: "accepted" });

      await addDoc(collection(db, "notifications"), {
        userId: requesterId,
        title: "রক্তের আবেদন গ্রহণ করা হয়েছে! 🎉",
        message: `${user?.fullName} আপনার ${user?.bloodGroup} রক্তের আবেদনটি গ্রহণ করেছেন। অবিলম্বে যোগাযোগ করুন।`,
        createdAt: Timestamp.now(),
        read: false
      });

      showToast("আবেদনটি সফলভাবে গ্রহণ করা হয়েছে। গ্রহীতা বিজ্ঞপ্তি পাবেন।", "success");
    } catch (err) {
      console.error("Accept request error:", err);
      showToast("আবেদন গ্রহণ করতে ত্রুটি ঘটেছে। আবার চেষ্টা করুন।", "error");
    }
  };

  // Handle Request Actions: Reject
  const handleReject = async (reqId: string, requesterId: string) => {
    try {
      const reqRef = doc(db, "direct_requests", reqId);
      await updateDoc(reqRef, { status: "cancelled" });

      await addDoc(collection(db, "notifications"), {
        userId: requesterId,
        title: "রক্তের আবেদন বাতিল করা হয়েছে",
        message: `দুঃখিত, ${user?.fullName} আপনার রক্তের আবেদনটি এই মুহূর্তে বাতিল করেছেন।`,
        createdAt: Timestamp.now(),
        read: false
      });

      showToast("আবেদনটি বাতিল করা হয়েছে।", "warning");
    } catch (err) {
      console.error("Reject request error:", err);
      showToast("বাতিল করতে সমস্যা হয়েছে।", "error");
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <span className="inline-flex items-center gap-1 py-1 px-3 bg-amber-50 text-amber-700 border border-amber-200 rounded-full text-xs font-bold">
            <Clock className="w-3.5 h-3.5" /> অপেক্ষমাণ
          </span>
        );
      case "accepted":
        return (
          <span className="inline-flex items-center gap-1 py-1 px-3 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-xs font-bold">
            <CheckCircle2 className="w-3.5 h-3.5" /> গ্রহণ করা হয়েছে
          </span>
        );
      case "cancelled":
        return (
          <span className="inline-flex items-center gap-1 py-1 px-3 bg-rose-50 text-rose-700 border border-rose-200 rounded-full text-xs font-bold">
            <XCircle className="w-3.5 h-3.5" /> বাতিল করা হয়েছে
          </span>
        );
      case "completed":
        return (
          <span className="inline-flex items-center gap-1 py-1 px-3 bg-blue-50 text-blue-700 border border-blue-200 rounded-full text-xs font-bold">
            <Heart className="w-3.5 h-3.5 fill-blue-500" /> সম্পন্ন
          </span>
        );
      default:
        return null;
    }
  };

  const isUserLocked = () => {
    if (!user?.bloodDonationLockedUntil) return false;
    const lockTime = user.bloodDonationLockedUntil.toDate ? user.bloodDonationLockedUntil.toDate() : new Date(user.bloodDonationLockedUntil);
    return lockTime > new Date();
  };

  return (
    <div className="max-w-5xl mx-auto p-4 space-y-6 md:py-8">
      
      {/* Page Header */}
      <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight">আবেদন ড্যাশবোর্ড 📋</h2>
          <p className="text-slate-500 text-xs md:text-sm mt-1 font-medium">আপনার রক্ত দেওয়ার ও নেয়ার যাবতীয় আবেদনসমূহ ট্র্যাক করুন</p>
        </div>

        {/* Dynamic tabs */}
        <div className="flex bg-slate-50 p-1 rounded-2xl border shrink-0 overflow-x-auto max-w-full">
          <button
            onClick={() => setActiveTab("incoming")}
            className={`py-2 px-4 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === "incoming"
                ? "bg-white text-slate-800 shadow-sm"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            রক্তের আবেদনসমূহ (আগত)
          </button>
          <button
            onClick={() => setActiveTab("outgoing")}
            className={`py-2 px-4 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === "outgoing"
                ? "bg-white text-slate-800 shadow-sm"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            আমার আবেদন (প্রেরিত)
          </button>
          <button
            onClick={() => setActiveTab("donor_post")}
            className={`py-2 px-4 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === "donor_post"
                ? "bg-white text-slate-800 shadow-sm"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            আমার রক্তদাতা পোস্ট 🩸
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="w-10 h-10 border-4 border-red-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-slate-500 text-sm font-medium">তথ্য খোঁজা হচ্ছে, দয়া করে অপেক্ষা করুন...</p>
        </div>
      ) : activeTab === "incoming" ? (
        /* INCOMING REQUESTS */
        <div className="space-y-4">
          {incomingReqs.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-3xl border border-slate-100 p-8">
              <Inbox className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-600 font-extrabold text-sm">কোন আগত রক্তের আবেদন পাওয়া যায়নি</p>
              <p className="text-slate-400 text-xs mt-1">কেউ আপনার কাছে সরাসরি রক্তের আবেদন করলে তা এখানে প্রদর্শিত হবে।</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {incomingReqs.map((req) => (
                <div key={req.id} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
                  <div>
                    <div className="flex items-start justify-between gap-3 mb-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-10 h-10 rounded-full bg-slate-50 border flex items-center justify-center font-bold text-slate-500">
                          <User className="w-5 h-5 text-slate-400" />
                        </div>
                        <div>
                          <h4 className="font-extrabold text-slate-800 text-sm">{req.requesterName || "বেনামী গ্রাহক"}</h4>
                          <span className="text-[10px] text-slate-400 font-medium">
                            {req.createdAt?.toDate ? new Date(req.createdAt.toDate()).toLocaleString("bn-BD") : "কিছুক্ষণ আগে"}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {req.emergencyLevel === "emergency" && (
                          <span className="bg-rose-50 border border-rose-200 text-rose-600 text-[9px] font-extrabold rounded-md px-1.5 py-0.5 animate-pulse uppercase">
                            জরুরি
                          </span>
                        )}
                        <span className="w-9 h-9 flex items-center justify-center bg-red-500 text-white rounded-full text-sm font-black shadow-sm">
                          {req.bloodGroup}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-2 text-xs text-slate-600 border-t pt-3 border-slate-50">
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-slate-400 shrink-0" />
                        <span>হাসপাতাল: <strong className="text-slate-700">{req.hospitalName || "উল্লেখ নেই"}</strong></span>
                      </div>
                    </div>
                  </div>

                  {/* Actions depending on status */}
                  <div className="mt-6 border-t pt-4 border-slate-50">
                    {req.status === "pending" ? (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleReject(req.id, req.requesterId)}
                          className="flex-1 py-2 bg-slate-100 hover:bg-rose-50 hover:text-rose-600 font-bold rounded-xl text-slate-600 text-xs transition-colors"
                        >
                          বাতিল করুন
                        </button>
                        <button
                          onClick={() => handleAccept(req.id, req.requesterId)}
                          className="flex-1 py-2 bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl text-xs shadow-md shadow-red-500/10 transition-colors"
                        >
                          গ্রহণ করুন
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        {getStatusBadge(req.status)}
                        {req.status === "accepted" && (
                          <div className="flex gap-1.5">
                            <a
                              href={`tel:${req.requesterPhone}`}
                              className="p-2 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded-xl transition-colors"
                              title="কল করুন"
                            >
                              <Phone className="w-4 h-4" />
                            </a>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : activeTab === "outgoing" ? (
        /* OUTGOING SENT REQUESTS */
        <div className="space-y-4">
          {outgoingReqs.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-3xl border border-slate-100 p-8">
              <Send className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-600 font-extrabold text-sm">কোন প্রেরিত রক্তের আবেদন পাওয়া যায়নি</p>
              <p className="text-slate-400 text-xs mt-1">আপনি কোন রক্তদাতাকে রিকোয়েস্ট পাঠালে তার তালিকা এখানে দেখা যাবে।</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {outgoingReqs.map((req) => (
                <div key={req.id} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
                  <div>
                    <div className="flex items-start justify-between gap-3 mb-4">
                      <div>
                        <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider mb-0.5">রক্তদাতার নাম</span>
                        <h4 className="font-extrabold text-slate-800 text-sm">অন্য দাতা</h4>
                        <span className="text-[10px] text-slate-400 font-medium">
                          তারিখ: {req.createdAt?.toDate ? new Date(req.createdAt.toDate()).toLocaleDateString("bn-BD") : "আজ"}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className="w-9 h-9 flex items-center justify-center bg-red-100 text-red-600 rounded-full text-sm font-black">
                          {req.bloodGroup}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-2 text-xs text-slate-600 border-t pt-3 border-slate-50">
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-slate-400 shrink-0" />
                        <span>হাসপাতাল: <strong className="text-slate-700">{req.hospitalName || "উল্লেখ নেই"}</strong></span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 border-t pt-4 border-slate-50 flex items-center justify-between">
                    {getStatusBadge(req.status)}
                    
                    {req.status === "accepted" && (
                      <span className="text-[10px] text-emerald-600 bg-emerald-50 border p-1 rounded-lg font-bold">
                        দাতা আপনার রিকোয়েস্ট গ্রহণ করেছেন!
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* MY DONOR POST PANEL */
        <div className="space-y-6">
          {/* COOLDOWN / LOCK COMPONENT */}
          {isUserLocked() && (
            <div className="bg-gradient-to-r from-red-500 to-rose-600 p-6 rounded-3xl text-white shadow-xl space-y-4 relative overflow-hidden">
              <div className="absolute right-0 top-0 w-48 h-48 bg-white/5 rounded-full blur-3xl pointer-events-none" />
              <div className="flex items-center gap-3">
                <div className="p-3 bg-white/20 rounded-2xl">
                  <Lock className="w-6 h-6 text-white animate-bounce" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base md:text-lg">রক্তদাতা পোস্ট এবং নতুন আবেদন লকড রয়েছে 🛡️</h3>
                  <p className="text-white/80 text-[11px] md:text-xs font-semibold leading-relaxed mt-0.5">
                    রক্ত সুরক্ষার্থে সম্প্রতি রক্তদানের ৪ মাসের জন্য আপনার রক্তদাতার পোস্ট ও নতুন আবেদন সাময়িকভাবে লক করা হয়েছে।
                  </p>
                </div>
              </div>

              {/* Bengal Countdown Timer */}
              <div className="bg-black/10 border border-white/20 p-4 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs font-bold">
                <div>
                  <span className="text-white/60 text-[10px] uppercase block tracking-wider mb-1">লক খোলার বাকি সময় (Countdown)</span>
                  <p className="text-sm md:text-base font-black text-amber-300 flex items-center gap-1.5 tracking-wider">
                    <Clock className="w-4.5 h-4.5 text-amber-300 animate-spin" style={{ animationDuration: '4s' }} /> {timeRemaining || "হিসাব করা হচ্ছে..."}
                  </p>
                </div>
                <div className="bg-white/10 px-3 py-1.5 rounded-lg border border-white/10">
                  লকের মেয়াদ শেষ: {user?.bloodDonationLockedUntil?.toDate ? new Date(user.bloodDonationLockedUntil.toDate()).toLocaleDateString("bn-BD") : ""}
                </div>
              </div>
            </div>
          )}

          {/* LOADING STATE */}
          {loadingDonorPost ? (
            <div className="text-center py-12 bg-white rounded-3xl border">
              <div className="w-8 h-8 border-4 border-red-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              <p className="text-slate-400 text-xs font-semibold">আপনার রক্তদাতা পোস্ট লোড হচ্ছে...</p>
            </div>
          ) : !myDonorPost ? (
            /* NO POST CREATED YET */
            <div className="bg-white border rounded-3xl p-8 text-center space-y-5">
              <div className="w-16 h-16 bg-red-50 border border-red-100 rounded-full flex items-center justify-center mx-auto text-red-500 shadow-inner">
                <Heart className="w-8 h-8 fill-red-500" />
              </div>

              <div className="max-w-md mx-auto space-y-2">
                <h3 className="font-extrabold text-slate-800 text-lg">আমি রক্ত দিতে চাই ❤️</h3>
                <p className="text-slate-500 text-xs font-medium leading-relaxed">
                  প্লাটফর্মে রক্তদাতা হিসেবে আপনার সচলতা বাড়াতে একটি "রক্তদাতা পোস্ট" তৈরি করুন। এর ফলে অন্যান্য গ্রহীতারা আপনাকে রক্তদাতাদের তালিকায় সরাসরি দেখতে পাবেন এবং রিকোয়েস্ট করতে পারবেন।
                </p>
              </div>

              {isUserLocked() ? (
                <button
                  disabled
                  className="px-6 py-3 bg-slate-100 text-slate-400 font-extrabold text-xs rounded-xl border flex items-center gap-1.5 mx-auto cursor-not-allowed"
                >
                  <Lock className="w-4 h-4" /> লক থাকা অবস্থায় পোস্ট করতে পারবেন না
                </button>
              ) : !showPostForm ? (
                <button
                  onClick={() => setShowPostForm(true)}
                  className="px-6 py-3 bg-red-500 hover:bg-red-600 text-white font-extrabold text-xs rounded-2xl shadow-lg hover:shadow-red-500/20 transition-all flex items-center gap-1.5 mx-auto"
                >
                  <PlusCircle className="w-4 h-4" /> আমি রক্ত দিতে চাই (পোস্ট তৈরি করুন)
                </button>
              ) : null}
            </div>
          ) : !showPostForm ? (
            /* ACTIVE POST PRESENT */
            <div className="bg-white border rounded-3xl p-6 shadow-sm space-y-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-slate-50 border flex items-center justify-center relative shrink-0">
                    {user?.profilePicture ? (
                      <img src={user.profilePicture} alt="" className="w-12 h-12 rounded-full object-cover" />
                    ) : (
                      <User className="w-6 h-6 text-slate-400" />
                    )}
                    <span className={`absolute bottom-0 right-0 w-3 h-3 border-2 border-white rounded-full ${myDonorPost.paused ? "bg-slate-400" : "bg-emerald-500"}`} />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h3 className="font-black text-slate-800 text-base">{myDonorPost.name}</h3>
                      <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${myDonorPost.paused ? "bg-slate-100 text-slate-500 border" : "bg-emerald-50 text-emerald-600 border border-emerald-100"}`}>
                        {myDonorPost.paused ? "নিষ্ক্রিয়" : "সক্রিয়"}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400 font-bold mt-0.5">রক্তদাতা ড্যাশবোর্ড আইডি: {myDonorPost.id}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500 font-bold">লিস্টে দৃশ্যমানতা:</span>
                  <button 
                    onClick={handleTogglePause}
                    className="focus:outline-none transition-transform active:scale-95"
                    title={myDonorPost.paused ? "সক্রিয় করুন" : "নিষ্ক্রিয় করুন"}
                  >
                    {myDonorPost.paused ? (
                      <ToggleLeft className="w-11 h-11 text-slate-300" />
                    ) : (
                      <ToggleRight className="w-11 h-11 text-emerald-500 drop-shadow-sm" />
                    )}
                  </button>
                </div>
              </div>

              {/* Render Post Body Info */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-slate-50 p-3.5 rounded-2xl border text-xs font-semibold">
                  <span className="text-slate-400 text-[10px] uppercase block tracking-wider mb-1">রক্তের গ্রুপ</span>
                  <p className="text-red-600 font-black text-base">{myDonorPost.bloodGroup}</p>
                </div>
                <div className="bg-slate-50 p-3.5 rounded-2xl border text-xs font-semibold">
                  <span className="text-slate-400 text-[10px] uppercase block tracking-wider mb-1">পূর্ববর্তী রক্তদান সংখ্যা</span>
                  <p className="text-slate-800 font-black text-sm">{myDonorPost.timesDonated || "০"} বার</p>
                </div>
                <div className="bg-slate-50 p-3.5 rounded-2xl border text-xs font-semibold">
                  <span className="text-slate-400 text-[10px] uppercase block tracking-wider mb-1">সর্বশেষ রক্তদান তারিখ</span>
                  <p className="text-slate-800 font-black text-sm">{myDonorPost.lastDonatedAt || "তথ্য নেই"}</p>
                </div>
              </div>

              <div className="border shadow-inner p-4 rounded-2xl bg-slate-50/30 text-xs font-semibold grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <span className="text-slate-400 text-[10px] uppercase tracking-wider block">ফোন নম্বর</span>
                  <p className="text-slate-700 font-bold flex items-center gap-1"><Phone className="w-3.5 h-3.5 text-slate-400" /> {myDonorPost.phone}</p>
                </div>
                {myDonorPost.whatsApp && (
                  <div className="space-y-1">
                    <span className="text-slate-400 text-[10px] uppercase tracking-wider block">হোয়াটসঅ্যাপ</span>
                    <p className="text-emerald-600 font-bold flex items-center gap-1"><MessageSquare className="w-3.5 h-3.5 text-emerald-500" /> {myDonorPost.whatsApp}</p>
                  </div>
                )}
                {myDonorPost.facebook && (
                  <div className="space-y-1">
                    <span className="text-slate-400 text-[10px] uppercase tracking-wider block">ফেসবুক প্রোফাইল</span>
                    <p className="text-blue-600 font-bold flex items-center gap-1"><Globe className="w-3.5 h-3.5 text-blue-500" /> {myDonorPost.facebook}</p>
                  </div>
                )}
                <div className="space-y-1">
                  <span className="text-slate-400 text-[10px] uppercase tracking-wider block">ঠিকানা ও জেলা</span>
                  <p className="text-slate-700 font-bold flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" /> {myDonorPost.upazila}, {myDonorPost.district}
                  </p>
                </div>
              </div>

              {myDonorPost.notes && (
                <div className="p-4 bg-red-50/30 rounded-2xl border text-xs font-semibold space-y-1">
                  <span className="text-red-500 text-[10px] uppercase font-black tracking-wider block">বিশেষ মন্তব্য</span>
                  <p className="text-slate-600 leading-relaxed font-medium">{myDonorPost.notes}</p>
                </div>
              )}

              {/* ACTION MENU */}
              <div className="flex flex-wrap gap-3 border-t pt-5">
                {isUserLocked() ? (
                  <button
                    disabled
                    className="flex-1 py-2.5 bg-slate-100 text-slate-400 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 cursor-not-allowed border"
                  >
                    <Lock className="w-4 h-4" /> ৪ মাসের জন্য লকড রয়েছে
                  </button>
                ) : (
                  <button
                    onClick={() => setShowDonationModal(true)}
                    className="flex-1 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-500/10 transition-colors"
                  >
                    <Heart className="w-4 h-4 fill-white" /> রক্ত দিয়েছি (Report Donation)
                  </button>
                )}

                <button
                  onClick={() => {
                    setIsEditing(true);
                    setShowPostForm(true);
                  }}
                  className="py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-xs rounded-xl flex items-center justify-center gap-1 transition-colors"
                >
                  <Edit3 className="w-4 h-4" /> এডিট করুন
                </button>

                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="p-2.5 bg-rose-50 hover:bg-rose-100 text-rose-600 hover:text-rose-700 rounded-xl border border-rose-100 transition-colors"
                  title="মুছে ফেলুন"
                >
                  <Trash2 className="w-4.5 h-4.5" />
                </button>
              </div>

              {/* Custom Inline Delete Confirmation */}
              {showDeleteConfirm && (
                <div className="p-4 bg-rose-50 border border-rose-150 rounded-2xl text-xs font-semibold space-y-3 mt-4">
                  <p className="text-rose-700 font-black">আপনি কি নিশ্চিতভাবে আপনার রক্তদাতার পোস্টটি মুছে ফেলতে চান?</p>
                  <div className="flex gap-2">
                    <button
                      onClick={handleDeleteDonorPost}
                      className="px-4 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-extrabold"
                    >
                      হ্যাঁ, নিশ্চিত মুছুন
                    </button>
                    <button
                      onClick={() => setShowDeleteConfirm(false)}
                      className="px-4 py-1.5 bg-white border text-slate-600 rounded-lg font-bold"
                    >
                      বাতিল
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : null}

          {/* CREATE / EDIT DONOR POST FORM */}
          {showPostForm && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white border rounded-3xl p-6 shadow-md space-y-6"
            >
              <div className="flex items-center justify-between border-b pb-3">
                <h3 className="font-extrabold text-slate-800 text-base flex items-center gap-1.5">
                  <Heart className="w-5 h-5 text-red-500 fill-red-500" /> 
                  {isEditing ? "রক্তদাতা পোস্ট পরিবর্তন করুন 📝" : "নতুন রক্তদাতা পোস্ট তৈরি করুন 🩸"}
                </h3>
                <button
                  onClick={() => {
                    setShowPostForm(false);
                    setIsEditing(false);
                  }}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmitDonorPost} className="space-y-4 text-xs font-semibold">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-500 mb-1">রক্তদাতার পুরো নাম <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      required
                      placeholder="যেমন: শরিফুল ইসলাম"
                      value={donorName}
                      onChange={(e) => setDonorName(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-500 mb-1">মোবাইল নম্বর <span className="text-red-500">*</span></label>
                    <input
                      type="tel"
                      required
                      placeholder="যেমন: 017XXXXXXXX"
                      value={donorPhone}
                      onChange={(e) => setDonorPhone(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-500 mb-1">রক্তের গ্রুপ <span className="text-red-500">*</span></label>
                    <select
                      required
                      value={donorBloodGroup}
                      onChange={(e) => setDonorBloodGroup(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800"
                    >
                      <option value="">নির্বাচন করুন</option>
                      {["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"].map(bg => (
                        <option key={bg} value={bg}>{bg}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-500 mb-1">বিভাগ <span className="text-red-500">*</span></label>
                    <select
                      required
                      value={donorDivision}
                      onChange={(e) => {
                        setDonorDivision(e.target.value);
                        setDonorDistrict("");
                        setDonorUpazila("");
                      }}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800"
                    >
                      <option value="">নির্বাচন করুন</option>
                      {bangladeshLocations.map(div => (
                        <option key={div.name} value={div.name}>{div.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-500 mb-1">জেলা <span className="text-red-500">*</span></label>
                    <select
                      required
                      disabled={!donorDivision}
                      value={donorDistrict}
                      onChange={(e) => {
                        setDonorDistrict(e.target.value);
                        setDonorUpazila("");
                      }}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 disabled:opacity-50"
                    >
                      <option value="">নির্বাচন করুন</option>
                      {districts.map(dist => (
                        <option key={dist.name} value={dist.name}>{dist.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-500 mb-1">উপজেলা / থানা <span className="text-red-500">*</span></label>
                    <select
                      required
                      disabled={!donorDistrict}
                      value={donorUpazila}
                      onChange={(e) => setDonorUpazila(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 disabled:opacity-50"
                    >
                      <option value="">নির্বাচন করুন</option>
                      {upazilas.map(up => (
                        <option key={up} value={up}>{up}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-500 mb-1">হোয়াটসঅ্যাপ নম্বর (ঐচ্ছিক)</label>
                    <input
                      type="tel"
                      placeholder="যেমন: 017XXXXXXXX"
                      value={donorWhatsApp}
                      onChange={(e) => setDonorWhatsApp(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-500 mb-1">ফেসবুক প্রোফাইল লিংক (ঐচ্ছিক)</label>
                    <input
                      type="url"
                      placeholder="যেমন: https://facebook.com/username"
                      value={donorFacebook}
                      onChange={(e) => setDonorFacebook(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-500 mb-1">মোট কতবার রক্ত দিয়েছেন? <span className="text-red-500">*</span></label>
                    <input
                      type="number"
                      required
                      min="0"
                      value={donorTimesDonated}
                      onChange={(e) => setDonorTimesDonated(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-500 mb-1">সর্বশেষ রক্তদানের তারিখ/সময়</label>
                    <input
                      type="text"
                      placeholder="যেমন: ৫ মাস আগে, বা তারিখ"
                      value={donorLastDonatedAt}
                      onChange={(e) => setDonorLastDonatedAt(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-500 mb-1">বিস্তারিত ঠিকানা</label>
                  <input
                    type="text"
                    placeholder="যেমন: মিরপুর ২, ঢাকা"
                    value={donorAddress}
                    onChange={(e) => setDonorAddress(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-slate-500 mb-1">বিশেষ তথ্য / দ্রষ্টব্য (Notes)</label>
                  <textarea
                    placeholder="রক্তদান সংক্রান্ত আপনার কোনো বিশেষ তথ্য বা মেসেজ থাকলে তা এখানে লিখুন..."
                    value={donorNotes}
                    onChange={(e) => setDonorNotes(e.target.value)}
                    rows={3}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-medium"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-red-500 hover:bg-red-600 text-white font-extrabold rounded-xl shadow-lg transition-all"
                >
                  {isEditing ? "তথ্য হালনাগাদ (আপডেট) করুন" : "রক্তদাতা পোস্ট সম্পন্ন করুন"}
                </button>
              </form>
            </motion.div>
          )}
        </div>
      )}

      {/* CONFIRM RECIPIENT DONATION DETAILS MODAL (রক্ত দিয়েছি) */}
      {showDonationModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl p-6 max-w-md w-full border shadow-2xl space-y-4"
          >
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-extrabold text-slate-800 text-base flex items-center gap-1.5">
                <Heart className="w-5 h-5 text-red-500 fill-red-500 animate-pulse" /> রক্তদান বিবরণী নিবন্ধিত করুন
              </h3>
              <button onClick={() => setShowDonationModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-[11px] text-slate-500 leading-relaxed font-semibold">
              রক্তদান সম্পন্ন করার তথ্যটি এখানে যোগ করুন। তথ্যটি নিশ্চিত করার সাথে সাথে আপনার অ্যাকাউন্ট এবং সচলতা **আগামী ৪ মাসের জন্য স্বয়ংক্রিয়ভাবে লক হয়ে যাবে** এবং কাউন্টডাউন শুরু হবে।
            </p>

            <form onSubmit={handleConfirmDonation} className="space-y-4 text-xs font-semibold">
              <div>
                <label className="block text-slate-500 mb-1">রক্তগ্রহীতার নাম (ঐচ্ছিক)</label>
                <input
                  type="text"
                  placeholder="যেমন: রফিক আহমেদ"
                  value={recName}
                  onChange={(e) => setRecName(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800"
                />
              </div>

              <div>
                <label className="block text-slate-500 mb-1">রক্তগ্রহীতার মোবাইল নম্বর (ঐচ্ছিক)</label>
                <input
                  type="tel"
                  placeholder="যেমন: 017XXXXXXXX"
                  value={recPhone}
                  onChange={(e) => setRecPhone(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800"
                />
              </div>

              <div>
                <label className="block text-slate-500 mb-1">হাসপাতাল / ঠিকানা (ঐচ্ছিক)</label>
                <input
                  type="text"
                  placeholder="যেমন: ঢাকা মেডিকেল কলেজ ও হাসপাতাল"
                  value={recHospital}
                  onChange={(e) => setRecHospital(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800"
                />
              </div>

              <div>
                <label className="block text-slate-500 mb-1">বিশেষ মন্তব্য (ঐচ্ছিক)</label>
                <textarea
                  placeholder="অভিজ্ঞতা বা কোনো বিশেষ তথ্য থাকলে লিখুন..."
                  value={donationNotes}
                  onChange={(e) => setDonationNotes(e.target.value)}
                  rows={2}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-medium"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-red-500 hover:bg-red-600 text-white font-extrabold rounded-xl shadow-lg transition-all flex items-center justify-center gap-1.5"
              >
                <Check className="w-4 h-4" /> রক্তদান নিশ্চিত করুন
              </button>
            </form>
          </motion.div>
        </div>
      )}

    </div>
  );
};
