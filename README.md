# OCASA · Auditorías de Calidad

Web estática para subir archivos al flujo de auditoría y visualizar resultados en dashboard.

## Estructura

```
ocasa-auditoria/
├── index.html        ← página principal
├── css/
│   └── style.css     ← estilos
├── js/
│   ├── config.js     ← ⚙️ CONFIGURAR ANTES DE SUBIR
│   └── app.js        ← lógica de upload y dashboard
└── README.md
```

---

## ⚙️ Configuración (js/config.js)

Antes de subir a GitHub, editá `js/config.js` con tus datos reales:

### 1. URL del webhook de n8n

```js
N8N_WEBHOOK_URL: "https://TU-INSTANCIA-N8N/webhook/auditoria-ocasa",
```

En n8n:
- Agregá un nodo **Webhook** al inicio del flujo de WhatsApp
- Método: `POST`
- Copiá la URL de producción (no la de test)
- El nodo recibirá el archivo como `multipart/form-data`
- El campo del archivo se llama `file`, el nombre original en `filename`

### 2. ID del Google Sheet

```js
SHEET_ID: "TU_GOOGLE_SHEET_ID",
```

Para obtenerlo:
1. Abrí tu Google Sheet
2. La URL tiene este formato: `https://docs.google.com/spreadsheets/d/ESTE_ES_EL_ID/edit`
3. Copiá ese ID

Para publicarlo como CSV:
1. **Archivo → Compartir → Publicar en la web**
2. Seleccioná la hoja correcta
3. Formato: **Valores separados por comas (.csv)**
4. Hacé clic en **Publicar**

> ⚠️ El Sheet debe estar publicado para que la web pueda leerlo sin autenticación.

### 3. Columnas del Sheet (opcional)

Si los nombres de tus columnas en Sheets son distintos, actualizá el objeto `COLUMNAS` en `config.js`.
Los nombres deben coincidir exactamente con los headers de tu hoja.

---

## 🚀 Subir a GitHub Pages

1. Creá un repositorio en GitHub (puede ser privado o público)
2. Subí todos los archivos
3. Ir a **Settings → Pages**
4. Source: **Deploy from a branch → main → / (root)**
5. Guardá. En unos minutos tenés la URL: `https://TU-USUARIO.github.io/TU-REPO/`

---

## 🔄 Flujo completo

```
Usuario sube archivo en la web
  → POST al webhook de n8n (multipart/form-data)
  → n8n guarda el archivo en Google Drive
  → n8n dispara el flujo de auditoría
  → Gemini analiza el archivo
  → Resultado se escribe en Google Sheets
  → Dashboard lee el Sheet cada 60 segundos y se actualiza
```

---

## 📋 Columnas esperadas en Google Sheets

El dashboard lee estas columnas del Sheet (configurables en `config.js`):

| Campo en config   | Columna en Sheets              |
|-------------------|-------------------------------|
| AGENTE            | bloque_1.analista              |
| ID_CONV           | bloque_1.id_conversacion       |
| PERIODO           | bloque_1.periodo               |
| CANAL             | bloque_1.tipo_gestion          |
| NOTA_FINAL        | bloque_3.nota_final_porcentaje |
| ERROR_CRITICO     | bloque_3.error_critico         |
| NPS               | bloque_4.nps_probable          |
| PUNTO_FUERTE      | bloque_4.punto_fuerte          |
| PUNTO_MEJORA      | bloque_4.punto_mejora          |
| FECHA_PROCESO     | fecha_proceso                  |
| FILE_URI          | file_uri                       |

---

## ⚠️ CORS en n8n

Si el webhook de n8n rechaza requests desde el browser, agregá estos headers en el nodo Respond to Webhook de n8n:

```
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: POST, OPTIONS
Access-Control-Allow-Headers: Content-Type
```

---

## Próximos pasos sugeridos

- [ ] Configurar `js/config.js` con URL de n8n y Sheet ID
- [ ] Publicar el Google Sheet como CSV
- [ ] Probar el webhook de n8n con un archivo real
- [ ] Subir a GitHub Pages
- [ ] Validar que el dashboard lea datos correctamente
- [ ] Agregar generación de PDF por auditoría
