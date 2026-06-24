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

## Salidas academicas generadas

Para cada integral analizada, el compilador muestra:

- Lexemas con categoria, token, linea y columna.
- Tokens agrupados por tipo.
- Expresiones regulares aplicadas.
- AFN generado desde la estructura de la integral.
- AFD equivalente para la secuencia reconocida.
- Tabla de transicion del AFD.
- Gramatica libre de contexto `G = (V, T, P, S)`.
- Arbol sintactico grafico.
- Traduccion a codigo Python con matplotlib.
