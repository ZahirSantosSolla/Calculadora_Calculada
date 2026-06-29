from fastapi import FastAPI, Request, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
import os
from app.database import init_db, save_simulation
from app.calculator import calcular_rouanet

app = FastAPI(title="Lei Rouanet - Calculadora", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/static", StaticFiles(directory="static"), name="static")
templates = Jinja2Templates(directory="templates")


@app.on_event("startup")
async def startup():
    await init_db()


class SimulacaoRequest(BaseModel):
    tipo_contribuinte: str          
    renda_bruta_anual: float
    imposto_devido: Optional[float] = None
    nome: Optional[str] = None
    email: Optional[str] = None


class SimulacaoResponse(BaseModel):
    tipo_contribuinte: str
    renda_bruta_anual: float
    imposto_devido: float
    limite_deducao_percentual: float
    valor_maximo_doacao: float
    economia_fiscal: float
    custo_real_doacao: float
    detalhamento: dict

@app.get("/")
async def home(request: Request):
    return templates.TemplateResponse("index.html", {"request": request})


@app.get("/sobre")
async def sobre(request: Request):
    return templates.TemplateResponse("sobre.html", {"request": request})


@app.get("/faq")
async def faq(request: Request):
    return templates.TemplateResponse("faq.html", {"request": request})



@app.post("/api/calcular", response_model=SimulacaoResponse)
async def calcular(dados: SimulacaoRequest):
    if dados.tipo_contribuinte not in ["pf", "pj"]:
        raise HTTPException(status_code=400, detail="tipo_contribuinte deve ser 'pf' ou 'pj'")
    if dados.renda_bruta_anual <= 0:
        raise HTTPException(status_code=400, detail="Renda bruta anual deve ser positiva")

    resultado = calcular_rouanet(
        tipo=dados.tipo_contribuinte,
        renda_bruta=dados.renda_bruta_anual,
        imposto_devido=dados.imposto_devido,
    )

    
    try:
        await save_simulation({
            "tipo": dados.tipo_contribuinte,
            "renda": dados.renda_bruta_anual,
            "valor_max": resultado["valor_maximo_doacao"],
            "nome": dados.nome,
            "email": dados.email,
        })
    except Exception:
        pass 

    return resultado


@app.get("/api/health")
async def health():
    return {"status": "ok", "version": "1.0.0"}
