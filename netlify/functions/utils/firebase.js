import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";

let dbInstance = null;
let authInstance = null;
let adminInstance = null;

export async function initFirebase() {
  if (dbInstance && authInstance) {
    return { db: dbInstance, auth: authInstance, admin: adminInstance };
  }

  // 1. Retrieve & Validate Project ID
  const projectId = process.env.FIREBASE_PROJECT_ID || process.env.VITE_FIREBASE_PROJECT_ID;
  if (!projectId) {
    throw new Error(
      "Missing required Firebase environment variable: FIREBASE_PROJECT_ID or VITE_FIREBASE_PROJECT_ID. " +
      "Please configure this in your Netlify Environment Variables."
    );
  }

  // 2. Load Service Account details
  const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY || process.env.FIREBASE_SERVICE_ACCOUNT;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  let privateKey = process.env.FIREBASE_PRIVATE_KEY;

  let credential;

  if (serviceAccountKey) {
    try {
      const parsed = JSON.parse(serviceAccountKey);
      credential = cert(parsed);
      console.log("[Firebase Helper] Initialized credentials successfully using service account key JSON.");
    } catch (err) {
      console.error("[Firebase Helper] Failed to parse service account key JSON:", err);
      throw new Error(
        "FIREBASE_SERVICE_ACCOUNT_KEY was provided but is not a valid JSON string. " +
        "Error details: " + err.message
      );
    }
  } else {
    // If serviceAccountKey JSON is not provided, we MUST have both clientEmail and privateKey
    const missingVars = [];
    if (!clientEmail) missingVars.push("FIREBASE_CLIENT_EMAIL");
    if (!privateKey) missingVars.push("FIREBASE_PRIVATE_KEY");

    if (missingVars.length > 0) {
      throw new Error(
        `Missing required Firebase Admin credentials. Please define: ${missingVars.join(" and ")} ` +
        "or set FIREBASE_SERVICE_ACCOUNT_KEY as a JSON string in your Netlify Environment Variables."
      );
    }

    try {
      const formattedPrivateKey = privateKey
        .trim()
        .replace(/^"/, "")
        .replace(/"$/, "")
        .replace(/\\n/g, '\n');

      credential = cert({
        projectId,
        clientEmail,
        privateKey: formattedPrivateKey,
      });
      console.log("[Firebase Helper] Initialized credentials successfully using client email and private key.");
    } catch (certErr) {
      console.error("[Firebase Helper] Failed to build service account cert object:", certErr);
      throw certErr;
    }
  }

  // 3. Initialize Firebase Admin App
  const apps = getApps();
  if (apps.length === 0) {
    try {
      initializeApp({
        credential,
        projectId,
      });
      console.log("[Firebase Helper] Firebase Admin SDK initialized successfully for project:", projectId);
    } catch (err) {
      console.error("[Firebase Helper] Firebase Admin initialization failed:", err);
      throw err;
    }
  }

  // 4. Set up Firestore Database with Database ID routing
  const databaseId = process.env.FIREBASE_DATABASE_ID || process.env.VITE_FIREBASE_DATABASE_ID || "(default)";
  dbInstance = databaseId && databaseId !== "(default)"
    ? getFirestore(undefined, databaseId)
    : getFirestore();

  // 5. Get Auth instance
  authInstance = getAuth();

  // Legacy compatibility object for modules expecting the classical standard admin interface
  adminInstance = {
    auth: () => authInstance,
    firestore: () => dbInstance,
  };

  return { db: dbInstance, auth: authInstance, admin: adminInstance };
}
