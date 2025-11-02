/*
 * /api/searchArtigos
 * Busca em TODOS os artigos (incluindo conteúdo).
 * Protegido por Token E Cargo (qualquer cargo logado).
 * Filtra por 'categoryId' se ela for fornecida.
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

        for (const key in data) {
            data[key] = convertTimestamps(data[key]);
        }
    }
    return data;
}

// Função para remover HTML (para busca no conteúdo)
function stripHtml(html) {
    return html ? html.replace(/<[^>]*>?/gm, ' ').replace(/\s+/g, ' ') : '';
}

export default async function handler(req, res) {
    try {
        // 1. Validar o Token do usuário e obter o cargo
        const token = req.headers.authorization?.split('Bearer ')[1];
        if (!token) {
            return res.status(401).json({ error: 'Nenhum token fornecido.' });
        }

        // USA A NOVA FUNÇÃO DE VERIFICAÇÃO DE CARGO
        const role = await getUserRole(token);
        if (!role) {
            // getUserRole já trata erros de token inválido/expirado
            return res.status(401).json({ error: 'Token inválido ou expirado. Faça login novamente.' });
        }
        // Se temos um cargo, o usuário está autenticado e pode buscar.

        // 2. Obter Parâmetros de Busca
        const { term, scope, category } = req.query;

        if (!term) {
            return res.status(400).json({ error: 'Termo de busca é obrigatório.' });
        }

        const searchTerm = term.toLowerCase();

        // 3. Buscar TODOS os artigos (para busca em "content")
        const snapshot = await db.collection('artigos').orderBy('publishedAt', 'desc').get();

        if (snapshot.empty) {
            return res.status(200).json([]);
        }

        const searchResults = [];
        snapshot.forEach(doc => {
            const article = doc.data();

            // Verifica se a categoria bate (ou se é "TODOS")
            const categoryMatch = (category === 'TODOS' || !category || article.categoryId === category);

            // Se a categoria não bate, pulamos este artigo
            if (!categoryMatch) {
                return;
            }

            // Agora, verifica o texto da busca
            let textMatch = false;
            const title = article.title?.toLowerCase() || '';
            const summary = article.summary?.toLowerCase() || '';
            const content = stripHtml(article.content?.toLowerCase() || '');
            const tags = (article.tags || []).join(' ').toLowerCase();

            switch (scope) {
                case 'title':
                    textMatch = title.includes(searchTerm);
                    break;
                case 'summary':
                    textMatch = summary.includes(searchTerm);
                    break;
                case 'tags':
                    textMatch = tags.includes(searchTerm);
                    break;
                case 'content':
                    textMatch = content.includes(searchTerm);
                    break;
                case 'all':
                default:
                    textMatch = title.includes(searchTerm) ||
                        summary.includes(searchTerm) ||
                        content.includes(searchTerm) ||
                        tags.includes(searchTerm);
                    break;
            }

            // Se bateu o texto E a categoria, adiciona aos resultados
            if (textMatch) {
                const { content, ...articleSummary } = article;
                const convertedData = convertTimestamps(articleSummary);
                searchResults.push({ id: doc.id, ...convertedData });
            }
        });

        // 4. Retornar Dados
        return res.status(200).json(searchResults);

    } catch (error) {
        console.error('Erro em /api/searchArtigos:', error);
        // Se o erro for de token (que o getUserRole pode lançar)
        if (error.code === 'auth/id-token-expired' || error.message.includes('Token')) {
            return res.status(401).json({ error: 'Token inválido ou expirado. Faça login novamente.' });
        }
        return res.status(500).json({ error: 'Erro interno do servidor ao buscar artigos.' });
    }
}

