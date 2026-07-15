import React, { useState, useEffect } from "react";
import { useApp } from "../contexts/AppContext";
import { 
  doc, 
  updateDoc, 
  collection, 
  query, 
  where, 
  onSnapshot, 
  limit, 
  addDoc, 
  deleteDoc, 
  Timestamp 
} from "firebase/firestore";
import { db } from "../firebase/config";
import { bangladeshLocations } from "../utils/bangladeshLocations";
import { 
  MapPin, 
  User, 
  Phone, 
  Globe, 
  MessageSquare, 
  Save, 
  Image, 
  Upload, 
  CheckCircle, 
  X,
  Heart,
  Trash2,
  Edit3,
  PlusCircle,
  ToggleLeft,
  ToggleRight,
  Sparkles
} from "lucide-react";
import { motion } from "motion/react";

export const ProfileSetupPage: React.FC = () => {
  const { user, refreshUserProfile, setView, showToast } = useApp();

  const [fullName, setFullName] = useState(user?.fullName || "");
  const [bloodGroup, setBloodGroup] = useState(user?.bloodGroup || "A+");
  const [division, setDivision] = useState(user?.division || "");
  const [district, setDistrict] = useState(user?.district || "");
  const [upazila, setUpazila] = useState(user?.upazila || "");
  const [address, setAddress] = useState(user?.address || "");
  const [facebookProfile, setFacebookProfile] = useState(user?.facebookProfile || "");
  const [whatsAppNumber, setWhatsAppNumber] = useState(user?.whatsAppNumber || "");
  const [bio, setBio] = useState(user?.bio || "");
  const [avatar, setAvatar] = useState(user?.profilePicture || "");
  const [dragActive, setDragActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [additionalPhones, setAdditionalPhones] = useState<string[]>(user?.additionalPhones || []);
  const [newPhone, setNewPhone] = useState("");

  // Personal Donor Post management in Profile setup page
  const [myDonorPost, setMyDonorPost] = useState<any>(null);
  const [showPostForm, setShowPostForm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [savingPost, setSavingPost] = useState(false);

  // Form states:
  const [donorName, setDonorName] = useState("");
  const [donorPhone, setDonorPhone] = useState("");
  const [donorBloodGroup, setDonorBloodGroup] = useState("A+");
  const [donorDivision, setDonorDivision] = useState("");
  const [donorDistrict, setDonorDistrict] = useState("");
  const [donorUpazila, setDonorUpazila] = useState("");
  const [donorAddress, setDonorAddress] = useState("");
  const [donorWhatsApp, setDonorWhatsApp] = useState("");
  const [donorFacebook, setDonorFacebook] = useState("");
  const [donorTimesDonated, setDonorTimesDonated] = useState("0");
  const [donorLastDonatedAt, setDonorLastDonatedAt] = useState("কখনো না");
  const [donorNotes, setDonorNotes] = useState("");
  const [donorActive, setDonorActive] = useState(true);

  // Donation Completed feature state
  const [showDonationCompleteModal, setShowDonationCompleteModal] = useState(false);
  const [showDonationSuccessModal, setShowDonationSuccessModal] = useState(false);
  const [recipientName, setRecipientName] = useState("");
  const [recipientPhone, setRecipientPhone] = useState("");
  const [donationDate, setDonationDate] = useState(new Date().toISOString().split('T')[0]);
  const [submittingDonation, setSubmittingDonation] = useState(false);

  const donorDistrictsList = bangladeshLocations.find((d) => d.name === donorDivision)?.districts || [];
  const donorUpazilasList = donorDistrictsList.find((d) => d.name === donorDistrict)?.upazilas || [];

  // Subscription for my donor post
  useEffect(() => {
    if (!user?.uid) return;

    const q = query(
      collection(db, "donor_posts"),
      where("userId", "==", user.uid),
      limit(1)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        const docSnap = snapshot.docs[0];
        setMyDonorPost({ id: docSnap.id, ...docSnap.data() });
      } else {
        setMyDonorPost(null);
      }
    });

    return () => unsubscribe();
  }, [user?.uid]);

  // Sync form inputs when user opens the donor post edit form
  useEffect(() => {
    if (showPostForm) {
      if (myDonorPost) {
        setDonorName(myDonorPost.name || user?.fullName || "");
        setDonorPhone(myDonorPost.phone || user?.phone || "");
        setDonorBloodGroup(myDonorPost.bloodGroup || user?.bloodGroup || "A+");
        setDonorDivision(myDonorPost.division || user?.division || "");
        setDonorDistrict(myDonorPost.district || user?.district || "");
        setDonorUpazila(myDonorPost.upazila || user?.upazila || "");
        setDonorAddress(myDonorPost.address || user?.address || "");
        setDonorWhatsApp(myDonorPost.whatsApp || user?.whatsAppNumber || "");
        setDonorFacebook(myDonorPost.facebook || user?.facebookProfile || "");
        setDonorTimesDonated(String(myDonorPost.timesDonated ?? "0"));
        setDonorLastDonatedAt(myDonorPost.lastDonatedAt || "কখনো না");
        setDonorNotes(myDonorPost.notes || "");
        setDonorActive(myDonorPost.paused !== undefined ? !myDonorPost.paused : true);
      } else if (user) {
        setDonorName(user.fullName || "");
        setDonorPhone(user.phone || "");
        setDonorBloodGroup(user.bloodGroup || "A+");
        setDonorDivision(user.division || "");
        setDonorDistrict(user.district || "");
        setDonorUpazila(user.upazila || "");
        setDonorAddress(user.address || "");
        setDonorWhatsApp(user.whatsAppNumber || "");
        setDonorFacebook(user.facebookProfile || "");
        setDonorTimesDonated("0");
        setDonorLastDonatedAt("কখনো না");
        setDonorNotes("");
        setDonorActive(true);
      }
    }
  }, [showPostForm, myDonorPost, user]);

  // Handle Save / Update donor post from Profile Page
  const handleSaveDonorPost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.uid) return;

    if (user?.bloodDonationLockedUntil) {
      const lockTime = user.bloodDonationLockedUntil.toDate ? user.bloodDonationLockedUntil.toDate() : new Date(user.bloodDonationLockedUntil);
      if (lockTime > new Date() && !myDonorPost?.id) {
        showToast("দুঃখিত, আপনি ৩ মাসের বিরতির মধ্যে থাকায় নতুন রক্তদাতা পোস্ট তৈরি করতে পারবেন না।", "error");
        return;
      }
    }

    if (!donorName.trim() || !donorPhone.trim() || !donorBloodGroup || !donorDivision || !donorDistrict || !donorUpazila) {
      showToast("দয়া করে প্রয়োজনীয় সব ক্ষেত্র পূরণ করুন।", "warning");
      return;
    }

    setSavingPost(true);
    try {
      const postData = {
        userId: user.uid,
        name: donorName.trim(),
        phone: donorPhone.trim(),
        bloodGroup: donorBloodGroup,
        division: donorDivision,
        district: donorDistrict,
        upazila: donorUpazila,
        address: donorAddress.trim(),
        whatsApp: donorWhatsApp.trim(),
        facebook: donorFacebook.trim(),
        timesDonated: Number(donorTimesDonated) || 0,
        lastDonatedAt: donorLastDonatedAt,
        notes: donorNotes.trim(),
        paused: !donorActive,
        createdAt: Timestamp.now(),
        image: user.profilePicture || ""
      };

      if (myDonorPost?.id) {
        await updateDoc(doc(db, "donor_posts", myDonorPost.id), postData);
        showToast("আপনার রক্তদাতা পোস্ট সফলভাবে আপডেট করা হয়েছে।", "success");
      } else {
        await addDoc(collection(db, "donor_posts"), postData);
        showToast("অভিনন্দন! আপনার রক্তদাতা পোস্ট সফলভাবে তৈরি করা হয়েছে।", "success");
      }
      setShowPostForm(false);
      setIsEditing(false);
    } catch (err) {
      console.error("Save donor post error:", err);
      showToast("পোস্টটি সংরক্ষণ করতে ত্রুটি ঘটেছে। অনুগ্রহ করে আবার চেষ্টা করুন।", "error");
    } finally {
      setSavingPost(false);
    }
  };

  // Toggle my donor post visibility from Profile Page
  const handleTogglePause = async () => {
    if (!myDonorPost?.id) return;
    if (user?.bloodDonationLockedUntil) {
      const lockTime = user.bloodDonationLockedUntil.toDate ? user.bloodDonationLockedUntil.toDate() : new Date(user.bloodDonationLockedUntil);
      if (lockTime > new Date() && myDonorPost.paused) {
        showToast("দুঃখিত, আপনি ৩ মাসের লকড পিরিয়ডের মধ্যে আছেন। এই সময় আপনার পোস্ট সক্রিয় করতে পারবেন না।", "warning");
        return;
      }
    }
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

  // Delete My Donor Post from Profile Page
  const handleDeleteDonorPost = async () => {
    if (!myDonorPost?.id) return;
    try {
      await deleteDoc(doc(db, "donor_posts", myDonorPost.id));
      showToast("আপনার রক্তদাতা পোস্টটি সফলভাবে মুছে ফেলা হয়েছে।", "warning");
      setShowDeleteConfirm(false);
      setShowPostForm(false);
    } catch (err) {
      console.error("Delete donor post error:", err);
      showToast("মুছে ফেলতে সমস্যা হয়েছে।", "error");
    }
  };

  // Confirm Donation and apply 3-month block (cooldown) from Profile Page
  const handleConfirmDonation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.uid) return;
    if (!recipientName.trim() || !recipientPhone.trim() || !donationDate) {
      showToast("দয়া করে প্রয়োজনীয় সব তথ্য পূরণ করুন।", "warning");
      return;
    }

    setSubmittingDonation(true);
    try {
      // 1. Calculate lock expiry (90 days from the chosen donation date)
      const donationDateObj = new Date(donationDate);
      const lockExpiryDate = new Date(donationDateObj.getTime());
      lockExpiryDate.setDate(lockExpiryDate.getDate() + 90);
      const lockExpiryTimestamp = Timestamp.fromDate(lockExpiryDate);

      // 2. Add record to donation_history
      await addDoc(collection(db, "donation_history"), {
        donorId: user.uid,
        recipientName: recipientName.trim(),
        recipientPhone: recipientPhone.trim(),
        recipientDistrict: myDonorPost?.district || user.district || "অনির্ধারিত",
        donationDate: Timestamp.fromDate(donationDateObj),
        createdAt: Timestamp.now(),
        notes: "রক্তদান সম্পন্ন (আমি দিয়েছি ফিচার - প্রোফাইল পেজ)"
      });

      // 3. Update User document with lock expiry
      const userRef = doc(db, "users", user.uid);
      await updateDoc(userRef, {
        bloodDonationLockedUntil: lockExpiryTimestamp,
        lastDonationDate: Timestamp.fromDate(donationDateObj)
      });

      // 4. Update my donor post (if exists) with lock expiry and auto-pause it, incrementing donation count
      if (myDonorPost?.id) {
        await updateDoc(doc(db, "donor_posts", myDonorPost.id), {
          paused: true,
          bloodDonationLockedUntil: lockExpiryTimestamp,
          lastDonatedAt: donationDate,
          timesDonated: (myDonorPost.timesDonated || 0) + 1
        });
      }

      showToast("রক্তদানের তথ্য সফলভাবে সংরক্ষণ করা হয়েছে!", "success");
      setShowDonationCompleteModal(false);
      setShowDonationSuccessModal(true);
      
      // Reset input fields
      setRecipientName("");
      setRecipientPhone("");
      setDonationDate(new Date().toISOString().split('T')[0]);
    } catch (err) {
      console.error("Donation confirmation error:", err);
      showToast("তথ্য সংরক্ষণ করতে সমস্যা হয়েছে। দয়া করে আবার চেষ্টা করুন।", "error");
    } finally {
      setSubmittingDonation(false);
    }
  };

  useEffect(() => {
    if (user?.additionalPhones) {
      setAdditionalPhones(user.additionalPhones);
    }
  }, [user]);

  // Filter lists based on selection
  const districts = bangladeshLocations.find((d) => d.name === division)?.districts || [];
  const upazilas = districts.find((d) => d.name === district)?.upazilas || [];

  // Recalculate lists when division or district changes
  useEffect(() => {
    if (division && !districts.some((d) => d.name === district)) {
      setDistrict("");
      setUpazila("");
    }
  }, [division]);

  useEffect(() => {
    if (district && !upazilas.includes(upazila)) {
      setUpazila("");
    }
  }, [district]);

  // Calculate completeness percentage
  const calculateCompleteness = () => {
    let total = 6; // Name, BloodGroup, Division, District, Upazila, Address are core (already has phone)
    let filled = 0;
    if (fullName.trim()) filled++;
    if (bloodGroup) filled++;
    if (division) filled++;
    if (district) filled++;
    if (upazila) filled++;
    if (address.trim()) filled++;

    let optionalTotal = 4; // Avatar, FB, WhatsApp, Bio
    let optionalFilled = 0;
    if (avatar) optionalFilled++;
    if (facebookProfile.trim()) optionalFilled++;
    if (whatsAppNumber.trim()) optionalFilled++;
    if (bio.trim()) optionalFilled++;

    const percent = Math.round(((filled + optionalFilled) / (total + optionalTotal)) * 100);
    return percent;
  };

  const completeness = calculateCompleteness();

  // Drag and drop handlers for avatar upload
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const processFile = (file: File) => {
    if (!file.type.startsWith("image/")) {
      showToast("দয়া করে শুধুমাত্র ছবি ফাইল আপলোড করুন।", "error");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      showToast("ছবির সাইজ ২ মেগাবাইটের (2MB) বেশি হওয়া যাবে না।", "error");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        setAvatar(e.target.result as string);
        showToast("প্রোফাইল ছবি লোড করা হয়েছে।", "success");
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const handleAddPhone = () => {
    const cleaned = newPhone.trim();
    if (!cleaned) return;
    if (!/^01[3-9]\d{8}$/.test(cleaned)) {
      showToast("দয়া করে সঠিক ১১ ডিজিটের বাংলাদেশী মোবাইল নম্বর দিন (যেমন: 017XXXXXXXX)।", "warning");
      return;
    }
    if (cleaned === user?.phone || additionalPhones.includes(cleaned)) {
      showToast("এই নম্বরটি ইতিমধ্যে যুক্ত রয়েছে।", "warning");
      return;
    }
    setAdditionalPhones([...additionalPhones, cleaned]);
    setNewPhone("");
    showToast("অতিরিক্ত মোবাইল নম্বর যুক্ত করা হয়েছে।", "success");
  };

  const handleRemovePhone = (phoneToRemove: string) => {
    setAdditionalPhones(additionalPhones.filter((p) => p !== phoneToRemove));
    showToast("নম্বরটি সরিয়ে ফেলা হয়েছে।", "info");
  };

  // Submit Profile Setup
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!fullName.trim() || !division || !district || !upazila || !address.trim()) {
      showToast("অনুগ্রহ করে সকল আবশ্যকীয় তথ্য পূরণ করুন।", "warning");
      return;
    }

    setLoading(true);

    try {
      if (user?.uid) {
        const userRef = doc(db, "users", user.uid);
        await updateDoc(userRef, {
          fullName: fullName.trim(),
          bloodGroup,
          division,
          district,
          upazila,
          address: address.trim(),
          facebookProfile: facebookProfile.trim(),
          whatsAppNumber: whatsAppNumber.trim(),
          bio: bio.trim(),
          profilePicture: avatar,
          profileCompleted: true,
          additionalPhones: additionalPhones,
        });

        await refreshUserProfile();
        showToast("আপনার প্রোফাইল সফলভাবে আপডেট করা হয়েছে।", "success");
        // Save flag in localStorage to show onboarding tutorial on home redirect
        localStorage.setItem(`show_onboarding_${user.uid}`, "true");
        setView("home");
      }
    } catch (err: any) {
      console.error("Profile Setup Error:", err);
      showToast("তথ্য সেভ করতে সমস্যা হয়েছে। দয়া করে আবার চেষ্টা করুন।", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-4 md:py-8">
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-3xl border border-slate-100 shadow-xl overflow-hidden"
      >
        {/* Top Progress Header */}
        <div className="p-6 md:p-8 bg-slate-50 border-b border-slate-100">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-slate-800">আপনার প্রোফাইল তথ্য সম্পূর্ণ করুন 👤</h2>
              <p className="text-slate-500 text-sm mt-1">অন্য গ্রহীতা বা দাতা যাতে আপনাকে সহজে খুঁজে পায় তাই সঠিক তথ্য দিন।</p>
            </div>
            
            <div className="shrink-0 flex items-center gap-3">
              <div className="text-right">
                <span className="text-xs font-bold text-slate-400 block uppercase tracking-wider">প্রোফাইল সম্পন্ন</span>
                <span className="text-xl font-extrabold text-red-500">{completeness}%</span>
              </div>
              <div className="w-16 h-16 rounded-full border-4 border-slate-200 flex items-center justify-center relative overflow-hidden">
                <svg className="w-full h-full transform -rotate-90">
                  <circle
                    cx="32"
                    cy="32"
                    r="26"
                    stroke="#F1F5F9"
                    strokeWidth="4"
                    fill="transparent"
                  />
                  <circle
                    cx="32"
                    cy="32"
                    r="26"
                    stroke="#EF4444"
                    strokeWidth="4"
                    fill="transparent"
                    strokeDasharray="163.36"
                    strokeDashoffset={163.36 - (163.36 * completeness) / 100}
                    className="transition-all duration-500"
                  />
                </svg>
                <span className="absolute text-[11px] font-extrabold text-slate-700">{completeness}%</span>
              </div>
            </div>
          </div>
          
          {completeness < 100 && (
            <div className="mt-4 p-3 bg-red-50 rounded-xl text-xs text-red-800 font-medium border border-red-100 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse shrink-0" />
              <span>নিবন্ধন শেষ করতে আপনার ঠিকানা, রক্তের গ্রুপ ও এলাকা নিশ্চিত করুন।</span>
            </div>
          )}
        </div>

        {/* Setup Form */}
        <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-6">
          
          {/* File Upload (Avatar Drag & Drop + Click) */}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">প্রোফাইল ছবি (ঐচ্ছিক)</label>
            <div 
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-2xl p-6 flex flex-col items-center justify-center transition-all ${
                dragActive 
                  ? "border-red-500 bg-red-50/30" 
                  : avatar 
                  ? "border-emerald-200 bg-emerald-50/10" 
                  : "border-slate-200 bg-slate-50/50 hover:bg-slate-50"
              }`}
            >
              {avatar ? (
                <div className="flex flex-col items-center gap-3">
                  <img src={avatar} alt="Profile preview" className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-md" />
                  <div className="flex gap-2">
                    <label className="cursor-pointer bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold py-1.5 px-3.5 rounded-lg transition-all shadow-sm">
                      পরিবর্তন করুন
                      <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                    </label>
                    <button 
                      type="button" 
                      onClick={() => setAvatar("")}
                      className="bg-white border border-rose-200 hover:bg-rose-50 text-rose-600 text-xs font-bold py-1.5 px-3.5 rounded-lg transition-all shadow-sm"
                    >
                      মুছে ফেলুন
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center text-center">
                  <div className="p-3 bg-white rounded-xl shadow-sm mb-3 border border-slate-100 text-slate-400">
                    <Upload className="w-6 h-6 text-red-500" />
                  </div>
                  <p className="text-sm font-bold text-slate-700">ছবি ড্র্যাগ করুন অথবা ক্লিক করে আপলোড করুন</p>
                  <p className="text-xs text-slate-400 mt-1 font-medium">JPEG, PNG সর্বোচ্চ সাইজ ২ মেগাবাইট (2MB)</p>
                  
                  <label className="cursor-pointer mt-4 py-2 px-4 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl shadow-sm transition-all">
                    ছবি সিলেক্ট করুন
                    <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                  </label>
                </div>
              )}
            </div>
          </div>

          {/* Core Info Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">সম্পূর্ণ নাম <span className="text-red-500">*</span></label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                  <User className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-red-500 focus:bg-white transition-all text-slate-800 font-medium"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">মোবাইল নম্বর (পরিবর্তনযোগ্য নয়)</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                  <Phone className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  disabled
                  value={user?.phone || ""}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-sm text-slate-500 cursor-not-allowed font-medium"
                />
              </div>
            </div>
          </div>

          {/* Additional Phone Numbers section */}
          <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 space-y-3">
            <div>
              <h4 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                <Phone className="w-4 h-4 text-red-500" /> অতিরিক্ত মোবাইল নম্বরসমূহ (ঐচ্ছিক)
              </h4>
              <p className="text-slate-400 text-[11px] mt-0.5 font-semibold leading-relaxed">
                জরুরি মুহূর্তে রক্তগ্রহীতারা যাতে আপনাকে সহজে খুঁজে পায় সেজন্য একাধিক নম্বর যুক্ত করতে পারেন।
              </p>
            </div>

            <div className="flex gap-2">
              <input
                type="tel"
                placeholder="যেমন: 018XXXXXXXX"
                value={newPhone}
                onChange={(e) => setNewPhone(e.target.value)}
                className="flex-1 px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-red-500 text-slate-800 font-semibold"
              />
              <button
                type="button"
                onClick={handleAddPhone}
                className="bg-slate-800 hover:bg-slate-700 active:scale-95 text-white text-xs font-bold px-4 py-2 rounded-xl transition-all shadow-sm"
              >
                যুক্ত করুন
              </button>
            </div>

            {additionalPhones.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {additionalPhones.map((phone) => (
                  <span key={phone} className="inline-flex items-center gap-1.5 bg-white border border-slate-200 text-slate-700 px-3 py-1.5 rounded-xl text-xs font-bold shadow-xs">
                    {phone}
                    <button
                      type="button"
                      onClick={() => handleRemovePhone(phone)}
                      className="text-slate-400 hover:text-red-500 transition-colors"
                      title="সরিয়ে ফেলুন"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-slate-400 text-xs italic">কোন অতিরিক্ত নম্বর যুক্ত করা হয়নি।</p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">রক্তের গ্রুপ <span className="text-red-500">*</span></label>
              <select
                value={bloodGroup}
                onChange={(e) => setBloodGroup(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 focus:outline-none focus:border-red-500 focus:bg-white"
              >
                {["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"].map((g) => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">বিভাগ <span className="text-red-500">*</span></label>
              <select
                value={division}
                onChange={(e) => setDivision(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:border-red-500 focus:bg-white"
              >
                <option value="">বাছাই করুন</option>
                {bangladeshLocations.map((d) => (
                  <option key={d.name} value={d.name}>{d.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">জেলা <span className="text-red-500">*</span></label>
              <select
                value={district}
                disabled={!division}
                onChange={(e) => setDistrict(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 disabled:bg-slate-100 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:border-red-500 focus:bg-white"
              >
                <option value="">বাছাই করুন</option>
                {districts.map((d) => (
                  <option key={d.name} value={d.name}>{d.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">উপজেলা <span className="text-red-500">*</span></label>
              <select
                value={upazila}
                disabled={!district}
                onChange={(e) => setUpazila(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 disabled:bg-slate-100 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:border-red-500 focus:bg-white"
              >
                <option value="">বাছাই করুন</option>
                {upazilas.map((u) => (
                  <option key={u} value={u}>{u}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">সরাসরি বা গ্রাম/পাড়া ঠিকানা <span className="text-red-500">*</span></label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                <MapPin className="w-4 h-4" />
              </span>
              <input
                type="text"
                required
                placeholder="যেমন: হাউজ নং-২৪, রোড নং-০৩, মিরপুর-১০"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-red-500 focus:bg-white transition-all text-slate-800 font-medium"
              />
            </div>
          </div>

          {/* Social Profiles */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">ফেসবুক প্রোফাইল লিংক (ঐচ্ছিক)</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                  <Globe className="w-4 h-4" />
                </span>
                <input
                  type="url"
                  placeholder="যেমন: https://facebook.com/username"
                  value={facebookProfile}
                  onChange={(e) => setFacebookProfile(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-red-500 focus:bg-white transition-all text-slate-800 font-medium"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">হোয়াটসঅ্যাপ নম্বর (ঐচ্ছিক)</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                  <MessageSquare className="w-4 h-4" />
                </span>
                <input
                  type="tel"
                  placeholder="যেমন: 017XXXXXXXX"
                  value={whatsAppNumber}
                  onChange={(e) => setWhatsAppNumber(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-red-500 focus:bg-white transition-all text-slate-800 font-medium"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">ছোট পরিচিতি (বায়ো - ঐচ্ছিক)</label>
            <textarea
              placeholder="নিজের সম্পর্কে বা ইতিপূর্বে কতবার রক্ত দিয়েছেন তা সংক্ষেপে লিখুন..."
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={3}
              maxLength={300}
              className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:border-red-500 focus:bg-white transition-all text-slate-800 font-medium"
            />
            <div className="flex justify-end text-[11px] text-slate-400 font-bold mt-1">
              {bio.length}/৩০০ অক্ষর
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-red-500 hover:bg-red-600 disabled:bg-red-300 active:scale-95 text-white font-extrabold rounded-2xl shadow-lg shadow-red-500/10 transition-all flex items-center justify-center gap-2 text-sm mt-4 cursor-pointer"
          >
            {loading ? "সেভ করা হচ্ছে..." : "প্রোফাইল সংরক্ষণ করুন"} <Save className="w-4 h-4" />
          </button>

        </form>
      </motion.div>

      {/* PERSONAL DONOR POST CARD */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-3xl border border-slate-100 shadow-xl overflow-hidden mt-6"
      >
        <div className="p-6 md:p-8 bg-slate-50 border-b border-slate-100 flex justify-between items-center flex-wrap gap-3">
          <div>
            <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <Heart className="w-5 h-5 text-red-500 fill-red-500" /> রক্তদাতা হিসেবে আপনার পোস্ট 🩸
            </h3>
            <p className="text-slate-500 text-xs mt-1">রক্তদাতাদের তালিকায় পোস্ট করে রক্ত গ্রহীতাদের সাথে সহজে যোগাযোগ করুন।</p>
          </div>

          {!myDonorPost && !showPostForm && (
            <button
              onClick={() => {
                if (user?.bloodDonationLockedUntil) {
                  const lockTime = user.bloodDonationLockedUntil.toDate ? user.bloodDonationLockedUntil.toDate() : new Date(user.bloodDonationLockedUntil);
                  if (lockTime > new Date()) {
                    const remainingDays = Math.ceil((lockTime.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                    showToast(`দুঃখিত, আপনি সম্প্রতি রক্ত দিয়েছেন। ৩ মাসের মধ্যে আপনি নতুন রক্তদাতা পোস্ট তৈরি করতে পারবেন না। লক খোলার বাকি: ${remainingDays} দিন।`, "warning");
                    return;
                  }
                }
                setShowPostForm(true);
              }}
              className="py-2.5 px-5 bg-red-500 hover:bg-red-600 active:scale-95 text-white font-extrabold text-xs rounded-2xl shadow-lg shadow-red-500/10 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" /> নতুন রক্তদাতা পোস্ট তৈরি করুন
            </button>
          )}
        </div>

        <div className="p-6 md:p-8">
          {showPostForm ? (
            /* CREATING OR EDITING FORM */
            <form onSubmit={handleSaveDonorPost} className="space-y-4 text-xs font-semibold text-slate-700">
              <h4 className="text-sm font-bold text-slate-800 border-b pb-2 mb-3">
                {myDonorPost ? "পোস্টের তথ্য পরিবর্তন করুন" : "নতুন রক্তদাতা পোস্টের তথ্য পূরণ করুন"}
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-500 mb-1.5">রক্তদাতার নাম <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    required
                    placeholder="যেমন: শরিফুল ইসলাম"
                    value={donorName}
                    onChange={(e) => setDonorName(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-semibold text-xs focus:outline-none focus:border-red-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 mb-1.5">মোবাইল নম্বর <span className="text-red-500">*</span></label>
                  <input
                    type="tel"
                    required
                    placeholder="যেমন: 017XXXXXXXX"
                    value={donorPhone}
                    onChange={(e) => setDonorPhone(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-semibold text-xs focus:outline-none focus:border-red-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-500 mb-1.5">রক্তের গ্রুপ <span className="text-red-500">*</span></label>
                  <select
                    required
                    value={donorBloodGroup}
                    onChange={(e) => setDonorBloodGroup(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-bold text-xs"
                  >
                    {["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"].map(bg => (
                      <option key={bg} value={bg}>{bg}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-500 mb-1.5">বিভাগ <span className="text-red-500">*</span></label>
                  <select
                    required
                    value={donorDivision}
                    onChange={(e) => {
                      setDonorDivision(e.target.value);
                      setDonorDistrict("");
                      setDonorUpazila("");
                    }}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-semibold text-xs"
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
                  <label className="block text-slate-500 mb-1.5">জেলা <span className="text-red-500">*</span></label>
                  <select
                    required
                    disabled={!donorDivision}
                    value={donorDistrict}
                    onChange={(e) => {
                      setDonorDistrict(e.target.value);
                      setDonorUpazila("");
                    }}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-semibold text-xs disabled:bg-slate-100"
                  >
                    <option value="">নির্বাচন করুন</option>
                    {donorDistrictsList.map(dst => (
                      <option key={dst.name} value={dst.name}>{dst.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-500 mb-1.5">উপজেলা <span className="text-red-500">*</span></label>
                  <select
                    required
                    disabled={!donorDistrict}
                    value={donorUpazila}
                    onChange={(e) => setDonorUpazila(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-semibold text-xs disabled:bg-slate-100"
                  >
                    <option value="">নির্বাচন করুন</option>
                    {donorUpazilasList.map(up => (
                      <option key={up} value={up}>{up}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-500 mb-1.5">ঠিকানা/গ্রাম/পাড়া <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  required
                  placeholder="যেমন: হাউজ নং-২৪, রোড নং-০৩, মিরপুর-১০"
                  value={donorAddress}
                  onChange={(e) => setDonorAddress(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-medium text-xs focus:outline-none focus:border-red-500"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-500 mb-1.5">হোয়াটসঅ্যাপ নম্বর (ঐচ্ছিক)</label>
                  <input
                    type="tel"
                    placeholder="যেমন: 017XXXXXXXX"
                    value={donorWhatsApp}
                    onChange={(e) => setDonorWhatsApp(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-medium text-xs focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 mb-1.5">ফেসবুক প্রোফাইল লিংক (ঐচ্ছিক)</label>
                  <input
                    type="url"
                    placeholder="যেমন: https://facebook.com/username"
                    value={donorFacebook}
                    onChange={(e) => setDonorFacebook(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-medium text-xs focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-500 mb-1.5">ইতিপূর্বে কতবার রক্ত দিয়েছেন?</label>
                  <input
                    type="number"
                    min={0}
                    placeholder="যেমন: ৩"
                    value={donorTimesDonated}
                    onChange={(e) => setDonorTimesDonated(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-medium text-xs focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 mb-1.5">সর্বশেষ রক্তদানের তারিখ</label>
                  <input
                    type="text"
                    placeholder="যেমন: ১০/০৫/২০২৬"
                    value={donorLastDonatedAt}
                    onChange={(e) => setDonorLastDonatedAt(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-medium text-xs focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-500 mb-1.5">বিশেষ মন্তব্য (ঐচ্ছিক)</label>
                <textarea
                  placeholder="আপনি কোন এলাকায় নিয়মিত রক্ত দিতে পারবেন বা বিশেষ কোনো শর্ত থাকলে তা লিখুন..."
                  value={donorNotes}
                  onChange={(e) => setDonorNotes(e.target.value)}
                  rows={2}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-medium text-xs focus:outline-none focus:border-red-500"
                />
              </div>

              <div className="flex items-center justify-between p-3.5 bg-red-50/30 rounded-2xl border border-red-100/60">
                <div>
                  <label className="block text-slate-800 font-bold text-xs flex items-center gap-1.5">
                    <Heart className="w-4 h-4 text-red-500 fill-red-500" /> রক্তদানের জন্য আপনার সচলতা (Availability)
                  </label>
                  <p className="text-[10px] text-slate-500 font-medium mt-0.5">রক্তদাতার তালিকায় এটি সক্রিয় বা নিষ্ক্রিয় করে রাখুন।</p>
                </div>
                <button
                  type="button"
                  onClick={() => setDonorActive(!donorActive)}
                  className="focus:outline-none transition-transform active:scale-95"
                >
                  {donorActive ? (
                    <ToggleRight className="w-10 h-10 text-emerald-500 drop-shadow-sm cursor-pointer" />
                  ) : (
                    <ToggleLeft className="w-10 h-10 text-slate-300 cursor-pointer" />
                  )}
                </button>
              </div>

              <div className="flex gap-2.5 pt-2">
                <button
                  type="submit"
                  disabled={savingPost}
                  className="flex-1 py-3 bg-red-500 hover:bg-red-600 text-white font-extrabold rounded-2xl shadow-lg transition-all flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
                >
                  {savingPost ? "সংরক্ষণ করা হচ্ছে..." : "পোস্ট সেভ করুন"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowPostForm(false);
                    setIsEditing(false);
                  }}
                  className="px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-2xl transition-all cursor-pointer"
                >
                  বাতিল
                </button>
              </div>
            </form>
          ) : myDonorPost ? (
            /* VIEWING ACTIVE POST DETAILS */
            <div className="space-y-6 text-xs font-semibold text-slate-700">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4">
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
                      <h4 className="font-black text-slate-800 text-sm">{myDonorPost.name}</h4>
                      <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${myDonorPost.paused ? "bg-slate-100 text-slate-500 border" : "bg-emerald-50 text-emerald-600 border border-emerald-100"}`}>
                        {myDonorPost.paused ? "নিষ্ক্রিয়" : "সক্রিয়"}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400 font-bold mt-0.5">পোস্ট আইডি: {myDonorPost.id}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-slate-500 font-bold">লিস্টে দৃশ্যমানতা:</span>
                  <button 
                    onClick={handleTogglePause}
                    className="focus:outline-none transition-transform active:scale-95"
                    title={myDonorPost.paused ? "সক্রিয় করুন" : "নিষ্ক্রিয় করুন"}
                  >
                    {myDonorPost.paused ? (
                      <ToggleLeft className="w-10 h-10 text-slate-300 cursor-pointer" />
                    ) : (
                      <ToggleRight className="w-10 h-10 text-emerald-500 drop-shadow-sm cursor-pointer" />
                    )}
                  </button>
                </div>
              </div>

              {/* Grid fields */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-slate-50 p-3 rounded-2xl border text-center">
                  <span className="text-slate-400 text-[9px] uppercase block tracking-wider mb-0.5">রক্তের গ্রুপ</span>
                  <p className="text-red-600 font-black text-base">{myDonorPost.bloodGroup}</p>
                </div>
                <div className="bg-slate-50 p-3 rounded-2xl border text-center">
                  <span className="text-slate-400 text-[9px] uppercase block tracking-wider mb-0.5">রক্তদান সংখ্যা</span>
                  <p className="text-slate-800 font-black text-sm">{myDonorPost.timesDonated || "০"} বার</p>
                </div>
                <div className="bg-slate-50 p-3 rounded-2xl border text-center">
                  <span className="text-slate-400 text-[9px] uppercase block tracking-wider mb-0.5">সর্বশেষ রক্তদান</span>
                  <p className="text-slate-800 font-black text-[11px] truncate">{myDonorPost.lastDonatedAt || "তথ্য নেই"}</p>
                </div>
              </div>

              {/* Location and Contacts */}
              <div className="border p-4 rounded-2xl bg-slate-50/50 grid grid-cols-1 sm:grid-cols-2 gap-3.5 shadow-inner">
                <div>
                  <span className="text-slate-400 text-[9px] uppercase tracking-wider block">ফোন নম্বর</span>
                  <p className="text-slate-700 font-bold flex items-center gap-1 mt-0.5">
                    <Phone className="w-3.5 h-3.5 text-slate-400" /> {myDonorPost.phone}
                  </p>
                </div>
                {myDonorPost.whatsApp && (
                  <div>
                    <span className="text-slate-400 text-[9px] uppercase tracking-wider block">হোয়াটসঅ্যাপ</span>
                    <p className="text-emerald-600 font-bold flex items-center gap-1 mt-0.5">
                      <MessageSquare className="w-3.5 h-3.5 text-emerald-500" /> {myDonorPost.whatsApp}
                    </p>
                  </div>
                )}
                {myDonorPost.facebook && (
                  <div>
                    <span className="text-slate-400 text-[9px] uppercase tracking-wider block">ফেসবুক প্রোফাইল</span>
                    <p className="text-blue-600 font-bold flex items-center gap-1 mt-0.5 truncate max-w-[180px]">
                      <Globe className="w-3.5 h-3.5 text-blue-500" /> {myDonorPost.facebook}
                    </p>
                  </div>
                )}
                <div>
                  <span className="text-slate-400 text-[9px] uppercase tracking-wider block">ঠিকানা ও এলাকা</span>
                  <p className="text-slate-700 font-bold flex items-center gap-1 mt-0.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" /> {myDonorPost.upazila}, {myDonorPost.district}
                  </p>
                </div>
              </div>

              {myDonorPost.notes && (
                <div className="p-4 bg-red-50/30 rounded-2xl border space-y-1">
                  <span className="text-red-500 text-[9px] uppercase font-black tracking-wider block">বিশেষ মন্তব্য</span>
                  <p className="text-slate-600 leading-relaxed font-semibold">{myDonorPost.notes}</p>
                </div>
              )}

              {/* Donation Completed Button */}
              <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-2xl space-y-2">
                <p className="text-[11px] text-emerald-800 font-extrabold flex items-center gap-1.5">
                  <CheckCircle className="w-4 h-4 text-emerald-600 animate-bounce" /> রক্তদান সম্পন্ন করেছেন?
                </p>
                <p className="text-[10px] text-slate-500 leading-relaxed">
                  আপনি যদি সফলভাবে রক্তদান সম্পন্ন করে থাকেন, তবে নিচের 'আমি রক্ত দিয়েছি' বাটনে ক্লিক করুন। এটি আপনার প্রোফাইলে রক্তদানের ইতিহাস যোগ করবে এবং সুস্থ রক্তদানের নিয়মানুযায়ী আগামী ৩ মাসের জন্য নতুন পোস্ট তৈরিতে বিরতি দিবে।
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setShowDonationCompleteModal(true);
                  }}
                  className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl shadow-md shadow-emerald-500/10 flex items-center justify-center gap-1.5 transition-all text-xs cursor-pointer active:scale-95"
                >
                  <Heart className="w-3.5 h-3.5 fill-white" /> আমি রক্ত দিয়েছি 🩸
                </button>
              </div>

              {/* Action buttons */}
              <div className="flex gap-3 pt-3 border-t">
                <button
                  onClick={() => {
                    setShowPostForm(true);
                    setIsEditing(true);
                  }}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Edit3 className="w-4 h-4" /> এডিট করুন
                </button>

                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="py-2.5 px-4 bg-rose-50 hover:bg-rose-100 text-rose-600 hover:text-rose-700 rounded-xl border border-rose-100 transition-colors flex items-center justify-center gap-1 cursor-pointer"
                  title="মুছে ফেলুন"
                >
                  <Trash2 className="w-4 h-4" /> পোস্ট মুছুন
                </button>
              </div>

              {showDeleteConfirm && (
                <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl text-xs space-y-3 mt-3 animate-fade-in">
                  <p className="text-rose-700 font-black">আপনি কি নিশ্চিতভাবে আপনার রক্তদাতার পোস্টটি মুছে ফেলতে চান?</p>
                  <div className="flex gap-2">
                    <button
                      onClick={handleDeleteDonorPost}
                      className="px-4 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-extrabold cursor-pointer"
                    >
                      হ্যাঁ, নিশ্চিত মুছুন
                    </button>
                    <button
                      onClick={() => setShowDeleteConfirm(false)}
                      className="px-4 py-1.5 bg-white border text-slate-600 rounded-lg font-bold cursor-pointer"
                    >
                      বাতিল
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* NO POST CREATED YET */
            <div className="text-center py-8 space-y-3">
              <div className="w-12 h-12 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto shadow-inner">
                <Heart className="w-6 h-6" />
              </div>
              <p className="text-slate-500 text-xs font-semibold">আপনার এখনো কোনো রক্তদাতা পোস্ট তৈরি করা হয়নি।</p>
              <button
                onClick={() => {
                  if (user?.bloodDonationLockedUntil) {
                    const lockTime = user.bloodDonationLockedUntil.toDate ? user.bloodDonationLockedUntil.toDate() : new Date(user.bloodDonationLockedUntil);
                    if (lockTime > new Date()) {
                      const remainingDays = Math.ceil((lockTime.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                      showToast(`দুঃখিত, আপনি সম্প্রতি রক্ত দিয়েছেন। ৩ মাসের মধ্যে আপনি নতুন রক্তদাতা পোস্ট তৈরি করতে পারবেন না। লক খোলার বাকি: ${remainingDays} দিন।`, "warning");
                      return;
                    }
                  }
                  setShowPostForm(true);
                }}
                className="py-2.5 px-5 bg-red-50 border border-red-200 hover:bg-red-100 text-red-600 font-black text-xs rounded-xl transition-all inline-flex items-center gap-1.5 cursor-pointer"
              >
                <PlusCircle className="w-4 h-4" /> রক্তদাতার তালিকায় যুক্ত হোন
              </button>
            </div>
          )}
        </div>
      </motion.div>

      {/* DONATION COMPLETE DETAIL POPUP */}
      {showDonationCompleteModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto text-left">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl max-w-md w-full border shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white p-5 flex justify-between items-center shrink-0">
              <div className="flex items-center gap-2">
                <Heart className="w-5 h-5 fill-white text-white animate-pulse" />
                <h3 className="font-extrabold text-base">রক্তদান সফল তথ্য ফরম 🩸</h3>
              </div>
              <button 
                onClick={() => setShowDonationCompleteModal(false)} 
                className="text-white/80 hover:text-white bg-black/10 hover:bg-black/20 p-1.5 rounded-full transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form Content */}
            <form onSubmit={handleConfirmDonation} className="p-6 overflow-y-auto space-y-4 text-xs font-semibold text-slate-700">
              <p className="text-[11px] text-slate-500 leading-relaxed mb-2">
                আপনার রক্তদানের মহান কাজটি আমাদের সিস্টেমে লিপিবদ্ধ করতে নিচের তথ্যগুলো নির্ভুলভাবে প্রদান করুন। এর ফলে রক্তদাতার নিয়মানuযায়ী ৩ মাসের সেফটি বিরতি চালু করা হবে।
              </p>

              <div>
                <label className="block text-slate-500 mb-1">কাকে রক্ত দিয়েছেন? (গ্রহীতা/রোগীর নাম) <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  required
                  maxLength={100}
                  placeholder="যেমন: শরিফুল ইসলাম"
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-semibold"
                />
              </div>

              <div>
                <label className="block text-slate-500 mb-1">গ্রহীতা/স্বজনের মোবাইল নম্বর <span className="text-red-500">*</span></label>
                <input
                  type="tel"
                  required
                  placeholder="যেমন: 017XXXXXXXX"
                  value={recipientPhone}
                  onChange={(e) => setRecipientPhone(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-semibold"
                />
              </div>

              <div>
                <label className="block text-slate-500 mb-1">রক্তদানের তারিখ <span className="text-red-500">*</span></label>
                <input
                  type="date"
                  required
                  max={new Date().toISOString().split('T')[0]}
                  value={donationDate}
                  onChange={(e) => setDonationDate(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-bold text-xs"
                />
              </div>

              <div className="bg-emerald-50 border border-emerald-100 p-3.5 rounded-2xl text-[10px] text-emerald-800 leading-relaxed space-y-1">
                <span className="font-black block uppercase tracking-wider">রক্তদান বিরতি সতর্কবার্তা:</span>
                <p>
                  কনফার্ম করার সাথে সাথে ৩ মাসের জন্য এই আইডি দিয়ে আর কোনো রক্তদাতার নতুন পোস্ট বা রক্তদানের আবেদন করতে পারবেন না এবং আপনার সচল পোস্টটি সাময়িকভাবে নিষ্ক্রিয় থাকবে।
                </p>
              </div>

              <div className="flex gap-2.5 pt-2">
                <button
                  type="submit"
                  disabled={submittingDonation}
                  className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-2xl shadow-lg shadow-emerald-600/10 transition-all flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer text-xs"
                >
                  {submittingDonation ? "প্রসেসিং হচ্ছে..." : "রক্তদান নিশ্চিত করুন ✔"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowDonationCompleteModal(false)}
                  className="px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-2xl transition-all cursor-pointer"
                >
                  বাতিল
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* DONATION SUCCESS CELEBRATION MODAL */}
      {showDonationSuccessModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="bg-white rounded-3xl max-w-sm w-full border border-emerald-100 shadow-2xl overflow-hidden p-6 text-center space-y-5"
          >
            <div className="relative mx-auto w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center border border-emerald-150 shadow-inner">
              <Sparkles className="w-6 h-6 text-emerald-500 absolute -top-1 -right-1 animate-ping" />
              <Heart className="w-10 h-10 text-emerald-600 fill-emerald-600 animate-pulse" />
            </div>

            <div className="space-y-1.5">
              <h3 className="text-lg font-black text-slate-800">অসংখ্য ধন্যবাদ ও অভিনন্দন! 🎉</h3>
              <p className="text-[11px] text-emerald-600 font-extrabold">আপনার একটি রক্তদান বাঁচিয়ে দিয়েছে একটি অমূল্য প্রাণ!</p>
            </div>

            <p className="text-[10px] text-slate-500 leading-relaxed font-semibold">
              আপনার মহান রক্তদানের তথ্যটি সফলভাবে সংরক্ষণ করা হয়েছে। আপনার স্বাস্থ্যের সুরক্ষার্থে আগামী ৯০ দিন (৩ মাস) পুনরায় রক্তদান করা ও নতুন পোস্ট তৈরি করা বন্ধ থাকবে।
            </p>

            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 grid grid-cols-2 gap-2 text-left">
              <div>
                <span className="text-slate-400 text-[8px] uppercase font-bold tracking-wider">রক্ত খোলার তারিখ</span>
                <p className="text-slate-800 font-black text-[11px]">
                  {(() => {
                    const d = new Date();
                    d.setDate(d.getDate() + 90);
                    return d.toLocaleDateString('bn-BD', { year: 'numeric', month: 'long', day: 'numeric' });
                  })()}
                </p>
              </div>
              <div>
                <span className="text-slate-400 text-[8px] uppercase font-bold tracking-wider">লক খোলার বাকি</span>
                <p className="text-red-500 font-black text-[11px]">৯০ দিন</p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setShowDonationSuccessModal(false);
              }}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-2xl shadow-lg shadow-emerald-500/10 transition-all text-xs cursor-pointer active:scale-95"
            >
              বন্ধ করুন 💖
            </button>
          </motion.div>
        </div>
      )}

    </div>
  );
};
