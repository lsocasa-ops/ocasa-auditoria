const CONFIG = {
  // URL del webhook de n8n que recibe los archivos
  N8N_WEBHOOK_URL: "https://n8nappv2.ocasa.com:5688/webhook/8dd1f4e7-83f0-420f-a172-5a9b8899e835",

  // URL directa del Google Sheet publicado como CSV
  SHEET_CSV_URL: "https://docs.google.com/spreadsheets/d/e/2PACX-1vQe0eOwwwGNM8kDEKf3kjucDfY573r5ke_bTTJQtdnCq3Og8Yr5fQDXKb2rwGAlbbWHbJQMz4EPYiXJ/pub?gid=1235035978&single=true&output=csv",

  // Columnas esperadas en el Google Sheet (en orden)
  COLUMNAS: {
    AGENTE:        "bloque_1.analista",
    ID_CONV:       "bloque_1.id_conversacion",
    PERIODO:       "bloque_1.periodo",
    CANAL:         "bloque_1.tipo_gestion",
    NOTA_FINAL:    "bloque_3.nota_final_porcentaje",
    ERROR_CRITICO: "bloque_3.error_critico",
    NPS:           "bloque_4.nps_probable",
    PUNTO_FUERTE:  "bloque_4.punto_fuerte",
    PUNTO_MEJORA:  "bloque_4.punto_mejora",
    FECHA_PROCESO: "fecha_proceso",
    FILE_URI:      "file_uri",
  }
};
