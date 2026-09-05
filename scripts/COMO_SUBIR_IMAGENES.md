# 📱 Cómo subir fotos NUEVAS para las publicaciones (desde tu celular)

Las publicaciones de Facebook ahora **no repiten imágenes**: el sistema usa
cada foto una vez y empieza de nuevo solo cuando se acaban. Cuando tengas
fotos nuevas de tus trabajos, súbelas aquí y se publicarán **primero**.

---

## Opción 1: Desde tu celular (cualquier momento) ⭐

1. Abre el navegador de tu celular (Chrome/Safari) y entra a:
   **github.com** e inicia sesión con tu cuenta.
2. Busca el repositorio: **anibru300/Publishop**
3. Navega a la carpeta: `assets` → `images` → `nuevas`
4. Toca el botón verde **Add file** → **Upload files**
5. Toca **choose your files** y selecciona las fotos de tu galería
   (puedes elegir varias a la vez).
6. Toca el botón verde **Commit changes**.

✅ ¡Listo! La siguiente publicación usará primero tus fotos nuevas.

### ¿Quieres que la foto vaya para un producto específico?

Antes de subir, toca **Create new file** y escribe la ruta con el nombre de
una subcarpeta, por ejemplo:

```
assets/images/nuevas/termos/mi-foto.jpg
```

GitHub crea la carpeta automáticamente. Categorías válidas: `termos`,
`tazas`, `plumas`, `dtf`, `vinil`, `mdf`, `general`.

---

## Opción 2: Desde tu computadora

1. Entra a **github.com/anibru300/Publishop**
2. Navega a `assets/images/nuevas`
3. **Add file** → **Upload files** → arrastra las fotos → **Commit changes**

---

## Opción 3: Pedirle ayuda a Kimi (en tu PC)

Deja las fotos nuevas en cualquier carpeta de tu escritorio y dile:
*"agrega estas fotos a las publicaciones"*. Yo las copio al proyecto
y las subo a GitHub por ti.

---

## Reglas importantes

- ✅ Formatos: JPG, PNG o WebP.
- ✅ Puedes subir varias fotos de una vez.
- ✅ Las fotos nuevas SIEMPRE se publican antes que las antiguas.
- ❌ No subas fotos de clientes sin su permiso.
- 🔄 Cuando se acaben las fotos nuevas, el sistema vuelve a rotar las
  existentes empezando por la que más tiempo tiene sin usarse.

## ¿Cuántas imágenes tengo disponibles?

Pregúntale a Kimi en tu PC: *"¿cuántas imágenes tengo sin usar?"* o ejecuta:

```bash
cd scripts
python image_rotator.py
```
