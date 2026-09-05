# 📋 Progreso del Proyecto PUBLI SHOP LEÓN GTO

> Última actualización: 5 de septiembre de 2026

---

## ✅ 1. Página web actualizada

- Nombre del negocio actualizado a **PUBLI SHOP LEÓN GTO** en todo el sitio.
- Información de contacto actualizada:
  - Teléfono/WhatsApp: **477 841 1655**
  - Correo: **publi.shop.leongto@gmail.com**
  - Facebook: **https://www.facebook.com/profile.php?id=61561137908571**
- Enlace de Facebook corregido.
- Logo de Instagram eliminado (no tienen cuenta).
- Galería limpia sin fotos duplicadas/mezcladas.
- Web publicada en GitHub Pages: https://anibru300.github.io/Publishop

Archivos modificados:
- `index.html`
- `README.md`

---

## ✅ 2. Automatización con Facebook Graph API

Se creó una carpeta `scripts/` con herramientas de automatización oficiales de Meta.

### Scripts creados:

| Script | Función | Estado |
|--------|---------|--------|
| `facebook_automation.py` | Publicar, leer posts y ver estadísticas | ✅ Funcionando |
| `content_extractor.py` | Extraer publicaciones e imágenes de Facebook | ✅ Funcionando |
| `download_images.py` | Descargar imágenes organizadas por categoría | ✅ Funcionando |
| `weekly_scheduler.py` | Publicar según calendario (soporta 2 posts/día) | ✅ Funcionando |
| `run_automation.py` | Script maestro que ejecuta todo | ✅ Funcionando |
| `auto_responder.py` | Responder mensajes/comentarios automáticamente | ⚠️ Limitado por Meta |
| `image_rotator.py` | Rotación de imágenes sin repetición | ✅ Funcionando |

### Calendario de contenido:

- Archivo: `scripts/content_calendar.json`
- Configurado para **2 publicaciones por día**.
- 14 publicaciones semanales con fotos, textos profesionales, hashtags y CTA a WhatsApp.

### Imágenes descargadas:

- **65 imágenes** extraídas de la página de Facebook.
- Organizadas en `assets/images/facebook_extracted/` por categoría:
  - `termos/`, `tazas/`, `plumas/`, `dtf/`, `vinil/`, `mdf/`, `general/`

---

## ✅ 3. GitHub Actions configurado

Se creó el workflow `.github/workflows/facebook-posts.yml` para publicar automáticamente desde la nube.

### Horarios programados:

| Hora UTC | Hora aproximada México | Franja | Publicación |
|----------|------------------------|--------|-------------|
| 16:00 UTC | 10:00 a.m. | `morning` | 1 post matutino del día |
| 00:00 UTC | 6:00 p.m. | `evening` | 1 post vespertino del día |

> **Total: 2 publicaciones diarias, una por cada franja horaria.**

### Lógica de publicación:

- El workflow determina automáticamente la franja horaria según la hora UTC de ejecución.
- `morning`: publica el post del día programado antes de las 14:00 (hora México).
- `evening`: publica el post del día programado desde las 14:00 en adelante.
- Esto evita publicar duplicados y respeta los horarios estratégicos del calendario.

### Secretos configurados en GitHub:

- `FACEBOOK_PAGE_ID`: `293448483863008`
- `FACEBOOK_PAGE_ACCESS_TOKEN`: Token de página de Facebook

### Rotación de imágenes y textos (nuevo — 5 de septiembre de 2026):

- ✅ Las publicaciones ya **no repiten imágenes**: cada post elige la imagen menos usada recientemente de su categoría (`image_rotator.py`).
- ✅ Estado persistente en `scripts/used_images.json`, commiteado automáticamente por el workflow después de cada publicación.
- ✅ Carpeta prioritaria `assets/images/nuevas/`: las fotos nuevas que suba el usuario se publican primero (subcarpetas por categoría opcionales).
- ✅ Textos: cada publicación tiene 2 variantes que alternan semana a semana (`messages` en el calendario).
- 📱 Guía para subir fotos desde el celular: `scripts/COMO_SUBIR_IMAGENES.md` (GitHub → Add file → Upload files).
- 📊 Pool actual: 65 imágenes (~5 semanas sin repetir a 2 posts/día).

### Estado actual:

- ⚠️ Workflow ejecutándose pero fallando por token de Facebook incorrecto (ver incidente 2026-08-23).
- ✅ Lógica de franjas horarias implementada para publicar 1 post por ejecución.
- ✅ Día del calendario y franja horaria calculados con hora de México (`America/Mexico_City`).
- ✅ Validación de token mejorada: ahora detecta tokens sin permisos de lectura/escritura.
- ✅ Graph API actualizada a v22.0.
- ✅ Publicaciones verificadas después de crearlas con `GET /{post_id}`.
- ✅ Protección contra duplicados: no publica si el mismo mensaje ya existe en los últimos 7 días.
- ✅ Workflow marca fallo si ninguna publicación se crea correctamente.
- ✅ Emojis y codificación UTF-8 corregidos en logs de GitHub Actions.

Guía de configuración: `scripts/GITHUB_ACTIONS_SETUP.md`

---

## ⚠️ 4. Incidentes recientes

### 2026-08-23 — Fallo de publicación por token incorrecto

**Error:**
- `Invalid OAuth 2.0 Access Token`
- `(#200) The permission(s) publish_actions are not available. It has been deprecated.`

**Causa:** El secreto `FACEBOOK_PAGE_ACCESS_TOKEN` en GitHub no es un **Page Access Token** válido con permiso `pages_manage_posts`. Puede ser un User Access Token o un token de página sin los permisos necesarios.

**Solución aplicada:**
1. Se mejoró `facebook_automation.py` para detectar este error durante la validación inicial (ahora también prueba lectura de posts con `/{PAGE_ID}/posts`).
2. Se mejoraron los mensajes de error para indicar claramente cómo regenerar el token.
3. Se actualizó `README_FACEBOOK_API.md` con instrucciones más detalladas.

**Resuelto:**
- ✅ Page Access Token regenerado correctamente desde `me/accounts`.
- ✅ Token actualizado en `publishop/scripts/.env` local.
- ✅ Token actualizado en secreto `FACEBOOK_PAGE_ACCESS_TOKEN` de GitHub.
- ✅ Publicaciones de prueba publicadas exitosamente.
- ✅ Código mejorado subido a GitHub (`commit e2022c2`).

**Vencimiento del token actual:** ~22 de octubre de 2026  
**Recordatorio:** Renovar a principios de octubre de 2026.

---

## ⚠️ 5. Limitaciones encontradas

### No se pudo automatizar respuestas de comentarios:

- Meta deprecó el permiso `pages_read_user_content`.
- `pages_manage_engagement` depende internamente de ese permiso y falla.
- Solución temporal: responder comentarios manualmente desde Meta Business Suite.

### No se pudo automatizar respuestas de Messenger:

- El permiso `pages_messaging` requiere **App Review + Business Verification** para producción.
- En modo desarrollo solo funciona con cuentas de prueba.
- Solución temporal: responder mensajes manualmente desde Meta Business Suite o WhatsApp.

---

## 📌 6. Próximos pasos pendientes

1. **Verificar publicaciones automáticas de mañana:**
   - Lunes 25 de agosto a las 10:00 a.m. México: post de termos.
   - Lunes 25 de agosto a las 6:00 p.m. México: post de servicios.
   - Si falla, revisar logs de GitHub Actions.

2. **Renovar token de Facebook a principios de octubre de 2026:**
   - El token actual vence ~22 de octubre de 2026.
   - Repetir proceso: Graph API Explorer → ampliar User Token → `me/accounts` → copiar Page Token → actualizar GitHub Secrets.
   - Considerar App Review + Business Verification para obtener token permanente.

2. **Crecimiento en redes sociales:**
   - Configurar Instagram Business y conectarlo.
   - Crear Reels/videos cortos del proceso de personalización.
   - Pedir reseñas a clientes satisfechos.
   - Planificar sorteos o dinámicas.

3. **Replicar para CJ Consultoria:**
   - Aplicar el mismo sistema de automatización a la otra página de negocio.

4. **Publicidad pagada (futuro):**
   - Cuando haya presupuesto, configurar anuncios con `ads_management`.

---

## 🛠️ Comandos útiles

```bash
# Ejecutar script maestro localmente
cd scripts
python run_automation.py

# Simular sin publicar
python run_automation.py --dry-run

# Publicar solo posts del día
python run_automation.py --posts

# Extraer contenido de Facebook
python run_automation.py --extract

# Ver estadísticas
python run_automation.py --insights
```

---

## 🔒 Notas de seguridad

- El archivo `scripts/.env` contiene el token de acceso y **nunca debe subirse a GitHub**.
- Ya está protegido por `.gitignore`.
- El token de Facebook expira cada **60 días** y debe renovarse en GitHub Secrets.
