import unittest
from scripts.select_paths import select

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
