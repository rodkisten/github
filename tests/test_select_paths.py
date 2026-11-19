import unittest
import importlib.util
from pathlib import Path

module_path = Path(__file__).resolve().parents[1] / "scripts" / "select-paths.py"
spec = importlib.util.spec_from_file_location("select_paths", module_path)
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)
select = module.select

class SelectPathsTests(unittest.TestCase):
    def test_merge_and_override(self):
        config = {
            "version": 1,
            "defaults": {"filters": {"docs": ["**/*.md"]}},
            "repositories": {"sample": {"filters": {"app": ["src/**"]}}},
        }
        self.assertEqual(select(config, "sample"), {
            "docs": ["**/*.md"], "app": ["src/**"]
        })

    def test_unknown_repo_fails_closed(self):
        with self.assertRaises(ValueError):
            select({"version": 1, "repositories": {}}, "unknown")

    def test_invalid_patterns(self):
        with self.assertRaises(ValueError):
            select({"version": 1, "repositories": {"x": {"filters": {"bad": []}}}}, "x")
