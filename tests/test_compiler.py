import math
import sys
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "src"))

from integral_compiler import analyze_source


class CompilerTests(unittest.TestCase):
    def test_valid_integral_generates_tokens_ast_and_result(self):
        result = analyze_source("INT[0,1](x^2 + sin(x)) dx")

        self.assertTrue(result["valid"])
        self.assertEqual(result["phases"]["lexico"]["status"], "valido")
        self.assertEqual(result["phases"]["sintactico"]["status"], "valido")
        self.assertEqual(result["phases"]["semantico"]["status"], "valido")
        self.assertEqual(result["tokens"][0]["type"], "RESERVED")
        self.assertEqual(result["tokens"][0]["lexeme"], "INT")
        self.assertEqual(result["ast"]["type"], "DefiniteIntegral")
        expected = 1 / 3 + (1 - math.cos(1))
        self.assertLess(abs(result["evaluation"]["value"] - expected), 1e-6)

    def test_lexical_error_reports_unknown_symbol(self):
        result = analyze_source("INT[0,1](x^2 @ sin(x)) dx")

        self.assertFalse(result["valid"])
        self.assertEqual(result["phases"]["lexico"]["status"], "error")
        self.assertTrue(any(error["phase"] == "lexico" for error in result["errors"]))

    def test_syntax_error_reports_missing_expression_part(self):
        result = analyze_source("INT[0,1](x^2 + ) dx")

        self.assertFalse(result["valid"])
        self.assertEqual(result["phases"]["sintactico"]["status"], "error")
        self.assertTrue(any(error["phase"] == "sintactico" for error in result["errors"]))

    def test_semantic_error_reports_domain_problem(self):
        result = analyze_source("INT[0,1](ln(x)) dx")

        self.assertFalse(result["valid"])
        self.assertEqual(result["phases"]["semantico"]["status"], "error")
        self.assertTrue(any("ln requiere" in error["message"] for error in result["errors"]))

    def test_implicit_multiplication_is_supported(self):
        result = analyze_source("INT[0,2](2x + 3(x+1)) dx")

        self.assertTrue(result["valid"])
        self.assertLess(abs(result["evaluation"]["value"] - 16), 1e-6)


if __name__ == "__main__":
    unittest.main()
