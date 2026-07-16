import React, { useState, useEffect } from "react";
import { useApp } from "../contexts/AppContext";
import { 
  collection, 
  query, 
  getDocs, 
  addDoc, 
  orderBy, 
  limit, 
  where, 
  onSnapshot, 
  Timestamp,
  doc,
  updateDoc,
  deleteDoc
} from "firebase/firestore";
import { db } from "../firebase/config";
import { bangladeshLocations } from "../utils/bangladeshLocations";
import { 
  Heart, 
  Search, 
  Phone, 
  MapPin, 
  Calendar, 
  AlertTriangle, 
  User, 
  Building2, 
  Star, 
  ShieldAlert, 
  Sparkles,
  ToggleLeft,
  ToggleRight,
  Bell,
  CheckCircle,
  PlusCircle,
  X,
  Volume2,
  Edit3,
  Trash2,
  MessageSquare,
  Globe,
  Settings
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export const HomePage: React.FC = () => {
  const { 
    user, 
    showToast, 
    favorites, 
    toggleFavorite, 
    isFavorite, 
    systemSettings, 
    setView,
    refreshUserProfile
  } = useApp();

  // Search & Filters state
  const [bloodGroup, setBloodGroup] = useState("");
  const [division, setDivision] = useState("");
  const [district, setDistrict] = useState("");
  const [upazila, setUpazila] = useState("");

  const districts = bangladeshLocations.find((d) => d.name === division)?.districts || [];
  const upazilas = districts.find((d) => d.name === district)?.upazilas || [];

  // Data states
  const [publicRequests, setPublicRequests] = useState<any[]>([]);
  const [donors, setDonors] = useState<any[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loadingReqs, setLoadingReqs] = useState(false);
  const [loadingDonors, setLoadingDonors] = useState(false);

  // Modal states
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [showDirectModal, setShowDirectModal] = useState(false);
  const [selectedDonor, setSelectedDonor] = useState<any>(null);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportedEntity, setReportedEntity] = useState<any>(null);

  // Form states: Create Public Request
  const [reqPatientName, setReqPatientName] = useState("");
  const [reqBloodGroup, setReqBloodGroup] = useState("A+");
  const [reqUnits, setReqUnits] = useState(1);
  const [reqHospital, setReqHospital] = useState("");
  const [reqPhone, setReqPhone] = useState("");
  const [reqDetails, setReqDetails] = useState("");
  const [reqIsUrgent, setReqIsUrgent] = useState(true);

  // Form states: Direct request to donor
  const [directHospital, setDirectHospital] = useState("");
  const [directUnits, setDirectUnits] = useState(1);
  const [directPhone, setDirectPhone] = useState(user?.phone || "");
  const [directName, setDirectName] = useState(user?.fullName || "");

  // Form states: Report Fraud
  const [reportReason, setReportReason] = useState("ভুল নম্বর / কোনো যোগাযোগ নেই");
  const [reportDetails, setReportDetails] = useState("");

  // My Donor Post Modal & Form States
  const [showMyDonorPostModal, setShowMyDonorPostModal] = useState(false);
  const [isEditingMyPost, setIsEditingMyPost] = useState(false);
  const [showDeleteMyPostConfirm, setShowDeleteMyPostConfirm] = useState(false);
  const [savingMyPost, setSavingMyPost] = useState(false);
  const [myDonorPost, setMyDonorPost] = useState<any>(null);

  // My Donor Post form states
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

  const donorDistrictsList = bangladeshLocations.find((d) => d.name === donorDivision)?.districts || [];
  const donorUpazilasList = donorDistrictsList.find((d) => d.name === donorDistrict)?.upazilas || [];

  // Fetch Public Blood Requests
  useEffect(() => {
    setLoadingReqs(true);
    const q = query(
      collection(db, "blood_requests"),
      orderBy("createdAt", "desc"),
      limit(25)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list: any[] = [];
      snapshot.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() });
      });
      setPublicRequests(list);
      setLoadingReqs(false);
    }, (error) => {
      console.error("Public requests fetch error:", error);
      setLoadingReqs(false);
    });

    return () => unsubscribe();
  }, []);

  // Fetch Available Donors (Real-time from donor_posts collection)
  const [showDonorDetailModal, setShowDonorDetailModal] = useState(false);
  const [selectedDonorDetail, setSelectedDonorDetail] = useState<any>(null);

  // Emergency Blood Request Detail modal state
  const [showRequestDetailModal, setShowRequestDetailModal] = useState(false);
  const [selectedRequestDetail, setSelectedRequestDetail] = useState<any>(null);

  // Emergency Blood Request Required Date State for creation
  const [reqRequiredDate, setReqRequiredDate] = useState("");

  // Edit Request State
  const [showEditRequestModal, setShowEditRequestModal] = useState(false);
  const [editingRequest, setEditingRequest] = useState<any>(null);
  const [editPatientName, setEditPatientName] = useState("");
  const [editBloodGroup, setEditBloodGroup] = useState("A+");
  const [editUnits, setEditUnits] = useState(1);
  const [editHospital, setEditHospital] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editDetails, setEditDetails] = useState("");
  const [editIsUrgent, setEditIsUrgent] = useState(true);
  const [editRequiredDate, setEditRequiredDate] = useState("");
  const [editDivision, setEditDivision] = useState("");
  const [editDistrict, setEditDistrict] = useState("");
  const [editUpazila, setEditUpazila] = useState("");

  // Complete Request Modal state
  const [showCompleteRequestModal, setShowCompleteRequestModal] = useState(false);
  const [doneDonorName, setDoneDonorName] = useState("");
  const [doneDonorPhone, setDoneDonorPhone] = useState("");
  const [doneDonationDate, setDoneDonationDate] = useState(new Date().toISOString().split('T')[0]);
  const [doneNotes, setDoneNotes] = useState("");
  const [submittingDone, setSubmittingDone] = useState(false);

  // Donation Completed feature state
  const [showDonationCompleteModal, setShowDonationCompleteModal] = useState(false);
  const [showDonationSuccessModal, setShowDonationSuccessModal] = useState(false);
  const [recipientName, setRecipientName] = useState("");
  const [recipientPhone, setRecipientPhone] = useState("");
  const [donationDate, setDonationDate] = useState(new Date().toISOString().split('T')[0]);
  const [submittingDonation, setSubmittingDonation] = useState(false);

  useEffect(() => {
    setLoadingDonors(true);
    const q = query(
      collection(db, "donor_posts"),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list: any[] = [];
      snapshot.forEach((doc) => {
        const d = doc.data();
        
        // Skip current user (or let them see their own post in dashboard instead)
        // Check if this post is locked or paused
        let isLocked = false;
        if (d.bloodDonationLockedUntil) {
          const lockedDate = d.bloodDonationLockedUntil.toDate ? d.bloodDonationLockedUntil.toDate() : new Date(d.bloodDonationLockedUntil);
          if (lockedDate > new Date()) {
            isLocked = true;
          }
        }

        // Hide only if paused or locked. Let the current user's post also appear in the general blood donor list so they can see and verify it!
        if (!d.paused && !isLocked) {
          list.push({ id: doc.id, ...d });
        }
      });
      setDonors(list);
      setLoadingDonors(false);
    }, (error) => {
      console.error("Error fetching donor posts:", error);
      setLoadingDonors(false);
    });

    return () => unsubscribe();
  }, [user?.uid]);

  // Listen to current user's donor post in real-time
  useEffect(() => {
    if (!user?.uid) {
      setMyDonorPost(null);
      return;
    }
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
    }, (error) => {
      console.error("My donor post listener error:", error);
    });
    return () => unsubscribe();
  }, [user?.uid]);

  // Sync form inputs when modal opens or myDonorPost / user details change
  useEffect(() => {
    if (showMyDonorPostModal) {
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
  }, [showMyDonorPostModal, myDonorPost, user]);

  // Fetch Active Announcements
  useEffect(() => {
    const q = query(
      collection(db, "announcements"),
      where("active", "==", true),
      orderBy("createdAt", "desc"),
      limit(5)
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list: any[] = [];
      snapshot.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() });
      });
      setAnnouncements(list);
    });
    return () => unsubscribe();
  }, []);

  // Handle Availability Toggle
  const handleToggleAvailability = async () => {
    if (!user) return;
    try {
      const nextState = !user.availability;
      if (nextState) {
        if (user.bloodDonationLockedUntil) {
          const lockTime = user.bloodDonationLockedUntil.toDate ? user.bloodDonationLockedUntil.toDate() : new Date(user.bloodDonationLockedUntil);
          if (lockTime > new Date()) {
            const remainingDays = Math.ceil((lockTime.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
            showToast(`দুঃখিত, আপনি ৩ মাসের লকড পিরিয়ডের মধ্যে আছেন। এই সময় আপনার স্ট্যাটাস সচল করতে পারবেন না। লক খোলার বাকি: ${remainingDays} দিন।`, "warning");
            return;
          }
        }
      }
      const userRef = doc(db, "users", user.uid);
      await updateDoc(userRef, { availability: nextState });
      await refreshUserProfile();
      showToast(
        nextState 
          ? "আপনার রক্তদানের স্ট্যাটাস সচল (Available) করা হয়েছে। গ্রহীতারা এখন আপনাকে কল বা রিকোয়েস্ট করতে পারবেন।" 
          : "আপনার রক্তদানের স্ট্যাটাস নিষ্ক্রিয় (Unavailable) করা হয়েছে।", 
        "success"
      );
    } catch (err) {
      showToast("স্ট্যাটাস পরিবর্তন করতে সমস্যা হয়েছে।", "error");
    }
  };

  // Submit Public Blood Request
  const handleCreatePublicRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!systemSettings?.bloodRequestsEnabled) {
      showToast("দুঃখিত, বর্তমানে সিস্টেম এডমিন দ্বারা রক্তের আবেদন জমা বন্ধ রয়েছে।", "warning");
      return;
    }
    if (!reqPatientName.trim() || !reqHospital.trim() || !reqPhone.trim() || !division || !district || !upazila || !reqRequiredDate.trim()) {
      showToast("দয়া করে প্রয়োজনীয় সব তথ্য পূরণ করুন।", "warning");
      return;
    }

    try {
      await addDoc(collection(db, "blood_requests"), {
        patientName: reqPatientName.trim(),
        bloodGroup: reqBloodGroup,
        unitsNeeded: Number(reqUnits),
        hospitalName: reqHospital.trim(),
        phone: reqPhone.trim(),
        details: reqDetails.trim(),
        isUrgent: reqIsUrgent,
        division,
        district,
        upazila,
        userId: user?.uid || "guest",
        status: "open",
        requiredDate: reqRequiredDate.trim(),
        createdAt: Timestamp.now()
      });

      showToast("আপনার রক্তের আবেদনটি সফলভাবে প্ল্যাটফর্মে পোস্ট করা হয়েছে।", "success");
      setShowRequestModal(false);
      // Reset form
      setReqPatientName("");
      setReqHospital("");
      setReqPhone("");
      setReqDetails("");
      setReqRequiredDate("");
    } catch (err) {
      console.error(err);
      showToast("আবেদন পোস্ট করতে ত্রুটি ঘটেছে।", "error");
    }
  };

  // Update Public Blood Request
  const handleUpdatePublicRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRequest?.id) return;
    if (!editPatientName.trim() || !editHospital.trim() || !editPhone.trim() || !editDivision || !editDistrict || !editUpazila || !editRequiredDate.trim()) {
      showToast("দয়া করে প্রয়োজনীয় সব তথ্য পূরণ করুন।", "warning");
      return;
    }

    try {
      const reqRef = doc(db, "blood_requests", editingRequest.id);
      await updateDoc(reqRef, {
        patientName: editPatientName.trim(),
        bloodGroup: editBloodGroup,
        unitsNeeded: Number(editUnits),
        hospitalName: editHospital.trim(),
        phone: editPhone.trim(),
        details: editDetails.trim(),
        isUrgent: editIsUrgent,
        division: editDivision,
        district: editDistrict,
        upazila: editUpazila,
        requiredDate: editRequiredDate.trim()
      });

      showToast("রক্তের আবেদনটি সফলভাবে আপডেট করা হয়েছে।", "success");
      setShowEditRequestModal(false);
      setEditingRequest(null);
      setShowRequestDetailModal(false);
      setSelectedRequestDetail(null);
    } catch (err) {
      console.error(err);
      showToast("আবেদন আপডেট করতে ত্রুটি ঘটেছে।", "error");
    }
  };

  // Delete Public Blood Request
  const handleDeletePublicRequest = async (requestId: string) => {
    try {
      await deleteDoc(doc(db, "blood_requests", requestId));
      showToast("রক্তের আবেদনটি সফলভাবে মুছে ফেলা হয়েছে।", "success");
      setShowRequestDetailModal(false);
      setSelectedRequestDetail(null);
    } catch (err) {
      console.error(err);
      showToast("আবেদন মুছে ফেলতে ত্রুটি ঘটেছে।", "error");
    }
  };

  // Submit Blood Request Completion Details (Done)
  const handleSubmitCompleteRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRequestDetail?.id) return;
    if (!doneDonorName.trim() || !doneDonorPhone.trim() || !doneDonationDate) {
      showToast("অনুগ্রহ করে রক্তদাতার নাম, মোবাইল নম্বর এবং রক্তদানের তারিখ প্রদান করুন।", "warning");
      return;
    }

    setSubmittingDone(true);
    try {
      const reqRef = doc(db, "blood_requests", selectedRequestDetail.id);
      
      // Update request status to completed
      await updateDoc(reqRef, {
        status: "completed"
      });

      // Add to completed_donations collection
      await addDoc(collection(db, "completed_donations"), {
        requestId: selectedRequestDetail.id,
        patientName: selectedRequestDetail.patientName || "অজ্ঞাত রোগী",
        bloodGroup: selectedRequestDetail.bloodGroup || "A+",
        hospitalName: selectedRequestDetail.hospitalName || "অজ্ঞাত হাসপাতাল",
        district: selectedRequestDetail.district || "",
        upazila: selectedRequestDetail.upazila || "",
        donorName: doneDonorName.trim(),
        donorPhone: doneDonorPhone.trim(),
        donationDate: doneDonationDate,
        notes: doneNotes.trim(),
        completedByUserId: user?.uid || "guest",
        createdAt: Timestamp.now()
      });

      // Update donor profile lock if phone matches a user
      const usersRef = collection(db, "users");
      const q = query(usersRef, where("phone", "==", doneDonorPhone.trim()));
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        const donorUserDoc = querySnapshot.docs[0];
        const donorUserId = donorUserDoc.id;
        const donorUserData = donorUserDoc.data();
        
        // 3 months lock = 90 days from donation date
        const lockExpiryDate = new Date(doneDonationDate);
        lockExpiryDate.setDate(lockExpiryDate.getDate() + 90);
        
        await updateDoc(doc(db, "users", donorUserId), {
          bloodDonationLockedUntil: Timestamp.fromDate(lockExpiryDate),
          timesDonated: (donorUserData.timesDonated || 0) + 1,
          lastDonationDate: Timestamp.fromDate(new Date(doneDonationDate))
        });

        // Also update their donor_post if they have one!
        const postsRef = collection(db, "donor_posts");
        const postQ = query(postsRef, where("userId", "==", donorUserId));
        const postSnap = await getDocs(postQ);
        if (!postSnap.empty) {
          await updateDoc(doc(db, "donor_posts", postSnap.docs[0].id), {
            bloodDonationLockedUntil: Timestamp.fromDate(lockExpiryDate),
            paused: true,
            timesDonated: (donorUserData.timesDonated || 0) + 1,
            lastDonatedAt: new Date(doneDonationDate).toLocaleDateString("bn-BD")
          });
        }
      }

      showToast("রক্তের আবেদনটি সফলভাবে 'সম্পন্ন' হিসেবে চিহ্নিত করা হয়েছে এবং ইতিহাস সংরক্ষণ করা হয়েছে।", "success");
      
      // Reset & close modals
      setShowCompleteRequestModal(false);
      setDoneDonorName("");
      setDoneDonorPhone("");
      setDoneNotes("");
      setShowRequestDetailModal(false);
      setSelectedRequestDetail(null);
    } catch (err) {
      console.error(err);
      showToast("রক্তদান সম্পন্ন করতে ত্রুটি ঘটেছে।", "error");
    } finally {
      setSubmittingDone(false);
    }
  };

  // Submit Direct request to selected donor
  const handleSendDirectRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      showToast("আবেদন করার পূর্বে অনুগ্রহ করে প্রথমে লগইন অথবা সাইন আপ করুন! (Please login first or sign up)", "warning");
      return;
    }
    if (!directHospital.trim() || !directPhone.trim() || !directName.trim()) {
      showToast("দয়া করে প্রয়োজনীয় সকল তথ্য দিন।", "warning");
      return;
    }

    try {
      await addDoc(collection(db, "direct_requests"), {
        donorId: selectedDonor.id,
        donorName: selectedDonor.fullName,
        donorPhone: selectedDonor.phone,
        requesterId: user.uid,
        requesterName: directName.trim(),
        requesterPhone: directPhone.trim(),
        bloodGroup: selectedDonor.bloodGroup,
        hospitalName: directHospital.trim(),
        units: Number(directUnits),
        emergencyLevel: "emergency",
        status: "pending",
        createdAt: Timestamp.now()
      });

      // Create live notifications document for the donor
      await addDoc(collection(db, "notifications"), {
        userId: selectedDonor.id,
        title: "রক্তের সরাসরি আবেদন! 🔴",
        message: `${directName} আপনাকে সরাসরি রক্তদানের অনুরোধ পাঠিয়েছেন। বিবরণ দেখুন।`,
        createdAt: Timestamp.now(),
        read: false
      });

      showToast(`রক্তদাতা ${selectedDonor.fullName}-কে সফলভাবে রিকোয়েস্ট পাঠানো হয়েছে।`, "success");
      setShowDirectModal(false);
    } catch (err) {
      console.error(err);
      showToast("অনুরোধ পাঠাতে ত্রুটি ঘটেছে।", "error");
    }
  };

  // Submit Fraud Report
  const handleReportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      showToast("রিপোর্ট করতে দয়া করে প্রথমে লগইন করুন।", "warning");
      return;
    }

    try {
      await addDoc(collection(db, "reports"), {
        reportedUserId: reportedEntity.id,
        reportedUserName: reportedEntity.fullName || reportedEntity.patientName || "ইউজার",
        reporterId: user.uid,
        reason: reportReason,
        details: reportDetails.trim(),
        status: "pending",
        createdAt: Timestamp.now()
      });

      showToast("প্রতারণার অভিযোগটি সফলভাবে অ্যাডমিন প্যানেলে দাখিল করা হয়েছে। তদন্ত সাপেক্ষে ব্যবস্থা নেওয়া হবে।", "success");
      setShowReportModal(false);
      setReportDetails("");
    } catch (err) {
      console.error(err);
      showToast("অভিযোগ দাখিল করতে সমস্যা হয়েছে।", "error");
    }
  };

  // Save or Update My Donor Post from HomePage
  const handleSaveMyDonorPost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.uid) return;

    if (!donorName.trim() || !donorPhone.trim() || !donorBloodGroup || !donorDivision || !donorDistrict || !donorUpazila) {
      showToast("দয়া করে প্রয়োজনীয় সব ক্ষেত্র পূরণ করুন।", "warning");
      return;
    }

    setSavingMyPost(true);
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
        showToast("অভিনন্দন! আপনার রক্তদাতা পোস্ট সফলভাবে তৈরি করা হয়েছে। এটি এখন তালিকায় দেখা যাবে।", "success");
      }
      setIsEditingMyPost(false);
      setShowMyDonorPostModal(false);
    } catch (err) {
      console.error("Save my donor post error:", err);
      showToast("পোস্টটি সংরক্ষণ করতে ত্রুটি ঘটেছে। অনুগ্রহ করে আবার চেষ্টা করুন।", "error");
    } finally {
      setSavingMyPost(false);
    }
  };

  // Toggle my donor post paused status from HomePage
  const handleToggleMyPostPause = async () => {
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
      console.error("Toggle my post pause error:", err);
      showToast("অবস্থা পরিবর্তন করতে সমস্যা হয়েছে।", "error");
    }
  };

  // Delete My Donor Post from HomePage
  const handleDeleteMyDonorPost = async () => {
    if (!myDonorPost?.id) return;
    try {
      await deleteDoc(doc(db, "donor_posts", myDonorPost.id));
      showToast("আপনার রক্তদাতা পোস্টটি সফলভাবে মুছে ফেলা হয়েছে।", "warning");
      setShowDeleteMyPostConfirm(false);
      setShowMyDonorPostModal(false);
    } catch (err) {
      console.error("Delete my donor post error:", err);
      showToast("মুছে ফেলতে সমস্যা হয়েছে।", "error");
    }
  };

  // Confirm Donation and apply 3-month block (cooldown)
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
        notes: "রক্তদান সম্পন্ন (আমি দিয়েছি ফিচার)"
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

  // Filtering Donor List
  const filteredDonors = donors.filter((item) => {
    if (bloodGroup && item.bloodGroup !== bloodGroup) return false;
    if (division && item.division !== division) return false;
    if (district && item.district !== district) return false;
    if (upazila && item.upazila !== upazila) return false;
    return true;
  });

  // Filtering Public Requests
  const filteredRequests = publicRequests.filter((item) => {
    if (bloodGroup && item.bloodGroup !== bloodGroup) return false;
    if (division && item.division !== division) return false;
    if (district && item.district !== district) return false;
    if (upazila && item.upazila !== upazila) return false;
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto p-4 space-y-6 md:py-8">
      
      {/* Admin Notice/Ticker */}
      {announcements.length > 0 && (
        <div className="bg-red-500 text-white py-3 px-6 rounded-2xl flex items-center gap-3 shadow-md animate-pulse">
          <Volume2 className="w-5 h-5 shrink-0" />
          <div className="text-xs md:text-sm font-bold truncate flex-1">
            {announcements[0].message}
          </div>
        </div>
      )}

      {/* Hero Welcome banner */}
      <div className="bg-gradient-to-br from-red-500 via-rose-500 to-red-600 text-white rounded-3xl p-6 md:p-10 shadow-xl relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-3 z-10">
          <span className="inline-flex items-center gap-1.5 bg-white/20 border border-white/10 py-1 px-3.5 rounded-full text-[10px] font-black uppercase tracking-widest">
            <Sparkles className="w-3.5 h-3.5" /> প্রতিটি রক্তদান একটি নতুন জীবনের সূচনা
          </span>
          <h2 className="text-2xl md:text-4xl font-black tracking-tight leading-tight">
            রক্ত দিন, জীবন বাঁচান ❤️
          </h2>
          <p className="text-white/80 text-xs md:text-sm max-w-lg font-medium leading-relaxed">
            {systemSettings?.homepageNotice || "নিকটস্থ রক্তদাতাদের সাথে তাৎক্ষণিক যোগাযোগের সহজ ও সম্পূর্ণ ফ্রিতে একটি আধুনিক প্ল্যাটফর্ম।"}
          </p>

          {/* Donor Availability toggle (If user is registered as donor) */}
          {user && (user.role === "donor" || user.role === "both") && (
            <div className="pt-3 flex items-center gap-3">
              <span className="text-xs font-bold">রক্তদানের জন্য আপনার সচলতা:</span>
              <button 
                onClick={handleToggleAvailability}
                className="flex items-center text-white focus:outline-none"
              >
                {user.availability ? (
                  <ToggleRight className="w-10 h-10 text-emerald-300 drop-shadow-md" />
                ) : (
                  <ToggleLeft className="w-10 h-10 text-white/40" />
                )}
              </button>
              <span className={`text-xs font-black ${user.availability ? "text-emerald-300 animate-pulse" : "text-white/60"}`}>
                {user.availability ? "অ্যাক্টিভ (সচল)" : "ইনঅ্যাক্টিভ (বন্ধ)"}
              </span>
            </div>
          )}
        </div>

        {/* Hero Actions */}
        <div className="flex flex-col sm:flex-row gap-3 shrink-0 z-10">
          <button
            onClick={() => {
              if (!user) {
                showToast("আবেদন পোস্ট করার জন্য অনুগ্রহ করে প্রথমে লগইন অথবা সাইন আপ করুন! (Please login first or sign up)", "warning");
                return;
              }
              if (user.bloodDonationLockedUntil) {
                const lockTime = user.bloodDonationLockedUntil.toDate ? user.bloodDonationLockedUntil.toDate() : new Date(user.bloodDonationLockedUntil);
                if (lockTime > new Date()) {
                  const remainingDays = Math.ceil((lockTime.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                  showToast(`দুঃখিত, আপনি সম্প্রতি রক্ত দিয়েছেন। রক্তদানের ৩ মাসের মধ্যে আপনি রক্তের আবেদন করতে পারবেন না। লক খোলার বাকি: ${remainingDays} দিন।`, "warning");
                  return;
                }
              }
              setShowRequestModal(true);
            }}
            className="py-3 px-6 bg-white hover:bg-slate-50 text-red-600 font-extrabold text-xs rounded-2xl shadow-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" /> রক্তের জন্য পাবলিক আবেদন করুন
          </button>

          <button
            onClick={() => {
              if (!user) {
                showToast("রক্তদাতা হিসেবে পোস্ট দিতে অনুগ্রহ করে প্রথমে লগইন অথবা সাইন আপ করুন!", "warning");
                setView("auth");
                return;
              }
              // Check for 3-month lock if they don't have an existing post
              if (!myDonorPost && user.bloodDonationLockedUntil) {
                const lockTime = user.bloodDonationLockedUntil.toDate ? user.bloodDonationLockedUntil.toDate() : new Date(user.bloodDonationLockedUntil);
                if (lockTime > new Date()) {
                  const remainingDays = Math.ceil((lockTime.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                  showToast(`দুঃখিত, আপনি সম্প্রতি রক্ত দিয়েছেন। ৩ মাসের মধ্যে আপনি নতুন রক্তদাতা পোস্ট করতে পারবেন না। লক খোলার বাকি: ${remainingDays} দিন।`, "warning");
                  return;
                }
              }
              setIsEditingMyPost(false);
              setShowMyDonorPostModal(true);
            }}
            className="py-3 px-6 bg-red-600 hover:bg-red-700 text-white font-extrabold text-xs rounded-2xl shadow-lg border border-red-400/20 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Heart className="w-4 h-4 fill-white" /> {myDonorPost ? "আমার রক্তদাতা পোস্ট 🩸" : "রক্তদাতা হিসেবে পোস্ট দিতে চাই 🩸"}
          </button>
        </div>

        {/* Absolute Decorative Circles */}
        <div className="absolute -right-16 -bottom-16 w-64 h-64 bg-white/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -left-16 -top-16 w-64 h-64 bg-black/5 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* Advanced Quick Filters Bar */}
      <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
        <h3 className="font-extrabold text-slate-800 text-sm flex items-center gap-1.5">
          <Search className="w-4 h-4 text-red-500" /> দাতা এবং আবেদন ফিল্টার করুন
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">রক্তের গ্রুপ</label>
            <select
              value={bloodGroup}
              onChange={(e) => setBloodGroup(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700"
            >
              <option value="">রক্তের গ্রুপ (সকল)</option>
              {["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"].map((g) => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">বিভাগ</label>
            <select
              value={division}
              onChange={(e) => { setDivision(e.target.value); setDistrict(""); setUpazila(""); }}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700"
            >
              <option value="">সকল বিভাগ</option>
              {bangladeshLocations.map((d) => (
                <option key={d.name} value={d.name}>{d.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">জেলা</label>
            <select
              value={district}
              disabled={!division}
              onChange={(e) => { setDistrict(e.target.value); setUpazila(""); }}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 disabled:bg-slate-100 rounded-xl text-xs font-semibold text-slate-700"
            >
              <option value="">সকল জেলা</option>
              {districts.map((d) => (
                <option key={d.name} value={d.name}>{d.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">উপজেলা</label>
            <select
              value={upazila}
              disabled={!district}
              onChange={(e) => setUpazila(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 disabled:bg-slate-100 rounded-xl text-xs font-semibold text-slate-700"
            >
              <option value="">সকল উপজেলা</option>
              {upazilas.map((u) => (
                <option key={u} value={u}>{u}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Grid: Public blood requests (Left) & Available Donors list (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* PUBLIC REQUESTS PANEL */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-slate-800 text-base">জরুরি রক্তের আবেদনসমূহ 🚨</h3>
            <span className="text-xs bg-red-50 text-red-600 px-2.5 py-1 rounded-full font-bold">
              মোট: {filteredRequests.length}
            </span>
          </div>

          {loadingReqs ? (
            <div className="text-center py-12 bg-white rounded-3xl border border-slate-100">
              <div className="w-8 h-8 border-4 border-red-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              <p className="text-slate-400 text-xs font-medium">আবেদনপত্র খোঁজা হচ্ছে...</p>
            </div>
          ) : filteredRequests.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-3xl border border-slate-100">
              <Building2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-600 font-extrabold text-sm">কোন রক্তের আবেদন পাওয়া যায়নি</p>
              <p className="text-slate-400 text-xs mt-1">সবাই নিরাপদে আছেন! নতুন কোন আবেদন থাকলে তা এখানে প্রদর্শিত হবে।</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredRequests.map((req) => (
                <div 
                  key={req.id} 
                  onClick={() => {
                    setSelectedRequestDetail(req);
                    setShowRequestDetailModal(true);
                  }}
                  className="cursor-pointer bg-white p-5 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md hover:border-red-100 transition-all flex flex-col justify-between group"
                >
                  <div>
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div>
                        <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider mb-0.5">রোগীর নাম</span>
                        <h4 className="font-black text-slate-800 text-sm line-clamp-1 group-hover:text-red-600 transition-colors">{req.patientName}</h4>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        {req.isUrgent && (
                          <span className="bg-red-50 border border-red-200 text-red-600 text-[9px] font-black rounded-md px-1.5 py-0.5 animate-pulse uppercase">
                            জরুরি
                          </span>
                        )}
                        <span className="w-8 h-8 flex items-center justify-center bg-red-500 text-white rounded-full text-xs font-black shadow-sm">
                          {req.bloodGroup}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-1.5 text-xs text-slate-600 border-t pt-3 border-slate-50">
                      <div className="flex items-start gap-1.5">
                        <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                        <span className="line-clamp-1">হাসপাতাল: <strong className="text-slate-800 font-bold">{req.hospitalName}</strong></span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="line-clamp-1">{req.upazila}, {req.district}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>প্রয়োজন: <strong className="text-red-500 font-extrabold">{req.unitsNeeded} ব্যাগ</strong></span>
                      </div>
                    </div>

                    {req.details && (
                      <p className="text-[11px] text-slate-500 bg-slate-50 p-2 rounded-xl mt-3 line-clamp-2 leading-relaxed font-medium">
                        {req.details}
                      </p>
                    )}
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-50 flex gap-2" onClick={(e) => e.stopPropagation()}>
                    <a
                      href={`tel:${req.phone}`}
                      className="flex-1 py-2 bg-red-50 hover:bg-red-100 text-red-600 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all"
                    >
                      <Phone className="w-3.5 h-3.5" /> কল করুন
                    </a>
                    
                    <button
                      onClick={() => {
                        setReportedEntity({ id: req.userId || "guest", fullName: req.patientName });
                        setShowReportModal(true);
                      }}
                      className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
                      title="রিপোর্ট বা প্রতারণার অভিযোগ করুন"
                    >
                      <ShieldAlert className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* DONORS LIST PANEL */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-slate-800 text-base">রক্তদাতাদের তালিকা 🩸</h3>
            <span className="text-xs bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full font-bold">
              সক্রিয়: {filteredDonors.length}
            </span>
          </div>

          {loadingDonors ? (
            <div className="text-center py-12 bg-white rounded-3xl border border-slate-100">
              <div className="w-8 h-8 border-4 border-red-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              <p className="text-slate-400 text-xs font-medium">রক্তদাতা খোঁজা হচ্ছে...</p>
            </div>
          ) : filteredDonors.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-3xl border border-slate-100 p-6">
              <User className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-600 font-extrabold text-sm">কোন রক্তদাতা পাওয়া যায়নি</p>
              <p className="text-slate-400 text-xs mt-1">অন্য রক্তের গ্রুপ বা জেলা নির্বাচন করে দেখুন।</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredDonors.map((donor) => (
                <div 
                  key={donor.id} 
                  onClick={() => {
                    setSelectedDonorDetail(donor);
                    setShowDonorDetailModal(true);
                  }}
                  className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md hover:border-red-100 transition-all cursor-pointer flex flex-col justify-between group"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-500 relative shrink-0">
                        {donor.image || donor.profilePicture ? (
                          <img src={donor.image || donor.profilePicture} alt="" className="w-9 h-9 rounded-full object-cover" />
                        ) : (
                          <User className="w-4 h-4 text-slate-500" />
                        )}
                        <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-white rounded-full" />
                      </div>
                      
                      <div>
                        <h4 className="font-extrabold text-slate-800 text-xs line-clamp-1 flex items-center gap-1 group-hover:text-red-600 transition-colors">
                          {donor.name || donor.fullName}
                          <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 rounded px-1 shrink-0 uppercase">Active</span>
                        </h4>
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">{donor.upazila}, {donor.district}</span>
                        
                        {/* Short donation count if present */}
                        {donor.timesDonated && (
                          <span className="inline-block mt-1 text-[10px] text-indigo-600 bg-indigo-50 border border-indigo-100 rounded px-1.5 font-bold">
                            রক্তদান করেছেন: {donor.timesDonated}
                          </span>
                        )}

                        {user ? (
                          <div className="mt-2 space-y-1" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center gap-1.5 text-[11px] font-extrabold text-slate-700 bg-red-50/50 border border-red-100/50 rounded-lg px-2 py-0.5 w-fit">
                              <Phone className="w-3 h-3 text-red-500 shrink-0" />
                              <a href={`tel:${donor.phone}`} className="hover:underline tracking-wide">{donor.phone}</a>
                            </div>
                          </div>
                        ) : (
                          <p className="text-[10px] text-slate-400 italic mt-1 font-semibold">নম্বর দেখতে লগইন করুন</p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleFavorite(donor.id);
                        }}
                        className={`p-1.5 rounded-full transition-all ${
                          isFavorite(donor.id) ? "text-amber-500" : "text-slate-300 hover:text-amber-500"
                        }`}
                      >
                        <Star className={`w-4 h-4 ${isFavorite(donor.id) ? "fill-amber-500" : ""}`} />
                      </button>

                      <span className="w-8 h-8 flex items-center justify-center bg-red-100 text-red-600 rounded-full text-xs font-black">
                        {donor.bloodGroup}
                      </span>
                    </div>
                  </div>

                  {/* Actions for donors */}
                  <div className="mt-4 pt-3 border-t border-slate-50 flex gap-2" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (!user) {
                          showToast("সরাসরি আবেদন করতে অনুগ্রহ করে প্রথমে লগইন অথবা সাইন আপ করুন! (Please login first or sign up)", "warning");
                          return;
                        }
                        setSelectedDonor(donor);
                        setShowDirectModal(true);
                      }}
                      className="flex-1 py-1.5 bg-red-500 hover:bg-red-600 text-white font-bold text-[11px] rounded-xl flex items-center justify-center gap-1 transition-all"
                    >
                      সরাসরি আবেদন করুন
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (!user) {
                          showToast("রিপোর্ট করতে অনুগ্রহ করে প্রথমে লগইন অথবা সাইন আপ করুন! (Please login first or sign up)", "warning");
                          return;
                        }
                        setReportedEntity(donor);
                        setShowReportModal(true);
                      }}
                      className="p-1.5 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
                      title="প্রতারণা/ভুল নম্বর রিপোর্ট করুন"
                    >
                      <ShieldAlert className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* CREATE PUBLIC REQUEST MODAL */}
      {showRequestModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl p-6 max-w-md w-full border shadow-2xl overflow-y-auto max-h-[90vh]"
          >
            <div className="flex justify-between items-center mb-4 border-b pb-3">
              <h3 className="font-extrabold text-slate-800 text-base">রক্তের সাধারণ আবেদন পোস্ট করুন 🔴</h3>
              <button onClick={() => setShowRequestModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreatePublicRequest} className="space-y-4 text-xs font-semibold">
              <div>
                <label className="block text-slate-500 mb-1">রোগীর নাম <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  required
                  placeholder="যেমন: জনাব রহমান"
                  value={reqPatientName}
                  onChange={(e) => setReqPatientName(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-500 mb-1">প্রয়োজনীয় রক্তের গ্রুপ</label>
                  <select
                    value={reqBloodGroup}
                    onChange={(e) => setReqBloodGroup(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                  >
                    {["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"].map((g) => (
                      <option key={g} value={g}>{g}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-500 mb-1">কত ব্যাগ প্রয়োজন? <span className="text-red-500">*</span></label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={reqUnits}
                    onChange={(e) => setReqUnits(Number(e.target.value))}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-500 mb-1">হাসপাতালের নাম <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  required
                  placeholder="যেমন: ঢাকা মেডিকেল কলেজ হাসপাতাল"
                  value={reqHospital}
                  onChange={(e) => setReqHospital(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="block text-slate-500 mb-1">যোগাযোগের মোবাইল নম্বর <span className="text-red-500">*</span></label>
                <input
                  type="tel"
                  required
                  placeholder="যেমন: 017XXXXXXXX"
                  value={reqPhone}
                  onChange={(e) => setReqPhone(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="block text-slate-500 mb-1">রক্তদানের সময় ও তারিখ <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  required
                  placeholder="যেমন: আগামীকাল সকাল ১০টা, বা ২৫ই জুলাই"
                  value={reqRequiredDate}
                  onChange={(e) => setReqRequiredDate(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-500 mb-1">বিভাগ <span className="text-red-500">*</span></label>
                  <select
                    value={division}
                    onChange={(e) => { setDivision(e.target.value); setDistrict(""); setUpazila(""); }}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl"
                  >
                    <option value="">বাছাই</option>
                    {bangladeshLocations.map((d) => (
                      <option key={d.name} value={d.name}>{d.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-500 mb-1">জেলা <span className="text-red-500">*</span></label>
                  <select
                    value={district}
                    disabled={!division}
                    onChange={(e) => { setDistrict(e.target.value); setUpazila(""); }}
                    className="w-full p-2 bg-slate-50 border border-slate-200 disabled:bg-slate-100 rounded-xl"
                  >
                    <option value="">বাছাই</option>
                    {districts.map((d) => (
                      <option key={d.name} value={d.name}>{d.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-500 mb-1">উপজেলা <span className="text-red-500">*</span></label>
                  <select
                    value={upazila}
                    disabled={!district}
                    onChange={(e) => setUpazila(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-200 disabled:bg-slate-100 rounded-xl"
                  >
                    <option value="">বাছাই</option>
                    {upazilas.map((u) => (
                      <option key={u} value={u}>{u}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-500 mb-1">অতিরিক্ত বিবরণ (ঐচ্ছিক)</label>
                <textarea
                  placeholder="রোগীর অবস্থা বা অতিরিক্ত যোগাযোগের তথ্য লিখুন..."
                  value={reqDetails}
                  onChange={(e) => setReqDetails(e.target.value)}
                  rows={2}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <label className="flex items-center gap-2 p-2 bg-slate-50 rounded-xl cursor-pointer">
                <input
                  type="checkbox"
                  checked={reqIsUrgent}
                  onChange={(e) => setReqIsUrgent(e.target.checked)}
                  className="w-4 h-4 text-red-500 focus:ring-red-500 rounded"
                />
                <span className="text-slate-700 text-xs">এটি একটি জরুরি রক্তের আবেদন</span>
              </label>

              <button
                type="submit"
                className="w-full py-3 bg-red-500 hover:bg-red-600 text-white font-extrabold rounded-xl shadow-lg shadow-red-500/10 transition-all"
              >
                আবেদন সাবমিট করুন
              </button>
            </form>
          </motion.div>
        </div>
      )}

      {/* DIRECT DONOR REQUEST MODAL */}
      {showDirectModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl p-6 max-w-md w-full border shadow-2xl"
          >
            <div className="flex justify-between items-center mb-4 border-b pb-3">
              <h3 className="font-extrabold text-slate-800 text-base">দাতাকে সরাসরি অনুরোধ পাঠান 📩</h3>
              <button onClick={() => setShowDirectModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-[11px] text-slate-500 mb-4 leading-relaxed font-semibold">
              রক্তদাতা <strong>{selectedDonor?.fullName}</strong> ({selectedDonor?.bloodGroup}) এর নিকট একটি সরাসরি মেসেজ ও নোটিফিকেশন পাঠানো হবে।
            </p>

            <form onSubmit={handleSendDirectRequest} className="space-y-4 text-xs font-semibold">
              <div>
                <label className="block text-slate-500 mb-1">আপনার নাম <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  required
                  value={directName}
                  onChange={(e) => setDirectName(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="block text-slate-500 mb-1">আপনার মোবাইল নম্বর <span className="text-red-500">*</span></label>
                <input
                  type="tel"
                  required
                  value={directPhone}
                  onChange={(e) => setDirectPhone(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-500 mb-1">হাসপাতাল <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    required
                    placeholder="যেমন: ল্যাবএইড হাসপাতাল"
                    value={directHospital}
                    onChange={(e) => setDirectHospital(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block text-slate-500 mb-1">কত ব্যাগ প্রয়োজন? <span className="text-red-500">*</span></label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={directUnits}
                    onChange={(e) => setDirectUnits(Number(e.target.value))}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-red-500 hover:bg-red-600 text-white font-extrabold rounded-xl shadow-lg transition-all"
              >
                অনুরোধ পাঠান
              </button>
            </form>
          </motion.div>
        </div>
      )}

      {/* FRAUD/COMPLAINT REPORT MODAL */}
      {showReportModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl p-6 max-w-md w-full border shadow-2xl"
          >
            <div className="flex justify-between items-center mb-4 border-b pb-3">
              <h3 className="font-extrabold text-slate-800 text-base flex items-center gap-1">
                <ShieldAlert className="w-5 h-5 text-rose-500" /> অভিযোগ দাখিল করুন 🛡️
              </h3>
              <button onClick={() => setShowReportModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-[11px] text-slate-500 mb-4 font-semibold leading-relaxed">
              আপনি <strong>{reportedEntity?.fullName}</strong> এর বিরুদ্ধে ভুল নম্বর বা প্রতারণার অভিযোগ করছেন। অভিযোগটি যাচাইপূর্বক অ্যাডমিন প্রয়োজনীয় কঠোর ব্যবস্থা নিবেন।
            </p>

            <form onSubmit={handleReportSubmit} className="space-y-4 text-xs font-semibold">
              <div>
                <label className="block text-slate-500 mb-1">অভিযোগের মূল ধরন</label>
                <select
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800"
                >
                  <option value="ভুল নম্বর / কোনো যোগাযোগ নেই">ভুল নম্বর / কোনো যোগাযোগ নেই</option>
                  <option value="আর্থিক লেনদেনের দাবি / বকশিস দাবি">আর্থিক লেনদেনের দাবি / বকশিস দাবি</option>
                  <option value="খারাপ ব্যবহার / হয়রানি">খারাপ ব্যবহার / হয়রানি</option>
                  <option value="ভুয়া আবেদন বা ভুয়া পোস্ট">ভুয়া আবেদন বা ভুয়া পোস্ট</option>
                  <option value="অন্যান্য প্রতারণামূলক কর্মকান্ড">অন্যান্য প্রতারণামূলক কর্মকান্ড</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-500 mb-1">অভিযোগের বিস্তারিত বিবরণ <span className="text-red-500">*</span></label>
                <textarea
                  required
                  placeholder="অভিযোগের সপক্ষে কি ঘটেছে তা বিস্তারিত লিখুন..."
                  value={reportDetails}
                  onChange={(e) => setReportDetails(e.target.value)}
                  rows={3}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-medium"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-rose-600 hover:bg-rose-700 text-white font-extrabold rounded-xl shadow-lg transition-all"
              >
                অভিযোগ দাখিল করুন
              </button>
            </form>
          </motion.div>
        </div>
      )}

      {/* DONOR POST DETAILED POPUP MODAL */}
      {showDonorDetailModal && selectedDonorDetail && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl max-w-lg w-full border shadow-2xl overflow-hidden"
          >
            {/* Top Premium Gradient Banner */}
            <div className="bg-gradient-to-r from-red-500 to-rose-600 text-white p-6 relative">
              <button 
                onClick={() => setShowDonorDetailModal(false)} 
                className="absolute top-4 right-4 text-white/80 hover:text-white bg-black/10 hover:bg-black/20 p-1.5 rounded-full transition-all"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-4 mt-2">
                <div className="w-16 h-16 rounded-full bg-white/25 border-2 border-white flex items-center justify-center text-white relative shrink-0 overflow-hidden shadow-lg">
                  {selectedDonorDetail.image || selectedDonorDetail.profilePicture ? (
                    <img src={selectedDonorDetail.image || selectedDonorDetail.profilePicture} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-8 h-8 text-white" />
                  )}
                </div>
                <div>
                  <span className="bg-white/20 text-white text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full">রক্তদাতা পোস্ট বিস্তারিত 🩸</span>
                  <h3 className="font-extrabold text-white text-xl mt-1 tracking-tight">{selectedDonorDetail.name || selectedDonorDetail.fullName}</h3>
                  <p className="text-white/80 text-xs font-bold mt-0.5 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5" /> {selectedDonorDetail.upazila}, {selectedDonorDetail.district}
                  </p>
                </div>
              </div>

              {/* Absolute Blood Group Badge */}
              <div className="absolute right-6 -bottom-6 w-14 h-14 bg-white border-4 border-rose-50 shadow-lg rounded-full flex flex-col items-center justify-center text-red-600 font-black text-lg">
                {selectedDonorDetail.bloodGroup}
              </div>
            </div>

            {/* Modal Body Content */}
            <div className="p-6 pt-10 space-y-5 text-slate-700 text-xs font-semibold">
              <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl border">
                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">রক্তদানের সংখ্যা (Donation Count)</span>
                  <p className="text-slate-800 text-sm font-black mt-1">
                    {selectedDonorDetail.timesDonated || "কখনো দেননি / অনির্ধারিত"}
                  </p>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">সর্বশেষ রক্তদান (Last Donation)</span>
                  <p className="text-slate-800 text-sm font-black mt-1">
                    {selectedDonorDetail.lastDonatedAt ? (
                      selectedDonorDetail.lastDonatedAt === "কখনো না" ? "কখনো দেননি" : selectedDonorDetail.lastDonatedAt
                    ) : "অনির্ধারিত"}
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="font-extrabold text-slate-800 text-xs tracking-wider uppercase border-b pb-1">যোগাযোগের বিবরণ (Contacts)</h4>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-2.5 bg-slate-50/50 rounded-xl border">
                    <span className="text-slate-500 font-bold">মোবাইল নম্বর</span>
                    {user ? (
                      <a href={`tel:${selectedDonorDetail.phone}`} className="text-red-600 font-extrabold text-sm hover:underline flex items-center gap-1">
                        <Phone className="w-4 h-4" /> {selectedDonorDetail.phone}
                      </a>
                    ) : (
                      <span className="text-slate-400 italic">লগইন করুন</span>
                    )}
                  </div>

                  {selectedDonorDetail.whatsApp && (
                    <div className="flex items-center justify-between p-2.5 bg-slate-50/50 rounded-xl border">
                      <span className="text-slate-500 font-bold">হোয়াটসঅ্যাপ নম্বর</span>
                      <a 
                        href={`https://wa.me/${selectedDonorDetail.whatsApp}`} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="text-emerald-600 font-extrabold hover:underline"
                      >
                        {selectedDonorDetail.whatsApp}
                      </a>
                    </div>
                  )}

                  {selectedDonorDetail.facebook && (
                    <div className="flex items-center justify-between p-2.5 bg-slate-50/50 rounded-xl border">
                      <span className="text-slate-500 font-bold">ফেসবুক প্রোফাইল</span>
                      <a 
                        href={selectedDonorDetail.facebook} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="text-blue-600 font-extrabold hover:underline truncate max-w-[200px]"
                      >
                        প্রোফাইল লিংক 🔗
                      </a>
                    </div>
                  )}

                  <div className="flex items-center justify-between p-2.5 bg-slate-50/50 rounded-xl border">
                    <span className="text-slate-500 font-bold">বিস্তারিত ঠিকানা</span>
                    <span className="text-slate-800 font-bold max-w-[250px] text-right">{selectedDonorDetail.address || "প্রদান করা হয়নি"}</span>
                  </div>
                </div>
              </div>

              {selectedDonorDetail.notes && (
                <div className="space-y-1.5 p-3.5 bg-red-50/40 border border-red-100/50 rounded-2xl">
                  <span className="text-red-500 text-[10px] uppercase font-black tracking-wider">বিশেষ তথ্য / দ্রষ্টব্য</span>
                  <p className="text-slate-700 text-xs font-semibold leading-relaxed mt-1">{selectedDonorDetail.notes}</p>
                </div>
              )}

              <div className="text-[10px] text-slate-400 font-medium text-center">
                পোস্টের সময়: {selectedDonorDetail.createdAt?.toDate ? new Date(selectedDonorDetail.createdAt.toDate()).toLocaleString("bn-BD") : "কিছুক্ষণ আগে"}
              </div>

              {/* Action row */}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => {
                    if (!user) {
                      showToast("সরাসরি আবেদন করতে অনুগ্রহ করে প্রথমে লগইন অথবা সাইন আপ করুন! (Please login first or sign up)", "warning");
                      return;
                    }
                    setSelectedDonor(selectedDonorDetail);
                    setShowDirectModal(true);
                    setShowDonorDetailModal(false);
                  }}
                  className="flex-1 py-3 bg-red-500 hover:bg-red-600 text-white font-extrabold rounded-xl shadow-lg transition-all text-center flex items-center justify-center gap-1.5"
                >
                  <Heart className="w-4 h-4 fill-white" /> সরাসরি আবেদন করুন
                </button>

                <button
                  onClick={() => {
                    if (!user) {
                      showToast("রিপোর্ট করতে অনুগ্রহ করে প্রথমে লগইন অথবা সাইন আপ করুন! (Please login first or sign up)", "warning");
                      return;
                    }
                    setReportedEntity(selectedDonorDetail);
                    setShowReportModal(true);
                    setShowDonorDetailModal(false);
                  }}
                  className="p-3 bg-slate-100 hover:bg-rose-50 text-slate-400 hover:text-rose-600 border rounded-xl transition-all"
                  title="রিপোর্ট করুন"
                >
                  <ShieldAlert className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* MY PERSONAL DONOR POST OVERLAY MODAL */}
      {showMyDonorPostModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl max-w-lg w-full border shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-red-500 to-rose-600 text-white p-5 flex justify-between items-center shrink-0">
              <div className="flex items-center gap-2">
                <Heart className="w-5 h-5 fill-white" />
                <h3 className="font-extrabold text-base">
                  {myDonorPost 
                    ? (isEditingMyPost ? "আমার রক্তদাতা পোস্ট পরিবর্তন করুন 📝" : "আমার রক্তদাতা পোস্ট বিবরণ 🩸")
                    : "নতুন রক্তদাতা পোস্ট তৈরি করুন 🩸"
                  }
                </h3>
              </div>
              <button 
                onClick={() => {
                  setShowMyDonorPostModal(false);
                  setIsEditingMyPost(false);
                  setShowDeleteMyPostConfirm(false);
                }} 
                className="text-white/80 hover:text-white bg-black/10 hover:bg-black/20 p-1.5 rounded-full transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Container */}
            <div className="p-6 overflow-y-auto space-y-6 text-xs font-semibold text-slate-700">
              
              {myDonorPost && !isEditingMyPost ? (
                /* VIEWING MY ACTIVE DONOR POST */
                <div className="space-y-6">
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
                        onClick={handleToggleMyPostPause}
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

                  {/* Contact details */}
                  <div className="border shadow-inner p-4 rounded-2xl bg-slate-50/50 text-xs font-semibold grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div className="space-y-0.5">
                      <span className="text-slate-400 text-[9px] uppercase tracking-wider block">ফোন নম্বর</span>
                      <p className="text-slate-700 font-bold flex items-center gap-1">
                        <Phone className="w-3.5 h-3.5 text-slate-400" /> {myDonorPost.phone}
                      </p>
                    </div>
                    {myDonorPost.whatsApp && (
                      <div className="space-y-0.5">
                        <span className="text-slate-400 text-[9px] uppercase tracking-wider block">হোয়াটসঅ্যাপ</span>
                        <p className="text-emerald-600 font-bold flex items-center gap-1">
                          <MessageSquare className="w-3.5 h-3.5 text-emerald-500" /> {myDonorPost.whatsApp}
                        </p>
                      </div>
                    )}
                    {myDonorPost.facebook && (
                      <div className="space-y-0.5">
                        <span className="text-slate-400 text-[9px] uppercase tracking-wider block">ফেসবুক লিংক</span>
                        <p className="text-blue-600 font-bold flex items-center gap-1 truncate max-w-[180px]">
                          <Globe className="w-3.5 h-3.5 text-blue-500" /> {myDonorPost.facebook}
                        </p>
                      </div>
                    )}
                    <div className="space-y-0.5">
                      <span className="text-slate-400 text-[9px] uppercase tracking-wider block">ঠিকানা ও জেলা</span>
                      <p className="text-slate-700 font-bold flex items-center gap-1">
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
                        setShowMyDonorPostModal(false);
                        setShowDonationCompleteModal(true);
                      }}
                      className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl shadow-md shadow-emerald-500/10 flex items-center justify-center gap-1.5 transition-all text-xs cursor-pointer active:scale-95"
                    >
                      <Heart className="w-3.5 h-3.5 fill-white" /> আমি রক্ত দিয়েছি 🩸
                    </button>
                  </div>

                  {/* Actions bar */}
                  <div className="flex gap-3 pt-3 border-t">
                    <button
                      onClick={() => setIsEditingMyPost(true)}
                      className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Edit3 className="w-4 h-4" /> এডিট করুন
                    </button>

                    <button
                      onClick={() => setShowDeleteMyPostConfirm(true)}
                      className="py-2.5 px-4 bg-rose-50 hover:bg-rose-100 text-rose-600 hover:text-rose-700 rounded-xl border border-rose-100 transition-colors flex items-center justify-center gap-1 cursor-pointer"
                      title="মুছে ফেলুন"
                    >
                      <Trash2 className="w-4 h-4" /> পোস্ট মুছুন
                    </button>
                  </div>

                  {/* Inline Delete Confirm */}
                  {showDeleteMyPostConfirm && (
                    <div className="p-4 bg-rose-50 border border-rose-150 rounded-2xl text-xs space-y-3">
                      <p className="text-rose-700 font-black">আপনি কি নিশ্চিতভাবে আপনার রক্তদাতার পোস্টটি মুছে ফেলতে চান?</p>
                      <div className="flex gap-2">
                        <button
                          onClick={handleDeleteMyDonorPost}
                          className="px-4 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-extrabold cursor-pointer"
                        >
                          হ্যাঁ, নিশ্চিত মুছুন
                        </button>
                        <button
                          onClick={() => setShowDeleteMyPostConfirm(false)}
                          className="px-4 py-1.5 bg-white border text-slate-600 rounded-lg font-bold cursor-pointer"
                        >
                          বাতিল
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                /* CREATING OR EDITING MY DONOR POST FORM */
                <form onSubmit={handleSaveMyDonorPost} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-slate-500 mb-1">রক্তদাতার নাম <span className="text-red-500">*</span></label>
                      <input
                        type="text"
                        required
                        placeholder="যেমন: শরিফুল ইসলাম"
                        value={donorName}
                        onChange={(e) => setDonorName(e.target.value)}
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-medium"
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
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-medium"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-slate-500 mb-1">রক্তের গ্রুপ <span className="text-red-500">*</span></label>
                      <select
                        required
                        value={donorBloodGroup}
                        onChange={(e) => setDonorBloodGroup(e.target.value)}
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-bold"
                      >
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
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-semibold"
                      >
                        <option value="">নির্বাচন করুন</option>
                        {bangladeshLocations.map(div => (
                          <option key={div.name} value={div.name}>{div.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-semibold disabled:bg-slate-100"
                      >
                        <option value="">নির্বাচন করুন</option>
                        {donorDistrictsList.map(dst => (
                          <option key={dst.name} value={dst.name}>{dst.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-slate-500 mb-1">উপজেলা <span className="text-red-500">*</span></label>
                      <select
                        required
                        disabled={!donorDistrict}
                        value={donorUpazila}
                        onChange={(e) => setDonorUpazila(e.target.value)}
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-semibold disabled:bg-slate-100"
                      >
                        <option value="">নির্বাচন করুন</option>
                        {donorUpazilasList.map(up => (
                          <option key={up} value={up}>{up}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-500 mb-1">ঠিকানা/গ্রাম/পাড়া <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      required
                      placeholder="যেমন: হাউজ নং-২৪, রোড নং-০৩, মিরপুর-১০"
                      value={donorAddress}
                      onChange={(e) => setDonorAddress(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-medium"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-slate-500 mb-1">হোয়াটসঅ্যাপ নম্বর (ঐচ্ছিক)</label>
                      <input
                        type="tel"
                        placeholder="যেমন: 017XXXXXXXX"
                        value={donorWhatsApp}
                        onChange={(e) => setDonorWhatsApp(e.target.value)}
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-medium"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-500 mb-1">ফেসবুক প্রোফাইল লিংক (ঐচ্ছিক)</label>
                      <input
                        type="url"
                        placeholder="যেমন: https://facebook.com/username"
                        value={donorFacebook}
                        onChange={(e) => setDonorFacebook(e.target.value)}
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-medium"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-slate-500 mb-1">ইতিপূর্বে কতবার রক্ত দিয়েছেন?</label>
                      <input
                        type="number"
                        min={0}
                        placeholder="যেমন: ৩"
                        value={donorTimesDonated}
                        onChange={(e) => setDonorTimesDonated(e.target.value)}
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-medium"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-500 mb-1">সর্বশেষ রক্তদানের তারিখ</label>
                      <input
                        type="text"
                        placeholder="যেমন: ১০/০৫/২০২৬ অথবা কখনো না"
                        value={donorLastDonatedAt}
                        onChange={(e) => setDonorLastDonatedAt(e.target.value)}
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-medium"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-500 mb-1">বিশেষ মন্তব্য (ঐচ্ছিক)</label>
                    <textarea
                      placeholder="আপনি কোন এলাকায় নিয়মিত রক্ত দিতে পারবেন বা বিশেষ কোনো শর্ত থাকলে তা লিখুন..."
                      value={donorNotes}
                      onChange={(e) => setDonorNotes(e.target.value)}
                      rows={2}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-medium"
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
                      disabled={savingMyPost}
                      className="flex-1 py-3 bg-red-500 hover:bg-red-600 text-white font-extrabold rounded-2xl shadow-lg shadow-red-500/10 transition-all flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer text-xs uppercase font-black"
                    >
                      {savingMyPost ? "সংরক্ষণ করা হচ্ছে..." : "পোস্ট সাবমিট করুন"}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (myDonorPost) {
                          setIsEditingMyPost(false);
                        } else {
                          setShowMyDonorPostModal(false);
                        }
                      }}
                      className="px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-2xl transition-all cursor-pointer"
                    >
                      বাতিল
                    </button>
                  </div>
                </form>
              )}

            </div>
          </motion.div>
        </div>
      )}

      {/* BLOOD REQUEST DETAIL MODAL */}
      {showRequestDetailModal && selectedRequestDetail && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl max-w-md w-full border shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-red-500 to-rose-600 text-white p-5 flex justify-between items-center shrink-0">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-white animate-pulse" />
                <h3 className="font-extrabold text-base">জরুরি রক্তের আবেদন বিবরণ 🚨</h3>
              </div>
              <button 
                onClick={() => {
                  setShowRequestDetailModal(false);
                  setSelectedRequestDetail(null);
                }} 
                className="text-white/80 hover:text-white bg-black/10 hover:bg-black/20 p-1.5 rounded-full transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto space-y-6 text-xs font-semibold text-slate-700">
              <div className="flex items-center justify-between border-b pb-4">
                <div>
                  <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider mb-0.5">রক্তের প্রয়োজন</span>
                  <div className="flex items-center gap-2">
                    <span className="w-10 h-10 flex items-center justify-center bg-red-500 text-white rounded-full text-base font-black shadow-lg shadow-red-500/20">
                      {selectedRequestDetail.bloodGroup}
                    </span>
                    <div>
                      <h4 className="font-black text-slate-800 text-sm">{selectedRequestDetail.unitsNeeded || 1} ব্যাগ রক্ত</h4>
                      {selectedRequestDetail.isUrgent && (
                        <span className="text-[9px] font-black text-red-600 bg-red-50 border border-red-100 px-2 py-0.5 rounded-md uppercase tracking-wider">জরুরি আবেদন</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider mb-0.5">আবেদনের তারিখ</span>
                  <p className="text-slate-800 font-black">
                    {selectedRequestDetail.createdAt?.toDate 
                      ? selectedRequestDetail.createdAt.toDate().toLocaleDateString('bn-BD', { year: 'numeric', month: 'long', day: 'numeric' })
                      : "তথ্য নেই"
                    }
                  </p>
                </div>
              </div>

              {/* Patient Details */}
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-50 p-3 rounded-2xl border">
                    <span className="text-slate-400 text-[9px] uppercase block tracking-wider mb-0.5">রোগীর নাম</span>
                    <p className="text-slate-800 font-black text-xs">{selectedRequestDetail.patientName}</p>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-2xl border">
                    <span className="text-slate-400 text-[9px] uppercase block tracking-wider mb-0.5">রক্তদানের সময়/তারিখ</span>
                    <p className="text-red-600 font-black text-xs">{selectedRequestDetail.requiredDate}</p>
                  </div>
                </div>

                <div className="bg-slate-50 p-4 rounded-2xl border space-y-3">
                  <div className="flex items-start gap-2 text-xs">
                    <Building2 className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="text-slate-400 text-[9px] uppercase tracking-wider block">হাসপাতালের নাম ও ঠিকানা</span>
                      <p className="text-slate-800 font-bold leading-relaxed">{selectedRequestDetail.hospitalName}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2 text-xs border-t pt-2.5">
                    <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="text-slate-400 text-[9px] uppercase tracking-wider block">এলাকা/উপজেলা/জেলা</span>
                      <p className="text-slate-800 font-bold leading-relaxed">
                        {selectedRequestDetail.upazila}, {selectedRequestDetail.district}, {selectedRequestDetail.division}
                      </p>
                    </div>
                  </div>
                </div>

                {selectedRequestDetail.details && (
                  <div className="p-4 bg-red-50/30 rounded-2xl border space-y-1">
                    <span className="text-red-500 text-[9px] uppercase font-black tracking-wider block">রোগীর বিবরণ/অন্যান্য তথ্য</span>
                    <p className="text-slate-600 leading-relaxed font-semibold">{selectedRequestDetail.details}</p>
                  </div>
                )}
              </div>

              {/* Action Contact bar */}
              <div className="pt-4 border-t space-y-3">
                {user && (selectedRequestDetail.userId === user.uid || user.isAdmin) && (
                  <div className="p-4 bg-slate-50 border border-slate-200/60 rounded-2xl space-y-2.5">
                    <p className="text-[11px] text-slate-800 font-extrabold flex items-center gap-1.5">
                      <Settings className="w-4 h-4 text-slate-500" /> আপনার এই আবেদনটি পরিচালনা করুন:
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setEditingRequest(selectedRequestDetail);
                          setEditPatientName(selectedRequestDetail.patientName || "");
                          setEditBloodGroup(selectedRequestDetail.bloodGroup || "A+");
                          setEditUnits(selectedRequestDetail.unitsNeeded || 1);
                          setEditHospital(selectedRequestDetail.hospitalName || "");
                          setEditPhone(selectedRequestDetail.phone || "");
                          setEditDetails(selectedRequestDetail.details || "");
                          setEditIsUrgent(selectedRequestDetail.isUrgent ?? true);
                          setEditRequiredDate(selectedRequestDetail.requiredDate || "");
                          setEditDivision(selectedRequestDetail.division || "");
                          setEditDistrict(selectedRequestDetail.district || "");
                          setEditUpazila(selectedRequestDetail.upazila || "");
                          setShowEditRequestModal(true);
                        }}
                        className="flex-1 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 font-extrabold text-[11px] rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer border border-indigo-100"
                      >
                        <Edit3 className="w-3.5 h-3.5" /> এডিট করুন
                      </button>

                      <button
                        onClick={() => {
                          if (confirm("আপনি কি নিশ্চিতভাবে এই রক্তের আবেদনটি মুছে ফেলতে চান?")) {
                            handleDeletePublicRequest(selectedRequestDetail.id);
                          }
                        }}
                        className="py-2 px-3 bg-rose-50 hover:bg-rose-100 text-rose-600 hover:text-rose-700 font-extrabold text-[11px] rounded-xl flex items-center justify-center gap-1 transition-colors border border-rose-100 cursor-pointer"
                        title="মুছে ফেলুন"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> মুছুন
                      </button>

                      <button
                        onClick={() => {
                          setDoneDonorName("");
                          setDoneDonorPhone("");
                          setDoneNotes("");
                          setShowCompleteRequestModal(true);
                        }}
                        className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-[11px] rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-sm shadow-emerald-500/10"
                      >
                        <CheckCircle className="w-3.5 h-3.5" /> সম্পন্ন (Done)
                      </button>
                    </div>
                  </div>
                )}

                <a
                  href={`tel:${selectedRequestDetail.phone}`}
                  className="w-full py-3 bg-red-500 hover:bg-red-600 text-white font-extrabold rounded-2xl shadow-lg shadow-red-500/15 flex items-center justify-center gap-2 transition-all cursor-pointer text-xs uppercase"
                >
                  <Phone className="w-4 h-4" /> রোগীর সাথে সরাসরি যোগাযোগ করুন
                </a>
                
                <p className="text-[10px] text-slate-400 text-center leading-relaxed">
                  রক্ত দেওয়ার পূর্বে অবশ্যই রোগীর ঠিকানা ও প্রয়োজনীয়তার সত্যতা যাচাই করে নিন।
                </p>
              </div>

            </div>
          </motion.div>
        </div>
      )}

      {/* EDIT PUBLIC REQUEST MODAL */}
      {showEditRequestModal && editingRequest && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl p-6 max-w-md w-full border shadow-2xl overflow-y-auto max-h-[90vh]"
          >
            <div className="flex justify-between items-center mb-4 border-b pb-3">
              <h3 className="font-extrabold text-slate-800 text-base">রক্তের আবেদন পরিবর্তন করুন 📝</h3>
              <button onClick={() => { setShowEditRequestModal(false); setEditingRequest(null); }} className="text-gray-400 hover:text-gray-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdatePublicRequest} className="space-y-4 text-xs font-semibold">
              <div>
                <label className="block text-slate-500 mb-1">রোগীর নাম <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  required
                  placeholder="যেমন: জনাব রহমান"
                  value={editPatientName}
                  onChange={(e) => setEditPatientName(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-500 mb-1">প্রয়োজনীয় রক্তের গ্রুপ</label>
                  <select
                    value={editBloodGroup}
                    onChange={(e) => setEditBloodGroup(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                  >
                    {["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"].map((g) => (
                      <option key={g} value={g}>{g}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-500 mb-1">কত ব্যাগ প্রয়োজন? <span className="text-red-500">*</span></label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={editUnits}
                    onChange={(e) => setEditUnits(Number(e.target.value))}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-500 mb-1">হাসপাতালের নাম <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  required
                  placeholder="যেমন: ঢাকা মেডিকেল কলেজ হাসপাতাল"
                  value={editHospital}
                  onChange={(e) => setEditHospital(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                />
              </div>

              <div>
                <label className="block text-slate-500 mb-1">যোগাযোগের মোবাইল নম্বর <span className="text-red-500">*</span></label>
                <input
                  type="tel"
                  required
                  placeholder="যেমন: 017XXXXXXXX"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                />
              </div>

              <div>
                <label className="block text-slate-500 mb-1">রক্তদানের সময় ও তারিখ <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  required
                  placeholder="যেমন: আগামীকাল সকাল ১০টা, বা ২৫ই জুলাই"
                  value={editRequiredDate}
                  onChange={(e) => setEditRequiredDate(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-500 mb-1">বিভাগ <span className="text-red-500">*</span></label>
                  <select
                    value={editDivision}
                    onChange={(e) => { setEditDivision(e.target.value); setEditDistrict(""); setEditUpazila(""); }}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold"
                  >
                    <option value="">বাছাই</option>
                    {bangladeshLocations.map((d) => (
                      <option key={d.name} value={d.name}>{d.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-500 mb-1">জেলা <span className="text-red-500">*</span></label>
                  <select
                    value={editDistrict}
                    disabled={!editDivision}
                    onChange={(e) => { setEditDistrict(e.target.value); setEditUpazila(""); }}
                    className="w-full p-2 bg-slate-50 border border-slate-200 disabled:bg-slate-100 rounded-xl font-semibold"
                  >
                    <option value="">বাছাই</option>
                    {(bangladeshLocations.find((d) => d.name === editDivision)?.districts || []).map((d) => (
                      <option key={d.name} value={d.name}>{d.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-500 mb-1">উপজেলা <span className="text-red-500">*</span></label>
                  <select
                    value={editUpazila}
                    disabled={!editDistrict}
                    onChange={(e) => setEditUpazila(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-200 disabled:bg-slate-100 rounded-xl font-semibold"
                  >
                    <option value="">বাছাই</option>
                    {((bangladeshLocations.find((d) => d.name === editDivision)?.districts || []).find((d) => d.name === editDistrict)?.upazilas || []).map((u) => (
                      <option key={u} value={u}>{u}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-500 mb-1">অতিরিক্ত বিবরণ (ঐচ্ছিক)</label>
                <textarea
                  placeholder="রোগীর অবস্থা বা অতিরিক্ত যোগাযোগের তথ্য লিখুন..."
                  value={editDetails}
                  onChange={(e) => setEditDetails(e.target.value)}
                  rows={2}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold"
                />
              </div>

              <label className="flex items-center gap-2 p-2 bg-slate-50 rounded-xl cursor-pointer">
                <input
                  type="checkbox"
                  checked={editIsUrgent}
                  onChange={(e) => setEditIsUrgent(e.target.checked)}
                  className="w-4 h-4 text-red-500 focus:ring-red-500 rounded"
                />
                <span className="text-slate-700 text-xs">এটি একটি জরুরি রক্তের আবেদন</span>
              </label>

              <div className="flex gap-2">
                <button
                  type="submit"
                  className="flex-1 py-3 bg-red-500 hover:bg-red-600 text-white font-extrabold rounded-xl shadow-lg shadow-red-500/10 transition-all cursor-pointer animate-none"
                >
                  আপডেট সংরক্ষণ করুন
                </button>
                <button
                  type="button"
                  onClick={() => { setShowEditRequestModal(false); setEditingRequest(null); }}
                  className="py-3 px-5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold rounded-xl transition-all cursor-pointer"
                >
                  বাতিল
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* MARK AS COMPLETED (DONE) DETAILS FORM MODAL */}
      {showCompleteRequestModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl max-w-md w-full border shadow-2xl overflow-hidden flex flex-col"
          >
            <div className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white p-5 flex justify-between items-center shrink-0">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-white animate-pulse" />
                <h3 className="font-extrabold text-base">রক্তদান সফল সমাপ্তি ফরম 🩸</h3>
              </div>
              <button 
                onClick={() => setShowCompleteRequestModal(false)} 
                className="text-white/80 hover:text-white bg-black/10 hover:bg-black/20 p-1.5 rounded-full transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitCompleteRequest} className="p-6 space-y-4 text-xs font-semibold text-slate-700">
              <p className="text-[11px] text-slate-500 leading-relaxed mb-2">
                এই আবেদনটি সফলভাবে সম্পন্ন করার জন্য অনুগ্রহ করে রক্তদাতার সঠিক তথ্যগুলো প্রদান করুন। যদি রক্তদাতার ফোন নম্বরটি আমাদের প্ল্যাটফর্মে নিবন্ধিত কোনো ইউজার হয়ে থাকে, তবে তার প্রোফাইলে ১টি রক্তদান কাউযুক্ত হবে এবং পরবর্তী ৯০ দিনের জন্য রক্তদানে বিরতি সময়কাল প্রযোজ্য হবে।
              </p>

              <div>
                <label className="block text-slate-500 mb-1">রক্তদাতার নাম <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  required
                  placeholder="যেমন: শরিফুল ইসলাম"
                  value={doneDonorName}
                  onChange={(e) => setDoneDonorName(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                />
              </div>

              <div>
                <label className="block text-slate-500 mb-1">রক্তদাতার মোবাইল নম্বর <span className="text-red-500">*</span></label>
                <input
                  type="tel"
                  required
                  placeholder="যেমন: 017XXXXXXXX"
                  value={doneDonorPhone}
                  onChange={(e) => setDoneDonorPhone(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                />
              </div>

              <div>
                <label className="block text-slate-500 mb-1">রক্তদানের তারিখ <span className="text-red-500">*</span></label>
                <input
                  type="date"
                  required
                  value={doneDonationDate}
                  onChange={(e) => setDoneDonationDate(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800"
                />
              </div>

              <div>
                <label className="block text-slate-500 mb-1">মন্তব্য (ঐচ্ছিক)</label>
                <textarea
                  placeholder="রক্তদান সংক্রান্ত কোনো অতিরিক্ত তথ্য বা অভিজ্ঞতা..."
                  value={doneNotes}
                  onChange={(e) => setDoneNotes(e.target.value)}
                  rows={2}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800"
                />
              </div>

              <div className="flex gap-2.5 pt-2">
                <button
                  type="submit"
                  disabled={submittingDone}
                  className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl transition-all flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer text-xs"
                >
                  {submittingDone ? "সংরক্ষণ হচ্ছে..." : "রক্তদান সম্পন্ন করুন 🩸"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowCompleteRequestModal(false)}
                  className="px-5 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-all cursor-pointer"
                >
                  বাতিল
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* DONATION COMPLETE DETAIL POPUP */}
      {showDonationCompleteModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
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
                আপনার রক্তদানের মহান কাজটি আমাদের সিস্টেমে লিপিবদ্ধ করতে নিচের তথ্যগুলো নির্ভুলভাবে প্রদান করুন। এর ফলে রক্তদাতার নিয়মানুযায়ী ৩ মাসের সেফটি বিরতি চালু করা হবে।
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
