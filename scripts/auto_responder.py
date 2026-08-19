#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
PUBLI SHOP LEÓN GTO - Auto Responder

Responde automáticamente mensajes de Messenger y comentarios de tu página
de Facebook según palabras clave.

⚠️ Requisitos adicionales en Meta for Developers:
    - Permiso 'pages_messaging' para responder mensajes de Messenger
    - Permiso 'pages_manage_engagement' para responder comentarios

Uso:
    python auto_responder.py --messages     # Revisar mensajes recientes
    python auto_responder.py --comments     # Revisar comentarios recientes
    python auto_responder.py --all          # Revisar mensajes y comentarios
"""

import sys
import os
import re
import requests
import argparse
from dotenv import load_dotenv

sys.stdout.reconfigure(encoding="utf-8")
load_dotenv()

PAGE_ID = os.getenv("PAGE_ID", "")
PAGE_ACCESS_TOKEN = os.getenv("PAGE_ACCESS_TOKEN", "")
GRAPH_API_VERSION = "v18.0"
BASE_URL = f"https://graph.facebook.com/{GRAPH_API_VERSION}"

# Respuestas automáticas según palabras clave
AUTO_RESPONSES = {
    r"\b(precio|precios|cuanto|cuesta|cotiza|cotizacion|cotización)\b": (
        "¡Hola! 👋 Claro que sí, con gusto te cotizamos.\n\n"
        "Cuéntanos qué producto te interesa, la cantidad y el diseño que deseas. "
        "Puedes enviarnos una foto o referencia.\n\n"
        "📲 WhatsApp: 477 841 1655"
    ),
    r"\b(horario|hora|abren|cierran|direccion|dirección|ubicacion|ubicación)\b": (
        "¡Hola! 👋 Nuestro horario es de lunes a sábado.\n\n"
        "📍 Ubicación: San Mateo #206, Col. La Florida, León, Gto.\n"
        "📲 WhatsApp: 477 841 1655\n"
        "🌐 https://anibru300.github.io/Publishop"
    ),
    r"\b(envio|envíos|envío|entrega|domicilio|mandan)\b": (
        "¡Hola! 👋 Sí hacemos entregas a domicilio en León y alrededores.\n\n"
        "El costo depende de la zona. También puedes pasar a recoger tu pedido.\n\n"
        "📲 WhatsApp: 477 841 1655"
    ),
    r"\b(playera|playeras|camiseta|ropa|textil|dtf)\b": (
        "¡Hola! 👋 Sí hacemos playeras personalizadas con impresión DTF.\n\n"
        "✅ Colores vibrantes\n"
        "✅ Desde una pieza\n"
        "✅ DTF normal y reflejante\n\n"
        "Envíanos tu diseño para cotizar.\n"
        "📲 WhatsApp: 477 841 1655"
    ),
    r"\b(termo|termos|cilindro|cilindros)\b": (
        "¡Hola! 👋 Sí tenemos termos personalizados con grabado láser.\n\n"
        "✅ Grabado permanente\n"
        "✅ Varios tamaños\n"
        "✅ Ideal para regalos y empresas\n\n"
        "Envíanos tu diseño para cotizar.\n"
        "📲 WhatsApp: 477 841 1655"
    ),
    r"\b(taza|tazas|mug)\b": (
        "¡Hola! 👋 Sí hacemos tazas personalizadas con sublimación.\n\n"
        "✅ Con foto, nombre o diseño\n"
        "✅ Ideal para regalos y recuerdos\n\n"
        "Envíanos tu diseño para cotizar.\n"
        "📲 WhatsApp: 477 841 1655"
    ),
    r"\b(pluma|plumas|boligrafo|bolígrafo|lapicero)\b": (
        "¡Hola! 👋 Sí hacemos plumas personalizadas con grabado láser.\n\n"
        "✅ Detalle elegante\n"
        "✅ Ideal para empresas y eventos\n\n"
        "Envíanos tu diseño para cotizar.\n"
        "📲 WhatsApp: 477 841 1655"
    ),
    r"\b(mdf|cofre|cofres|letrero|figura|madera)\b": (
        "¡Hola! 👋 Sí hacemos grabado y corte láser en MDF.\n\n"
        "✅ Cofres, letreros, figuras, retratos\n"
        "✅ Personalización completa\n\n"
        "Envíanos tu diseño para cotizar.\n"
        "📲 WhatsApp: 477 841 1655"
    ),
    r"\b(lona|lonas|vinil|calcomania|calcomanía|sticker|etiqueta)\b": (
        "¡Hola! 👋 Sí hacemos lonas, vinil de corte/impreso, calcomanías y etiquetas.\n\n"
        "✅ Publicidad de alto impacto\n"
        "✅ Personalizadas a tu medida\n\n"
        "Envíanos tu diseño para cotizar.\n"
        "📲 WhatsApp: 477 841 1655"
    ),
}

DEFAULT_RESPONSE = (
    "¡Hola! 👋 Gracias por contactar a PUBLI SHOP LEÓN GTO.\n\n"
    "Personalizamos termos, tazas, playeras, plumas, MDF, vinil, lonas y más.\n\n"
    "Cuéntanos en qué podemos ayudarte o envíanos tu diseño.\n"
    "📲 WhatsApp: 477 841 1655\n"
    "🌐 https://anibru300.github.io/Publishop"
)


def _make_request(endpoint, params=None, method="GET", data=None):
    url = f"{BASE_URL}/{endpoint}"
    request_params = {"access_token": PAGE_ACCESS_TOKEN}
    if params:
        request_params.update(params)

    response = requests.request(method, url, params=request_params, data=data, timeout=60)
    response.raise_for_status()
    return response.json()


def get_response_for_message(message: str) -> str:
    """Genera una respuesta automática según el mensaje recibido."""
    message_lower = message.lower()

    for pattern, response in AUTO_RESPONSES.items():
        if re.search(pattern, message_lower):
            return response

    return DEFAULT_RESPONSE


def check_messages():
    """Revisa mensajes recientes de Messenger y responde automáticamente."""
    print("💬 Revisando mensajes recientes...\n")

    try:
        result = _make_request(
            f"{PAGE_ID}/conversations",
            params={
                "fields": "id,updated_time,senders,messages{message,created_time,from}",
                "limit": 10,
            },
        )

        conversations = result.get("data", [])
        for conv in conversations:
            messages = conv.get("messages", {}).get("data", [])
            if not messages:
                continue

            # Último mensaje
            last_msg = messages[0]
            sender = last_msg.get("from", {})
            sender_id = sender.get("id", "")
            sender_name = sender.get("name", "Desconocido")
            message_text = last_msg.get("message", "")

            # Evita responder tus propios mensajes
            if sender_id == PAGE_ID:
                continue

            print(f"- Mensaje de {sender_name}: {message_text[:80]}...")
            response = get_response_for_message(message_text)
            print(f"  Respuesta sugerida:\n{response}\n")

    except Exception as e:
        print(f"❌ Error al revisar mensajes: {e}")
        print("ℹ️ Probablemente necesitas el permiso 'pages_messaging' en tu app.")


def check_comments():
    """Revisa comentarios recientes y responde automáticamente."""
    print("💬 Revisando comentarios recientes...\n")

    try:
        result = _make_request(
            f"{PAGE_ID}/feed",
            params={
                "fields": "id,message,comments{message,from,id}",
                "limit": 10,
            },
        )

        posts = result.get("data", [])
        for post in posts:
            comments = post.get("comments", {}).get("data", [])
            for comment in comments:
                sender = comment.get("from", {})
                sender_id = sender.get("id", "")
                sender_name = sender.get("name", "Desconocido")
                message_text = comment.get("message", "")

                if sender_id == PAGE_ID:
                    continue

                print(f"- Comentario de {sender_name}: {message_text[:80]}...")
                response = get_response_for_message(message_text)
                print(f"  Respuesta sugerida:\n{response}\n")

    except Exception as e:
        print(f"❌ Error al revisar comentarios: {e}")
        print("ℹ️ Probablemente necesitas el permiso 'pages_manage_engagement' en tu app.")


def main():
    parser = argparse.ArgumentParser(description="Auto responder de PUBLI SHOP LEÓN GTO")
    parser.add_argument("--messages", action="store_true", help="Revisar mensajes")
    parser.add_argument("--comments", action="store_true", help="Revisar comentarios")
    parser.add_argument("--all", action="store_true", help="Revisar mensajes y comentarios")
    args = parser.parse_args()

    if not PAGE_ID or not PAGE_ACCESS_TOKEN:
        print("❌ Faltan PAGE_ID o PAGE_ACCESS_TOKEN en el archivo .env")
        return

    if args.all or (not args.messages and not args.comments):
        check_messages()
        print("-" * 50)
        check_comments()
    elif args.messages:
        check_messages()
    elif args.comments:
        check_comments()


if __name__ == "__main__":
    main()
