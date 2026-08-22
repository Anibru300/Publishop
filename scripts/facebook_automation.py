#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
PUBLI SHOP LEÓN GTO - Facebook Graph API Automation

Este script publica automáticamente en tu Página de Facebook usando la API oficial
de Meta (Facebook Graph API).

Requisitos:
    pip install requests

Configuración:
    1. Crea un archivo .env en esta carpeta con:
       PAGE_ID=tu_id_de_pagina
       PAGE_ACCESS_TOKEN=tu_token_de_pagina
    2. Ejecuta: python facebook_automation.py
"""

import os
import sys
import json
import requests
from pathlib import Path
from dotenv import load_dotenv

# Configura UTF-8 para evitar errores de codificación en Windows
sys.stdout.reconfigure(encoding="utf-8")

# Carga las variables del archivo .env
load_dotenv()

# ─────────────────────────────────────────────────────────────────────────────
# CONFIGURACIÓN
# ─────────────────────────────────────────────────────────────────────────────

# Lee variables de entorno o usa valores directos (no recomendado subir tokens)
PAGE_ID = os.getenv("PAGE_ID", "").strip()
PAGE_ACCESS_TOKEN = os.getenv("PAGE_ACCESS_TOKEN", "").strip()

# Versión de la API de Facebook (puedes actualizarla)
GRAPH_API_VERSION = "v22.0"
BASE_URL = f"https://graph.facebook.com/{GRAPH_API_VERSION}"


def _check_config():
    """Verifica que existan PAGE_ID y PAGE_ACCESS_TOKEN."""
    if not PAGE_ID or not PAGE_ACCESS_TOKEN:
        raise ValueError(
            "❌ Faltan PAGE_ID o PAGE_ACCESS_TOKEN.\n"
            "Crea un archivo .env en la carpeta scripts/ con:\n"
            "PAGE_ID=tu_id_de_pagina\n"
            "PAGE_ACCESS_TOKEN=tu_token_de_pagina"
        )


def validate_page_token():
    """
    Valida que el token pueda acceder a la página configurada.
    No imprime el token ni el PAGE_ID completo.
    Devuelve (bool, mensaje).
    """
    _check_config()
    endpoint = f"{PAGE_ID}"
    params = {"fields": "id,name"}
    try:
        result = _make_request("GET", endpoint, params=params)
        page_id_returned = result.get("id")
        page_name = result.get("name", "Desconocida")
        if page_id_returned != PAGE_ID:
            return False, "❌ PAGE_ID no coincide con la página accesible por el token"
        return True, f"✅ Token válido\n✅ Página accesible\n✅ Página correcta: {page_name}"
    except Exception as e:
        return False, f"❌ Token inválido\n❌ Página inaccesible\n{str(e)}"


def _make_request(method, endpoint, data=None, files=None, params=None):
    """Realiza una petición a la Graph API y devuelve la respuesta JSON."""
    url = f"{BASE_URL}/{endpoint}"
    request_params = {"access_token": PAGE_ACCESS_TOKEN}
    if params:
        request_params.update(params)

    try:
        response = requests.request(
            method=method,
            url=url,
            data=data,
            files=files,
            params=request_params,
            timeout=60,
        )
        response.raise_for_status()
        return response.json()
    except requests.exceptions.HTTPError as e:
        error_data = e.response.json() if e.response.text else {}
        error = error_data.get("error", {})
        error_message = error.get("message", str(e))
        error_code = error.get("code")
        error_subcode = error.get("error_subcode")

        if error_code == 190:
            raise Exception(f"❌ Token expirado o revocado: {error_message}") from e
        if error_code == 200:
            raise Exception(f"❌ Permisos insuficientes: {error_message}") from e
        if error_code == 104:
            raise Exception(f"❌ Límite de solicitudes alcanzado: {error_message}") from e
        if error_code == 100:
            raise Exception(f"❌ Parámetro inválido: {error_message}") from e

        raise Exception(f"Error de Facebook API ({error_code}/{error_subcode}): {error_message}") from e
    except Exception as e:
        raise Exception(f"Error en la petición: {str(e)}") from e


# ─────────────────────────────────────────────────────────────────────────────
# FUNCIONES PARA PUBLICAR
# ─────────────────────────────────────────────────────────────────────────────

def post_text(message: str):
    """Publica un mensaje de texto en tu página."""
    _check_config()
    endpoint = f"{PAGE_ID}/feed"
    data = {"message": message}
    result = _make_request("POST", endpoint, data=data)
    print(f"✅ Publicación de texto exitosa. ID: {result.get('id')}")
    return result


def post_link(message: str, link: str):
    """Publica un mensaje con un enlace en tu página."""
    _check_config()
    endpoint = f"{PAGE_ID}/feed"
    data = {"message": message, "link": link}
    result = _make_request("POST", endpoint, data=data)
    print(f"✅ Publicación con enlace exitosa. ID: {result.get('id')}")
    return result


def post_photo(message: str, photo_path: str):
    """Publica una foto desde tu computadora en tu página."""
    _check_config()
    path = Path(photo_path)
    if not path.exists():
        raise FileNotFoundError(f"❌ No se encontró la imagen: {photo_path}")

    endpoint = f"{PAGE_ID}/photos"
    data = {"message": message}

    with open(path, "rb") as image_file:
        files = {"file": image_file}
        result = _make_request("POST", endpoint, data=data, files=files)

    post_id = result.get("id")
    if not post_id:
        raise Exception("Meta no devolvió un ID de publicación")
    print("✅ Publicación creada correctamente")

    if not verify_post_exists(post_id):
        raise Exception(f"La publicación {post_id} no pudo ser verificada en Facebook")

    return result


def upload_unpublished_photo(photo_path: str):
    """
    Sube una foto a Facebook sin publicarla y devuelve su media_fbid.
    Se usa para construir carruseles de imágenes.
    """
    _check_config()
    path = Path(photo_path)
    if not path.exists():
        raise FileNotFoundError(f"❌ No se encontró la imagen: {photo_path}")

    endpoint = f"{PAGE_ID}/photos"
    data = {"published": "false"}

    with open(path, "rb") as image_file:
        files = {"file": image_file}
        result = _make_request("POST", endpoint, data=data, files=files)

    media_fbid = result.get("id")
    if not media_fbid:
        raise Exception("Meta no devolvió un media_fbid para la foto")
    return media_fbid


def post_carousel(message: str, photo_paths: list):
    """
    Publica un carrusel de fotos en la página.

    Args:
        message: Texto de la publicación.
        photo_paths: Lista de rutas de imágenes (recomendado mismo aspect ratio).
    """
    _check_config()

    if not photo_paths:
        raise ValueError("❌ Se requiere al menos una imagen para el carrusel")

    if len(photo_paths) > 10:
        raise ValueError("❌ Facebook permite máximo 10 imágenes por carrusel")

    # Subimos cada foto sin publicar
    media_fbids = []
    for photo_path in photo_paths:
        media_fbid = upload_unpublished_photo(photo_path)
        media_fbids.append(media_fbid)

    # Publicamos el feed post con las fotos adjuntas
    endpoint = f"{PAGE_ID}/feed"
    attached_media = json.dumps([{"media_fbid": fbid} for fbid in media_fbids])
    data = {
        "message": message,
        "attached_media": attached_media,
    }

    result = _make_request("POST", endpoint, data=data)
    post_id = result.get("id")
    if not post_id:
        raise Exception("Meta no devolvió un ID de publicación")

    print(f"✅ Carrusel publicado correctamente. ID: {post_id}")

    if not verify_post_exists(post_id):
        raise Exception(f"La publicación {post_id} no pudo ser verificada en Facebook")

    return result


def post_video(message: str, video_path: str, title: str = None):
    """
    Publica un video en la página.

    Args:
        message: Descripción del video.
        video_path: Ruta al archivo de video.
        title: Título opcional del video.
    """
    _check_config()
    path = Path(video_path)
    if not path.exists():
        raise FileNotFoundError(f"❌ No se encontró el video: {video_path}")

    endpoint = f"{PAGE_ID}/videos"
    data = {"description": message}
    if title:
        data["title"] = title

    with open(path, "rb") as video_file:
        files = {"file": video_file}
        result = _make_request("POST", endpoint, data=data, files=files)

    video_id = result.get("id")
    if not video_id:
        raise Exception("Meta no devolvió un ID de video")

    print(f"✅ Video publicado correctamente. ID: {video_id}")

    # Los videos pueden tardar en procesarse; la verificación es opcional
    if not verify_post_exists(video_id):
        print(f"⚠️ El video aún se procesa, pero fue subido con ID: {video_id}")

    return result


# ─────────────────────────────────────────────────────────────────────────────
# FUNCIONES PARA LEER INFORMACIÓN
# ─────────────────────────────────────────────────────────────────────────────

def verify_post_exists(post_id: str):
    """
    Verifica que una publicación realmente exista en Facebook.
    Retorna True si existe, False en caso contrario.
    """
    _check_config()
    endpoint = f"{post_id}"
    params = {"fields": "id,created_time"}
    try:
        result = _make_request("GET", endpoint, params=params)
        if result.get("id") == post_id:
            print("✅ Publicación verificada en Facebook")
            return True
        print("⚠️ La publicación no coincide con el ID esperado")
        return False
    except Exception as e:
        print(f"⚠️ No se pudo verificar la publicación: {e}")
        return False


def is_duplicate_post(message: str, hours_back: int = 24):
    """
    Verifica si ya existe una publicación reciente con el mismo mensaje.
    Útil para evitar publicaciones duplicadas si el workflow se ejecuta
    más de una vez para la misma franja horaria.
    """
    _check_config()
    endpoint = f"{PAGE_ID}/posts"
    params = {
        "fields": "id,message,created_time",
        "limit": 10,
    }
    try:
        result = _make_request("GET", endpoint, params=params)
        posts = result.get("data", [])

        from datetime import datetime, timezone, timedelta
        now = datetime.now(timezone.utc)
        cutoff = now - timedelta(hours=hours_back)

        for post in posts:
            post_message = post.get("message", "") or ""
            created_time_str = post.get("created_time")
            if not created_time_str:
                continue

            try:
                post_time = datetime.fromisoformat(created_time_str.replace("Z", "+00:00"))
            except ValueError:
                continue

            if post_time >= cutoff and post_message.strip() == message.strip():
                return True

        return False
    except Exception as e:
        print(f"⚠️ No se pudo verificar duplicados: {e}")
        return False


def get_recent_posts(limit: int = 5):
    """Obtiene las últimas publicaciones de tu página."""
    _check_config()
    endpoint = f"{PAGE_ID}/posts"
    params = {
        "fields": "id,message,created_time,permalink_url,full_picture",
        "limit": limit,
    }
    result = _make_request("GET", endpoint, params=params)
    posts = result.get("data", [])

    print(f"\n📄 Últimas {len(posts)} publicaciones:\n")
    for post in posts:
        print(f"- ID: {post.get('id')}")
        print(f"  Fecha: {post.get('created_time')}")
        print(f"  Mensaje: {post.get('message', '[Sin texto]')}")
        print(f"  URL: {post.get('permalink_url', 'N/A')}")
        print()

    return posts


def get_page_insights():
    """Obtiene métricas básicas de tu página."""
    _check_config()
    endpoint = f"{PAGE_ID}"
    params = {
        "fields": "fan_count,followers_count,rating_count,talking_about_count",
    }
    result = _make_request("GET", endpoint, params=params)

    print("\n📊 Estadísticas de la página:\n")
    print(f"- Likes: {result.get('fan_count', 'N/A')}")
    print(f"- Seguidores: {result.get('followers_count', 'N/A')}")
    print(f"- Personas hablando de esto: {result.get('talking_about_count', 'N/A')}")
    print(f"- Calificaciones: {result.get('rating_count', 'N/A')}")
    print()

    return result


def get_unread_messages(limit: int = 10):
    """
    Obtiene mensajes recientes de la bandeja de entrada.
    Requiere permiso 'pages_messaging' o 'pages_read_user_content'.
    """
    _check_config()
    endpoint = f"{PAGE_ID}/conversations"
    params = {
        "fields": "id,updated_time,senders,messages{message,created_time,from}",
        "limit": limit,
    }
    result = _make_request("GET", endpoint, params=params)
    conversations = result.get("data", [])

    print(f"\n💬 Últimas {len(conversations)} conversaciones:\n")
    for conv in conversations:
        senders = conv.get("senders", {}).get("data", [])
        sender_name = senders[0].get("name", "Desconocido") if senders else "Desconocido"
        print(f"- Conversación con: {sender_name}")
        messages = conv.get("messages", {}).get("data", [])
        if messages:
            last_msg = messages[0]
            print(f"  Último mensaje: {last_msg.get('message', '[Sin texto]')}")
            print(f"  De: {last_msg.get('from', {}).get('name', 'N/A')}")
            print(f"  Fecha: {last_msg.get('created_time', 'N/A')}")
        print()

    return conversations


# ─────────────────────────────────────────────────────────────────────────────
# EJEMPLOS DE USO
# ─────────────────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    print("🚀 PUBLI SHOP LEÓN GTO - Facebook Automation\n")

    try:
        # Ejemplo 1: Publicar solo texto
        # post_text("¡Hola! 👋 En PUBLI SHOP LEÓN GTO personalizamos termos, tazas, playeras y más. Escríbenos por WhatsApp al 477 841 1655.")

        # Ejemplo 2: Publicar con enlace
        # post_link(
        #     message="Visita nuestra página web para ver todos nuestros trabajos personalizados 🎨",
        #     link="https://anibru300.github.io/Publishop"
        # )

        # Ejemplo 3: Publicar foto local (descomenta y cambia la ruta)
        # post_photo(
        #     message="Termos grabados con láser ✨ Personalizamos con el diseño que tú quieras.",
        #     photo_path="../assets/images/productos/termos/termo-01.jpg"
        # )

        # Ejemplo 4: Ver estadísticas
        # get_page_insights()

        # Ejemplo 5: Ver publicaciones recientes
        # get_recent_posts(5)

        # Ejemplo 6: Ver mensajes recientes (requiere permisos extra)
        # get_unread_messages(5)

        print("ℹ️ Abre el archivo facebook_automation.py y descomenta las funciones que quieras probar.")

    except Exception as e:
        print(f"\n❌ Error: {e}")
