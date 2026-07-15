import { initFirebase } from "./utils/firebase.js";
import { 
  doc, 
  getDoc, 
  setDoc, 
  collection, 
  query, 
  where, 
  getDocs,
  limit,
  addDoc
} from "firebase/firestore";
import crypto from "crypto";

const headers = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json"
};

// SHA-256 helper
function sha256(str) {
  return crypto.createHash("sha256").update(str).digest("hex");
}

// Normalize phone to country code format: 8801XXXXXXXXX
function normalizePhone(phone) {
  if (!phone || typeof phone !== "string") return null;
  // Strip all non-digits
  const digits = phone.replace(/\D/g, "");
  // If E.164 Bangladeshi
  if (digits.startsWith("880") && digits.length === 13) {
    return digits;
  }
  // Standard 11 digit Bangladeshi
  if (digits.startsWith("01") && digits.length === 11) {
    return "88" + digits;
  }
  // 10 digit without leading 0
  if (digits.startsWith("1") && digits.length === 10) {
    return "880" + digits;
  }
  return null;
}

export const handler = async (event, context) => {
  // Handle preflight CORS request
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ success: true })
    };
  }

  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ success: false, error: "Method Not Allowed" })
    };
  }

  try {
    let body = {};
    if (event.body) {
      try {
        body = JSON.parse(event.body);
      } catch (e) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ success: false, error: "ভুল অনুরোধ বিন্যাস (Invalid JSON)." })
        };
      }
    }

    const { phone } = body;
    if (!phone || typeof phone !== "string") {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ success: false, error: "মোবাইল নম্বর প্রদান করা আবশ্যক।" })
      };
    }

    const normalizedPhone = normalizePhone(phone);
    if (!normalizedPhone || !normalizedPhone.match(/^8801[3-9]\d{8}$/)) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ success: false, error: "অনুগ্রহ করে একটি সঠিক বাংলাদেশী মোবাইল নম্বর দিন (যেমন: 017XXXXXXXX)।" })
      };
    }

    // Initialize Firebase
    let clientDb;
    try {
      const fb = await initFirebase();
      clientDb = fb.db;
    } catch (fbErr) {
      console.error("[OTP Request] Firebase Client initialization failed:", fbErr);
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ success: false, error: "ডাটাবেজ সংযোগে ত্রুটি ঘটেছে।" })
      };
    }

    // Extract Client IP safely
    const clientIp = event.headers["x-nf-client-connection-ip"] || 
                     event.headers["client-ip"] || 
                     event.headers["x-forwarded-for"] || 
                     "127.0.0.1";

    const now = Date.now();
    const tenMinutesAgo = now - 10 * 60 * 1000;

    // Rate Limiting checks
    try {
      // 1. IP-Based Limit: Max 5 requests/10-min window
      const ipQuery = query(collection(clientDb, "otp_requests_log"), where("ip", "==", clientIp));
      const ipSnap = await getDocs(ipQuery);
      
      const ipRequestsInWindow = ipSnap.docs.filter(doc => {
        const timestamp = doc.data().timestamp;
        return timestamp && timestamp >= tenMinutesAgo;
      });

      if (ipRequestsInWindow.length >= 5) {
        // Find earliest request to calculate wait time
        const timestamps = ipRequestsInWindow.map(d => d.data().timestamp);
        const earliest = Math.min(...timestamps);
        const waitMs = (earliest + 10 * 60 * 1000) - now;
        const waitSeconds = Math.ceil(waitMs / 1000);
        return {
          statusCode: 429,
          headers,
          body: JSON.stringify({
            success: false,
            error: `খুব বেশি অনুরোধ পাঠানো হয়েছে। অনুগ্রহ করে আবার চেষ্টা করার আগে ${Math.ceil(waitSeconds / 60)} মিনিট অপেক্ষা করুন।`
          })
        };
      }

      // 2. Phone-Based Limit: Max 3 requests/10-min window
      const phoneQuery = query(collection(clientDb, "otp_requests_log"), where("phone", "==", normalizedPhone));
      const phoneSnap = await getDocs(phoneQuery);

      const phoneRequestsInWindow = phoneSnap.docs.filter(doc => {
        const timestamp = doc.data().timestamp;
        return timestamp && timestamp >= tenMinutesAgo;
      });

      if (phoneRequestsInWindow.length >= 3) {
        const timestamps = phoneRequestsInWindow.map(d => d.data().timestamp);
        const earliest = Math.min(...timestamps);
        const waitMs = (earliest + 10 * 60 * 1000) - now;
        const waitSeconds = Math.ceil(waitMs / 1000);
        return {
          statusCode: 429,
          headers,
          body: JSON.stringify({
            success: false,
            error: `এই নম্বরে খুব বেশি ওটিপি পাঠানো হয়েছে। অনুগ্রহ করে আবার চেষ্টা করার আগে ${Math.ceil(waitSeconds / 60)} মিনিট অপেক্ষা করুন।`
          })
        };
      }
    } catch (rateLimitErr) {
      console.warn("[OTP Request] Rate limit check skipped due to error:", rateLimitErr);
    }

    // Active Verification Guard
    try {
      const existingOtpDoc = await getDoc(doc(clientDb, "otp_verifications", normalizedPhone));
      if (existingOtpDoc.exists()) {
        const existingData = existingOtpDoc.data();
        if (existingData && !existingData.verified && now < existingData.expiresAt) {
          const remainingSeconds = Math.ceil((existingData.expiresAt - now) / 1000);
          return {
            statusCode: 429,
            headers,
            body: JSON.stringify({
              success: false,
              error: `একটি ওটিপি কোড ইতিমধ্যেই পাঠানো হয়েছে। অনুগ্রহ করে আবার চেষ্টা করার আগে ${remainingSeconds} সেকেন্ড অপেক্ষা করুন।`
            })
          };
        }
      }
    } catch (activeGuardErr) {
      console.warn("[OTP Request] Active verification guard check skipped due to error:", activeGuardErr);
    }

    // Checks: Banned user, duplicate user registration
    try {
      const bannedDoc = await getDoc(doc(clientDb, "banned_phone_numbers", normalizedPhone));
      if (bannedDoc.exists()) {
        return {
          statusCode: 403,
          headers,
          body: JSON.stringify({ success: false, error: "এই মোবাইল নম্বরটি স্থায়ীভাবে নিষিদ্ধ করা হয়েছে।" })
        };
      }

      // Standardize search for phone number in users database
      const userSnap = await getDocs(query(collection(clientDb, "users"), where("phone", "==", normalizedPhone), limit(1)));
      if (!userSnap.empty) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ success: false, error: "এই মোবাইল নম্বরটি ইতিমধ্যে নিবন্ধিত রয়েছে। অনুগ্রহ করে লগইন করুন।" })
        };
      }
    } catch (dbCheckErr) {
      console.warn("[OTP Request] User duplicate/banned checks failed or skipped:", dbCheckErr);
    }

    // Generate 6-digit OTP
    const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpHashValue = sha256(generatedOtp);
    const expiresAt = now + 3 * 60 * 1000; // 3 minutes

    // Gateway parameters
    const apiKey = process.env.SMS_API_KEY || "SMS91AAC4DA572E2101A63CBCFD6FA58F34";
    const apiUrl = process.env.SMS_API_URL || "https://sms.corp.com.bd/api.php";
    const message = `Donate Blood অ্যাপে আপনার যাচাইকরণ কোডটি হলো: ${generatedOtp}। এটি ৩ মিনিটের জন্য কার্যকর থাকবে।`;

    // Send HTTP Request to Bulk SMS Gateway
    let responseText = "";
    let responseStatus = 0;
    try {
      const requestUrl = `${apiUrl}?api_key=${encodeURIComponent(apiKey)}&numbers=${encodeURIComponent(normalizedPhone)}&message=${encodeURIComponent(message)}`;
      console.log(`[OTP Request] Dispatching SMS via GET request to: ${apiUrl}`);
      
      const fetchRes = await fetch(requestUrl, { signal: AbortSignal.timeout(5000) });
      responseStatus = fetchRes.status;
      responseText = await fetchRes.text();
      
      console.log(`[OTP Request] Gateway Response Status: ${responseStatus}. Response text: ${responseText}`);
    } catch (smsError) {
      console.error("[OTP Request] SMS provider fetch failed:", smsError);
      return {
        statusCode: 502,
        headers,
        body: JSON.stringify({
          success: false,
          error: "এসএমএস গেটওয়ে সংযোগে ত্রুটি ঘটেছে। অনুগ্রহ করে আবার চেষ্টা করুন।",
          details: smsError.message
        })
      };
    }

    // Check if provider accepted the request
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
      return {
        statusCode: 502,
        headers,
        body: JSON.stringify({
          success: false,
          error: "এসএমএস গেটওয়ে অনুরোধ প্রত্যাখ্যান করেছে।",
          providerResponse: responseText
        })
      };
    }

    // Save session to Firestore
    try {
      await setDoc(doc(clientDb, "otp_verifications", normalizedPhone), {
        phone: normalizedPhone,
        otpHash: otpHashValue,
        createdAt: now,
        expiresAt,
        wrongAttempts: 0,
        verified: false
      });

      // Write rate limit log
      await addDoc(collection(clientDb, "otp_requests_log"), {
        ip: clientIp,
        phone: normalizedPhone,
        timestamp: now
      });
    } catch (dbWriteErr) {
      console.error("[OTP Request] Failed to save OTP session to database:", dbWriteErr);
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ success: false, error: "যাচাইকরণ সেশন ডাটাবেজে সংরক্ষণ করতে ব্যর্থ হয়েছে।" })
      };
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        message: "আপনার মোবাইলে একটি ৬ ডিজিটের যাচাইকরণ কোড পাঠানো হয়েছে।"
      })
    };

  } catch (err) {
    console.error("[OTP Request] Critical error:", err);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ success: false, error: "সার্ভারে একটি ওটিপি প্রক্রিয়াকরণ ত্রুটি ঘটেছে।" })
    };
  }
};
