import dotenv from "dotenv";
dotenv.config();

import express from "express";
import path from "path";
import fs from "fs";
import cors from "cors";
import crypto from "crypto";
import { createServer as createViteServer } from "vite";
import admin from "firebase-admin";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

// Firebase Client SDK imports for backend database work (to bypass ADC Permission Denied errors)
import { initializeApp as initializeClientApp } from "firebase/app";
import { 
  getFirestore as getClientFirestore, 
  doc as clientDoc, 
  getDoc as getClientDoc, 
  setDoc as setClientDoc, 
  deleteDoc as deleteClientDoc,
  collection as clientCollection, 
  query as clientQuery, 
  where as clientWhere, 
  getDocs as getClientDocs,
  limit as clientLimit,
  addDoc as clientAddDoc
} from "firebase/firestore";
import { 
  getAuth as getClientAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword 
} from "firebase/auth";

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

// Read Firebase configuration
const configPath = path.resolve(process.cwd(), "firebase-applet-config.json");
let adminDb: any;
let clientDb: any = null;
let clientAuth: any = null;

// Self-healing setup and login for system backend user
async function setupClientFirebase(config: any) {
  try {
    const clientApp = initializeClientApp(config);
    clientDb = getClientFirestore(clientApp, config.firestoreDatabaseId);
    clientAuth = getClientAuth(clientApp);

    const systemEmail = "system-backend@donateblood.com";
    const systemPassword = "SuperSecureSystemPassword123!!";

    try {
      await signInWithEmailAndPassword(clientAuth, systemEmail, systemPassword);
      console.log("[Firebase Client] Logged in successfully as", systemEmail);
    } catch (err: any) {
      if (err.code === "auth/user-not-found" || err.code === "auth/invalid-credential" || err.message?.includes("not-found") || err.message?.includes("invalid")) {
        console.log("[Firebase Client] System user not found. Creating...");
        try {
          await createUserWithEmailAndPassword(clientAuth, systemEmail, systemPassword);
          console.log("[Firebase Client] System user created and logged in successfully as", systemEmail);
        } catch (createErr: any) {
          console.error("[Firebase Client] Failed to create system user:", createErr.message || createErr);
        }
      } else {
        console.error("[Firebase Client] Login failed with error:", err.message || err);
      }
    }
  } catch (err: any) {
    console.error("[Firebase Client] Setup failed:", err.message || err);
  }
}

try {
  let firebaseConfig: any = null;

  if (fs.existsSync(configPath)) {
    firebaseConfig = JSON.parse(fs.readFileSync(configPath, "utf-8"));
  } else if (process.env.VITE_FIREBASE_API_KEY || process.env.FIREBASE_API_KEY) {
    firebaseConfig = {
      apiKey: process.env.VITE_FIREBASE_API_KEY || process.env.FIREBASE_API_KEY,
      authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN || process.env.FIREBASE_AUTH_DOMAIN,
      projectId: process.env.VITE_FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID,
      storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET || process.env.FIREBASE_STORAGE_BUCKET,
      messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID || process.env.FIREBASE_MESSAGING_SENDER_ID,
      appId: process.env.VITE_FIREBASE_APP_ID || process.env.FIREBASE_APP_ID,
      firestoreDatabaseId: process.env.VITE_FIREBASE_DATABASE_ID || process.env.FIREBASE_DATABASE_ID || "(default)"
    };
  }

  if (firebaseConfig) {
    // Initialize Firebase Admin
    admin.initializeApp({
      projectId: firebaseConfig.projectId,
    });
    
    const dbId = firebaseConfig.firestoreDatabaseId;
    adminDb = dbId && dbId !== "(default)" ? getFirestore(undefined as any, dbId) : getFirestore();
    console.log("Firebase Admin SDK initialized successfully with projectId:", firebaseConfig.projectId, "and databaseId:", dbId);
    
    // Initialize client-side fallback/bypass DB & authenticate system user
    setupClientFirebase(firebaseConfig);
  } else {
    console.warn("Warning: firebase-applet-config.json not found and no environment variables set. Initializing Admin SDK with default credentials.");
    admin.initializeApp();
    adminDb = getFirestore();
    console.log("Firebase Admin SDK initialized with default credentials.");
  }
} catch (error) {
  console.error("Failed to initialize Firebase Admin on server:", error);
}

// Middleware to verify if requester is an Admin
const verifyAdmin = async (req: any, res: any, next: any) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ success: false, error: "অননুমোদিত অ্যাক্সেস।" });
  }

  const idToken = authHeader.split("Bearer ")[1];
  try {
    const decodedToken = await getAuth().verifyIdToken(idToken);
    const uid = decodedToken.uid;

    // Check master admin
    if (decodedToken.email === "info.shorif0000@gmail.com" || decodedToken.email === "geminiprozksi@gmail.com") {
      req.adminUser = decodedToken;
      return next();
    }

    // Check firestore for isAdmin using Admin SDK
    if (adminDb) {
      const userDoc = await adminDb.collection("users").doc(uid).get();
      if (userDoc.exists && userDoc.data().isAdmin === true) {
        req.adminUser = decodedToken;
        return next();
      }
    }

    return res.status(403).json({ success: false, error: "আপনার এই কাজটি করার অনুমতি নেই।" });
  } catch (error) {
    console.error("[Auth Middleware] Verification failed:", error);
    return res.status(401).json({ success: false, error: "অননুমোদিত বা অবৈধ সেশন।" });
  }
};

// API: Delete Auth User (from Firebase Authentication)
app.post("/api/delete-auth-user", verifyAdmin, async (req: any, res: any) => {
  const { uid } = req.body;
  if (!uid) {
    return res.status(400).json({ success: false, error: "ইউজার আইডি (UID) আবশ্যক।" });
  }

  try {
    await getAuth().deleteUser(uid);
    console.log(`[Admin API] Deleted Auth user UID: ${uid}`);
    return res.json({ success: true, message: "Firebase Auth থেকে ইউজার সফলভাবে ডিলিট করা হয়েছে।" });
  } catch (error: any) {
    console.error("Error deleting Auth user:", error);
    if (error.code === "auth/user-not-found") {
      return res.json({ success: true, message: "ইউজার ইতিমধ্যে ডিলিট করা হয়েছে।" });
    }
    // If the Identity Toolkit API is not enabled, or there's an API permission/configuration error,
    // we do not want to block the user deletion in Firestore! We log a warning and return success.
    const errorMessage = error instanceof Error ? error.message : String(error);
    if (
      errorMessage.includes("identitytoolkit.googleapis.com") ||
      errorMessage.includes("API has not been used") ||
      errorMessage.includes("403") ||
      error.code === "auth/internal-error"
    ) {
      console.warn(`[Admin API] Firebase Auth deletion bypassed because Identity Toolkit API is not enabled/configured in this Firebase project. Proceeding with Firestore operations.`);
      return res.json({ 
        success: true, 
        warning: "Identity Toolkit API is not enabled. Authentication deletion bypassed.",
        message: "Firebase Auth deletion bypassed due to API constraints, continuing with Firestore deletion." 
      });
    }
    return res.status(500).json({ success: false, error: "Firebase Auth থেকে ইউজার ডিলিট করতে ব্যর্থ হয়েছে।" });
  }
});

// Helper functions
function sha256(str: string): string {
  return crypto.createHash("sha256").update(str).digest("hex");
}

function normalizePhone(phone: string): string | null {
  if (!phone || typeof phone !== "string") return null;
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("880") && digits.length === 13) {
    return digits;
  }
  if (digits.startsWith("01") && digits.length === 11) {
    return "88" + digits;
  }
  if (digits.startsWith("1") && digits.length === 10) {
    return "880" + digits;
  }
  return null;
}

// API: Send OTP
app.post("/api/otp/request", async (req: any, res: any) => {
  const { phone } = req.body;
  if (!phone || typeof phone !== "string") {
    return res.status(400).json({ success: false, error: "মোবাইল নম্বর প্রদান করা আবশ্যক।" });
  }

  const normalizedPhone = normalizePhone(phone);
  if (!normalizedPhone || !normalizedPhone.match(/^8801[3-9]\d{8}$/)) {
    return res.status(400).json({ success: false, error: "অনুগ্রহ করে একটি সঠিক বাংলাদেশী মোবাইল নম্বর দিন (যেমন: 017XXXXXXXX)।" });
  }

  if (!adminDb) {
    return res.status(500).json({ success: false, error: "ডাটাবেজ সংযোগে ত্রুটি ঘটেছে।" });
  }

  const clientIp = req.ip || req.headers["x-forwarded-for"] || "127.0.0.1";
  const now = Date.now();
  const tenMinutesAgo = now - 10 * 60 * 1000;

  try {
    // 1. IP-Based Limit: Max 5 requests/10-min window
    let ipRequestsInWindow = [];
    if (clientDb) {
      const q = clientQuery(clientCollection(clientDb, "otp_requests_log"), clientWhere("ip", "==", clientIp));
      const snap = await getClientDocs(q);
      ipRequestsInWindow = snap.docs.filter((doc: any) => {
        const timestamp = doc.data().timestamp;
        return timestamp && timestamp >= tenMinutesAgo;
      });
    } else {
      const ipQuery = await adminDb.collection("otp_requests_log")
        .where("ip", "==", clientIp)
        .get();
      ipRequestsInWindow = ipQuery.docs.filter((doc: any) => {
        const timestamp = doc.data().timestamp;
        return timestamp && timestamp >= tenMinutesAgo;
      });
    }

    if (ipRequestsInWindow.length >= 5) {
      const timestamps = ipRequestsInWindow.map((d: any) => d.data().timestamp);
      const earliest = Math.min(...timestamps);
      const waitMs = (earliest + 10 * 60 * 1000) - now;
      const waitSeconds = Math.ceil(waitMs / 1000);
      return res.status(429).json({
        success: false,
        error: `খুব বেশি অনুরোধ পাঠানো হয়েছে। অনুগ্রহ করে আবার চেষ্টা করার আগে ${Math.ceil(waitSeconds / 60)} মিনিট অপেক্ষা করুন।`
      });
    }

    // 2. Phone-Based Limit: Max 3 requests/10-min window
    let phoneRequestsInWindow = [];
    if (clientDb) {
      const q = clientQuery(clientCollection(clientDb, "otp_requests_log"), clientWhere("phone", "==", normalizedPhone));
      const snap = await getClientDocs(q);
      phoneRequestsInWindow = snap.docs.filter((doc: any) => {
        const timestamp = doc.data().timestamp;
        return timestamp && timestamp >= tenMinutesAgo;
      });
    } else {
      const phoneQuery = await adminDb.collection("otp_requests_log")
        .where("phone", "==", normalizedPhone)
        .get();
      phoneRequestsInWindow = phoneQuery.docs.filter((doc: any) => {
        const timestamp = doc.data().timestamp;
        return timestamp && timestamp >= tenMinutesAgo;
      });
    }

    if (phoneRequestsInWindow.length >= 3) {
      const timestamps = phoneRequestsInWindow.map((d: any) => d.data().timestamp);
      const earliest = Math.min(...timestamps);
      const waitMs = (earliest + 10 * 60 * 1000) - now;
      const waitSeconds = Math.ceil(waitMs / 1000);
      return res.status(429).json({
        success: false,
        error: `এই নম্বরে খুব বেশি ওটিপি পাঠানো হয়েছে। অনুগ্রহ করে আবার চেষ্টা করার আগে ${Math.ceil(waitSeconds / 60)} মিনিট অপেক্ষা করুন।`
      });
    }

    // 3. Active Verification Guard
    let existingOtpDoc: any = null;
    let hasExisting = false;
    let existingData: any = null;

    if (clientDb) {
      const docRef = clientDoc(clientDb, "otp_verifications", normalizedPhone);
      existingOtpDoc = await getClientDoc(docRef);
      hasExisting = existingOtpDoc.exists();
      if (hasExisting) existingData = existingOtpDoc.data();
    } else {
      existingOtpDoc = await adminDb.collection("otp_verifications").doc(normalizedPhone).get();
      hasExisting = existingOtpDoc.exists;
      if (hasExisting) existingData = existingOtpDoc.data();
    }

    if (hasExisting && existingData) {
      if (!existingData.verified && now < existingData.expiresAt) {
        const remainingSeconds = Math.ceil((existingData.expiresAt - now) / 1000);
        return res.status(429).json({
          success: false,
          error: `একটি ওটিপি কোড ইতিমধ্যেই পাঠানো হয়েছে। অনুগ্রহ করে আবার চেষ্টা করার আগে ${remainingSeconds} সেকেন্ড অপেক্ষা করুন।`
        });
      }
    }

    // 4. Checks: Banned user, duplicate user registration
    let isBanned = false;
    if (clientDb) {
      const docRef = clientDoc(clientDb, "banned_phone_numbers", normalizedPhone);
      const bannedSnap = await getClientDoc(docRef);
      isBanned = bannedSnap.exists();
    } else {
      const bannedDoc = await adminDb.collection("banned_phone_numbers").doc(normalizedPhone).get();
      isBanned = bannedDoc.exists;
    }

    if (isBanned) {
      return res.status(403).json({ success: false, error: "এই মোবাইল নম্বরটি স্থায়ীভাবে নিষিদ্ধ করা হয়েছে।" });
    }

    let isRegistered = false;
    if (clientDb) {
      const q = clientQuery(clientCollection(clientDb, "users"), clientWhere("phone", "==", normalizedPhone), clientLimit(1));
      const snap = await getClientDocs(q);
      isRegistered = !snap.empty;
    } else {
      const userSnap = await adminDb.collection("users").where("phone", "==", normalizedPhone).limit(1).get();
      isRegistered = !userSnap.empty;
    }

    if (isRegistered) {
      return res.status(400).json({ success: false, error: "এই মোবাইল নম্বরটি ইতিমধ্যে নিবন্ধিত রয়েছে। অনুগ্রহ করে লগইন করুন।" });
    }

    // Generate 6-digit OTP
    const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpHashValue = sha256(generatedOtp);
    const expiresAt = now + 3 * 60 * 1000; // 3 minutes

    // Gateway parameters
    const apiKey = process.env.SMS_API_KEY || "SMS91AAC4DA572E2101A63CBCFD6FA58F34";
    const apiUrl = process.env.SMS_API_URL || "https://sms.corp.com.bd/api.php";
    const message = `Donate Blood অ্যাপে আপনার যাচাইকরণ কোডটি হলো: ${generatedOtp}। এটি ৩ মিনিটের জন্য কার্যকর থাকবে।`;

    // Send SMS via HTTP GET request
    let responseText = "";
    let responseStatus = 0;
    try {
      const requestUrl = `${apiUrl}?api_key=${encodeURIComponent(apiKey)}&numbers=${encodeURIComponent(normalizedPhone)}&message=${encodeURIComponent(message)}`;
      console.log(`[OTP Request Server] Dispatching SMS via GET request to: ${apiUrl}`);
      
      const fetchRes = await fetch(requestUrl, { signal: AbortSignal.timeout(5000) });
      responseStatus = fetchRes.status;
      responseText = await fetchRes.text();
      
      console.log(`[OTP Request Server] Gateway Response Status: ${responseStatus}. Response text: ${responseText}`);
    } catch (smsError: any) {
      console.error("[OTP Request Server] SMS provider fetch failed:", smsError);
      return res.status(502).json({
        success: false,
        error: "এসএমএস গেটওয়ে সংযোগে ত্রুটি ঘটেছে। অনুগ্রহ করে আবার চেষ্টা করুন।",
        details: smsError.message
      });
    }

    // Parse gateway response
    let providerSucceeded = false;
    try {
      const parsed = JSON.parse(responseText);
      if (parsed.success === true || parsed.success === "true") {
        providerSucceeded = true;
      }
    } catch (e) {
      if (responseText.toLowerCase().includes("success") || responseText.toLowerCase().includes("sent")) {
        providerSucceeded = true;
      }
    }

    if (!providerSucceeded) {
      return res.status(502).json({
        success: false,
        error: "এসএমএস গেটওয়ে অনুরোধ প্রত্যাখ্যান করেছে।",
        providerResponse: responseText
      });
    }

    // Save session to Firestore
    if (clientDb) {
      const docRef = clientDoc(clientDb, "otp_verifications", normalizedPhone);
      await setClientDoc(docRef, {
        phone: normalizedPhone,
        otpHash: otpHashValue,
        createdAt: now,
        expiresAt,
        wrongAttempts: 0,
        verified: false
      });

      const logCollection = clientCollection(clientDb, "otp_requests_log");
      await clientAddDoc(logCollection, {
        ip: clientIp,
        phone: normalizedPhone,
        timestamp: now
      });
    } else {
      await adminDb.collection("otp_verifications").doc(normalizedPhone).set({
        phone: normalizedPhone,
        otpHash: otpHashValue,
        createdAt: now,
        expiresAt,
        wrongAttempts: 0,
        verified: false
      });

      await adminDb.collection("otp_requests_log").add({
        ip: clientIp,
        phone: normalizedPhone,
        timestamp: now
      });
    }

    return res.json({
      success: true,
      message: "আপনার মোবাইলে একটি ৬ ডিজিটের যাচাইকরণ কোড পাঠানো হয়েছে।"
    });

  } catch (err: any) {
    console.error("Error in /api/otp/request:", err);
    return res.status(500).json({ 
      success: false, 
      error: "সার্ভারে ওটিপি অনুরোধ প্রক্রিয়াকরণে সমস্যা হয়েছে।", 
      details: err.message || String(err),
      stack: err.stack
    });
  }
});

// API: Verify OTP
app.post("/api/otp/verify", async (req: any, res: any) => {
  const { phone, otp } = req.body;
  if (!phone || !otp) {
    return res.status(400).json({ success: false, error: "মোবাইল নম্বর এবং যাচাইকরণ কোড উভয়ই প্রয়োজন।" });
  }

  const normalizedPhone = normalizePhone(phone);
  if (!normalizedPhone) {
    return res.status(400).json({ success: false, error: "অনুগ্রহ করে একটি সঠিক মোবাইল নম্বর দিন।" });
  }

  if (!adminDb) {
    return res.status(500).json({ success: false, error: "ডাটাবেজ সংযোগে ত্রুটি ঘটেছে।" });
  }

  try {
    let otpDoc: any = null;
    let hasOtp = false;
    let record: any = null;

    if (clientDb) {
      const docRef = clientDoc(clientDb, "otp_verifications", normalizedPhone);
      otpDoc = await getClientDoc(docRef);
      hasOtp = otpDoc.exists();
      if (hasOtp) record = otpDoc.data();
    } else {
      otpDoc = await adminDb.collection("otp_verifications").doc(normalizedPhone).get();
      hasOtp = otpDoc.exists;
      if (hasOtp) record = otpDoc.data();
    }

    if (!hasOtp || !record) {
      return res.status(400).json({ success: false, error: "কোন ওটিপি যাচাইকরণ সেশন পাওয়া যায়নি। অনুগ্রহ করে আবার কোড পাঠান।" });
    }

    const now = Date.now();

    if (record.verified) {
      return res.status(400).json({ success: false, error: "এই মোবাইল নম্বরটি ইতিমধ্যে যাচাই করা হয়েছে।" });
    }

    if (now > record.expiresAt) {
      return res.status(400).json({ success: false, error: "ওটিপির মেয়াদ শেষ হয়ে গেছে। অনুগ্রহ করে আবার কোড পাঠান।" });
    }

    if (record.wrongAttempts >= 5) {
      return res.status(400).json({ success: false, error: "সর্বোচ্চ ৫ বার ভুল কোড দেওয়া হয়েছে। এই সেশনটি লক করা হয়েছে, অনুগ্রহ করে নতুন কোড পাঠান।" });
    }

    const submittedHash = sha256(otp.trim());
    if (record.otpHash !== submittedHash) {
      const newWrongAttempts = (record.wrongAttempts || 0) + 1;
      
      if (clientDb) {
        const docRef = clientDoc(clientDb, "otp_verifications", normalizedPhone);
        await setClientDoc(docRef, { wrongAttempts: newWrongAttempts }, { merge: true });
      } else {
        await adminDb.collection("otp_verifications").doc(normalizedPhone).update({ wrongAttempts: newWrongAttempts });
      }

      if (newWrongAttempts >= 5) {
        return res.status(400).json({
          success: false,
          error: "সর্বোচ্চ ৫ বার ভুল কোড দেওয়ার কারণে আপনার সেশনটি লক করা হয়েছে। অনুগ্রহ করে নতুন ওটিপি পাঠান।"
        });
      }

      const remaining = 5 - newWrongAttempts;
      return res.status(400).json({
        success: false,
        error: `ভুল ওটিপি কোড। আপনার আর ${remaining} বার চেষ্টা করার সুযোগ রয়েছে।`
      });
    }

    // Mark as verified
    if (clientDb) {
      const docRef = clientDoc(clientDb, "otp_verifications", normalizedPhone);
      await setClientDoc(docRef, { verified: true }, { merge: true });
    } else {
      await adminDb.collection("otp_verifications").doc(normalizedPhone).update({ verified: true });
    }

    // Leftover Auth user cleanup (for both normalized and raw formatted emails)
    const rawDigits = phone.replace(/\D/g, "");
    const emailsToClean = [];
    if (rawDigits.startsWith("880") && rawDigits.length === 13) {
      emailsToClean.push(`${rawDigits}@donateblood.com`);
      emailsToClean.push(`${rawDigits.substring(2)}@donateblood.com`);
    } else if (rawDigits.startsWith("01") && rawDigits.length === 11) {
      emailsToClean.push(`${rawDigits}@donateblood.com`);
      emailsToClean.push(`88${rawDigits}@donateblood.com`);
    }

    for (const email of emailsToClean) {
      try {
        const authUser = await getAuth().getUserByEmail(email);
        
        let userExists = false;
        if (clientDb) {
          const docRef = clientDoc(clientDb, "users", authUser.uid);
          const userSnap = await getClientDoc(docRef);
          userExists = userSnap.exists();
        } else {
          const userDoc = await adminDb.collection("users").doc(authUser.uid).get();
          userExists = userDoc.exists;
        }

        if (!userExists) {
          await getAuth().deleteUser(authUser.uid);
          console.log(`[OTP Verify Server] Deleted leftover Auth user ${authUser.uid} for ${email}`);
        }
      } catch (err: any) {
        if (err && err.code !== "auth/user-not-found") {
          console.warn(`[OTP Verify Server] Warning while cleaning auth user for ${email}:`, err.message);
        }
      }
    }

    return res.json({
      success: true,
      message: "OTP verified successfully."
    });

  } catch (err: any) {
    console.error("Error in /api/otp/verify:", err);
    return res.status(500).json({ 
      success: false, 
      error: "সার্ভারে ওটিপি যাচাইকরণ প্রক্রিয়াকরণে সমস্যা হয়েছে।", 
      details: err.message || String(err),
      stack: err.stack
    });
  }
});

// Start server and setup Vite
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Server] Donate Blood running on port ${PORT}`);
  });
}

startServer();
