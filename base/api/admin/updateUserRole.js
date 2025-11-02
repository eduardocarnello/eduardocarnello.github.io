/*
 * /api/admin/updateUserRole
 * Atualiza o cargo (role) de um usuário.
 * Protegido por Token E por Role (Admin).
 */
import { db, auth, getUserRole } from '../firebaseAdmin.js'; // Note o '../'

const VALID_ROLES = ['Leitor', 'Redator', 'Editor', 'Admin'];

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Método não permitido' });
    }

    try {
        const token = req.headers.authorization?.split('Bearer ')[1];
        if (!token) return res.status(401).json({ error: 'Nenhum token fornecido.' });

        // 1. VERIFICA O CARGO (ROLE)
        const role = await getUserRole(token);
        if (role !== 'Admin') {
            return res.status(403).json({ error: 'Acesso negado. Você não tem permissão para mudar cargos.' });
        }

        // 2. LÓGICA DA API
        const { uid, newRole } = req.body;

        if (!uid || !newRole) {
            return res.status(400).json({ error: 'UID do usuário e novo cargo (newRole) são obrigatórios.' });
        }

        if (!VALID_ROLES.includes(newRole)) {
            return res.status(400).json({ error: 'Cargo inválido.' });
        }

        const userRef = db.collection('users').doc(uid);
        await userRef.update({
            role: newRole
        });

        return res.status(200).json({ message: 'Cargo do usuário atualizado com sucesso.' });

    } catch (error) {
        console.error('Erro em /api/admin/updateUserRole:', error);
        if (error.code === 'auth/id-token-expired') {
            return res.status(401).json({ error: 'Token expirado. Faça login novamente.' });
        }
        return res.status(500).json({ error: 'Erro interno do servidor.' });
    }
}
