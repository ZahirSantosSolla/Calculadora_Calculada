const navToggle = document.getElementById('navToggle');
const navLinks  = document.querySelector('.nav-links');
if (navToggle) {
  navToggle.addEventListener('click', () => navLinks.classList.toggle('open'));
}

document.querySelectorAll('.faq-q').forEach(btn => {
  btn.addEventListener('click', () => {
    const item = btn.closest('.faq-item');
    item.classList.toggle('open');
  });
});

const form      = document.getElementById('calcForm');
if (!form) { /* sem calculadora */ }
else {

const btnPF     = document.getElementById('btnPF');
const btnPJ     = document.getElementById('btnPJ');
const tipoInput = document.getElementById('tipoContribuinte');
const rendaInput = document.getElementById('renda');
const irInput    = document.getElementById('irDevido');
const rendaLabel = document.getElementById('rendaLabel');
const rendaHint  = document.getElementById('rendaHint');
const resultPanel = document.getElementById('resultPanel');
const errorPanel  = document.getElementById('errorPanel');
const errorMsg    = document.getElementById('errorMsg');
const btnCalc     = document.getElementById('btnCalc');
const btnText     = document.getElementById('btnText');
const btnLoader   = document.getElementById('btnLoader');

function setTipo(tipo) {
  tipoInput.value = tipo;
  btnPF.classList.toggle('active', tipo === 'pf');
  btnPJ.classList.toggle('active', tipo === 'pj');
  if (tipo === 'pf') {
    rendaLabel.textContent = 'Renda Bruta Anual (R$)';
    rendaInput.placeholder = 'Ex: 120.000,00';
    rendaHint.textContent  = 'Sua renda tributável total no ano (salários, pró-labore, aluguéis etc.)';
  } else {
    rendaLabel.textContent = 'Faturamento / Lucro Bruto Anual (R$)';
    rendaInput.placeholder = 'Ex: 1.200.000,00';
    rendaHint.textContent  = 'Base de cálculo do IRPJ. Regime: Lucro Real.';
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

  document.getElementById('resValorMax').textContent = formatBRL(data.valor_maximo_doacao);
  document.getElementById('resPct').textContent =
    `${data.limite_deducao_percentual}% do seu imposto devido`;
  document.getElementById('resIR').textContent = formatBRL(data.imposto_devido);
  document.getElementById('resEconomia').textContent = formatBRL(data.economia_fiscal);
  document.getElementById('resCusto').textContent = formatBRL(data.custo_real_doacao);

  const det = data.detalhamento;
  document.getElementById('resObs').innerHTML =
    `<strong>ℹ️ Atenção:</strong> ${det.observacao}`;

  resultPanel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();

  const renda = parseBRL(rendaInput.value);
  if (!renda || renda <= 0) {
    showError('Por favor, informe sua renda bruta anual.');
    return;
  }

  const payload = {
    tipo_contribuinte: tipoInput.value,
    renda_bruta_anual: renda,
    imposto_devido: parseBRL(irInput.value) || null,
  };

  setLoading(true);
  try {
    const res = await fetch('/api/calcular', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) {
      showError(data.detail || 'Erro ao calcular. Tente novamente.');
    } else {
      showResult(data);
    }
  } catch (err) {
    showError('Não foi possível conectar ao servidor. Verifique sua conexão.');
  } finally {
    setLoading(false);
  }
});

} 

function compartilhar() {
  const texto = `Descobri que posso destinar recursos à cultura brasileira via Lei Rouanet!\n` +
    `Calcule você também: ${window.location.origin}`;
  if (navigator.share) {
    navigator.share({ title: 'Lei Rouanet – Calculadora', text: texto, url: window.location.origin });
  } else {
    navigator.clipboard.writeText(texto).then(() => alert('Link copiado! Compartilhe com seus amigos. 🎭'));
  }
}

function resetar() {
  const form = document.getElementById('calcForm');
  const resultPanel = document.getElementById('resultPanel');
  const errorPanel  = document.getElementById('errorPanel');
  if (form) form.reset();
  if (resultPanel) resultPanel.classList.add('hidden');
  if (errorPanel)  errorPanel.classList.add('hidden');
  window.scrollTo({ top: document.getElementById('calculadora')?.offsetTop - 80, behavior: 'smooth' });
}

window.compartilhar = compartilhar;
window.resetar = resetar;
