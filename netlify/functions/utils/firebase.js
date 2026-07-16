import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";

const projectId = process.env.FIREBASE_PROJECT_ID || process.env.VITE_FIREBASE_PROJECT_ID;
if (!projectId) {
  throw new Error("Missing required environment variable: FIREBASE_PROJECT_ID or VITE_FIREBASE_PROJECT_ID");
}

let credential;
const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY || process.env.FIREBASE_SERVICE_ACCOUNT;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
let privateKey = process.env.FIREBASE_PRIVATE_KEY;

if (serviceAccountKey) {
  try {
    const parsed = JSON.parse(serviceAccountKey);
    credential = cert(parsed);
    console.log("[Firebase Helper] Initialized credential using service account key.");
  } catch (err) {
    console.error("[Firebase Helper] Failed to parse service account key JSON:", err);
  }
} else if (clientEmail && privateKey) {
  credential = cert({
    projectId,
    clientEmail,
    privateKey: privateKey.replace(/\\n/g, '\n'),
  });
  console.log("[Firebase Helper] Initialized credential using client email and private key.");
}

const apps = getApps();
if (apps.length === 0) {
  try {
    const options = { projectId };
    if (credential) {
      options.credential = credential;
    }
    initializeApp(options);
    console.log("[Firebase Helper] Firebase Admin SDK initialized successfully for project:", projectId);
  } catch (err) {
    console.error("[Firebase Helper] Firebase Admin initialization failed:", err);
    throw err;
  }
}

const databaseId = process.env.FIREBASE_DATABASE_ID || process.env.VITE_FIREBASE_DATABASE_ID || "(default)";
const db = databaseId && databaseId !== "(default)"
  ? getFirestore(undefined, databaseId)
  : getFirestore();

const auth = getAuth();

// Legacy compatibility for code importing "admin" object
const adminCompat = {
  auth: () => auth,
  firestore: () => db,
};

export { db, auth, adminCompat as admin };
