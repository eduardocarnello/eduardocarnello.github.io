/*
 * /api/admin/salvarCategoria
 * Salva (cria ou atualiza) uma categoria.
 * Protegido por Token E por Role (Admin).
 */
import { db, auth, getUserRole } from '../firebaseAdmin.js'; // Note o '../'

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
            return res.status(403).json({ error: 'Acesso negado. Você não tem permissão para gerenciar categorias.' });
        }

        // 2. LÓGICA DA API
        const { id, name, color, icon, slug } = req.body;

        if (!name || !color || !icon || !slug) {
            return res.status(400).json({ error: 'Campos obrigatórios ausentes.' });
        }

        const categoryData = { name, color, icon, slug };

        if (id) {
            // Atualizar
            const catRef = db.collection('categorias').doc(id);
            await catRef.set(categoryData, { merge: true });
            return res.status(200).json({ message: 'Categoria atualizada com sucesso.' });
        } else {
            // Criar
            const docRef = await db.collection('categorias').add(categoryData);
            return res.status(201).json({ message: 'Categoria criada com sucesso.', id: docRef.id });
        }

    } catch (error) {
        console.error('Erro em /api/admin/salvarCategoria:', error);
        if (error.code === 'auth/id-token-expired') {
            return res.status(401).json({ error: 'Token expirado. Faça login novamente.' });
        }
        return res.status(500).json({ error: 'Erro interno do servidor.' });
    }
}

