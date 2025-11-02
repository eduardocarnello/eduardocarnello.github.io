/*
 * /api/firebaseAdmin.js
 * Inicializa o Admin SDK do Firebase e exporta
 * as instâncias e a nova função de verificação de Cargo (Role).
 */
import admin from 'firebase-admin';

// Lista de e-mails de administradores
// USADO APENAS PARA CRIAR O PRIMEIRO ADMIN
const ADMIN_EMAILS = ['eduardocarnello@gmail.com', 'mariliajec@tjsp.jus.br'];

// Pega a Chave de Serviço da Vercel (Variável de Ambiente)
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

// Inicializa o app do Firebase Admin (apenas uma vez)
if (!admin.apps.length) {
    try {
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount)
        });
    } catch (error) {
        console.error('Falha ao inicializar o Firebase Admin SDK:', error);
    }
}

const db = admin.firestore();
const auth = admin.auth();

/**
 * Verifica o token de um usuário e retorna seu cargo (role) do Firestore.
 * @param {string} token - O Firebase ID Token do usuário.
 * @returns {Promise<string>} O cargo do usuário (ex: 'Leitor', 'Admin').
 */
async function getUserRole(token) {
    if (!token) {
        throw new Error('Nenhum token fornecido.');
    }

    let decodedToken;
    try {
        decodedToken = await auth.verifyIdToken(token);
    } catch (error) {
        console.error("Token inválido ou expirado:", error);
        throw new Error('Token inválido ou expirado.');
    }

    const uid = decodedToken.uid;
    const userDoc = await db.collection('users').doc(uid).get();

    if (!userDoc.exists) {
        console.warn(`Usuário com UID ${uid} não encontrado na coleção 'users'.`);
        // Isso não deveria acontecer se o upsert funcionar, mas é uma segurança
        return 'Leitor';
    }

    return userDoc.data().role || 'Leitor';
}


export { db, auth, admin, getUserRole, ADMIN_EMAILS };

