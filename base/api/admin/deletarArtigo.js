/*
 * /api/admin/deletarArtigo
 * Deleta um artigo.
 * ATUALIZADO P/ ETAPA 1: Usa o novo helper getUserRole e checa o cargo "Admin".
 */
import { db, getUserRole } from '../firebaseAdmin.js'; // Note o '../'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  try {
    const token = req.headers.authorization?.split('Bearer ')[1];
    if (!token) return res.status(401).json({ error: 'Nenhum token fornecido.' });

    // 1. Verifica o token e obtém o cargo do usuário
    const role = await getUserRole(token);

    // 2. Apenas "Admin" pode deletar
    if (role !== 'Admin') {
      return res.status(403).json({ error: 'Acesso negado. Apenas administradores podem deletar artigos.' });
    }

    const { id } = req.body;
    if (!id) {
      return res.status(400).json({ error: 'ID do artigo não fornecido.' });
    }

    await db.collection('artigos').doc(id).delete();

    return res.status(200).json({ message: 'Artigo deletado com sucesso.' });

  } catch (error) {
    console.error('Erro em /api/admin/deletarArtigo:', error);
    // O helper getUserRole já lida com 'auth/id-token-expired'
    return res.status(500).json({ error: error.message || 'Erro interno do servidor.' });
  }
}

