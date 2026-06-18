from __future__ import annotations

from dataclasses import dataclass
from fractions import Fraction
import math

from .nodes import BinaryNode, ConstantNode, FunctionNode, IntegralNode, Node, NumberNode, UnaryNode, VariableNode


@dataclass(frozen=True)
class ExactIntegral:
    expression: str
    supported: bool


def exact_integral(integral: IntegralNode) -> ExactIntegral:
    terms = definite_terms(integral.expression, bound_label(integral.lower_raw), bound_label(integral.upper_raw))
    if terms is None:
        return ExactIntegral("Metodo numerico (Simpson)", False)
    return ExactIntegral(join_terms(terms), True)


def definite_terms(node: Node, lower: str, upper: str) -> list[tuple[int, str]] | None:
    if isinstance(node, BinaryNode):
        if node.operator == "+":
            left = definite_terms(node.left, lower, upper)
            right = definite_terms(node.right, lower, upper)
            if left is None or right is None:
                return None
            return left + right
        if node.operator == "-":
            left = definite_terms(node.left, lower, upper)
            right = definite_terms(node.right, lower, upper)
            if left is None or right is None:
                return None
            return left + negate_terms(right)
        if node.operator == "*":
            left_constant = constant_text(node.left)
            right_constant = constant_text(node.right)
            if left_constant is not None:
                terms = definite_terms(node.right, lower, upper)
                return scale_terms(terms, left_constant) if terms is not None else None
            if right_constant is not None:
                terms = definite_terms(node.left, lower, upper)
                return scale_terms(terms, right_constant) if terms is not None else None
        if node.operator == "/":
            divisor = constant_text(node.right)
            if divisor is not None:
                terms = definite_terms(node.left, lower, upper)
                return divide_terms(terms, divisor) if terms is not None else None
        if node.operator == "^" and isinstance(node.left, VariableNode):
            exponent = integer_number(node.right)
            if exponent is not None and exponent >= 0:
                return power_terms(exponent, lower, upper)
        return None

    if isinstance(node, UnaryNode):
        terms = definite_terms(node.operand, lower, upper)
        if terms is None:
            return None
        return terms if node.operator == "+" else negate_terms(terms)

    if isinstance(node, VariableNode):
        return power_terms(1, lower, upper)

    if isinstance(node, NumberNode):
        return constant_definite_terms(node.raw, lower, upper)

    if isinstance(node, ConstantNode):
        return constant_definite_terms(bound_label(node.name), lower, upper)

    if isinstance(node, FunctionNode) and is_plain_x(node.argument):
        name = node.name.lower()
        if name == "sin":
            return clean_terms([(-1, function_at("cos", upper)), (1, function_at("cos", lower))])
        if name == "cos":
            return clean_terms([(1, function_at("sin", upper)), (-1, function_at("sin", lower))])
        if name == "exp":
            return clean_terms([(1, function_at("exp", upper)), (-1, function_at("exp", lower))])
    return None


def power_terms(exponent: int, lower: str, upper: str) -> list[tuple[int, str]]:
    denominator = exponent + 1
    upper_power = power_at(upper, denominator)
    lower_power = power_at(lower, denominator)
    return clean_terms(
        [
            (1, divide_text(upper_power, str(denominator))),
            (-1, divide_text(lower_power, str(denominator))),
        ]
    )


def constant_definite_terms(value: str, lower: str, upper: str) -> list[tuple[int, str]]:
    if is_zero(value):
        return []
    if is_zero(lower):
        interval = upper
    else:
        interval = f"({upper} - {lower})"
    return [(1, multiply_text(value, interval))]


def constant_text(node: Node) -> str | None:
    if isinstance(node, NumberNode):
        return node.raw
    if isinstance(node, ConstantNode):
        return bound_label(node.name)
    if isinstance(node, UnaryNode):
        text = constant_text(node.operand)
        if text is None:
            return None
        return text if node.operator == "+" else f"-{text}"
    return None


def integer_number(node: Node) -> int | None:
    if not isinstance(node, NumberNode):
        return None
    try:
        value = float(node.raw)
    except ValueError:
        return None
    if value.is_integer():
        return int(value)
    return None


def is_plain_x(node: Node) -> bool:
    return isinstance(node, VariableNode)


def negate_terms(terms: list[tuple[int, str]]) -> list[tuple[int, str]]:
    return [(-sign, text) for sign, text in terms]


def scale_terms(terms: list[tuple[int, str]], factor: str) -> list[tuple[int, str]]:
    if is_zero(factor):
        return []
    if factor.startswith("-"):
        return [(-sign, multiply_text(factor[1:], text)) for sign, text in terms]
    return [(sign, multiply_text(factor, text)) for sign, text in terms]


def divide_terms(terms: list[tuple[int, str]], divisor: str) -> list[tuple[int, str]]:
    if is_one(divisor):
        return terms
    return [(sign, divide_text(text, divisor)) for sign, text in terms]


def clean_terms(terms: list[tuple[int, str]]) -> list[tuple[int, str]]:
    return [(sign, text) for sign, text in terms if text and not is_zero(text)]


def multiply_text(left: str, right: str) -> str:
    if is_zero(left) or is_zero(right):
        return "0"
    if is_one(left):
        return right
    if is_one(right):
        return left
    return f"{left}*{right}"


def divide_text(value: str, denominator: str) -> str:
    if is_zero(value):
        return "0"
    if is_one(denominator):
        return value
    fraction = fraction_text(value, denominator)
    if fraction:
        return fraction
    return f"{value}/{denominator}"


def fraction_text(value: str, denominator: str) -> str | None:
    try:
        number = Fraction(value)
        den = Fraction(denominator)
    except ValueError:
        return None
    fraction = number / den
    if fraction.denominator == 1:
        return str(fraction.numerator)
    return f"{fraction.numerator}/{fraction.denominator}"


def power_at(value: str, exponent: int) -> str:
    if is_zero(value):
        return "0"
    if is_one(value):
        return "1"
    if exponent == 1:
        return value
    return f"{value}^{exponent}"


def function_at(name: str, value: str) -> str:
    if name == "cos" and is_zero(value):
        return "1"
    if name == "sin" and is_zero(value):
        return "0"
    if name == "exp" and is_zero(value):
        return "1"
    return f"{name}({value})"


def bound_label(value: str) -> str:
    lowered = value.lower()
    if lowered in {"pi", "π"}:
        return "π"
    if lowered == "e":
        return "e"
    return value


def is_zero(value: str) -> bool:
    try:
        return math.isclose(float(value), 0.0, abs_tol=1e-12)
    except ValueError:
        return value == "0"


def is_one(value: str) -> bool:
    try:
        return math.isclose(float(value), 1.0, abs_tol=1e-12)
    except ValueError:
        return value == "1"


def join_terms(terms: list[tuple[int, str]]) -> str:
    terms = clean_terms(terms)
    if not terms:
        return "0"

    pieces: list[str] = []
    for index, (sign, text) in enumerate(terms):
        if index == 0:
            pieces.append(text if sign > 0 else f"-{text}")
        else:
            pieces.append(f"+ {text}" if sign > 0 else f"- {text}")
    return " ".join(pieces)
