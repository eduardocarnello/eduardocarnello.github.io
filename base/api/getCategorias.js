/*
 * /api/getCategorias
 * Busca todas as categorias.
 * Protegido por Token.
 * CORRIGIDO: Removida a ordenação (orderBy) da consulta para
 * evitar o Erro 500 de índice. A ordenação é feita no JS.
 */
import { db, auth, getUserRole } from './firebaseAdmin.js';

export default async function handler(req, res) {
    try {
        // 1. Validar o Token do usuário
        const token = req.headers.authorization?.split('Bearer ')[1];
        if (!token) {
            return res.status(401).json({ error: 'Nenhum token fornecido.' });
        }

        // Verifica o cargo (qualquer cargo logado pode ler)
        const role = await getUserRole(token);
        if (!role) {
            return res.status(401).json({ error: 'Token inválido ou expirado. Faça login novamente.' });
        }

        // --- INÍCIO DA CORREÇÃO ---
        // 2. Buscar Dados (SEM ORDENAÇÃO)
        const snapshot = await db.collection('categorias').get();

        if (snapshot.empty) {
            return res.status(200).json([]);
        }

        const categories = [];
        snapshot.forEach(doc => {
            categories.push({ id: doc.id, ...doc.data() });
        });

        // 3. Ordenar AQUI (no JavaScript) em vez de no Firestore
        categories.sort((a, b) => a.name.localeCompare(b.name));
        // --- FIM DA CORREÇÃO ---

        // 4. Retornar Dados
        return res.status(200).json(categories);

    } catch (error) {
        console.error('Erro em /api/getCategorias:', error);
        if (error.code === 'auth/id-token-expired' || error.message.includes('Token')) {
            return res.status(401).json({ error: 'Token expirado. Faça login novamente.' });
        }
        return res.status(500).json({ error: 'Erro interno do servidor.' });
    }
}

