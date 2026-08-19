# ☁️ Configurar GitHub Actions para publicaciones automáticas

Esta guía explica cómo configurar GitHub Actions para que publique automáticamente en tu página de Facebook **2 veces al día**, sin depender de tu computadora.

---

## ✅ Paso 1: Copiar el Page Access Token

1. Abre el archivo local:
   ```
   C:\Users\Carlos\Desktop\Publishop\publishop\scripts\.env
   ```
2. Copia el valor de `PAGE_ACCESS_TOKEN`.
3. También necesitarás el `PAGE_ID`:
   ```
   293448483863008
   ```

> 🔒 **No compartas este token con nadie.** Guárdalo solo en GitHub Secrets.

---

## ✅ Paso 2: Agregar secretos en GitHub

1. Ve a tu repositorio en GitHub:
   👉 https://github.com/Anibru300/Publishop
2. Arriba, haz clic en la pestaña **"Settings"** (Configuración).
3. En el menú lateral izquierdo, busca **"Secrets and variables"** → **"Actions"**.
4. Haz clic en el botón verde **"New repository secret"**.
5. Crea el primer secreto:
   - **Name:** `FACEBOOK_PAGE_ID`
   - **Secret:** `293448483863008`
   - Haz clic en **"Add secret"**
6. Crea el segundo secreto:
   - **Name:** `FACEBOOK_PAGE_ACCESS_TOKEN`
   - **Secret:** pega aquí tu `PAGE_ACCESS_TOKEN`
   - Haz clic en **"Add secret"**

---

## ✅ Paso 3: Verificar que el workflow existe

El archivo `.github/workflows/facebook-posts.yml` ya debe estar en tu repositorio. Si hiciste push, aparecerá en:

👉 https://github.com/Anibru300/Publishop/actions

---

## ✅ Paso 4: Probar manualmente

1. Ve a **"Actions"** en tu repositorio de GitHub.
2. Haz clic en **"Publicaciones automáticas en Facebook"**.
3. Haz clic en el botón **"Run workflow"**.
4. Selecciona la rama **main** y haz clic en **"Run workflow"**.
5. Espera 1-2 minutos y revisa si se publicó en tu página de Facebook.

---

## ⏰ Horario de publicaciones

El workflow está configurado para ejecutarse 2 veces al día:

| Hora UTC | Hora aproximada México |
|----------|------------------------|
| 16:00 UTC | 10:00 a.m. |
| 00:00 UTC | 6:00 p.m. |

> Nota: México tiene cambio de horario, por lo que la hora exacta puede variar 1 hora dependiendo de la época del año.

---

## ⚠️ Importante: Renovar el token

El token de Facebook expira cada **60 días**. Cuando expire:

1. Genera uno nuevo en el [Graph API Explorer](https://developers.facebook.com/tools/explorer).
2. Ve a **Settings → Secrets and variables → Actions** en GitHub.
3. Edita el secreto `FACEBOOK_PAGE_ACCESS_TOKEN`.
4. Pega el nuevo token y guarda.

---

## 📊 ¿Qué hace el workflow?

Cada vez que se ejecuta:

1. Descarga tu código en un servidor de GitHub.
2. Instala Python y las librerías necesarias.
3. Lee el calendario de `content_calendar.json`.
4. Publica las publicaciones correspondientes al día.
5. Guarda las estadísticas de tu página.

---

## 🆘 Si algo falla

1. Ve a **"Actions"** en GitHub.
2. Haz clic en la ejecución que falló.
3. Revisa los logs para ver el error.
4. Los errores más comunes son:
   - Token expirado → renueva el secreto
   - Imagen no encontrada → verifica `content_calendar.json`
   - Permisos insuficientes → revisa los permisos de la app en Meta
