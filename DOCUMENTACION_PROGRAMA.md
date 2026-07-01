# Documentacion completa del programa

## 1. Nombre del proyecto

**Compilador de Integrales Definidas**

Proyecto final del curso de Compiladores. El sistema recibe una entrada con una integral definida, valida su estructura como un lenguaje formal, reconoce lexemas y tokens, genera expresiones regulares, automatas, tabla de transicion, gramatica libre de contexto, arbol sintactico grafico, traduccion a Python y resultado matematico.

## 2. Objetivo del programa

El objetivo principal es demostrar el funcionamiento de un compilador aplicado a un lenguaje especifico: integrales definidas.

El flujo del programa es:

1. Recibir una entrada escrita por el usuario.
2. Realizar analisis lexico.
3. Realizar analisis sintactico.
4. Realizar analisis semantico.
5. Construir una representacion estructural de la integral.
6. Generar el arbol sintactico.
7. Generar AFN y AFD asociados a la entrada.
8. Mostrar tabla de transicion.
9. Traducir la integral a codigo Python con matplotlib.
10. Calcular el resultado exacto cuando esta soportado.
11. Calcular el resultado decimal mediante evaluacion numerica.
12. Exportar un reporte completo en PDF.

## 3. Lenguaje aceptado por el compilador

La sintaxis general es:

```txt
INT[limite_inferior,limite_superior](expresion) dx
```

Ejemplos validos:

```txt
INT[0,1](x^2 + sin(x)) dx
INT[0,pi](sin(x)^2 + cos(x)^2) dx
INT[1,e](ln(x)) dx
INT[0,4](sqrt(x) + x/2) dx
INT[-1,1](x^3 + x^2) dx
```

## 4. Funciones y simbolos permitidos

### Funciones

- `sin`
- `cos`
- `tan`
- `ln`
- `sqrt`
- `exp`

### Constantes

- `pi`
- `e`

### Variable permitida

- `x`

### Operadores

- Suma: `+`
- Resta: `-`
- Multiplicacion: `*`
- Division: `/`
- Potencia: `^`
- Parentesis: `(` y `)`

Tambien se permite multiplicacion implicita, por ejemplo:

```txt
2x
3(x+1)
```

## 5. Estructura de carpetas

```txt
.
|-- app.py
|-- Procfile
|-- README.md
|-- DOCUMENTACION_PROGRAMA.md
|-- requirements.txt
|-- docs/
|   `-- gramatica.md
|-- examples/
|   `-- entradas.txt
|-- src/
|   `-- integral_compiler/
|       |-- __init__.py
|       |-- academic.py
|       |-- analyzer.py
|       |-- evaluator.py
|       |-- lexer.py
|       |-- nodes.py
|       |-- parser.py
|       |-- symbolic.py
|       `-- tokens.py
|-- static/
|   |-- app.js
|   |-- styles.css
|   `-- vendor/
|       |-- full.render.js
|       `-- viz.js
|-- templates/
|   `-- index.html
`-- tests/
    `-- test_compiler.py
```

## 6. Tecnologias usadas

- **Python**: lenguaje principal del backend.
- **Flask**: framework web para servir la pagina y exponer el endpoint de analisis.
- **HTML**: estructura de la interfaz.
- **CSS**: estilos, tema claro/oscuro y estilos de impresion PDF.
- **JavaScript**: interaccion de la pagina, renderizado de tablas, diagramas y reporte PDF.
- **Viz.js / Graphviz**: renderizado local de arboles y automatas en SVG.
- **unittest**: pruebas automatizadas del compilador.
- **Railway**: despliegue web.
- **GitHub**: control de versiones y repositorio remoto.

## 7. Instalacion local

Crear y activar un entorno virtual:

```bash
python -m venv .venv
.venv\Scripts\activate
```

Instalar dependencias:

```bash
pip install -r requirements.txt
```

Ejecutar el servidor:

```bash
python app.py
```

Abrir en el navegador:

```txt
http://127.0.0.1:5000/
```

## 8. Endpoint principal

El backend expone el endpoint:

```txt
POST /api/analyze
```

Entrada JSON:

```json
{
  "source": "INT[0,1](x^2 + sin(x)) dx"
}
```

El endpoint devuelve:

- tokens reconocidos
- fases del compilador
- errores lexicos, sintacticos o semanticos
- AST
- resultado decimal
- resultado exacto si esta soportado
- reporte academico
- automatas
- gramatica
- codigo Python generado

## 9. Analisis lexico

El analizador lexico recorre la cadena de entrada y separa los lexemas.

Cada lexema se clasifica por:

- tipo de token
- categoria
- linea
- columna

Ejemplo:

```txt
INT[0,1](x^2 + sin(x)) dx
```

Algunos lexemas reconocidos:

| Lexema | Token | Categoria |
|---|---|---|
| `INT` | `RESERVED` | palabra reservada |
| `[` | `LBRACKET` | simbolo |
| `0` | `NUMBER` | numero |
| `,` | `COMMA` | separador |
| `x` | `VARIABLE` | identificador |
| `^` | `POWER` | operador |
| `sin` | `FUNCTION` | funcion |
| `dx` | `DIFFERENTIAL` | diferencial |

## 10. Tokens principales

| Token | Descripcion | Ejemplo |
|---|---|---|
| `RESERVED` | Inicio de una integral | `INT` |
| `NUMBER` | Numero entero o decimal | `3`, `0.5` |
| `VARIABLE` | Variable de integracion | `x` |
| `CONSTANT` | Constante matematica | `pi`, `e` |
| `FUNCTION` | Funcion matematica permitida | `sin`, `sqrt` |
| `PLUS` | Operador suma | `+` |
| `MINUS` | Operador resta | `-` |
| `STAR` | Operador multiplicacion | `*` |
| `SLASH` | Operador division | `/` |
| `POWER` | Operador potencia | `^` |
| `LPAREN` | Parentesis izquierdo | `(` |
| `RPAREN` | Parentesis derecho | `)` |
| `LBRACKET` | Corchete izquierdo | `[` |
| `RBRACKET` | Corchete derecho | `]` |
| `COMMA` | Separador de limites | `,` |
| `DIFFERENTIAL` | Diferencial de integracion | `dx` |

## 11. Expresiones regulares

El programa muestra una seccion de expresiones regulares aplicadas.

Ejemplos:

| Token | Regex | Que reconoce |
|---|---|---|
| `RESERVED` | `INT` | palabra reservada de integral |
| `NUMBER` | `[0-9]+(\.[0-9]+)?` | numeros enteros o decimales |
| `VARIABLE` | `x` | variable de integracion |
| `CONSTANT` | `pi|e` | constantes permitidas |
| `FUNCTION` | `sin|cos|tan|ln|sqrt|exp` | funciones matematicas |
| `DIFFERENTIAL` | `dx` | diferencial de integracion |

## 12. Analisis sintactico

El parser valida que los tokens sigan la estructura definida por la gramatica del lenguaje.

Estructura esperada:

```txt
INTEGRAL -> INT [ LIMITE_INF , LIMITE_SUP ] ( EXPRESION ) dx
```

Tambien valida:

- parentesis balanceados
- corchetes balanceados
- ubicacion correcta de limites
- expresion interna valida
- operador con operandos correctos
- funciones con argumento

## 13. Analisis semantico

El analisis semantico revisa reglas de significado, por ejemplo:

- la variable permitida debe ser `x`
- el diferencial debe ser `dx`
- las funciones deben pertenecer a la lista permitida
- la expresion debe poder evaluarse
- la integral debe tener limites validos

Si la expresion no puede evaluarse por dominio, se muestra un error semantico.

## 14. Arbol sintactico

El programa genera un arbol sintactico grafico a partir del AST.

El arbol representa:

- la integral completa
- limites
- expresion
- operadores
- funciones
- numeros
- constantes
- variable
- diferencial

Cada vez que se analiza una integral distinta, el arbol se regenera con la estructura de esa entrada.

## 15. AFN y AFD

El programa genera:

- **AFN**: automata finito no determinista asociado a la estructura de la integral.
- **AFD**: automata finito determinista equivalente para la secuencia validada.

Los diagramas se muestran graficamente usando Graphviz/Viz.js.

El usuario puede:

- alternar entre AFN y AFD
- acercar el diagrama
- alejar el diagrama
- restablecer zoom
- descargar el SVG del automata

## 16. Tabla de transicion

La tabla de transicion muestra:

- estado actual
- entrada esperada
- siguiente estado
- estado de aceptacion

Esta tabla acompana al AFD generado.

## 17. Gramatica Libre de Contexto

El programa muestra una GLC adaptada al lenguaje de integrales.

Forma general:

```txt
G = (V, T, P, S)
```

Donde:

- `V`: variables o no terminales.
- `T`: terminales del lenguaje.
- `P`: producciones.
- `S`: simbolo inicial.

Categorias que aplican al proyecto:

- numeros
- identificadores
- expresiones aritmeticas
- funciones
- parentesis balanceados
- limites de integral

Categorias que no aplican directamente:

- `IF`
- `IF-ELSE`
- `WHILE`
- `FOR`
- expresiones logicas
- comentarios
- funciones de usuario
- parametros

## 18. Traduccion a Python

El compilador traduce la integral a codigo Python ejecutable.

La traduccion permite:

- evaluar numericamente la integral
- graficar la funcion con matplotlib
- reutilizar la expresion en otro entorno Python

La seccion reemplaza al antiguo JSON porque tiene una utilidad practica para el usuario.

## 19. Resultado matematico

El programa muestra:

- representacion visual de la integral
- resultado exacto, si esta soportado por las reglas simbolicas
- resultado decimal
- metodo usado

Cuando no hay una forma exacta soportada, el programa usa evaluacion numerica con Simpson.

## 20. Reporte PDF

El boton **Descargar PDF** genera un reporte ordenado del analisis.

Incluye:

1. Entrada y proposito.
2. Resultado.
3. Lexemas identificados.
4. Tokens agrupados.
5. Expresiones regulares.
6. Errores por fase.
7. Arbol sintactico grafico.
8. AFN.
9. AFD.
10. Tabla de transicion.
11. Gramatica Libre de Contexto.
12. Traduccion a Python.

El navegador abre el dialogo de impresion para guardar el reporte como PDF.

## 21. Tema claro y oscuro

La interfaz permite alternar entre:

- tema claro
- tema oscuro

La seleccion se guarda en el navegador con `localStorage`.

## 22. Ejemplos incorporados

El boton **Ejemplo** abre una tabla con ejercicios de tres niveles:

- basico
- intermedio
- avanzado

Cada nivel contiene integrales para probar diferentes caracteristicas del compilador.

## 23. Pruebas automatizadas

Ejecutar pruebas:

```bash
python -m unittest discover tests
```

Las pruebas verifican:

- reconocimiento de entradas validas
- integrales con funciones
- resultados exactos soportados
- errores lexicos o sintacticos
- evaluacion numerica

## 24. Despliegue

El proyecto esta preparado para Railway.

Archivos importantes para despliegue:

- `requirements.txt`
- `Procfile`
- `app.py`

El `Procfile` indica el comando de arranque para produccion:

```txt
web: gunicorn app:app
```

## 25. Repositorio y control de versiones

El proyecto se sube a GitHub con Git.

Comandos basicos:

```bash
git add .
git commit -m "Actualizar compilador de integrales"
git push origin main
```

Railway puede desplegar automaticamente cuando detecta cambios en GitHub.

## 26. Resumen final

Este programa funciona como un compilador educativo para integrales definidas. Integra los temas principales del curso:

- lexemas
- tokens
- expresiones regulares
- AFN
- AFD
- tablas de transicion
- gramatica libre de contexto
- arbol sintactico
- traduccion de codigo
- validacion semantica
- evaluacion matematica
- despliegue web

El sistema no solo valida una entrada, sino que tambien explica visualmente y academicamente el proceso interno del compilador.
