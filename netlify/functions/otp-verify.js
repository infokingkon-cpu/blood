import { initFirebase } from "./utils/firebase.js";
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

    const { phone, otp } = body;
    if (!phone || !otp) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ success: false, error: "মোবাইল নম্বর এবং যাচাইকরণ কোড উভয়ই প্রয়োজন।" })
      };
    }

    const normalizedPhone = normalizePhone(phone);
    if (!normalizedPhone) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ success: false, error: "অনুগ্রহ করে একটি সঠিক মোবাইল নম্বর দিন।" })
      };
    }

    // Initialize Firebase and use Firestore database
    let adminDb;
    let auth;
    let admin;
    try {
      const fb = await initFirebase();
      adminDb = fb.db;
      auth = fb.auth;
      admin = fb.admin;
    } catch (fbErr) {
      console.error("[OTP Verify] Firebase Admin initialization failed:", fbErr);
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({
          success: false,
          error: "ডাটাবেজ সংযোগে ত্রুটি ঘটেছে। বিস্তারিত: " + fbErr.message
        })
      };
    }

    // Fetch verification session
    const docRef = adminDb.collection("otp_verifications").doc(normalizedPhone);
    const otpDoc = await docRef.get();

    if (!otpDoc.exists) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ success: false, error: "কোন ওটিপি যাচাইকরণ সেশন পাওয়া যায়নি। অনুগ্রহ করে আবার কোড পাঠান।" })
      };
    }

    const record = otpDoc.data();
    const now = Date.now();

    if (record.verified) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ success: false, error: "এই মোবাইল নম্বরটি ইতিমধ্যে যাচাই করা হয়েছে।" })
      };
    }

    if (now > record.expiresAt) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ success: false, error: "ওটিপির মেয়াদ শেষ হয়ে গেছে। অনুগ্রহ করে আবার কোড পাঠান।" })
      };
    }

    if (record.wrongAttempts >= 5) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ success: false, error: "সর্বোচ্চ ৫ বার ভুল কোড দেওয়া হয়েছে। এই সেশনটি লক করা হয়েছে, অনুগ্রহ করে নতুন কোড পাঠান।" })
      };
    }

    const submittedHash = sha256(otp.trim());
    if (record.otpHash !== submittedHash) {
      const newWrongAttempts = (record.wrongAttempts || 0) + 1;
      await docRef.update({ wrongAttempts: newWrongAttempts });

      if (newWrongAttempts >= 5) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({
            success: false,
            error: "সর্বোচ্চ ৫ বার ভুল কোড দেওয়ার কারণে আপনার সেশনটি লক করা হয়েছে। অনুগ্রহ করে নতুন ওটিপি পাঠান।"
          })
        };
      }

      const remaining = 5 - newWrongAttempts;
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          success: false,
          error: `ভুল ওটিপি কোড। আপনার আর ${remaining} বার চেষ্টা করার সুযোগ রয়েছে।`
        })
      };
    }

    // Mark as verified
    await docRef.update({ verified: true });

    // Leftover Auth user cleanup (for both normalized and raw formatted emails)
    const rawDigits = phone.replace(/\D/g, "");
    // If input starts with '01', standard is e.g. '017XXXXXXXX'. Let's check both
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
        const authUser = await admin.auth().getUserByEmail(email);
        const userDoc = await adminDb.collection("users").doc(authUser.uid).get();
        if (!userDoc.exists) {
          await admin.auth().deleteUser(authUser.uid);
          console.log(`[OTP Verify] Deleted leftover Auth user ${authUser.uid} for ${email}`);
        }
      } catch (err) {
        if (err && err.code !== "auth/user-not-found") {
          console.warn(`[OTP Verify] Warning while cleaning auth user for ${email}:`, err.message);
        }
      }
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        message: "OTP verified successfully."
      })
    };

  } catch (err) {
    console.error("[OTP Verify] Critical error:", err);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ success: false, error: "সার্ভারে একটি ওটিপি যাচাইকরণ ত্রুটি ঘটেছে।" })
    };
  }
};
