/*
 * firebaseAdmin.js
 * Inicializa o Admin SDK do Firebase para uso no back-end (Serverless Functions)
 * E exporta a nova função de verificação de cargo (Role).
 */
import { initializeApp, cert, getApps } from 'firebase-admin/app';
// IMPORTAÇÃO CORRIGIDA: Timestamp e FieldValue vêm de 'firebase-admin/firestore'
import { getFirestore, Timestamp, FieldValue } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';

// Pega a Chave de Serviço da variável de ambiente VERCEL
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

// Inicializa o app Firebase (só se não foi inicializado ainda)
if (!getApps().length) {
    initializeApp({
        credential: cert(serviceAccount)
    });
}

const db = getFirestore();
const auth = getAuth();

// E-mail do "Super Admin"
const SUPER_ADMIN_EMAIL = 'eduardocarnello@gmail.com';

/**
 * NOVO: Centraliza a lógica de verificação de usuário e cargo.
 * 1. Verifica se o token é válido.
 * 2. Busca o usuário no Firebase Auth.
 * 3. Busca o perfil do usuário na coleção 'users' do Firestore.
 * 4. Se não existir, cria um perfil 'Leitor' (ou 'Admin' se for o SUPER_ADMIN).
 * 5. Retorna o cargo (role) do usuário.
 */
async function getUserRole(token) {
    try {
        // 1. Verifica o token
        const decodedToken = await auth.verifyIdToken(token);
        const uid = decodedToken.uid;
        const email = decodedToken.email;

        // 2. Busca o perfil no Firestore
        const userRef = db.collection('users').doc(uid);
        const userSnap = await userRef.get();

        if (userSnap.exists) {
            // 3. Usuário existe, retorna o cargo
            return userSnap.data().role;
        } else {
            // 4. Usuário NÃO existe no Firestore, precisamos criar

            // Determina o cargo do novo usuário
            const newRole = (email === SUPER_ADMIN_EMAIL) ? 'Admin' : 'Leitor';

            const newUserProfile = {
                email: email,
                role: newRole,
                // CORREÇÃO: Usa o 'FieldValue' importado diretamente
                createdAt: FieldValue.serverTimestamp()
            };

            // Cria o novo perfil
            await userRef.set(newUserProfile);
            console.log(`Novo perfil criado para ${email} com cargo: ${newRole}`);

            // 5. Retorna o novo cargo
            return newRole;
        }
    } catch (error) {
        console.error("Erro em getUserRole:", error.code, error.message);
        // Lança o erro para que a API que o chamou possa tratá-lo (ex: 401)
        throw error;
    }
}

// CORREÇÃO: Exporta os módulos 'Timestamp' e 'FieldValue'
export { db, auth, Timestamp, FieldValue, getUserRole };

