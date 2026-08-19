# 📋 Progreso del Proyecto PUBLI SHOP LEÓN GTO

> Última actualización: 18 de agosto de 2026

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

| Hora UTC | Hora aproximada México | Acción |
|----------|------------------------|--------|
| 16:00 UTC | 10:00 a.m. | Publicar posts del día |
| 00:00 UTC | 6:00 p.m. | Publicar posts del día |

### Secretos configurados en GitHub:

- `FACEBOOK_PAGE_ID`: `293448483863008`
- `FACEBOOK_PAGE_ACCESS_TOKEN`: Token de página de Facebook

### Estado actual:

- Workflow ejecutándose correctamente desde GitHub Actions.
- Último problema detectado: error `publish_actions` deprecado.
- Pendiente: verificar que GitHub Actions use la última versión del workflow con escritura del `.env` mediante Python.

Guía de configuración: `scripts/GITHUB_ACTIONS_SETUP.md`

---

## ⚠️ 4. Limitaciones encontradas

### No se pudo automatizar respuestas de comentarios:

- Meta deprecó el permiso `pages_read_user_content`.
- `pages_manage_engagement` depende internamente de ese permiso y falla.
- Solución temporal: responder comentarios manualmente desde Meta Business Suite.

### No se pudo automatizar respuestas de Messenger:

- El permiso `pages_messaging` requiere **App Review + Business Verification** para producción.
- En modo desarrollo solo funciona con cuentas de prueba.
- Solución temporal: responder mensajes manualmente desde Meta Business Suite o WhatsApp.

---

## 📌 5. Próximos pasos pendientes

1. **Verificar GitHub Actions:**
   - Confirmar que el workflow publica correctamente desde GitHub.
   - Revisar log del paso "Crear archivo .env con secretos" y "Publicar en Facebook".

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
