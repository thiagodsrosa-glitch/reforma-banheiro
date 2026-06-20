require('dotenv').config()
const { Client, LocalAuth } = require('whatsapp-web.js')
const qrcode = require('qrcode-terminal')
const axios = require('axios')

const SITE_URL = process.env.SITE_URL ?? 'http://localhost:3000'
const BOT_API_KEY = process.env.WHATSAPP_BOT_API_KEY ?? ''
const GROUP_NAME = process.env.WHATSAPP_GROUP_NAME ?? 'Reforma Banheiro Igreja'

if (!BOT_API_KEY) {
  console.error('⚠️  WHATSAPP_BOT_API_KEY não definido no .env')
  process.exit(1)
}

const client = new Client({
  authStrategy: new LocalAuth({ clientId: 'reforma-bot' }),
  puppeteer: {
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  },
})

client.on('qr', (qr) => {
  console.log('\n📱 Escaneie o QR Code abaixo com o WhatsApp:\n')
  qrcode.generate(qr, { small: true })
  console.log('\n⚠️  Após escanear, aguarde a mensagem "✅ Bot conectado!"\n')
})

client.on('ready', async () => {
  console.log('✅ Bot conectado!')
  const chats = await client.getChats()
  const group = chats.find((c) => c.isGroup && c.name.includes(GROUP_NAME))
  if (group) {
    console.log(`📋 Monitorando grupo: "${group.name}"`)
  } else {
    console.log(`⚠️  Grupo "${GROUP_NAME}" não encontrado. Verifique o nome no .env`)
    console.log('Grupos disponíveis:', chats.filter((c) => c.isGroup).map((c) => c.name).join(', '))
  }
})

client.on('message', async (msg) => {
  if (msg.fromMe) return

  const chat = await msg.getChat()
  if (!chat.isGroup) return
  if (!chat.name.includes(GROUP_NAME)) return

  const contact = await msg.getContact()
  const sender = contact.pushname || contact.number || 'Desconhecido'

  let mediaUrl = null
  let msgType = 'text'

  if (msg.hasMedia) {
    msgType = msg.type
    // Note: for media, we store a placeholder. For production, upload to Cloudinary or similar.
    mediaUrl = null
  }

  try {
    await axios.post(
      `${SITE_URL}/api/whatsapp`,
      {
        sender,
        content: msg.body || `[${msg.type}]`,
        mediaUrl,
        msgType,
        sentAt: new Date(msg.timestamp * 1000).toISOString(),
      },
      {
        headers: { 'x-api-key': BOT_API_KEY },
      }
    )
    console.log(`💬 Mensagem salva de ${sender}: ${(msg.body || '[mídia]').slice(0, 60)}`)
  } catch (err) {
    console.error('❌ Erro ao salvar mensagem:', err?.response?.data ?? err.message)
  }
})

client.on('auth_failure', () => {
  console.error('❌ Falha na autenticação. Delete a pasta .wwebjs_auth e reinicie.')
})

client.on('disconnected', (reason) => {
  console.log('⚠️  Bot desconectado:', reason)
  setTimeout(() => {
    console.log('🔄 Reconectando...')
    client.initialize()
  }, 10000)
})

console.log('🚀 Iniciando bot WhatsApp...')
client.initialize()
