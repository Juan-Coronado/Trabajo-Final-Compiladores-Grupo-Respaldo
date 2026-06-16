from __future__ import annotations

import math

from .nodes import (
    BinaryNode,
    ConstantNode,
    FunctionNode,
    IntegralNode,
    Node,
    NumberNode,
    UnaryNode,
    VariableNode,
)
from .tokens import CompilerError, Token


class Parser:
    def __init__(self, tokens: list[Token]):
        self.tokens = tokens
        self.current = 0
        self.errors: list[CompilerError] = []

    def parse(self) -> tuple[IntegralNode | None, list[CompilerError]]:
        integral = self.parse_integral()
        if integral and not self.is_at_end():
            token = self.peek()
            self.error(token, f"Token inesperado '{token.lexeme}' despues de la integral.")
        return integral if not self.errors else None, self.errors

    def parse_integral(self) -> IntegralNode | None:
        if not self.match("RESERVED"):
            token = self.peek_or_last()
            self.error(token, "La integral debe iniciar con INT, INTEGRAL o ∫.")
            return None

        if not self.consume("LBRACKET", "Falta '[' para abrir los limites."):
            return None
        lower = self.parse_limit("inferior")
        if lower is None:
            return None
        if not self.consume("COMMA", "Falta ',' entre limite inferior y superior."):
            return None
        upper = self.parse_limit("superior")
        if upper is None:
            return None
        if not self.consume("RBRACKET", "Falta ']' para cerrar los limites."):
            return None

        if not self.consume("LPAREN", "Falta '(' antes de la expresion integrando."):
            return None
        expression = self.parse_expression()
        if expression is None:
            return None
        if not self.consume("RPAREN", "Falta ')' despues de la expresion integrando."):
            return None

        differential = self.consume("DIFFERENTIAL", "Falta diferencial dx al final.")
        if not differential:
            return None

        return IntegralNode(
            lower=lower[0],
            upper=upper[0],
            lower_raw=lower[1],
            upper_raw=upper[1],
            expression=expression,
            differential=differential.lexeme,
        )

    def parse_limit(self, label: str) -> tuple[float, str] | None:
        sign = ""
        if self.match("MINUS"):
            sign = "-"
        elif self.match("PLUS"):
            sign = "+"

        token = self.peek()
        if self.match("NUMBER"):
            raw = sign + token.lexeme
            return float(raw), raw
        if self.match("CONSTANT"):
            raw = sign + token.lexeme
            value = math.pi if token.lexeme.lower() in {"pi", "π"} else math.e
            return (-value if sign == "-" else value), raw

        self.error(token, f"El limite {label} debe ser numerico o una constante pi/e.")
        return None

    def parse_expression(self) -> Node | None:
        node = self.parse_term()
        while self.match("PLUS", "MINUS"):
            operator = self.previous().lexeme
            right = self.parse_term()
            if right is None or node is None:
                return None
            node = BinaryNode(operator, node, right)
        return node

    def parse_term(self) -> Node | None:
        node = self.parse_power()
        while True:
            if self.match("TIMES", "DIVIDE"):
                operator = "*" if self.previous().type == "TIMES" else "/"
                right = self.parse_power()
                if right is None or node is None:
                    return None
                node = BinaryNode(operator, node, right)
                continue

            if self.starts_factor(self.peek()):
                right = self.parse_power()
                if right is None or node is None:
                    return None
                node = BinaryNode("*", node, right)
                continue
            break
        return node

    def parse_power(self) -> Node | None:
        node = self.parse_unary()
        if self.match("POWER"):
            right = self.parse_power()
            if right is None or node is None:
                return None
            return BinaryNode("^", node, right)
        return node

    def parse_unary(self) -> Node | None:
        if self.match("PLUS", "MINUS"):
            operator = self.previous().lexeme
            operand = self.parse_unary()
            if operand is None:
                return None
            return UnaryNode(operator, operand)
        return self.parse_primary()

    def parse_primary(self) -> Node | None:
        if self.match("NUMBER"):
            token = self.previous()
            return NumberNode(float(token.lexeme), token.lexeme)
        if self.match("CONSTANT"):
            return ConstantNode(self.previous().lexeme)
        if self.match("VARIABLE"):
            return VariableNode()
        if self.match("FUNCTION"):
            function = self.previous()
            if not self.consume("LPAREN", f"La funcion {function.lexeme} requiere '('."):
                return None
            argument = self.parse_expression()
            if argument is None:
                return None
            if not self.consume("RPAREN", f"La funcion {function.lexeme} requiere ')'."):
                return None
            return FunctionNode(function.lexeme, argument)
        if self.match("LPAREN"):
            expression = self.parse_expression()
            if expression is None:
                return None
            if not self.consume("RPAREN", "Falta ')' para cerrar la subexpresion."):
                return None
            return expression

        token = self.peek()
        self.error(token, f"Se esperaba numero, variable, funcion o '(', pero se encontro '{token.lexeme}'.")
        return None

    def starts_factor(self, token: Token | None) -> bool:
        return token is not None and token.type in {
            "NUMBER",
            "VARIABLE",
            "CONSTANT",
            "FUNCTION",
            "LPAREN",
        }

    def match(self, *types: str) -> bool:
        if self.check(*types):
            self.advance()
            return True
        return False

    def consume(self, token_type: str, message: str) -> Token | None:
        if self.check(token_type):
            return self.advance()
        self.error(self.peek_or_last(), message)
        return None

    def check(self, *types: str) -> bool:
        if self.is_at_end():
            return False
        return self.peek().type in types

    def advance(self) -> Token:
        if not self.is_at_end():
            self.current += 1
        return self.previous()

    def is_at_end(self) -> bool:
        return self.current >= len(self.tokens)

    def peek(self) -> Token:
        if self.is_at_end():
            return self.peek_or_last()
        return self.tokens[self.current]

    def previous(self) -> Token:
        return self.tokens[self.current - 1]

    def peek_or_last(self) -> Token:
        if self.tokens:
            return self.tokens[min(self.current, len(self.tokens) - 1)]
        return Token("EOF", "", 1, 1)

    def error(self, token: Token, message: str) -> None:
        self.errors.append(CompilerError("sintactico", message, token.line, token.column))
