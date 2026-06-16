from __future__ import annotations

from .evaluator import evaluate_integral, semantic_check
from .lexer import tokenize
from .nodes import EvaluationError
from .parser import Parser
from .tokens import CompilerError


def analyze_source(source: str) -> dict:
    tokens, lexical_errors = tokenize(source)
    visible_tokens = [token for token in tokens if token.type != "EOF"]

    result = {
        "source": source,
        "tokens": [token.__dict__ for token in visible_tokens],
        "phases": {
            "lexico": phase_state(lexical_errors),
            "sintactico": phase_state([]),
            "semantico": phase_state([]),
        },
        "errors": [error.to_dict() for error in lexical_errors],
        "ast": None,
        "normalized": "",
        "intermediate": None,
        "evaluation": None,
        "valid": False,
    }

    if lexical_errors:
        result["phases"]["sintactico"] = skipped_state("Analisis omitido porque existen errores lexicos.")
        result["phases"]["semantico"] = skipped_state("Analisis omitido porque la sintaxis no fue validada.")
        return result

    parser = Parser(tokens)
    integral, syntax_errors = parser.parse()
    result["phases"]["sintactico"] = phase_state(syntax_errors)
    result["errors"].extend(error.to_dict() for error in syntax_errors)
    if syntax_errors or integral is None:
        result["phases"]["semantico"] = skipped_state("Analisis omitido porque existen errores sintacticos.")
        return result

    semantic_errors = semantic_check(integral)
    result["phases"]["semantico"] = phase_state(semantic_errors)
    result["errors"].extend(error.to_dict() for error in semantic_errors)
    result["ast"] = integral.to_dict()
    result["normalized"] = integral.normalized()
    result["intermediate"] = integral.intermediate_code()

    if semantic_errors:
        return result

    try:
        evaluation = evaluate_integral(integral)
        value = evaluation["value"]
        result["evaluation"] = {
            **evaluation,
            "decimal": f"{value:.10f}",
            "summary": f"Resultado aproximado: {value:.10f}",
        }
        result["valid"] = True
    except EvaluationError as exc:
        error = CompilerError("semantico", str(exc))
        result["errors"].append(error.to_dict())
        result["phases"]["semantico"] = phase_state([error])

    return result


def phase_state(errors: list[CompilerError]) -> dict:
    return {
        "status": "valido" if not errors else "error",
        "count": len(errors),
        "errors": [error.to_dict() for error in errors],
    }


def skipped_state(reason: str) -> dict:
    return {
        "status": "omitido",
        "count": 0,
        "reason": reason,
        "errors": [],
    }
