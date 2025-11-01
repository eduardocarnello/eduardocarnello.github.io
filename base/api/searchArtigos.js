/*
 * /api/searchArtigos
 * Busca artigos no servidor, incluindo o "Conteúdo Completo".
 * Protegido por Token.
 */
import { db, auth } from './firebaseAdmin.js';

// Função para formatar o artigo para o front-end (remove conteúdo, converte datas)
function formatArticleForList(doc) {
    const data = doc.data();

    // Remove o conteúdo completo para não sobrecarregar a lista
    const { content, ...articleSummary } = data;

    // Converte Timestamps para um formato JSON compatível
    if (articleSummary.publishedAt) {
        articleSummary.publishedAt = {
            seconds: articleSummary.publishedAt._seconds,
            nanoseconds: articleSummary.publishedAt._nanoseconds
        };
        // Adiciona um campo ISO para facilitar a vida do front-end
        articleSummary.publishedAtISO = new Date(articleSummary.publishedAt.seconds * 1000).toISOString();
    }
    if (articleSummary.createdAt) {
        articleSummary.createdAt = {
            seconds: articleSummary.createdAt._seconds,
            nanoseconds: articleSummary.createdAt._nanoseconds
        };
    }
    if (articleSummary.updatedAt) {
        articleSummary.updatedAt = {
            seconds: articleSummary.updatedAt._seconds,
            nanoseconds: articleSummary.updatedAt._nanoseconds
        };
    }

    return { id: doc.id, ...articleSummary };
}

export default async function handler(req, res) {
    try {
        // 1. Validar o Token do usuário (copiado de getArtigos)
        const token = req.headers.authorization?.split('Bearer ')[1];
        if (!token) {
            return res.status(401).json({ error: 'Nenhum token fornecido. Acesso não autorizado.' });
        }
        await auth.verifyIdToken(token);

        // 2. Obter parâmetros da busca
        const { term, scope = 'all', category = 'TODOS' } = req.query;

        if (!term) {
            return res.status(400).json({ error: 'Nenhum termo de busca fornecido.' });
        }

        const searchTerm = term.toLowerCase().trim();

        // Lógica de busca (com "E" e "Termo Exato")
        const searchTerms = [];
        const exactTerms = [];

        searchTerm.replace(/"([^"]+)"/g, (match, exactTerm) => {
            exactTerms.push(exactTerm);
            return '';
        })
            .split(/\s+/)
            .forEach(t => {
                if (t) searchTerms.push(t);
            });

        // 3. Buscar Dados no Firestore
        // Primeiro, filtramos por categoria (se não for "TODOS")
        // Isso é eficiente e reduz o número de documentos que precisamos processar
        let query = db.collection('artigos');
        if (category !== 'TODOS') {
            query = query.where('categoryId', '==', category);
        }

        const snapshot = await query.get();

        if (snapshot.empty) {
            return res.status(200).json([]);
        }

        // 4. Filtrar em "memória" no servidor (para buscar no conteúdo completo)

        const matchedArticles = [];

        snapshot.forEach(doc => {
            const article = doc.data();

            // Define o texto onde a busca será realizada
            const title = (article.title || '').toLowerCase();
            const summary = (article.summary || '').toLowerCase();
            const tags = (article.tags || []).join(' ').toLowerCase();
            // REMOVE HTML do conteúdo completo antes de buscar
            const content = (article.content || '').replace(/<[^>]+>/g, ' ').toLowerCase();

            let targetText = '';
            if (scope === 'all') targetText = `${title} ${summary} ${tags} ${content}`;
            if (scope === 'title') targetText = title;
            if (scope === 'summary') targetText = summary;
            if (scope === 'tags') targetText = tags;
            if (scope === 'content') targetText = content; // A NOVA OPÇÃO!

            // Checa todos os termos (lógica "E")
            const hasAllTerms = searchTerms.every(t => targetText.includes(t));
            // Checa todos os termos exatos (lógica "E")
            const hasAllExactTerms = exactTerms.every(t => targetText.includes(t));

            if (hasAllTerms && hasAllExactTerms) {
                matchedArticles.push(formatArticleForList(doc));
            }
        });

        // 5. Ordenar e Retornar
        // (A API de busca não suporta paginação, então ordenamos aqui)
        matchedArticles.sort((a, b) =>
            (b.publishedAt?.seconds || 0) - (a.publishedAt?.seconds || 0)
        );

        return res.status(200).json(matchedArticles);

    } catch (error) {
        console.error('Erro em /api/searchArtigos:', error);
        if (error.code === 'auth/id-token-expired') {
            return res.status(401).json({ error: 'Token expirado. Faça login novamente.' });
        }
        return res.status(500).json({ error: 'Erro interno do servidor ao buscar artigos.' });
    }
}

