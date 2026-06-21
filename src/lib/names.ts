// Normaliza nomes de remetentes do WhatsApp para o padrão da igreja
export function normalizeSender(name: string): string {
  const n = name.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
  if (n.includes('felipe')) return 'Pr. Felipe'
  if (n.includes('hyanna') || n.includes('hianna') || n.includes('hyana')) return 'Pra. Hyanna'
  return name
}
