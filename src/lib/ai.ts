import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const SYSTEM_PROMPT = `Você é um assistente que analisa mensagens de um grupo de WhatsApp da Igreja Matriz relacionadas à REFORMA e às atividades do período da obra.

O grupo trata da reforma do banheiro masculino, MAS TAMBÉM inclui despesas e autorizações relacionadas ao período da obra: aluguel de banheiros químicos, materiais de apoio, serviços temporários, convenções, pagamentos de fornecedores, etc. QUALQUER valor, autorização ou pagamento mencionado é relevante.

PESSOAS-CHAVE:
- Felipe (Pr. Felipe): Presidente executivo e autorizador principal.
- Hyanna (Pra. Hyanna): Esposa de Felipe, também autoriza.
- Pr. Caio / Secretário-Geral: Solicita autorizações em nome da diretoria.
- Tesouraria / Tesoureiro: Executa pagamentos após autorização.
- Qualquer menção a "o presidente autorizou" ou "peço autorização" é um pedido/confirmação de pagamento.

ETAPAS DA REFORMA (em ordem — cada etapa depende das anteriores):
1. Planejamento e Projeto
2. Demolição
3. Impermeabilização
4. Hidráulica (precisa que a Demolição e Impermeabilização estejam prontas)
5. Elétrica (precisa que a Demolição esteja pronta)
6. Revestimentos (precisa que Hidráulica, Elétrica e Impermeabilização estejam prontas)
7. Louças e Metais (precisa que Revestimentos estejam prontos)
8. Pintura e Acabamento (última etapa — depois de Revestimentos e Louças)

CATEGORIAS DISPONÍVEIS: Material, Mão de obra, Equipamento, Hidráulica, Elétrica, Revestimento, Pintura, Outro

REGRAS IMPORTANTES:
- Se a mensagem mencionar QUALQUER valor em reais (R$, diária, total) + produto/serviço → é orçamento ou gasto.
- "Peço autorização para pagamento" + valor → é um orçamento com status PENDING.
- "O presidente autorizou" → confirma autorização (status APPROVED).
- Se Felipe ou Hyanna disserem "ok", "aprovado", "pode pagar", "autorizado" → status APPROVED.
- Aluguel de banheiros químicos, equipamentos temporários, serviços de apoio → são gastos/orçamentos válidos, categoria "Outro".
- Se mencionar CPF, banco, pix, chave → é dado de pagamento (registrar junto com o orçamento/gasto).
- Se mencionar progresso, conclusão ou início de uma etapa → é atualização de etapa.
- Identifique a etapa mais provável: azulejo/revestimento → Revestimentos; encanamento/hidráulica → Hidráulica; elétrica → Elétrica; pintura → Pintura e Acabamento; banheiro químico → null (não é etapa da reforma).
- NUNCA retorne tipo "outro" se houver um valor monetário na mensagem. Valores = sempre orcamento ou gasto.
- Confiança mínima para registrar: 0.4 (seja generoso — é melhor registrar e revisar depois).`

export interface AIAnalysis {
  tipo: 'orcamento' | 'gasto' | 'atualizacao_etapa' | 'autorizacao' | 'pagamento' | 'outro'
  etapa: string | null
  fornecedor: string | null
  valor: number | null
  descricao: string
  categoria: string | null
  autorizado_por: string | null
  status_orcamento: 'APPROVED' | 'REJECTED' | 'PENDING' | null
  confianca: number
  resumo: string
}

interface MessageInput {
  sender: string
  content: string
  imageUrl?: string | null
  pdfUrl?: string | null
}

export async function analyzeWhatsAppMessage(msg: MessageInput): Promise<AIAnalysis | null> {
  try {
    const userContent: Anthropic.MessageParam['content'] = []

    // Add image if present
    if (msg.imageUrl) {
      userContent.push({
        type: 'image',
        source: { type: 'url', url: msg.imageUrl },
      })
    }

    // Add PDF if present (as URL document)
    if (msg.pdfUrl) {
      userContent.push({
        type: 'document',
        source: { type: 'url', url: msg.pdfUrl },
      } as Anthropic.DocumentBlockParam)
    }

    const mediaNote = msg.imageUrl
      ? '\n[IMAGEM ANEXADA — analise o conteúdo visual para extrair valores, itens, etc.]'
      : msg.pdfUrl
      ? '\n[PDF ANEXADO — analise o documento para extrair orçamentos, notas fiscais, etc.]'
      : ''

    userContent.push({
      type: 'text',
      text: `Analise esta mensagem do grupo de reforma do banheiro e extraia informações estruturadas.

REMETENTE: ${msg.sender}
MENSAGEM: ${msg.content}${mediaNote}

Responda APENAS com um JSON válido (sem markdown, sem explicação antes ou depois):
{
  "tipo": "orcamento" | "gasto" | "atualizacao_etapa" | "autorizacao" | "pagamento" | "outro",
  "etapa": "nome exato de uma das 8 etapas ou null",
  "fornecedor": "nome do fornecedor/empresa ou null",
  "valor": número sem R$ ou null,
  "descricao": "descrição clara do que foi identificado",
  "categoria": "uma das categorias disponíveis ou null",
  "autorizado_por": "Felipe ou Hyanna ou null",
  "status_orcamento": "APPROVED" | "REJECTED" | "PENDING" | null,
  "confianca": número entre 0 e 1,
  "resumo": "1-2 frases explicando o que foi identificado"
}`,
    })

    const response = await anthropic.messages.create({
      model: 'claude-opus-4-8',
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userContent }],
    })

    const text = response.content.find((b) => b.type === 'text')?.text ?? ''
    const json = text.match(/\{[\s\S]*\}/)?.[0]
    if (!json) return null

    return JSON.parse(json) as AIAnalysis
  } catch (err) {
    console.error('[AI] Erro ao analisar mensagem:', err)
    return null
  }
}
