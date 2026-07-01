const ZAPI_BASE = `https://api.z-api.io/instances/${process.env.ZAPI_INSTANCE}/token/${process.env.ZAPI_TOKEN}`

export async function enviarMensagemGrupo(texto: string): Promise<boolean> {
  const groupPhone = process.env.ZAPI_GROUP_PHONE
  if (!process.env.ZAPI_INSTANCE || !process.env.ZAPI_TOKEN || !groupPhone) return false

  try {
    const res = await fetch(`${ZAPI_BASE}/send-text`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: groupPhone, message: texto }),
    })
    return res.ok
  } catch {
    return false
  }
}
