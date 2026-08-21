#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
PUBLI SHOP LEÓN GTO - Master Automation Script

Ejecuta todas las tareas automatizables de tu página de Facebook:
1. Publica el contenido del día según el calendario
2. Extrae y guarda el contenido más reciente de la página
3. Guarda un resumen de estadísticas

Uso:
    python run_automation.py              # Ejecutar todo
    python run_automation.py --posts      # Solo publicaciones
    python run_automation.py --extract    # Solo extracción de contenido
    python run_automation.py --insights   # Solo estadísticas
"""

import sys
import json
from pathlib import Path
from datetime import datetime
from zoneinfo import ZoneInfo

sys.stdout.reconfigure(encoding="utf-8")

MEXICO_TZ = ZoneInfo("America/Mexico_City")

# Importamos funciones de otros scripts
from weekly_scheduler import load_calendar, get_today_posts, publish_post as _publish_post
from content_extractor import extract_recent_posts
from facebook_automation import get_page_insights


DRY_RUN = False
TIME_SLOT = None


def publish_post(post):
    """Wrapper para respetar el modo dry-run."""
    return _publish_post(post, dry_run=DRY_RUN)


def run_posts():
    """Publica todas las publicaciones del día."""
    print("\n" + "=" * 50)
    print("📅 PUBLICACIONES DEL DÍA")
    print("=" * 50 + "\n")

    calendar = load_calendar()
    posts = get_today_posts(calendar, time_slot=TIME_SLOT)

    if not posts:
        print("❌ No hay publicaciones programadas para hoy.")
        return

    mode = "SIMULACIÓN" if DRY_RUN else "Publicando"
    print(f"🚀 {mode} {len(posts)} publicaciones...\n")
    success = 0
    for post in posts:
        if publish_post(post):
            success += 1

    print(f"\n📊 Resumen: {success}/{len(posts)} publicaciones exitosas.")


def run_extraction():
    """Extrae el contenido más reciente de la página."""
    print("\n" + "=" * 50)
    print("📥 EXTRACCIÓN DE CONTENIDO")
    print("=" * 50 + "\n")

    try:
        posts = extract_recent_posts(limit=50)
        print(f"✅ {len(posts)} publicaciones extraídas.")
    except Exception as e:
        print(f"❌ Error extrayendo contenido: {e}")


def run_insights():
    """Guarda las estadísticas de la página."""
    print("\n" + "=" * 50)
    print("📊 ESTADÍSTICAS")
    print("=" * 50 + "\n")

    try:
        insights = get_page_insights()

        # Guardamos en un archivo JSON con fecha
        base_dir = Path(__file__).parent
        insights_file = base_dir / "insights_history.json"

        history = []
        if insights_file.exists():
            with open(insights_file, "r", encoding="utf-8") as f:
                history = json.load(f)

        history.append({
            "date": datetime.now(MEXICO_TZ).isoformat(),
            "fan_count": insights.get("fan_count"),
            "followers_count": insights.get("followers_count"),
            "talking_about_count": insights.get("talking_about_count"),
        })

        with open(insights_file, "w", encoding="utf-8") as f:
            json.dump(history, f, ensure_ascii=False, indent=2)

        print(f"✅ Estadísticas guardadas en {insights_file}")
    except Exception as e:
        print(f"❌ Error obteniendo estadísticas: {e}")


def main():
    import argparse

    parser = argparse.ArgumentParser(
        description="Automatización maestra de PUBLI SHOP LEÓN GTO"
    )
    parser.add_argument("--posts", action="store_true", help="Solo publicaciones")
    parser.add_argument("--extract", action="store_true", help="Solo extracción")
    parser.add_argument("--insights", action="store_true", help="Solo estadísticas")
    parser.add_argument("--dry-run", action="store_true", help="Simular sin publicar")
    parser.add_argument("--time-slot", type=str, choices=["morning", "evening"],
                        help="Franja horaria: morning (<14:00) o evening (>=14:00)")
    args = parser.parse_args()

    global DRY_RUN, TIME_SLOT
    DRY_RUN = args.dry_run
    TIME_SLOT = args.time_slot

    mexico_now = datetime.now(MEXICO_TZ)
    print("🚀 PUBLI SHOP LEÓN GTO - Automatización Maestra")
    print(f"📅 Hora del servidor (UTC): {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"📅 Hora de México (usada para el calendario): {mexico_now.strftime('%Y-%m-%d %H:%M:%S %Z')}\n")

    # Si no se especifica nada, ejecutamos todo
    run_all = not (args.posts or args.extract or args.insights)

    if run_all or args.posts:
        run_posts()

    if run_all or args.extract:
        run_extraction()

    if run_all or args.insights:
        run_insights()

    print("\n" + "=" * 50)
    if DRY_RUN:
        print("🧪 Simulación completada (no se publicó nada)")
    else:
        print("✅ Automatización completada")
    print("=" * 50 + "\n")


if __name__ == "__main__":
    main()
