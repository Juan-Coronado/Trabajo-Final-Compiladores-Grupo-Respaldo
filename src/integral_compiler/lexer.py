from __future__ import annotations

from .tokens import CompilerError, Token


FUNCTIONS = {"sin", "cos", "tan", "ln", "sqrt", "exp"}
CONSTANTS = {"pi", "e"}
RESERVED_WORDS = {"INT", "INTEGRAL"}

SINGLE_CHAR_TOKENS = {
    "[": "LBRACKET",
    "]": "RBRACKET",
    "(": "LPAREN",
    ")": "RPAREN",
    ",": "COMMA",
    "+": "PLUS",
    "-": "MINUS",
    "*": "TIMES",
    "×": "TIMES",
    "/": "DIVIDE",
    "^": "POWER",
}


def tokenize(source: str) -> tuple[list[Token], list[CompilerError]]:
    tokens: list[Token] = []
    errors: list[CompilerError] = []
    i = 0
    line = 1
    column = 1

    def advance() -> str:
        nonlocal i, line, column
        char = source[i]
        i += 1
        if char == "\n":
            line += 1
            column = 1
        else:
            column += 1
        return char

    while i < len(source):
        char = source[i]

        if char in " \t\r":
            advance()
            continue

        if char == "\n":
            advance()
            continue

        start_line = line
        start_column = column

        if char.isdigit() or char == ".":
            lexeme = ""
            dot_count = 0
            while i < len(source) and (source[i].isdigit() or source[i] == "."):
                if source[i] == ".":
                    dot_count += 1
                lexeme += advance()
            if lexeme == "." or dot_count > 1:
                errors.append(
                    CompilerError(
                        "lexico",
                        f"Numero invalido '{lexeme}'.",
                        start_line,
                        start_column,
                    )
                )
            else:
                tokens.append(Token("NUMBER", lexeme, start_line, start_column))
            continue

        if char.isalpha() or char == "π":
            lexeme = ""
            while i < len(source) and (source[i].isalpha() or source[i] == "π"):
                lexeme += advance()
            lower = lexeme.lower()
            upper = lexeme.upper()

            if upper in RESERVED_WORDS:
                tokens.append(Token("RESERVED", lexeme, start_line, start_column))
            elif lower == "dx":
                tokens.append(Token("DIFFERENTIAL", lexeme, start_line, start_column))
            elif lower in FUNCTIONS:
                tokens.append(Token("FUNCTION", lexeme, start_line, start_column))
            elif lower in CONSTANTS or lexeme == "π":
                tokens.append(Token("CONSTANT", lexeme, start_line, start_column))
            elif lower == "x":
                tokens.append(Token("VARIABLE", lexeme, start_line, start_column))
            else:
                tokens.append(Token("IDENTIFIER", lexeme, start_line, start_column))
                errors.append(
                    CompilerError(
                        "lexico",
                        f"Identificador no reconocido '{lexeme}'. Use x, dx, INT o funciones permitidas.",
                        start_line,
                        start_column,
                    )
                )
            continue

        if char == "∫":
            advance()
            tokens.append(Token("RESERVED", char, start_line, start_column))
            continue

        if char in SINGLE_CHAR_TOKENS:
            advance()
            tokens.append(Token(SINGLE_CHAR_TOKENS[char], char, start_line, start_column))
            continue

        advance()
        errors.append(
            CompilerError(
                "lexico",
                f"Simbolo no reconocido '{char}'.",
                start_line,
                start_column,
            )
        )
        tokens.append(Token("UNKNOWN", char, start_line, start_column))

    return tokens, errors
