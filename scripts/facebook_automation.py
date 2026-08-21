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
        error_message = error_data.get("error", {}).get("message", str(e))
        raise Exception(f"Error de Facebook API: {error_message}") from e
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
    return result


# ─────────────────────────────────────────────────────────────────────────────
# FUNCIONES PARA LEER INFORMACIÓN
# ─────────────────────────────────────────────────────────────────────────────

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
