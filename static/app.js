const sampleSource = `INT[0,1](x^2 + sin(x)) dx`;

const sourceInput = document.querySelector("#sourceInput");
const analyzeBtn = document.querySelector("#analyzeBtn");
const exampleBtn = document.querySelector("#exampleBtn");
const clearBtn = document.querySelector("#clearBtn");
const tokensBody = document.querySelector("#tokensBody");
const tokenCount = document.querySelector("#tokenCount");
const errorCount = document.querySelector("#errorCount");
const errorsList = document.querySelector("#errorsList");
const astOutput = document.querySelector("#astOutput");
const intermediateOutput = document.querySelector("#intermediateOutput");
const resultStatus = document.querySelector("#resultStatus");

const phaseElements = {
  lexico: document.querySelector("[data-phase='lexico']"),
  sintactico: document.querySelector("[data-phase='sintactico']"),
  semantico: document.querySelector("[data-phase='semantico']"),
};

const phaseLabels = {
  lexico: document.querySelector("#lexStatus"),
  sintactico: document.querySelector("#syntaxStatus"),
  semantico: document.querySelector("#semanticStatus"),
};

analyzeBtn.addEventListener("click", analyze);
exampleBtn.addEventListener("click", () => {
  sourceInput.value = sampleSource;
  analyze();
});
clearBtn.addEventListener("click", () => {
  sourceInput.value = "";
  renderEmpty();
});

async function analyze() {
  setLoading();
  const response = await fetch("/api/analyze", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ source: sourceInput.value }),
  });
  const data = await response.json();
  renderResult(data);
}

function setLoading() {
  resultStatus.textContent = "Analizando...";
}

function renderResult(data) {
  renderPhases(data.phases);
  renderTokens(data.tokens);
  renderErrors(data.errors);

  astOutput.textContent = data.ast ? JSON.stringify(data.ast, null, 2) : "Sin AST generado.";
  intermediateOutput.textContent = buildIntermediateText(data);

  if (data.valid && data.evaluation) {
    resultStatus.textContent = data.evaluation.decimal;
  } else if (data.errors.length > 0) {
    resultStatus.textContent = "Revisar errores";
  } else {
    resultStatus.textContent = "Pendiente";
  }
}

function renderPhases(phases) {
  Object.entries(phases).forEach(([phase, info]) => {
    const card = phaseElements[phase];
    const label = phaseLabels[phase];
    card.classList.remove("ok", "error");
    if (info.status === "valido") {
      card.classList.add("ok");
      label.textContent = "Valido";
    } else if (info.status === "omitido") {
      label.textContent = "Omitido";
    } else {
      card.classList.add("error");
      label.textContent = `${info.count} error${info.count === 1 ? "" : "es"}`;
    }
  });
}

function renderTokens(tokens) {
  tokenCount.textContent = `${tokens.length} token${tokens.length === 1 ? "" : "s"}`;
  if (!tokens.length) {
    tokensBody.innerHTML = `<tr><td colspan="4" class="empty">No se reconocieron tokens.</td></tr>`;
    return;
  }
  tokensBody.innerHTML = tokens
    .map(
      (token) => `<tr>
        <td>${escapeHtml(token.type)}</td>
        <td>${escapeHtml(token.lexeme)}</td>
        <td>${token.line}</td>
        <td>${token.column}</td>
      </tr>`,
    )
    .join("");
}

function renderErrors(errors) {
  if (!errors.length) {
    errorCount.textContent = "Sin errores";
    errorsList.innerHTML = `<p class="empty">No se detectaron errores.</p>`;
    return;
  }
  errorCount.textContent = `${errors.length} error${errors.length === 1 ? "" : "es"}`;
  errorsList.innerHTML = errors
    .map((error) => {
      const location =
        error.line && error.column ? `Linea ${error.line}, columna ${error.column}` : "Sin ubicacion";
      return `<article class="error-item">
        <strong>${escapeHtml(error.phase)}</strong>
        <span>${escapeHtml(location)}: ${escapeHtml(error.message)}</span>
      </article>`;
    })
    .join("");
}

function buildIntermediateText(data) {
  const lines = [];
  if (data.normalized) {
    lines.push("Expresion normalizada:");
    lines.push(data.normalized);
    lines.push("");
  }
  if (data.intermediate) {
    lines.push("Codigo intermedio:");
    lines.push(JSON.stringify(data.intermediate, null, 2));
  }
  if (data.evaluation) {
    lines.push("");
    lines.push("Evaluacion:");
    lines.push(`${data.evaluation.summary}`);
    lines.push(`Metodo: ${data.evaluation.method}`);
    lines.push(`Subintervalos: ${data.evaluation.subintervals}`);
  }
  return lines.length ? lines.join("\n") : "Sin codigo intermedio.";
}

function renderEmpty() {
  Object.values(phaseElements).forEach((card) => card.classList.remove("ok", "error"));
  phaseLabels.lexico.textContent = "Sin ejecutar";
  phaseLabels.sintactico.textContent = "Sin ejecutar";
  phaseLabels.semantico.textContent = "Sin ejecutar";
  resultStatus.textContent = "Pendiente";
  tokenCount.textContent = "0 tokens";
  tokensBody.innerHTML = `<tr><td colspan="4" class="empty">Ejecuta el analisis para ver tokens.</td></tr>`;
  errorCount.textContent = "Sin errores";
  errorsList.innerHTML = `<p class="empty">No hay errores porque aun no se ejecuto el compilador.</p>`;
  astOutput.textContent = "Sin AST generado.";
  intermediateOutput.textContent = "Sin codigo intermedio.";
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
