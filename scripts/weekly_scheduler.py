#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
PUBLI SHOP LEÓN GTO - Weekly Content Scheduler

Publica automáticamente en tu Página de Facebook según el calendario de
contenido definido en content_calendar.json.

Soporta múltiples publicaciones por día.

Uso:
    # Publicar todas las publicaciones del día de hoy
    python weekly_scheduler.py

    # Publicar todo el calendario de una vez (modo prueba)
    python weekly_scheduler.py --all

    # Publicar un día específico
    python weekly_scheduler.py --day Lunes

    # Simular sin publicar
    python weekly_scheduler.py --dry-run
"""

import sys
import json
import argparse
from pathlib import Path
from datetime import datetime
from facebook_automation import post_photo

sys.stdout.reconfigure(encoding="utf-8")

BASE_DIR = Path(__file__).parent
CALENDAR_FILE = BASE_DIR / "content_calendar.json"
IMAGES_BASE_DIR = BASE_DIR.parent / "assets" / "images" / "facebook_extracted"


def load_calendar():
    """Carga el calendario de contenido."""
    if not CALENDAR_FILE.exists():
        raise FileNotFoundError(f"No se encontró {CALENDAR_FILE}")

    with open(CALENDAR_FILE, "r", encoding="utf-8") as f:
        return json.load(f)["calendar"]


def publish_post(post_data, dry_run=False):
    """Publica una entrada del calendario."""
    image_path = IMAGES_BASE_DIR / post_data["image"]

    if not image_path.exists():
        print(f"  ⚠️ Imagen no encontrada: {image_path}")
        return False

    if dry_run:
        print(f"  🧪 [SIMULACIÓN] {post_data['day']} {post_data['time']} - {post_data['category']}")
        print(f"     Imagen: {image_path}")
        print(f"     Texto: {post_data['message'][:80]}...\n")
        return True

    try:
        post_photo(
            message=post_data["message"],
            photo_path=str(image_path),
        )
        print(f"  ✅ Publicado: {post_data['day']} {post_data['time']} - {post_data['category']}")
        return True
    except Exception as e:
        print(f"  ❌ Error publicando {post_data['day']} {post_data['time']}: {e}")
        return False


def get_today_posts(calendar):
    """Obtiene todas las publicaciones del día de hoy."""
    days_es = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"]
    today = days_es[datetime.now().weekday()]
    return [post for post in calendar if post["day"] == today]


def main():
    parser = argparse.ArgumentParser(description="Publicador semanal de PUBLI SHOP LEÓN GTO")
    parser.add_argument("--all", action="store_true", help="Publicar todo el calendario")
    parser.add_argument("--day", type=str, help="Publicar un día específico (ej: Lunes)")
    parser.add_argument("--dry-run", action="store_true", help="Simular sin publicar")
    args = parser.parse_args()

    calendar = load_calendar()

    if args.all:
        print(f"🚀 Publicando TODO el calendario ({len(calendar)} publicaciones)...\n")
        success = 0
        for post in calendar:
            if publish_post(post, dry_run=args.dry_run):
                success += 1
        print(f"\n📊 Publicaciones exitosas: {success}/{len(calendar)}")

    elif args.day:
        print(f"🚀 Publicando publicaciones de {args.day}...\n")
        posts = [p for p in calendar if p["day"] == args.day]
        if posts:
            success = 0
            for post in posts:
                if publish_post(post, dry_run=args.dry_run):
                    success += 1
            print(f"\n📊 Publicaciones exitosas: {success}/{len(posts)}")
        else:
            print(f"❌ No se encontraron publicaciones para {args.day}")

    else:
        posts = get_today_posts(calendar)
        print(f"🚀 Publicando {len(posts)} publicaciones del día de hoy...\n")
        if posts:
            success = 0
            for post in posts:
                if publish_post(post, dry_run=args.dry_run):
                    success += 1
            print(f"\n📊 Publicaciones exitosas: {success}/{len(posts)}")
        else:
            print("❌ No se encontraron publicaciones para hoy")


if __name__ == "__main__":
    main()
