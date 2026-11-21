import os
from pathlib import Path
import shutil
import subprocess
import tempfile
import unittest


PROJECT = Path(__file__).resolve().parents[1]


class PublishSafetyTests(unittest.TestCase):
    def setUp(self):
        temp_dir = tempfile.TemporaryDirectory()
        self.addCleanup(temp_dir.cleanup)
        self.directory = Path(temp_dir.name)
        self.project = self.directory / "cloud-nine-graduation"
        (self.project / "scripts").mkdir(parents=True)
        publish_script = PROJECT / "scripts" / "publish.sh"
        if publish_script.is_file():
            shutil.copy2(publish_script, self.project / "scripts")
        (self.project / ".github/workflows").mkdir(parents=True)
        (self.project / ".github/workflows/pages.yml").write_text("name: Pages\n")
        (self.project / "dist/assets").mkdir(parents=True)
        (self.project / "dist/index.html").write_text(
            '<script src="config.js"></script><img src="assets/sky.webp">'
        )
        (self.project / "dist/config.js").write_text("window.config = {};\n")
        (self.project / "dist/assets/sky.webp").write_bytes(b"sample image")

        bin_dir = self.directory / "bin"
        bin_dir.mkdir()
        gh = bin_dir / "gh"
        gh.write_text(
            '''#!/usr/bin/env bash
printf '%s\\n' "$*" >> "$GH_CALLS"
case "$*" in
    'auth status'*) exit "${GH_AUTH_EXIT:-0}" ;;
    *' user --jq '*) printf 'student\\n' ;;
    *' repos/student/dreamcore-graduation --jq '*)
        if [[ ${GH_EXISTING_REPO:-0} == 1 || -f $GH_REPO_CREATED ]]; then
            printf 'student/dreamcore-graduation\\tpublic\\tfalse\\tfalse\\tmain\\n'
        else
            printf 'gh: Not Found (HTTP 404)\\n' >&2
            exit 1
        fi ;;
    *' --method POST user/repos --raw-field name=dreamcore-graduation --field private=false --silent')
        [[ ! -e $GH_REPO_CREATED ]] || exit 98
        : > "$GH_REPO_CREATED" ;;
    *' --method POST repos/student/dreamcore-graduation/pages --raw-field build_type=workflow --jq '*)
        [[ -f $GH_REPO_CREATED && ! -e $GH_PAGES_ENABLED ]] || exit 97
        : > "$GH_PAGES_ENABLED"
        printf 'https://student.github.io/dreamcore-graduation/\\n' ;;
    *' repos/student/dreamcore-graduation/pages --jq '*)
        if [[ -f $GH_PAGES_ENABLED ]]; then
            printf 'workflow https://student.github.io/dreamcore-graduation/\\n'
        else
            printf 'gh: Not Found (HTTP 404)\\n' >&2
            exit 1
        fi ;;
    *) printf 'Unexpected gh request: %s\\n' "$*" >&2; exit 99 ;;
esac
'''
        )
        gh.chmod(0o755)
        git = bin_dir / "git"
        git.write_text(
            '''#!/usr/bin/env bash
case " $* " in
    *' ls-remote --heads origin '*|*' push '*' origin refs/heads/main:refs/heads/main '*)
        [[ -f $GH_PAGES_ENABLED ]] || exit 96
        exec "$REAL_GIT" -c "url.$BARE_REPOSITORY.insteadOf=https://github.com/student/dreamcore-graduation.git" "$@" ;;
    *) exec "$REAL_GIT" "$@" ;;
esac
'''
        )
        git.chmod(0o755)
        self.gh_calls = self.directory / "gh-calls"
        self.bare = self.directory / "remote.git"
        self.env = {
            **os.environ,
            "PATH": f"{bin_dir}{os.pathsep}{os.environ['PATH']}",
            "GH_CALLS": str(self.gh_calls),
            "GH_REPO_CREATED": str(self.directory / "repo-created"),
            "GH_PAGES_ENABLED": str(self.directory / "pages-enabled"),
            "REAL_GIT": shutil.which("git"),
            "BARE_REPOSITORY": str(self.bare),
            "GIT_CONFIG_GLOBAL": os.devnull,
            "GIT_CONFIG_NOSYSTEM": "1",
            "GIT_AUTHOR_NAME": "Graduation Student",
            "GIT_AUTHOR_EMAIL": "student@example.com",
            "GIT_COMMITTER_NAME": "Graduation Student",
            "GIT_COMMITTER_EMAIL": "student@example.com",
        }

    def publish(self, *args, **env):
        return subprocess.run(
            ["bash", "scripts/publish.sh", *args],
            cwd=self.project,
            env={**self.env, **env},
            text=True,
            capture_output=True,
        )

    def git(self, *args):
        return subprocess.check_output(
            ["git", *args], cwd=self.project, env=self.env, text=True
        ).strip()

    def test_requires_login_before_initializing_git(self):
        result = self.publish(GH_AUTH_EXIT="1")

        self.assertNotEqual(result.returncode, 0)
        self.assertIn("gh auth login", result.stderr)
        self.assertFalse((self.project / ".git").exists())

    def test_refuses_an_unrelated_origin(self):
        self.git("init", "-b", "main")
        self.git("remote", "add", "origin", "https://github.com/student/other.git")

        result = self.publish()

        self.assertNotEqual(result.returncode, 0)
        self.assertIn("origin", result.stderr)
        self.assertEqual(
            self.git("remote", "get-url", "origin"),
            "https://github.com/student/other.git",
        )
        self.assertNotIn("POST", self.gh_calls.read_text())

    def test_refuses_an_existing_github_repo_without_a_linked_origin(self):
        result = self.publish(GH_EXISTING_REPO="1")

        self.assertNotEqual(result.returncode, 0)
        self.assertIn("already exists", result.stderr)
        self.assertFalse((self.project / ".git").exists())
        self.assertNotIn("POST", self.gh_calls.read_text())

    def test_missing_html_asset_prevents_publication(self):
        (self.project / "dist/assets/sky.webp").unlink()

        result = self.publish()

        self.assertNotEqual(result.returncode, 0)
        self.assertIn("assets/sky.webp", result.stderr)
        self.assertFalse((self.project / ".git").exists())

    def test_missing_javascript_asset_prevents_publication(self):
        (self.project / "dist/app.mjs").write_text("const poster = './assets/rainbow.jpg';\n")

        result = self.publish()

        self.assertNotEqual(result.returncode, 0)
        self.assertIn("assets/rainbow.jpg", result.stderr)
        self.assertFalse((self.project / ".git").exists())

    def test_refuses_unrelated_files_in_an_existing_commit(self):
        self.check_unrelated_history(delete_file=False)

    def test_refuses_unrelated_files_deleted_in_a_later_commit(self):
        self.check_unrelated_history(delete_file=True)

    def check_unrelated_history(self, *, delete_file):
        self.git("init", "--bare", "-b", "main", str(self.bare))
        self.git("init", "-b", "main")
        (self.project / "notes.txt").write_text("Keep these notes local.\n")
        self.git("add", "notes.txt")
        self.git("commit", "-m", "Save notes")
        if delete_file:
            self.git("rm", "notes.txt")
            self.git("commit", "-m", "Remove notes")

        result = self.publish()

        self.assertNotEqual(result.returncode, 0)
        self.assertIn("notes.txt", result.stderr)
        self.assertEqual("", self.git(f"--git-dir={self.bare}", "branch", "--list"))
        self.assertNotIn("POST", self.gh_calls.read_text())

    def test_publishes_project_files_and_can_rerun(self):
        self.git("init", "--bare", "-b", "main", str(self.bare))
        (self.project / "notes.txt").write_text("Keep these notes local.\n")
        (self.project / "dist/style.css").write_text(
            '''body { background-image: url("data:image/svg+xml,<svg id='sample' filter='url(%23effect)'>"); }'''
        )

        first = self.publish()

        self.assertEqual(first.returncode, 0, first.stderr)
        self.assertIn("https://student.github.io/dreamcore-graduation/", first.stdout)
        published = self.git(f"--git-dir={self.bare}", "rev-parse", "main")
        self.assertEqual(published, self.git("rev-parse", "main"))
        tree = self.git(f"--git-dir={self.bare}", "ls-tree", "-r", "--name-only", "main")
        self.assertIn("dist/index.html", tree.splitlines())
        self.assertNotIn("notes.txt", tree.splitlines())

        again = self.publish()

        self.assertEqual(again.returncode, 0, again.stderr)
        self.assertEqual(published, self.git("rev-parse", "main"))


if __name__ == "__main__":
    unittest.main()
