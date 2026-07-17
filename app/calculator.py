"""
Tabela IRPF 2026 (faixas mensais → anual):
  Até R$ 5.000/mês   (R$ 60.000/ano)  → isento
  R$ 5.000,01 a R$ 7.786,02/mês       → 7,5%
  R$ 7.786,03 a R$ 10.371,24/mês      → 15%
  R$ 10.371,25 a R$ 12.954,34/mês     → 22,5%
  Acima de R$ 12.954,34/mês           → 27,5%
"""

TABELA_IRPF_2026 = [
    (60_000.00,       0.000,      0.00),
    (93_432.24,       0.075,   4_500.00),
    (124_454.88,      0.150,  11_505.67),
    (155_452.08,      0.225,  20_834.38),
    (float("inf"),    0.275,  28_611.62),
]

ALIQUOTA_PF = 0.06   # 6% do IR devido
ALIQUOTA_PJ = 0.04   # 4% do IRPJ devido


def calcular_irpf(renda_bruta_anual: float) -> float:
    """Calcula o IRPF anual pela tabela progressiva 2026."""
    for limite, aliquota, deducao in TABELA_IRPF_2026:
        if renda_bruta_anual <= limite:
            return max(0.0, renda_bruta_anual * aliquota - deducao)
    return max(0.0, renda_bruta_anual * 0.275 - 28_611.62)


def faixa_irpf(renda: float) -> str:
    """Retorna a faixa de alíquota marginal."""
    mensal = renda / 12
    if mensal <= 5_000:
        return "Isento"
    elif mensal <= 7_786.02:
        return "7,5%"
    elif mensal <= 10_371.24:
        return "15%"
    elif mensal <= 12_954.34:
        return "22,5%"
    else:
        return "27,5%"


def calcular_rouanet(tipo: str, renda_bruta: float, imposto_devido: float | None = None) -> dict:
    if tipo == "pf":
        ir = imposto_devido if imposto_devido and imposto_devido > 0 else calcular_irpf(renda_bruta)
        limite_pct = ALIQUOTA_PF
        faixa = faixa_irpf(renda_bruta)
        isento = ir == 0.0

        if isento:
            observacao = (
                "Com a nova tabela IRPF 2026, rendas até R$ 5.000/mês (R$ 60.000/ano) "
                "são totalmente isentas de Imposto de Renda. Portanto, não há imposto "
                "devido e a Lei Rouanet não se aplica neste caso."
            )
        else:
            observacao = (
                f"Sua alíquota marginal estimada é {faixa}. "
                "Dedução válida apenas na declaração completa do IRPF (não se aplica ao modelo simplificado). "
                "O valor é descontado diretamente do imposto que você já pagaria."
            )

        detalhamento = {
            "base_calculo": "Imposto de Renda Pessoa Física (IRPF) — Tabela 2026",
            "faixa_aliquota_marginal": faixa,
            "isento": isento,
            "imposto_devido_anual": ir,
            "percentual_deducao": "6%",
            "observacao": observacao,
        }

    else:  # pj
        ir = imposto_devido if imposto_devido and imposto_devido > 0 else renda_bruta * 0.15
        limite_pct = ALIQUOTA_PJ
        detalhamento = {
            "base_calculo": "Imposto de Renda Pessoa Jurídica (IRPJ) — Lucro Real",
            "aliquota_base_irpj": "15%",
            "imposto_devido_estimado": ir,
            "percentual_deducao": "4%",
            "observacao": (
                "Exclusivo para empresas no regime Lucro Real. "
                "Simples Nacional e Lucro Presumido não se enquadram."
            ),
        }

    valor_max = ir * limite_pct
    economia_fiscal = valor_max
    custo_real = 0.0

    return {
        "tipo_contribuinte": tipo,
        "renda_bruta_anual": renda_bruta,
        "imposto_devido": round(ir, 2),
        "limite_deducao_percentual": limite_pct * 100,
        "valor_maximo_doacao": round(valor_max, 2),
        "economia_fiscal": round(economia_fiscal, 2),
        "custo_real_doacao": round(custo_real, 2),
        "detalhamento": detalhamento,
    }