from __future__ import annotations

from dataclasses import dataclass
import math


class EvaluationError(ValueError):
    pass


class Node:
    def evaluate(self, x: float) -> float:
        raise NotImplementedError

    def to_dict(self) -> dict:
        raise NotImplementedError

    def to_infix(self) -> str:
        raise NotImplementedError

    def contains_variable(self) -> bool:
        return False


@dataclass
class NumberNode(Node):
    value: float
    raw: str

    def evaluate(self, x: float) -> float:
        return self.value

    def to_dict(self) -> dict:
        return {"type": "Number", "value": self.raw}

    def to_infix(self) -> str:
        return self.raw


@dataclass
class ConstantNode(Node):
    name: str

    def evaluate(self, x: float) -> float:
        if self.name.lower() in {"pi", "π"}:
            return math.pi
        if self.name.lower() == "e":
            return math.e
        raise EvaluationError(f"Constante no soportada: {self.name}")

    def to_dict(self) -> dict:
        return {"type": "Constant", "name": self.name}

    def to_infix(self) -> str:
        return self.name


class VariableNode(Node):
    def evaluate(self, x: float) -> float:
        return x

    def to_dict(self) -> dict:
        return {"type": "Variable", "name": "x"}

    def to_infix(self) -> str:
        return "x"

    def contains_variable(self) -> bool:
        return True


@dataclass
class UnaryNode(Node):
    operator: str
    operand: Node

    def evaluate(self, x: float) -> float:
        value = self.operand.evaluate(x)
        return value if self.operator == "+" else -value

    def to_dict(self) -> dict:
        return {
            "type": "UnaryExpression",
            "operator": self.operator,
            "operand": self.operand.to_dict(),
        }

    def to_infix(self) -> str:
        return f"({self.operator}{self.operand.to_infix()})"

    def contains_variable(self) -> bool:
        return self.operand.contains_variable()


@dataclass
class BinaryNode(Node):
    operator: str
    left: Node
    right: Node

    def evaluate(self, x: float) -> float:
        left = self.left.evaluate(x)
        right = self.right.evaluate(x)
        if self.operator == "+":
            return left + right
        if self.operator == "-":
            return left - right
        if self.operator == "*":
            return left * right
        if self.operator == "/":
            if abs(right) < 1e-12:
                raise EvaluationError("Division entre cero durante la evaluacion.")
            return left / right
        if self.operator == "^":
            try:
                return left**right
            except (OverflowError, ValueError) as exc:
                raise EvaluationError("Potencia fuera del dominio real.") from exc
        raise EvaluationError(f"Operador no soportado: {self.operator}")

    def to_dict(self) -> dict:
        return {
            "type": "BinaryExpression",
            "operator": self.operator,
            "left": self.left.to_dict(),
            "right": self.right.to_dict(),
        }

    def to_infix(self) -> str:
        return f"({self.left.to_infix()} {self.operator} {self.right.to_infix()})"

    def contains_variable(self) -> bool:
        return self.left.contains_variable() or self.right.contains_variable()


@dataclass
class FunctionNode(Node):
    name: str
    argument: Node

    def evaluate(self, x: float) -> float:
        value = self.argument.evaluate(x)
        name = self.name.lower()
        try:
            if name == "sin":
                return math.sin(value)
            if name == "cos":
                return math.cos(value)
            if name == "tan":
                return math.tan(value)
            if name == "ln":
                if value <= 0:
                    raise EvaluationError("ln requiere argumento mayor que cero.")
                return math.log(value)
            if name == "sqrt":
                if value < 0:
                    raise EvaluationError("sqrt requiere argumento no negativo.")
                return math.sqrt(value)
            if name == "exp":
                return math.exp(value)
        except OverflowError as exc:
            raise EvaluationError("Resultado fuera del rango numerico.") from exc
        raise EvaluationError(f"Funcion no soportada: {self.name}")

    def to_dict(self) -> dict:
        return {
            "type": "FunctionCall",
            "name": self.name,
            "argument": self.argument.to_dict(),
        }

    def to_infix(self) -> str:
        return f"{self.name}({self.argument.to_infix()})"

    def contains_variable(self) -> bool:
        return self.argument.contains_variable()


@dataclass
class IntegralNode:
    lower: float
    upper: float
    lower_raw: str
    upper_raw: str
    expression: Node
    differential: str = "dx"

    def to_dict(self) -> dict:
        return {
            "type": "DefiniteIntegral",
            "variable": "x",
            "lower_limit": self.lower_raw,
            "upper_limit": self.upper_raw,
            "differential": self.differential,
            "expression": self.expression.to_dict(),
        }

    def normalized(self) -> str:
        return f"INT[{self.lower_raw},{self.upper_raw}]({self.expression.to_infix()}) {self.differential}"

    def intermediate_code(self) -> dict:
        return {
            "operation": "DEFINITE_INTEGRAL",
            "variable": "x",
            "limits": {"lower": self.lower_raw, "upper": self.upper_raw},
            "expression": self.expression.to_infix(),
            "target": f"integrate({self.expression.to_infix()}, x, {self.lower_raw}, {self.upper_raw})",
        }
