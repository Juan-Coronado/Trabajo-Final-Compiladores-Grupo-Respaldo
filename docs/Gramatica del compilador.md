# Gramatica del compilador de integrales definidas

El lenguaje acepta integrales definidas de una variable con diferencial `dx`.

## Forma general

```text
INT[limite_inferior, limite_superior](expresion) dx
```

Tambien se reconoce `INTEGRAL` o el simbolo `∫` como palabra reservada inicial.

## Tokens principales

| Tipo | Ejemplos |
| --- | --- |
| RESERVED | `INT`, `INTEGRAL`, `∫` |
| LBRACKET / RBRACKET | `[`, `]` |
| LPAREN / RPAREN | `(`, `)` |
| NUMBER | `0`, `1`, `3.14` |
| CONSTANT | `pi`, `e` |
| VARIABLE | `x` |
| FUNCTION | `sin`, `cos`, `tan`, `ln`, `sqrt`, `exp` |
| PLUS / MINUS | `+`, `-` |
| TIMES / DIVIDE | `*`, `/` |
| POWER | `^` |
| DIFFERENTIAL | `dx` |

## Reglas de produccion

```text
<INTEGRAL> -> RESERVED "[" <LIMIT> "," <LIMIT> "]" "(" <EXPR> ")" "dx"
<LIMIT>    -> ["+" | "-"] (NUMBER | CONSTANT)
<EXPR>     -> <EXPR> "+" <TERM> | <EXPR> "-" <TERM> | <TERM>
<TERM>     -> <TERM> "*" <POWER> | <TERM> "/" <POWER> | <TERM> <POWER> | <POWER>
<POWER>    -> <UNARY> "^" <POWER> | <UNARY>
<UNARY>    -> "+" <UNARY> | "-" <UNARY> | <PRIMARY>
<PRIMARY>  -> NUMBER | CONSTANT | "x" | FUNCTION "(" <EXPR> ")" | "(" <EXPR> ")"
```

La regla `<TERM> <POWER>` permite multiplicacion implicita, por ejemplo `2x` o
`3(x+1)`.
