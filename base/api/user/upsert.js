/*
 * /api/user/upsert
 * Chamado em CADA login (front-end e admin)
 * Garante que o usuário exista no DB 'users' e retorna seu cargo.
 * Cria o usuário como "Leitor" se ele não existir (ou "Admin" se for o super admin).
 */
import { db, auth, getUserRole } from '../firebaseAdmin.js';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Método não permitido' });
    }

    try {
        // 1. Validar o Token do usuário
        const token = req.headers.authorization?.split('Bearer ')[1];
        if (!token) {
            return res.status(401).json({ error: 'Nenhum token fornecido.' });
        }

        // 2. Usar a função centralizada para obter/criar o usuário e seu cargo
        const role = await getUserRole(token);

        // 3. Retorna o cargo e o e-mail (para exibição na UI)
        // Precisamos decodificar o token de novo aqui para pegar o e-mail
        // (Não podemos passar o e-mail do getUserRole por questões de escopo seguro)
        const decodedToken = await auth.verifyIdToken(token);

        return res.status(200).json({
            role: role,
            email: decodedToken.email
        });

    } catch (error) {
        console.error('Erro em /api/user/upsert:', error);
        if (error.code === 'auth/id-token-expired' || error.message.includes('Token')) {
            return res.status(401).json({ error: 'Token inválido ou expirado. Faça login novamente.' });
        }
        return res.status(500).json({ error: 'Erro interno do servidor ao verificar usuário.' });
    }
}

