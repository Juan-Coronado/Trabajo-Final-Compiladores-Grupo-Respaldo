from __future__ import annotations

import math

from .nodes import EvaluationError, IntegralNode
from .tokens import CompilerError


def semantic_check(integral: IntegralNode) -> list[CompilerError]:
    errors: list[CompilerError] = []
    if not math.isfinite(integral.lower) or not math.isfinite(integral.upper):
        errors.append(CompilerError("semantico", "Los limites deben ser finitos."))
    if integral.lower == integral.upper:
        errors.append(CompilerError("semantico", "Los limites no deben ser iguales."))
    if integral.lower > integral.upper:
        errors.append(
            CompilerError(
                "semantico",
                "El limite inferior es mayor que el superior; se evaluara con signo negativo si se corrige.",
            )
        )

    sample_points = [
        integral.lower,
        (2 * integral.lower + integral.upper) / 3,
        (integral.lower + integral.upper) / 2,
        (integral.lower + 2 * integral.upper) / 3,
        integral.upper,
    ]
    for point in sample_points:
        try:
            value = integral.expression.evaluate(point)
            if not math.isfinite(value):
                raise EvaluationError("Valor no finito.")
        except EvaluationError as exc:
            errors.append(
                CompilerError(
                    "semantico",
                    f"La expresion no es evaluable en x={point:.6g}: {exc}",
                )
            )
            break
        except ValueError as exc:
            errors.append(
                CompilerError(
                    "semantico",
                    f"La expresion sale del dominio real en x={point:.6g}: {exc}",
                )
            )
            break
    return errors


def evaluate_integral(integral: IntegralNode) -> dict:
    a = integral.lower
    b = integral.upper
    sign = 1.0
    if a > b:
        a, b = b, a
        sign = -1.0

    if abs(a - b) < 1e-15:
        return {"value": 0.0, "method": "Intervalo nulo", "subintervals": 0}

    subintervals = 1200
    if subintervals % 2 == 1:
        subintervals += 1
    h = (b - a) / subintervals
    total = integral.expression.evaluate(a) + integral.expression.evaluate(b)

    for i in range(1, subintervals):
        x = a + i * h
        coefficient = 4 if i % 2 else 2
        total += coefficient * integral.expression.evaluate(x)

    result = sign * total * h / 3
    if not math.isfinite(result):
        raise EvaluationError("El resultado numerico no es finito.")
    return {
        "value": result,
        "method": "Regla compuesta de Simpson",
        "subintervals": subintervals,
    }
