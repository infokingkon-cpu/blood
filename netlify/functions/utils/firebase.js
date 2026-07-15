import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import admin from "firebase-admin";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function getFirebaseConfig() {
  const possiblePaths = [
    path.resolve(process.cwd(), "firebase-applet-config.json"),
    path.resolve(__dirname, "../../../firebase-applet-config.json"),
    path.resolve(__dirname, "../../firebase-applet-config.json"),
    path.resolve(__dirname, "../firebase-applet-config.json"),
    path.resolve(__dirname, "firebase-applet-config.json")
  ];

  for (const configPath of possiblePaths) {
    if (fs.existsSync(configPath)) {
      try {
        const config = JSON.parse(fs.readFileSync(configPath, "utf-8"));
        if (config && config.projectId) {
          return config;
        }
      } catch (err) {
        console.error("[Firebase Helper] Error reading config at", configPath, err);
      }
    }
  }

  // Fallback to Env variables
  const config = {
    apiKey: process.env.VITE_FIREBASE_API_KEY || process.env.FIREBASE_API_KEY,
    authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN || process.env.FIREBASE_AUTH_DOMAIN,
    projectId: process.env.VITE_FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID,
    storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET || process.env.FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID || process.env.FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.VITE_FIREBASE_APP_ID || process.env.FIREBASE_APP_ID,
    firestoreDatabaseId: process.env.VITE_FIREBASE_DATABASE_ID || process.env.FIREBASE_DATABASE_ID || "(default)"
  };

  if (config.projectId) {
    return config;
  }
  return null;
}

export function initFirebase() {
  const config = getFirebaseConfig();
  if (!config) {
    console.error("[Firebase Helper] No Firebase configuration found in any path or env!");
    throw new Error("Firebase configuration not found. Please set VITE_FIREBASE_PROJECT_ID etc.");
  }

  let app;
  if (getApps().length === 0) {
    app = initializeApp(config);
  } else {
    app = getApp();
  }

  const db = getFirestore(app, config.firestoreDatabaseId);

  // Init Firebase Admin SDK
  if (admin.apps.length === 0) {
    try {
      admin.initializeApp({
        projectId: config.projectId,
      });
      console.log("[Firebase Helper] Firebase Admin initialized with project:", config.projectId);
    } catch (adminErr) {
      console.error("[Firebase Helper] Error initializing Firebase Admin:", adminErr);
    }
  }

  return { app, db, admin };
}
