import React, { useState, useEffect } from "react";
import { useApp } from "../contexts/AppContext";
import { 
  collection, 
  query, 
  getDocs, 
  addDoc, 
  setDoc,
  doc,
  where, 
  Timestamp 
} from "firebase/firestore";
import { db } from "../firebase/config";
import { bangladeshLocations } from "../utils/bangladeshLocations";
import { 
  Building2, 
  HeartHandshake, 
  Phone, 
  MapPin, 
  Search, 
  Plus, 
  CheckCircle2, 
  Truck, 
  Clock,
  ShieldAlert
} from "lucide-react";
import { motion } from "motion/react";

export const DirectoryPage: React.FC = () => {
  const { showToast, user } = useApp();
  const [activeTab, setActiveTab] = useState<"hospitals" | "volunteers">("hospitals");
  
  // Search state
  const [division, setDivision] = useState("");
  const [district, setDistrict] = useState("");
  const [upazila, setUpazila] = useState("");
  
  // Lists
  const [hospitals, setHospitals] = useState<any[]>([]);
  const [volunteers, setVolunteers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Modal State
  const [showRegModal, setShowRegModal] = useState(false);
  const [regType, setRegType] = useState<"hospital" | "volunteer">("volunteer");
  
  // Registration Form State
  const [regName, setRegName] = useState("");
  const [regPhone, setRegPhone] = useState("");
  const [regAddress, setRegAddress] = useState("");
  const [regLicense, setRegLicense] = useState("");
  const [regTime, setRegTime] = useState("");
  const [regTransport, setRegTransport] = useState("No");

  const districts = bangladeshLocations.find((d) => d.name === division)?.districts || [];
  const upazilas = districts.find((d) => d.name === district)?.upazilas || [];

  // Fetch Directory Data
  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === "hospitals") {
        const q = collection(db, "hospitals");
        const snap = await getDocs(q);
        const list: any[] = [];
        snap.forEach((doc) => {
          list.push({ id: doc.id, ...doc.data() });
        });
        setHospitals(list);
      } else {
        const q = collection(db, "volunteers");
        const snap = await getDocs(q);
        const list: any[] = [];
        snap.forEach((doc) => {
          list.push({ id: doc.id, ...doc.data() });
        });
        setVolunteers(list);
      }
    } catch (err) {
      console.error("Directory Fetch Error:", err);
      showToast("তথ্য লোড করা যাচ্ছে না। দয়া করে ইন্টারনেট চেক করুন।", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  // Handle Registration Submit
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regName.trim() || !regPhone.trim() || !division || !district || !upazila) {
      showToast("দয়া করে প্রয়োজনীয় সব তথ্য পূরণ করুন।", "warning");
      return;
    }

    try {
      if (regType === "hospital") {
        const docData = {
          name: regName.trim(),
          phone: regPhone.trim(),
          address: regAddress.trim(),
          licenseNumber: regLicense.trim(),
          division,
          district,
          upazila,
          verified: false, // Admin needs to verify
          createdAt: Timestamp.now()
        };
        await addDoc(collection(db, "hospitals"), docData);
        showToast("হাসপাতাল/ব্লাড ব্যাংক সফলভাবে যুক্ত করা হয়েছে। এডমিন ভেরিফিকেশনের জন্য অপেক্ষা করুন।", "success");
      } else {
        const docData = {
          name: regName.trim(),
          phone: regPhone.trim(),
          division,
          district,
          upazila,
          availableTime: regTime.trim() || "২৪ ঘণ্টা",
          transportAvailable: regTransport === "Yes",
          createdAt: Timestamp.now()
        };
        await addDoc(collection(db, "volunteers"), docData);
        showToast("ভলান্টিয়ার হিসেবে আপনি সফলভাবে তালিকাভুক্ত হয়েছেন। ধন্যবাদ!", "success");
      }
      setShowRegModal(false);
      
      // Reset
      setRegName("");
      setRegPhone("");
      setRegAddress("");
      setRegLicense("");
      setRegTime("");
      setRegTransport("No");
      
      fetchData();
    } catch (err) {
      console.error("Registration Directory Error:", err);
      showToast("দাখিল করতে সমস্যা হয়েছে। আবার চেষ্টা করুন।", "error");
    }
  };

  // Filters application
  const filteredHospitals = hospitals.filter((item) => {
    if (division && item.division !== division) return false;
    if (district && item.district !== district) return false;
    if (upazila && item.upazila !== upazila) return false;
    return true;
  });

  const filteredVolunteers = volunteers.filter((item) => {
    if (division && item.division !== division) return false;
    if (district && item.district !== district) return false;
    if (upazila && item.upazila !== upazila) return false;
    return true;
  });

  return (
    <div className="max-w-6xl mx-auto p-4 space-y-6">
      
      {/* Header and Toggle */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
        <div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight">Hospital & Donate Blood 📚</h2>
          <p className="text-slate-500 text-sm font-medium mt-1">নিকটস্থ হাসপাতাল, ব্লাড ব্যাংক এবং স্বেচ্ছাসেবকদের তালিকা খুঁজুন</p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab("hospitals")}
            className={`flex items-center gap-1.5 py-2.5 px-4 rounded-xl text-xs font-bold transition-all ${
              activeTab === "hospitals"
                ? "bg-red-500 text-white shadow-md shadow-red-500/10"
                : "bg-slate-50 text-slate-600 hover:bg-slate-100"
            }`}
          >
            <Building2 className="w-4 h-4" /> হাসপাতাল ও ব্লাড ব্যাংক
          </button>
          <button
            onClick={() => setActiveTab("volunteers")}
            className={`flex items-center gap-1.5 py-2.5 px-4 rounded-xl text-xs font-bold transition-all ${
              activeTab === "volunteers"
                ? "bg-red-500 text-white shadow-md shadow-red-500/10"
                : "bg-slate-50 text-slate-600 hover:bg-slate-100"
            }`}
          >
            <HeartHandshake className="w-4 h-4" /> স্বেচ্ছাসেবক (Volunteers)
          </button>
        </div>
      </div>

      {/* Location Search Bar */}
      <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">বিভাগ</label>
          <select
            value={division}
            onChange={(e) => { setDivision(e.target.value); setDistrict(""); setUpazila(""); }}
            className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700"
          >
            <option value="">সকল বিভাগ</option>
            {bangladeshLocations.map((d) => (
              <option key={d.name} value={d.name}>{d.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">জেলা</label>
          <select
            value={district}
            disabled={!division}
            onChange={(e) => { setDistrict(e.target.value); setUpazila(""); }}
            className="w-full p-2.5 bg-slate-50 border border-slate-200 disabled:bg-slate-100 disabled:text-slate-400 rounded-xl text-xs font-bold text-slate-700"
          >
            <option value="">সকল জেলা</option>
            {districts.map((d) => (
              <option key={d.name} value={d.name}>{d.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">উপজেলা</label>
          <select
            value={upazila}
            disabled={!district}
            onChange={(e) => setUpazila(e.target.value)}
            className="w-full p-2.5 bg-slate-50 border border-slate-200 disabled:bg-slate-100 disabled:text-slate-400 rounded-xl text-xs font-bold text-slate-700"
          >
            <option value="">সকল উপজেলা</option>
            {upazilas.map((u) => (
              <option key={u} value={u}>{u}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Directory Entries Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Register Entry Trigger Button */}
        <div className="md:col-span-3 flex justify-end">
          <button
            onClick={() => {
              if (!user) {
                showToast("যুক্ত করতে অনুগ্রহ করে প্রথমে লগইন অথবা সাইন আপ করুন! (Please login first or sign up)", "warning");
                return;
              }
              setRegType(activeTab === "hospitals" ? "hospital" : "volunteer");
              setShowRegModal(true);
            }}
            className="flex items-center gap-1.5 py-2.5 px-5 bg-slate-950 hover:bg-slate-900 active:scale-95 text-white text-xs font-bold rounded-2xl shadow-md transition-all"
          >
            <Plus className="w-4 h-4" /> 
            {activeTab === "hospitals" ? "নতুন হাসপাতাল/ব্লাড ব্যাংক যুক্ত করুন" : "স্বেচ্ছাসেবক হিসেবে যোগ দিন"}
          </button>
        </div>

        {loading ? (
          <div className="md:col-span-3 text-center py-12">
            <div className="w-10 h-10 border-4 border-red-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-slate-500 text-sm font-medium">তথ্য খোঁজা হচ্ছে, দয়া করে অপেক্ষা করুন...</p>
          </div>
        ) : activeTab === "hospitals" ? (
          filteredHospitals.length === 0 ? (
            <div className="md:col-span-3 text-center py-12 bg-white rounded-3xl border border-slate-100">
              <Building2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-600 font-bold">কোন হাসপাতাল বা ব্লাড ব্যাংক পাওয়া যায়নি।</p>
              <p className="text-slate-400 text-xs mt-1 font-medium">অন্য এলাকা সিলেক্ট করুন বা নতুন এলাকা যুক্ত করুন।</p>
            </div>
          ) : (
            filteredHospitals.map((item) => (
              <div key={item.id} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
                <div>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="p-3 bg-red-50 text-red-500 rounded-2xl">
                      <Building2 className="w-5 h-5" />
                    </div>
                    {item.verified ? (
                      <span className="inline-flex items-center gap-1 py-1 px-2.5 bg-emerald-50 text-emerald-700 text-[10px] font-bold rounded-full border border-emerald-100">
                        <CheckCircle2 className="w-3.5 h-3.5" /> ভেরিফাইড হাসপাতাল
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 py-1 px-2.5 bg-amber-50 text-amber-700 text-[10px] font-bold rounded-full border border-amber-100">
                        <ShieldAlert className="w-3.5 h-3.5" /> এডমিন অনুমোদনের অপেক্ষায়
                      </span>
                    )}
                  </div>
                  
                  <h4 className="font-bold text-slate-800 text-base line-clamp-1">{item.name}</h4>
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mt-1">{item.upazila}, {item.district}</p>
                  
                  <div className="space-y-2 mt-4 text-xs text-slate-600">
                    <div className="flex items-start gap-2">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                      <span>{item.address || "ঠিকানা দেওয়া হয়নি"}</span>
                    </div>
                    {item.licenseNumber && (
                      <div className="text-[10px] bg-slate-50 border p-1.5 px-2.5 rounded-lg text-slate-500 font-mono inline-block">
                        লাইসেন্স: {item.licenseNumber}
                      </div>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => {
                    if (!user) {
                      showToast("কল করতে অনুগ্রহ করে প্রথমে লগইন অথবা সাইন আপ করুন! (Please login first or sign up)", "warning");
                      return;
                    }
                    window.location.href = `tel:${item.phone}`;
                  }}
                  className="mt-6 w-full py-2.5 bg-red-50 hover:bg-red-100 text-red-600 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Phone className="w-3.5 h-3.5" /> কল করুন
                </button>
              </div>
            ))
          )
        ) : filteredVolunteers.length === 0 ? (
          <div className="md:col-span-3 text-center py-12 bg-white rounded-3xl border border-slate-100">
            <HeartHandshake className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-600 font-bold">কোন ভলান্টিয়ার পাওয়া যায়নি।</p>
            <p className="text-slate-400 text-xs mt-1 font-medium">অন্য এলাকা সিলেক্ট করুন বা আপনি নিজেই ভলান্টিয়ার হিসেবে তালিকাভুক্ত হন।</p>
          </div>
        ) : (
          filteredVolunteers.map((item) => (
            <div key={item.id} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="p-3 bg-red-50 text-red-500 rounded-2xl">
                    <HeartHandshake className="w-5 h-5" />
                  </div>
                  
                  {item.transportAvailable && (
                    <span className="inline-flex items-center gap-1 py-1 px-2.5 bg-blue-50 text-blue-700 text-[10px] font-bold rounded-full border border-blue-100">
                      <Truck className="w-3.5 h-3.5" /> নিজস্ব পরিবহন আছে
                    </span>
                  )}
                </div>

                <h4 className="font-bold text-slate-800 text-base">{item.name}</h4>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mt-1">{item.upazila}, {item.district}</p>

                <div className="space-y-2 mt-4 text-xs text-slate-600">
                  <div className="flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>সক্রিয় সময়: {item.availableTime || "২৪ ঘণ্টা"}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Truck className="w-3.5 h-3.5 text-slate-400" />
                    <span>পরিবহন সহযোগিতা: {item.transportAvailable ? "হ্যাঁ (বাইক/গাড়ি)" : "না (শুধু যোগাযোগের সাহায্য)"}</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => {
                  if (!user) {
                    showToast("কল করতে অনুগ্রহ করে প্রথমে লগইন অথবা সাইন আপ করুন! (Please login first or sign up)", "warning");
                    return;
                  }
                  window.location.href = `tel:${item.phone}`;
                }}
                className="mt-6 w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Phone className="w-3.5 h-3.5" /> কল করুন
              </button>
            </div>
          ))
        )}

      </div>

      {/* Registration Modal */}
      {showRegModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl p-6 max-w-md w-full border shadow-2xl overflow-y-auto max-h-[90vh]"
          >
            <div className="flex justify-between items-center mb-4 border-b pb-3">
              <h3 className="font-extrabold text-slate-800 text-lg">
                {regType === "hospital" ? "হাসপাতাল/ব্লাড ব্যাংক যুক্ত করুন" : "ভলান্টিয়ার হিসেবে তালিকাভুক্ত হন"}
              </h3>
              <button 
                onClick={() => setShowRegModal(false)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-slate-50"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleRegister} className="space-y-4 text-xs">
              
              <div>
                <label className="block font-bold text-slate-500 uppercase tracking-wider mb-1.5">নাম <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  required
                  placeholder={regType === "hospital" ? "যেমন: ঢাকা সেন্ট্রাল ব্লাড ব্যাংক" : "যেমন: আব্দুর রহমান"}
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-red-500 focus:bg-white text-slate-800 font-semibold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-500 uppercase tracking-wider mb-1.5">যোগাযোগের মোবাইল নম্বর <span className="text-red-500">*</span></label>
                <input
                  type="tel"
                  required
                  placeholder="যেমন: 017XXXXXXXX"
                  value={regPhone}
                  onChange={(e) => setRegPhone(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-red-500 focus:bg-white text-slate-800 font-semibold"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-500 uppercase tracking-wider mb-1.5">বিভাগ <span className="text-red-500">*</span></label>
                  <select
                    value={division}
                    onChange={(e) => { setDivision(e.target.value); setDistrict(""); setUpazila(""); }}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none"
                  >
                    <option value="">বিভাগ</option>
                    {bangladeshLocations.map((d) => (
                      <option key={d.name} value={d.name}>{d.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-500 uppercase tracking-wider mb-1.5">জেলা <span className="text-red-500">*</span></label>
                  <select
                    value={district}
                    disabled={!division}
                    onChange={(e) => { setDistrict(e.target.value); setUpazila(""); }}
                    className="w-full p-2 bg-slate-50 border border-slate-200 disabled:bg-slate-100 rounded-xl text-xs font-bold text-slate-700 focus:outline-none"
                  >
                    <option value="">জেলা</option>
                    {districts.map((d) => (
                      <option key={d.name} value={d.name}>{d.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-500 uppercase tracking-wider mb-1.5">উপজেলা <span className="text-red-500">*</span></label>
                  <select
                    value={upazila}
                    disabled={!district}
                    onChange={(e) => setUpazila(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-200 disabled:bg-slate-100 rounded-xl text-xs font-bold text-slate-700 focus:outline-none"
                  >
                    <option value="">উপজেলা</option>
                    {upazilas.map((u) => (
                      <option key={u} value={u}>{u}</option>
                    ))}
                  </select>
                </div>
              </div>

              {regType === "hospital" ? (
                <>
                  <div>
                    <label className="block font-bold text-slate-500 uppercase tracking-wider mb-1.5">বিস্তারিত ঠিকানা <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      required
                      placeholder="যেমন: ৩য় তলা, মিরপুর প্লাজা, মিরপুর ১০"
                      value={regAddress}
                      onChange={(e) => setRegAddress(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-red-500 focus:bg-white text-slate-800"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-500 uppercase tracking-wider mb-1.5">লাইসেন্স/নিবন্ধন নম্বর (ঐচ্ছিক)</label>
                    <input
                      type="text"
                      placeholder="যেমন: DHA-BB-2026-X"
                      value={regLicense}
                      onChange={(e) => setRegLicense(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-red-500 focus:bg-white text-slate-800 font-mono"
                    />
                  </div>
                </>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-slate-500 uppercase tracking-wider mb-1.5">কখন পাওয়া যাবে?</label>
                      <input
                        type="text"
                        placeholder="যেমন: ২৪ ঘণ্টা / বিকাল ৫-৮টা"
                        value={regTime}
                        onChange={(e) => setRegTime(e.target.value)}
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-red-500 text-slate-800"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-500 uppercase tracking-wider mb-1.5">নিজস্ব গাড়ি/পরিবহন সুবিধা আছে?</label>
                      <select
                        value={regTransport}
                        onChange={(e) => setRegTransport(e.target.value)}
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none"
                      >
                        <option value="No">না (কোন পরিবহন নেই)</option>
                        <option value="Yes">হ্যাঁ (রক্তদাতাকে নিয়ে যেতে পারবো)</option>
                      </select>
                    </div>
                  </div>
                </>
              )}

              <button
                type="submit"
                className="w-full py-3 bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl shadow-lg transition-all text-xs"
              >
                নিবন্ধন সম্পন্ন করুন
              </button>

            </form>
          </motion.div>
        </div>
      )}

    </div>
  );
};
