import * as admin from "firebase-admin";
import fs from "fs";
import path from "path";

if (!admin.apps.length) {
  try {
    const files = fs.readdirSync(process.cwd());
    const serviceAccountFile = files.find(f => f.includes("firebase-adminsdk") && f.endsWith(".json"));
    if (serviceAccountFile) {
      const serviceAccountPath = path.resolve(process.cwd(), serviceAccountFile);
      const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, "utf8"));
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: serviceAccount.project_id || "finforcing"
      });
      console.log(`Firebase Admin initialized using ${serviceAccountFile}`);
    } else if (process.env.FIREBASE_SERVICE_ACCOUNT) {
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: serviceAccount.project_id || "finforcing"
      });
      console.log("Firebase Admin initialized using FIREBASE_SERVICE_ACCOUNT env.");
    } else {
      admin.initializeApp({
        projectId: "finforcing"
      });
      console.log("Firebase Admin initialized in default mode.");
    }
  } catch (error) {
    console.warn("Firebase Admin initialization notice:", error);
  }
}

export const adminDb = admin.apps.length ? admin.firestore() : null;
export const adminAuth = admin.apps.length ? admin.auth() : null;
