/*
 * /api/admin/getUsers
 * Busca todos os usuários para o painel de "Gerenciar Usuários".
 * Protegido por Token E por Role (Admin).
 */
import { db, auth, getUserRole } from '../firebaseAdmin.js'; // Note o '../'

export default async function handler(req, res) {
    try {
        const token = req.headers.authorization?.split('Bearer ')[1];
        if (!token) return res.status(401).json({ error: 'Nenhum token fornecido.' });

        // 1. VERIFICA O CARGO (ROLE)
        const role = await getUserRole(token);
        if (role !== 'Admin') {
            return res.status(403).json({ error: 'Acesso negado. Você não tem permissão para ver usuários.' });
        }

        // 2. LÓGICA DA API
        const usersSnapshot = await db.collection('users').orderBy('email').get();

        const users = [];
        usersSnapshot.forEach(doc => {
            const data = doc.data();
            // Envia apenas os dados necessários para o painel
            users.push({
                uid: data.uid,
                email: data.email,
                role: data.role
            });
        });

        return res.status(200).json(users);

    } catch (error) {
        console.error('Erro em /api/admin/getUsers:', error);
        if (error.code === 'auth/id-token-expired') {
            return res.status(401).json({ error: 'Token expirado. Faça login novamente.' });
        }
        return res.status(500).json({ error: 'Erro interno do servidor.' });
    }
}
