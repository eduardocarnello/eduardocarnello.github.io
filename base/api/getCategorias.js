/*
 * /api/getCategorias
 * Busca todas as categorias.
 * Protegido por Token.
 * ATUALIZADO P/ ETAPA 1: Usa o novo helper getUserRole.
 */
import { db, getUserRole } from '../firebaseAdmin.js'; // Caminho atualizado para ../

export default async function handler(req, res) {
    try {
        // 1. Validar o Token e o Cargo do usuário
        const token = req.headers.authorization?.split('Bearer ')[1];
        if (!token) {
            return res.status(401).json({ error: 'Nenhum token fornecido.' });
        }

        // Usa o novo helper. Isso também garante que o usuário existe na coleção 'users'.
        // Qualquer cargo logado (Leitor, Redator, etc.) pode ler categorias.
        const role = await getUserRole(token);

        if (!role) {
            // getUserRole já tratou o erro, mas por via das dúvidas
            return res.status(401).json({ error: 'Usuário não autenticado ou token inválido.' });
        }

        // 2. Buscar Dados
        const snapshot = await db.collection('categorias').orderBy('name').get();

        if (snapshot.empty) {
            return res.status(200).json([]);
        }

        const categories = [];
        snapshot.forEach(doc => {
            categories.push({ id: doc.id, ...doc.data() });
        });

        // 3. Retornar Dados
        return res.status(200).json(categories);

    } catch (error) {
        console.error('Erro em /api/getCategorias:', error);
        // O helper getUserRole já lida com 'auth/id-token-expired'
        return res.status(500).json({ error: error.message || 'Erro interno do servidor.' });
    }
}

