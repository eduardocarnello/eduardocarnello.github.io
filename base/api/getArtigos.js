/*
 * /api/getArtigos
 * Busca os artigos com paginação.
 * Protegido por Token E Cargo (qualquer cargo logado).
 * CORRIGIDO: Removida a consulta de índice composto.
 * O filtro de categoria agora é feito no servidor (em JS).
 */
import { db, auth, getUserRole } from './firebaseAdmin.js'; // Importa o getUserRole

// Converte Timestamps do Firebase para JSON
function convertTimestamps(data) {
    if (data && typeof data === 'object') {
        // Verifica se é um Timestamp do Firestore (pode vir como _seconds ou seconds)
        const secondsKey = data.hasOwnProperty('_seconds') ? '_seconds' : 'seconds';
        const nanosKey = data.hasOwnProperty('_nanoseconds') ? '_nanoseconds' : 'nanoseconds';

        if (data.hasOwnProperty(secondsKey) && data.hasOwnProperty(nanosKey)) {
            return { seconds: data[secondsKey], nanoseconds: data[nanosKey] };
        }

        // Recursivamente para outros campos
        for (const key in data) {
            data[key] = convertTimestamps(data[key]);
        }
    }
    return data;
}

export default async function handler(req, res) {
    try {
        // 1. Validar o Token do usuário e obter o cargo (role)
        const token = req.headers.authorization?.split('Bearer ')[1];
        if (!token) {
            return res.status(401).json({ error: 'Nenhum token fornecido. Acesso não autorizado.' });
        }

        // USA A NOVA FUNÇÃO DE VERIFICAÇÃO DE CARGO
        const role = await getUserRole(token);
        if (!role) {
            // getUserRole já trata erros de token inválido/expirado
            return res.status(401).json({ error: 'Token inválido ou expirado. Faça login novamente.' });
        }
        // Se temos um cargo (Leitor, Redator, Editor, Admin), o usuário está autenticado.

        // 2. Buscar Dados
        const limit = parseInt(req.query.limit || 10, 10);
        const category = req.query.category; // Pega a categoria da URL

        // --- Lógica de busca (inalterada) ---
        let query = db.collection('artigos').orderBy('publishedAt', 'desc');
        const snapshot = await query.get();

        if (snapshot.empty) {
            return res.status(200).json([]);
        }

        const articles = [];
        snapshot.forEach(doc => {
            const article = doc.data();

            // 2. Filtramos a categoria AQUI (no JavaScript), se necessário
            const categoryMatch = (!category || category === 'TODOS' || article.categoryId === category);

            if (categoryMatch) {
                const { content, ...articleSummary } = article;
                const convertedData = convertTimestamps(articleSummary);
                articles.push({ id: doc.id, ...convertedData });
            }
        });

        // 3. Aplicamos o limite DEPOIS de filtrar
        const limitedArticles = articles.slice(0, limit);

        // 4. Retornar Dados
        return res.status(200).json(limitedArticles); // Retorna os artigos com limite

    } catch (error) {
        console.error('Erro em /api/getArtigos:', error);

        // Se o erro for de token (que o getUserRole pode lançar)
        if (error.code === 'auth/id-token-expired' || error.message.includes('Token')) {
            return res.status(401).json({ error: 'Token inválido ou expirado. Faça login novamente.' });
        }

        // O erro de índice não deve mais acontecer, mas mantemos o 'catch'
        if (error.code === 5) { // FAILED_PRECONDITION
            return res.status(500).json({
                error: 'Erro no servidor: O índice do Firestore provavelmente está sendo criado. Tente novamente em alguns minutos.'
            });
        }
        return res.status(500).json({ error: 'Erro interno do servidor ao buscar artigos.' });
    }
}

