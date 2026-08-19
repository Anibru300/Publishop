#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
PUBLI SHOP LEÓN GTO - Download Images from Facebook

Descarga las imágenes de las publicaciones extraídas y las organiza
por categoría para usar en la página web y en futuras publicaciones.
"""

import sys
import json
import requests
from pathlib import Path
from urllib.parse import urlparse

sys.stdout.reconfigure(encoding="utf-8")

BASE_DIR = Path(__file__).parent
JSON_FILE = BASE_DIR / "extracted_content.json"
OUTPUT_DIR = BASE_DIR.parent / "assets" / "images" / "facebook_extracted"

# Palabras clave para clasificar por categoría
CATEGORY_KEYWORDS = {
    "termos": ["termo", "termos"],
    "tazas": ["taza", "tazas"],
    "plumas": ["pluma", "plumas"],
    "dtf": ["dtf", "playera", "playeras", "camiseta", "textil"],
    "vinil": ["vinil", "calcomania", "calcomanía", "sticker", "etiqueta", "lona"],
    "mdf": ["mdf", "cofre", "cofres", "pino", "pinos", "retrato", "letrero", "corte"],
}


def classify_post(message: str) -> str:
    """Clasifica una publicación por categoría según su texto."""
    message_lower = message.lower()
    for category, keywords in CATEGORY_KEYWORDS.items():
        if any(kw in message_lower for kw in keywords):
            return category
    return "general"


def download_image(url: str, folder: Path, filename: str) -> bool:
    """Descarga una imagen y la guarda en la carpeta indicada."""
    try:
        response = requests.get(url, timeout=60)
        response.raise_for_status()

        folder.mkdir(parents=True, exist_ok=True)
        filepath = folder / filename

        with open(filepath, "wb") as f:
            f.write(response.content)

        return True
    except Exception as e:
        print(f"  ⚠️ Error descargando {filename}: {e}")
        return False


def main():
    print("📥 Descargando imágenes de Facebook...\n")

    if not JSON_FILE.exists():
        print(f"❌ No se encontró {JSON_FILE}. Ejecuta primero content_extractor.py")
        return

    with open(JSON_FILE, "r", encoding="utf-8") as f:
        posts = json.load(f)

    total_downloaded = 0
    total_failed = 0

    for idx, post in enumerate(posts, start=1):
        message = post.get("message", "")
        category = classify_post(message)
        media_urls = post.get("media_urls", [])

        if not media_urls:
            continue

        print(f"[{idx}] Categoría: {category} | {message[:60].replace(chr(10), ' ')}...")

        for img_idx, url in enumerate(media_urls, start=1):
            # Genera un nombre de archivo único
            safe_message = "".join(c if c.isalnum() else "_" for c in message[:30])
            filename = f"{category}_{idx:02d}_{img_idx:02d}_{safe_message}.jpg"
            filename = filename.replace("__", "_").strip("_")

            folder = OUTPUT_DIR / category
            if download_image(url, folder, filename):
                total_downloaded += 1
                print(f"   ✅ {filename}")
            else:
                total_failed += 1

    print(f"\n📦 Descarga completa:")
    print(f"   ✅ Imágenes descargadas: {total_downloaded}")
    print(f"   ❌ Errores: {total_failed}")
    print(f"   📁 Guardadas en: {OUTPUT_DIR}")


if __name__ == "__main__":
    main()
