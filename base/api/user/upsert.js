/*
 * /api/user/upsert
 * Chamado no login (onAuthStateChanged).
 * Verifica se o usuário existe na coleção 'users'.
 * Se não, o cria com o cargo padrão ('Leitor'),
 * A MENOS que seja o e-mail do admin principal.
 */
import { db, auth, ADMIN_EMAILS } from '../firebaseAdmin.js'; // Note o '../'

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Método não permitido' });
    }

    try {
        const token = req.headers.authorization?.split('Bearer ')[1];
        if (!token) return res.status(401).json({ error: 'Nenhum token fornecido.' });

        const decodedToken = await auth.verifyIdToken(token);
        const { uid, email } = decodedToken;

        const userRef = db.collection('users').doc(uid);
        const userDoc = await userRef.get();

        if (userDoc.exists) {
            // Usuário já existe, apenas retorna os dados
            return res.status(200).json(userDoc.data());
        } else {
            // Usuário NÃO existe, precisamos criá-lo

            // Lógica do Primeiro Admin:
            // Verifica se é o primeiro login de um dos e-mails de admin
            const role = ADMIN_EMAILS.includes(email) ? 'Admin' : 'Leitor';

            const newUserData = {
                uid: uid,
                email: email,
                role: role,
                createdAt: admin.firestore.FieldValue.serverTimestamp()
            };

            await userRef.set(newUserData);

            return res.status(201).json(newUserData); // Retorna o novo usuário
        }

    } catch (error) {
        console.error('Erro em /api/user/upsert:', error);
        if (error.code === 'auth/id-token-expired') {
            return res.status(401).json({ error: 'Token expirado. Faça login novamente.' });
        }
        return res.status(500).json({ error: 'Erro interno do servidor.' });
    }
}
