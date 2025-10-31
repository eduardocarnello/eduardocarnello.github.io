/*
 * Este arquivo inicializa o Firebase Admin SDK.
 * Ele usa a variável de ambiente FIREBASE_SERVICE_ACCOUNT que você vai configurar na Vercel.
 */
import admin from 'firebase-admin';

// Checa se já foi inicializado para evitar erros (acontece em ambiente serverless)
if (!admin.apps.length) {
    try {
        admin.initializeApp({
            credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT))
        });
    } catch (error) {
        console.error('Falha ao inicializar Firebase Admin SDK:', error);
    }
}

const db = admin.firestore();
const auth = admin.auth();

export { db, auth, admin };
