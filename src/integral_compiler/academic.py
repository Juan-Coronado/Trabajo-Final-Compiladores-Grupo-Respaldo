from __future__ import annotations


TOKEN_INFO = {
    "RESERVED": {
        "category": "palabra reservada",
        "description": "Inicio de una integral definida.",
        "regex": r"(INT|INTEGRAL|∫)",
        "example": "INT",
    },
    "NUMBER": {
        "category": "numero",
        "description": "Numero entero o decimal usado en limites o expresiones.",
        "regex": r"[0-9]+(\.[0-9]+)?",
        "example": "3.14",
    },
    "VARIABLE": {
        "category": "identificador",
        "description": "Variable de integracion permitida.",
        "regex": r"x",
        "example": "x",
    },
    "IDENTIFIER": {
        "category": "identificador",
        "description": "Identificador textual no permitido por esta gramatica.",
        "regex": r"[A-Za-z]+",
        "example": "abc",
    },
    "FUNCTION": {
        "category": "funcion matematica",
        "description": "Funcion matematica permitida para el integrando.",
        "regex": r"(sin|cos|tan|ln|sqrt|exp)",
        "example": "sin",
    },
    "CONSTANT": {
        "category": "constante",
        "description": "Constante matematica reconocida.",
        "regex": r"(pi|e|π)",
        "example": "pi",
    },
    "DIFFERENTIAL": {
        "category": "diferencial",
        "description": "Diferencial que cierra la integral respecto a x.",
        "regex": r"dx",
        "example": "dx",
    },
    "LBRACKET": {
        "category": "simbolo",
        "description": "Apertura de limites de integracion.",
        "regex": r"\[",
        "example": "[",
    },
    "RBRACKET": {
        "category": "simbolo",
        "description": "Cierre de limites de integracion.",
        "regex": r"\]",
        "example": "]",
    },
    "LPAREN": {
        "category": "simbolo",
        "description": "Apertura de expresion o argumento de funcion.",
        "regex": r"\(",
        "example": "(",
    },
    "RPAREN": {
        "category": "simbolo",
        "description": "Cierre de expresion o argumento de funcion.",
        "regex": r"\)",
        "example": ")",
    },
    "COMMA": {
        "category": "separador",
        "description": "Separa limite inferior y limite superior.",
        "regex": r",",
        "example": ",",
    },
    "PLUS": {
        "category": "operador aritmetico",
        "description": "Operador de suma.",
        "regex": r"\+",
        "example": "+",
    },
    "MINUS": {
        "category": "operador aritmetico",
        "description": "Operador de resta o signo negativo.",
        "regex": r"-",
        "example": "-",
    },
    "TIMES": {
        "category": "operador aritmetico",
        "description": "Operador de multiplicacion.",
        "regex": r"(\*|×)",
        "example": "*",
    },
    "DIVIDE": {
        "category": "operador aritmetico",
        "description": "Operador de division.",
        "regex": r"/",
        "example": "/",
    },
    "POWER": {
        "category": "operador aritmetico",
        "description": "Operador de potencia.",
        "regex": r"\^",
        "example": "^",
    },
    "UNKNOWN": {
        "category": "desconocido",
        "description": "Simbolo que no pertenece al lenguaje.",
        "regex": r".",
        "example": "@",
    },
}


def build_academic_report(tokens: list[dict], ast: dict | None, source: str) -> dict:
    return {
        "lexemes": build_lexemes(tokens),
        "regex_rules": build_regex_rules(tokens),
        "automata": build_sequence_automata(tokens, ast),
        "syntax_tree": build_syntax_tree(ast) if ast else None,
        "grammar": build_grammar(),
        "python_code": build_python_code(ast, source) if ast else "",
    }


def build_lexemes(tokens: list[dict]) -> list[dict]:
    lexemes = []
    for index, token in enumerate(tokens, start=1):
        info = TOKEN_INFO.get(token["type"], TOKEN_INFO["UNKNOWN"])
        lexemes.append(
            {
                "index": index,
                "lexeme": token["lexeme"],
                "category": info["category"],
                "token": token["type"],
                "line": token["line"],
                "column": token["column"],
            }
        )
    return lexemes


def build_regex_rules(tokens: list[dict]) -> list[dict]:
    seen = []
    for token in tokens:
        token_type = token["type"]
        if token_type not in seen:
            seen.append(token_type)

    return [
        {
            "token": token_type,
            "regex": TOKEN_INFO.get(token_type, TOKEN_INFO["UNKNOWN"])["regex"],
            "description": TOKEN_INFO.get(token_type, TOKEN_INFO["UNKNOWN"])["description"],
            "example": TOKEN_INFO.get(token_type, TOKEN_INFO["UNKNOWN"])["example"],
        }
        for token_type in seen
    ]


def build_sequence_automata(tokens: list[dict], ast: dict | None = None) -> dict:
    return build_structural_automata(tokens, ast)


def build_structural_automata(tokens: list[dict], ast: dict | None = None) -> dict:
    parts = split_integral_parts(tokens)
    dfa_states = dfa_token_states(len(tokens) + 1)
    dfa_edges = [
        {"from": f"D{index}", "to": f"D{index + 1}", "label": token_automata_label(token)}
        for index, token in enumerate(tokens)
    ]
    transition_rows = [
        {
            "automaton": "AFD",
            "state": f"D{index}",
            "input": f"{token['type']}: {token['lexeme']}",
            "next": f"D{index + 1}",
            "acceptance": "No",
        }
        for index, token in enumerate(tokens)
    ]
    transition_rows.append(
        {
            "automaton": "AFD",
            "state": f"D{len(tokens)}",
            "input": "fin de entrada",
            "next": "ACEPTA",
            "acceptance": "Si",
        }
    )

    nfa = build_input_nfa(tokens, parts, ast)
    dfa = {
            "title": "AFD equivalente generado para la integral actual",
            "summary": "Se genera con un estado por cada lexema reconocido en la entrada.",
            "states": dfa_states,
            "edges": dfa_edges,
            "start": "D0",
            "finals": [f"D{len(tokens)}"],
        }
    nfa["dot"] = automata_to_dot(nfa, "AFN_generado")
    dfa["dot"] = automata_to_dot(dfa, "AFD_generado")

    return {
        "nfa": nfa,
        "dfa": dfa,
        "transition_table": transition_rows,
    }


def dfa_token_states(count: int) -> list[dict]:
    spacing = 86 if count > 18 else 102
    return [
        {
            "id": f"D{index}",
            "label": f"D{index}",
            "final": index == count - 1,
            "x": 68 + index * spacing,
            "y": 154,
        }
        for index in range(count)
    ]


def build_input_nfa(tokens: list[dict], parts: dict, ast: dict | None = None) -> dict:
    builder = AutomataBuilder("q")
    start = builder.add_state()
    head = builder.add_state()
    open_limits = builder.add_state()
    lower = builder.add_state()
    separator = builder.add_state()
    upper = builder.add_state()
    close_limits = builder.add_state()
    open_expression = builder.add_state()
    expression_done = builder.add_state()
    close_expression = builder.add_state()
    final = builder.add_state(final=True)

    builder.edge(start, head, parts["reserved"] or "INT")
    builder.edge(start, head, "INTEGRAL")
    builder.edge(start, head, "integral")
    builder.edge(head, open_limits, "[")
    add_limit_nfa(builder, open_limits, lower, parts["lower"], "limite inferior")
    builder.edge(lower, separator, ",")
    add_limit_nfa(builder, separator, upper, parts["upper"], "limite superior")
    builder.edge(upper, close_limits, "]")
    builder.edge(close_limits, open_expression, "(")

    if ast and ast.get("expression"):
        build_expression_nfa(builder, open_expression, expression_done, ast["expression"])
    else:
        builder.edge(open_expression, expression_done, compact_automata_value(parts["expression"], 18) or "expresion")

    builder.edge(expression_done, close_expression, ")")
    builder.edge(close_expression, final, parts["differential"] or "dx")

    return {
        "title": "AFN generado para la integral actual",
        "summary": "Las ramas del integrando se construyen desde el AST de la integral analizada.",
        "states": builder.states,
        "edges": builder.edges,
        "start": start,
        "finals": [final],
    }


def add_limit_nfa(builder: "AutomataBuilder", origin: str, target: str, value: str, label: str) -> None:
    branch = builder.add_state(label="LIM")
    clean = value or label
    builder.edge(origin, branch, label)
    if clean.startswith(("+", "-")):
        signed = builder.add_state(label="SIGNO")
        builder.edge(branch, signed, clean[0])
        builder.edge(signed, target, limit_kind_label(clean[1:]))
    else:
        builder.edge(branch, target, limit_kind_label(clean))
    builder.edge(origin, target, compact_automata_value(clean, 14))


def limit_kind_label(value: str) -> str:
    clean = value.strip().lower()
    if clean in {"pi", "e", "Ï€"}:
        return "CONSTANTE"
    return "NUMERO"


def build_expression_nfa(builder: "AutomataBuilder", origin: str, target: str, node: dict) -> None:
    node_type = node.get("type")
    if node_type == "BinaryExpression":
        operator = builder.add_state(label=node["operator"])
        left_entry = builder.add_state(label="L")
        right_entry = builder.add_state(label="R")
        builder.edge(origin, operator, "epsilon")
        builder.edge(operator, left_entry, "izquierda")
        builder.edge(operator, right_entry, "derecha")
        build_expression_nfa(builder, left_entry, target, node["left"])
        build_expression_nfa(builder, right_entry, target, node["right"])
        return

    if node_type == "UnaryExpression":
        unary = builder.add_state(label="UNARIO")
        builder.edge(origin, unary, node["operator"])
        build_expression_nfa(builder, unary, target, node["operand"])
        return

    if node_type == "FunctionCall":
        function = builder.add_state(label=node["name"])
        argument_start = builder.add_state(label="ARG")
        argument_end = builder.add_state(label="ARG'")
        builder.edge(origin, function, "FUNCION")
        builder.edge(function, argument_start, "(")
        build_expression_nfa(builder, argument_start, argument_end, node["argument"])
        builder.edge(argument_end, target, ")")
        return

    builder.edge(origin, target, expression_leaf_label(node))


def expression_leaf_label(node: dict) -> str:
    node_type = node.get("type")
    if node_type == "Number":
        return f"NUMERO {compact_automata_value(node.get('value', ''), 8)}"
    if node_type == "Variable":
        return f"VARIABLE {node.get('name', 'x')}"
    if node_type == "Constant":
        return f"CONSTANTE {node.get('name', '')}"
    return compact_automata_value(str(node_type or "factor"), 14)


class AutomataBuilder:
    def __init__(self, prefix: str) -> None:
        self.prefix = prefix
        self.states: list[dict] = []
        self.edges: list[dict] = []

    def add_state(self, label: str | None = None, final: bool = False) -> str:
        state_id = f"{self.prefix}{len(self.states)}"
        self.states.append({"id": state_id, "label": label or state_id, "final": final})
        return state_id

    def edge(self, origin: str, target: str, label: str) -> None:
        self.edges.append({"from": origin, "to": target, "label": label})


def token_automata_label(token: dict) -> str:
    lexeme = token["lexeme"]
    token_type = token["type"]
    fixed = {
        "RESERVED": compact_automata_value(lexeme, 8),
        "LBRACKET": "[",
        "RBRACKET": "]",
        "LPAREN": "(",
        "RPAREN": ")",
        "COMMA": ",",
        "PLUS": "+",
        "MINUS": "-",
        "TIMES": "*",
        "DIVIDE": "/",
        "POWER": "^",
        "DIFFERENTIAL": "dx",
    }
    return fixed.get(token_type, compact_automata_value(lexeme, 10))


def compact_automata_value(value: str, max_length: int) -> str:
    text = " ".join(value.split())
    return text if len(text) <= max_length else f"{text[: max_length - 1]}..."


def automata_to_dot(graph: dict, graph_name: str) -> str:
    finals = set(graph.get("finals", []))
    lines = [
        f"digraph {graph_name} {{",
        "  graph [rankdir=LR, bgcolor=\"transparent\", pad=\"0.25\", nodesep=\"0.55\", ranksep=\"0.8\"];",
        "  node [shape=circle, style=\"filled\", fillcolor=\"#ffffff\", color=\"#1d2a38\", fontname=\"Arial\", fontsize=\"12\", penwidth=\"1.7\"];",
        "  edge [color=\"#1d2a38\", fontname=\"Arial\", fontsize=\"11\", arrowsize=\"0.75\", penwidth=\"1.5\"];",
        "  __start [shape=point, label=\"\", width=\"0.12\", color=\"#1d2a38\"];",
    ]
    for state in graph.get("states", []):
        shape = "doublecircle" if state["id"] in finals or state.get("final") else "circle"
        lines.append(f"  {dot_id(state['id'])} [label=\"{dot_escape(state['label'])}\", shape={shape}];")
    if graph.get("start"):
        lines.append(f"  __start -> {dot_id(graph['start'])};")
    for edge in graph.get("edges", []):
        label = edge.get("label", "")
        lines.append(
            f"  {dot_id(edge['from'])} -> {dot_id(edge['to'])} [label=\"{dot_escape(label)}\"];"
        )
    lines.append("}")
    return "\n".join(lines)


def build_syntax_tree(ast: dict) -> dict:
    builder = DotTreeBuilder()
    root = builder.add("S", "rule")
    integral = builder.add("INTEGRAL", "rule")
    builder.edge(root, integral)
    builder.edge(integral, builder.add("INT", "token"))

    limits = builder.add("LIMITES", "rule")
    builder.edge(integral, limits)
    lower = builder.add("LIMITE_INF", "rule")
    upper = builder.add("LIMITE_SUP", "rule")
    builder.edge(limits, lower)
    builder.edge(limits, upper)
    builder.edge(lower, builder.add(ast["lower_limit"], "lexeme"))
    builder.edge(upper, builder.add(ast["upper_limit"], "lexeme"))

    expression = builder.add("EXPRESION", "rule")
    builder.edge(integral, expression)
    builder.edge(expression, build_expression_tree(builder, ast["expression"]))
    builder.edge(integral, builder.add(ast["differential"], "token"))

    return {
        "title": "Arbol sintactico generado para la integral actual",
        "summary": f"{builder.node_count} nodos, {len(builder.edges)} ramas",
        "dot": builder.to_dot("ArbolSintactico"),
    }


def build_expression_tree(builder: "DotTreeBuilder", node: dict) -> str:
    node_type = node["type"]
    if node_type == "BinaryExpression":
        expression = builder.add("EXPRESION", "rule")
        left = build_expression_tree(builder, node["left"])
        operator = builder.add(node["operator"], "operator")
        right = build_expression_tree(builder, node["right"])
        builder.edge(expression, left)
        builder.edge(expression, operator)
        builder.edge(expression, right)
        return expression
    if node_type == "UnaryExpression":
        unary = builder.add("UNARIO", "rule")
        builder.edge(unary, builder.add(node["operator"], "operator"))
        builder.edge(unary, build_expression_tree(builder, node["operand"]))
        return unary
    if node_type == "FunctionCall":
        function = builder.add("FUNCION", "rule")
        builder.edge(function, builder.add(node["name"], "function"))
        builder.edge(function, build_expression_tree(builder, node["argument"]))
        return function
    if node_type == "Number":
        number = builder.add("NUMERO", "rule")
        builder.edge(number, builder.add(node["value"], "lexeme"))
        return number
    if node_type == "Variable":
        variable = builder.add("VARIABLE", "rule")
        builder.edge(variable, builder.add(node["name"], "lexeme"))
        return variable
    if node_type == "Constant":
        constant = builder.add("CONSTANTE", "rule")
        builder.edge(constant, builder.add(node["name"], "lexeme"))
        return constant
    unknown = builder.add(node_type, "rule")
    return unknown


class DotTreeBuilder:
    def __init__(self) -> None:
        self.nodes: list[dict] = []
        self.edges: list[tuple[str, str]] = []
        self.node_count = 0

    def add(self, label: str, kind: str) -> str:
        node_id = f"n{self.node_count}"
        self.node_count += 1
        self.nodes.append({"id": node_id, "label": str(label), "kind": kind})
        return node_id

    def edge(self, origin: str, target: str) -> None:
        self.edges.append((origin, target))

    def to_dot(self, graph_name: str) -> str:
        lines = [
            f"digraph {graph_name} {{",
            "  graph [rankdir=TB, bgcolor=\"transparent\", pad=\"0.25\", nodesep=\"0.45\", ranksep=\"0.55\"];",
            "  node [fontname=\"Arial\", fontsize=\"12\", penwidth=\"1.4\"];",
            "  edge [color=\"#60758d\", arrowsize=\"0.65\", penwidth=\"1.3\"];",
        ]
        for node in self.nodes:
            attrs = tree_node_attrs(node["kind"])
            lines.append(f"  {node['id']} [label=\"{dot_escape(node['label'])}\", {attrs}];")
        for origin, target in self.edges:
            lines.append(f"  {origin} -> {target};")
        lines.append("}")
        return "\n".join(lines)


def tree_node_attrs(kind: str) -> str:
    attrs = {
        "rule": 'shape=box, style="rounded,filled", fillcolor="#dce8f4", color="#4d6680"',
        "operator": 'shape=circle, style="filled", fillcolor="#b9efd1", color="#0a7a3d"',
        "function": 'shape=circle, style="filled", fillcolor="#d9f2ff", color="#0a4b78"',
        "token": 'shape=ellipse, style="filled", fillcolor="#eef8fb", color="#4d6680"',
        "lexeme": 'shape=ellipse, style="filled", fillcolor="#d5f7dd", color="#22864e"',
    }
    return attrs.get(kind, attrs["rule"])


def dot_id(value: str) -> str:
    return "".join(char if char.isalnum() or char == "_" else "_" for char in str(value))


def dot_escape(value: str) -> str:
    return str(value).replace("\\", "\\\\").replace('"', '\\"').replace("\n", "\\n")



def split_integral_parts(tokens: list[dict]) -> dict:
    def find(token_type: str, start: int = 0) -> int:
        for index in range(start, len(tokens)):
            if tokens[index]["type"] == token_type:
                return index
        return -1

    reserved = tokens[0]["lexeme"] if tokens else "INT"
    lbracket = find("LBRACKET")
    comma = find("COMMA", lbracket + 1)
    rbracket = find("RBRACKET", comma + 1)
    lparen = find("LPAREN", rbracket + 1)
    differential = find("DIFFERENTIAL", lparen + 1)
    rparen = -1
    for index in range(differential - 1, lparen, -1):
        if tokens[index]["type"] == "RPAREN":
            rparen = index
            break

    return {
        "reserved": reserved,
        "lower": join_lexemes(tokens[lbracket + 1 : comma]) if lbracket >= 0 and comma >= 0 else "a",
        "upper": join_lexemes(tokens[comma + 1 : rbracket]) if comma >= 0 and rbracket >= 0 else "b",
        "expression": join_lexemes(tokens[lparen + 1 : rparen]) if lparen >= 0 and rparen >= 0 else "expresion",
        "differential": tokens[differential]["lexeme"] if differential >= 0 else "dx",
        "lower_start": lbracket + 1 if lbracket >= 0 else 0,
        "lower_end": comma - 1 if comma >= 0 else -1,
        "upper_start": comma + 1 if comma >= 0 else 0,
        "upper_end": rbracket - 1 if rbracket >= 0 else -1,
        "expr_start": lparen + 1 if lparen >= 0 else 0,
        "expr_end": rparen - 1 if rparen >= 0 else -1,
    }


def join_lexemes(tokens: list[dict]) -> str:
    if not tokens:
        return ""
    raw = " ".join(token["lexeme"] for token in tokens)
    return (
        raw.replace("( ", "(")
        .replace(" )", ")")
        .replace("[ ", "[")
        .replace(" ]", "]")
        .replace(" ,", ",")
    )


def build_grammar() -> dict:
    variables = [
        "S",
        "Integral",
        "Limites",
        "Limite",
        "Expresion",
        "Termino",
        "Potencia",
        "Factor",
        "Funcion",
        "Numero",
        "Constante",
        "Variable",
    ]
    terminals = [
        "INT",
        "[",
        "]",
        ",",
        "(",
        ")",
        "dx",
        "NUMBER",
        "x",
        "pi",
        "e",
        "sin",
        "cos",
        "tan",
        "ln",
        "sqrt",
        "exp",
        "+",
        "-",
        "*",
        "/",
        "^",
    ]
    productions = [
        "S -> Integral",
        "Integral -> INT [ Limite , Limite ] ( Expresion ) dx",
        "Limite -> Numero | Constante | - Numero | - Constante",
        "Expresion -> Expresion + Termino | Expresion - Termino | Termino",
        "Termino -> Termino * Potencia | Termino / Potencia | Termino Potencia | Potencia",
        "Potencia -> Factor ^ Potencia | Factor",
        "Factor -> Numero | Variable | Constante | Funcion ( Expresion ) | ( Expresion ) | - Factor",
        "Funcion -> sin | cos | tan | ln | sqrt | exp",
        "Numero -> DIGITO+ | DIGITO+ . DIGITO+",
        "Variable -> x",
        "Constante -> pi | e",
    ]
    return {
        "definition": "G = (V, T, P, S)",
        "variables": variables,
        "terminals": terminals,
        "productions": productions,
        "start": "S",
        "applies": [
            "Numeros",
            "Identificadores",
            "Expresiones aritmeticas",
            "Funciones matematicas",
            "Parentesis balanceados",
            "Limites de integracion",
        ],
        "not_applies": [
            "IF",
            "IF-ELSE",
            "WHILE",
            "FOR",
            "Expresiones logicas",
            "Comentarios",
        ],
    }


def build_python_code(ast: dict, source: str) -> str:
    lower = limit_to_python(ast["lower_limit"])
    upper = limit_to_python(ast["upper_limit"])
    expression = node_to_python(ast["expression"])
    source_comment = source.replace("\n", " ")
    return f'''# Codigo Python generado por el compilador de integrales
# Entrada: {source_comment}
import math
import numpy as np
import matplotlib.pyplot as plt


def f(x):
    return {expression}


a = {lower}
b = {upper}
n = 1000
if n % 2 != 0:
    n += 1

h = (b - a) / n
xs = np.linspace(a, b, n + 1)
ys = np.array([f(x) for x in xs])
area = h / 3 * (ys[0] + ys[-1] + 4 * np.sum(ys[1:-1:2]) + 2 * np.sum(ys[2:-1:2]))

plt.figure(figsize=(9, 5))
plt.plot(xs, ys, color="#0a3a6d", linewidth=2, label="f(x)")
plt.fill_between(xs, ys, 0, color="#18a999", alpha=0.25, label="Area integrada")
plt.axhline(0, color="#202020", linewidth=0.8)
plt.title("Integral definida: {source_comment}")
plt.xlabel("x")
plt.ylabel("f(x)")
plt.grid(True, alpha=0.25)
plt.legend()
print(f"Resultado aproximado por Simpson: {{area:.10f}}")
plt.show()
'''


def limit_to_python(value: str) -> str:
    clean = value.strip().lower().replace("π", "pi")
    if clean == "pi":
        return "math.pi"
    if clean == "-pi":
        return "-math.pi"
    if clean == "e":
        return "math.e"
    if clean == "-e":
        return "-math.e"
    return clean


def node_to_python(node: dict) -> str:
    node_type = node["type"]
    if node_type == "Number":
        return str(node["value"])
    if node_type == "Variable":
        return "x"
    if node_type == "Constant":
        name = node["name"].lower().replace("π", "pi")
        return "math.pi" if name == "pi" else "math.e"
    if node_type == "FunctionCall":
        functions = {
            "sin": "math.sin",
            "cos": "math.cos",
            "tan": "math.tan",
            "ln": "math.log",
            "sqrt": "math.sqrt",
            "exp": "math.exp",
        }
        return f"{functions[node['name'].lower()]}({node_to_python(node['argument'])})"
    if node_type == "UnaryExpression":
        return f"({node['operator']}{node_to_python(node['operand'])})"
    if node_type == "BinaryExpression":
        operator = "**" if node["operator"] == "^" else node["operator"]
        return f"({node_to_python(node['left'])} {operator} {node_to_python(node['right'])})"
    return "0"
