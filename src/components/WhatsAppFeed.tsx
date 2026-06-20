'use client'

import { useState } from 'react'

interface Message {
  id: string
  sender: string
  content: string
  mediaUrl: string | null
  msgType: string
  processed: boolean
  sentAt: Date
}

export default function WhatsAppFeed({ messages: initial }: { messages: Message[] }) {
  const [messages, setMessages] = useState(initial)
  const [filter, setFilter] = useState<'all' | 'unprocessed'>('all')

  const displayed = filter === 'all' ? messages : messages.filter((m) => !m.processed)

  async function markProcessed(id: string) {
    setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, processed: true } : m)))
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mensagens do WhatsApp</h1>
          <p className="text-gray-500 text-sm mt-1">
            {messages.filter((m) => !m.processed).length} não processada(s) de {messages.length}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              filter === 'all'
                ? 'bg-blue-600 text-white'
                : 'border border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            Todas
          </button>
          <button
            onClick={() => setFilter('unprocessed')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              filter === 'unprocessed'
                ? 'bg-blue-600 text-white'
                : 'border border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            Não processadas
          </button>
        </div>
      </div>

      <div className="space-y-3">
        {displayed.map((msg) => (
          <div
            key={msg.id}
            className={`bg-white rounded-xl border p-4 ${
              msg.processed ? 'border-gray-100' : 'border-green-200'
            }`}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-7 h-7 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-green-700 text-xs font-bold">
                      {msg.sender.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <span className="font-medium text-sm text-gray-900">{msg.sender}</span>
                  <span className="text-xs text-gray-400">
                    {new Date(msg.sentAt).toLocaleString('pt-BR')}
                  </span>
                  {!msg.processed && (
                    <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full font-medium">
                      Novo
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{msg.content}</p>
                {msg.mediaUrl && (
                  <a
                    href={msg.mediaUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 mt-2 text-xs text-blue-600 hover:underline"
                  >
                    📎 Ver arquivo anexado
                  </a>
                )}
              </div>
              {!msg.processed && (
                <button
                  onClick={() => markProcessed(msg.id)}
                  className="text-xs px-3 py-1.5 border border-gray-200 rounded-lg text-gray-500 hover:bg-gray-50 flex-shrink-0"
                >
                  Marcar como lido
                </button>
              )}
            </div>
          </div>
        ))}
        {displayed.length === 0 && (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <p className="text-gray-400 text-sm">Nenhuma mensagem encontrada.</p>
            <p className="text-gray-300 text-xs mt-2">
              O bot do WhatsApp irá enviar mensagens do grupo automaticamente.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
