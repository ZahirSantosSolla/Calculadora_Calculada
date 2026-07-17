const header = document.querySelector('header');
if (header) {
  window.addEventListener('scroll', () => {
    header.classList.toggle('scrolled', window.scrollY > 60);
  });
}

const navToggle = document.getElementById('navToggle');
const nav = document.querySelector('header nav');
if (navToggle && nav) {
  navToggle.addEventListener('click', () => {
    nav.classList.toggle('open');
    navToggle.textContent = nav.classList.contains('open') ? '✕' : '☰';
  });
  nav.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
    nav.classList.remove('open');
    navToggle.textContent = '☰';
  }));
}

document.querySelectorAll('.faq-q').forEach(btn => {
  btn.addEventListener('click', () => btn.closest('.faq-item').classList.toggle('open'));
});

const form = document.getElementById('calcForm');
if (form) {
  const btnPF = document.getElementById('btnPF');
  const btnPJ = document.getElementById('btnPJ');
  const tipoInput = document.getElementById('tipoContribuinte');
  const rendaInput = document.getElementById('renda');
  const irInput = document.getElementById('irDevido');
  const rendaLabel = document.getElementById('rendaLabel');
  const rendaHint = document.getElementById('rendaHint');
  const resultPanel = document.getElementById('resultPanel');
  const errorPanel = document.getElementById('errorPanel');
  const errorMsg = document.getElementById('errorMsg');
  const btnCalc = document.getElementById('btnCalc');
  const btnText = document.getElementById('btnText');
  const btnLoader = document.getElementById('btnLoader');

  function setTipo(tipo) {
    tipoInput.value = tipo;
    btnPF.classList.toggle('active', tipo === 'pf');
    btnPJ.classList.toggle('active', tipo === 'pj');
    if (tipo === 'pf') {
      rendaLabel.textContent = 'Renda Bruta Anual';
      rendaInput.placeholder = 'Ex: 120.000,00';
      rendaHint.textContent = 'Sua renda tributável no ano (salários, pró-labore, aluguéis etc.)';
    } else {
      rendaLabel.textContent = 'Lucro / Faturamento Bruto Anual';
      rendaInput.placeholder = 'Ex: 1.200.000,00';
      rendaHint.textContent = 'Base de cálculo do IRPJ. Apenas para regime Lucro Real.';
    }
  }

  btnPF.addEventListener('click', () => setTipo('pf'));
  btnPJ.addEventListener('click', () => setTipo('pj'));

  function maskBRL(input) {
    input.addEventListener('input', () => {
      let v = input.value.replace(/\D/g, '');
      if (!v) { input.value = ''; return; }
      v = (parseInt(v, 10) / 100).toFixed(2);
      input.value = Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 2 });
    });
  }
  maskBRL(rendaInput);
  maskBRL(irInput);

  function parseBRL(str) {
    if (!str) return 0;
    return parseFloat(str.replace(/\./g, '').replace(',', '.')) || 0;
  }

  function formatBRL(n) {
    return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }

  function setLoading(on) {
    btnText.classList.toggle('hidden', on);
    btnLoader.classList.toggle('hidden', !on);
    btnCalc.disabled = on;
  }

  function showError(msg) {
    resultPanel.classList.add('hidden');
    errorPanel.classList.remove('hidden');
    errorMsg.textContent = msg;
  }

  function showResult(data) {
    errorPanel.classList.add('hidden');
    resultPanel.classList.remove('hidden');

    const isento = data.detalhamento?.isento;

    document.getElementById('resValorMax').textContent = formatBRL(data.valor_maximo_doacao);
    document.getElementById('resPct').textContent = `${data.limite_deducao_percentual}% do imposto devido`;
    document.getElementById('resIR').textContent = formatBRL(data.imposto_devido);
    document.getElementById('resEconomia').textContent = formatBRL(data.economia_fiscal);
    document.getElementById('resCusto').textContent = formatBRL(data.custo_real_doacao);

    const obsEl = document.getElementById('resObs');
    obsEl.innerHTML = `<strong>${isento ? '⚠️ Atenção:' : 'ℹ️ Info:'}</strong> ${data.detalhamento.observacao}`;
    obsEl.className = 'obs-box' + (isento ? ' isento' : '');

    resultPanel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const renda = parseBRL(rendaInput.value);
    if (!renda || renda <= 0) { showError('Por favor, informe sua renda bruta anual.'); return; }

    setLoading(true);
    try {
      const res = await fetch('/api/calcular', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tipo_contribuinte: tipoInput.value,
          renda_bruta_anual: renda,
          imposto_devido: parseBRL(irInput.value) || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) showError(data.detail || 'Erro ao calcular.');
      else showResult(data);
    } catch {
      showError('Não foi possível conectar ao servidor.');
    } finally {
      setLoading(false);
    }
  });
}

window.compartilhar = function() {
  const txt = `Calcule quanto você pode destinar à cultura via Lei Rouanet:\n${window.location.origin}`;
  if (navigator.share) navigator.share({ title: 'Cofrinho – Lei Rouanet', text: txt, url: window.location.origin });
  else navigator.clipboard.writeText(txt).then(() => alert('Link copiado! 🎭'));
};

window.resetar = function() {
  const f = document.getElementById('calcForm');
  const r = document.getElementById('resultPanel');
  const e = document.getElementById('errorPanel');
  if (f) f.reset();
  if (r) r.classList.add('hidden');
  if (e) e.classList.add('hidden');
  const sec = document.getElementById('calculadora');
  if (sec) sec.scrollIntoView({ behavior: 'smooth' });
};