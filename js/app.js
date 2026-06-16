// ─── Estado global ────────────────────────────────────────────
const state = {
  auditorias: [],
  filtroAgente: "todos",
  filtroPeriodo: "todos",
};

// ─── Upload ───────────────────────────────────────────────────
const dropZone   = document.getElementById("dropZone");
const fileInput  = document.getElementById("fileInput");
const fileQueue  = document.getElementById("fileQueue");

dropZone.addEventListener("click", () => fileInput.click());
dropZone.addEventListener("dragover", e => { e.preventDefault(); dropZone.classList.add("drag-over"); });
dropZone.addEventListener("dragleave", () => dropZone.classList.remove("drag-over"));
dropZone.addEventListener("drop", e => {
  e.preventDefault();
  dropZone.classList.remove("drag-over");
  handleFiles(e.dataTransfer.files);
});
fileInput.addEventListener("change", e => handleFiles(e.target.files));

function handleFiles(files) {
  Array.from(files).forEach(file => uploadFile(file));
}

function uploadFile(file) {
  const id = "file-" + Date.now() + Math.random().toString(36).slice(2);
  addFileToQueue(id, file.name, "enviando");

  const form = new FormData();
  form.append("file", file);
  form.append("filename", file.name);

  fetch(CONFIG.N8N_WEBHOOK_URL, { method: "POST", body: form })
    .then(r => {
      if (!r.ok) throw new Error("Error HTTP " + r.status);
      updateFileStatus(id, "enviado");
    })
    .catch(() => updateFileStatus(id, "error"));
}

function addFileToQueue(id, name, status) {
  const ext = name.split(".").pop().toUpperCase();
  const icon = ["MP3","WAV","OGG"].includes(ext) ? "ti-microphone" : "ti-file-text";
  const shortName = name.length > 35 ? name.slice(0, 33) + "…" : name;

  const el = document.createElement("div");
  el.className = "file-item";
  el.id = id;
  el.innerHTML = `
    <i class="ti ${icon}" aria-hidden="true"></i>
    <div class="file-meta">
      <p title="${name}">${shortName}</p>
      <span>${ext}</span>
    </div>
    <span class="badge badge-sending" id="badge-${id}">enviando…</span>
  `;
  fileQueue.prepend(el);
}

function updateFileStatus(id, status) {
  const badge = document.getElementById("badge-" + id);
  if (!badge) return;
  if (status === "enviado") {
    badge.className = "badge badge-ok";
    badge.textContent = "enviado";
  } else if (status === "error") {
    badge.className = "badge badge-error";
    badge.textContent = "error";
  }
}

// ─── Dashboard ────────────────────────────────────────────────
let charts = {};

async function cargarDatos() {
  document.getElementById("dashStatus").textContent = "Actualizando…";
  try {
    const r = await fetch(CONFIG.SHEET_CSV_URL);
    const text = await r.text();
    state.auditorias = parseCSV(text);
    renderDashboard();
    document.getElementById("dashStatus").textContent =
      "Actualizado " + new Date().toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" });
  } catch (e) {
    document.getElementById("dashStatus").textContent = "Error al cargar datos";
    console.error(e);
  }
}

function parseCSV(text) {
  const lines = text.trim().split("\n");
  if (lines.length < 2) return [];
  const headers = lines[0].split(",").map(h => h.trim().replace(/^"|"$/g, ""));
  return lines.slice(1).map(line => {
    const values = line.match(/(".*?"|[^,]+|(?<=,)(?=,)|^(?=,))/g) || [];
    const obj = {};
    headers.forEach((h, i) => {
      obj[h] = (values[i] || "").replace(/^"|"$/g, "").trim();
    });
    return obj;
  });
}

function col(row, key) {
  return row[CONFIG.COLUMNAS[key]] || "";
}

function renderDashboard() {
  const data = filtrarDatos();

  // Poblar filtros
  poblarFiltros();

  // Métricas
  const notas = data
    .map(r => parseFloat(col(r, "NOTA_FINAL")))
    .filter(n => !isNaN(n));
  const total = data.length;
  const promedio = notas.length ? (notas.reduce((a, b) => a + b, 0) / notas.length) : 0;
  const errores = data.filter(r => col(r, "ERROR_CRITICO") === "true").length;
  const agentes = [...new Set(data.map(r => col(r, "AGENTE")).filter(Boolean))].length;

  document.getElementById("mTotal").textContent = total;
  document.getElementById("mPromedio").textContent = promedio.toFixed(1) + "%";
  document.getElementById("mErrores").textContent = errores;
  document.getElementById("mAgentes").textContent = agentes;

  // Gráfico: nota por agente
  const porAgente = {};
  data.forEach(r => {
    const ag = col(r, "AGENTE"); if (!ag) return;
    const n = parseFloat(col(r, "NOTA_FINAL")); if (isNaN(n)) return;
    if (!porAgente[ag]) porAgente[ag] = [];
    porAgente[ag].push(n);
  });
  const agLabels = Object.keys(porAgente);
  const agData   = agLabels.map(a => +(porAgente[a].reduce((x,y)=>x+y,0)/porAgente[a].length).toFixed(1));

  renderChart("chartAgentes", {
    type: "bar",
    data: {
      labels: agLabels,
      datasets: [{ label: "Nota %", data: agData,
        backgroundColor: agData.map(v => v === 0 ? "#E24B4A" : v >= 80 ? "#639922" : v >= 65 ? "#EF9F27" : "#5DCAA5"),
        borderRadius: 4 }]
    },
    options: barOptions("y", "%", 0, 100)
  });

  // Gráfico: evolución mensual
  const porPeriodo = {};
  data.forEach(r => {
    const p = col(r, "PERIODO"); if (!p) return;
    const n = parseFloat(col(r, "NOTA_FINAL")); if (isNaN(n)) return;
    if (!porPeriodo[p]) porPeriodo[p] = [];
    porPeriodo[p].push(n);
  });
  const perLabels = Object.keys(porPeriodo).sort();
  const perData   = perLabels.map(p => +(porPeriodo[p].reduce((x,y)=>x+y,0)/porPeriodo[p].length).toFixed(1));

  renderChart("chartEvol", {
    type: "line",
    data: {
      labels: perLabels,
      datasets: [{ label: "Nota promedio", data: perData,
        borderColor: "#7F77DD", backgroundColor: "rgba(127,119,221,0.08)",
        tension: 0.35, fill: true, pointRadius: 4, pointBackgroundColor: "#7F77DD" }]
    },
    options: lineOptions()
  });

  // Tabla
  renderTabla(data.slice(-20).reverse());
}

function filtrarDatos() {
  return state.auditorias.filter(r => {
    const ag = col(r, "AGENTE");
    const pe = col(r, "PERIODO");
    if (state.filtroAgente !== "todos" && ag !== state.filtroAgente) return false;
    if (state.filtroPeriodo !== "todos" && pe !== state.filtroPeriodo) return false;
    return true;
  });
}

function poblarFiltros() {
  const agentes  = [...new Set(state.auditorias.map(r => col(r, "AGENTE")).filter(Boolean))];
  const periodos = [...new Set(state.auditorias.map(r => col(r, "PERIODO")).filter(Boolean))];
  llenarSelect("filtroAgente",  agentes,  state.filtroAgente);
  llenarSelect("filtroPeriodo", periodos, state.filtroPeriodo);
}

function llenarSelect(id, opciones, actual) {
  const sel = document.getElementById(id);
  const prev = sel.value;
  sel.innerHTML = `<option value="todos">Todos</option>` +
    opciones.map(o => `<option value="${o}" ${o===actual?"selected":""}>${o}</option>`).join("");
  sel.value = prev || actual;
}

function renderTabla(data) {
  const tbody = document.getElementById("tablaBody");
  tbody.innerHTML = data.map(r => {
    const nota = parseFloat(col(r, "NOTA_FINAL"));
    const ec   = col(r, "ERROR_CRITICO") === "true";
    const color = ec ? "#E24B4A" : nota >= 80 ? "#639922" : nota >= 65 ? "#EF9F27" : "#5DCAA5";
    const fileUri = col(r, "FILE_URI");
    return `<tr>
      <td>${col(r,"AGENTE")}</td>
      <td>${col(r,"PERIODO")}</td>
      <td>${col(r,"CANAL")}</td>
      <td>
        <div class="score-bar-wrap">
          <span style="min-width:36px;font-weight:500;color:${color}">${isNaN(nota)?"—":nota+"%"}</span>
          <div class="score-bar"><div class="score-bar-fill" style="width:${isNaN(nota)?0:nota}%;background:${color}"></div></div>
        </div>
      </td>
      <td><span style="color:${ec?"#A32D2D":"var(--color-text-tertiary)"};font-weight:${ec?"500":"400"}">${ec?"Sí":"No"}</span></td>
      <td>${fileUri ? `<a class="dl-btn" href="${fileUri}" target="_blank"><i class="ti ti-download"></i> PDF</a>` : "—"}</td>
    </tr>`;
  }).join("");
}

function renderChart(id, config) {
  const canvas = document.getElementById(id);
  if (charts[id]) { charts[id].destroy(); }
  charts[id] = new Chart(canvas, config);
}

const isDark = matchMedia("(prefers-color-scheme: dark)").matches;
const gridColor = isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.06)";
const labelColor = "#888";

function barOptions(axis, suffix, min, max) {
  return {
    indexAxis: axis,
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      x: { min, max, grid: { color: axis==="y"?gridColor:"transparent" },
           ticks: { color: labelColor, font: { size: 11 }, callback: v => v+suffix } },
      y: { grid: { display: axis!=="y" },
           ticks: { color: labelColor, font: { size: 11 },
                    callback: axis==="y" ? v => v+suffix : undefined } }
    }
  };
}

function lineOptions() {
  return {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      x: { grid: { display: false }, ticks: { color: labelColor, font: { size: 11 } } },
      y: { min: 0, max: 100, grid: { color: gridColor },
           ticks: { color: labelColor, font: { size: 11 }, callback: v => v+"%" } }
    }
  };
}

// ─── Filtros ──────────────────────────────────────────────────
document.getElementById("filtroAgente").addEventListener("change", e => {
  state.filtroAgente = e.target.value;
  renderDashboard();
});
document.getElementById("filtroPeriodo").addEventListener("change", e => {
  state.filtroPeriodo = e.target.value;
  renderDashboard();
});

// ─── Init ─────────────────────────────────────────────────────
cargarDatos();
setInterval(cargarDatos, 60000); // refresca cada 60s
