TABELA_IRPF = [
    (25344.00,   0.000,      0.00),
    (33919.80,   0.075,   1900.80),
    (45012.60,   0.150,   4453.87),
    (55976.16,   0.225,   7840.08),
    (float("inf"), 0.275, 10649.54),
]

ALIQUOTA_PF = 0.06   
ALIQUOTA_PJ = 0.04  


def calcular_irpf(renda_bruta_anual: float) -> float:
    """Calcula o IRPF anual pela tabela progressiva (simplificado, sem deduções)."""
    for limite, aliquota, deducao in TABELA_IRPF:
        if renda_bruta_anual <= limite:
            return max(0.0, renda_bruta_anual * aliquota - deducao)
    return renda_bruta_anual * 0.275 - 10649.54


def calcular_rouanet(tipo: str, renda_bruta: float, imposto_devido: float | None = None) -> dict:
    if tipo == "pf":
        ir = imposto_devido if imposto_devido and imposto_devido > 0 else calcular_irpf(renda_bruta)
        limite_pct = ALIQUOTA_PF
        limite_label = "6% do IR devido (IRPF)"
        valor_max = ir * limite_pct
        detalhamento = {
            "base_calculo": "Imposto de Renda Pessoa Física (IRPF)",
            "aliquota_efetiva_estimada": f"{(ir / renda_bruta * 100):.2f}%",
            "imposto_devido_anual": ir,
            "percentual_deducao": "6%",
            "observacao": (
                "Dedução válida apenas na declaração completa do IRPF. "
                "Não se aplica ao modelo simplificado."
            ),
        }
    else:  
        ir = imposto_devido if imposto_devido and imposto_devido > 0 else renda_bruta * 0.15
        limite_pct = ALIQUOTA_PJ
        limite_label = "4% do IRPJ devido"
        valor_max = ir * limite_pct
        detalhamento = {
            "base_calculo": "Imposto de Renda Pessoa Jurídica (IRPJ) – Lucro Real",
            "aliquota_base_irpj": "15%",
            "imposto_devido_estimado": ir,
            "percentual_deducao": "4%",
            "observacao": (
                "Exclusivo para empresas no regime Lucro Real. "
                "Simples Nacional e Lucro Presumido não se enquadram."
            ),
        }

    economia_fiscal = valor_max         
    custo_real = valor_max - economia_fiscal  

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
