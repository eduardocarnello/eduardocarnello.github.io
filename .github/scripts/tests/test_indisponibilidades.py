"""Testes do robô de indisponibilidades (offline, com as fixtures reais do TJSP)."""
import json
import pathlib
import shutil

import pytest

import fetch_indisponibilidades as robo

FIX = pathlib.Path(__file__).resolve().parent / "fixtures"
DET_CODIGOS = [80438, 80432, 79261, 77051, 75622, 75582, 73857, 73099, 72897, 72063]


def ler(nome):
    return robo.decodificar((FIX / nome).read_bytes())


def classificar_fixture(codigo, data_listagem):
    det = robo.parse_detalhe(ler(f"det_{codigo}.html"))
    return robo.classificar(det["titulo"], det["corpo"], data_listagem, codigo, "2026-10-23T09:00:00-03:00")


# ---------------------------------------------------------------------------
# Listagem
# ---------------------------------------------------------------------------

def test_lista_pagina_1():
    itens, total = robo.parse_lista(ler("lista.html"))
    assert total == 48
    assert [i["codigo"] for i in itens] == DET_CODIGOS
    assert itens[0]["data"] == "21/10/2026"
    assert itens[0]["titulo"] == "21/10/2026 – PORTAL DE CUSTAS - INDISPONIBILIDADE DOS SERVIÇOS"
    assert itens[4]["data"] == "26/08/2026"
    assert all("&#" not in i["titulo"] for i in itens)


def test_lista_pagina_2_e_48():
    itens, total = robo.parse_lista(ler("lista_p2.html"))
    assert total == 48 and len(itens) == 10 and itens[0]["codigo"] == 72026
    itens, total = robo.parse_lista(ler("lista_p48.html"))
    assert total == 48
    assert itens[-1]["codigo"] == 2635
    assert itens[-1]["data"] == "31/08/2012"
    assert itens[-1]["titulo"] == "Indisponibilidade do sistema de Peticionamento Eletrônico"


def test_lista_vazia():
    itens, total = robo.parse_lista(ler("busca_severa.html"))
    assert itens == [] and total is None


# ---------------------------------------------------------------------------
# Detalhe
# ---------------------------------------------------------------------------

@pytest.mark.parametrize("codigo", DET_CODIGOS)
def test_parse_detalhe(codigo):
    det = robo.parse_detalhe(ler(f"det_{codigo}.html"))
    assert det["titulo"] and "INDISPONIBILIDADE" in det["titulo"].upper()
    assert det["corpo"].startswith("Para os fins do artigo 8º")
    assert "&#" not in det["corpo"] and "cookies" not in det["corpo"]
    assert robo.parse_data(det["data"])


def test_parse_detalhe_80432():
    det = robo.parse_detalhe(ler("det_80432.html"))
    assert det["titulo"] == "21/10/2026– INDISPONIBILIDADE DOS SERVIÇOS DO PORTAL EPROC"
    assert det["data"] == "21/10/2026"
    assert det["corpo"].endswith("sendo restabelecido o serviço às 16h do mesmo dia.")


# ---------------------------------------------------------------------------
# Tabela de exemplos reais da especificação
# ---------------------------------------------------------------------------

TABELA = [
    # codigo, listagem, sistema, gravidade, datas, inicio, fim, horario, duracao, revisar
    (80438, "21/10/2026", "custas", "informativa", ["21/10/2026"], "12:00", "15:30", "12h00 às 15h30", 210, False),
    (80432, "21/10/2026", "eproc", "normal", ["21/10/2026"], "12:00", "16:00", "12h00 às 16h", 240, False),
    (79261, "05/10/2026", "saj", "normal", ["05/10/2026"], "15:15", "17:05", "15h15 às 17h05", 110, False),
    (77051, "09/09/2026", "eproc", "normal", ["09/09/2026"], None, None, None, None, False),
    (75622, "26/08/2026", "custas", "informativa", ["26/08/2026", "25/08/2026"], "09:56", "10:00",
     "09h56 (25/08) às 10h00 (26/08)", 1444, False),
    (75582, "25/08/2026", "custas", "informativa", ["24/08/2026"], "09:24", "16:30", "09h24 às 16h30", 426, False),
    (73857, "04/08/2026", "custas", "informativa", ["04/08/2026"], "09:41", "14:39", "09h41 às 14h39", 298, False),
    (73099, "24/07/2026", "saj", "severa", ["24/07/2026", "23/07/2026"], "22:40", "13:30",
     "22h40 (23/07) às 13h30 (24/07)", 890, True),
    (72897, "23/07/2026", "saj", "normal", ["23/07/2026", "22/07/2026"], "23:00", "09:48",
     "23h00 (22/07) às 09h48 (23/07)", 648, False),
    (72063, "14/07/2026", "saj", "normal", ["14/07/2026"], "09:50", "12:00", "9h50 às 12h00", 130, False),
]


@pytest.mark.parametrize("codigo,listagem,sistema,gravidade,datas,inicio,fim,horario,duracao,revisar", TABELA)
def test_tabela_exemplos(codigo, listagem, sistema, gravidade, datas, inicio, fim, horario, duracao, revisar):
    itens = robo.ordenar(classificar_fixture(codigo, listagem))
    assert [i["data"] for i in itens] == datas
    for it in itens:
        assert it["id"] == f"tjsp-{codigo}-" + "".join(reversed(it["data"].split("/")))
        assert it["sistema"] == sistema
        assert it["gravidade"] == gravidade
        assert it["aplicavel"] is True
        assert it["inicio"] == inicio and it["fim"] == fim
        assert it["horario"] == horario
        assert it["duracaoMin"] == duracao
        assert it["revisar"] is revisar
        assert it["superior60"] is True
        assert it["dataPublicacao"] == listagem
        assert it["link"] == f"https://www.tjsp.jus.br/Indisponibilidade/Comunicado?codigoComunicado={codigo}&pagina=1"
        assert list(it.keys()) == list(robo.CAMPOS)


def test_motivos_revisar_reais():
    # R19: duração >= 180 min sem "severa" não é motivo de revisão (o TJSP declara a severidade)
    assert classificar_fixture(80432, "21/10/2026")[0]["motivoRevisar"] is None
    assert classificar_fixture(72897, "23/07/2026")[0]["motivoRevisar"] is None
    assert "misto" in classificar_fixture(73099, "24/07/2026")[0]["motivoRevisar"]


def test_2012_sem_data_no_titulo():
    titulo = "Indisponibilidade do sistema de Peticionamento Eletrônico"
    # sem corpo: usa a data da listagem
    itens = robo.classificar(titulo, "", "31/08/2012", 2635)
    assert [i["data"] for i in itens] == ["31/08/2012"]
    assert itens[0]["sistema"] == "saj" and itens[0]["gravidade"] == "normal"
    assert itens[0]["revisar"] and "listagem" in itens[0]["motivoRevisar"]
    # com a prévia da listagem: a regra "título -> corpo -> listagem" usa a data do corpo
    previa = ("A STI - Secretaria de Tecnologia da Informação COMUNICA QUE, o sistema de peticionamento "
              "eletrônico ficou indisponível, a partir do dia 03/07/2012, às 16:51 horas, até")
    itens = robo.classificar(titulo, previa, "31/08/2012", 2635)
    assert [i["data"] for i in itens] == ["03/07/2012"]
    assert itens[0]["inicio"] == "16:51" and itens[0]["dataPublicacao"] == "31/08/2012"


# ---------------------------------------------------------------------------
# Casos sintéticos
# ---------------------------------------------------------------------------

def cl(titulo, corpo="", listagem="01/10/2026", codigo=1):
    return robo.classificar(titulo, corpo, listagem, codigo, "2026-10-23T09:00:00-03:00")


def test_so_segundo_grau_nao_aplica():
    it = cl("21/10/2026 – INDISPONIBILIDADE DO EPROC DE 2º GRAU",
            "O sistema Eproc de 2º Grau apresentou indisponibilidade por período superior a 60 minutos, "
            "a partir das 10h00 até 11h30 do dia 21/10/2026.")[0]
    assert it["sistema"] == "eproc" and it["gravidade"] == "normal"
    assert it["aplicavel"] is False
    assert "2º grau" in it["motivoNaoAplicavel"]


def test_colegio_recursal_sozinho_nao_aplica():
    it = cl("01/10/2026 - INDISPONIBILIDADE NA CONSULTA DO SG E CR NO PORTAL E-SAJ")[0]
    assert it["aplicavel"] is False


def test_apenas_execucao_fiscal_nao_aplica():
    it = cl("10/10/2026 – INDISPONIBILIDADE DO EPROC",
            "O sistema Eproc de 1º Grau, APENAS EXECUÇÃO FISCAL, apresentou indisponibilidade superior a 60 minutos.")[0]
    assert it["aplicavel"] is False
    assert "Execução Fiscal" in it["motivoNaoAplicavel"]


def test_comarca_de_campinas_nao_aplica():
    it = cl("10/10/2026 – INDISPONIBILIDADE DO PORTAL E-SAJ NA COMARCA DE CAMPINAS",
            "O Portal e-SAJ apresentou indisponibilidade na Comarca de Campinas por período superior a 60 minutos.")[0]
    assert it["aplicavel"] is False
    assert "campinas" in it["motivoNaoAplicavel"]


def test_marilia_e_10a_raj_aplicam():
    assert cl("10/10/2026 – INDISPONIBILIDADE DO EPROC NA COMARCA DE MARÍLIA")[0]["aplicavel"] is True
    assert cl("10/10/2026 – INDISPONIBILIDADE DO EPROC NAS COMARCAS DA 10ª RAJ")[0]["aplicavel"] is True
    assert cl("10/10/2026 – INDISPONIBILIDADE DO EPROC NO FORO REGIONAL DE SANTANA")[0]["aplicavel"] is False


def test_bases_civel_ef_criminal_aplica():
    it = cl("21/10/2026 – INDISPONIBILIDADE DO EPROC",
            "os sistemas Eproc de 1º Grau, bases Cível, Execução Fiscal e Criminal, apresentaram indisponibilidade.")[0]
    assert it["aplicavel"] is True


def test_classe_processual_revisar():
    it = cl("10/10/2026 – INDISPONIBILIDADE NO PETICIONAMENTO DO EPROC",
            "Indisponibilidade no peticionamento inicial PARA A CLASSE: 12154 - EXECUÇÃO DE TÍTULO EXTRAJUDICIAL.")[0]
    assert it["aplicavel"] is None
    assert it["revisar"] is True and "classe" in it["motivoRevisar"]


def test_base_saj_nomeada_revisar():
    it = cl("10/10/2026 – INDISPONIBILIDADE DO E-SAJ", "Indisponibilidade na base PG5EF do e-SAJ.")[0]
    assert it["aplicavel"] is None and "PG5EF" in it["motivoRevisar"]


def test_datacenter_geral():
    it = cl("10/10/2026 – INDISPONIBILIDADE DE SISTEMAS - DATACENTER",
            "Em razão de falha no Datacenter os sistemas ficaram indisponíveis por período superior a 60 minutos.")[0]
    assert it["sistema"] == "geral" and it["gravidade"] == "normal"


def test_eproc_e_saj_geral():
    assert cl("10/10/2026 – INDISPONIBILIDADE DO PORTAL E-SAJ E DO EPROC")[0]["sistema"] == "geral"


def test_inferior_60_informativa():
    it = cl("10/10/2026 – INDISPONIBILIDADE DO PORTAL EPROC",
            "O Portal eproc apresentou indisponibilidade por período INFERIOR A 60 MINUTOS.")[0]
    assert it["gravidade"] == "informativa" and it["superior60"] is False


def test_manutencao_programada():
    assert cl("10/10/2026 – MANUTENÇÃO PROGRAMADA NO EPROC", "Haverá manutenção das 20h às 22h.")[0]["gravidade"] == "informativa"
    it = cl("10/10/2026 – MANUTENÇÃO PROGRAMADA NO EPROC",
            "Manutenção com indisponibilidade superior a 60 minutos, das 20h às 22h.")[0]
    assert it["gravidade"] == "normal"


def test_severa_no_titulo():
    it = cl("10/10/2026 – INDISPONIBILIDADE SEVERA DO PORTAL EPROC")[0]
    assert it["gravidade"] == "severa"


def test_outro_sistema():
    # R20: sistema alheio conhecido (Escritório Digital) não precisa de revisão
    it = cl("10/10/2026 – INDISPONIBILIDADE DO ESCRITÓRIO DIGITAL")[0]
    assert it["sistema"] == "outro" and it["gravidade"] == "informativa" and it["revisar"] is False
    # serviço processual sem sistema nomeado depois da implantação do eproc: pode ser SAJ ou eproc
    it = cl("10/10/2026 – INDISPONIBILIDADE NO PETICIONAMENTO INICIAL",
            "O serviço de Peticionamento Inicial apresentou indisponibilidade por tempo superior a 60 minutos.")[0]
    assert it["sistema"] == "outro" and it["revisar"] is True and "outro" in it["motivoRevisar"]


def test_titulo_sem_data_usa_listagem():
    itens = cl("INDISPONIBILIDADE DO PORTAL E-SAJ", "O Portal e-SAJ apresentou indisponibilidade.", "15/03/2015")
    assert [i["data"] for i in itens] == ["15/03/2015"]
    assert itens[0]["revisar"] is True


def test_tres_dias_virgula_e():
    itens = cl("23, 24 e 25/07/2026 – INDISPONIBILIDADE DO PORTAL E-SAJ")
    assert sorted(i["data"] for i in itens) == ["23/07/2026", "24/07/2026", "25/07/2026"]
    assert len({i["id"] for i in itens}) == 3


def test_intervalo_datas_completas():
    itens = cl("28/07/2026 a 01/08/2026 – INDISPONIBILIDADE DO PORTAL EPROC")
    assert [i["data"] for i in robo.ordenar(itens)] == [
        "01/08/2026", "31/07/2026", "30/07/2026", "29/07/2026", "28/07/2026"]


@pytest.mark.parametrize("titulo,esperado", [
    ("21/10/2026 – X INDISPONIBILIDADE", ["21/10/2026"]),
    ("21/10/2026- INDISPONIBILIDADE", ["21/10/2026"]),
    ("21/10/2026– INDISPONIBILIDADE", ["21/10/2026"]),
    ("21/10/2026 — INDISPONIBILIDADE", ["21/10/2026"]),
    ("25 e 26/08/2026 – INDISPONIBILIDADE", ["25/08/2026", "26/08/2026"]),
    ("22 A 23/07/2026 – INDISPONIBILIDADE", ["22/07/2026", "23/07/2026"]),
    ("20 A 23/07/2026 – INDISPONIBILIDADE", ["20/07/2026", "21/07/2026", "22/07/2026", "23/07/2026"]),
    ("30/06 e 01/07/2026 – INDISPONIBILIDADE", ["30/06/2026", "01/07/2026"]),
    ("30/12 a 02/01/2027 – INDISPONIBILIDADE", ["30/12/2026", "31/12/2026", "01/01/2027", "02/01/2027"]),
    ("RETIFICAÇÃO - 05/10/2026 - INDISPONIBILIDADE", ["05/10/2026"]),
])
def test_variacoes_de_titulo(titulo, esperado):
    datas, _ = robo.extrair_datas(titulo)
    assert [robo.fmt_data(d) for d in datas] == esperado


def test_datas_ignora_numeros_de_normas():
    corpo = "Para os fins do artigo 8º da Resolução TJSP nº 551/2011, Provimento nº 87/2013 e CSM Nº 2537/2019"
    assert robo.extrair_datas(corpo)[0] == []


def test_retificacao_revisar():
    it = cl("RETIFICAÇÃO - 05/10/2026 - INDISPONIBILIDADE DO PORTAL E-SAJ")[0]
    assert it["revisar"] and "retificação" in it["motivoRevisar"]


@pytest.mark.parametrize("corpo,inicio,fim,dur,horario", [
    ("das 23h às 24h do dia 10/10/2026", "23:00", "24:00", 60, "23h às 24h"),
    ("a partir das 22h00 até 02h00", "22:00", "02:00", 240, "22h00 às 02h00"),
    ("de 09h41 até 14h39 do dia 04/08/2026", "09:41", "14:39", 298, "09h41 às 14h39"),
    ("restabelecidos os serviços às 09h48 do dia 23/07/2026", None, "09:48", None, "até 09h48"),
    ("a partir das 12h00 do dia 21/10/2026", "12:00", None, None, "a partir de 12h00"),
])
def test_horarios(corpo, inicio, fim, dur, horario):
    h = robo.extrair_horario(corpo, 2026)
    assert (h["inicio"], h["fim"], h["duracaoMin"], h["horario"]) == (inicio, fim, dur, horario)


def test_titulo_sem_data():
    assert robo.titulo_sem_data("21/10/2026– INDISPONIBILIDADE DOS SERVIÇOS DO PORTAL EPROC") == \
        "INDISPONIBILIDADE DOS SERVIÇOS DO PORTAL EPROC"
    assert robo.titulo_sem_data("23 A 24/07/2026 – INDISPONIBILIDADE") == "INDISPONIBILIDADE"


# ---------------------------------------------------------------------------
# Pipeline offline (listagem -> detalhes -> classificação -> JSON)
# ---------------------------------------------------------------------------

def rodar(tmp_path, *extra, fixtures=FIX):
    saida = tmp_path / "indisponibilidades.json"
    args = robo.parse_args(["--fixtures-dir", str(fixtures), "--saida", str(saida), "--cache-dir", "", *extra])
    return robo.executar(args), saida


def test_pipeline_offline(tmp_path, monkeypatch):
    out = tmp_path / "gh_output"
    monkeypatch.setenv("GITHUB_OUTPUT", str(out))
    monkeypatch.delenv("FIREBASE_SERVICE_ACCOUNT", raising=False)
    md = tmp_path / "novos.md"
    res, saida = rodar(tmp_path, "--novos-md", str(md))
    texto = saida.read_text(encoding="utf-8")
    assert texto.endswith("}\n") and "\\u" not in texto and "&#" not in texto and "\r" not in texto
    dados = json.loads(texto)
    assert dados["versao"] == 1 and dados["totalComunicados"] == 10
    assert dados["fonte"] == "https://www.tjsp.jus.br/Indisponibilidade/Comunicados"
    ids = [i["id"] for i in dados["itens"]]
    assert len(ids) == 13 and ids[0] == "tjsp-80438-20261021" and ids[1] == "tjsp-80432-20261021"
    assert ids[-1] == "tjsp-72063-20260714"
    chaves = [robo.chave_ordem(i) for i in dados["itens"]]
    assert chaves == sorted(chaves, reverse=True)
    gh = out.read_text(encoding="utf-8")
    assert "novos=13\n" in gh
    assert "titulo=Indisponibilidade TJSP: 24/07/2026 e-SAJ (severa) e mais 9\n" in gh
    md_txt = md.read_text(encoding="utf-8")
    assert "⚠️ precisa de revisão" in md_txt and "| Data | Sistema | Gravidade |" in md_txt
    assert res["fonte"].paginas_lidas == [1]


def test_segunda_execucao_nao_muda_nada(tmp_path, monkeypatch):
    out = tmp_path / "gh_output"
    _, saida = rodar(tmp_path)
    antes = saida.read_bytes()
    monkeypatch.setenv("GITHUB_OUTPUT", str(out))
    res, _ = rodar(tmp_path, "--paginas", "3")
    assert saida.read_bytes() == antes
    assert res["novos"] == []
    assert res["fonte"].paginas_lidas == [1]  # parada antecipada
    assert "novos=0\n" in out.read_text(encoding="utf-8")


def test_incremental_continua_se_pagina_toda_nova(tmp_path):
    saida = tmp_path / "indisponibilidades.json"
    itens = [{"id": "tjsp-72026-20260713", "codigo": 72026, "data": "13/07/2026", "detectadoEm": "2026-07-14T10:00:00-03:00"}]
    saida.write_text(json.dumps({"versao": 1, "itens": itens}), encoding="utf-8")
    res, _ = rodar(tmp_path)
    assert res["fonte"].paginas_lidas == [1, 2]
    # p1 inteira (13 dias) + os três comunicados da p2 que têm fixture de detalhe (63913 cobre 01 a 06/04)
    assert len(res["novos"]) == 21


P2_COM_FIXTURE = {70654, 63913, 67357}


def test_todas_ignora_detalhe_ausente(tmp_path):
    res, saida = rodar(tmp_path, "--todas")
    assert res["fonte"].paginas_lidas == [1, 2, 3]  # p3 não existe nas fixtures: para com aviso
    codigos = {i["codigo"] for i in json.loads(saida.read_text(encoding="utf-8"))["itens"]}
    # demais detalhes da p2 ausentes: não são marcados como vistos (serão tentados de novo)
    assert codigos == set(DET_CODIGOS) | P2_COM_FIXTURE


# ---------------------------------------------------------------------------
# Comunicados reais com armadilhas (páginas 2 a 4 da listagem)
# ---------------------------------------------------------------------------

def test_real_70654_madrugada_seguinte():
    it = classificar_fixture(70654, "25/06/2026")
    assert [i["data"] for i in it] == ["24/06/2026"]
    assert it[0]["horario"] == "22h31 (24/06) às 02h26 (25/06)" and it[0]["duracaoMin"] == 235
    assert "fora das datas" not in (it[0]["motivoRevisar"] or "")
    assert it[0]["aplicavel"] is True and it[0]["sistema"] == "saj"


def test_real_63913_horario_alem_do_titulo():
    # R26: o horário continua o evento além do título (até 7 dias): um item por dia, sem revisão
    itens = robo.ordenar(classificar_fixture(63913, "06/04/2026"))
    assert [i["data"] for i in itens] == ["06/04/2026", "05/04/2026", "04/04/2026", "03/04/2026", "02/04/2026",
                                           "01/04/2026"]
    it = itens[-1]
    assert it["sistema"] == "custas"
    assert it["horario"] == "16h40 (01/04) às 15h25 (06/04)"
    assert it["revisar"] is False


def test_real_61078_severa_em_classes_especificas():
    it = classificar_fixture(61078, "26/02/2026")
    # R26: vai até 09h00 do dia 26 (depois das 6h), então o dia 26 também entra
    assert [i["data"] for i in it] == ["25/02/2026", "26/02/2026"]
    # todas as classes afetadas são criminais: não é do JEC Cível, não prorroga
    assert it[0]["gravidade"] == "severa" and it[0]["aplicavel"] is False
    assert "classes processuais" in it[0]["motivoNaoAplicavel"]
    assert "classe" not in (it[0]["motivoRevisar"] or "")


def test_real_57317_agravo_pge_sem_data():
    it = classificar_fixture(57317, "05/11/2025")
    # datas de publicação ("publicação realizada em 05/11/2025", "comunicado realizado em 13/10/2025") são ignoradas
    assert [i["data"] for i in it] == ["05/11/2025"]
    assert it[0]["aplicavel"] is False  # agravo de instrumento: 2º grau
    # R21: não aplicável sem dúvida: a data da listagem não pede revisão
    assert it[0]["revisar"] is False
    # R06: integração com a PGE é serviço de outra instituição: informativa
    assert it[0]["gravidade"] == "informativa"


def test_dry_run_nao_grava(tmp_path):
    res, saida = rodar(tmp_path, "--dry-run")
    assert not saida.exists() and len(res["novos"]) == 13


def test_cache_e_reprocessar_preserva_detectado(tmp_path):
    cache = tmp_path / "cache"
    saida = tmp_path / "indisponibilidades.json"
    robo.executar(robo.parse_args(["--fixtures-dir", str(FIX), "--saida", str(saida), "--cache-dir", str(cache)]))
    assert sorted(p.name for p in cache.iterdir()) == sorted(f"{c}.html" for c in DET_CODIGOS)
    dados = json.loads(saida.read_text(encoding="utf-8"))
    for it in dados["itens"]:
        it["detectadoEm"] = "2026-01-01T00:00:00-03:00"
        it["sistema"] = "outro"  # será corrigido pelo reprocessamento
    saida.write_text(json.dumps(dados, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    vazio = tmp_path / "vazio"
    vazio.mkdir()
    shutil.copy(FIX / "lista.html", vazio / "lista.html")  # sem det_*.html: só o cache serve
    res = robo.executar(robo.parse_args(
        ["--fixtures-dir", str(vazio), "--saida", str(saida), "--cache-dir", str(cache), "--reprocessar"]))
    itens = res["estado"]["itens"]
    assert len(itens) == 13 and res["novos"] == []
    assert all(i["detectadoEm"] == "2026-01-01T00:00:00-03:00" for i in itens)
    assert {i["sistema"] for i in itens} == {"custas", "eproc", "saj"}


def test_markdown_vazio_e_titulo():
    assert robo.titulo_resumo([]) == ""
    itens = cl("10/10/2026 – INDISPONIBILIDADE DO PORTAL EPROC", "superior a 60 minutos", codigo=5)
    assert robo.titulo_resumo(itens) == "Indisponibilidade TJSP: 10/10/2026 eproc (normal)"


def test_firestore_documento_e_desativado(monkeypatch):
    monkeypatch.delenv("FIREBASE_SERVICE_ACCOUNT", raising=False)
    it = classificar_fixture(73099, "24/07/2026")[0]
    doc = robo.documento_firestore(it)["fields"]
    assert doc["type"] == {"stringValue": "severa"}
    assert doc["startDate"] == {"stringValue": it["data"]}
    assert doc["endDate"] == {"nullValue": None}
    assert doc["description"] == {"stringValue": "INDISPONIBILIDADE DOS SERVIÇOS DO PORTAL E-SAJ"}
    assert doc["codigo"] == {"integerValue": "73099"}
    assert doc["origem"] == {"stringValue": "tjsp-robo"} and doc["author"] == {"stringValue": "robo-tjsp"}
    assert "timestampValue" in doc["createdAt"]
    assert robo.documento_firestore(classificar_fixture(80438, "21/10/2026")[0])["fields"]["informativa"] == {"booleanValue": True}
    assert robo.sync_firestore([it]) == 0


# ---------------------------------------------------------------------------
# Revisão adversarial: abrangência (só 1º grau, JEC Cível, Marília)
# ---------------------------------------------------------------------------

def test_real_58051_integracao_pge_nao_aplica():
    it = classificar_fixture(58051, "25/11/2025")[0]
    assert it["sistema"] == "saj" and it["aplicavel"] is False
    assert "PGE" in it["motivoNaoAplicavel"]


def test_real_58196_requisitorios_nao_aplica():
    it = classificar_fixture(58196, "26/11/2025")[0]
    assert it["aplicavel"] is False and "requisitórios" in it["motivoNaoAplicavel"]


def test_real_67357_login_e_requisitorios_aplica():
    it = classificar_fixture(67357, "18/05/2026")[0]
    assert it["aplicavel"] is True and it["sistema"] == "saj"


def test_classes_mistas_continua_a_confirmar():
    it = cl("10/10/2026 – INDISPONIBILIDADE NO PORTAL E-SAJ",
            "superior a 60 minutos, das 10h às 12h. As classes processuais afetadas foram: "
            "279 - Inquérito Policial e 7 - Procedimento Comum Cível.")[0]
    assert it["aplicavel"] is None and "classe" in it["motivoRevisar"]


@pytest.mark.parametrize("corpo", [
    "O Portal e-SAJ apresentou indisponibilidade em todas as unidades judiciais das Comarcas do Estado de São Paulo, "
    "superior a 60 minutos, das 10h às 12h.",
    "O e-SAJ ficou indisponível por período superior a 60 minutos, das 10h às 12h, exceto na Comarca de Campinas.",
    "O e-SAJ ficou indisponível nos Foros de Primeira Instância por período superior a 60 minutos, das 10h às 12h.",
    "Devido a falha de energia no Datacenter localizado na Comarca de São Paulo, os sistemas ficaram indisponíveis "
    "por período superior a 60 minutos, das 10h às 12h.",
])
def test_local_que_nao_restringe(corpo):
    it = cl("10/10/2026 – INDISPONIBILIDADE DO PORTAL E-SAJ", corpo)[0]
    assert it["aplicavel"] is True, it["escopo"]


def test_local_restrito_e_mencao_solta():
    it = cl("10/10/2026 – INDISPONIBILIDADE DO PORTAL E-SAJ",
            "O e-SAJ ficou indisponível apenas na Comarca de Campinas, superior a 60 minutos.")[0]
    assert it["aplicavel"] is False and "campinas" in it["motivoNaoAplicavel"]
    it = cl("10/10/2026 – INDISPONIBILIDADE DO PORTAL E-SAJ",
            "Comarca de Campinas: o e-SAJ ficou indisponível, superior a 60 minutos.")[0]
    assert it["aplicavel"] is None and it["revisar"]


def test_marilia_excluida_nao_aplica():
    it = cl("10/10/2026 – INDISPONIBILIDADE DO PORTAL E-SAJ",
            "O e-SAJ ficou indisponível em todas as comarcas, exceto na Comarca de Marília, superior a 60 minutos.")[0]
    assert it["aplicavel"] is False


def test_10a_raj_com_outra_comarca_a_confirmar():
    it = cl("10/10/2026 – INDISPONIBILIDADE DO PORTAL E-SAJ",
            "O e-SAJ ficou indisponível na Comarca de Garça (10ª RAJ), superior a 60 minutos.")[0]
    assert it["aplicavel"] is None and "10ª RAJ" in it["motivoRevisar"]
    it = cl("10/10/2026 – INDISPONIBILIDADE DO PORTAL E-SAJ",
            "O e-SAJ ficou indisponível nas unidades da 10ª RAJ, superior a 60 minutos.")[0]
    assert it["aplicavel"] is True


def test_inferior_e_superior_60_no_mesmo_comunicado():
    it = cl("10/10/2026 – INDISPONIBILIDADE DO PORTAL EPROC",
            "consulta processual por período inferior a 60 minutos; peticionamento eletrônico por período "
            "superior a 60 minutos, das 10h às 12h")[0]
    assert it["gravidade"] == "normal" and it["superior60"] is None
    assert it["revisar"] and "inferiores e superiores" in it["motivoRevisar"]
    it = cl("10/10/2026 – INSTABILIDADE DO PORTAL EPROC", "por período inferior a 60 minutos, das 10h às 10h40")[0]
    assert it["gravidade"] == "informativa" and it["superior60"] is False


# ---------------------------------------------------------------------------
# Revisão adversarial: horário, corpo, Markdown, Firestore
# ---------------------------------------------------------------------------

def test_horario_em_horas_por_extenso():
    h = robo.extrair_horario("a partir das 14 horas até as 17 horas do dia 10/10/2026")
    assert (h["inicio"], h["fim"], h["duracaoMin"]) == ("14:00", "17:00", 180)
    h = robo.extrair_horario("por tempo superior a 3 horas, das 9h às 13h do dia 10/10/2026")
    assert (h["inicio"], h["fim"]) == ("09:00", "13:00")


def test_duracao_nao_vira_horario():
    h = robo.extrair_horario(
        "indisponibilidade por cerca de 2h30, a partir das 10h00 do dia 10/10/2026, restabelecido às 12h30")
    assert (h["inicio"], h["fim"], h["duracaoMin"]) == ("10:00", "12:30", 150)


def test_corpo_que_cita_comunicado_anterior():
    titulo = "10/10/2026 – INDISPONIBILIDADE DO PORTAL EPROC"
    pagina = (
        '<html><body><nav>Comunicado 01/10/2026 Outro aviso</nav>'
        '<div class="lista-comunicados"><time>10/10/2026</time><h3>' + titulo + '</h3></div>'
        '<p>Aviso de Indisponibilidade de Sistemas Comunicado 10/10/2026 ' + titulo + ' Para os fins do art. 8º, '
        'o eproc de 1º grau, em retificação ao Comunicado 08/10/2026 publicado, ficou indisponível das 10h às 12h.</p>'
        '<p>' + robo.MARCA_FIM + '</p></body></html>'
    )
    det = robo.parse_detalhe(pagina)
    assert det["titulo"] == titulo
    assert det["corpo"].startswith("Para os fins do art. 8º, o eproc de 1º grau")


def test_markdown_escapa_texto_raspado():
    itens = cl("10/10/2026 – INDISPONIBILIDADE <img src=x onerror=alert(1)> [x](javascript:1) @fulano",
               "superior a 60 minutos", codigo=5)
    md = robo.gerar_markdown(itens)
    assert "<img" not in md and "&lt;img" in md
    assert "[x](javascript" not in md and "@fulano" not in md
    assert "[5](https://www.tjsp.jus.br/" in md
    assert "\nComunicados: 5\n" in md
    ruim = dict(itens[0], link="javascript:alert(1)")
    assert "javascript:alert" not in robo.gerar_markdown([ruim]) and "| 5 |" in robo.gerar_markdown([ruim])


def test_firestore_so_itens_recentes(monkeypatch):
    itens = cl("01/08/2026 e 20/10/2026 – INDISPONIBILIDADE DO PORTAL EPROC", "superior a 60 minutos")
    recentes = robo.itens_para_firestore(itens, hoje=robo.dt.date(2026, 10, 23))
    assert [i["data"] for i in recentes] == ["20/10/2026"]
    monkeypatch.delenv("FIREBASE_SERVICE_ACCOUNT", raising=False)
    assert robo.remover_firestore(["tjsp-1-20260801"]) == 0


def test_firestore_copia_do_robo():
    assert robo.e_copia_do_robo({"fields": {"origem": {"stringValue": "tjsp-robo"}}})
    assert not robo.e_copia_do_robo({"fields": {"origem": {"stringValue": "tjsp-robo"}, "overrideOf": {"stringValue": "tjsp"}}})
    assert not robo.e_copia_do_robo({"fields": {"origem": {"stringValue": "tjsp"}, "hidden": {"booleanValue": True}}})


# ---------------------------------------------------------------------------
# Auditoria do histórico (471 comunicados): regras R01-R27, com textos reais
# ---------------------------------------------------------------------------

B8 = ("Para os fins do artigo 8º da Resolução TJSP nº 551/2011, artigo 3º do Provimento nº 87/2013 da Presidência "
      "do TJSP e artigo 3º do Provimento CG Nº 26/2013, a Secretaria de Tecnologia da Informação (STI) comunica que, "
      "devido a problemas de ordem técnica, ")


def real(codigo, listagem):
    """Comunicado real do cache (fixture det_<codigo>.html): o primeiro item."""
    return classificar_fixture(codigo, listagem)[0]


# R01 - instância enumerada: "1ª e 2ª Instância", "1º, 2º Grau", "1ª, 2ª Instância e Colégio Recursal"
@pytest.mark.parametrize("codigo,listagem", [
    (32512, "25/03/2022"),  # 1º e 2º Grau
    (18092, "04/07/2019"),  # 1ª, 2ª Instância e Colégio Recursal
    (4874, "11/11/2013"),   # 1º E 2º INSTÂNCIA / 1ª e 2ª Instância
])
def test_r01_instancia_enumerada_inclui_1o_grau(codigo, listagem):
    it = real(codigo, listagem)
    assert it["aplicavel"] is True and it["motivoNaoAplicavel"] is None
    assert "1º e 2º grau" in it["escopo"] and "só 2º grau" not in it["escopo"]


@pytest.mark.parametrize("trecho", [
    "1ª e 2ª Instâncias", "1º E 2ª INSTÂNCIA", "1ª - 2ª Instância", "1º, 2º GRAU E COL RECURSAL",
    "1ª, 2ª Instância e Colégios Recursais",
])
def test_r01_regex_1o_grau(trecho):
    assert robo.RE_1G.search(robo.norm(trecho))
    assert not robo.RE_1G.search(robo.norm("2ª Instância e Colégio Recursal"))


# R02 - "PG5"/"SG5"/"SAJ/PG5" sem sufixo é o SAJ, não uma base
def test_r02_pg5_sem_sufixo_nao_e_base():
    it = real(7845, "24/10/2016")  # "SAJ/PG5 e SG5" + "Sistema de Automação Judiciária de 1ª e 2ª Instância"
    assert it["aplicavel"] is True and "bases" not in it["escopo"] and it["revisar"] is False
    assert robo.RE_BASE_NOMEADA.findall("BASES PG5EF, PG5REG E PG5PP E PG5ARCT") == ["PG5EF", "PG5REG", "PG5PP", "PG5ARCT"]
    assert robo.RE_BASE_NOMEADA.findall("SISTEMA SAJ/PG5 (PROTOCOLO) E SG5") == []


# R03 - base pela redação ("alocados nas bases GRU, RP e PRECAT"): nunca true silencioso
def test_r03_base_pela_redacao():
    it = cl("12/12/2024 - INDISPONIBILIDADE DOS SERVIÇOS DO PORTAL e-SAJ PARA OS PROCESSOS ALOCADOS NAS BASES GRU, RP E "
            "PRECAT", B8 + "os serviços do Portal e-SAJ apresentaram indisponibilidade por tempo superior a 60 minutos "
            "para os processos alocados nas bases GRU, RP e PRECAT.")[0]  # sem a lista das comarcas
    assert it["aplicavel"] is None and it["revisar"] is True
    assert "GRU, RP, PRECAT" in it["motivoRevisar"]
    it = cl("19/01/2023- INDISPONIBILIDADE NA CONSULTA PROCESSUAL DE 1ª INSTÂNCIA DA BASE JM DO SAJ",
            B8 + "a Consulta Processual de 1ª Instância apresentou indisponibilidade por tempo superior a 60 minutos.")[0]
    assert it["aplicavel"] is None and "JM" in it["motivoRevisar"]


# R04a - base com lista de comarcas que inclui Marília
def test_r04a_base_com_lista_que_inclui_marilia():
    it = real(40791, "21/11/2023")
    assert it["aplicavel"] is True and it["revisar"] is False
    assert "lista inclui Marília" in it["escopo"]
    # R27: "Foro das Execuções Fiscais ... e Especial da Infância" é nome de foro na lista, não competência
    assert "Execução Fiscal" not in it["escopo"] and "Infância" not in it["escopo"]


# R05 - lista de comarcas/foros sem Marília
def test_r05_lista_de_foros_sem_marilia():
    it = real(4458, "19/07/2013")  # "para os Foros: Americana, Araras, ..."
    assert it["aplicavel"] is False and "listados" in it["motivoNaoAplicavel"]
    it = cl("Indisponibilidade Peticionamento Eletrônico",
            "A Secretaria de Tecnologia da Informação (STI) comunica que devido a problemas de ordem técnica o Sistema "
            "de Peticionamento Eletrônico ficou temporariamente indisponível no dia 18/10/2012, das 00h às 12h para as "
            "Comarcas de Jundiaí, Itatiba e Franco da Rocha", "18/10/2012")[0]
    assert it["aplicavel"] is False and "jundiai" in it["motivoNaoAplicavel"]
    it = real(42560, "13/02/2024")  # "nas seguintes Circunscrições Judiciárias: ..." / "Sajpg5"
    assert it["aplicavel"] is False and it["sistema"] == "saj" and it["revisar"] is False


# R06 - serviço exclusivo de outra instituição: false + informativa (salvo severa)
def test_r06_instituicao_severa_nao_aplica():
    it = real(18715, "27/03/2020")  # web service das prefeituras conveniadas, 7 dias de severa
    assert it["aplicavel"] is False and it["gravidade"] == "severa"
    assert "prefeituras" in it["motivoNaoAplicavel"]
    it = real(18691, "09/03/2020")  # intimações e peticionamento para o MP/SP e Defensoria
    assert it["aplicavel"] is False and "Ministério Público" in it["motivoNaoAplicavel"]


@pytest.mark.parametrize("titulo,corpo,nome", [
    ("22/05/2019 – INTERMITÊNCIA DA PASTA DIGITAL PARA A DEFENSORIA PÚBLICA E MINISTÉRIO PÚBLICO",
     B8 + "o serviço da Pasta Digital para a Defensoria Pública e Ministério Público apresentou intermitência por "
     "23h59m (das 00h00m a 23h59m), no dia 22/05/2019.", "Defensoria Pública"),
    ("24/10/2023 - INDISPONIBILIDADE NO RECEBIMENTO E CONSULTA DE INTIMAÇÃO DE 1º E 2º GRAU NO PORTAL E-SAJ PELO MPSP",
     B8 + "o recebimento e consulta de intimação de 1º e 2º grau no Portal e-SAJ, apresentou a equipe do Ministério "
     "Público do Estado de São Paulo indisponibilidade por tempo superior a 60 minutos, com início às 09h até às "
     "13h41m de hoje.", "Ministério Público"),
    ("21/11/2016 - 22/11/2016 - INTERMITÊNCIA NO ACESSO E DISPONIBILIDADE – INTEGRAÇÃO TJSP X POLÍCIA CIVIL",
     B8 + "a integração entre os sistemas utilizados pelo TJSP e Polícia Civil para a realização do ajuizamento e "
     "seus complementos do Inquérito Policial Eletrônico apresentou intermitência no acesso e disponibilidade, "
     "superior a 60 minutos, no período de 21/11/2016 às 12:30 a 22/11/2016 às 14:00.", "Polícia Civil"),
    ("INSTABILIDADE NA INTEGRAÇÃO DO SISTEMA E-SAJ COM A PGE-SP NO SERVIÇO DE PROTOCOLO DE AGRAVOS DE INSTRUMENTO",
     "a integração do Sistema e-SAJ com a Procuradoria Geral do Estado de São Paulo, no serviço de protocolo de "
     "Agravos de Instrumento apresentou instabilidade nos processos que seguem na listagem do arquivo em anexo.", "PGE"),
])
def test_r06_instituicao_informativa(titulo, corpo, nome):
    it = cl(titulo, corpo)[0]
    assert it["aplicavel"] is False and it["gravidade"] == "informativa" and it["revisar"] is False
    assert nome in it["motivoNaoAplicavel"]


def test_r06_extrajudicial_e_sivec():
    it = real(27033, "13/10/2021")  # sistema PEX / Portal do Extrajudicial
    assert it["aplicavel"] is False and it["revisar"] is False
    it = cl("16/10/2021 - Indisponibilidade das aplicações do Sistema SIVEC",
            "o sistema SIVEC (Sistema das Varas das Execuções Criminais) apresentou indisponibilidade.")[0]
    assert it["aplicavel"] is False


def test_r06_classe_inquerito_nao_e_policia_civil():
    # "279 - Inquérito Policial" numa lista de classes continua decidido pela regra de classes
    it = cl("10/10/2026 – INDISPONIBILIDADE NO PORTAL E-SAJ",
            "As classes processuais afetadas foram: 279 - Inquérito Policial e 7 - Procedimento Comum Cível.")[0]
    assert it["aplicavel"] is None and "classe" in it["motivoRevisar"]


# R07 - título e corpo com alcances diferentes
@pytest.mark.parametrize("codigo,listagem", [
    (15080, "15/08/2018"),  # título: para MP/Defensoria/Procuradoria; corpo: peticionamento de 1ª e 2ª Instância
    (18240, "31/08/2019"),  # título: serviços do Portal e-SAJ e integração; corpo: só integração Polícia Civil
])
def test_r07_conflito_titulo_corpo(codigo, listagem):
    it = real(codigo, listagem)
    assert it["aplicavel"] is None and it["revisar"] is True
    assert "título e corpo divergem" in it["motivoRevisar"]
    assert "só 2º grau" not in it["escopo"]


# R08 - requisitório como objeto do peticionamento
def test_r08_peticionamento_de_requisitorio():
    it = real(19556, "01/12/2020")
    assert it["aplicavel"] is False and "requisitórios" in it["motivoNaoAplicavel"]
    it = real(67357, "18/05/2026")  # login + PETREQ + consulta de 1º grau: continua aplicável
    assert it["aplicavel"] is True


# R09 - redação antiga do SAJ (antes do eproc)
@pytest.mark.parametrize("titulo,corpo,listagem", [
    ("12/06/2020 - INDISPONIBILIDADE SEVERA NO PETICIONAMENTO INICIAL ELETRÔNICO DE 1º GRAU", "", "12/06/2020"),
    ("09/05/2022 – INDISPONIBILIDADE PARA DOWNLOAD DOS AUTOS EM 1º, 2º GRAU e COL. RECURSAL",
     B8 + "o recurso para download dos autos em 1º, 2º Grau e Col. Recursal apresentou indisponibilidade do serviço "
     "por tempo superior a 60 minutos no dia 09/05/2022.", "09/05/2022"),
    ("Indisponibilidade", "o serviço de peticionamento de RPV (Requisitório de pequeno Valor) apresentou "
     "indisponibilidade por tempo superior a 60 minutos no dia 10/10/2019.", "10/10/2019"),
    ("05/11/2018 - INDISPONIBILIDADE", B8 + "a Consulta de Processos do 1º Grau apresentou indisponibilidade superior "
     "a 60 minutos no dia 05/11/2018.", "05/11/2018"),
])
def test_r09_saj_redacao_antiga(titulo, corpo, listagem):
    it = cl(titulo, corpo, listagem)[0]
    assert it["sistema"] == "saj" and it["gravidade"] != "informativa"
    assert "outro" not in (it["motivoRevisar"] or "")


def test_r09_fixture_peticionamento_inicial_eletronico():
    it = real(18902, "12/06/2020")
    assert it["sistema"] == "saj" and it["gravidade"] == "severa" and it["aplicavel"] is True


# R10 - geral qualificado
def test_r10_todos_os_sistemas_do_esaj_e_saj():
    assert real(2670, "10/09/2012")["sistema"] == "saj"  # "todos os sistemas do Portal e-SAJ"
    it = cl("03 e 04/02/2024 – Manutenção Programada",
            "O portal e-SAJ (incluindo peticionamento eletrônico) e todos os sistemas SAJ ficarão indisponíveis no "
            "próximo final de semana (3 e 4/2) para manutenção programada. A indisponibilidade começa no sábado e se "
            "encerra às 6 horas da próxima segunda-feira (5).", "03/02/2024")[0]
    assert it["sistema"] == "saj" and it["gravidade"] == "informativa" and it["revisar"] is False
    assert it["inicio"] is None and it["fim"] == "06:00"  # R11: "se encerra às 6 horas" é fim


def test_r10_datacenter_como_causa():
    it = real(6608, "22/05/2015")  # datacenter, mas só "Peticionamento Eletrônico e Portal EAD"
    assert it["sistema"] == "saj" and it["gravidade"] == "informativa"
    it = real(3024, "17/01/2013")  # "Indisponibilidade de Sistemas - Peticionamento Eletrônico de 1ª Instância"
    assert it["sistema"] == "saj"
    it = cl("08/08/2022 – MANUTENÇÃO PREVENTIVA IMPRESCINDÍVEL DO DATACENTER - INDISPONIBILIDADE DE SISTEMAS",
            B8 + "todos os serviços informatizados ficarão indisponíveis, interna e externamente, das 21h30 até às "
            "23h59 de hoje (8), incluindo Peticionamento Eletrônico, Portais e-SAJ, site TJSP, DJE, VPN, VDI e demais "
            "serviços.", "08/08/2022")[0]
    assert it["sistema"] == "geral"
    assert it["motivoRevisar"] == "manutenção programada: confirmar prorrogação"  # R33: segunda-feira, 21h30-23h59


# R11 - parser de horário
@pytest.mark.parametrize("corpo,inicio,fim,dur,horario", [
    ("com inicio por volta das 09h50m e encerramento por volta das 16h40 do mesmo dia",
     "09:50", "16:40", 410, "09h50 às 16h40"),
    ("iniciada a situação por volta das 14h02m do dia 12/06/2023 e restabelecida por volta das 02h do dia 13/06/2023",
     "14:02", "02:00", 718, "14h02 (12/06) às 02h (13/06)"),
    ("no período de 21/11/2016 às 12:30 a 22/11/2016 às 14:00", "12:30", "14:00", 1530, "12h30 (21/11) às 14h00 (22/11)"),
    ("no período de 11/01/2017 – 09h00 a 21/01/2017 - 01h:00", "09:00", "01:00", 13920, "09h00 (11/01) às 01h00 (21/01)"),
    ("no dia 13/05/2024, com início às 09h até às 16h do dia 16/05/2024", "09:00", "16:00", 4740,
     "09h (13/05) às 16h (16/05)"),
    ("com inicio por volta das 10h do dia 16 e resolvido por volta das 09h do dia 23/10/2024", "10:00", "09:00", 10020,
     "10h (16/10) às 09h (23/10)"),
    ("com início por volta das 13h25m do dia 13 e restabelecido o serviço em 16/12/2024 por volta das 19h50",
     "13:25", "19:50", 4705, "13h25 (13/12) às 19h50 (16/12)"),
    ("estarão indisponíveis a partir das 21:00h de 04/09/2017 até 04:00h de 05/09/2017", "21:00", "04:00", 420,
     "21h00 (04/09) às 04h00 (05/09)"),
    ("com inicio às 06h00m e retorno da normalização às 17:48m", "06:00", "17:48", 708, "06h00 às 17h48"),
    ("das 16:00hs até as 19:30hs", "16:00", "19:30", 210, "16h00 às 19h30"),
    ("a partir das 13h40 e serviço restabelecido por volta das 18h30m do próprio dia", "13:40", "18:30", 290,
     "13h40 às 18h30"),
    ("O problema acima mencionado foi solucionado no dia 22/04/2013, às 15:30hs.", None, "15:30", None, "até 15h30"),
    ("tendo ocorrida a primeira notificação às 17h40m", "17:40", None, None, "a partir de 17h40"),
    ("por 2h53m (das 21h06m a 23h59m), no dia 17/05/2019", "21:06", "23:59", 173, "21h06 às 23h59"),
])
def test_r11_parser_de_horario(corpo, inicio, fim, dur, horario):
    h = robo.extrair_horario(corpo, 2024)
    assert (h["inicio"], h["fim"], h["duracaoMin"], h["horario"]) == (inicio, fim, dur, horario)


def test_r11_fixture_inicio_e_encerramento():
    it = real(48973, "07/10/2024")
    assert (it["inicio"], it["fim"], it["duracaoMin"]) == ("09:50", "16:40", 410)


# R12 - superior60 pela duração calculada
def test_r12_superior60_pela_duracao():
    it = cl("17/05/2019 – INDISPONIBILIDADE DO PETICIONAMENTO ELETRÔNICO",
            "o Peticionamento Eletrônico de 1ª, 2ª Instância e Colégio Recursal apresentou intermitência por 2h53m "
            "(das 21h06m a 23h59m), no dia 17/05/2019.", "23/05/2019")[0]
    assert it["superior60"] is True and it["duracaoMin"] == 173 and it["aplicavel"] is True


# R13 - menos de 60 min é informativa, salvo na faixa das 23h às 24h
def test_r13_informativa_abaixo_de_60():
    it = cl("Indisponibilidade do Sistema de Peticionamento Eletrônico",
            "o Sistema de Peticionamento Eletrônico ficou temporariamente indisponível no dia 15/10/2012, das 10h15min "
            "às 10h45min.", "16/10/2012")[0]
    assert it["duracaoMin"] == 30 and it["gravidade"] == "informativa"
    it = cl("15/02/2023 – INDISPONIBILIDADE DOS SERVIÇOS DO PORTAL E-SAJ",
            B8 + "os serviços do Portal e-SAJ apresentaram indisponibilidade 15/02/2023, com início aproximado às "
            "23h48m e término às 00h01m do dia 16/02/2023.", "16/02/2023")[0]
    assert it["duracaoMin"] == 13 and it["gravidade"] == "normal"


# R14 - serviço parcial
def test_r14_servico_parcial():
    it = real(42446, "05/02/2024")  # complemento de cadastro, "alguns usuários"
    assert it["gravidade"] == "informativa"
    it = real(49221, "23/10/2024")  # peticionamento de carta precatória por 8 dias
    assert it["gravidade"] == "informativa"
    # carta precatória num dia só continua normal
    it = cl("16/10/2024 – INDISPONIBILIDADE PARA PETICIONAR CARTA PRECATORIA NO PORTAL E-SAJ",
            B8 + "os serviços do Peticionamento de Carta Precatória no Portal e-SAJ apresentaram indisponibilidade "
            "por tempo superior a 60 minutos, das 10h às 12h.")[0]
    assert it["gravidade"] == "normal"


# R15 - manutenção programada: só o aviso (futuro) é informativo
def test_r15_manutencao_ja_ocorrida():
    it = real(3024, "17/01/2013")  # "ficou indisponível ... das 20 horas às 23h59" (manutenção do CNA da OAB)
    assert it["gravidade"] == "normal"
    assert real(6608, "22/05/2015")["gravidade"] == "informativa"  # "ficarão indisponíveis"


# R17 - suspensão de prazos
def test_r17_suspensao_de_prazos():
    it = real(18100, "11/07/2019")  # "(E-SAJ, Portal de Custas, Extrajudicial, RDO)"
    assert it["sistema"] == "saj" and it["gravidade"] == "normal"
    assert it["revisar"] and "suspensão de prazos" in it["motivoRevisar"]
    it = cl("COMUNICADO CONJUNTO Nº 333/2016",
            "os prazos processuais na 1ª e 2ª instâncias estarão suspensos no dia 18/03/2016.", "18/03/2016")[0]
    assert it["gravidade"] == "normal" and "suspensão de prazos" in it["motivoRevisar"]


# R18/R19 - sem os gatilhos de título e de 180 min
def test_r18_r19_gatilhos_removidos():
    it = real(54969, "12/09/2025")  # "PORTAL DE CUSTAS - ERRO NA EMISSÃO DE GUIA"
    assert it["sistema"] == "custas" and it["revisar"] is False
    it = cl("10/10/2026 – INTERMITÊNCIA NO PETICIONAMENTO ELETRÔNICO DE 1º GRAU DO PORTAL E-SAJ",
            B8 + "o Peticionamento Eletrônico apresentou intermitência por tempo superior a 60 minutos, das 08h às 14h.")[0]
    assert it["duracaoMin"] == 360 and it["revisar"] is False


# R20 - "outro" só vai para revisão se puder ser processual
def test_r20_outro_so_se_parecer_processual():
    it = cl("07/06/2018 - INDISPONIBILIDADE – Portal de Internet TJSP",
            B8 + "Portal de Internet TJSP, www.tjsp.jus.br, apresentou problemas de indisponibilidade superior a 60 "
            "minutos no dia 07/06/2018.", "07/06/2018")[0]
    assert it["sistema"] == "outro" and it["revisar"] is False
    it = real(18273, "16/09/2019")  # incidente de desconsideração, enquadrado no art. 8º
    assert it["sistema"] == "outro" and it["revisar"] and "outro" in it["motivoRevisar"]


# R21 - não aplicável: só os motivos substantivos
def test_r21_sem_revisar_quando_nao_aplicavel():
    it = cl("INDISPONIBILIDADE – INTEGRAÇÃO TJSP X POLÍCIA CIVIL",
            "a integração entre os sistemas utilizados pelo TJSP e Polícia Civil apresentou intermitência.", "15/06/2019")[0]
    assert it["aplicavel"] is False and it["revisar"] is False  # sem "data da listagem" nem "outro"
    it = cl("RETIFICAÇÃO - 05/10/2026 - INDISPONIBILIDADE DO EPROC DE 2º GRAU")[0]
    assert it["aplicavel"] is False and "retificação" in it["motivoRevisar"]


# R22 - faixa longa de serviço integral
def test_r22_faixa_longa_integral():
    it = cl("18 à 20/06/2018 - INDISPONIBILIDADE – Serviço da Pasta Digital do Portal e-SAJ",
            B8 + "o serviço da Pasta Digital, do Portal e-SAJ, apresentou problemas de indisponibilidade superior a 60 "
            "minutos no dia 18 à 20/06/2018.", "21/06/2018")[0]
    assert it["revisar"] and "faixa longa" in it["motivoRevisar"]
    # dias não consecutivos não disparam
    it = cl("16, 19 e 20/10/2026 – INDISPONIBILIDADE NO PETICIONAMENTO ELETRÔNICO DO PORTAL E-SAJ",
            B8 + "o Peticionamento Eletrônico apresentou indisponibilidade por tempo superior a 60 minutos.")[0]
    assert it["revisar"] is False


# R23 - duração declarada x janela
def test_r23_duracao_declarada_diverge():
    it = cl("17/06/2019 – INDISPONIBILIDADE DO PETICIONAMENTO ELETRÔNICO DE 1º E 2ª INSTÂNCIA",
            B8 + "o Peticionamento Eletrônico Inicial e Intermediário de 1ª e 2ª Instância apresentou indisponibilidade "
            "das aplicações por 01h00m (das 09h00m a 11h30m), no dia 17/06/2019.", "17/06/2019")[0]
    assert it["duracaoMin"] == 150 and "duração declarada (60 min)" in it["motivoRevisar"]


# R24 - datas de escopo/previsão não são dias de indisponibilidade
def test_r24_datas_de_escopo_e_previsao():
    itens = cl("Indisponibilidade - Peticionamento Eletrônico 1ª Instância - Petições Intermediárias",
               "o serviço de peticionamento eletrônico para envio de Petições Intermediárias, exclusivamente "
               "direcionadas aos processos distribuídos a partir de 21/2/13, encontra-se temporariamente "
               "indisponível. A normalização desse problema está prevista para ocorrer no dia 28/2/13.", "27/02/2013")
    assert [i["data"] for i in itens] == ["27/02/2013"]
    assert itens[0]["revisar"] and "listagem" in itens[0]["motivoRevisar"]


# R25 - intervalo com travessão
def test_r25_intervalo_com_travessao():
    datas, _ = robo.extrair_datas("11/01/2017 – 21/01/2017 – INTERMITÊNCIA NO ACESSO")
    assert len(datas) == 11 and robo.fmt_data(datas[0]) == "11/01/2017" and robo.fmt_data(datas[-1]) == "21/01/2017"
    datas, _ = robo.extrair_datas("21/10/2026 - INDISPONIBILIDADE")
    assert [robo.fmt_data(d) for d in datas] == ["21/10/2026"]


# R26 - dias pelo horário (continuação do evento além do título)
def test_r26_dias_pelo_horario():
    itens = robo.ordenar(classificar_fixture(50872, "10/03/2025"))  # 14h00 de 10/03 até 17h07 de 11/03
    assert [i["data"] for i in itens] == ["11/03/2025", "10/03/2025"]
    assert "fora das datas" not in (itens[0]["motivoRevisar"] or "")
    itens = robo.ordenar(classificar_fixture(7894, "18/11/2016"))  # 21h de 18/11 até 6h de 21/11: sem o dia 21
    assert [i["data"] for i in itens] == ["20/11/2016", "19/11/2016", "18/11/2016"]
    assert itens[0]["aplicavel"] is True and "faixa longa" in itens[0]["motivoRevisar"]


# R27 - competência no nome de um foro listado
def test_r27_competencia_em_nome_de_foro():
    T = robo.norm("processos do: Foro Central Criminal – Juri / Foro Central Criminal Barra Funda / Foro Central - "
                  "Fazenda Pública/Acidentes / Foro Central Cível, que estão alocados nas bases PG5BF e PG5JM")
    assert robo._competencias_citadas(robo._sem_nomes_de_foro(T)) == []
    # fora de uma lista, a competência continua valendo
    it = cl("10/10/2026 – INDISPONIBILIDADE DO EPROC",
            "O sistema Eproc de 1º Grau, apenas no Foro das Execuções Fiscais, apresentou indisponibilidade superior a "
            "60 minutos.")[0]
    assert it["aplicavel"] is False


def test_seeds_nao_regrediram():
    it = classificar_fixture(73099, "24/07/2026")
    assert all(i["gravidade"] == "severa" and i["sistema"] == "saj" and i["aplicavel"] is True for i in it)
    it = classificar_fixture(80432, "21/10/2026")[0]
    assert it["sistema"] == "eproc" and it["gravidade"] == "normal" and it["aplicavel"] is True
    for codigo, listagem in [(80438, "21/10/2026"), (75622, "26/08/2026"), (75582, "25/08/2026"), (73857, "04/08/2026")]:
        assert all(i["gravidade"] == "informativa" and i["sistema"] == "custas" for i in classificar_fixture(codigo, listagem))


# R28 - suspensão de prazos: só o dia suspenso; as outras datas (orientação do DJE) não viram item
def test_r28_suspensao_so_no_dia_suspenso():
    itens = classificar_fixture(7216, "18/03/2016")
    assert [i["data"] for i in itens] == ["18/03/2016"]
    assert "suspensão de prazos" in itens[0]["motivoRevisar"]
    # suspensão sem outras datas continua igual
    assert [i["data"] for i in classificar_fixture(18100, "11/07/2019")] == ["11/07/2019"]


# R29 - data do título é só a publicação; o corpo traz a janela completa em dia anterior
def test_r29_janela_do_corpo_antes_da_publicacao():
    itens = classificar_fixture(8309, "25/04/2017")
    assert [i["data"] for i in itens] == ["24/04/2017"]
    assert (itens[0]["inicio"], itens[0]["fim"], itens[0]["duracaoMin"]) == ("18:30", "23:40", 310)
    # a janela no próprio dia do título não muda nada
    itens = cl("25/04/2017 – INDISPONIBILIDADE DO PETICIONAMENTO ELETRÔNICO",
               B8 + "o peticionamento eletrônico apresentou indisponibilidade no período de 25/04/2017 – 18h30min a "
               "25/04/2017-23h40min.", "25/04/2017")
    assert [i["data"] for i in itens] == ["25/04/2017"]


# R30 - intervalo maior que 31 dias: só o primeiro dia, informativa e revisar (mesmo não aplicável)
def test_r30_intervalo_maior_que_31_dias():
    itens = classificar_fixture(18817, "11/05/2020")  # 18/11/2019 a 17/03/2020
    assert [i["data"] for i in itens] == ["18/11/2019"]
    it = itens[0]
    assert it["gravidade"] == "informativa" and it["aplicavel"] is False and it["revisar"] is True
    assert "intervalo maior que 31 dias" in it["motivoRevisar"]
    itens = cl("01/03/2026 a 15/04/2026 – INDISPONIBILIDADE DO PETICIONAMENTO ELETRÔNICO NO PORTAL E-SAJ",
               B8 + "o peticionamento eletrônico apresentou indisponibilidade superior a 60 minutos.")
    assert len(itens) == 1 and itens[0]["gravidade"] == "informativa" and "intervalo" in itens[0]["motivoRevisar"]


# R31 - fim em data ilegível ("18/20/24") não vira janela no mesmo dia
def test_r31_fim_em_data_ilegivel():
    it = real(42446, "05/02/2024")  # título 30/01/2024 a 19/02/2024: o fim fica no último dia do título
    assert (it["inicio"], it["fim"], it["duracaoMin"]) == ("14:57", "18:20", 29003)
    assert it["horario"] == "14h57 (30/01) às 18h20 (19/02)"
    it = cl("30/01/2024 – INDISPONIBILIDADE NO PORTAL E-SAJ",
            B8 + "o Portal e-SAJ apresentou indisponibilidade por tempo superior a 60 minutos desde às 14h57m do dia "
            "30/01/24 até às 18h20m do dia 18/20/24.", "05/02/2024")[0]
    assert it["fim"] is None and it["duracaoMin"] is None
    assert it["horario"] == "14h57 (30/01) às 18h20 (data ilegível)"


# R32 - dia coberto só de 0h a 6h não ganha item (também quando as datas vêm do corpo)
def test_r32_madrugada_do_ultimo_dia_pelo_corpo():
    itens = robo.ordenar(classificar_fixture(5962, "24/06/2014"))  # 20h de 18/06 até 3h20 de 20/06
    assert [i["data"] for i in itens] == ["19/06/2014", "18/06/2014"]
    assert itens[0]["duracaoMin"] == 1880


# R11b - fim só com o dia da semana e o dia do mês ("6 horas da próxima segunda-feira (5)")
def test_r11b_fim_na_proxima_segunda():
    itens = classificar_fixture(42443, "03/02/2024")
    assert [i["data"] for i in itens] == ["03/02/2024", "04/02/2024"]
    assert all(i["fim"] == "06:00" and i["horario"] == "até 6h (05/02)" for i in itens)
    assert all(i["gravidade"] == "informativa" and i["revisar"] is False for i in itens)  # fim de semana


# R16b - retificação anunciada no corpo
def test_r16b_retificacao_no_corpo():
    it = real(56739, "13/10/2025")  # "Em retificação ao Comunicado realizado em 08/10/2025"
    assert it["aplicavel"] is False and it["motivoRevisar"] == "retificação de comunicado anterior"
    it = real(5962, "24/06/2014")  # "RETIFICANDO O COMUNICADO DIVULGADO"
    assert "retificação de comunicado anterior" in it["motivoRevisar"]
    it = cl("10/10/2026 – INDISPONIBILIDADE DO PORTAL E-SAJ", B8 + "o Portal e-SAJ apresentou indisponibilidade por "
            "tempo superior a 60 minutos para a retificação de dados cadastrais.")[0]
    assert "retificação" not in (it["motivoRevisar"] or "")


# R07b - corpo taxativo sobre outra instituição, título só com a rubrica do serviço: vale o corpo
def test_r07b_corpo_taxativo_vence_rubrica_do_titulo():
    it = real(7459, "08/07/2016")  # título: peticionamento de 1ª Instância; corpo: Central Facilitadora – MP
    assert it["aplicavel"] is False and it["gravidade"] == "informativa" and it["revisar"] is False
    assert "Central Facilitadora" in it["motivoNaoAplicavel"]
    assert "alcance a confirmar" not in it["escopo"]


# R14b - peticionamento de RPV/requisitório por vários dias é serviço parcial
def test_r14b_rpv_faixa_longa_informativa():
    itens = classificar_fixture(18543, "17/12/2019")  # 26/11 a 16/12/2019
    assert len(itens) == 21 and all(i["gravidade"] == "informativa" and i["aplicavel"] is False for i in itens)
    # um dia só continua com a gravidade do TJSP
    it = cl("10/10/2019 - INDISPONIBILIDADE PETICIONAMENTO DE RPV", B8 + "o serviço de peticionamento de RPV apresentou "
            "indisponibilidade das aplicações por tempo superior a 60 minutos.", "10/10/2019")[0]
    assert it["gravidade"] == "normal"


# Textos: escopo sem "a confirmar" quando já não se aplica; SIVEC é execução criminal; datas descartadas do corpo
def test_textos_cosmeticos():
    it = real(15107, "16/08/2018")
    assert it["aplicavel"] is False and it["revisar"] is False and "alcance a confirmar" not in it["escopo"]
    it = real(27039, "15/10/2021")
    assert it["motivoNaoAplicavel"] == "restrito à execução criminal (SIVEC/VEC), fora do JEC Cível"
    assert "outra instituição" not in it["motivoNaoAplicavel"]
    it = real(3243, "27/02/2013")
    assert it["revisar"] is True and it["data"] == "27/02/2013"
    assert it["motivoRevisar"] == ("datas do corpo só qualificam o escopo, a previsão ou a publicação (21/02/2013, "
                                   "28/02/2013); usada a data da listagem")


# R04b - base com a lista explícita de comarcas/foros sem Marília: não se aplica (sem revisar)
@pytest.mark.parametrize("codigo,listagem", [
    (39416, "18/08/2023"),  # "processos das comarcas: Agudos, Andradina, ..." (base PG5ARCT)
    (47467, "04/09/2024"),  # "base PG5JM (Foro Central – Fazenda Pública/Acidentes; Foro Central Cível; ...)"
    (34461, "19/01/2023"),  # "Base JM do SAJ (Foro Central - ...; ...)"
    (49427, "05/11/2024"),  # "processos do: Foro Central Criminal – Juri / Foro Central ... / ..."
    (50115, "12/12/2024"),  # "Base GRU: Arujá, Carapicuíba, ... Base RP: ..."
])
def test_r04b_base_com_lista_sem_marilia(codigo, listagem):
    it = real(codigo, listagem)
    assert it["aplicavel"] is False and it["revisar"] is False
    assert "Marília não está na lista" in it["motivoNaoAplicavel"] and "lista sem Marília" in it["escopo"]


def test_r04b_base_sem_lista_continua_revisar():
    it = cl("19/01/2023- INDISPONIBILIDADE NA CONSULTA PROCESSUAL DE 1ª INSTÂNCIA DA BASE JM DO SAJ",
            B8 + "a Consulta Processual de 1ª Instância dos processos alocados na Base JM do SAJ apresentou "
            "indisponibilidade por tempo superior a 60 minutos.")[0]
    assert it["aplicavel"] is None and it["revisar"] is True


# R33 - aviso de manutenção programada: horário útil de dia útil -> normal + revisar; noite/fim de semana -> informativa
def test_r33_manutencao_programada_pela_janela():
    itens = classificar_fixture(8273, "08/04/2017")  # sexta 22h até domingo 22h
    assert all(i["gravidade"] == "normal" for i in itens)
    assert "manutenção programada: confirmar prorrogação" in itens[0]["motivoRevisar"]
    it = real(8243, "28/03/2017")  # "durante a noite e madrugada desta terça (28) para quarta-feira"
    assert it["gravidade"] == "informativa" and it["revisar"] is False
    assert real(6608, "22/05/2015")["gravidade"] == "informativa"  # sábado, 9h às 13h
    # dia útil, horário comercial, mesmo citando o art. 8º
    it = cl("14/10/2026 – MANUTENÇÃO PROGRAMADA NO PORTAL E-SAJ",
            B8 + "o peticionamento eletrônico e a consulta processual ficarão indisponíveis das 12h às 14h do dia "
            "14/10/2026.")[0]
    assert it["gravidade"] == "normal" and "confirmar prorrogação" in it["motivoRevisar"]
    # dia útil, só de madrugada
    it = cl("14/10/2026 – MANUTENÇÃO PROGRAMADA NO PORTAL E-SAJ",
            "Será realizada manutenção programada: o peticionamento eletrônico ficará indisponível das 00h às 05h do "
            "dia 14/10/2026.")[0]
    assert it["gravidade"] == "informativa" and it["revisar"] is False
    # aviso que já diz que os prazos serão prorrogados: normal, sem revisar
    it = cl("14/10/2026 – MANUTENÇÃO PROGRAMADA NO PORTAL E-SAJ",
            "O peticionamento eletrônico ficará indisponível das 12h às 14h, e os prazos serão prorrogados.")[0]
    assert it["gravidade"] == "normal" and it["revisar"] is False


def test_r33_cobre_horario_util():
    d = robo.parse_data
    base = {"inicio": None, "fim": None, "dataInicio": None, "dataFim": None}
    seg, sab = d("12/10/2026"), d("10/10/2026")
    assert robo._cobre_horario_util({**base, "inicio": "23:00", "fim": "23:59"}, [seg], "") is True  # 23h-24h conta
    assert robo._cobre_horario_util({**base, "inicio": "00:00", "fim": "06:00"}, [seg], "") is False
    assert robo._cobre_horario_util({**base, "inicio": "09:00", "fim": "18:00"}, [sab], "") is False
    assert robo._cobre_horario_util(base, [seg], "DURANTE A MADRUGADA") is False
    assert robo._cobre_horario_util(base, [seg], "") is True  # sem horário num dia útil: conservador
