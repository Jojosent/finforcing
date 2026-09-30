import * as admin from "firebase-admin";
import { getFirestore, Firestore } from "firebase-admin/firestore";
import { getAuth, Auth } from "firebase-admin/auth";
import fs from "fs";
import path from "path";

let adminApp: admin.app.App | null = null;
let firestoreDb: Firestore | null = null;
let firebaseAuth: Auth | null = null;

try {
  if (!admin.getApps().length) {
    const files = fs.readdirSync(process.cwd());
    const serviceAccountFile = files.find(
      (f) => f.includes("firebase-adminsdk") && f.endsWith(".json")
    );

    if (serviceAccountFile) {
      const serviceAccountPath = path.resolve(process.cwd(), serviceAccountFile);
      const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, "utf8"));
      adminApp = admin.initializeApp({
        credential: admin.cert(serviceAccount),
        projectId: serviceAccount.project_id || "finforcing"
      });
      console.log(`[Firebase Admin] Initialized with credentials from ${serviceAccountFile}`);
    } else if (process.env.FIREBASE_SERVICE_ACCOUNT) {
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
      adminApp = admin.initializeApp({
        credential: admin.cert(serviceAccount),
        projectId: serviceAccount.project_id || "finforcing"
      });
      console.log("[Firebase Admin] Initialized with FIREBASE_SERVICE_ACCOUNT environment variable.");
    } else {
      adminApp = admin.initializeApp({
        projectId: "finforcing"
      });
      console.log("[Firebase Admin] Initialized in default project mode.");
    }
  } else {
    adminApp = admin.getApp();
  }

  if (adminApp) {
    firestoreDb = getFirestore(adminApp);
    firebaseAuth = getAuth(adminApp);
  }
} catch (error) {
  console.warn("[Firebase Admin] Warning during initialization:", error);
}

export const adminDb = firestoreDb;
export const adminAuth = firebaseAuth;
