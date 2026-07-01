import { NextResponse } from 'next/server'

const HTML = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Sistema de Reforma · Igreja Matriz IEADMS</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    :root { --blue: #1d4ed8; --blue-light: #dbeafe; --green: #16a34a; --green-light: #dcfce7; --border: #e5e7eb; }
    body { font-family: 'Segoe UI', Arial, sans-serif; color: #111827; background: #f9fafb; line-height: 1.6; }
    .capa { background: linear-gradient(135deg, #1e3a8a 0%, #1d4ed8 60%, #2563eb 100%); color: white; padding: 80px 40px; text-align: center; min-height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 20px; }
    .capa .logo-ring { width: 90px; height: 90px; background: rgba(255,255,255,0.15); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 40px; border: 3px solid rgba(255,255,255,0.3); margin-bottom: 8px; }
    .capa h1 { font-size: 2.6rem; font-weight: 800; letter-spacing: -0.5px; }
    .capa h2 { font-size: 1.3rem; font-weight: 400; opacity: 0.85; }
    .capa .badge { background: rgba(255,255,255,0.2); border: 1px solid rgba(255,255,255,0.3); border-radius: 999px; padding: 6px 20px; font-size: 0.9rem; margin-top: 8px; }
    .capa .meta { font-size: 0.85rem; opacity: 0.6; margin-top: 40px; }
    section { padding: 60px 40px; max-width: 900px; margin: 0 auto; }
    section + section { border-top: 1px solid var(--border); }
    h2.section-title { font-size: 1.6rem; font-weight: 700; color: var(--blue); margin-bottom: 8px; display: flex; align-items: center; gap: 12px; }
    .section-sub { color: #6b7280; font-size: 0.95rem; margin-bottom: 32px; }
    .cards { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; margin-bottom: 24px; }
    .card { background: white; border: 1px solid var(--border); border-radius: 14px; padding: 20px; display: flex; flex-direction: column; gap: 8px; }
    .card .card-icon { font-size: 2rem; }
    .card h3 { font-size: 1rem; font-weight: 700; color: #111827; }
    .card p { font-size: 0.87rem; color: #6b7280; }
    .card.highlight { border-color: var(--blue); background: var(--blue-light); }
    .card.highlight h3 { color: var(--blue); }
    .feature-list { list-style: none; display: flex; flex-direction: column; gap: 10px; }
    .feature-list li { display: flex; align-items: flex-start; gap: 12px; background: white; border: 1px solid var(--border); border-radius: 10px; padding: 14px 18px; font-size: 0.95rem; }
    .feature-list li .dot { width: 24px; height: 24px; flex-shrink: 0; border-radius: 50%; background: var(--blue-light); color: var(--blue); display: flex; align-items: center; justify-content: center; font-size: 0.8rem; font-weight: 700; }
    .feature-list li strong { color: #111827; }
    .perfis { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
    .perfil { background: white; border: 1px solid var(--border); border-radius: 14px; overflow: hidden; }
    .perfil .header { padding: 16px 20px; font-weight: 700; font-size: 1rem; }
    .perfil .header.admin { background: #ede9fe; color: #6d28d9; }
    .perfil .header.equipe { background: var(--blue-light); color: var(--blue); }
    .perfil ul { padding: 16px 20px; list-style: none; display: flex; flex-direction: column; gap: 6px; }
    .perfil ul li { font-size: 0.88rem; color: #374151; display: flex; align-items: center; gap: 8px; }
    .perfil ul li::before { content: "✓"; color: var(--green); font-weight: 700; }
    .fluxo { display: flex; align-items: center; gap: 0; overflow-x: auto; padding: 16px 0; }
    .passo { flex: 1; min-width: 120px; background: white; border: 1px solid var(--border); border-radius: 10px; padding: 14px 12px; text-align: center; font-size: 0.85rem; }
    .passo .num { width: 28px; height: 28px; background: var(--blue); color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 0.8rem; font-weight: 700; margin: 0 auto 8px; }
    .passo strong { display: block; color: #111827; font-size: 0.9rem; margin-bottom: 4px; }
    .seta { font-size: 1.4rem; color: #9ca3af; padding: 0 8px; flex-shrink: 0; }
    .tech-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 12px; }
    .tech-item { background: white; border: 1px solid var(--border); border-radius: 10px; padding: 14px; text-align: center; }
    .tech-item .tech-icon { font-size: 1.8rem; margin-bottom: 6px; }
    .tech-item strong { display: block; font-size: 0.9rem; color: #111827; }
    .tech-item span { font-size: 0.78rem; color: #6b7280; }
    .box { border-radius: 12px; padding: 20px 24px; margin-bottom: 20px; }
    .box.blue { background: var(--blue-light); border: 1px solid #bfdbfe; color: #1e40af; }
    .box.green { background: var(--green-light); border: 1px solid #bbf7d0; color: #166534; }
    .box.purple { background: #ede9fe; border: 1px solid #ddd6fe; color: #5b21b6; }
    footer { background: #1f2937; color: #9ca3af; text-align: center; padding: 40px; font-size: 0.85rem; }
    footer strong { color: white; }
    @media (max-width: 700px) {
      .capa h1 { font-size: 1.8rem; }
      section { padding: 40px 20px; }
      .perfis { grid-template-columns: 1fr; }
      .fluxo { flex-direction: column; }
      .seta { transform: rotate(90deg); }
    }
  </style>
</head>
<body>

<div class="capa">
  <div class="logo-ring">⛪</div>
  <h1>Sistema de Gestão da Reforma</h1>
  <h2>Banheiro Masculino · Igreja Matriz IEADMS</h2>
  <div class="badge">Inauguração prevista: Setembro de 2026</div>
  <div class="meta">Desenvolvido sob medida para a Igreja Matriz · Julho 2026</div>
</div>

<section>
  <h2 class="section-title"><span>📱</span> O que é este sistema?</h2>
  <p class="section-sub">Um painel web completo para acompanhar em tempo real cada detalhe da reforma — de qualquer lugar, pelo celular ou computador.</p>
  <div class="cards">
    <div class="card highlight"><div class="card-icon">📊</div><h3>Dashboard em tempo real</h3><p>Visão geral do progresso, gastos e orçamentos com gráficos atualizados.</p></div>
    <div class="card"><div class="card-icon">💬</div><h3>WhatsApp integrado</h3><p>Mensagens do grupo capturadas e analisadas automaticamente por IA.</p></div>
    <div class="card"><div class="card-icon">📋</div><h3>Orçamentos controlados</h3><p>Regra dos 3 orçamentos por serviço, aprovação e histórico completo.</p></div>
    <div class="card"><div class="card-icon">💰</div><h3>Pagamentos rastreados</h3><p>Data de solicitação, autorização e pagamento de cada despesa.</p></div>
  </div>
</section>

<section>
  <h2 class="section-title"><span>👥</span> Perfis de Acesso</h2>
  <p class="section-sub">Dois perfis distintos — cada pessoa vê apenas o que precisa.</p>
  <div class="perfis">
    <div class="perfil">
      <div class="header admin">🔑 Administrador</div>
      <ul>
        <li>Pr. Felipe</li>
        <li>Pra. Hyanna</li>
        <li>Pr. Jorcelino</li>
        <li>Pra. Mirella</li>
        <li>Pr. Thiago (Suporte TI)</li>
        <li>Dashboard completo com gráficos</li>
        <li>Aprovar e rejeitar orçamentos</li>
        <li>Gerenciar etapas e usuários</li>
      </ul>
    </div>
    <div class="perfil">
      <div class="header equipe">👷 Equipe</div>
      <ul>
        <li>Pr. Diogo</li>
        <li>Pr. Caio</li>
        <li>Ev. Gabriel</li>
        <li>Pr. Wellington Barbosa</li>
        <li>Dca. Milca</li>
        <li>Enviar orçamentos e gastos</li>
        <li>Acompanhar etapas e progresso</li>
        <li>Lançar pagamentos e comprovantes</li>
      </ul>
    </div>
  </div>
</section>

<section>
  <h2 class="section-title"><span>⚙️</span> Funcionalidades Principais</h2>
  <p class="section-sub">Tudo que a obra precisa, em um só lugar.</p>
  <ul class="feature-list">
    <li><div class="dot">1</div><div><strong>Contador regressivo</strong> — Dias restantes para o prazo (1/set) e para a inauguração (4/set/2026), com barra de progresso visual.</div></li>
    <li><div class="dot">2</div><div><strong>Etapas da obra</strong> — 8 etapas cadastradas (Planejamento → Acabamento) com progresso individual e status.</div></li>
    <li><div class="dot">3</div><div><strong>Orçamentos com regra dos 3</strong> — Cada serviço precisa de 3 orçamentos. O sistema conta e sinaliza quando falta.</div></li>
    <li><div class="dot">4</div><div><strong>Aprovação de orçamentos</strong> — Presidência aprova ou rejeita no painel. Notificação automática vai para o grupo do WhatsApp.</div></li>
    <li><div class="dot">5</div><div><strong>Aprovação via WhatsApp</strong> — Se o Pr. Felipe ou Pra. Hyanna enviarem "aprovado" no grupo, a IA detecta e registra no sistema.</div></li>
    <li><div class="dot">6</div><div><strong>Gastos / Pagamentos</strong> — Registro com fornecedor, data de solicitação, autorização e pagamento.</div></li>
    <li><div class="dot">7</div><div><strong>Análise por categoria</strong> — Clique em qualquer categoria para ver orçamentos, gastos e sugestão da IA do melhor custo-benefício.</div></li>
    <li><div class="dot">8</div><div><strong>Simulador de cenários</strong> — Compare 3 combinações de orçamentos aprovados para simular o custo total da obra.</div></li>
    <li><div class="dot">9</div><div><strong>Importador de histórico</strong> — Cole a exportação do WhatsApp e a IA lê tudo, extraindo orçamentos e pagamentos.</div></li>
    <li><div class="dot">10</div><div><strong>Modo escuro / claro</strong> — Alternável a qualquer momento, com preferência salva no dispositivo.</div></li>
  </ul>
</section>

<section>
  <h2 class="section-title"><span>🤖</span> WhatsApp + Inteligência Artificial</h2>
  <p class="section-sub">O grupo <em>Reforma Matriz</em> é monitorado 24h. Cada mensagem é analisada por IA.</p>
  <div class="box blue">
    <strong>Como funciona:</strong> Quando alguém envia uma mensagem no grupo com um valor, fornecedor ou progresso de obra, a IA lê e cria automaticamente o orçamento ou pagamento no sistema — sem precisar digitar nada no site.
  </div>
  <div class="fluxo">
    <div class="passo"><div class="num">1</div><strong>Mensagem no grupo</strong>"Orçamento azulejo: R$ 4.800"</div>
    <div class="seta">→</div>
    <div class="passo"><div class="num">2</div><strong>Z-API captura</strong>Webhook recebe em tempo real</div>
    <div class="seta">→</div>
    <div class="passo"><div class="num">3</div><strong>IA analisa</strong>Identifica tipo, valor, categoria</div>
    <div class="seta">→</div>
    <div class="passo"><div class="num">4</div><strong>Registrado</strong>Orçamento criado no sistema</div>
    <div class="seta">→</div>
    <div class="passo"><div class="num">5</div><strong>Notificação</strong>Confirmação volta ao grupo</div>
  </div>
  <div class="box green" style="margin-top:20px">
    <strong>A IA entende:</strong> texto, imagens de orçamento, PDFs de notas fiscais e áudios (transcritos automaticamente).
  </div>
</section>

<section>
  <h2 class="section-title"><span>📋</span> Fluxo de Aprovação de Orçamentos</h2>
  <p class="section-sub">Processo simples e transparente, com rastreabilidade completa.</p>
  <div class="fluxo">
    <div class="passo"><div class="num">1</div><strong>Solicitação</strong>Equipe envia orçamento (WhatsApp ou sistema)</div>
    <div class="seta">→</div>
    <div class="passo"><div class="num">2</div><strong>Pendente</strong>Aguarda 3 orçamentos para o serviço</div>
    <div class="seta">→</div>
    <div class="passo"><div class="num">3</div><strong>Revisão</strong>Presidência compara os 3 no sistema</div>
    <div class="seta">→</div>
    <div class="passo"><div class="num">4</div><strong>Decisão</strong>Aprova ou rejeita (no site ou WhatsApp)</div>
    <div class="seta">→</div>
    <div class="passo"><div class="num">5</div><strong>Grupo notificado</strong>Mensagem automática confirma a decisão</div>
  </div>
</section>

<section>
  <h2 class="section-title"><span>🏗️</span> Infraestrutura</h2>
  <p class="section-sub">100% na nuvem — funciona 24h sem precisar de computador ligado.</p>
  <div class="tech-grid">
    <div class="tech-item"><div class="tech-icon">▲</div><strong>Vercel</strong><span>Site hospedado (grátis)</span></div>
    <div class="tech-item"><div class="tech-icon">🛢</div><strong>Railway</strong><span>Banco de dados PostgreSQL</span></div>
    <div class="tech-item"><div class="tech-icon">💬</div><strong>Z-API</strong><span>Integração WhatsApp</span></div>
    <div class="tech-item"><div class="tech-icon">🤖</div><strong>Claude (Anthropic)</strong><span>IA para análise de mensagens</span></div>
    <div class="tech-item"><div class="tech-icon">🎙️</div><strong>Whisper (OpenAI)</strong><span>Transcrição de áudios</span></div>
    <div class="tech-item"><div class="tech-icon">📱</div><strong>Responsivo</strong><span>Funciona no celular</span></div>
  </div>
  <div class="box purple" style="margin-top:24px">
    <strong>Custo mensal estimado:</strong> R$ 80–150 (Railway ~R$ 40 + Z-API ~R$ 40 + APIs de IA conforme uso). O site (Vercel) é gratuito.
  </div>
</section>

<section>
  <h2 class="section-title"><span>🚀</span> Próximos Passos Sugeridos</h2>
  <p class="section-sub">Para aproveitar ao máximo o sistema durante a obra.</p>
  <ul class="feature-list">
    <li><div class="dot">✓</div><div><strong>Importar histórico do grupo</strong> — Exportar a conversa do WhatsApp e importar no sistema para recuperar orçamentos já enviados.</div></li>
    <li><div class="dot">✓</div><div><strong>Cadastrar etapas em andamento</strong> — Atualizar o progresso (%) de cada etapa conforme a obra avança.</div></li>
    <li><div class="dot">✓</div><div><strong>Orientar a equipe</strong> — Pr. Diogo, Pr. Caio e Ev. Gabriel a enviar valores diretamente no grupo para captura automática.</div></li>
    <li><div class="dot">✓</div><div><strong>Aprovações via WhatsApp</strong> — Pr. Felipe e Pra. Hyanna podem aprovar diretamente no grupo. O sistema registra automaticamente.</div></li>
    <li><div class="dot">✓</div><div><strong>Pr. Wellington e Dca. Milca</strong> — Enviar PDFs de comprovantes de pagamento no grupo para registro automático.</div></li>
  </ul>
</section>

<footer>
  <p><strong>Sistema de Gestão da Reforma · Igreja Matriz IEADMS</strong></p>
  <p style="margin-top:8px">Desenvolvido por Pr. Thiago · Julho 2026</p>
  <p style="margin-top:4px;font-size:0.8rem">Para suporte: thiagodsrosa@gmail.com</p>
</footer>

</body>
</html>`

export function GET() {
  return new NextResponse(HTML, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  })
}
