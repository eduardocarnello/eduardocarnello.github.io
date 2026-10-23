#!/usr/bin/env python3
"""Robô de indisponibilidades do TJSP.

Lê os comunicados de https://www.tjsp.jus.br/Indisponibilidade/Comunicados,
classifica cada um (sistema, gravidade, abrangência para o JEC Cível de
Marília / 1º grau, datas e horário) com heurística simples (sem IA) e grava
``data/indisponibilidades.json`` (um item por dia afetado).

Só biblioteca padrão (como fetch_indices.py). A sincronização opcional com o
Firestore usa google-auth, importado apenas dentro de ``sync_firestore``.

Exemplos:
    python .github/scripts/fetch_indisponibilidades.py                 # página 1 (incremental)
    python .github/scripts/fetch_indisponibilidades.py --paginas 3
    python .github/scripts/fetch_indisponibilidades.py --todas         # carga histórica (resumível via --cache-dir)
    python .github/scripts/fetch_indisponibilidades.py --reprocessar   # reclassifica a partir do cache de HTML
    python .github/scripts/fetch_indisponibilidades.py --fixtures-dir .github/scripts/tests/fixtures --dry-run
"""
from __future__ import annotations

import argparse
import datetime as dt
import html
import http.client
import json
import os
import pathlib
import re
import socket
import sys
import time
import unicodedata
import urllib.error
import urllib.parse
import urllib.request
from typing import Dict, Iterable, List, Optional, Tuple

try:
    from zoneinfo import ZoneInfo

    TZ = ZoneInfo("America/Sao_Paulo")
except Exception:  # noqa: BLE001 - Windows sem tzdata: Brasil não tem horário de verão desde 2019
    TZ = dt.timezone(dt.timedelta(hours=-3), "-03")

BASE = "https://www.tjsp.jus.br"
FONTE = BASE + "/Indisponibilidade/Comunicados"
LISTA_URL = BASE + "/Indisponibilidade/Comunicados?pagina={pagina}&tipoDestino=148"
DETALHE_URL = BASE + "/Indisponibilidade/Comunicado?codigoComunicado={codigo}&pagina=1"
SAIDA_PADRAO = "data/indisponibilidades.json"
CACHE_PADRAO = ".cache/tjsp"

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "pt-BR,pt;q=0.9,en;q=0.8",
    "Referer": FONTE,
}
TIMEOUT = 120
ESPERAS = (5, 15, 30)  # espera após a 1ª, 2ª e 3ª falha
TENTATIVAS = 3
PAUSA = 1.5  # segundos entre requisições
SALVAR_A_CADA = 10  # comunicados
MAX_DIAS_INTERVALO = 31
MAX_PAGINAS_EXTRA = 20  # modo incremental: limite de páginas quando todas as da página são novas

MARCA_FIM = "O Tribunal de Justiça de São Paulo utiliza cookies"
SISTEMA_LABEL = {
    "eproc": "eproc",
    "saj": "e-SAJ",
    "custas": "Portal de Custas",
    "geral": "Geral",
    "outro": "Outro",
}
CAMPOS = (
    "id", "codigo", "data", "dataPublicacao", "titulo", "sistema", "gravidade", "aplicavel", "escopo",
    "motivoNaoAplicavel", "superior60", "inicio", "fim", "duracaoMin", "horario", "link", "resumo",
    "revisar", "motivoRevisar", "detectadoEm",
)


def log(msg: str) -> None:
    print(msg, flush=True)


def warn(msg: str) -> None:
    print(f"[warn] {msg}", file=sys.stderr, flush=True)


def agora_iso() -> str:
    return dt.datetime.now(TZ).replace(microsecond=0).isoformat()


# ---------------------------------------------------------------------------
# Texto
# ---------------------------------------------------------------------------

def decodificar(raw: bytes, charset: Optional[str] = None) -> str:
    for enc in [c for c in (charset, "utf-8-sig") if c]:
        try:
            texto = raw.decode(enc)
            return texto[1:] if texto.startswith("\ufeff") else texto
        except (LookupError, UnicodeDecodeError):
            continue
    return raw.decode("cp1252", errors="replace")


def texto_limpo(fragmento: str) -> str:
    """HTML -> texto simples: remove scripts/tags, decodifica entidades e junta espaços."""
    s = re.sub(r"<(script|style)\b.*?</\1\s*>", " ", fragmento, flags=re.S | re.I)
    s = re.sub(r"<!--.*?-->", " ", s, flags=re.S)
    s = re.sub(r"<br\s*/?>", " ", s, flags=re.I)
    s = re.sub(r"<[^>]+>", " ", s)
    s = html.unescape(s).replace("\xa0", " ")
    return re.sub(r"\s+", " ", s).strip()


def norm(s: str) -> str:
    """Maiúsculas, sem acentos, travessões viram '-', º/ª viram O/A."""
    s = (s or "").replace("º", "O").replace("°", "O").replace("ª", "A")
    s = unicodedata.normalize("NFKD", s)
    s = "".join(c for c in s if not unicodedata.combining(c))
    s = re.sub(r"[\u2010-\u2015\u2212]", "-", s)
    return re.sub(r"\s+", " ", s).upper().strip()


def parse_data(s: str) -> Optional[dt.date]:
    try:
        d, m, a = (int(x) for x in s.split("/"))
        return dt.date(a, m, d)
    except (ValueError, TypeError):
        return None


def fmt_data(d: dt.date) -> str:
    return d.strftime("%d/%m/%Y")


# ---------------------------------------------------------------------------
# Parsers de HTML
# ---------------------------------------------------------------------------

RE_PAGINACAO = re.compile(r"P[áa]gina\s+(\d+)\s+de\s+(\d+)", re.I)


def parse_lista(html_text: str) -> Tuple[List[Dict[str, object]], Optional[int]]:
    """Devolve (itens, total_de_paginas). Cada item: codigo, data, titulo, previa."""
    itens: List[Dict[str, object]] = []
    blocos = re.split(r'<div\s+class="lista-comunicados"\s*>', html_text)
    for bloco in blocos[1:]:
        m_href = re.search(r'href="[^"]*codigoComunicado=(\d+)[^"]*"[^>]*>(.*?)</a>', bloco, re.S | re.I)
        if not m_href:
            continue
        m_time = re.search(r"<time[^>]*>(.*?)</time>", bloco, re.S | re.I)
        m_prev = re.search(r"<p[^>]*>(.*?)</p>", bloco, re.S | re.I)
        data = texto_limpo(m_time.group(1)) if m_time else ""
        itens.append({
            "codigo": int(m_href.group(1)),
            "data": data if parse_data(data) else None,
            "titulo": texto_limpo(m_href.group(2)),
            "previa": texto_limpo(m_prev.group(1)) if m_prev else "",
        })
    m_pag = RE_PAGINACAO.search(texto_limpo(html_text))
    total = int(m_pag.group(2)) if m_pag else None
    return itens, total


def parse_detalhe(html_text: str) -> Dict[str, Optional[str]]:
    """Extrai título, corpo e data da página de um comunicado."""
    titulo = None
    data = None
    m_bloco = re.search(r'<div\s+class="lista-comunicados"\s*>(.*)', html_text, re.S | re.I)
    if m_bloco:
        bloco = m_bloco.group(1)
        m_t = re.search(r"<time[^>]*>(.*?)</time>", bloco, re.S | re.I)
        if m_t and parse_data(texto_limpo(m_t.group(1))):
            data = texto_limpo(m_t.group(1))
        m_h = re.search(r"<h3[^>]*>(.*?)</h3>", bloco, re.S | re.I)
        if m_h:
            titulo = texto_limpo(m_h.group(1)) or None

    texto = texto_limpo(html_text)
    fim = texto.find(MARCA_FIM)
    if fim < 0:
        fim = len(texto)
    m_ini = None
    candidatos = list(re.finditer(r"Comunicado\s+(\d{2}/\d{2}/\d{4})\s+", texto[:fim]))
    if titulo:
        # o primeiro "Comunicado DD/MM/AAAA" seguido do título (o corpo pode citar um comunicado anterior)
        m_ini = next((m for m in candidatos if texto.startswith(titulo, m.end())), None)
    if m_ini is None:
        m_aviso = texto.find("Aviso de Indisponibilidade de Sistemas", 0, fim)
        if m_aviso >= 0:
            m_ini = next((m for m in candidatos if m.start() > m_aviso), None)
    if m_ini is None and titulo:
        m_ini = next((m for m in candidatos if titulo in texto[m.end():m.end() + len(titulo) + 40]), None)
    if m_ini is None and candidatos:
        m_ini = candidatos[-1]  # sem título reconhecível: o último antes do corpo
    if m_ini:
        trecho = texto[m_ini.end():fim].strip()
        data = data or m_ini.group(1)
    else:
        trecho = ""
    corpo = trecho
    if titulo and trecho.startswith(titulo):
        corpo = trecho[len(titulo):].strip()
    elif titulo and titulo in trecho[: len(titulo) + 40]:
        corpo = trecho[trecho.find(titulo) + len(titulo):].strip()
    return {"titulo": titulo, "corpo": corpo, "data": data}


# ---------------------------------------------------------------------------
# Datas e horários
# ---------------------------------------------------------------------------

RE_TOKEN_DATA = re.compile(
    r"(?<![\d/])(\d{1,2})(?:/(\d{1,2})(?:/(\d{4}|\d{2}))?)?(?![\d/])|(,)|\b(E|A|ATE|AO)\b"
    # hífen/travessão entre duas datas completas é intervalo: "11/01/2017 – 21/01/2017"
    r"|((?:(?<=/\d{4})|(?<=/\d{2}))\s*-\s*(?=\d{1,2}/\d{1,2}/\d{2,4}))"
)


def extrair_datas(texto: str) -> Tuple[List[dt.date], bool]:
    """Datas citadas no texto (normalizado ou não). Devolve (datas, intervalo_truncado).

    Aceita "DD/MM/AAAA", "DD e DD/MM/AAAA", "DD A DD/MM/AAAA" (intervalo),
    "DD, DD e DD/MM/AAAA", "DD/MM e DD/MM/AAAA" e "DD/MM/AAAA a DD/MM/AAAA".
    """
    t = norm(texto)
    corridas: List[List[Tuple[str, object]]] = []
    atual: List[Tuple[str, object]] = []
    ultimo_fim = None
    for m in RE_TOKEN_DATA.finditer(t):
        if ultimo_fim is not None and t[ultimo_fim:m.start()].strip() != "":
            corridas.append(atual)
            atual = []
        if m.group(1):
            d = int(m.group(1))
            mes = int(m.group(2)) if m.group(2) else None
            ano = int(m.group(3)) if m.group(3) else None
            if ano is not None and ano < 100:
                ano += 2000
            atual.append(("num", (d, mes, ano)))
        else:
            atual.append(("sep", "A" if (m.group(5) in ("A", "ATE", "AO") or m.group(6)) else "E"))
        ultimo_fim = m.end()
    if atual:
        corridas.append(atual)

    datas: List[dt.date] = []
    truncado = False
    for corrida in corridas:
        # resolve mês/ano a partir do próximo token à direita que os tenha
        nums = [i for i, (k, _) in enumerate(corrida) if k == "num"]
        resolvidos: Dict[int, dt.date] = {}
        prox_mes = prox_ano = None
        prox_data: Optional[dt.date] = None
        for i in reversed(nums):
            d, mes, ano = corrida[i][1]
            if ano is not None:
                prox_ano, prox_mes = ano, mes
            elif mes is not None and prox_ano is not None:
                prox_mes = mes
            if prox_ano is None:
                continue
            mes_ok = mes if mes is not None else prox_mes
            try:
                data = dt.date(ano if ano is not None else prox_ano, mes_ok, d)
            except (ValueError, TypeError):
                continue
            if ano is None and prox_data is not None and data > prox_data:
                try:
                    data = data.replace(year=data.year - 1)  # "30/12 a 02/01/2027"
                except ValueError:
                    continue
            resolvidos[i] = data
            prox_data = data
        # junta (lista ou intervalo) conforme o separador entre números consecutivos
        validos = [i for i in nums if i in resolvidos]
        for pos, i in enumerate(validos):
            data = resolvidos[i]
            if data not in datas:
                datas.append(data)
            if pos + 1 < len(validos):
                j = validos[pos + 1]
                seps = [v for k, v in corrida[i + 1:j] if k == "sep"]
                if seps and seps[-1] == "A":
                    fim = resolvidos[j]
                    if (fim - data).days > MAX_DIAS_INTERVALO:
                        truncado = True
                        continue
                    d = data + dt.timedelta(days=1)
                    while d < fim:
                        if d not in datas:
                            datas.append(d)
                        d += dt.timedelta(days=1)
    return sorted(datas), truncado


# "10h", "10h25", "10h25m", "10h25min", "10:25", "17:48m", "16:00hs", "22:00hrs", "21:00h", "01h:00", "14 horas"
RE_HORA = re.compile(
    r"(?<![\d/:])(\d{1,2})(?:\s?H(?:RS?|S)?\s?:?(\d{2})?(?:\s?MIN(?:UTOS)?|M\b)?|:(\d{2})(?:\s?H(?:RS?|S)?|M)?"
    r"|\s?(HORAS?)\b)(?![A-Z0-9])"
)
# "N horas" só é horário depois de palavra de início/fim ("das 14 horas", "até as 17 horas", "se encerra às 6 horas")
RE_ANTES_HORAS = re.compile(r"\b(?:DAS?|AS?|A PARTIR DAS?|A PARTIR DE|ATE AS?|ATE|ENTRE|DESDE AS?|ENCERRA AS)\s*$")
# token precedido de palavra de duração ("por cerca de 2h30", "superior a 3h") não é horário
RE_ANTES_DURACAO = re.compile(
    r"\b(?:POR|DURANTE|CERCA DE|SUPERIOR A|INFERIOR A|APROXIMADAMENTE|MAIS DE|MENOS DE|ALEM DE|DE ATE)\s*"
    r"(?:CERCA DE\s*|APROXIMADAMENTE\s*|ATE\s*)?$"
)
# data depois da hora: "10h do mesmo/próprio dia", "10h do dia 23/10/2024", "10h do dia 16" (só o dia)
RE_DIA_APOS_HORA = re.compile(
    r"^\s*(?:HORAS?\s*)?,?\s*(?:(?:DO|NO) (?:MESMO|PROPRIO) DIA"
    r"|(?:DO DIA|NO DIA|DIA|DE|EM)\s+(\d{1,2}(?:/\d{1,2}(?:/\d{2,4})?)?)(?![\d/])"
    # "às 6 horas da próxima segunda-feira (5)": dia da semana com o dia do mês entre parênteses
    r"|(?:DA|DO|NA|NO)\s+(?:PROXIM[AO]\s+)?(?:SEGUNDA|TERCA|QUARTA|QUINTA|SEXTA|SABADO|DOMINGO)(?:-FEIRA)?\s*\(\s*(\d{1,2})\s*\))"
)
# data antes da hora: "no dia 10/04/2024, com início (aproximado) às", "em 16/12/2024 por volta das",
# "de 11/01/2017 – 09h00 a 21/01/2017 - 01h:00", "de 21/11/2016 às 12:30 a 22/11/2016 às 14:00"
RE_DIA_ANTES_HORA = re.compile(
    r"(?:\b(?:DO DIA|NO DIA|DIA|EM)\s+(\d{1,2}/\d{1,2}(?:/\d{2,4})?)\s*,?\s*(?:(?:COM )?INICIO\s*(?:APROXIMADO\s*)?)?"
    r"(?:AS|A PARTIR DAS?|DAS|ATE AS|ENTRE|POR VOLTA DAS)?"
    r"|\b(?:DE|A)\s+(\d{1,2}/\d{1,2}(?:/\d{2,4})?)\s*(?:-|AS))\s*$"
)
# um horário isolado: a última palavra de início/fim que o antecede decide se é início ou fim
RE_PALAVRA_HORA = re.compile(
    r"\b(A PARTIR|DESDE|INICI\w*|PRIMEIRA NOTIFICACAO|DAS|DE|ATE|RESTABELECID\w*|NORMALIZ\w*|RETORN\w*"
    r"|ENCERR\w*|TERMIN\w*|SOLUCIONAD\w*|RESOLVID\w*)\b"
)
RE_PALAVRA_FIM = re.compile(r"ATE|RESTABELECID|NORMALIZ|RETORN|ENCERR|TERMIN|SOLUCIONAD|RESOLVID")


def _data_texto(s: str, ano_ref: Optional[int]) -> Tuple[Optional[dt.date], Optional[int]]:
    """'23/10/2024' -> (data, None); '16' (só o dia) -> (None, 16)."""
    partes = s.split("/")
    if len(partes) == 1:
        return None, int(partes[0])
    d, mes = int(partes[0]), int(partes[1])
    ano = int(partes[2]) if len(partes) > 2 else ano_ref
    if ano is not None and ano < 100:
        ano += 2000
    try:
        return (dt.date(ano, mes, d) if ano else None), None
    except ValueError:
        return None, None


def _data_ilegivel(s: str) -> bool:
    """'18/20/24' (mês 20): a data existe no texto, mas não é uma data válida."""
    partes = s.split("/")
    if len(partes) < 2:
        return False
    try:
        ano = int(partes[2]) if len(partes) > 2 else 2000
        dt.date(ano + 2000 if ano < 100 else ano, int(partes[1]), int(partes[0]))
        return False
    except ValueError:
        return True


def _horas(texto_norm: str, ano_ref: Optional[int]) -> List[Dict[str, object]]:
    achados = []
    for m in RE_HORA.finditer(texto_norm):
        h = int(m.group(1))
        mi = m.group(2) or m.group(3)
        if h > 24 or (mi is not None and int(mi) > 59):
            continue
        if m.group(3) is None and "H" not in m.group(0):
            continue
        antes = texto_norm[max(0, m.start() - 30):m.start()]
        if RE_ANTES_DURACAO.search(antes):
            continue  # duração, não horário
        if m.group(4) and not RE_ANTES_HORAS.search(antes):
            continue  # "3 horas" solto é duração
        raw = f"{m.group(1)}h{mi or ''}" if m.group(3) is None else f"{m.group(1)}h{mi}"
        data = None
        dia_so = None
        mesmo_dia = False
        ilegivel = False
        m_dia = RE_DIA_APOS_HORA.match(texto_norm[m.end():m.end() + 40])
        if m_dia:
            if m_dia.group(1):
                data, dia_so = _data_texto(m_dia.group(1), ano_ref)
                ilegivel = _data_ilegivel(m_dia.group(1))
            elif m_dia.group(2):
                dia_so = int(m_dia.group(2))
            else:
                mesmo_dia = True
        else:
            # "a partir do dia 01/04/2026 às 16h40 até o dia 06/04/2026 às 15:25"
            m_dia = RE_DIA_ANTES_HORA.search(texto_norm[max(0, m.start() - 60):m.start()])
            if m_dia:
                data, dia_so = _data_texto(m_dia.group(1) or m_dia.group(2), ano_ref)
        prefixo = texto_norm[max(0, m.start() - 80):m.start()]
        achados.append({
            "h": h, "m": int(mi or 0), "raw": raw, "data": data, "diaSo": dia_so, "mesmoDia": mesmo_dia,
            "ilegivel": ilegivel, "prefixo": prefixo,
        })
    return achados


def _resolver_dia_so(ini: Optional[Dict[str, object]], fim: Optional[Dict[str, object]]) -> None:
    """'das 10h do dia 16 ... até as 09h do dia 23/10/2024': mês e ano do dia isolado vêm do outro horário."""
    if not (ini and fim):
        return
    if ini["data"] is None and ini.get("diaSo") and fim["data"]:
        ref = fim["data"]
        try:
            d = ref.replace(day=ini["diaSo"])
            if d > ref:
                d = (ref.replace(day=1) - dt.timedelta(days=1)).replace(day=ini["diaSo"])
            ini["data"] = d
        except ValueError:
            pass
    elif fim["data"] is None and fim.get("diaSo") and ini["data"]:
        ref = ini["data"]
        try:
            d = ref.replace(day=fim["diaSo"])
            if d < ref:
                d = (ref.replace(day=28) + dt.timedelta(days=4)).replace(day=fim["diaSo"])
            fim["data"] = d
        except ValueError:
            pass


def extrair_horario(texto: str, ano_ref: Optional[int] = None) -> Dict[str, object]:
    """Início/fim (HH:MM), datas de cada um, duração e texto legível."""
    t = norm(texto)
    horas = _horas(t, ano_ref)
    ini = fim = None
    if len(horas) >= 2:
        ini, fim = horas[0], horas[1]
    elif len(horas) == 1:
        # um só horário: vale a última palavra forte de início/fim que o antecede na mesma frase
        # ("das"/"de" só contam se não houver outra: "restabelecido por volta das 18h30" é fim)
        palavras = RE_PALAVRA_HORA.findall(re.split(r"[.;]", horas[0]["prefixo"])[-1])
        fortes = [p for p in palavras if p not in ("DAS", "DE")]
        if fortes and RE_PALAVRA_FIM.match(fortes[-1]):
            fim = horas[0]
        else:
            ini = horas[0]
    _resolver_dia_so(ini, fim)
    res: Dict[str, object] = {"inicio": None, "fim": None, "dataInicio": None, "dataFim": None, "duracaoMin": None, "horario": None}
    if ini:
        res["inicio"] = f"{ini['h']:02d}:{ini['m']:02d}"
        res["dataInicio"] = ini["data"]
        res["iniRaw"] = ini["raw"]
    if fim:
        res["fim"] = f"{fim['h']:02d}:{fim['m']:02d}"
        res["dataFim"] = ini["data"] if (fim["mesmoDia"] and ini) else fim["data"]
        res["fimRaw"] = fim["raw"]
        if res["dataFim"] is None and fim.get("diaSo"):
            res["diaFimSo"] = fim["diaSo"]  # "6 horas da próxima segunda-feira (5)": mês/ano vêm das datas do comunicado
    if fim and fim.get("ilegivel") and res["dataFim"] is None:
        # "até às 18h20m do dia 18/20/24": o fim é outro dia, ilegível; não supor o mesmo dia
        res["fimIlegivel"] = True
        di = res["dataInicio"]
        res["horario"] = (f"{ini['raw']}" + (f" ({di.strftime('%d/%m')})" if di else "") + " às " if ini else "até ") \
            + f"{fim['raw']} (data ilegível)"
    elif ini and fim:
        d_ini = res["dataInicio"] or res["dataFim"]
        d_fim = res["dataFim"] or res["dataInicio"]
        minutos_ini = ini["h"] * 60 + ini["m"]
        minutos_fim = fim["h"] * 60 + fim["m"]
        if res["dataInicio"] and res["dataFim"]:
            dur = (d_fim - d_ini).days * 1440 + minutos_fim - minutos_ini
        else:
            dur = minutos_fim - minutos_ini
            if dur < 0:
                dur += 1440  # atravessa a meia-noite
                if res["dataInicio"] and not res["dataFim"]:
                    res["dataFim"] = res["dataInicio"] + dt.timedelta(days=1)
                elif res["dataFim"] and not res["dataInicio"]:
                    res["dataInicio"] = res["dataFim"] - dt.timedelta(days=1)
        res["duracaoMin"] = dur if dur >= 0 else None
        di, df = res["dataInicio"], res["dataFim"]
        if di and df and di != df:
            res["horario"] = f"{ini['raw']} ({di.strftime('%d/%m')}) às {fim['raw']} ({df.strftime('%d/%m')})"
        else:
            res["horario"] = f"{ini['raw']} às {fim['raw']}"
    elif ini:
        res["horario"] = f"a partir de {ini['raw']}"
    elif fim:
        res["horario"] = f"até {fim['raw']}"
    return res


# ---------------------------------------------------------------------------
# Classificação
# ---------------------------------------------------------------------------

RE_EPROC = re.compile(r"\bE-?PROC\b")
RE_SAJ_ESTRITO = re.compile(r"\bE-?SAJ\b|\bSAJ\b|\bSAJPG\d*\b")
RE_ESAJ_PORTAL = re.compile(r"\bE-SAJ\b|\bESAJ\b|PORTAL E-?SAJ|SISTEMA E-?SAJ")
RE_SAJ_AMPLO = re.compile(
    r"\bE-?SAJ\b|\bSAJ\b|\bSAJPG\d*\b|PASTA DIGITAL|PETICIONAMENTO ELETRONICO|CONSULTA PROCESSUAL|PORTAL DE SERVICOS"
)
# redação antiga (antes do eproc) que só nomeia o serviço: "Peticionamento Inicial Eletrônico", "Peticionamento de
# RPV", "Consulta de Processos", "download dos autos", "portal de 1ª Instância", "acesso com certificado digital"
RE_SAJ_ANTIGO = re.compile(
    r"PETICIONAMENTO\b|CONSULTA DE PROCESSOS|CONSULTA E PETICIONAMENTO|PORTAL DE [12]A INSTANCIA|INTIMACOES NO PORTAL"
    r"|(?:VISUALIZACAO|DOWNLOAD)[^.;]{0,15}DOS AUTOS|PECAS DIGITAIS|CERTIFICADO DIGITAL"
)
# a partir desta data um comunicado que não cita SAJ nem eproc pode ser de qualquer um dos dois
EPROC_IMPLANTACAO = dt.date(2025, 1, 1)
# "todos os sistemas do Portal e-SAJ", "todos os sistemas SAJ": abrangência de um sistema só
RE_TODOS_DE = re.compile(
    r"TODOS OS (?:SEUS |DEMAIS )?(?:SERVICOS|SISTEMAS)(?: INFORMATIZADOS)? (?:DO |DOS )?(?:PORTA(?:L|IS) )?(E-?SAJ|SAJ|E-?PROC)\b"
)
# geral pela abrangência declarada
RE_GERAL_TOTAL = re.compile(r"TODOS OS SISTEMAS|SISTEMAS DO TRIBUNAL|TODOS OS SERVICOS INFORMATIZADOS")
# geral pela causa (infraestrutura): só quando não nomeia um serviço específico ou diz "todos os serviços"
RE_GERAL_CAUSA = re.compile(r"DATA ?CENTER|\bREDE\b|\bENERGIA\b|LINK DE INTERNET")
RE_TODOS_GENERICO = re.compile(r"TODOS OS (?:DEMAIS )?(?:SERVICOS|SISTEMAS)|SERVICOS ON-?LINE")
RE_SUSPENSAO = re.compile(r"PRAZOS PROCESSUAIS[^.;]{0,40}SUSPENSOS|SUSPENSAO D[OE]S? PRAZOS")
RE_1G = re.compile(
    r"\b1\s*[OA]?\s*(?:GRAUS?|INSTANCIAS?)\b"
    r"|\b1\s*[OA]?\s*(?:,|E|-|/)\s*2\s*[OA]?\s*(?:GRAUS?|INSTANCIAS?)\b"  # "1ª e 2ª Instância", "1º, 2º Grau"
    r"|PRIMEIR[OA] (?:E|,) SEGUND[OA]|PRIMEIRO GRAU|PRIMEIRA INSTANCIA|\bPG5?\b"
)
RE_2G = re.compile(
    r"\b2\s*[OA]?\s*(?:GRAUS?|INSTANCIAS?)\b|SEGUNDO GRAU|SEGUNDA INSTANCIA|\bSG\b|COLEGIO RECURSAL|\bCR\b|TURMAS? RECURSA(?:L|IS)"
    r"|AGRAVOS? DE INSTRUMENTO"  # protocolado direto no Tribunal (2º grau)
)
COMPETENCIAS_FORA = (
    ("EXECUCAO FISCAL", r"EXECUC(?:AO|OES) FISCA(?:L|IS)"),
    ("Execução Criminal/VEC", r"EXECUC(?:AO|OES) CRIMINA(?:L|IS)|\bVEC\b"),
    ("Criminal", r"\bCRIMINA(?:L|IS)\b|JUIZADO ESPECIAL CRIMINAL|\bJECRIM\b"),
    ("Infância e Juventude", r"\bINFANCIA\b"),
    ("Fazenda Pública", r"FAZENDA PUBLICA|JUIZADOS? ESPECIA(?:L|IS) DA FAZENDA"),
    ("Família", r"\bFAMILIA\b"),
    ("Falências", r"\bFALENCIAS?\b"),
    ("Registros Públicos", r"REGISTROS PUBLICOS"),
    ("Militar", r"\bMILITAR\b"),
)
NOMES_COMPETENCIA = {"EXECUCAO FISCAL": "Execução Fiscal"}
RE_COMP_FORA = "|".join(f"(?:{p})" for _, p in COMPETENCIAS_FORA)
RE_JEC_CIVEL = re.compile(r"\bCIVE(?:L|IS)\b|\bJUIZADOS?\b|\bJEC\b|TODAS AS BASES")
RE_EXCLUSIVO = re.compile(r"\b(?:APENAS|SOMENTE|EXCLUSIVAMENTE)\b[^.;]{0,80}?(?:" + RE_COMP_FORA + ")")
RE_BASE_COMP = re.compile(r"\bBASES?\b[^.;]{0,30}?(?:" + RE_COMP_FORA + ")")
RE_CLASSE = re.compile(
    r"PARA A CLASSE|\bCLASSES?\s*:?\s*\d{3,5}\b|CLASSES? (?:PROCESSUA(?:L|IS) )?ESPECIFICAS?|CLASSES PROCESSUAIS AFETADAS"
)
RE_PROCESSOS_ESPECIFICOS = re.compile(
    r"PROCESSOS ESPECIFICOS|PROCESSOS (?:QUE SEGUEM|DA RELACAO|DA LISTAGEM|RELACIONADOS)[^.;]{0,40}ANEXO"
    r"|PROTOCOLOS DOS PROCESSOS DA RELACAO"
)
# base SAJ com sufixo (PG5JM, PG5BF, PG5EF, PG5PP, PG5REG, PG5ARCT) ou PG8; "PG5"/"SG5"/"SAJ/PG5" sozinhos são o
# nome do SAJ de 1º/2º grau, não uma base
RE_BASE_NOMEADA = re.compile(r"\b(?:PG|SG)\d+[A-Z]{2,}\b|\bPG8\b")
# base pela redação, sem código: "processos alocados nas bases GRU, RP e PRECAT", "(BASE: JM E BF)", "Base JM do SAJ"
RE_BASE_ALOCADA = re.compile(r"ALOCAD[OA]S?\s+NAS?\s*:?\s*BASES?\b|\(BASES?\s*:|\bBASES?\s+[A-Z]{2,6}\s+DO SAJ\b")
# a base vem com a lista das localidades: "processos das comarcas: Agudos, Andradina, ...", "Base GRU: Arujá, ...",
# "base PG5JM (Foro Central Cível; Foro Central Juizados ...)", "processos do: Foro Central ... / Foro Central ..."
RE_LISTA_BASE = re.compile(
    r"(?:\bCOMARCAS?|\bFOROS?|\bBASES?\s+[A-Z0-9]{2,8}|\bPROCESSOS\s+D[OA]S?)\s*:\s*[^.:]*?(?:[,;/][^,;/.:]+){3,}"
    r"|\(\s*FOROS?\b[^)]*[;/][^)]*\)"
)
RE_NOMES_BASE = re.compile(r"\bBASES?\s*:?\s+([A-Z]{2,6}(?:\s*(?:,|\bE\b)\s*[A-Z]{2,6}\b)*)\b")
NAO_BASE = {"DE", "DO", "DA", "DOS", "DAS", "NO", "NA", "SAJ", "E", "DADOS", "PARA", "QUE", "COM", "EM"}
RE_LOCAL = re.compile(
    r"\b(?:COMARCAS?|FOROS?(?: REGIONA(?:L|IS)| CENTRA(?:L|IS))?|CIRCUNSCRICA?O(?:ES)?(?: JUDICIARIAS?)?)"
    r"\s+(?:DE|DA|DO|DAS|DOS)\s+[A-Z][A-Z'-]*(?:\s+[A-Z][A-Z'-]*){0,5}"
    r"|\bFORO REGIONAL\b|\bFORO CENTRAL\b"
)
RE_RAJ = re.compile(r"\b(\d{1,2})\s*A?\s*(?:RAJ\b|REGIAO ADMINISTRATIVA JUDICIARIA)|\bRAJ\s*(\d{1,2})\b")
RE_TODO_ESTADO = re.compile(
    r"TODO O ESTADO|TODAS AS COMARCAS|TODOS OS FOROS|\bDO INTERIOR\b|COMARCAS DO ESTADO|FOROS DO ESTADO"
    r"|UNIDADES(?: JUDICIA(?:L|IS)| JUDICIARIAS)? DO ESTADO"
)  # sem "DO ESTADO DE SAO PAULO" solto: aparece em "Tribunal de Justiça do Estado de São Paulo", "PGE"...
# palavra que introduz a localidade como restrição ("apenas na Comarca de X", "unidades da Comarca de X")
RE_LOCAL_RESTRICAO = re.compile(
    r"\b(?:APENAS|SOMENTE|EXCLUSIVAMENTE|NA|NO|NAS|NOS|DA|DO|DAS|DOS|EM|PARA(?:\s+(?:AS|OS|A|O))?)\s*$"
)
# lista fechada de localidades: "para os Foros: ...", "nas seguintes Circunscrições Judiciárias: ..."
RE_LISTA_LOCAL = re.compile(
    r"\b(?:PARA|NAS?|NOS?)\s+(?:AS\s+|OS\s+)?(?:SEGUINTES\s+)?(?:COMARCAS|FOROS|CIRCUNSCRICOES(?: JUDICIARIAS)?)\s*:"
)
RE_LOCAL_EXCECAO = re.compile(r"\b(?:EXCETO|SALVO|EXCECAO|EXCLUIDAS?|EXCLUIDOS?|MENOS)\b[^.;]{0,25}$")
# localidade que descreve infraestrutura, não a abrangência ("Datacenter localizado na Comarca de São Paulo")
RE_LOCAL_INFRA = re.compile(r"(?:DATA ?CENTER|LOCALIZAD[OA]S?|SEDIAD[OA]S?|SITUAD[OA]S?|INSTALAD[OA]S?)\b[^.;]{0,15}$")
RE_MARILIA_EXCLUIDA = re.compile(r"\b(?:EXCETO|SALVO|EXCECAO|EXCLUIDAS?|EXCLUIDOS?)\b[^.;]{0,40}MARILIA")
# integração com a PGE / requisitórios: matéria da Fazenda Pública, fora do JEC Cível
RE_INTEGRACAO_PGE = re.compile(r"INTEGRACAO\b[^.;]{0,60}(?:\bPGE\b|PGE-SP|PROCURADORIA GERAL DO ESTADO)")
RE_REQUISITORIO = re.compile(r"REQUISITORIOS?|\bPETPGREQ\b|\bPETREQ\b|PRECATORIOS?|\bRPV\b")
# requisitório como objeto do peticionamento ("Peticionamento Eletrônico de Requisitório/RPV"): não é serviço geral
RE_REQ_OBJETO = re.compile(r"PETICIONAMENTO[^.;]{0,50}?(?:REQUISITORIO|\bRPV\b|PRECATORIO)")
# serviço usado só por outra instituição (Polícia Civil, prefeituras, MP, Defensoria, Procuradoria, extrajudicial)
RE_INSTITUICAO = re.compile(
    # "279 - Inquérito Policial" numa lista de classes é classe processual, não a integração com a Polícia Civil
    r"POLICIA CIVIL|(?<!\d - )(?<!\d )INQUERITO POLICIAL|PREFEITURAS|INSTITUICOES CONVENIADAS|PORTAL DO EXTRAJUDICIAL|\bPEX\b"
    r"|SISTEMA SIVEC|CENTRAL FACILITADORA|(?<![A-Z])A EQUIPE D[OA]\s+(?:DEFENSORIA|MINISTERIO PUBLICO)"
    r"|\b(?:PARA|PELA|PELO|PELAS|AO|COM)\s+(?:A\s+|O\s+|AS\s+)?(?:EQUIPE D[OA]\s+)?"
    r"(?:DEFENSORIA|MINISTERIO PUBLICO|MP/SP|MPSP|PROCURADORIA)"
)
NOMES_INSTITUICAO = (
    (r"POLICIA CIVIL|INQUERITO POLICIAL", "Polícia Civil/inquérito policial"),
    (r"PREFEITURAS", "prefeituras conveniadas"),
    (r"INSTITUICOES CONVENIADAS", "instituições conveniadas"),
    (r"EXTRAJUDICIAL|\bPEX\b", "extrajudicial"),
    (r"SIVEC", "SIVEC"),
    (r"CENTRAL FACILITADORA", "Central Facilitadora – MP"),
    (r"MINISTERIO PUBLICO|MP/SP|MPSP", "Ministério Público"),
    (r"DEFENSORIA", "Defensoria Pública"),
    (r"PROCURADORIA", "Procuradoria"),
)
# "serviços do Portal (e-SAJ)", não do Portal do Extrajudicial/de Custas/de Internet
RE_SERV_PORTAL = re.compile(r"SERVICOS DO PORTAL(?! D[OE] (?:EXTRAJUDICIAL|CUSTAS|INTERNET))")
# serviço geral das partes (para detectar título e corpo com alcances diferentes)
RE_GERAL_SERV = re.compile(
    r"\bLOGIN\b|\bCONSULTA|PETICIONAMENTO|PASTA DIGITAL|VISUALIZACAO DE AUTOS|PORTAL DE SERVICOS|"
    + RE_SERV_PORTAL.pattern
)
RE_SERVICO_GERAL = re.compile(
    r"\bLOGIN\b|\bCONSULTA|TODOS OS (?:SEUS |DEMAIS )?SERVICOS|PETICIONAMENTO ELETRONICO|PETICIONAMENTO (?:INICIAL|INTERMEDIARIO)\b"
    r"|PASTA DIGITAL|VISUALIZACAO DE AUTOS|PORTAL DE SERVICOS"
)
# classes processuais fora do JEC Cível (criminais, execução fiscal, infância...)
RE_CLASSE_FORA = re.compile(
    r"CRIMIN|\bCRIMES?\b|INQUERITO|FLAGRANTE|TERMO CIRCUNSTANCIADO|INVESTIGATORI|EXECUCAO FISCAL|INFANCIA"
    r"|ATO INFRACIONAL|MEDIDAS? PROTETIVAS?|EXECUCAO DA PENA|ACAO PENAL|HABEAS CORPUS|\bPRISAO\b|CARTA PRECATORIA CRIMINAL"
    r"|PIC-MP|MANDADO DE SEGURANCA CRIMINAL|PEDIDO DE BUSCA E APREENSAO CRIMINAL|RESTITUICAO DE COISAS APREENDIDAS"
)
RE_LISTA_CLASSES = re.compile(
    r"(?:CLASSES? (?:PROCESSUA(?:L|IS) )?AFETADAS?(?: FORAM| SAO| FOI| E)?|PARA AS? CLASSES?)\s*:?\s*(.+?)(?:\.\s|\.$|;|$)"
)
PARADAS_LOCAL = {
    "APRESENTOU", "APRESENTARAM", "ESTA", "ESTAO", "FICOU", "FICARAM", "NO", "NA", "NOS", "NAS", "EM", "PARA",
    "COM", "E", "-", "POR", "SERA", "SERAO", "ENTRE", "QUE", "DEVIDO", "SENDO", "O", "A", "OS", "AS",
    "PORTAL", "SISTEMA", "SISTEMAS", "EPROC", "E-PROC", "E-SAJ", "ESAJ", "SAJ", "INDISPONIBILIDADE",
    "INSTABILIDADE", "PERIODO", "DESDE", "ATE", "DIA", "DURANTE",
}


def _nome_local(trecho: str) -> str:
    """'COMARCA DE CAMPINAS APRESENTOU ...' -> 'COMARCA DE CAMPINAS'."""
    palavras = trecho.split()
    saida: List[str] = []
    for i, w in enumerate(palavras):
        if i >= 3 and (w in PARADAS_LOCAL or len(saida) >= 6):
            break
        saida.append(w)
    return " ".join(saida)


RE_UNIDADES_RESTRITAS = re.compile(r"\b(?:APENAS|SOMENTE|EXCLUSIVAMENTE)\b[^.;]{0,40}\bUNIDADES?\b")


def detectar_sistema(T: str, data_ref: Optional[dt.date] = None) -> Tuple[str, Optional[str]]:
    """Devolve (sistema, observação para revisão ou None). data_ref: data do comunicado (redação antiga = SAJ)."""
    tem_eproc = bool(RE_EPROC.search(T))
    tem_saj = bool(RE_SAJ_ESTRITO.search(T))
    custas = "PORTAL DE CUSTAS" in T or "CUSTAS E RECOLHIMENTOS" in T or "EMISSAO DE GUIAS" in T
    # suspensão de prazos que lista "E-SAJ, Portal de Custas, ...": não é comunicado do Portal de Custas
    if custas and not (RE_SUSPENSAO.search(T) and (tem_eproc or RE_ESAJ_PORTAL.search(T))):
        obs = None
        if tem_eproc or RE_ESAJ_PORTAL.search(T):
            obs = "comunicado do Portal de Custas que também cita eproc/e-SAJ"
        return "custas", obs
    m_todos = RE_TODOS_DE.search(T)
    if m_todos and not (tem_eproc and tem_saj):
        return ("eproc" if "PROC" in m_todos.group(1) else "saj"), None
    antigo = data_ref is None or data_ref < EPROC_IMPLANTACAO
    servico_saj = bool(RE_SAJ_AMPLO.search(T) or (antigo and RE_SAJ_ANTIGO.search(T)))
    m_total = RE_GERAL_TOTAL.search(T)
    if m_total:
        obs = None
        if tem_eproc != tem_saj and "SERVICOS" not in m_total.group(0):
            obs = f"classificado como geral por \"{m_total.group(0).lower()}\", mas o texto cita só {'eproc' if tem_eproc else 'e-SAJ'}"
        return "geral", obs
    if RE_GERAL_CAUSA.search(T) and (RE_TODOS_GENERICO.search(T) or not (tem_eproc or tem_saj or servico_saj)):
        return "geral", None
    if tem_eproc and tem_saj:
        return "geral", None
    if tem_eproc:
        return "eproc", None
    if tem_saj or servico_saj:
        return "saj", None
    if "INDISPONIBILIDADE DE SISTEMAS" in T:
        return "geral", None
    return "outro", None


RE_INF60 = re.compile(r"INFERIOR A (?:60|SESSENTA)|NAO SUPERIOR A (?:60|SESSENTA)")
RE_SUP60 = re.compile(r"(?<!NAO )SUPERIOR A (?:60|SESSENTA|\d+ \(\w+\) HORAS?|\d+ HORAS?|\d+ ?H\b)")


def misto_60(T: str) -> bool:
    """Comunicado que cita serviços inferiores E superiores a 60 minutos."""
    return bool(RE_INF60.search(T)) and bool(RE_SUP60.search(T))


# serviço parcial que não impede o ato processual
RE_PARCIAL_SEMPRE = re.compile(r"COMPLEMENTO DE CADASTRO|RECATEGORIZACAO|NAO CARACTERIZ\w* INDISPONIBILIDADE")
# serviço parcial: informativo quando dura mais de 3 dias seguidos
RE_PARCIAL = re.compile(
    r"ALGUNS USUARIOS|CARTAS? PRECATORIAS?|CONSULTA (?:PROCESSUAL )?NUMERICA|PARA A CLASSE|PROCESSOS ESPECIFICOS"
)
# aviso de manutenção (futuro), não queda já ocorrida
RE_FUTURO = re.compile(r"\b(?:FICARAO|FICARA|ESTARAO|ESTARA|SERAO|SERA|OCORRERA|HAVERA)\b")


def detectar_gravidade(T: str, sistema: str, institucional: bool = False, parcial_longo: bool = False) -> str:
    if "SEVERA" in T:
        return "severa"
    if RE_SUSPENSAO.search(T):
        return "normal"  # suspensão formal de prazos nunca é informativa
    if sistema in ("custas", "outro"):
        return "informativa"
    if institucional:
        return "informativa"  # integração/serviço de uma instituição específica
    if RE_PARCIAL_SEMPRE.search(T) or parcial_longo:
        return "informativa"
    if RE_INF60.search(T) and not RE_SUP60.search(T):
        return "informativa"
    return "normal"  # aviso de manutenção programada: decidido em classificar() pela janela anunciada


def detectar_superior60(T: str) -> Optional[bool]:
    if misto_60(T):
        return None  # parte inferior, parte superior a 60 min: conferir
    if RE_INF60.search(T):
        return False
    if RE_SUP60.search(T):
        return True
    return None


# palavra de competência no nome de um foro dentro de uma lista ("..., Foro das Execuções Fiscais ...",
# "(Foro Central Criminal – Juri; Foro Central Cível; ...)") não é restrição de competência
RE_FORO_COMP = re.compile(
    r"(?:(?<=[,:/;(])|(?<=[,:/;(] ))\s*FOROS?\s+(?:CENTRA(?:L|IS)\s+|REGIONA(?:L|IS)\s+)?(?:-\s*)?(?:D[AO]S?\s+)?"
    r"(?:ESPECIAL\s+D[AO]S?\s+)?(?:" + RE_COMP_FORA + r"|CIVE(?:L|IS))(?:\s*-\s*(?:" + RE_COMP_FORA + r"))?"
    r"(?:[^;.]{0,80}?\bDA COMARCA DE [A-Z]+(?: [A-Z]+)*)?"
)


def _sem_nomes_de_foro(T: str) -> str:
    return RE_FORO_COMP.sub(" ", T)


def _consecutivos(datas: List[dt.date]) -> int:
    """Maior sequência de dias consecutivos."""
    maior = atual = 0
    anterior = None
    for d in sorted(set(datas)):
        atual = atual + 1 if anterior and (d - anterior).days == 1 else 1
        maior = max(maior, atual)
        anterior = d
    return maior


def _instituicoes(T: str) -> List[str]:
    # o trecho que restringe e o que vem logo depois ("para a Defensoria Pública e Ministério Público")
    trechos = " | ".join(T[m.start():m.end() + 40] for m in RE_INSTITUICAO.finditer(T))
    return [nome for padrao, nome in NOMES_INSTITUICAO if re.search(padrao, trechos)]


def _nomes_bases(T: str) -> List[str]:
    nomes: List[str] = []
    for m in RE_NOMES_BASE.finditer(T):
        for n in re.split(r"\s*(?:,|\bE\b)\s*", m.group(1)):
            n = n.strip()
            if n and n not in NAO_BASE and n not in nomes:
                nomes.append(n)
    return nomes


def _competencias_citadas(T: str) -> List[str]:
    nomes = []
    if re.search(r"\bCIVE(?:L|IS)\b", T):
        nomes.append("Cível")
    for nome, padrao in COMPETENCIAS_FORA:
        if re.search(padrao, T):
            nomes.append(NOMES_COMPETENCIA.get(nome, nome))
    return nomes


def _classes_citadas(T: str) -> List[str]:
    """'AS CLASSES PROCESSUAIS AFETADAS FORAM: 271 - X, 272 - Y E 1733 - Z.' -> ['271 - X', '272 - Y', '1733 - Z']."""
    m = RE_LISTA_CLASSES.search(T)
    if not m:
        return []
    partes = re.split(r",\s*|\s+E\s+(?=\d)", m.group(1))
    return [p.strip() for p in partes if re.search(r"[A-Z]{3,}", p)]


def detectar_abrangencia(T: str, T_tit: Optional[str] = None, T_corpo: Optional[str] = None) -> Dict[str, object]:
    """aplicavel (True/False/None), partes do escopo, motivos e se o serviço é de outra instituição.

    T_tit/T_corpo (normalizados) permitem notar título e corpo com alcances diferentes.
    """
    nao: List[str] = []  # motivos de não aplicação
    duvida: List[str] = []  # motivos de revisão (aplicavel = None)
    escopo: List[str] = []
    institucional = False

    # Instância
    c1, c2 = bool(RE_1G.search(T)), bool(RE_2G.search(T))
    if c2 and not c1:
        nao.append("restrito ao 2º grau / Colégio Recursal (somos 1º grau)")
        escopo.append("só 2º grau/Colégio Recursal")
    elif c1 and c2:
        escopo.append("1º e 2º grau")
    elif c1:
        escopo.append("1º grau")

    # Competência / base (sem as palavras de competência que só fazem parte do nome de um foro listado)
    sem_jec = RE_JEC_CIVEL.search(
        re.sub(r"JUIZADOS? ESPECIA(?:L|IS) (?:CRIMINA(?:L|IS)|DA FAZENDA(?: PUBLICA)?)", " ", T)
    ) is None
    T_comp = _sem_nomes_de_foro(T)
    m_excl = RE_EXCLUSIVO.search(T_comp)
    m_base = RE_BASE_COMP.search(T_comp)
    comps = _competencias_citadas(T_comp)
    if m_excl and sem_jec:
        fora = [c for c in comps if c != "Cível"]
        nao.append(f"restrito a competência que não é do JEC Cível ({', '.join(fora)})")
        escopo.append("só " + ", ".join(fora))
    elif m_base and sem_jec:
        fora = [c for c in comps if c != "Cível"]
        duvida.append(f"cita base(s) {', '.join(fora)} sem mencionar Cível/JEC")
        escopo.append("bases " + ", ".join(fora))
    elif "BASE" in T_comp and comps:
        escopo.append("bases " + ", ".join(comps))
    m_classe = RE_CLASSE.search(T)
    if m_classe:
        classes = _classes_citadas(T)
        if classes and all(RE_CLASSE_FORA.search(c) for c in classes):
            nao.append("restrito a classes processuais que não são do JEC Cível (criminais/execução fiscal/infância)")
            escopo.append("só classes criminais/fora do JEC")
        else:
            m_num = re.search(r"CLASSES?\s*:?\s*(\d{3,5})", T)
            duvida.append("restrito a classe processual" + (f" ({m_num.group(1)})" if m_num else "; conferir quais"))
            escopo.append("só classe " + (m_num.group(1) if m_num else "específica"))
    # Serviço/integração de outra instituição (Polícia Civil, prefeituras, MP, Defensoria, Procuradoria...).
    # Título e corpo são testados em separado: se só um deles restringe e o outro cita serviço geral das partes,
    # ou se os dois restringem mas só um cita "serviços do portal", o alcance fica a confirmar.
    Tt = T if T_tit is None else T_tit
    Tc = T if T_corpo is None else T_corpo

    def _inst(x: str) -> bool:
        return bool(RE_INSTITUICAO.search(x) or RE_INTEGRACAO_PGE.search(x))

    inst_t, inst_c = _inst(Tt), _inst(Tc)
    conflito = False
    if inst_t != inst_c:
        conflito = bool(RE_GERAL_SERV.search(Tc if inst_t else Tt))
        if inst_c and not RE_GERAL_SERV.search(Tc):
            conflito = False  # o corpo é taxativo (só o serviço da outra instituição); o título é só a rubrica
    elif inst_t and inst_c:
        conflito = bool(RE_SERV_PORTAL.search(Tt)) != bool(RE_SERV_PORTAL.search(Tc))
    if conflito:
        duvida.append("título e corpo divergem sobre o alcance")
        escopo.append("alcance a confirmar (título x corpo)")
    # Integração com a PGE / requisitórios (Fazenda Pública, fora do JEC Cível)
    elif RE_INTEGRACAO_PGE.search(T) and not re.search(
        r"\bLOGIN\b|\bCONSULTA|PETICIONAMENTO ELETRONICO|PASTA DIGITAL|VISUALIZACAO DE AUTOS", T
    ):
        nao.append("restrito à integração com a PGE (Fazenda Pública), fora do JEC Cível")
        escopo.append("só integração com a PGE")
        institucional = True
    elif RE_INSTITUICAO.search(T):
        nomes = _instituicoes(T)
        outras = [n for n in nomes if n != "SIVEC"]
        if "SIVEC" in nomes:
            nao.append("restrito à execução criminal (SIVEC/VEC), fora do JEC Cível")
            escopo.append("só execução criminal (SIVEC/VEC)")
        if outras or not nomes:
            nao.append("restrito a serviço/integração de outra instituição (" + ", ".join(outras) + ")")
            escopo.append("só " + ", ".join(outras))
        institucional = True
    # requisitório só restringe se não houver serviço geral fora do "peticionamento de requisitório"
    if RE_REQUISITORIO.search(T) and not RE_SERVICO_GERAL.search(RE_REQ_OBJETO.sub(" ", T)):
        nao.append("restrito a requisitórios/precatórios (Fazenda Pública), fora do JEC Cível")
        escopo.append("só requisitórios")
    if RE_PROCESSOS_ESPECIFICOS.search(T):
        duvida.append("restrito a processos específicos/listados em anexo")
        escopo.append("só processos específicos")

    # Base SAJ (código com sufixo ou pela redação). Não se sabe a base de Marília: a confirmar, salvo se o próprio
    # texto listar as comarcas e Marília estiver entre elas.
    tem_marilia = "MARILIA" in T
    bases_nomeadas = sorted(set(RE_BASE_NOMEADA.findall(T)))
    base_redacao = bool(RE_BASE_ALOCADA.search(T))
    lista_marilia = False
    if (bases_nomeadas or base_redacao) and "TODAS AS BASES" not in T:
        nomes_b = bases_nomeadas + [b for b in (_nomes_bases(T) if base_redacao else []) if b not in bases_nomeadas
                                    and not any(n.endswith(b) for n in bases_nomeadas)]
        rotulo = ", ".join(nomes_b) or "não identificadas"
        if tem_marilia and not RE_MARILIA_EXCLUIDA.search(T) and T.count(",") >= 3:
            lista_marilia = True
            escopo.append(f"bases {rotulo} (lista inclui Marília)")
        elif not tem_marilia and RE_LISTA_BASE.search(T):
            # o próprio texto lista as comarcas/foros da base e Marília não está entre eles
            lista_marilia = True  # a localidade já está decidida pela lista; não repetir "cita outra localidade"
            nao.append(f"base(s) {rotulo} restrita(s) às comarcas/foros listados (Marília não está na lista)")
            escopo.append(f"bases {rotulo} (lista sem Marília)")
        else:
            duvida.append(("bases SAJ nomeadas (" if bases_nomeadas else "restrito a bases SAJ (") + rotulo + ")")
            escopo.append("bases " + rotulo)

    # Comarca / foro / região
    rajs: List[int] = []
    for m in RE_RAJ.finditer(T):
        if not RE_LOCAL_EXCECAO.search(T[max(0, m.start() - 40):m.start()]):
            rajs.append(int(m.group(1) or m.group(2)))
    restritos: List[str] = []  # "apenas na Comarca de X", "unidades da Comarca de X"
    mencionados: List[str] = []  # localidade citada sem palavra de restrição
    excecoes: List[str] = []  # "exceto na Comarca de X"
    for m in RE_LOCAL.finditer(T):
        nome = _nome_local(m.group(0).strip())
        if re.search(r"\b(?:ORIGEM|ELEICAO|INSTANCIA|GRAU|ESTADO)\b", nome):
            continue  # "comarca de origem", "foros de primeira instância", "comarcas do Estado"
        antes = T[max(0, m.start() - 40):m.start()]
        if RE_LOCAL_INFRA.search(antes):
            continue  # "Datacenter localizado na Comarca de São Paulo"
        if RE_LOCAL_EXCECAO.search(antes):
            excecoes.append(nome)
            continue
        if "MARILIA" in nome:
            continue
        (restritos if RE_LOCAL_RESTRICAO.search(antes) else mencionados).append(nome)
    if RE_MARILIA_EXCLUIDA.search(T):
        nao.append("Marília expressamente excluída")
        escopo.append("exceto Marília")
    elif lista_marilia:
        pass  # base com lista de localidades: já decidido acima
    elif tem_marilia:
        escopo.append("inclui Marília")
    elif 10 in rajs:
        outros = restritos + mencionados
        if outros:
            duvida.append(f"cita a 10ª RAJ, mas nomeia comarca que não é Marília ({outros[0].lower()})")
            escopo.append("10ª RAJ, " + outros[0].lower())
        else:
            escopo.append("inclui a 10ª RAJ (Marília)")
    elif RE_LISTA_LOCAL.search(T):
        nao.append("restrito às comarcas/foros listados (Marília não está na lista)")
        escopo.append("só comarcas/foros listados")
    elif RE_TODO_ESTADO.search(T):
        escopo.append("todo o Estado")
    elif restritos or rajs:
        alvo = (restritos[0] if restritos else f"{rajs[0]}ª RAJ").lower()
        nao.append(f"restrito a outra localidade ({alvo})")
        escopo.append("só " + alvo)
    elif mencionados:
        alvo = mencionados[0].lower()
        duvida.append(f"cita outra localidade ({alvo}) sem deixar claro se a restringe")
        escopo.append("cita " + alvo)
    elif excecoes:
        escopo.append("todo o Estado, exceto " + excecoes[0].lower())
    elif RE_UNIDADES_RESTRITAS.search(T):
        duvida.append("restrito a algumas unidades, sem dizer quais")
        escopo.append("só algumas unidades")

    if nao:
        aplicavel: Optional[bool] = False
        escopo = [e for e in escopo if not e.startswith("alcance a confirmar")]
    elif duvida:
        aplicavel = None
    else:
        aplicavel = True
    return {"aplicavel": aplicavel, "escopo": escopo, "nao": nao, "duvida": duvida, "institucional": institucional}


SERVICOS = (
    (r"TODOS OS (?:SEUS )?SERVICOS|TODOS OS DEMAIS SERVICOS", "todos os serviços"),
    (r"PETICIONAMENTO ELETRONICO", "peticionamento eletrônico"),
    (r"PETICIONAMENTO(?! ELETRONICO)", "peticionamento"),
    (r"\bCONSULTA", "consulta"),
    (r"\bLOGIN\b", "login"),
    (r"VISUALIZACAO DE AUTOS|PASTA DIGITAL", "visualização de autos"),
    (r"EMISSAO DE GUIAS?[^.;]{0,30}PROCESSOS DO SAJ", "emissão de guias de processos do SAJ"),
    (r"EMISSAO DE GUIAS?[^.;]{0,30}PROCESSOS DO EPROC", "emissão de guias de processos do eproc"),
    (r"EMISSAO DE GUIAS?", "emissão de guias"),
    (r"PROTOCOLO", "protocolo"),
)


def montar_escopo(T: str, sistema: str, partes: List[str]) -> str:
    servicos = []
    for padrao, nome in SERVICOS:
        if re.search(padrao, T) and nome not in servicos:
            servicos.append(nome)
    if "todos os serviços" in servicos:
        servicos = ["todos os serviços"]
    if any(s.startswith("emissão de guias de") for s in servicos):
        servicos = [s for s in servicos if s != "emissão de guias"]
    if "peticionamento eletrônico" in servicos:
        servicos = [s for s in servicos if s != "peticionamento"]
    itens = [SISTEMA_LABEL.get(sistema, sistema)] + partes + ([" e ".join(servicos)] if servicos else [])
    return ", ".join(itens)


def montar_resumo(corpo: str, titulo: str) -> str:
    texto = re.sub(r"\s+", " ", corpo or "").strip()
    m = re.search(r"\bcomunica(?:m)?\s+que\s*,?\s*", texto, re.I)
    if m:
        texto = texto[m.end():]
    texto = re.sub(r"^(?:devido a|em virtude de|por)\s+problemas?\s+de\s+ordem\s+t[ée]cnica\s*,\s*", "", texto, flags=re.I)
    if not texto:
        texto = titulo or ""
    texto = texto[:1].upper() + texto[1:]
    if len(texto) > 600:
        corte = texto.rfind(" ", 0, 597)
        texto = texto[: corte if corte > 0 else 597].rstrip(",;: ") + "…"
    return texto


def link_comunicado(codigo: int) -> str:
    return DETALHE_URL.format(codigo=codigo)


def titulo_sem_data(titulo: str) -> str:
    """Remove a data inicial do título ("21/10/2026 – ...", "23 A 24/07/2026 - ...")."""
    t = re.sub(
        r"^\s*(?:\d{1,2}(?:/\d{1,2})?(?:/\d{2,4})?\s*(?:,|\be\b|\ba\b|\bat[ée]\b|\bao\b)\s*)*\d{1,2}/\d{1,2}(?:/\d{2,4})?\s*[-–—:]*\s*",
        "",
        titulo or "",
        flags=re.I,
    )
    return t.strip() or (titulo or "").strip()


MAX_DIAS_CONTINUACAO = 7  # horário que continua além das datas do título
RE_PROCESSUAL = re.compile(r"PETICION|CONSULTA|PASTA|AUTOS|INTIMAC|PROTOCOLO|LOGIN|PORTAL")
RE_ART8 = re.compile(r"\bART(?:IGO|\.)?\s*8|SUPERIOR A (?:60|SESSENTA)")
# sistemas que não são SAJ nem eproc: "outro" sem dúvida
RE_NAO_PROCESSUAL = re.compile(
    r"\bDJE\b|DIARIO DA JUSTICA|\bPUSH\b|PORTAL DE INTERNET|WWW\.TJSP|SITE (?:DO )?TJSP|EXTRAJUDICIAL|\bSIC\b"
    r"|OUVIDORIA|ESCRITORIO DIGITAL|DEPOSITOS? JUDICIA(?:L|IS)|CERTID(?:AO|OES)|INTRANET|PORTAL DO SERVIDOR"
    r"|MALOTE|\bVPN\b"
)
# duração declarada: "por 01h00m (das 09h00m a 11h30m)", "por, aproximadamente, 1 hora"
RE_DURACAO_DECLARADA = re.compile(
    r"\bPOR\s*,?\s*(?:CERCA DE\s*|APROXIMADAMENTE\s*,?\s*)?(\d{1,2})\s?H(?:ORAS?)?\s?(?:(\d{2})\s?M?(?:IN(?:UTOS)?)?)?"
    r"(?![A-Z0-9])"
)


# retificação anunciada no corpo: "Em retificação ao Comunicado ...", "RETIFICANDO O COMUNICADO DIVULGADO"
RE_RETIFICA_CORPO = re.compile(r"\bRETIFICA\w*\s+(?:AO?\s+|O\s+|DO\s+)?COMUNICADO")
# aviso de manutenção (futuro): "ficarão indisponíveis", "será realizada manutenção"
RE_MANUTENCAO = re.compile(r"\bMANUTENC(?:AO|OES)\b")
RE_NOITE = re.compile(r"\bNOITE\b|\bMADRUGADA\b")
HORA_UTIL = 6 * 60  # Res. 551/2011, art. 8º: das 6h às 24h (6h-23h e 23h-24h) prorroga; a madrugada não conta


def _minutos(hhmm: str) -> int:
    h, m = hhmm.split(":")
    return int(h) * 60 + int(m)


def _janela(hor: Dict[str, object]) -> None:
    """Recalcula duração e texto do horário depois de completar dataInicio/dataFim."""
    di, df = hor["dataInicio"], hor["dataFim"]
    if hor["inicio"] and hor["fim"] and di and df:
        dur = (df - di).days * 1440 + _minutos(hor["fim"]) - _minutos(hor["inicio"])
        hor["duracaoMin"] = dur if dur >= 0 else None
        hor["horario"] = (f"{hor['iniRaw']} ({di.strftime('%d/%m')}) às {hor['fimRaw']} ({df.strftime('%d/%m')})"
                          if di != df else f"{hor['iniRaw']} às {hor['fimRaw']}")
    elif hor["fim"] and df and not hor["inicio"]:
        hor["horario"] = f"até {hor['fimRaw']} ({df.strftime('%d/%m')})"


def _completar_fim(hor: Dict[str, object], datas: List[dt.date], origem: str) -> None:
    """Fim só com o dia do mês ("6 horas da próxima segunda-feira (5)") ou com data ilegível ("18/20/24")."""
    if not datas:
        return
    ref = max(datas)
    if hor.get("diaFimSo") and hor["dataFim"] is None and not hor["inicio"]:
        try:
            d = ref.replace(day=hor["diaFimSo"])
            if d < ref:
                d = (ref.replace(day=28) + dt.timedelta(days=4)).replace(day=hor["diaFimSo"])
        except ValueError:
            d = None
        if d and (d - ref).days <= MAX_DIAS_CONTINUACAO:
            hor["dataFim"] = d
            _janela(hor)
    if hor.get("fimIlegivel"):
        if origem == "titulo" and hor["dataInicio"] and ref > hor["dataInicio"]:
            hor["dataFim"] = ref  # o último dia do título ("30/01/2024 a 19/02/2024")
            hor["fimIlegivel"] = False
            _janela(hor)
        else:
            hor["fim"] = None  # fim em data ilegível: sem fim nem duração; o texto do horário explica


def _cobre_horario_util(hor: Dict[str, object], datas: List[dt.date], T: str) -> bool:
    """A janela anunciada pega algum trecho entre 6h e 24h de um dia útil (segunda a sexta)?"""
    di, df = hor["dataInicio"], hor["dataFim"]
    ini = _minutos(hor["inicio"]) if hor["inicio"] else None
    fim = _minutos(hor["fim"]) if hor["fim"] else None
    trechos: List[Tuple[dt.date, int, int]] = []  # (dia, de, até) em minutos
    if ini is not None and fim is not None and di and df:
        d = di
        while d <= df:
            trechos.append((d, ini if d == di else 0, fim if d == df else 1440))
            d += dt.timedelta(days=1)
    elif ini is not None and fim is not None:
        for d in datas:
            if fim >= ini:
                trechos.append((d, ini, fim))
            else:  # atravessa a meia-noite
                trechos += [(d, ini, 1440), (d + dt.timedelta(days=1), 0, fim)]
    elif fim is not None and df:
        trechos = [(d, 0, 1440) for d in datas if d < df] + [(df, 0, fim)]
    elif ini is not None:
        primeiro = di or (min(datas) if datas else None)
        trechos = [(d, ini if d == primeiro else 0, 1440) for d in datas] or ([(primeiro, ini, 1440)] if primeiro else [])
    elif RE_NOITE.search(T):
        return False  # "durante a noite e madrugada"
    else:
        trechos = [(d, 0, 1440) for d in datas]
    return any(d.weekday() < 5 and max(de, HORA_UTIL) < ate for d, de, ate in trechos)


def classificar(
    titulo: str,
    corpo: str,
    data_listagem: Optional[str],
    codigo: int = 0,
    detectado_em: Optional[str] = None,
) -> List[Dict[str, object]]:
    """Classifica um comunicado e devolve um item por dia afetado (função pura, sem rede)."""
    titulo = re.sub(r"\s+", " ", titulo or "").strip()
    corpo = re.sub(r"\s+", " ", corpo or "").strip()
    T = norm(titulo + " " + corpo)
    T_tit = norm(titulo)
    detectado_em = detectado_em or agora_iso()
    revisar: List[str] = []

    # Datas: título -> corpo -> listagem
    datas, truncado = extrair_datas(titulo)
    origem_datas = "titulo"
    if not datas:
        # ignora datas de publicação/comunicado anterior ("conforme publicação realizada em 05/11/2025") e datas
        # que qualificam o escopo ou uma previsão ("processos distribuídos a partir de 21/2/13", "prevista para 28/2/13")
        corpo_datas = re.sub(
            r"(?:PUBLICAD[OA]|PUBLICACAO|REALIZAD[OA]|DEJESP|COMPLEMENTO|COMUNICADO|DISTRIBUID[OA]S?|AJUIZAD[OA]S?"
            r"|PREVIST[OA])[^.;]{0,30}?\d{1,2}[/-]\d{1,2}[/-]\d{2,4}",
            " ", norm(corpo),
        )
        datas, truncado = extrair_datas(corpo_datas)
        origem_datas = "corpo"
    d_list = parse_data(data_listagem) if data_listagem else None
    ano_ref = datas[-1].year if datas else (d_list.year if d_list else None)
    hor = extrair_horario(titulo + " " + corpo, ano_ref)
    _completar_fim(hor, datas, origem_datas)
    if origem_datas == "titulo" and len(datas) == 1 and d_list == datas[0] and hor["dataInicio"] and hor["dataFim"] \
            and hor["dataFim"] < datas[0] and 0 <= (hor["dataFim"] - hor["dataInicio"]).days <= MAX_DIAS_CONTINUACAO:
        # a data do título é só a da publicação; o corpo dá a janela completa, em dias anteriores ("no período de
        # 24/04/2017 – 18h30min a 24/04/2017-23h40min" num comunicado "25/04/2017 – ..."): vale a janela do corpo
        datas = [hor["dataInicio"] + dt.timedelta(days=i) for i in range((hor["dataFim"] - hor["dataInicio"]).days + 1)]
        origem_datas = "horario"
    if origem_datas == "corpo" and datas and hor["dataInicio"] and hor["dataFim"]:
        d = hor["dataInicio"]
        while d < hor["dataFim"] and (hor["dataFim"] - hor["dataInicio"]).days <= MAX_DIAS_INTERVALO:
            if d not in datas:
                datas.append(d)
            d += dt.timedelta(days=1)
        datas.sort()
    elif origem_datas == "titulo" and datas and hor["dataInicio"] in datas and hor["dataFim"] \
            and hor["dataFim"] > max(datas) and (hor["dataFim"] - hor["dataInicio"]).days <= MAX_DIAS_CONTINUACAO:
        # o corpo detalha a continuação do mesmo evento além do título ("restabelecido às 17h07 do dia 11/03/2025");
        # o último dia fica de fora se terminar até as 6h (a madrugada não conta: Res. 551/2011)
        ultimo = hor["dataFim"]
        if hor["fim"] and hor["fim"] <= "06:00":
            ultimo -= dt.timedelta(days=1)
        d = max(datas) + dt.timedelta(days=1)
        while d <= ultimo:
            datas.append(d)
            d += dt.timedelta(days=1)
        datas.sort()
    # o último dia de uma janela de vários dias que termina até as 6h não ganha item (a madrugada não conta)
    if hor["dataInicio"] and hor["dataFim"] and hor["dataFim"] > hor["dataInicio"] and hor["fim"] \
            and hor["fim"] <= "06:00" and hor["dataFim"] in datas and len(datas) > 1:
        datas.remove(hor["dataFim"])
    # suspensão de prazos: só os dias citados na frase da suspensão (as outras datas são orientações, ex.: DJE)
    if RE_SUSPENSAO.search(T) and datas:
        frases = [f for f in re.split(r"\.(?=\s|$)|;", T) if RE_SUSPENSAO.search(f)]
        dias_sus = {d for f in frases for d in extrair_datas(f)[0]}
        if dias_sus & set(datas) and set(datas) - dias_sus:
            datas = sorted(set(datas) & dias_sus)
    # intervalo maior que 31 dias (no texto das datas ou na janela do horário): só o primeiro dia, para conferir
    if hor["dataInicio"] and hor["dataFim"] and (hor["dataFim"] - hor["dataInicio"]).days > MAX_DIAS_INTERVALO:
        truncado = True
    if truncado and datas:
        datas = [min(datas)]
    if not datas:
        origem_datas = "listagem"
        if d_list:
            datas = [d_list]
            descartadas = extrair_datas(corpo)[0]  # título sem data: as do corpo foram descartadas
            if descartadas:
                revisar.append("datas do corpo só qualificam o escopo, a previsão ou a publicação ("
                               + ", ".join(fmt_data(d) for d in descartadas) + "); usada a data da listagem")
            else:
                revisar.append("nenhuma data no título nem no corpo; usada a data da listagem")
        else:
            revisar.append("nenhuma data encontrada")
    if truncado:
        revisar.append(f"intervalo maior que {MAX_DIAS_INTERVALO} dias: gerado só o primeiro dia; conferir os demais")

    # Sistema, abrangência e gravidade (a gravidade depende da abrangência: serviço de outra instituição)
    data_ref = d_list or (datas[0] if datas else None)
    sistema, obs_sistema = detectar_sistema(T, data_ref)
    abr = detectar_abrangencia(T, T_tit, norm(corpo))
    dur = hor["duracaoMin"]
    longo = _consecutivos(datas) > 3 or (dur is not None and dur > 3 * 1440)
    gravidade = detectar_gravidade(T, sistema, abr["institucional"],
                                   bool(RE_PARCIAL.search(T) or RE_REQ_OBJETO.search(T)) and longo)
    suspensao = bool(RE_SUSPENSAO.search(T))
    # queda de menos de 60 min é informativa, salvo na faixa das 23h às 24h
    if gravidade == "normal" and not suspensao and dur is not None and dur < 60 and not RE_SUP60.search(T) \
            and not ((hor["inicio"] or "") >= "23:00" or (hor["fim"] or "") >= "23:00"):
        gravidade = "informativa"
    # aviso de manutenção programada (futuro): a Res. 551/2011, art. 8º, não distingue a queda programada; se a janela
    # pega horário útil (6h-24h de dia útil) é normal e se confere a prorrogação; só à noite/madrugada ou no fim de
    # semana é informativa
    if gravidade == "normal" and not suspensao and RE_MANUTENCAO.search(T) and RE_FUTURO.search(T):
        if not _cobre_horario_util(hor, datas, T):
            gravidade = "informativa"
        elif not re.search(r"PRORROGA", T):
            revisar.append("manutenção programada: confirmar prorrogação")
    if truncado:
        gravidade = "informativa"  # não se lança mais de um mês de prorrogação sem conferir
    superior60 = detectar_superior60(T)
    if superior60 is None and dur is not None and not misto_60(T):
        superior60 = dur > 60

    # Regras de revisão
    if abr["aplicavel"] is None:
        revisar.extend(abr["duvida"])
    # "outro" só vai para revisão se puder ser SAJ/eproc: serviço processual e não um sistema alheio conhecido
    if sistema == "outro" and abr["aplicavel"] is not False and (RE_PROCESSUAL.search(T) or RE_ART8.search(T)) \
            and not RE_NAO_PROCESSUAL.search(T):
        revisar.append("sistema não identificado (outro)")
    if obs_sistema:
        revisar.append(obs_sistema)
    if gravidade == "severa" and re.search(r"CONFORME ABAIXO|DEMAIS SERVICOS", T) and len(re.findall(r"SEVERA", T)) == 1:
        revisar.append("comunicado misto: 'severa' só em parte dos serviços; conferir quais")
    if misto_60(T):
        revisar.append("comunicado misto: serviços inferiores e superiores a 60 min; conferir quais")
    fora = {d for d in (hor["dataInicio"], hor["dataFim"]) if d and datas and d not in datas}
    if hor["dataFim"] in fora and datas and hor["dataFim"] == max(datas) + dt.timedelta(days=1) \
            and hor["fim"] and hor["fim"] <= "06:00":
        fora.discard(hor["dataFim"])  # madrugada seguinte (0h-6h não prorroga: Res. 551/2011)
    fora = sorted(fora)
    if fora:
        revisar.append("o horário cita data(s) fora das datas do título (" + ", ".join(fmt_data(d) for d in fora) + ")")
    if "RETIFICA" in T_tit or RE_RETIFICA_CORPO.search(norm(corpo)):
        revisar.append("retificação de comunicado anterior")
    if suspensao:
        revisar.append("suspensão de prazos: lançar no calendário de suspensões")
    if _consecutivos(datas) >= 3 and gravidade == "normal" and abr["aplicavel"] is not False and RE_GERAL_SERV.search(T):
        revisar.append("faixa longa de serviço integral (conferir se o TJSP prorrogou mesmo)")
    m_decl = RE_DURACAO_DECLARADA.search(T)
    if m_decl and dur is not None:
        declarada = int(m_decl.group(1)) * 60 + int(m_decl.group(2) or 0)
        if abs(declarada - dur) >= 30:
            revisar.append(f"duração declarada ({declarada} min) diverge da janela ({dur} min)")
    if abr["aplicavel"] is False:
        # não aplicável: só o que muda a leitura do próprio comunicado continua pedindo revisão
        revisar = [m for m in revisar if m.startswith(("retificação", "comunicado misto", "suspensão", "intervalo"))]

    motivo_nao = "; ".join(abr["nao"]) if abr["aplicavel"] is False else None
    escopo = montar_escopo(T, sistema, abr["escopo"])
    data_pub = data_listagem if d_list else None
    if data_pub is None and datas:
        data_pub = fmt_data(datas[-1])
    resumo = montar_resumo(corpo, titulo)
    motivo_revisar = "; ".join(dict.fromkeys(revisar)) or None

    itens = []
    for d in datas or []:
        item = {
            "id": f"tjsp-{codigo}-{d.strftime('%Y%m%d')}",
            "codigo": codigo,
            "data": fmt_data(d),
            "dataPublicacao": data_pub,
            "titulo": titulo,
            "sistema": sistema,
            "gravidade": gravidade,
            "aplicavel": abr["aplicavel"],
            "escopo": escopo,
            "motivoNaoAplicavel": motivo_nao,
            "superior60": superior60,
            "inicio": hor["inicio"],
            "fim": hor["fim"],
            "duracaoMin": dur,
            "horario": hor["horario"],
            "link": link_comunicado(codigo),
            "resumo": resumo,
            "revisar": bool(revisar),
            "motivoRevisar": motivo_revisar,
            "detectadoEm": detectado_em,
        }
        itens.append({k: item[k] for k in CAMPOS})
    return itens


# ---------------------------------------------------------------------------
# Fontes (rede, fixtures) com cache de detalhes
# ---------------------------------------------------------------------------

class Fonte:
    def __init__(self, cache_dir: Optional[pathlib.Path] = None):
        self.cache_dir = cache_dir
        self.requisicoes = 0

    def _cache_path(self, codigo: int) -> Optional[pathlib.Path]:
        return self.cache_dir / f"{codigo}.html" if self.cache_dir else None

    def detalhe(self, codigo: int, permitir_buscar: bool = True) -> str:
        cp = self._cache_path(codigo)
        if cp and cp.exists():
            return cp.read_text(encoding="utf-8")
        if not permitir_buscar:
            raise FileNotFoundError(f"comunicado {codigo} fora do cache")
        texto = self._detalhe(codigo)
        if cp:
            cp.parent.mkdir(parents=True, exist_ok=True)
            cp.write_text(texto, encoding="utf-8")
        return texto

    def lista(self, pagina: int) -> str:  # pragma: no cover - implementado nas subclasses
        raise NotImplementedError

    def _detalhe(self, codigo: int) -> str:  # pragma: no cover
        raise NotImplementedError


class FonteRede(Fonte):
    _ultima = 0.0

    def _baixar(self, url: str) -> str:
        ultimo_erro: Optional[Exception] = None
        for tentativa in range(TENTATIVAS):
            espera = PAUSA - (time.monotonic() - FonteRede._ultima)
            if espera > 0:
                time.sleep(espera)
            try:
                req = urllib.request.Request(url, headers=HEADERS)
                with urllib.request.urlopen(req, timeout=TIMEOUT) as resp:
                    raw = resp.read()
                    charset = resp.headers.get_content_charset()
                self.requisicoes += 1
                texto = decodificar(raw, charset)
                if "Indisponibilidade" not in texto and "comunicado" not in texto.lower():
                    raise ValueError("resposta inesperada (página sem comunicados)")
                return texto
            except (urllib.error.URLError, http.client.HTTPException, socket.timeout, TimeoutError,
                    ConnectionError, ValueError) as exc:
                ultimo_erro = exc
                warn(f"tentativa {tentativa + 1}/{TENTATIVAS} falhou em {url}: {exc}")
                if tentativa + 1 < TENTATIVAS:
                    time.sleep(ESPERAS[min(tentativa, len(ESPERAS) - 1)])
            finally:
                FonteRede._ultima = time.monotonic()
        raise RuntimeError(f"falha ao baixar {url}: {ultimo_erro}")

    def lista(self, pagina: int) -> str:
        return self._baixar(LISTA_URL.format(pagina=pagina))

    def _detalhe(self, codigo: int) -> str:
        return self._baixar(DETALHE_URL.format(codigo=codigo))


class FonteFixtures(Fonte):
    """Modo offline: lista.html (ou lista_p1.html), lista_p<N>.html e det_<codigo>.html."""

    def __init__(self, pasta: pathlib.Path, cache_dir: Optional[pathlib.Path] = None):
        super().__init__(cache_dir)
        self.pasta = pasta
        self.paginas_lidas: List[int] = []

    def _ler(self, nomes: Iterable[str]) -> str:
        for nome in nomes:
            p = self.pasta / nome
            if p.exists():
                self.requisicoes += 1
                return decodificar(p.read_bytes())
        raise FileNotFoundError(f"fixture ausente: {', '.join(nomes)}")

    def lista(self, pagina: int) -> str:
        self.paginas_lidas.append(pagina)
        nomes = ["lista.html", "lista_p1.html"] if pagina == 1 else [f"lista_p{pagina}.html"]
        return self._ler(nomes)

    def _detalhe(self, codigo: int) -> str:
        return self._ler([f"det_{codigo}.html", f"{codigo}.html"])


# ---------------------------------------------------------------------------
# Estado (o próprio JSON) e saída
# ---------------------------------------------------------------------------

def carregar_estado(path: pathlib.Path) -> Dict[str, object]:
    if not path.exists():
        return {"versao": 1, "atualizadoEm": None, "fonte": FONTE, "totalComunicados": 0, "itens": []}
    try:
        dados = json.loads(path.read_text(encoding="utf-8-sig"))
    except (OSError, ValueError) as exc:
        raise SystemExit(f"[error] {path} existe mas não pôde ser lido ({exc}); nada foi alterado")
    if isinstance(dados, list):  # tolera arquivo antigo só com a lista
        dados = {"itens": dados}
    dados.setdefault("versao", 1)
    dados.setdefault("fonte", FONTE)
    dados.setdefault("itens", [])
    return dados


def chave_ordem(item: Dict[str, object]):
    d = parse_data(str(item.get("data") or "")) or dt.date.min
    return (d, int(item.get("codigo") or 0))


def ordenar(itens: List[Dict[str, object]]) -> List[Dict[str, object]]:
    return sorted(itens, key=chave_ordem, reverse=True)


def serializar(estado: Dict[str, object]) -> str:
    return json.dumps(estado, ensure_ascii=False, indent=2) + "\n"


def salvar(path: pathlib.Path, estado: Dict[str, object]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    tmp = path.with_suffix(path.suffix + ".tmp")
    with tmp.open("w", encoding="utf-8", newline="\n") as fp:
        fp.write(serializar(estado))
    os.replace(tmp, path)


def montar_estado(anterior: Dict[str, object], itens: List[Dict[str, object]]) -> Dict[str, object]:
    itens = ordenar(itens)
    mudou = itens != anterior.get("itens")
    return {
        "versao": 1,
        "atualizadoEm": agora_iso() if (mudou or not anterior.get("atualizadoEm")) else anterior.get("atualizadoEm"),
        "fonte": FONTE,
        "totalComunicados": len({int(i["codigo"]) for i in itens}),
        "itens": itens,
    }


def _md(s: object) -> str:
    """Texto raspado -> célula Markdown segura (sem HTML, links nem menções; vira HTML no e-mail)."""
    t = str(s if s is not None else "—")
    t = t.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
    t = t.replace("[", "\\[").replace("]", "\\]").replace("@", "&#64;").replace("`", "\\`")
    return re.sub(r"[\r\n]+", " ", t).replace("|", "\\|")


def _link_md(it: Dict[str, object]) -> str:
    link = str(it.get("link") or "")
    cod = _md(it.get("codigo"))
    if not link.startswith("https://www.tjsp.jus.br/") or re.search(r"[\s()<>]", link):
        return cod
    return f"[{cod}]({link})"


def gerar_markdown(novos: List[Dict[str, object]], limite: int = 60) -> str:
    novos = ordenar(novos)
    linhas = ["## Novas indisponibilidades publicadas pelo TJSP", ""]
    a_revisar = [i for i in novos if i.get("revisar")]
    if a_revisar:
        linhas.append(f"> ⚠️ **precisa de revisão**: {len(a_revisar)} item(ns) marcados abaixo.")
        linhas.append("")
    linhas.append("| Data | Sistema | Gravidade | Aplicável (JEC Marília, 1º grau) | Horário | Revisar | Comunicado |")
    linhas.append("|---|---|---|---|---|---|---|")
    for it in novos[:limite]:
        apl = {True: "sim", False: "não", None: "a confirmar"}[it.get("aplicavel")]
        if it.get("aplicavel") is False and it.get("motivoNaoAplicavel"):
            apl += f" ({it['motivoNaoAplicavel']})"
        rev = f"⚠️ precisa de revisão: {it['motivoRevisar']}" if it.get("revisar") else "não"
        linhas.append(
            "| " + " | ".join([
                _md(it.get("data")),
                _md(SISTEMA_LABEL.get(str(it.get("sistema")), it.get("sistema"))),
                _md(it.get("gravidade")),
                _md(apl),
                _md(it.get("horario")),
                _md(rev),
                _link_md(it),
            ]) + " |"
        )
    if len(novos) > limite:
        linhas.append("")
        linhas.append(f"… e mais {len(novos) - limite} item(ns); veja data/indisponibilidades.json.")
    linhas.append("")
    linhas.append("### Títulos")
    vistos = set()
    for it in novos[:limite]:
        if it["codigo"] in vistos:
            continue
        vistos.add(it["codigo"])
        linhas.append(f"- **{_md(it.get('titulo'))}** — {_md(it.get('escopo'))}")
    linhas.append("")
    linhas.append(marca_codigos(novos))
    linhas.append("")
    linhas.append("_Gerado automaticamente pelo robô de indisponibilidades (classificação heurística; confira o comunicado)._")
    return "\n".join(linhas) + "\n"


def marca_codigos(novos: List[Dict[str, object]]) -> str:
    """Linha estável com os códigos dos comunicados; o workflow a usa para não repetir a Issue."""
    cods = sorted({int(i["codigo"]) for i in novos})
    return "Comunicados: " + ", ".join(str(c) for c in cods)


def titulo_resumo(novos: List[Dict[str, object]]) -> str:
    if not novos:
        return ""
    # destaca o item mais relevante: severa > afeta prazo > mais recente
    def relevancia(i: Dict[str, object]):
        afeta = i.get("aplicavel") is not False and i.get("gravidade") != "informativa"
        return (i.get("gravidade") == "severa" and afeta, afeta) + chave_ordem(i)

    primeiro = max(novos, key=relevancia)
    t = (
        f"Indisponibilidade TJSP: {primeiro['data']} "
        f"{SISTEMA_LABEL.get(str(primeiro['sistema']), primeiro['sistema'])} ({primeiro['gravidade']})"
    )
    outros = len({i["codigo"] for i in novos}) - 1
    if outros > 0:
        t += f" e mais {outros}"
    return re.sub(r"[\r\n]+", " ", t)


def escrever_github_output(novos: List[Dict[str, object]]) -> None:
    destino = os.environ.get("GITHUB_OUTPUT")
    if not destino:
        return
    with open(destino, "a", encoding="utf-8") as fp:
        fp.write(f"novos={len(novos)}\n")
        fp.write(f"comunicados={len({i['codigo'] for i in novos})}\n")
        fp.write(f"revisar={sum(1 for i in novos if i.get('revisar'))}\n")
        fp.write(f"marca={marca_codigos(novos) if novos else ''}\n")
        fp.write(f"titulo={titulo_resumo(novos)}\n")


# ---------------------------------------------------------------------------
# Firestore (opcional)
# ---------------------------------------------------------------------------

def _valor_firestore(v: object) -> Dict[str, object]:
    if v is None:
        return {"nullValue": None}
    if isinstance(v, bool):
        return {"booleanValue": v}
    if isinstance(v, int):
        return {"integerValue": str(v)}
    if isinstance(v, dt.datetime):
        return {"timestampValue": v.astimezone(dt.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")}
    return {"stringValue": str(v)}


def documento_firestore(item: Dict[str, object]) -> Dict[str, object]:
    campos = {
        "startDate": item["data"],
        "endDate": None,
        "description": titulo_sem_data(str(item.get("titulo") or "")),
        "type": "severa" if item.get("gravidade") == "severa" else "indisponibilidade",
        "informativa": item.get("gravidade") == "informativa",
        "sistema": item.get("sistema"),
        "gravidade": item.get("gravidade"),
        "aplicavel": item.get("aplicavel"),
        "escopo": item.get("escopo"),
        "revisar": bool(item.get("revisar")),
        "link": item.get("link"),
        "codigo": int(item.get("codigo") or 0),
        "horario": item.get("horario"),
        "origem": "tjsp-robo",
        "author": "robo-tjsp",
        "createdAt": dt.datetime.now(dt.timezone.utc),
    }
    return {"fields": {k: _valor_firestore(v) for k, v in campos.items()}}


FIRESTORE_JANELA_DIAS = 30  # só itens recentes viram doc: os apps leem a coleção events inteira a cada visita


def itens_para_firestore(itens: List[Dict[str, object]], hoje: Optional[dt.date] = None) -> List[Dict[str, object]]:
    """Só os itens dos últimos FIRESTORE_JANELA_DIAS dias (a carga histórica fica apenas no JSON)."""
    hoje = hoje or dt.datetime.now(TZ).date()
    limite = hoje - dt.timedelta(days=FIRESTORE_JANELA_DIAS)
    saida = []
    for it in itens:
        d = parse_data(str(it.get("data") or ""))
        if d and d >= limite:
            saida.append(it)
    return saida


def _sessao_firestore() -> Optional[Tuple[str, Dict[str, str]]]:
    """(URL base da coleção events, cabeçalhos com token) ou None se o sync estiver desativado."""
    bruto = os.environ.get("FIREBASE_SERVICE_ACCOUNT", "").strip()
    if not bruto:
        log("[info] sync Firestore desativado (FIREBASE_SERVICE_ACCOUNT ausente)")
        return None
    try:
        from google.auth.transport.requests import Request as GoogleRequest
        from google.oauth2 import service_account
    except ImportError:
        warn("sync Firestore: instale google-auth e requests (pip install google-auth requests); pulado")
        return None
    try:
        info = json.loads(bruto)
        cred = service_account.Credentials.from_service_account_info(
            info, scopes=["https://www.googleapis.com/auth/datastore"]
        )
        cred.refresh(GoogleRequest())
    except Exception as exc:  # noqa: BLE001
        warn(f"sync Firestore: credencial inválida ({exc}); pulado")
        return None
    projeto = os.environ.get("FIRESTORE_PROJECT", "calendariojec")
    base = f"https://firestore.googleapis.com/v1/projects/{projeto}/databases/(default)/documents/events"
    return base, {"Authorization": f"Bearer {cred.token}", "Content-Type": "application/json"}


def sync_firestore(itens: List[Dict[str, object]], hoje: Optional[dt.date] = None) -> int:
    """Cria em events/<id> os itens recentes que ainda não existem. Nunca sobrescreve. Devolve quantos criou."""
    if not os.environ.get("FIREBASE_SERVICE_ACCOUNT", "").strip():
        log("[info] sync Firestore desativado (FIREBASE_SERVICE_ACCOUNT ausente)")
        return 0
    recentes = itens_para_firestore(itens, hoje)
    if len(recentes) < len(itens):
        log(f"[info] sync Firestore: {len(itens) - len(recentes)} item(ns) com mais de {FIRESTORE_JANELA_DIAS} dias ficam só no JSON")
    if not recentes:
        log("[info] sync Firestore: nada a enviar")
        return 0
    sessao = _sessao_firestore()
    if not sessao:
        return 0
    base, auth = sessao
    criados = 0
    for item in recentes:
        url = f"{base}/{urllib.parse.quote(str(item['id']), safe='')}"
        try:
            urllib.request.urlopen(urllib.request.Request(url, headers=auth), timeout=60).close()
            continue  # já existe: não mexe
        except urllib.error.HTTPError as exc:
            if exc.code != 404:
                warn(f"sync Firestore: GET {item['id']} -> HTTP {exc.code}; pulado")
                continue
        except Exception as exc:  # noqa: BLE001
            warn(f"sync Firestore: GET {item['id']} falhou ({exc}); pulado")
            continue
        corpo = json.dumps(documento_firestore(item)).encode("utf-8")
        req = urllib.request.Request(url + "?currentDocument.exists=false", data=corpo, headers=auth, method="PATCH")
        try:
            urllib.request.urlopen(req, timeout=60).close()
            criados += 1
        except urllib.error.HTTPError as exc:
            detalhe = exc.read().decode("utf-8", errors="ignore")
            if exc.code in (409, 412) or "FAILED_PRECONDITION" in detalhe or "ALREADY_EXISTS" in detalhe:
                continue
            warn(f"sync Firestore: PATCH {item['id']} -> HTTP {exc.code}: {detalhe[:200]}")
        except Exception as exc:  # noqa: BLE001
            warn(f"sync Firestore: PATCH {item['id']} falhou ({exc})")
    log(f"[ok] sync Firestore: {criados} documento(s) criado(s)")
    return criados


def e_copia_do_robo(doc: Dict[str, object]) -> bool:
    """Doc do Firestore (formato REST) criado pelo robô e nunca ajustado à mão no Calendário."""
    campos = doc.get("fields") or {}
    origem = (campos.get("origem") or {}).get("stringValue")
    return origem == "tjsp-robo" and "overrideOf" not in campos and "hidden" not in campos


def remover_firestore(ids: List[str]) -> int:
    """Apaga events/<id> de ids que sumiram do JSON (ex.: --reprocessar mudou as datas de um comunicado).

    Só apaga cópia automática do robô; ajuste humano (overrideOf/hidden) é preservado. Devolve quantos apagou.
    """
    if not ids:
        return 0
    sessao = _sessao_firestore()
    if not sessao:
        return 0
    base, auth = sessao
    apagados = 0
    for doc_id in ids:
        url = f"{base}/{urllib.parse.quote(str(doc_id), safe='')}"
        try:
            with urllib.request.urlopen(urllib.request.Request(url, headers=auth), timeout=60) as resp:
                doc = json.loads(resp.read().decode("utf-8"))
        except urllib.error.HTTPError as exc:
            if exc.code != 404:
                warn(f"sync Firestore: GET {doc_id} -> HTTP {exc.code}; não removido")
            continue
        except Exception as exc:  # noqa: BLE001
            warn(f"sync Firestore: GET {doc_id} falhou ({exc}); não removido")
            continue
        if not e_copia_do_robo(doc):
            log(f"[info] sync Firestore: {doc_id} tem ajuste manual; mantido")
            continue
        alvo = url + "?" + urllib.parse.urlencode({"currentDocument.updateTime": doc.get("updateTime", "")})
        try:
            urllib.request.urlopen(urllib.request.Request(alvo, headers=auth, method="DELETE"), timeout=60).close()
            apagados += 1
        except Exception as exc:  # noqa: BLE001
            warn(f"sync Firestore: DELETE {doc_id} falhou ({exc})")
    log(f"[ok] sync Firestore: {apagados} cópia(s) antiga(s) do robô removida(s)")
    return apagados


# ---------------------------------------------------------------------------
# Execução
# ---------------------------------------------------------------------------

def processar_codigo(fonte: Fonte, codigo: int, titulo_lista: str, data_lista: Optional[str],
                     detectado_em: Optional[str], so_cache: bool = False) -> List[Dict[str, object]]:
    html_det = fonte.detalhe(codigo, permitir_buscar=not so_cache)
    det = parse_detalhe(html_det)
    if not det["titulo"] and not det["corpo"]:
        cp = fonte._cache_path(codigo)
        if cp and cp.exists():
            cp.unlink()  # página de erro no cache: tenta de novo na próxima execução
        raise ValueError("página de detalhe sem título nem corpo")
    titulo = det["titulo"] or titulo_lista
    corpo = det["corpo"] or ""
    return classificar(titulo, corpo, data_lista or det["data"], codigo, detectado_em)


def executar(args: argparse.Namespace) -> Dict[str, object]:
    saida = pathlib.Path(args.saida)
    cache_dir = pathlib.Path(args.cache_dir) if args.cache_dir else None
    fonte: Fonte = FonteFixtures(pathlib.Path(args.fixtures_dir), cache_dir) if args.fixtures_dir else FonteRede(cache_dir)
    inicio = time.monotonic()
    limite_seg = args.limite_minutos * 60 if args.limite_minutos else None

    texto_original = saida.read_text(encoding="utf-8") if saida.exists() else ""
    estado = carregar_estado(saida)
    por_id: Dict[str, Dict[str, object]] = {str(i["id"]): dict(i) for i in estado["itens"]}
    detectado_por_codigo: Dict[int, str] = {}
    for it in estado["itens"]:
        c = int(it["codigo"])
        d = it.get("detectadoEm")
        if d and (c not in detectado_por_codigo or d < detectado_por_codigo[c]):
            detectado_por_codigo[c] = d
    codigos_antes = set(detectado_por_codigo) | {int(i["codigo"]) for i in estado["itens"]}
    codigos_vistos = set(codigos_antes)
    novos_ids: List[str] = []
    processados = 0

    def gravar_parcial() -> None:
        if not args.dry_run:
            salvar(saida, montar_estado(estado, list(por_id.values())))

    def substituir(codigo: int, itens_novos: List[Dict[str, object]]) -> None:
        antigos = {i: v for i, v in por_id.items() if int(v["codigo"]) == codigo}
        for i in antigos:
            del por_id[i]
        for it in itens_novos:
            if it["id"] in antigos and antigos[it["id"]].get("detectadoEm"):
                it["detectadoEm"] = antigos[it["id"]]["detectadoEm"]
            elif codigo in detectado_por_codigo:
                it["detectadoEm"] = detectado_por_codigo[codigo]
            por_id[str(it["id"])] = it

    # --reprocessar: reclassifica o que já está no JSON a partir do cache (busca o que faltar)
    if args.reprocessar:
        pubs = {}
        titulos = {}
        for it in estado["itens"]:
            pubs.setdefault(int(it["codigo"]), it.get("dataPublicacao"))
            titulos.setdefault(int(it["codigo"]), it.get("titulo") or "")
        for codigo in sorted(pubs, reverse=True):
            try:
                itens = processar_codigo(fonte, codigo, titulos[codigo], pubs[codigo],
                                         detectado_por_codigo.get(codigo))
            except Exception as exc:  # noqa: BLE001
                warn(f"reprocessar {codigo}: {exc}; mantida a classificação anterior")
                continue
            if itens:
                substituir(codigo, itens)
        log(f"[ok] reprocessados {len(pubs)} comunicado(s)")

    pagina = 1
    total_paginas: Optional[int] = None
    interrompido = False
    while True:
        if limite_seg and time.monotonic() - inicio > limite_seg:
            warn("limite de tempo atingido; salvando o que foi obtido")
            interrompido = True
            break
        try:
            itens_lista, total = parse_lista(fonte.lista(pagina))
        except Exception as exc:  # noqa: BLE001
            warn(f"não foi possível ler a página {pagina} da listagem: {exc}")
            print(f"::warning::Listagem do TJSP indisponível (página {pagina}): {exc}")
            break
        total_paginas = total or total_paginas
        if not itens_lista:
            log(f"[info] página {pagina} sem comunicados")
            break
        ja_vistos = sum(1 for i in itens_lista if i["codigo"] in codigos_vistos)
        for item in itens_lista:
            codigo = int(item["codigo"])
            if codigo in codigos_vistos:
                continue
            if limite_seg and time.monotonic() - inicio > limite_seg:
                interrompido = True
                break
            try:
                itens = processar_codigo(fonte, codigo, str(item["titulo"]), item["data"], None)
            except Exception as exc:  # noqa: BLE001
                warn(f"comunicado {codigo} ignorado nesta execução: {exc}")
                continue
            if not itens:
                warn(f"comunicado {codigo} sem datas; ignorado")
                continue
            substituir(codigo, itens)
            novos_ids.extend(str(i["id"]) for i in itens)
            codigos_vistos.add(codigo)
            processados += 1
            log(f"[novo] {codigo} {itens[0]['data']} {itens[0]['sistema']}/{itens[0]['gravidade']}: {item['titulo']}")
            if processados % SALVAR_A_CADA == 0:
                gravar_parcial()
        if interrompido:
            warn("limite de tempo atingido; salvando o que foi obtido")
            break
        log(f"[ok] página {pagina}/{total_paginas or '?'}: {len(itens_lista)} comunicados, {ja_vistos} já conhecidos")
        if args.todas:
            if total_paginas and pagina >= total_paginas:
                break
        else:
            if ja_vistos > 0 and pagina >= 1 and ja_vistos == len(itens_lista):
                break  # parada antecipada: página inteira já conhecida
            if pagina >= args.paginas:
                # todos novos e já havia estado: pode haver mais novidades na página seguinte
                if not (codigos_antes and ja_vistos == 0 and pagina < args.paginas + MAX_PAGINAS_EXTRA):
                    break
            if total_paginas and pagina >= total_paginas:
                break
        pagina += 1

    novo_estado = montar_estado(estado, list(por_id.values()))
    novos = [por_id[i] for i in dict.fromkeys(novos_ids) if i in por_id]
    removidos = sorted({str(i["id"]) for i in estado["itens"]} - set(por_id))
    if removidos:
        log(f"[info] {len(removidos)} id(s) saíram do JSON: {', '.join(removidos[:10])}")
    alterado = serializar(novo_estado) != texto_original
    if args.dry_run:
        log(f"[dry-run] {len(novos)} item(ns) novo(s); {len(novo_estado['itens'])} no total; arquivo não gravado")
        for it in ordenar(novos):
            log(f"  {it['id']} {it['sistema']}/{it['gravidade']} aplicavel={it['aplicavel']} "
                f"horario={it['horario']} revisar={it['revisar']} {it['motivoRevisar'] or ''}")
    else:
        if alterado:
            salvar(saida, novo_estado)
            log(f"[ok] {saida}: {len(novo_estado['itens'])} itens ({len(novos)} novos)")
        else:
            log(f"[ok] {saida}: sem mudanças")
        if args.novos_md:
            pathlib.Path(args.novos_md).write_text(gerar_markdown(novos) if novos else "", encoding="utf-8")
        if args.novos_json:
            pathlib.Path(args.novos_json).write_text(json.dumps(novos, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        sync_firestore(novos)
        # ids que sumiram do JSON (reprocessamento mudou as datas): a cópia antiga do robô no Firestore
        # deixaria de casar com o JSON e voltaria a contar no /prazo como lançamento avulso
        if removidos and os.environ.get("FIREBASE_SERVICE_ACCOUNT", "").strip():
            remover_firestore(removidos)
    escrever_github_output(novos)
    return {"novos": novos, "estado": novo_estado, "interrompido": interrompido, "fonte": fonte,
            "removidos": removidos}


def parse_args(argv: Optional[List[str]] = None) -> argparse.Namespace:
    p = argparse.ArgumentParser(description="Robô de indisponibilidades do TJSP")
    p.add_argument("--paginas", type=int, default=1, help="páginas da listagem a varrer (padrão 1)")
    p.add_argument("--todas", action="store_true", help="varre até a última página (carga histórica)")
    p.add_argument("--saida", default=SAIDA_PADRAO, help=f"arquivo JSON (padrão {SAIDA_PADRAO})")
    p.add_argument("--novos-md", help="escreve um Markdown com os itens novos (Issue/e-mail)")
    p.add_argument("--novos-json", help="escreve um JSON com os itens novos (para o passo do Firestore)")
    p.add_argument("--reprocessar", action="store_true", help="reclassifica tudo a partir do cache de HTML")
    p.add_argument("--cache-dir", default=CACHE_PADRAO, help=f"cache dos HTML de detalhe (padrão {CACHE_PADRAO}; '' desativa)")
    p.add_argument("--fixtures-dir", help="modo offline: lê lista*.html e det_<codigo>.html desta pasta")
    p.add_argument("--limite-minutos", type=float, default=0, help="para com segurança depois de N minutos (0 = sem limite)")
    p.add_argument("--sincronizar-firestore", metavar="NOVOS_JSON", help="só envia ao Firestore os itens do arquivo e sai")
    p.add_argument("--dry-run", action="store_true", help="não grava o JSON nem o Markdown")
    args = p.parse_args(argv)
    if args.paginas < 1:
        p.error("--paginas deve ser >= 1")
    return args


def main(argv: Optional[List[str]] = None) -> int:
    for stream in (sys.stdout, sys.stderr):
        try:
            stream.reconfigure(encoding="utf-8", errors="replace")
        except (AttributeError, ValueError):
            pass
    args = parse_args(argv)
    if args.sincronizar_firestore:
        caminho = pathlib.Path(args.sincronizar_firestore)
        itens = json.loads(caminho.read_text(encoding="utf-8")) if caminho.exists() and caminho.stat().st_size else []
        sync_firestore(itens)
        return 0
    executar(args)
    return 0


if __name__ == "__main__":
    sys.exit(main())
