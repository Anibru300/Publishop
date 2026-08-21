#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
PUBLI SHOP LEÓN GTO - Content Extractor

Extrae publicaciones, fotos, videos y textos de tu Página de Facebook
usando la Graph API. El resultado se guarda en un archivo JSON para
poder reutilizarlo en publicaciones y en la página web.
"""

import sys
import os
import json
import requests
from pathlib import Path
from dotenv import load_dotenv

sys.stdout.reconfigure(encoding="utf-8")
load_dotenv()

PAGE_ID = os.getenv("PAGE_ID", "")
PAGE_ACCESS_TOKEN = os.getenv("PAGE_ACCESS_TOKEN", "")
GRAPH_API_VERSION = "v22.0"
BASE_URL = f"https://graph.facebook.com/{GRAPH_API_VERSION}"


def _make_request(endpoint, params=None):
    url = f"{BASE_URL}/{endpoint}"
    request_params = {"access_token": PAGE_ACCESS_TOKEN}
    if params:
        request_params.update(params)

    response = requests.get(url, params=request_params, timeout=60)
    response.raise_for_status()
    return response.json()


def extract_recent_posts(limit=50):
    """Extrae las publicaciones recientes de la página con fotos, videos y texto."""
    if not PAGE_ID or not PAGE_ACCESS_TOKEN:
        raise ValueError("Faltan PAGE_ID o PAGE_ACCESS_TOKEN en el archivo .env")

    fields = (
        "id,message,created_time,permalink_url,full_picture,"
        "attachments{media,subattachments,title,type,url},"
        "status_type"
    )

    result = _make_request(
        f"{PAGE_ID}/posts",
        params={"fields": fields, "limit": limit},
    )

    posts = result.get("data", [])
    extracted = []

    for post in posts:
        media_urls = []
        media_types = []

        attachments = post.get("attachments", {}).get("data", [])
        for attachment in attachments:
            att_type = attachment.get("type", "")
            media = attachment.get("media", {})

            if att_type == "photo":
                image_url = media.get("image", {}).get("src")
                if image_url:
                    media_urls.append(image_url)
                    media_types.append("photo")
            elif att_type == "video":
                video_url = media.get("source")
                if video_url:
                    media_urls.append(video_url)
                    media_types.append("video")
            elif "subattachments" in attachment:
                for sub in attachment["subattachments"].get("data", []):
                    sub_type = sub.get("type", "")
                    sub_media = sub.get("media", {})
                    if sub_type == "photo":
                        img = sub_media.get("image", {}).get("src")
                        if img:
                            media_urls.append(img)
                            media_types.append("photo")

        # Si no hay attachments, usa full_picture como fallback
        if not media_urls and post.get("full_picture"):
            media_urls.append(post["full_picture"])
            media_types.append("photo")

        extracted.append({
            "id": post.get("id"),
            "created_time": post.get("created_time"),
            "message": post.get("message", ""),
            "permalink": post.get("permalink_url"),
            "status_type": post.get("status_type"),
            "media_count": len(media_urls),
            "media_urls": media_urls,
            "media_types": media_types,
        })

    return extracted


def save_to_json(data, filename="extracted_content.json"):
    """Guarda el contenido extraído en un archivo JSON."""
    output_path = Path(__file__).parent / filename
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    print(f"✅ Contenido guardado en: {output_path}")
    print(f"📦 Total de publicaciones extraídas: {len(data)}")


def print_summary(data):
    """Muestra un resumen del contenido extraído."""
    print("\n📊 Resumen del contenido de tu página:\n")
    print(f"Total de publicaciones: {len(data)}")

    with_photos = sum(1 for p in data if "photo" in p["media_types"])
    with_videos = sum(1 for p in data if "video" in p["media_types"])
    with_text_only = sum(1 for p in data if not p["media_types"] and p["message"])

    print(f"- Con fotos: {with_photos}")
    print(f"- Con videos: {with_videos}")
    print(f"- Solo texto: {with_text_only}")
    print()

    print("📝 Últimas 5 publicaciones:\n")
    for post in data[:5]:
        print(f"- Fecha: {post['created_time']}")
        print(f"  Tipo: {', '.join(post['media_types']) if post['media_types'] else 'texto'}")
        message = post['message'].replace('\n', ' ')[:100]
        print(f"  Texto: {message}{'...' if len(post['message']) > 100 else ''}")
        print(f"  URL: {post['permalink']}")
        print()


if __name__ == "__main__":
    print("🔍 Extrayendo contenido de PUBLI SHOP LEÓN GTO...\n")

    try:
        posts = extract_recent_posts(limit=50)
        save_to_json(posts)
        print_summary(posts)
    except Exception as e:
        print(f"\n❌ Error: {e}")
