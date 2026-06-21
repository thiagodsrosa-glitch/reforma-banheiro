'use client'

import { useEffect, useState } from 'react'

const META = new Date('2026-09-01T00:00:00')     // conclusão da obra
const INAUGURACAO = new Date('2026-09-04T00:00:00') // inauguração
const INICIO = new Date('2026-06-15T00:00:00')     // início da reforma

function diff(target: Date) {
  const now = new Date()
  const ms = target.getTime() - now.getTime()
  if (ms <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0, done: true }
  return {
    days: Math.floor(ms / 86400000),
    hours: Math.floor((ms % 86400000) / 3600000),
    minutes: Math.floor((ms % 3600000) / 60000),
    seconds: Math.floor((ms % 60000) / 1000),
    done: false,
  }
}

function progress() {
  const total = META.getTime() - INICIO.getTime()
  const elapsed = Date.now() - INICIO.getTime()
  return Math.min(100, Math.max(0, Math.round((elapsed / total) * 100)))
}

function Digit({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col items-center">
      <div className="bg-white/20 rounded-xl px-3 py-2 min-w-[48px] text-center">
        <span className="text-2xl font-bold tabular-nums">{String(value).padStart(2, '0')}</span>
      </div>
      <span className="text-xs mt-1 opacity-75">{label}</span>
    </div>
  )
}

export default function Countdown() {
  const [meta, setMeta] = useState(diff(META))
  const [inaug, setInauguracao] = useState(diff(INAUGURACAO))
  const [pct, setPct] = useState(progress())

  useEffect(() => {
    const t = setInterval(() => {
      setMeta(diff(META))
      setInauguracao(diff(INAUGURACAO))
      setPct(progress())
    }, 1000)
    return () => clearInterval(t)
  }, [])

  const urgente = meta.days <= 14
  const bg = meta.done
    ? 'from-green-600 to-emerald-700'
    : urgente
    ? 'from-red-600 to-orange-600'
    : meta.days <= 30
    ? 'from-orange-500 to-yellow-500'
    : 'from-blue-700 to-blue-900'

  return (
    <div className={`rounded-2xl bg-gradient-to-r ${bg} text-white p-5 shadow-lg`}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex-1">
          <p className="text-xs uppercase tracking-widest opacity-75 mb-1">
            {meta.done ? '🎉 Meta atingida!' : '⏳ Conclusão da obra'}
          </p>
          <p className="font-bold text-lg">01 de setembro de 2026</p>
          {!meta.done && (
            <div className="flex items-center gap-3 mt-3">
              <Digit value={meta.days} label="dias" />
              <span className="text-xl font-bold opacity-50 pb-4">:</span>
              <Digit value={meta.hours} label="horas" />
              <span className="text-xl font-bold opacity-50 pb-4">:</span>
              <Digit value={meta.minutes} label="min" />
              <span className="text-xl font-bold opacity-50 pb-4">:</span>
              <Digit value={meta.seconds} label="seg" />
            </div>
          )}
        </div>

        <div className="border-l border-white/20 pl-5 hidden sm:block">
          <p className="text-xs uppercase tracking-widest opacity-75 mb-1">🎊 Inauguração</p>
          <p className="font-bold">04 de setembro de 2026</p>
          {!inaug.done && (
            <p className="text-2xl font-bold mt-1">{inaug.days} <span className="text-sm font-normal opacity-75">dias</span></p>
          )}
        </div>
      </div>

      {/* Barra de progresso */}
      <div className="mt-4">
        <div className="flex justify-between text-xs opacity-75 mb-1">
          <span>Início 15/jun</span>
          <span>{pct}% do prazo decorrido</span>
          <span>Meta 01/set</span>
        </div>
        <div className="h-2 bg-white/20 rounded-full overflow-hidden">
          <div
            className="h-full bg-white rounded-full transition-all duration-1000"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      {/* Inauguração no mobile */}
      <div className="sm:hidden mt-3 pt-3 border-t border-white/20 flex items-center justify-between">
        <span className="text-xs opacity-75">🎊 Inauguração 04/set/2026</span>
        {!inaug.done && <span className="font-bold">{inaug.days} dias</span>}
      </div>
    </div>
  )
}
