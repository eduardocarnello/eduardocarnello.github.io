import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';

let serviceAccount;
try {
    serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
} catch (e) {
    throw new Error("FIREBASE_SERVICE_ACCOUNT está faltando ou mal formatada nas variáveis de ambiente da Vercel.");
}

if (!getApps().length) {
    initializeApp({ credential: cert(serviceAccount) });
}

const db = getFirestore();
const auth = getAuth();
const SUPER_ADMIN_EMAIL = 'eduardocarnello@gmail.com';

export { db, auth, FieldValue, SUPER_ADMIN_EMAIL };
