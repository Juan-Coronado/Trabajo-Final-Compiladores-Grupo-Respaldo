from dataclasses import dataclass


@dataclass(frozen=True)
class Token:
    type: str
    lexeme: str
    line: int
    column: int


@dataclass(frozen=True)
class CompilerError:
    phase: str
    message: str
    line: int | None = None
    column: int | None = None

    def to_dict(self) -> dict:
        return {
            "phase": self.phase,
            "message": self.message,
            "line": self.line,
            "column": self.column,
        }
