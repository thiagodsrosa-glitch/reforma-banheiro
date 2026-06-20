import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const SYSTEM_PROMPT = `Você é um assistente que analisa mensagens de um grupo de WhatsApp sobre a REFORMA DO BANHEIRO MASCULINO da Igreja Matriz.

PESSOAS-CHAVE:
- Felipe: Presidente e autorizador principal. Quando ele aprova no grupo, é uma autorização oficial.
- Hyanna: Esposa de Felipe, também autoriza compras e serviços.
- Tesouraria: Executa pagamentos após autorização.

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

REGRAS:
- Se a mensagem mencionar um preço/valor E um produto/serviço, é um orçamento.
- Se a mensagem diz que já foi pago ou comprado, é um gasto/pagamento realizado.
- Se Felipe ou Hyanna disser "pode comprar", "aprovado", "ok", "confirma" → é uma autorização.
- Para gastos, o valor é o que foi EFETIVAMENTE PAGO.
- Para orçamentos, o valor é a PROPOSTA recebida.
- Se mencionar progresso de uma etapa (ex: "acabamos a demolição"), é uma atualização de etapa.
- Identifique a etapa mais provável com base no conteúdo (ex: "azulejo" → Revestimentos, "encanamento" → Hidráulica).`

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
