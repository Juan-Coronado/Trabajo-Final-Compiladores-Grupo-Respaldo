from __future__ import annotations

from pathlib import Path
import sys

from flask import Flask, jsonify, render_template, request

ROOT = Path(__file__).resolve().parent
SRC = ROOT / "src"
if str(SRC) not in sys.path:
    sys.path.insert(0, str(SRC))

from integral_compiler import analyze_source  # noqa: E402


app = Flask(__name__)


@app.get("/")
def index():
    return render_template("index.html")


@app.post("/api/analyze")
def analyze():
    payload = request.get_json(silent=True) or {}
    source = payload.get("source", "")
    return jsonify(analyze_source(source))


if __name__ == "__main__":
    app.run(debug=True)
