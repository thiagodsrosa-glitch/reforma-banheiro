import OpenAI from 'openai'

// Cliente criado apenas em tempo de execução (não no build)
function getClient() {
  if (!process.env.OPENAI_API_KEY) return null
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
}

export async function transcribeAudio(audioUrl: string): Promise<string | null> {
  const openai = getClient()
  if (!openai) return null
  try {
    const response = await fetch(audioUrl)
    if (!response.ok) return null
    const buffer = await response.arrayBuffer()

    // WhatsApp envia áudio como OGG/OPUS — Whisper suporta ambos
    const blob = new Blob([buffer], { type: 'audio/ogg' })
    const file = new File([blob], 'audio.ogg', { type: 'audio/ogg' })

    const transcription = await openai.audio.transcriptions.create({
      file,
      model: 'whisper-1',
      language: 'pt',
    })

    return transcription.text || null
  } catch (err) {
    console.error('[Whisper] Erro ao transcrever áudio:', err)
    return null
  }
}
