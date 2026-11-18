"""Ensure credentials stay out of coursework ZIP exports."""
import importlib.util
from pathlib import Path
import tempfile
import unittest
from zipfile import ZipFile


class SubmissionPackagingTest(unittest.TestCase):
    def test_server_environment_and_deployment_credentials_are_excluded(self):
        module_path = Path(__file__).resolve().parents[1] / "tools/prepare_submission.py"
        spec = importlib.util.spec_from_file_location("submission", module_path)
        submission = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(submission)
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory) / "project"
            output = Path(directory) / "submission"
            root.mkdir()
            output.mkdir()
            for name in [".env", ".env.local", ".env.production", ".env.example", "index.html", "api/contact.js", ".vercel/auth.json"]:
                target = root / name
                target.parent.mkdir(parents=True, exist_ok=True)
                target.write_text("fixture only")
            submission.ROOT = root
            submission.OUTPUT = output
            with ZipFile(submission.package_project()) as archive:
                names = set(archive.namelist())
            self.assertEqual(names, {
                "final-project/.env.example",
                "final-project/index.html",
                "final-project/api/contact.js",
            })


if __name__ == "__main__":
    unittest.main()
