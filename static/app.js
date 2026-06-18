const sampleSource = `INT[0,1](x^2 + sin(x)) dx`;

const sourceInput = document.querySelector("#sourceInput");
const analyzeBtn = document.querySelector("#analyzeBtn");
const exampleBtn = document.querySelector("#exampleBtn");
const clearBtn = document.querySelector("#clearBtn");
const tokensBody = document.querySelector("#tokensBody");
const tokenCount = document.querySelector("#tokenCount");
const errorCount = document.querySelector("#errorCount");
const errorBadge = document.querySelector("#errorBadge");
const errorsList = document.querySelector("#errorsList");
const astOutput = document.querySelector("#astOutput");
const astTree = document.querySelector("#astTree");
const treeTab = document.querySelector("#treeTab");
const jsonTab = document.querySelector("#jsonTab");
const intermediateOutput = document.querySelector("#intermediateOutput");
const codeLines = document.querySelector("#codeLines");
const resultStatus = document.querySelector("#resultStatus");
const resultDetail = document.querySelector("#resultDetail");
const resultFormula = document.querySelector("#resultFormula");
const resultExact = document.querySelector("#resultExact");
const cursorInfo = document.querySelector("#cursorInfo");
const copyAstBtn = document.querySelector("#copyAstBtn");
const copyIntermediateBtn = document.querySelector("#copyIntermediateBtn");
const helpBtn = document.querySelector("#helpBtn");
const themeToggle = document.querySelector("#themeToggle");
const examplesDialog = document.querySelector("#examplesDialog");
const helpDialog = document.querySelector("#helpDialog");
const examplesBody = document.querySelector("#examplesBody");

const examples = [
  {
    level: "Basico",
    source: "INT[0,1](x) dx",
    purpose: "Variable simple y limites positivos",
  },
  {
    level: "Basico",
    source: "INT[0,1](x^2) dx",
    purpose: "Potencia de x",
  },
  {
    level: "Basico",
    source: "INT[0,pi](sin(x)) dx",
    purpose: "Funcion trigonometrica y constante pi",
  },
  {
    level: "Basico",
    source: "INT[0,2](3) dx",
    purpose: "Integral de una constante",
  },
  {
    level: "Basico",
    source: "INT[0,1](x + 1) dx",
    purpose: "Suma simple",
  },
  {
    level: "Intermedio",
    source: "INT[0,2](2x + 3(x+1)) dx",
    purpose: "Multiplicacion implicita y parentesis",
  },
  {
    level: "Intermedio",
    source: "INT[-1,1](x^3 + x^2) dx",
    purpose: "Limite negativo y potencias",
  },
  {
    level: "Intermedio",
    source: "INT[1,e](ln(x)) dx",
    purpose: "Funcion logaritmica en dominio valido",
  },
  {
    level: "Intermedio",
    source: "INT[0,1](exp(x) - x) dx",
    purpose: "Funcion exponencial y resta",
  },
  {
    level: "Intermedio",
    source: "INT[0,4](sqrt(x) + x/2) dx",
    purpose: "Raiz cuadrada y division",
  },
  {
    level: "Avanzado",
    source: "INT[0,pi](sin(x)^2 + cos(x)^2) dx",
    purpose: "Potencias sobre funciones",
  },
  {
    level: "Avanzado",
    source: "INT[1,3]((x^2 + 2x + 1)/(x+1)) dx",
    purpose: "Division de expresiones",
  },
  {
    level: "Avanzado",
    source: "INT[0,1](exp(x^2) + sin(x)) dx",
    purpose: "Funcion compuesta y evaluacion numerica",
  },
  {
    level: "Avanzado",
    source: "INT[0,0.785398](tan(x) + x^3) dx",
    purpose: "Tangente y limite decimal",
  },
  {
    level: "Avanzado",
    source: "INT[0,2](sqrt(x+1) * exp(x/2)) dx",
    purpose: "Composicion con producto",
  },
];

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

const phaseDetails = {
  lexico: document.querySelector("#lexDetail"),
  sintactico: document.querySelector("#syntaxDetail"),
  semantico: document.querySelector("#semanticDetail"),
};

analyzeBtn.addEventListener("click", analyze);
exampleBtn.addEventListener("click", () => showDialog(examplesDialog));
clearBtn.addEventListener("click", () => {
  sourceInput.value = "";
  updateCursorInfo();
  renderEmpty();
});
sourceInput.addEventListener("keyup", updateCursorInfo);
sourceInput.addEventListener("click", updateCursorInfo);
treeTab.addEventListener("click", () => setAstMode("tree"));
jsonTab.addEventListener("click", () => setAstMode("json"));
copyAstBtn.addEventListener("click", () => copyToClipboard(astOutput.textContent, copyAstBtn, "Copiado"));
copyIntermediateBtn.addEventListener("click", () =>
  copyToClipboard(intermediateOutput.textContent, copyIntermediateBtn, "Copiado"),
);
helpBtn.addEventListener("click", () => showDialog(helpDialog));
themeToggle.addEventListener("click", toggleTheme);
document.querySelectorAll("[data-close-dialog]").forEach((button) => {
  button.addEventListener("click", () => document.querySelector(`#${button.dataset.closeDialog}`)?.close());
});
examplesBody.addEventListener("click", (event) => {
  const button = event.target.closest("[data-example-index]");
  if (!button) return;
  const example = examples[Number(button.dataset.exampleIndex)];
  sourceInput.value = example.source;
  examplesDialog.close();
  updateCursorInfo();
  analyze();
});

renderExamples();
initTheme();
updateCursorInfo();

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
  resultExact.textContent = "Calculando...";
  resultDetail.textContent = "Procesando fases";
}

function renderResult(data) {
  renderPhases(data.phases, data.tokens.length);
  renderTokens(data.tokens);
  renderErrors(data);
  renderAst(data.ast);

  const intermediateText = buildIntermediateText(data);
  intermediateOutput.textContent = intermediateText;
  renderCodeLines(intermediateText);

  if (data.valid && data.evaluation) {
    resultFormula.innerHTML = renderIntegralMath(data.ast);
    resultExact.innerHTML = formatMathText(data.exact?.expression || "No disponible");
    resultStatus.textContent = data.evaluation.decimal;
    resultDetail.textContent = data.exact?.supported
      ? `${data.evaluation.method} usada para verificacion numerica`
      : data.evaluation.method;
  } else if (data.errors.length > 0) {
    resultFormula.innerHTML = emptyIntegralMath();
    resultExact.textContent = "No disponible";
    resultStatus.textContent = "Revisar errores";
    resultDetail.textContent = "El analisis no finalizo";
  } else {
    resultFormula.innerHTML = emptyIntegralMath();
    resultExact.textContent = "Pendiente";
    resultStatus.textContent = "Pendiente";
    resultDetail.textContent = "Resultado decimal";
  }
}

function renderPhases(phases, tokensLength) {
  Object.entries(phases).forEach(([phase, info]) => {
    const card = phaseElements[phase];
    const label = phaseLabels[phase];
    const detail = phaseDetails[phase];
    card.classList.remove("ok", "error");

    if (info.status === "valido") {
      card.classList.add("ok");
      label.textContent = "Valido";
      if (phase === "lexico") detail.textContent = `${tokensLength} tokens reconocidos`;
      if (phase === "sintactico") detail.textContent = "Estructura correcta";
      if (phase === "semantico") detail.textContent = "Integrando respecto a x";
    } else if (info.status === "omitido") {
      label.textContent = "Omitido";
      detail.textContent = info.reason || "Fase omitida";
    } else {
      card.classList.add("error");
      label.textContent = `${info.count} error${info.count === 1 ? "" : "es"}`;
      detail.textContent = "Revisar detalle";
    }
  });
}

function renderTokens(tokens) {
  tokenCount.textContent = `${tokens.length} token${tokens.length === 1 ? "" : "s"}`;
  if (!tokens.length) {
    tokensBody.innerHTML = `<tr><td colspan="5" class="empty">No se reconocieron tokens.</td></tr>`;
    return;
  }
  tokensBody.innerHTML = tokens
    .map(
      (token, index) => `<tr>
        <td>${index + 1}</td>
        <td>${escapeHtml(token.type)}</td>
        <td>${escapeHtml(token.lexeme)}</td>
        <td>${token.line}</td>
        <td>${token.column}</td>
      </tr>`,
    )
    .join("");
}

function renderErrors(data) {
  const errors = data.errors || [];
  errorBadge.textContent = errors.length;
  if (!errors.length) {
    errorCount.textContent = "Sin errores";
  } else {
    errorCount.textContent = `${errors.length} error${errors.length === 1 ? "" : "es"}`;
  }

  const groups = ["lexico", "sintactico", "semantico"];
  const labels = {
    lexico: "Lexicos",
    sintactico: "Sintacticos",
    semantico: "Semanticos",
  };

  errorsList.innerHTML = groups
    .map((phase) => {
      const phaseErrors = errors.filter((error) => error.phase === phase);
      const stateClass = phaseErrors.length ? "error" : "pending";
      const content = phaseErrors.length
        ? phaseErrors
            .map((error) => {
              const location =
                error.line && error.column ? `Linea ${error.line}, columna ${error.column}` : "Sin ubicacion";
              return `<p>${escapeHtml(location)}: ${escapeHtml(error.message)}</p>`;
            })
            .join("")
        : `<p>No hay errores ${labels[phase].toLowerCase()}.</p>`;

      return `<article class="phase-error-card ${stateClass}">
        <div><strong>${labels[phase]} (${phaseErrors.length})</strong><span>⌄</span></div>
        ${content}
      </article>`;
    })
    .join("");
}

function renderAst(ast) {
  astOutput.textContent = ast ? JSON.stringify(ast, null, 2) : "Sin AST generado.";
  astTree.textContent = ast ? buildAstTree(ast) : "Sin arbol generado.";
  astTree.classList.toggle("empty", !ast);
}

function buildAstTree(ast) {
  const lines = ["Integral"];
  lines.push(`├── limite_inferior: ${ast.lower_limit}`);
  lines.push(`├── limite_superior: ${ast.upper_limit}`);
  lines.push(`├── variable: ${ast.variable}`);
  lines.push("└── expresion:");
  lines.push(...nodeTree(ast.expression, "    "));
  return lines.join("\n");
}

function nodeTree(node, prefix) {
  if (!node) return [`${prefix}└── <vacio>`];
  if (node.type === "BinaryExpression") {
    return [
      `${prefix}└── (${node.operator})`,
      ...nodeTree(node.left, `${prefix}    ├── `),
      ...nodeTree(node.right, `${prefix}    └── `),
    ];
  }
  if (node.type === "UnaryExpression") {
    return [`${prefix}└── (${node.operator})`, ...nodeTree(node.operand, `${prefix}    └── `)];
  }
  if (node.type === "FunctionCall") {
    return [`${prefix}└── ${node.name}`, ...nodeTree(node.argument, `${prefix}    └── `)];
  }
  if (node.type === "Variable") return [`${prefix}└── variable: ${node.name}`];
  if (node.type === "Number") return [`${prefix}└── numero: ${node.value}`];
  if (node.type === "Constant") return [`${prefix}└── constante: ${node.name}`];
  return [`${prefix}└── ${node.type}`];
}

function buildIntermediateText(data) {
  const lines = [];
  if (data.intermediate) {
    lines.push("# Representacion en Notacion Polaca Inversa (RPN)");
    lines.push(toRpn(data.ast.expression).join(" "));
    lines.push("");
    lines.push("# Representacion en 3D (Triple Direccion)");
    lines.push("# (op, arg1, arg2)");
    lines.push(...toTriples(data.ast.expression).lines);
    lines.push("");
    lines.push("# Integral definida");
    lines.push(`INTEGRAL ${data.ast.lower_limit} ${data.ast.upper_limit} ${data.intermediate.expression} dx`);
  } else {
    lines.push("Sin codigo intermedio.");
  }
  if (data.evaluation) {
    lines.push("");
    lines.push("# Evaluacion");
    lines.push(`Resultado aproximado: ${data.evaluation.decimal}`);
    lines.push(`Metodo: ${data.evaluation.method}`);
    lines.push(`Subintervalos: ${data.evaluation.subintervals}`);
  }
  return lines.join("\n");
}

function toRpn(node) {
  if (!node) return [];
  if (node.type === "Number") return [node.value];
  if (node.type === "Variable") return [node.name];
  if (node.type === "Constant") return [node.name];
  if (node.type === "FunctionCall") return [...toRpn(node.argument), node.name];
  if (node.type === "UnaryExpression") return [...toRpn(node.operand), `u${node.operator}`];
  if (node.type === "BinaryExpression") return [...toRpn(node.left), ...toRpn(node.right), node.operator];
  return [node.type];
}

function toTriples(node, state = { counter: 1, lines: [] }) {
  function visit(current) {
    if (current.type === "Number") return current.value;
    if (current.type === "Variable") return current.name;
    if (current.type === "Constant") return current.name;
    if (current.type === "FunctionCall") {
      const arg = visit(current.argument);
      const temp = `t${state.counter++}`;
      state.lines.push(`${temp} = (${current.name}, ${arg}, -)`);
      return temp;
    }
    if (current.type === "UnaryExpression") {
      const arg = visit(current.operand);
      const temp = `t${state.counter++}`;
      state.lines.push(`${temp} = (${current.operator}u, ${arg}, -)`);
      return temp;
    }
    if (current.type === "BinaryExpression") {
      const left = visit(current.left);
      const right = visit(current.right);
      const temp = `t${state.counter++}`;
      state.lines.push(`${temp} = (${current.operator}, ${left}, ${right})`);
      return temp;
    }
    return "?";
  }
  visit(node);
  return state;
}

function renderCodeLines(text) {
  const lineCount = Math.max(1, text.split("\n").length);
  codeLines.textContent = Array.from({ length: lineCount }, (_, index) => index + 1).join("\n");
}

function setAstMode(mode) {
  const showTree = mode === "tree";
  astTree.classList.toggle("hidden", !showTree);
  astOutput.classList.toggle("hidden", showTree);
  treeTab.classList.toggle("active", showTree);
  jsonTab.classList.toggle("active", !showTree);
}

function renderExamples() {
  examplesBody.innerHTML = examples
    .map(
      (example, index) => `<tr>
        <td><span class="level-badge ${example.level.toLowerCase()}">${escapeHtml(example.level)}</span></td>
        <td><code>${escapeHtml(example.source)}</code></td>
        <td>${escapeHtml(example.purpose)}</td>
        <td><button class="table-action" type="button" data-example-index="${index}">Usar</button></td>
      </tr>`,
    )
    .join("");
}

function showDialog(dialog) {
  if (typeof dialog.showModal === "function") {
    dialog.showModal();
  } else {
    dialog.setAttribute("open", "open");
  }
}

async function copyToClipboard(text, button, message) {
  await navigator.clipboard?.writeText(text);
  const original = button.textContent;
  button.textContent = message;
  window.setTimeout(() => {
    button.textContent = original;
  }, 1200);
}

function initTheme() {
  const savedTheme = localStorage.getItem("integralCompilerTheme") || "light";
  document.body.classList.toggle("dark-theme", savedTheme === "dark");
  updateThemeButton();
}

function toggleTheme() {
  document.body.classList.toggle("dark-theme");
  localStorage.setItem("integralCompilerTheme", document.body.classList.contains("dark-theme") ? "dark" : "light");
  updateThemeButton();
}

function updateThemeButton() {
  themeToggle.textContent = document.body.classList.contains("dark-theme") ? "Tema claro" : "Tema oscuro";
}

function renderEmpty() {
  Object.values(phaseElements).forEach((card) => card.classList.remove("ok", "error"));
  phaseLabels.lexico.textContent = "Sin ejecutar";
  phaseLabels.sintactico.textContent = "Sin ejecutar";
  phaseLabels.semantico.textContent = "Sin ejecutar";
  phaseDetails.lexico.textContent = "Esperando tokens";
  phaseDetails.sintactico.textContent = "Estructura pendiente";
  phaseDetails.semantico.textContent = "Dominio pendiente";
  resultFormula.innerHTML = emptyIntegralMath();
  resultExact.textContent = "Pendiente";
  resultStatus.textContent = "Pendiente";
  resultDetail.textContent = "Resultado decimal";
  tokenCount.textContent = "0 tokens";
  tokensBody.innerHTML = `<tr><td colspan="5" class="empty">Ejecuta el analisis para ver tokens.</td></tr>`;
  errorBadge.textContent = "0";
  errorCount.textContent = "Sin errores";
  errorsList.innerHTML = ["Lexicos", "Sintacticos", "Semanticos"]
    .map(
      (label) => `<article class="phase-error-card pending">
        <div><strong>${label} (0)</strong><span>⌄</span></div>
        <p>No hay errores ${label.toLowerCase()}.</p>
      </article>`,
    )
    .join("");
  astOutput.textContent = "Sin AST generado.";
  astTree.textContent = "Sin arbol generado.";
  intermediateOutput.textContent = "Sin codigo intermedio.";
  renderCodeLines("Sin codigo intermedio.");
}

function updateCursorInfo() {
  const cursor = sourceInput.selectionStart || 0;
  const before = sourceInput.value.slice(0, cursor);
  const lines = before.split("\n");
  const line = lines.length;
  const col = lines[lines.length - 1].length + 1;
  cursorInfo.textContent = `Ln ${line}, Col ${col}`;
}

function compactExpression(expression) {
  return expression.replaceAll("*", "·").replace(/\s+/g, " ");
}

function emptyIntegralMath() {
  return `<span class="integral-symbol">∫</span><span class="integrand">f(x)</span><span>dx</span>`;
}

function renderIntegralMath(ast) {
  return `<span class="integral-block">
    <span class="integral-symbol">∫</span>
    <span class="limits"><sup>${escapeHtml(ast.upper_limit)}</sup><sub>${escapeHtml(ast.lower_limit)}</sub></span>
  </span>
  <span class="integrand">${mathFromAst(ast.expression)}</span>
  <span class="dx">dx</span>`;
}

function mathFromAst(node) {
  if (!node) return "";
  if (node.type === "Number") return escapeHtml(node.value);
  if (node.type === "Variable") return "x";
  if (node.type === "Constant") return escapeHtml(node.name).replaceAll("pi", "π");
  if (node.type === "FunctionCall") return `${escapeHtml(node.name)}(${mathFromAst(node.argument)})`;
  if (node.type === "UnaryExpression") return `${escapeHtml(node.operator)}${mathFromAst(node.operand)}`;
  if (node.type === "BinaryExpression") {
    const left = mathFromAst(node.left);
    const right = mathFromAst(node.right);
    if (node.operator === "^") return `${wrapMath(node.left, left)}<sup>${right}</sup>`;
    if (node.operator === "*") return `${wrapMath(node.left, left)} · ${wrapMath(node.right, right)}`;
    if (node.operator === "/") return `<span class="fraction"><span>${left}</span><span>${right}</span></span>`;
    return `${left} ${escapeHtml(node.operator)} ${right}`;
  }
  return escapeHtml(node.type);
}

function wrapMath(node, html) {
  if (node?.type === "BinaryExpression" && ["+", "-"].includes(node.operator)) {
    return `(${html})`;
  }
  return html;
}

function formatMathText(value) {
  return escapeHtml(value)
    .replaceAll("pi", "π")
    .replace(/([A-Za-zπ0-9)]+)\^([0-9]+)/g, "$1<sup>$2</sup>")
    .replace(/\*/g, " · ");
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
