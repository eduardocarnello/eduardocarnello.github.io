/*
 * /api/admin/salvarCategoria
 * Cria ou atualiza uma categoria.
 * Protegido por Token E por lista de Admin.
 */
import { db, auth } from '../firebaseAdmin.js'; // Note o '../'

// Lista de e-mails de administradores
const ADMIN_EMAILS = ['eduardocarnello@gmail.com', 'mariliajec@tjsp.jus.br'];

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Método não permitido' });
    }

    try {
        const token = req.headers.authorization?.split('Bearer ')[1];
        if (!token) return res.status(401).json({ error: 'Nenhum token fornecido.' });

        const decodedToken = await auth.verifyIdToken(token);
        if (!ADMIN_EMAILS.includes(decodedToken.email)) {
            return res.status(403).json({ error: 'Acesso negado. Você não é um administrador.' });
        }

        const { id, ...categoryData } = req.body;

        if (id) {
            // Atualizar
            const catRef = db.collection('categorias').doc(id);
            await catRef.set(categoryData);
            return res.status(200).json({ message: 'Categoria atualizada com sucesso!' });
        } else {
            // Criar
            const newDoc = await db.collection('categorias').add(categoryData);
            return res.status(201).json({ message: 'Categoria salva com sucesso!', id: newDoc.id });
        }

    } catch (error) {
        console.error('Erro em /api/admin/salvarCategoria:', error);
        if (error.code === 'auth/id-token-expired') {
            return res.status(401).json({ error: 'Token expirado. Faça login novamente.' });
        }
        return res.status(500).json({ error: 'Erro interno do servidor.' });
    }
}
