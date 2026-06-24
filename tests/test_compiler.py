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
        self.assertTrue(result["exact"]["supported"])
        self.assertEqual(result["exact"]["expression"], "1/3 - cos(1) + 1")

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

    def test_academic_report_generates_graphviz_diagrams(self):
        result = analyze_source("INT[0,pi](sin(x)^2 + cos(x)^2) dx")

        self.assertTrue(result["valid"])
        automata = result["academic"]["automata"]
        syntax_tree = result["academic"]["syntax_tree"]
        self.assertIn("digraph AFN_generado", automata["nfa"]["dot"])
        self.assertIn("digraph AFD_generado", automata["dfa"]["dot"])
        self.assertIn("digraph ArbolSintactico", syntax_tree["dot"])
        self.assertGreater(len(automata["nfa"]["states"]), 10)
        self.assertGreater(len(syntax_tree["dot"]), 100)

    def test_more_exact_integrals_are_supported(self):
        trig = analyze_source("INT[0,pi](sin(x)^2 + cos(x)^2) dx")
        root = analyze_source("INT[0,4](sqrt(x)) dx")
        log = analyze_source("INT[1,e](ln(x)) dx")

        self.assertTrue(trig["exact"]["supported"])
        self.assertEqual(trig["exact"]["expression"], "π")
        self.assertTrue(root["exact"]["supported"])
        self.assertIn("4^(3/2)", root["exact"]["expression"])
        self.assertTrue(log["exact"]["supported"])
        self.assertEqual(log["exact"]["expression"], "1")


if __name__ == "__main__":
    unittest.main()
