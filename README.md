# Trabajo Final Compiladores - Grupo Respaldo

Repositorio para el trabajo final del curso Compiladores.

## Tema

Compilador web para el analisis y evaluacion de integrales definidas.

El sistema no funciona solo como calculadora. Primero procesa la entrada como un
lenguaje formal y muestra las fases principales de compilacion:

- Analisis lexico con tokens, lexemas, linea y columna.
- Analisis sintactico mediante una gramatica libre de contexto.
- Analisis semantico para validar limites, diferencial y dominio de la expresion.
- Generacion de AST grafico.
- Generacion de AFN, AFD y tabla de transicion.
- Traduccion a codigo Python con matplotlib.
- Evaluacion numerica de la integral definida.
- Resultados exactos para reglas simbolicas basicas.

## Formato de entrada

```text
INT[0,1](x^2 + sin(x)) dx
```

Tambien se reconocen `INTEGRAL` y `∫` como palabra reservada inicial.

## Funciones soportadas

- `sin(x)`
- `cos(x)`
- `tan(x)`
- `ln(x)`
- `sqrt(x)`
- `exp(x)`

Constantes soportadas: `pi`, `e`.

## Salidas academicas

- Lexemas y tokens agrupados por tipo.
- Expresiones regulares aplicadas a los tokens reconocidos.
- AFN y AFD generados para la integral ingresada.
- Tabla de transicion del AFD.
- Gramatica libre de contexto adaptada al lenguaje de integrales.
- Arbol sintactico grafico.
- Codigo Python ejecutable con grafica de la integral usando matplotlib.

Los diagramas se pueden acercar, alejar y descargar como SVG desde la interfaz.

## Estructura

```text
app.py
src/integral_compiler/
templates/index.html
static/styles.css
static/app.js
tests/test_compiler.py
docs/Gramatica del compilador.md
examples/Entradas de prueba.txt
```

## Ejecucion local

```bash
python -m pip install -r requirements.txt
python app.py
```

Luego abrir:

```text
http://127.0.0.1:5000
```

## Pruebas

```bash
python -m unittest discover tests
```

## Versiones

- Version 1: estructura inicial del repositorio.
- Version 2: compilador web para integrales definidas.
- Version 3: rediseño visual del compilador.
- Version 4: resultado exacto en la interfaz.
- Version 5: ejemplos guiados, ayuda, tema claro/oscuro y nombres de documentos.
- Version 6: AFN/AFD y arbol con Graphviz, descarga SVG, zoom y mas reglas exactas.
