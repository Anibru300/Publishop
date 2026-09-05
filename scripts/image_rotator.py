#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
PUBLI SHOP LEÓN GTO - Rotador de imágenes

Elige automáticamente qué imagen publicar para cada categoría, evitando
repeticiones. Usa primero las imágenes nuevas (carpeta `nuevas/`) y luego
rota por todo el pool de imágenes extraídas, siempre eligiendo la imagen
que hace más tiempo no se publica.

Estado persistente: scripts/used_images.json (se commitea desde GitHub Actions).

Uso:
    from image_rotator import pick_image, mark_used, save_state

    image_path = pick_image("termos")   # Path de la imagen elegida
    # ... publicar ...
    mark_used(image_path)               # Registrar que ya se usó
    save_state()                        # Guardar estado en disco
"""

import sys
import json
from pathlib import Path
from datetime import datetime
from zoneinfo import ZoneInfo

sys.stdout.reconfigure(encoding="utf-8")

BASE_DIR = Path(__file__).parent
STATE_FILE = BASE_DIR / "used_images.json"

IMAGES_BASE_DIR = BASE_DIR.parent / "assets" / "images" / "facebook_extracted"
NEW_IMAGES_DIR = BASE_DIR.parent / "assets" / "images" / "nuevas"

MEXICO_TZ = ZoneInfo("America/Mexico_City")

IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp"}

# Mapeo de categoría del calendario -> carpeta de imágenes.
# Las categorías de "texto" (tips, clientes, faq, cta...) usan la carpeta
# del producto que ilustran; si no hay match se usa "general".
CATEGORY_MAP = {
    "termos": "termos",
    "plumas": "plumas",
    "dtf": "dtf",
    "mdf": "mdf",
    "tazas": "tazas",
    "vinil": "vinil",
    "general": "general",
    "servicios": "general",
    "tips": "termos",
    "clientes": "general",
    "promocion": "dtf",
    "faq": "plumas",
    "cta": "tazas",
}

_state = None


def _today():
    return datetime.now(MEXICO_TZ).strftime("%Y-%m-%d")


def load_state():
    """Carga el estado de imágenes usadas (en memoria, con caché)."""
    global _state
    if _state is not None:
        return _state

    if STATE_FILE.exists():
        with open(STATE_FILE, "r", encoding="utf-8") as f:
            _state = json.load(f)
    else:
        _state = {"images": {}}

    # Compatibilidad: asegurar la clave "images"
    _state.setdefault("images", {})
    return _state


def _list_images(folder: Path):
    """Lista imágenes de una carpeta (sin recursar)."""
    if not folder.exists():
        return []
    return sorted(
        p for p in folder.iterdir()
        if p.is_file() and p.suffix.lower() in IMAGE_EXTENSIONS
    )


def _candidates_for(category: str):
    """
    Devuelve la lista de candidatos en orden de prioridad:
    1. nuevas/<categoria>/   (fotos nuevas de esa categoría)
    2. nuevas/               (fotos nuevas sin categoría)
    3. facebook_extracted/<categoria>/
    """
    folder = CATEGORY_MAP.get(category, "general")
    candidates = []
    candidates += _list_images(NEW_IMAGES_DIR / folder)
    candidates += _list_images(NEW_IMAGES_DIR)
    candidates += _list_images(IMAGES_BASE_DIR / folder)
    return candidates


def pick_image(category: str):
    """
    Elige la mejor imagen para una categoría:

    1. Imágenes que nunca se han usado (en orden de prioridad de carpetas).
    2. Si todas se usaron: la que hace MÁS tiempo no se publica
       (así la repetición queda lo más espaciada posible).

    Returns:
        Path absoluto de la imagen elegida.
    """
    state = load_state()
    used = state["images"]

    candidates = _candidates_for(category)

    # Fallback: si la categoría no tiene imágenes, usar las de "general"
    if not candidates:
        candidates = _candidates_for("general")

    if not candidates:
        raise FileNotFoundError(
            f"❌ No hay imágenes disponibles para la categoría '{category}'. "
            f"Revisa las carpetas assets/images/nuevas/ y facebook_extracted/."
        )

    # 1) Prioridad: imágenes nunca usadas
    unused = [p for p in candidates if str(p) not in used]
    if unused:
        chosen = unused[0]
        print(f"  🖼️ Imagen nueva (sin usar): {chosen.name}")
        return chosen

    # 2) Todas usadas: la menos recientemente usada
    def last_used_date(p):
        return used.get(str(p), "")

    chosen = min(candidates, key=lambda p: (last_used_date(p), p.name))
    days = "???"
    try:
        from datetime import date
        last = date.fromisoformat(last_used_date(chosen))
        days = (date.today() - last).days
    except ValueError:
        pass
    print(f"  🖼️ Imagen rotada (último uso hace {days} días): {chosen.name}")
    return chosen


def mark_used(image_path):
    """Registra una imagen como usada hoy (en memoria; usar save_state() para guardar)."""
    state = load_state()
    state["images"][str(Path(image_path))] = _today()


def save_state():
    """Guarda el estado de imágenes usadas en disco."""
    state = load_state()
    STATE_FILE.parent.mkdir(parents=True, exist_ok=True)
    with open(STATE_FILE, "w", encoding="utf-8") as f:
        json.dump(state, f, ensure_ascii=False, indent=2)


def pool_stats():
    """Imprime estadísticas del pool de imágenes (para diagnóstico)."""
    state = load_state()
    used = state["images"]
    print("\n📊 Estado del pool de imágenes:\n")
    for category in sorted(set(CATEGORY_MAP.values())):
        candidates = _candidates_for(category)
        unused = [p for p in candidates if str(p) not in used]
        print(f"- {category}: {len(unused)} sin usar / {len(candidates)} totales")
    print(f"\nTotal registradas como usadas: {len(used)}\n")


if __name__ == "__main__":
    print("🖼️ PUBLI SHOP LEÓN GTO - Rotador de imágenes\n")
    pool_stats()

    if len(sys.argv) > 1:
        category = sys.argv[1]
        try:
            path = pick_image(category)
            print(f"Categoría '{category}' -> {path}")
        except FileNotFoundError as e:
            print(e)
