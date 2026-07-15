export interface UserProfile {
  uid: string;
  phone: string;
  fullName: string;
  bloodGroup: string; // A+, A-, B+, B-, O+, O-, AB+, AB-
  role: "donor" | "receiver" | "both";
  profileCompleted: boolean;
  createdAt: any; // Firestore Timestamp
  lastDonationDate?: any; // Firestore Timestamp or null
  donationAvailable: boolean;
  blocked: boolean;
  banned: boolean;
  address?: string;
  division?: string;
  district?: string;
  upazila?: string;
  union?: string;
  facebookProfile?: string;
  whatsAppNumber?: string;
  bio?: string;
  profilePicture?: string;
  isAdmin?: boolean;
  additionalPhones?: string[];
  bloodDonationLockedUntil?: any; // Timestamp of lock expiry
}

export interface DonorPost {
  id: string;
  userId: string;
  name: string;
  bloodGroup: string;
  address: string;
  district: string;
  upazila: string;
  phone: string;
  whatsApp?: string;
  facebook?: string;
  image?: string;
  notes?: string;
  createdAt: any;
  paused?: boolean;
  timesDonated?: string; // e.g. "৫ বার"
  lastDonatedAt?: string; // e.g. "2026-06-10" or "কখনো না"
  bloodDonationLockedUntil?: any; // Timestamp of lock expiry
}

export interface BloodRequest {
  id: string;
  userId: string; // Requester
  patientName: string;
  bloodGroup: string;
  requiredDate: string;
  hospitalName: string;
  district: string;
  upazila: string;
  contactNumber: string;
  emergencyLevel: "normal" | "emergency";
  notes?: string;
  createdAt: any;
  status: "pending" | "accepted" | "completed" | "cancelled";
}

export interface DirectRequest {
  id: string;
  requesterId: string;
  donorId: string;
  bloodGroup: string;
  createdAt: any;
  status: "pending" | "accepted" | "cancelled" | "completed";
  hospitalName?: string;
  emergencyLevel?: string;
  requesterName?: string;
  requesterPhone?: string;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  createdAt: any;
  read: boolean;
}

export interface DonationHistory {
  id: string;
  donorId: string;
  recipientName: string;
  recipientDistrict: string;
  donationDate: any;
  notes?: string;
  createdAt: any;
}

export interface Report {
  id: string;
  reporterId: string;
  reportedUserId: string;
  reportedUserName?: string;
  reporterName?: string;
  reason: "ভুয়া তথ্য" | "ভুল মোবাইল নম্বর" | "প্রতারণার সন্দেহ" | "অশোভন আচরণ" | "অন্যান্য";
  createdAt: any;
  status: "pending" | "closed";
}

export interface Feedback {
  id: string;
  userId: string;
  userName?: string;
  userPhone?: string;
  type: "issue" | "feedback" | "suggestion";
  message: string;
  createdAt: any;
}

export interface Announcement {
  id: string;
  message: string;
  createdAt: any;
  active: boolean;
}

export interface SupportMessage {
  id: string;
  name: string;
  phone: string;
  subject: string;
  message: string;
  createdAt: any;
}

export interface SystemSetting {
  id: string;
  registrationEnabled: boolean;
  bloodRequestsEnabled: boolean;
  donationsEnabled: boolean;
  homepageNotice: string;
  maintenanceMode: boolean;
}
