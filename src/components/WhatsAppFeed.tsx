'use client'

import { useState } from 'react'
import { normalizeSender } from '@/lib/names'

interface Message {
  id: string
  sender: string
  content: string
  mediaUrl: string | null
  msgType: string
  processed: boolean
  sentAt: string
}

export default function WhatsAppFeed({ messages: initial }: { messages: Message[] }) {
  const [messages, setMessages] = useState(initial)
  const [filter, setFilter] = useState<'all' | 'unprocessed'>('all')
  const [deleting, setDeleting] = useState(false)
  const [confirmAll, setConfirmAll] = useState(false)

  const displayed = filter === 'all' ? messages : messages.filter((m) => !m.processed)

  async function deleteMessage(id: string) {
    await fetch(`/api/whatsapp/${id}`, { method: 'DELETE' })
    setMessages((prev) => prev.filter((m) => m.id !== id))
  }

  async function deleteAll() {
    setDeleting(true)
    await fetch('/api/whatsapp/all', { method: 'DELETE' })
    setMessages([])
    setConfirmAll(false)
    setDeleting(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mensagens do WhatsApp</h1>
          <p className="text-gray-500 text-sm mt-1">
            {messages.filter((m) => !m.processed).length} não processada(s) · {messages.length} total
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              filter === 'all' ? 'bg-blue-600 text-white' : 'border border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            Todas
          </button>
          <button
            onClick={() => setFilter('unprocessed')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              filter === 'unprocessed' ? 'bg-blue-600 text-white' : 'border border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            Não processadas
          </button>
          {messages.length > 0 && (
            confirmAll ? (
              <div className="flex gap-2">
                <button onClick={deleteAll} disabled={deleting}
                  className="px-3 py-1.5 rounded-lg text-sm font-medium bg-red-600 text-white hover:bg-red-700 disabled:opacity-50">
                  {deleting ? 'Apagando...' : 'Confirmar apagar tudo'}
                </button>
                <button onClick={() => setConfirmAll(false)}
                  className="px-3 py-1.5 rounded-lg text-sm font-medium border border-gray-200 text-gray-600 hover:bg-gray-50">
                  Cancelar
                </button>
              </div>
            ) : (
              <button onClick={() => setConfirmAll(true)}
                className="px-3 py-1.5 rounded-lg text-sm font-medium border border-red-200 text-red-600 hover:bg-red-50">
                Apagar todas
              </button>
            )
          )}
        </div>
      </div>

      <div className="space-y-3">
        {displayed.map((msg) => (
          <div
            key={msg.id}
            className={`bg-white rounded-xl border p-4 ${msg.processed ? 'border-gray-100' : 'border-green-200'}`}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <div className="w-7 h-7 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-green-700 text-xs font-bold">
                      {normalizeSender(msg.sender).charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <span className="font-medium text-sm text-gray-900">{normalizeSender(msg.sender)}</span>
                  <span className="text-xs text-gray-400">
                    {new Date(msg.sentAt).toLocaleString('pt-BR')}
                  </span>
                  {!msg.processed && (
                    <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full font-medium">Novo</span>
                  )}
                </div>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{msg.content}</p>
                {msg.mediaUrl && (
                  <a href={msg.mediaUrl} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 mt-2 text-xs text-blue-600 hover:underline">
                    📎 Ver arquivo anexado
                  </a>
                )}
              </div>
              <button
                onClick={() => deleteMessage(msg.id)}
                className="text-gray-300 hover:text-red-500 flex-shrink-0 p-1 transition-colors"
                title="Apagar mensagem"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          </div>
        ))}
        {displayed.length === 0 && (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <p className="text-gray-400 text-sm">Nenhuma mensagem encontrada.</p>
          </div>
        )}
      </div>
    </div>
  )
}
