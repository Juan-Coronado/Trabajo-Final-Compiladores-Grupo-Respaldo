const sampleSource = `INT[0,1](x^2 + sin(x)) dx`;

const sourceInput = document.querySelector("#sourceInput");
const analyzeBtn = document.querySelector("#analyzeBtn");
const exampleBtn = document.querySelector("#exampleBtn");
const clearBtn = document.querySelector("#clearBtn");
const lexemesBody = document.querySelector("#lexemesBody");
const lexemeCount = document.querySelector("#lexemeCount");
const tokensBody = document.querySelector("#tokensBody");
const tokenCount = document.querySelector("#tokenCount");
const regexBody = document.querySelector("#regexBody");
const regexCount = document.querySelector("#regexCount");
const errorCount = document.querySelector("#errorCount");
const errorBadge = document.querySelector("#errorBadge");
const errorsList = document.querySelector("#errorsList");
const astOutput = document.querySelector("#astOutput");
const astTree = document.querySelector("#astTree");
const treeTab = document.querySelector("#treeTab");
const jsonTab = document.querySelector("#jsonTab");
const resultStatus = document.querySelector("#resultStatus");
const resultDetail = document.querySelector("#resultDetail");
const resultFormula = document.querySelector("#resultFormula");
const resultExactLabel = document.querySelector("#resultExactLabel");
const resultExact = document.querySelector("#resultExact");
const cursorInfo = document.querySelector("#cursorInfo");
const copyAstBtn = document.querySelector("#copyAstBtn");
const downloadTreeBtn = document.querySelector("#downloadTreeBtn");
const treeZoomOutBtn = document.querySelector("#treeZoomOutBtn");
const treeZoomResetBtn = document.querySelector("#treeZoomResetBtn");
const treeZoomInBtn = document.querySelector("#treeZoomInBtn");
const helpBtn = document.querySelector("#helpBtn");
const themeToggle = document.querySelector("#themeToggle");
const downloadPdfBtn = document.querySelector("#downloadPdfBtn");
const examplesDialog = document.querySelector("#examplesDialog");
const helpDialog = document.querySelector("#helpDialog");
const examplesBody = document.querySelector("#examplesBody");
const automataGraph = document.querySelector("#automataGraph");
const automataTitle = document.querySelector("#automataTitle");
const automataSummary = document.querySelector("#automataSummary");
const automataHint = document.querySelector("#automataHint");
const nfaToggle = document.querySelector("#nfaToggle");
const dfaToggle = document.querySelector("#dfaToggle");
const downloadAutomataBtn = document.querySelector("#downloadAutomataBtn");
const automataZoomOutBtn = document.querySelector("#automataZoomOutBtn");
const automataZoomResetBtn = document.querySelector("#automataZoomResetBtn");
const automataZoomInBtn = document.querySelector("#automataZoomInBtn");
const transitionBody = document.querySelector("#transitionBody");
const transitionCount = document.querySelector("#transitionCount");
const grammarDefinition = document.querySelector("#grammarDefinition");
const grammarVariables = document.querySelector("#grammarVariables");
const grammarTerminals = document.querySelector("#grammarTerminals");
const grammarStart = document.querySelector("#grammarStart");
const grammarApplies = document.querySelector("#grammarApplies");
const grammarNotApplies = document.querySelector("#grammarNotApplies");
const grammarProductions = document.querySelector("#grammarProductions");
let currentAutomata = null;
let activeAutomataKind = "nfa";
let currentSyntaxTree = null;
let latestAnalysis = null;
let vizInstance = null;
let treeZoom = 1;
let automataZoom = 1;

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
jsonTab.addEventListener("click", () => setAstMode("python"));
copyAstBtn.addEventListener("click", () => copyToClipboard(astOutput.textContent, copyAstBtn, "Copiado"));
downloadTreeBtn.addEventListener("click", () => downloadDiagram(astTree, "arbol-sintactico.svg", downloadTreeBtn));
treeZoomOutBtn.addEventListener("click", () => setDiagramZoom("tree", -0.15));
treeZoomResetBtn.addEventListener("click", () => resetDiagramZoom("tree"));
treeZoomInBtn.addEventListener("click", () => setDiagramZoom("tree", 0.15));
helpBtn.addEventListener("click", () => showDialog(helpDialog));
themeToggle.addEventListener("click", toggleTheme);
downloadPdfBtn.addEventListener("click", exportPdfReport);
nfaToggle.addEventListener("click", () => setAutomataKind("nfa"));
dfaToggle.addEventListener("click", () => setAutomataKind("dfa"));
downloadAutomataBtn.addEventListener("click", () =>
  downloadDiagram(automataGraph, `${activeAutomataKind}-integral.svg`, downloadAutomataBtn),
);
automataZoomOutBtn.addEventListener("click", () => setDiagramZoom("automata", -0.15));
automataZoomResetBtn.addEventListener("click", () => resetDiagramZoom("automata"));
automataZoomInBtn.addEventListener("click", () => setDiagramZoom("automata", 0.15));
document.querySelectorAll("[data-close-dialog]").forEach((button) => {
  button.addEventListener("click", () => document.querySelector(`#${button.dataset.closeDialog}`)?.close());
});
document.querySelectorAll("[data-open-dialog]").forEach((button) => {
  button.addEventListener("click", () => showDialog(document.querySelector(`#${button.dataset.openDialog}`)));
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
  return data;
}

function setLoading() {
  resultStatus.textContent = "Analizando...";
  resultExactLabel.textContent = "Resultado exacto:";
  resultExact.textContent = "Calculando...";
  resultDetail.textContent = "Procesando fases";
}

function renderResult(data) {
  latestAnalysis = data;
  renderPhases(data.phases, data.tokens.length);
  renderAcademic(data.academic);
  renderTokens(data.tokens, data.academic?.regex_rules || []);
  renderErrors(data);
  renderAst(data.ast, data.academic?.python_code || "", data.academic?.syntax_tree || null);

  if (data.valid && data.evaluation) {
    resultFormula.innerHTML = renderIntegralMath(data.ast);
    if (data.exact?.supported) {
      resultExactLabel.textContent = "Resultado exacto:";
      resultExact.innerHTML = formatMathText(data.exact.expression);
    } else {
      resultExactLabel.textContent = "Evaluacion usada:";
      resultExact.textContent = "Metodo numerico (Simpson)";
    }
    resultStatus.textContent = data.evaluation.decimal;
    resultDetail.textContent = data.exact?.supported
      ? `${data.evaluation.method} usada para verificacion numerica`
      : "No se encontro forma exacta con las reglas simbolicas disponibles.";
  } else if (data.errors.length > 0) {
    resultFormula.innerHTML = emptyIntegralMath();
    resultExactLabel.textContent = "Resultado exacto:";
    resultExact.textContent = "No calculado";
    resultStatus.textContent = "Revisar errores";
    resultDetail.textContent = "El analisis no finalizo";
  } else {
    resultFormula.innerHTML = emptyIntegralMath();
    resultExactLabel.textContent = "Resultado exacto:";
    resultExact.textContent = "Pendiente";
    resultStatus.textContent = "Pendiente";
    resultDetail.textContent = "Resultado decimal";
  }
}

function renderAcademic(academic) {
  renderLexemes(academic?.lexemes || []);
  renderRegexRules(academic?.regex_rules || []);
  renderAutomata(academic?.automata);
  renderGrammar(academic?.grammar);
}

function renderLexemes(lexemes) {
  lexemeCount.textContent = `${lexemes.length} lexema${lexemes.length === 1 ? "" : "s"}`;
  if (!lexemes.length) {
    lexemesBody.innerHTML = `<tr><td colspan="6" class="empty">No se identificaron lexemas.</td></tr>`;
    return;
  }
  lexemesBody.innerHTML = lexemes
    .map(
      (item) => `<tr>
        <td>${item.index}</td>
        <td><code>${escapeHtml(item.lexeme)}</code></td>
        <td>${escapeHtml(item.category)}</td>
        <td>${escapeHtml(item.token)}</td>
        <td>${item.line}</td>
        <td>${item.column}</td>
      </tr>`,
    )
    .join("");
}

function renderRegexRules(rules) {
  regexCount.textContent = `${rules.length} regla${rules.length === 1 ? "" : "s"}`;
  if (!rules.length) {
    regexBody.innerHTML = `<tr><td colspan="5" class="empty">No hay reglas aplicadas.</td></tr>`;
    return;
  }
  regexBody.innerHTML = rules
    .map(
      (rule, index) => `<tr>
        <td>${index + 1}</td>
        <td>${escapeHtml(rule.token)}</td>
        <td><code>${escapeHtml(rule.regex)}</code></td>
        <td>${escapeHtml(rule.description)}</td>
        <td><code>${escapeHtml(rule.example)}</code></td>
      </tr>`,
    )
    .join("");
}

function renderAutomata(automata) {
  currentAutomata = automata || null;
  renderSelectedAutomata();
  const transitions = automata?.transition_table || [];
  transitionCount.textContent = `${transitions.length} transicion${transitions.length === 1 ? "" : "es"}`;
  if (!transitions.length) {
    transitionBody.innerHTML = `<tr><td colspan="5" class="empty">No hay transiciones.</td></tr>`;
    return;
  }
  transitionBody.innerHTML = transitions
    .map(
      (row, index) => `<tr>
        <td>${index + 1}</td>
        <td>${escapeHtml(row.state)}</td>
        <td><code>${escapeHtml(row.input)}</code></td>
        <td>${escapeHtml(row.next)}</td>
        <td>${escapeHtml(row.acceptance)}</td>
      </tr>`,
    )
    .join("");
}

function setAutomataKind(kind) {
  activeAutomataKind = kind;
  nfaToggle.classList.toggle("active", kind === "nfa");
  dfaToggle.classList.toggle("active", kind === "dfa");
  renderSelectedAutomata();
}

function renderSelectedAutomata() {
  const graph = currentAutomata?.[activeAutomataKind];
  const label = activeAutomataKind === "nfa" ? "AFN" : "AFD";
  automataTitle.textContent = graph?.title || label;
  automataSummary.textContent = graph
    ? `${label}: ${graph.states?.length || 0} estados, ${graph.edges?.length || 0} transiciones`
    : "Diagramas dinamicos";
  automataHint.textContent = graph?.summary || "El diagrama se regenera al analizar una integral distinta.";
  renderAutomatonGraph(automataGraph, graph, label);
}

function renderGrammar(grammar) {
  if (!grammar) {
    grammarDefinition.textContent = "G = (V, T, P, S)";
    grammarVariables.textContent = "Pendiente";
    grammarTerminals.textContent = "Pendiente";
    grammarStart.textContent = "Pendiente";
    grammarApplies.textContent = "Pendiente";
    grammarNotApplies.textContent = "Pendiente";
    grammarProductions.textContent = "Ejecuta el analisis para ver la gramatica.";
    return;
  }
  grammarDefinition.textContent = grammar.definition;
  grammarVariables.textContent = grammar.variables.join(", ");
  grammarTerminals.textContent = grammar.terminals.join(", ");
  grammarStart.textContent = grammar.start;
  grammarApplies.textContent = grammar.applies.join(", ");
  grammarNotApplies.textContent = grammar.not_applies.join(", ");
  grammarProductions.textContent = grammar.productions.join("\n");
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

function renderTokens(tokens, regexRules = []) {
  const descriptions = Object.fromEntries(regexRules.map((rule) => [rule.token, rule.description]));
  const groupedTokens = Object.values(
    tokens.reduce((acc, token) => {
      if (!acc[token.type]) {
        acc[token.type] = {
          type: token.type,
          description: descriptions[token.type] || "Token reconocido por el analizador lexico.",
          lexemes: [],
          count: 0,
        };
      }
      acc[token.type].count += 1;
      if (!acc[token.type].lexemes.includes(token.lexeme)) {
        acc[token.type].lexemes.push(token.lexeme);
      }
      return acc;
    }, {}),
  );

  tokenCount.textContent = `${groupedTokens.length} grupo${groupedTokens.length === 1 ? "" : "s"} de tokens`;
  if (!tokens.length) {
    tokensBody.innerHTML = `<tr><td colspan="5" class="empty">No se reconocieron tokens.</td></tr>`;
    return;
  }
  tokensBody.innerHTML = groupedTokens
    .map(
      (group, index) => `<tr>
        <td>${index + 1}</td>
        <td>${escapeHtml(group.type)}</td>
        <td>${escapeHtml(group.description)}</td>
        <td>${group.lexemes.map((lexeme) => `<code>${escapeHtml(lexeme)}</code>`).join(" ")}</td>
        <td>${group.count}</td>
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

function renderAst(ast, pythonCode = "", syntaxTree = null) {
  currentSyntaxTree = syntaxTree;
  astOutput.textContent = ast ? pythonCode : "Sin traduccion generada.";
  if (!ast) {
    astTree.innerHTML = "Sin arbol generado.";
  } else if (syntaxTree?.dot) {
    renderDotGraph(astTree, syntaxTree.dot, () => renderSyntaxTreeSvg(ast));
  } else {
    astTree.innerHTML = renderSyntaxTreeSvg(ast);
    applyDiagramZoom(astTree, treeZoom);
  }
  astTree.classList.toggle("empty", !ast);
}

function renderSyntaxTreeSvg(ast) {
  const tree = {
    label: "INTEGRAL",
    kind: "rule",
    children: [
      { label: "INT", kind: "token" },
      {
        label: "LIMITES",
        kind: "rule",
        children: [
          { label: ast.lower_limit, kind: "lexeme" },
          { label: ast.upper_limit, kind: "lexeme" },
        ],
      },
      {
        label: "EXPRESION",
        kind: "rule",
        children: [astExpressionTree(ast.expression)],
      },
      { label: ast.differential, kind: "token" },
    ],
  };
  return drawTreeSvg(tree);
}

function astExpressionTree(node) {
  if (!node) return { label: "VACIO", kind: "token" };
  if (node.type === "BinaryExpression") {
    return {
      label: node.operator,
      kind: "operator",
      children: [astExpressionTree(node.left), astExpressionTree(node.right)],
    };
  }
  if (node.type === "UnaryExpression") {
    return {
      label: `${node.operator} unario`,
      kind: "operator",
      children: [astExpressionTree(node.operand)],
    };
  }
  if (node.type === "FunctionCall") {
    return {
      label: node.name,
      kind: "function",
      children: [astExpressionTree(node.argument)],
    };
  }
  if (node.type === "Number") return { label: node.value, kind: "lexeme" };
  if (node.type === "Variable") return { label: node.name, kind: "lexeme" };
  if (node.type === "Constant") return { label: node.name, kind: "lexeme" };
  return { label: node.type, kind: "token" };
}

function drawTreeSvg(root) {
  const leafGap = 74;
  const levelGap = 70;
  const margin = 32;
  let leafIndex = 0;
  let maxDepth = 0;
  const nodes = [];
  const edges = [];

  function measure(node, depth = 0, parent = null) {
    maxDepth = Math.max(maxDepth, depth);
    const current = { ...node, id: `t${nodes.length}`, depth, x: 0, y: margin + depth * levelGap };
    nodes.push(current);
    if (parent) edges.push({ from: parent, to: current });

    if (!node.children || !node.children.length) {
      current.x = margin + leafIndex * leafGap;
      leafIndex += 1;
      return current.x;
    }

    const childXs = node.children.map((child) => measure(child, depth + 1, current));
    current.x = childXs.reduce((sum, value) => sum + value, 0) / childXs.length;
    return current.x;
  }

  measure(root);
  const width = Math.max(540, margin * 2 + Math.max(leafIndex - 1, 1) * leafGap);
  const height = margin * 2 + (maxDepth + 1) * levelGap;
  const lines = edges
    .map(
      (edge) =>
        `<line x1="${edge.from.x}" y1="${edge.from.y + 24}" x2="${edge.to.x}" y2="${edge.to.y - 24}" class="tree-edge" />`,
    )
    .join("");
  const nodeMarkup = nodes.map(drawTreeNode).join("");
  return `<svg class="syntax-svg" viewBox="0 0 ${width} ${height}" role="img" aria-label="Arbol sintactico generado">${lines}${nodeMarkup}</svg>`;
}

function drawTreeNode(node) {
  const label = escapeHtml(shortLabel(node.label, 14));
  if (node.kind === "rule") {
    const width = Math.max(66, label.length * 7 + 20);
    return `<g class="tree-node rule">
      <rect x="${node.x - width / 2}" y="${node.y - 18}" width="${width}" height="36" rx="4"></rect>
      <text x="${node.x}" y="${node.y + 4}">${label}</text>
    </g>`;
  }
  if (node.kind === "operator" || node.kind === "function") {
    return `<g class="tree-node ${node.kind}">
      <circle cx="${node.x}" cy="${node.y}" r="19"></circle>
      <text x="${node.x}" y="${node.y + 4}">${label}</text>
    </g>`;
  }
  return `<g class="tree-node lexeme">
    <ellipse cx="${node.x}" cy="${node.y}" rx="${Math.max(24, label.length * 5 + 10)}" ry="18"></ellipse>
    <text x="${node.x}" y="${node.y + 4}">${label}</text>
  </g>`;
}

function renderAutomatonGraph(container, graph, fallbackTitle) {
  if (!graph || !graph.states?.length) {
    container.classList.add("empty");
    container.innerHTML = `Sin ${fallbackTitle} generado.`;
    return;
  }
  container.classList.remove("empty");
  if (graph.dot) {
    renderDotGraph(container, graph.dot, () => drawAutomatonSvg(graph));
  } else {
    container.innerHTML = drawAutomatonSvg(graph);
    applyDiagramZoom(container, automataZoom);
  }
}

async function renderDotGraph(container, dot, fallbackRenderer) {
  container.classList.add("rendering");
  container.innerHTML = "Generando diagrama...";
  const viz = getVizInstance();
  if (!viz) {
    container.innerHTML = fallbackRenderer();
    container.classList.remove("rendering");
    return;
  }
  try {
    const svg = await viz.renderSVGElement(dot);
    svg.classList.add("graphviz-svg");
    container.replaceChildren(svg);
    applyDiagramZoom(container, container === astTree ? treeZoom : automataZoom);
  } catch (error) {
    console.warn("No se pudo renderizar DOT", error);
    vizInstance = null;
    container.innerHTML = fallbackRenderer();
    applyDiagramZoom(container, container === astTree ? treeZoom : automataZoom);
  } finally {
    container.classList.remove("rendering");
  }
}

function setDiagramZoom(kind, delta) {
  if (kind === "tree") {
    treeZoom = clampZoom(treeZoom + delta);
    applyDiagramZoom(astTree, treeZoom);
    return;
  }
  automataZoom = clampZoom(automataZoom + delta);
  applyDiagramZoom(automataGraph, automataZoom);
}

function resetDiagramZoom(kind) {
  if (kind === "tree") {
    treeZoom = 1;
    applyDiagramZoom(astTree, treeZoom);
    return;
  }
  automataZoom = 1;
  applyDiagramZoom(automataGraph, automataZoom);
}

function clampZoom(value) {
  return Math.min(1.9, Math.max(0.55, Number(value.toFixed(2))));
}

function applyDiagramZoom(container, zoom) {
  const svg = container.querySelector("svg");
  if (!svg) return;
  svg.style.width = `${zoom * 100}%`;
  svg.style.maxWidth = "none";
}

function downloadDiagram(container, filename, button) {
  const svg = container.querySelector("svg");
  if (!svg) {
    flashButton(button, "Sin diagrama");
    return;
  }
  const clone = svg.cloneNode(true);
  clone.removeAttribute("style");
  clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  const source = new XMLSerializer().serializeToString(clone);
  const blob = new Blob([source], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
  flashButton(button, "Descargado");
}

async function exportPdfReport() {
  flashButton(downloadPdfBtn, "Preparando");

  try {
    const data = latestAnalysis?.source === sourceInput.value ? latestAnalysis : await analyze();
    const reportRoot = getPdfReportRoot();
    ensureReportPrintStyle();
    reportRoot.innerHTML = await buildPdfReportContent(data);
    document.body.classList.add("printing-report");
    window.addEventListener("afterprint", () => document.body.classList.remove("printing-report"), { once: true });
    window.setTimeout(() => window.print(), 120);
    flashButton(downloadPdfBtn, "PDF listo");
  } catch (error) {
    alert(`No se pudo generar el reporte PDF: ${error?.message || "Error desconocido"}`);
    flashButton(downloadPdfBtn, "Error");
    console.error("No se pudo generar el PDF", error);
  }
}

async function buildPdfDocument(data) {
  return `<!doctype html>
  <html lang="es">
    <head>
      <meta charset="utf-8">
      <title>Reporte - Compilador de Integrales</title>
      <style>${reportPrintCss()}</style>
    </head>
    <body>
      ${await buildPdfReportContent(data)}
    </body>
  </html>`;
}

async function buildPdfReportContent(data) {
  const academic = data.academic || {};
  const automata = academic.automata || {};
  const treeSvg = data.ast
    ? await graphToSvgMarkup(academic.syntax_tree?.dot, () => renderSyntaxTreeSvg(data.ast))
    : "<p class=\"report-empty\">No se genero arbol sintactico.</p>";
  const nfaSvg = await graphToSvgMarkup(automata.nfa?.dot, () =>
    automata.nfa ? drawAutomatonSvg(automata.nfa) : "<p class=\"report-empty\">No se genero AFN.</p>",
  );
  const dfaSvg = await graphToSvgMarkup(automata.dfa?.dot, () =>
    automata.dfa ? drawAutomatonSvg(automata.dfa) : "<p class=\"report-empty\">No se genero AFD.</p>",
  );

  return `
      <header class="report-cover">
        <p class="eyebrow">Proyecto de Compiladores</p>
        <h1>Reporte del Compilador de Integrales Definidas</h1>
        <p>Entrada, validacion, traduccion a Python, resultado matematico, lexemas, tokens, expresiones regulares, automatas, tabla de transicion y gramatica.</p>
      </header>

      <section class="report-section">
        <h2>1. Entrada y proposito</h2>
        <div class="summary-grid">
          <article><strong>Entrada</strong><pre>${escapeHtml(data.source || "")}</pre></article>
          <article><strong>Validacion</strong><p>${phaseSummary(data.phases)}</p></article>
          <article><strong>Traduccion</strong><p>Codigo Python ejecutable con matplotlib para evaluar y graficar la integral.</p></article>
          <article><strong>Resultado matematico</strong><p>${resultSummary(data)}</p></article>
        </div>
      </section>

      <section class="report-section">
        <h2>2. Resultado</h2>
        <div class="result-box">
          <div class="formula">${data.ast ? renderIntegralMath(data.ast) : emptyIntegralMath()}</div>
          <p><strong>Resultado exacto:</strong> ${exactSummary(data)}</p>
          <p><strong>Resultado decimal:</strong> ${escapeHtml(data.evaluation?.decimal || "No calculado")}</p>
          <p><strong>Metodo:</strong> ${escapeHtml(data.evaluation?.method || "Pendiente")}</p>
        </div>
      </section>

      <section class="report-section">
        <h2>3. Lexemas identificados</h2>
        ${lexemeReportTable(academic.lexemes || [])}
      </section>

      <section class="report-section">
        <h2>4. Tokens agrupados</h2>
        ${tokenReportTable(data.tokens || [], academic.regex_rules || [])}
      </section>

      <section class="report-section">
        <h2>5. Expresiones regulares</h2>
        ${regexReportTable(academic.regex_rules || [])}
      </section>

      <section class="report-section">
        <h2>6. Errores por fase</h2>
        ${errorsReport(data.errors || [])}
      </section>

      <section class="report-section page-break">
        <h2>7. Arbol sintactico grafico</h2>
        <div class="diagram">${treeSvg}</div>
      </section>

      <section class="report-section page-break">
        <h2>8. AFN generado por la integral</h2>
        <p class="section-note">${escapeHtml(automata.nfa?.summary || "Automata no determinista generado desde la estructura de la integral.")}</p>
        <div class="diagram automata-diagram">${nfaSvg}</div>
      </section>

      <section class="report-section page-break">
        <h2>9. AFD equivalente</h2>
        <p class="section-note">${escapeHtml(automata.dfa?.summary || "Automata determinista generado desde la secuencia validada.")}</p>
        <div class="diagram automata-diagram">${dfaSvg}</div>
      </section>

      <section class="report-section">
        <h2>10. Tabla de transicion del AFD</h2>
        ${transitionReportTable(automata.transition_table || [])}
      </section>

      <section class="report-section page-break">
        <h2>11. Gramatica Libre de Contexto</h2>
        ${grammarReport(academic.grammar)}
      </section>

      <section class="report-section page-break">
        <h2>12. Traduccion a Python</h2>
        <pre class="code-report">${escapeHtml(academic.python_code || "Sin traduccion generada.")}</pre>
      </section>`;
}

async function graphToSvgMarkup(dot, fallbackRenderer) {
  const fallback = () => {
    const markup = fallbackRenderer();
    return typeof markup === "string" ? markup : "";
  };
  if (!dot) return fallback();

  const viz = getVizInstance();
  if (!viz) return fallback();

  try {
    const svg = await viz.renderSVGElement(dot);
    svg.removeAttribute("style");
    svg.setAttribute("xmlns", "http://www.w3.org/2000/svg");
    svg.setAttribute("preserveAspectRatio", "xMidYMid meet");
    return new XMLSerializer().serializeToString(svg);
  } catch (error) {
    console.warn("No se pudo preparar el SVG del reporte", error);
    vizInstance = null;
    return fallback();
  }
}

function getPdfReportRoot() {
  let root = document.querySelector("#pdfReportRoot");
  if (!root) {
    root = document.createElement("section");
    root.id = "pdfReportRoot";
    root.className = "pdf-report-root";
    root.setAttribute("aria-hidden", "true");
    document.body.appendChild(root);
  }
  return root;
}

function ensureReportPrintStyle() {
  if (document.querySelector("#pdfReportPrintStyle")) return;
  const style = document.createElement("style");
  style.id = "pdfReportPrintStyle";
  style.textContent = reportInlinePrintCss();
  document.head.appendChild(style);
}

function reportInlinePrintCss() {
  return `
    @page { size: A4; margin: 13mm; }
    @media screen { .pdf-report-root { display: none; } }
    @media print {
      body > :not(.pdf-report-root) { display: none !important; }
      .pdf-report-root {
        color: #0b1e33 !important;
        display: block !important;
        font-family: Arial, sans-serif;
        font-size: 10.5pt;
        line-height: 1.35;
      }
      .pdf-report-root * { box-sizing: border-box; }
      .pdf-report-root h1, .pdf-report-root h2, .pdf-report-root h3, .pdf-report-root p { margin-top: 0; }
      .pdf-report-root h1 { font-size: 23pt; line-height: 1.1; margin-bottom: 8mm; }
      .pdf-report-root h2 { border-bottom: 2px solid #0b3a68; color: #0b3a68; font-size: 15pt; margin-bottom: 5mm; padding-bottom: 2mm; }
      .pdf-report-root h3 { color: #0b3a68; font-size: 11pt; margin-bottom: 2mm; }
      .pdf-report-root pre, .pdf-report-root code { font-family: Consolas, "Courier New", monospace; }
      .pdf-report-root pre { white-space: pre-wrap; word-break: break-word; }
      .pdf-report-root table { border-collapse: collapse; font-size: 8.5pt; page-break-inside: auto; width: 100%; }
      .pdf-report-root th, .pdf-report-root td { border: 1px solid #cbd8e4; padding: 5px 6px; text-align: left; vertical-align: top; }
      .pdf-report-root th { background: #0b3a68 !important; color: #fff !important; }
      .pdf-report-root tr { page-break-inside: avoid; }
      .pdf-report-root .report-cover { border: 2px solid #0b3a68; border-radius: 10px; margin-bottom: 8mm; padding: 10mm; }
      .pdf-report-root .eyebrow { color: #52677f; font-size: 10pt; font-weight: 700; letter-spacing: .08em; text-transform: uppercase; }
      .pdf-report-root .report-section { break-inside: avoid-page; margin-bottom: 8mm; }
      .pdf-report-root .page-break { break-before: page; }
      .pdf-report-root .summary-grid { display: grid; gap: 4mm; grid-template-columns: repeat(2, 1fr); }
      .pdf-report-root .summary-grid article,
      .pdf-report-root .result-box,
      .pdf-report-root .grammar-card { border: 1px solid #cbd8e4; border-radius: 8px; padding: 5mm; }
      .pdf-report-root .summary-grid strong,
      .pdf-report-root .grammar-card strong { color: #0b3a68; display: block; margin-bottom: 2mm; }
      .pdf-report-root .result-box { background: #f7fbff !important; }
      .pdf-report-root .formula { align-items: center; display: flex; font-family: Georgia, serif; font-size: 17pt; gap: 5px; justify-content: center; margin-bottom: 5mm; }
      .pdf-report-root .integral-symbol { font-size: 38pt; line-height: 1; }
      .pdf-report-root .limits { display: inline-flex; flex-direction: column; font-size: 9pt; line-height: 1; margin-left: -6px; }
      .pdf-report-root .integrand,
      .pdf-report-root .dx { font-size: 14pt; }
      .pdf-report-root .fraction { display: inline-flex; flex-direction: column; line-height: 1; vertical-align: middle; }
      .pdf-report-root .fraction span:first-child { border-bottom: 1px solid currentColor; padding: 0 3px 2px; }
      .pdf-report-root .diagram { align-items: center; border: 1px solid #cbd8e4; border-radius: 8px; display: flex; justify-content: center; min-height: 95mm; overflow: hidden; padding: 5mm; width: 100%; }
      .pdf-report-root .diagram svg { display: block; height: auto !important; max-height: 175mm; max-width: 100% !important; width: 100% !important; }
      .pdf-report-root .automata-diagram svg { max-height: 145mm; }
      .pdf-report-root .section-note { color: #52677f; font-size: 9.5pt; margin-bottom: 4mm; }
      .pdf-report-root .code-report { background: #0d1726 !important; border-radius: 8px; color: #e8f1ff !important; font-size: 8.5pt; padding: 6mm; }
      .pdf-report-root .report-empty { color: #52677f; font-style: italic; }
      .pdf-report-root .grammar-list { display: grid; gap: 4mm; grid-template-columns: repeat(2, 1fr); margin-bottom: 5mm; }
    }
  `;
}

function buildReportLoadingHtml() {
  return `<!doctype html><html lang="es"><head><meta charset="utf-8"><title>Preparando PDF</title>
  <style>body{font-family:Arial,sans-serif;margin:48px;color:#0b1e33}strong{display:block;font-size:22px;margin-bottom:8px}</style></head>
  <body><strong>Preparando reporte PDF...</strong><p>Se estan ordenando las secciones del compilador.</p></body></html>`;
}

function buildReportErrorHtml(error) {
  return `<!doctype html><html lang="es"><head><meta charset="utf-8"><title>Error PDF</title>
  <style>body{font-family:Arial,sans-serif;margin:48px;color:#7a1f16}</style></head>
  <body><h1>No se pudo generar el reporte</h1><p>${escapeHtml(error?.message || "Error desconocido")}</p></body></html>`;
}

function reportPrintCss() {
  return `
    @page { size: A4; margin: 13mm; }
    * { box-sizing: border-box; }
    body { color: #0b1e33; font-family: Arial, sans-serif; font-size: 10.5pt; line-height: 1.35; margin: 0; }
    h1, h2, h3, p { margin-top: 0; }
    h1 { font-size: 23pt; line-height: 1.1; margin-bottom: 8mm; }
    h2 { border-bottom: 2px solid #0b3a68; color: #0b3a68; font-size: 15pt; margin-bottom: 5mm; padding-bottom: 2mm; }
    h3 { color: #0b3a68; font-size: 11pt; margin-bottom: 2mm; }
    pre, code { font-family: Consolas, "Courier New", monospace; }
    pre { white-space: pre-wrap; word-break: break-word; }
    table { border-collapse: collapse; font-size: 8.5pt; page-break-inside: auto; width: 100%; }
    th, td { border: 1px solid #cbd8e4; padding: 5px 6px; text-align: left; vertical-align: top; }
    th { background: #0b3a68; color: #fff; }
    tr { page-break-inside: avoid; }
    .report-cover { border: 2px solid #0b3a68; border-radius: 10px; margin-bottom: 8mm; padding: 10mm; }
    .eyebrow { color: #52677f; font-size: 10pt; font-weight: 700; letter-spacing: .08em; text-transform: uppercase; }
    .report-section { break-inside: avoid-page; margin-bottom: 8mm; }
    .page-break { break-before: page; }
    .summary-grid { display: grid; gap: 4mm; grid-template-columns: repeat(2, 1fr); }
    .summary-grid article, .result-box, .grammar-card { border: 1px solid #cbd8e4; border-radius: 8px; padding: 5mm; }
    .summary-grid strong { color: #0b3a68; display: block; margin-bottom: 2mm; }
    .result-box { background: #f7fbff; }
    .formula { align-items: center; display: flex; font-family: Georgia, serif; font-size: 17pt; gap: 5px; justify-content: center; margin-bottom: 5mm; }
    .integral-symbol { font-size: 38pt; line-height: 1; }
    .limits { display: inline-flex; flex-direction: column; font-size: 9pt; line-height: 1; margin-left: -6px; }
    .integrand, .dx { font-size: 14pt; }
    .fraction { display: inline-flex; flex-direction: column; line-height: 1; vertical-align: middle; }
    .fraction span:first-child { border-bottom: 1px solid currentColor; padding: 0 3px 2px; }
    .diagram { align-items: center; border: 1px solid #cbd8e4; border-radius: 8px; display: flex; justify-content: center; min-height: 95mm; overflow: hidden; padding: 5mm; width: 100%; }
    .diagram svg { display: block; height: auto !important; max-height: 175mm; max-width: 100% !important; width: 100% !important; }
    .automata-diagram svg { max-height: 145mm; }
    .section-note { color: #52677f; font-size: 9.5pt; margin-bottom: 4mm; }
    .code-report { background: #0d1726; border-radius: 8px; color: #e8f1ff; font-size: 8.5pt; padding: 6mm; }
    .report-empty { color: #52677f; font-style: italic; }
    .grammar-list { display: grid; gap: 4mm; grid-template-columns: repeat(2, 1fr); margin-bottom: 5mm; }
    .grammar-card strong { color: #0b3a68; display: block; margin-bottom: 2mm; }
    @media print { button { display: none; } }
  `;
}

function phaseSummary(phases = {}) {
  return ["lexico", "sintactico", "semantico"]
    .map((phase) => `${phase}: ${phases[phase]?.status || "pendiente"}`)
    .join(" | ");
}

function resultSummary(data) {
  if (!data.valid) return "No calculado porque existen errores pendientes.";
  return `${data.evaluation?.decimal || "No calculado"} (${data.exact?.supported ? "con forma exacta" : "metodo numerico"})`;
}

function exactSummary(data) {
  if (!data.valid) return "No calculado";
  return data.exact?.supported ? formatMathText(data.exact.expression) : "Metodo numerico (Simpson)";
}

function lexemeReportTable(lexemes) {
  if (!lexemes.length) return `<p class="report-empty">No se identificaron lexemas.</p>`;
  return `<table><thead><tr><th>#</th><th>Lexema</th><th>Categoria</th><th>Token</th><th>Linea</th><th>Columna</th></tr></thead><tbody>
    ${lexemes
      .map(
        (item) => `<tr><td>${item.index}</td><td><code>${escapeHtml(item.lexeme)}</code></td><td>${escapeHtml(
          item.category,
        )}</td><td>${escapeHtml(item.token)}</td><td>${item.line}</td><td>${item.column}</td></tr>`,
      )
      .join("")}
  </tbody></table>`;
}

function tokenReportTable(tokens, regexRules) {
  const descriptions = Object.fromEntries(regexRules.map((rule) => [rule.token, rule.description]));
  const groupedTokens = Object.values(
    tokens.reduce((acc, token) => {
      if (!acc[token.type]) {
        acc[token.type] = {
          type: token.type,
          description: descriptions[token.type] || "Token reconocido por el analizador lexico.",
          lexemes: [],
          count: 0,
        };
      }
      acc[token.type].count += 1;
      if (!acc[token.type].lexemes.includes(token.lexeme)) acc[token.type].lexemes.push(token.lexeme);
      return acc;
    }, {}),
  );
  if (!groupedTokens.length) return `<p class="report-empty">No se reconocieron tokens.</p>`;
  return `<table><thead><tr><th>#</th><th>Token</th><th>Descripcion</th><th>Lexemas agrupados</th><th>Cantidad</th></tr></thead><tbody>
    ${groupedTokens
      .map(
        (group, index) => `<tr><td>${index + 1}</td><td>${escapeHtml(group.type)}</td><td>${escapeHtml(
          group.description,
        )}</td><td>${group.lexemes.map((lexeme) => `<code>${escapeHtml(lexeme)}</code>`).join(" ")}</td><td>${
          group.count
        }</td></tr>`,
      )
      .join("")}
  </tbody></table>`;
}

function regexReportTable(rules) {
  if (!rules.length) return `<p class="report-empty">No hay expresiones regulares aplicadas.</p>`;
  return `<table><thead><tr><th>#</th><th>Token</th><th>Regex</th><th>Que reconoce</th><th>Ejemplo</th></tr></thead><tbody>
    ${rules
      .map(
        (rule, index) => `<tr><td>${index + 1}</td><td>${escapeHtml(rule.token)}</td><td><code>${escapeHtml(
          rule.regex,
        )}</code></td><td>${escapeHtml(rule.description)}</td><td><code>${escapeHtml(rule.example)}</code></td></tr>`,
      )
      .join("")}
  </tbody></table>`;
}

function errorsReport(errors) {
  if (!errors.length) return `<p>Sin errores lexicos, sintacticos ni semanticos.</p>`;
  return `<table><thead><tr><th>#</th><th>Fase</th><th>Ubicacion</th><th>Mensaje</th></tr></thead><tbody>
    ${errors
      .map((error, index) => {
        const location = error.line && error.column ? `Linea ${error.line}, columna ${error.column}` : "Sin ubicacion";
        return `<tr><td>${index + 1}</td><td>${escapeHtml(error.phase)}</td><td>${escapeHtml(location)}</td><td>${escapeHtml(
          error.message,
        )}</td></tr>`;
      })
      .join("")}
  </tbody></table>`;
}

function transitionReportTable(transitions) {
  if (!transitions.length) return `<p class="report-empty">No hay transiciones generadas.</p>`;
  return `<table><thead><tr><th>#</th><th>Estado</th><th>Entrada esperada</th><th>Siguiente estado</th><th>Aceptacion</th></tr></thead><tbody>
    ${transitions
      .map(
        (row, index) => `<tr><td>${index + 1}</td><td>${escapeHtml(row.state)}</td><td><code>${escapeHtml(
          row.input,
        )}</code></td><td>${escapeHtml(row.next)}</td><td>${escapeHtml(row.acceptance)}</td></tr>`,
      )
      .join("")}
  </tbody></table>`;
}

function grammarReport(grammar) {
  if (!grammar) return `<p class="report-empty">No hay gramatica generada.</p>`;
  return `<div class="grammar-list">
      <article class="grammar-card"><strong>Definicion</strong>${escapeHtml(grammar.definition)}</article>
      <article class="grammar-card"><strong>Simbolo inicial</strong>${escapeHtml(grammar.start)}</article>
      <article class="grammar-card"><strong>Variables V</strong>${escapeHtml(grammar.variables.join(", "))}</article>
      <article class="grammar-card"><strong>Terminales T</strong>${escapeHtml(grammar.terminals.join(", "))}</article>
      <article class="grammar-card"><strong>Categorias usadas</strong>${escapeHtml(grammar.applies.join(", "))}</article>
      <article class="grammar-card"><strong>No aplican directamente</strong>${escapeHtml(grammar.not_applies.join(", "))}</article>
    </div>
    <h3>Producciones P</h3>
    <pre>${escapeHtml(grammar.productions.join("\n"))}</pre>`;
}

function getVizInstance() {
  if (typeof Viz === "undefined") {
    console.warn("No se pudo cargar Viz.js");
    return null;
  }
  if (!vizInstance) {
    vizInstance = new Viz();
  }
  return vizInstance;
}

function drawAutomatonSvg(graph) {
  const positions = new Map();
  const margin = 48;
  graph.states.forEach((state) => {
    positions.set(state.id, { x: state.x || margin, y: state.y || margin });
  });

  const allPositions = Array.from(positions.values());
  const width = Math.max(1280, Math.max(...allPositions.map((point) => point.x)) + margin);
  const height = Math.max(320, Math.max(...allPositions.map((point) => point.y)) + margin + 64);
  const edges = graph.edges.map((edge, index) => drawAutomatonEdge(edge, positions, index)).join("");
  const states = graph.states.map((state) => drawAutomatonState(state, positions.get(state.id))).join("");
  const start = positions.get(graph.start);
  const startArrow = start
    ? `<line x1="${start.x - 58}" y1="${start.y}" x2="${start.x - 28}" y2="${start.y}" class="automata-edge" marker-end="url(#arrow)" />`
    : "";

  return `<svg class="automata-svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-label="${escapeHtml(
    graph.title,
  )}">
    <defs>
      <marker id="arrow" markerWidth="10" markerHeight="10" refX="8" refY="3" orient="auto" markerUnits="strokeWidth">
        <path d="M0,0 L0,6 L9,3 z" class="arrow-head"></path>
      </marker>
    </defs>
    ${startArrow}
    ${edges}
    ${states}
  </svg>`;
}

function drawAutomatonEdge(edge, positions, index) {
  const from = positions.get(edge.from);
  const to = positions.get(edge.to);
  if (!from || !to) return "";
  if (edge.from === edge.to) {
    const label = splitEdgeLabel(edge.label);
    const direction = edge.loop === "bottom" ? 1 : -1;
    const labelY = from.y + direction * 78;
    const startY = from.y + direction * 24;
    const controlY = from.y + direction * 92;
    return `<g class="automata-transition">
      <path d="M ${from.x - 18} ${startY} C ${from.x - 62} ${controlY}, ${from.x + 62} ${
        controlY
      }, ${from.x + 18} ${startY}" class="automata-edge" marker-end="url(#arrow)"></path>
      <text x="${from.x}" y="${labelY}">${label
        .map((line, lineIndex) => `<tspan x="${from.x}" dy="${lineIndex === 0 ? 0 : 14}">${escapeHtml(line)}</tspan>`)
        .join("")}</text>
    </g>`;
  }
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const length = Math.max(Math.sqrt(dx * dx + dy * dy), 1);
  const radius = 26;
  const start = {
    x: from.x + (dx / length) * radius,
    y: from.y + (dy / length) * radius,
  };
  const end = {
    x: to.x - (dx / length) * radius,
    y: to.y - (dy / length) * radius,
  };
  const sameRow = Math.abs(from.y - to.y) < 2;
  const curve = edge.curve ?? (sameRow ? 24 : 34);
  const midX = (start.x + end.x) / 2;
  const midY = (start.y + end.y) / 2 - curve;
  const path = `M ${start.x} ${start.y} Q ${midX} ${midY} ${end.x} ${end.y}`;
  const label = splitEdgeLabel(edge.label);
  return `<g class="automata-transition">
    <path d="${path}" class="automata-edge" marker-end="url(#arrow)"></path>
    <text x="${midX}" y="${midY - (label.length > 1 ? 7 : 0)}">${label
      .map((line, lineIndex) => `<tspan x="${midX}" dy="${lineIndex === 0 ? 0 : 14}">${escapeHtml(line)}</tspan>`)
      .join("")}</text>
  </g>`;
}

function drawAutomatonState(state, position) {
  const finalRing = state.final
    ? `<circle cx="${position.x}" cy="${position.y}" r="31" class="state-final-ring"></circle>`
    : "";
  return `<g class="automata-state">
    ${finalRing}
    <circle cx="${position.x}" cy="${position.y}" r="25"></circle>
    <text x="${position.x}" y="${position.y + 5}">${escapeHtml(state.label)}</text>
  </g>`;
}

function splitEdgeLabel(value) {
  if (value === "epsilon") return ["epsilon"];
  const [token, ...rest] = String(value).split(":");
  const lexeme = rest.join(":").trim();
  return [shortLabel(token.trim(), 24), shortLabel(lexeme, 18)].filter(Boolean);
}

function shortLabel(value, maxLength) {
  const text = String(value);
  return text.length > maxLength ? `${text.slice(0, maxLength - 1)}...` : text;
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
  flashButton(button, message);
}

function flashButton(button, message) {
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
  resultExactLabel.textContent = "Resultado exacto:";
  resultExact.textContent = "Pendiente";
  resultStatus.textContent = "Pendiente";
  resultDetail.textContent = "Resultado decimal";
  lexemeCount.textContent = "0 lexemas";
  lexemesBody.innerHTML = `<tr><td colspan="6" class="empty">Ejecuta el analisis para ver lexemas.</td></tr>`;
  tokenCount.textContent = "0 grupos";
  tokensBody.innerHTML = `<tr><td colspan="5" class="empty">Ejecuta el analisis para ver tokens agrupados.</td></tr>`;
  regexCount.textContent = "0 reglas";
  regexBody.innerHTML = `<tr><td colspan="5" class="empty">Ejecuta el analisis para ver expresiones regulares.</td></tr>`;
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
  astOutput.textContent = "Sin traduccion generada.";
  astTree.textContent = "Sin arbol generado.";
  currentAutomata = null;
  automataTitle.textContent = activeAutomataKind === "nfa" ? "AFN" : "AFD";
  automataSummary.textContent = "Diagramas dinamicos";
  automataHint.textContent = "El diagrama se regenera al analizar una integral distinta.";
  automataGraph.classList.add("empty");
  automataGraph.textContent = activeAutomataKind === "nfa" ? "Sin AFN generado." : "Sin AFD generado.";
  transitionCount.textContent = "0 transiciones";
  transitionBody.innerHTML = `<tr><td colspan="5" class="empty">Ejecuta el analisis para ver la tabla.</td></tr>`;
  renderGrammar(null);
  astOutput.textContent = "Sin traduccion generada.";
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
