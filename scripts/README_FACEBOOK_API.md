# 🤖 Guía: Automatizar tu Página de Facebook con Graph API

Esta guía te explica paso a paso cómo conectar tu página **PUBLI SHOP LEÓN GTO** a la API oficial de Facebook para poder publicar automáticamente, leer comentarios y ver estadísticas.

> ⚠️ **Importante:** Esta es la API oficial de Meta. No usamos scraping ni herramientas no autorizadas, así que tu cuenta está segura si sigues estos pasos.

---

## ✅ Requisitos previos

1. Tener una **Página de Facebook de negocio** (ya la tienes).
2. Tener una **cuenta personal de Facebook** que sea administradora de esa página.
3. Tener instalado **Python 3.8+** en tu computadora.

---

## 🛠 Paso 1: Crear una App en Meta for Developers

1. Ve a 👉 [developers.facebook.com](https://developers.facebook.com)
2. Inicia sesión con tu cuenta personal de Facebook.
3. Haz clic en **"Mis apps"** → **"Crear app"**.
4. En "¿Con qué tipo de app estamos construyendo?", elige **"Otro"**.
5. En "Selecciona un tipo de app", elige **"Business"** (Negocio).
6. Ponle un nombre, por ejemplo: `Publishop Automation`
7. Coloca tu correo de contacto.
8. Haz clic en **"Crear app"**.

---

## 📋 Paso 2: Agregar el producto Facebook Login

1. Dentro del panel de tu nueva app, busca **"Agregar producto"**.
2. Encuentra **"Facebook Login"** y haz clic en **"Configurar"**.
3. No necesitas configurar nada más por ahora.

---

## 🔑 Paso 3: Obtener tu Page ID (ID de tu página)

1. Ve a tu página de Facebook (`Publishop`).
2. Haz clic en **"Más"** → **"Configuración de la página"**.
3. En el menú lateral, busca **"Información de la página"**.
4. Verás **"ID de la página"**. Copia ese número.

> 💡 También puedes obtenerlo con el Graph API Explorer después.

---

## 🧪 Paso 4: Generar tu Page Access Token en Graph API Explorer

El **Page Access Token** es la "llave" que le da permiso al programa para publicar en tu página.

1. Ve a 👉 [developers.facebook.com/tools/explorer](https://developers.facebook.com/tools/explorer)
2. En la parte superior derecha, selecciona tu app recién creada.
3. Haz clic en **"Generate Access Token"** (Generar token de acceso).
4. Se abrirá una ventana pidiendo permisos. Selecciona:
   - ✅ `pages_manage_posts`
   - ✅ `pages_read_engagement`
   - ✅ `pages_show_list`
   - ✅ `pages_read_user_content` (si quieres leer comentarios)
5. Copia el token generado.

### Convertir el token de usuario a token de página

1. En el campo de la URL del Graph API Explorer, escribe:
   ```
   me/accounts
   ```
2. Haz clic en **"Submit"**.
3. Verás una lista de las páginas que administras.
4. Busca tu página `Publishop` y copia el valor de **`access_token`**.

> ⚠️ Este token expira cada **60 días** en modo desarrollo. Para que no expire, tu app necesita pasar por **App Review** y **Business Verification** (más adelante).

---

## 💻 Paso 5: Instalar Python y la librería requests

1. Abre la terminal o símbolo del sistema.
2. Verifica que tienes Python instalado:
   ```bash
   python --version
   ```
3. Instala las librerías necesarias:
   ```bash
   pip install requests python-dotenv
   ```

---

## ⚙️ Paso 6: Configurar el script

1. En esta carpeta (`scripts/`), crea un archivo llamado **`.env`**.
2. Copia el contenido de `.env.example` y pega tu información:
   ```env
   PAGE_ID=123456789012345
   PAGE_ACCESS_TOKEN=EAAG...
   ```
3. Guarda el archivo.

> 🔒 **Nunca subas este archivo `.env` a internet.** Ya está ignorado en `.gitignore`.

---

## 🚀 Paso 7: Probar tu primera publicación automática

1. Abre la terminal en la carpeta `scripts/`.
2. Ejecuta el script:
   ```bash
   python facebook_automation.py
   ```
3. Si todo está bien, verás un mensaje como:
   ```
   ✅ Publicación exitosa. ID: 1234567890_1234567890
   ```
4. Revisa tu página de Facebook: ¡la publicación debería aparecer!

---

## 📅 Calendario de publicaciones automáticas

Ya incluimos un calendario de contenido para toda la semana en `content_calendar.json`.

### Publicar el día de hoy:
```bash
python weekly_scheduler.py
```

### Publicar un día específico:
```bash
python weekly_scheduler.py --day Lunes
```

### Publicar todo el calendario (prueba):
```bash
python weekly_scheduler.py --all
```

> 💡 Para automatizarlo realmente cada día, puedes programar el script con el Programador de Tareas de Windows o con `cron`.

---

## 📥 Extraer contenido de tu página

Puedes descargar las fotos y videos de tus publicaciones anteriores para reutilizarlos.

```bash
python content_extractor.py     # Extrae publicaciones a extracted_content.json
python download_images.py       # Descarga las imágenes organizadas por categoría
```

Las imágenes se guardan en `assets/images/facebook_extracted/`.

---

## 🤖 Respuestas automáticas

El script `auto_responder.py` revisa mensajes y comentarios recientes y sugiere respuestas automáticas según palabras clave.

```bash
python auto_responder.py --messages     # Revisar mensajes
python auto_responder.py --comments     # Revisar comentarios
python auto_responder.py --all          # Revisar ambos
```

> ⚠️ Para responder mensajes automáticamente necesitas el permiso adicional `pages_messaging`.
> Para responder comentarios necesitas `pages_manage_engagement`.

---

## 📊 ¿Qué más puedes hacer con el script?

El script incluye funciones para:

| Función | Descripción |
|---------|-------------|
| `post_text(message)` | Publicar solo texto |
| `post_link(message, link)` | Publicar texto con enlace |
| `post_photo(message, photo_path)` | Publicar foto desde tu computadora |
| `get_recent_posts(limit)` | Ver tus últimas publicaciones |
| `get_page_insights()` | Ver likes, seguidores e interacciones |
| `get_unread_messages()` | Leer mensajes recientes (requiere permiso adicional) |

---

## 🔄 Paso 8: Renovar el token (cada 60 días)

Mientras tu app esté en modo desarrollo, el token expira cada 2 meses. Tienes dos opciones:

### Opción A: Manual (por ahora)
Repite el **Paso 4** cada 60 días y actualiza tu archivo `.env`.

### Opción B: Automático (más avanzado)
- Obtener un **token de larga duración** (long-lived token) con `oauth/access_token`.
- Programar una tarea que renueve el token antes de que expire.
- Esto requiere App Review y Business Verification para producción.

---

## 🚨 Límites y advertencias

- **No publiques demasiado rápido.** Facebook tiene límites de rate limit.
- **No envíes spam.** Publicar contenido repetitivo puede limitar tu página.
- **Los mensajes automáticos por Messenger requieren permisos adicionales** (`pages_messaging`).
- **Para uso público o comercial avanzado**, necesitarás pasar por **App Review** y **Business Verification** en Meta.

---

## 🆘 ¿Tienes errores?

Errores comunes:

| Error | Solución |
|-------|----------|
| `Invalid token` | Tu token expiró o no tiene los permisos correctos. Repite el Paso 4. |
| `(#200) Permissions error` | Tu app no tiene el permiso `pages_manage_posts`. Verifica en el Graph API Explorer. |
| `Page not found` | El `PAGE_ID` está mal escrito. Verifica en Configuración de la página. |
| `Unsupported post type` | Estás usando un parámetro no válido. Revisa el mensaje de error. |

---

## 🎯 Siguiente paso recomendado

Una vez que funcione tu primera publicación automática, podemos crear un **calendario de contenido** y automatizar que publique tus productos diariamente usando las imágenes de tu carpeta `assets/images/`.
