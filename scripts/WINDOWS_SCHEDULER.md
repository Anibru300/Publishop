# 🖥️ Automatizar con el Programador de Tareas de Windows

Esta guía explica cómo configurar tu computadora para que ejecute automáticamente las publicaciones de PUBLI SHOP LEÓN GTO **dos veces al día**.

> ⚠️ **Importante:** Tu computadora debe estar encendida a las horas programadas. Si la apagas, la tarea no se ejecutará.

---

## ✅ Paso 1: Encontrar la ruta de Python

1. Abre el **Símbolo del sistema** o **PowerShell**.
2. Escribe:
   ```bash
   where python
   ```
3. Copia la ruta que te aparece. Por ejemplo:
   ```
   C:\Users\Carlos\AppData\Local\Programs\Python\Python313\python.exe
   ```

---

## ✅ Paso 2: Crear la tarea para las publicaciones

1. Presiona la tecla **Windows** y busca **"Programador de tareas"**.
2. Abre el **Programador de tareas**.
3. En el menú de la derecha, haz clic en **"Crear tarea básica..."**.
4. Ponle nombre:
   ```
   PUBLI SHOP - Publicaciones Facebook
   ```
5. Haz clic en **"Siguiente"**.

### Disparador (cuándo se ejecuta)

1. Selecciona **"Diariamente"**.
2. Haz clic en **"Siguiente"**.
3. Pon la fecha de inicio: hoy.
4. Pon la hora: **10:00:00**.
5. Haz clic en **"Siguiente"**.

### Acción (qué va a hacer)

1. Selecciona **"Iniciar un programa"**.
2. Haz clic en **"Siguiente"**.
3. En **"Programa o script"**, pega la ruta de Python.
4. En **"Agregar argumentos"**, escribe:
   ```
   run_automation.py --posts
   ```
5. En **"Iniciar en"**, escribe la ruta de la carpeta scripts:
   ```
   C:\Users\Carlos\Desktop\Publishop\publishop\scripts
   ```
6. Haz clic en **"Siguiente"** y luego en **"Finalizar"**.

---

## ✅ Paso 3: Crear la segunda tarea (tarde)

Repite el **Paso 2**, pero ahora:
- Nombre: `PUBLI SHOP - Publicaciones Facebook Tarde`
- Hora: **18:00:00**
- Mismos argumentos y carpeta.

---

## ✅ Paso 4: Opcional - Extraer contenido una vez por semana

Para mantener actualizadas las fotos de tu página web, crea otra tarea:
- Nombre: `PUBLI SHOP - Extraer contenido`
- Frecuencia: **Semanal** (por ejemplo, domingos a las 9:00 p.m.)
- Argumentos:
  ```
  run_automation.py --extract
  ```
- Carpeta:
  ```
  C:\Users\Carlos\Desktop\Publishop\publishop\scripts
  ```

---

## ✅ Paso 5: Opcional - Guardar estadísticas diarias

- Nombre: `PUBLI SHOP - Estadísticas`
- Frecuencia: **Diaria** (por ejemplo, a las 11:59 p.m.)
- Argumentos:
  ```
  run_automation.py --insights
  ```

---

## 📋 Resumen de tareas recomendadas

| Tarea | Hora | Comando |
|-------|------|---------|
| Publicación mañana | 10:00 a.m. | `run_automation.py --posts` |
| Publicación tarde | 6:00 p.m. | `run_automation.py --posts` |
| Extraer contenido | Domingo 9:00 p.m. | `run_automation.py --extract` |
| Guardar estadísticas | 11:59 p.m. | `run_automation.py --insights` |

---

## 🔧 Si quieres probar primero

Antes de programar, prueba manualmente:

```bash
cd C:\Users\Carlos\Desktop\Publishop\publishop\scripts
python run_automation.py --dry-run
```

Si todo se ve bien, ejecuta sin `--dry-run`:

```bash
python run_automation.py --posts
```

---

## ⚠️ Notas importantes

- Mantén el archivo `.env` seguro. Nunca lo compartas.
- El token de Facebook expira cada 60 días. Debes renovarlo antes.
- Si cambias de computadora, debes reconfigurar las tareas.
