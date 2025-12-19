#!/usr/bin/env python3
import json
import pathlib
import sys
import urllib.request
from typing import Dict, List

SERIES: Dict[str, Dict[str, object]] = {
    "ipca15": {"code": 7478, "path": pathlib.Path("calculadora/data/ipca15.json")},
    "selic": {"code": 4390, "path": pathlib.Path("calculadora/data/selic.json")},
}

PRIMARY = "https://api.bcb.gov.br/dados/serie/bcdata.sgs.{code}/dados?formato=json&dataInicial=01/01/2020&dataFinal=31/12/2030"
FALLBACK = "https://olinda.bcb.gov.br/olinda/servico/SGS/versao/v2/odata/ValoresSerie(SERIE={code})?$top=5000&$format=json"
HEADERS = {
    "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119 Safari/537.36",
    "Accept": "application/json",
    "Referer": "https://www.bcb.gov.br/",
}


def fetch_json(url: str):
    req = urllib.request.Request(url, headers=HEADERS)
    with urllib.request.urlopen(req, timeout=60) as response:
        payload = response.read()
    preview = payload[:200].decode("latin-1", errors="ignore").lower()
    if "<html" in preview:
        raise ValueError(f"HTML recebido de {url}")
    return json.loads(payload.decode("utf-8"))


def normalize(raw) -> List[Dict[str, str]]:
    if isinstance(raw, dict) and "value" in raw:
        raw = raw.get("value", [])
    output: List[Dict[str, str]] = []
    for item in raw or []:
        if not isinstance(item, dict):
            continue
        if "data" in item and "valor" in item:
            output.append({"data": str(item["data"]), "valor": str(item["valor"])})
        elif "Data" in item and "Valor" in item:
            date_str = str(item["Data"]).split("T")[0]
            year, month, day = date_str.split("-")
            output.append({"data": f"{day}/{month}/{year}", "valor": str(item["Valor"])})
    return output


def fetch_and_save(name: str, code: int, path: pathlib.Path):
    path.parent.mkdir(parents=True, exist_ok=True)
    for label, template in ("primary", PRIMARY), ("fallback", FALLBACK):
        url = template.format(code=code)
        try:
            raw = fetch_json(url)
            normalized = normalize(raw)
            if not normalized:
                raise ValueError("resposta sem dados utilizáveis")
            with path.open("w", encoding="utf-8") as fp:
                json.dump(normalized, fp, ensure_ascii=False, indent=2)
            print(f"[ok] {name}: {len(normalized)} registros ({label})")
            return
        except Exception as exc:  # noqa: BLE001
            print(f"[warn] {name} {label} falhou: {exc}", file=sys.stderr)
    raise SystemExit(f"Falha ao baixar série {name} ({code})")


def main():
    for name, meta in SERIES.items():
        fetch_and_save(name, int(meta["code"]), pathlib.Path(meta["path"]))


if __name__ == "__main__":
    main()
