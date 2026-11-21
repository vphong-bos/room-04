#!/usr/bin/env bash
set -euo pipefail

die() {
  printf '%s\n' "$*" >&2
  exit 1
}

github_api() {
  gh api --hostname github.com \
    --header 'X-GitHub-Api-Version: 2026-03-10' "$@"
}

matches_origin() (
  shopt -s nocasematch
  case "$1" in
    "https://github.com/$target"|"https://github.com/$target.git"|\
    "git@github.com:$target"|"git@github.com:$target.git"|\
    "ssh://git@github.com/$target"|"ssh://git@github.com/$target.git") return 0 ;;
    *) return 1 ;;
  esac
)

is_project_path() {
  local path=$1 approved
  for approved in "${project_paths[@]}"; do
    if [[ $path == "$approved" || ( $approved == */ && $path == "$approved"* ) ]]; then
      return 0
    fi
  done
  return 1
}

if [[ ${1:-} == --help || ${1:-} == -h ]]; then
  printf 'Usage: bash scripts/publish.sh [repository-name]\n'
  printf 'Publishes to a public GitHub repository. Default: dreamcore-graduation.\n'
  exit 0
fi

[[ $# -le 1 ]] || die 'Usage: bash scripts/publish.sh [repository-name]'
repository=${1-dreamcore-graduation}
[[ $repository =~ ^[a-zA-Z0-9._-]{1,100}$ && $repository != . && $repository != .. && $repository != *.[gG][iI][tT] ]] ||
  die 'Choose a GitHub repository name using letters, numbers, periods, underscores, or hyphens.'

for command in git gh python3; do
  command -v "$command" >/dev/null || die "Install $command before publishing."
done

cd -P -- "$(dirname -- "${BASH_SOURCE[0]}")/.."
project_dir=$PWD
workflow=.github/workflows/pages.yml
project_paths=(dist/ "$workflow" scripts/publish.sh README.md ATTRIBUTION.md LICENSE .gitignore docs/ tests/)

gh auth status --hostname github.com >/dev/null 2>&1 ||
  die 'Sign in with: gh auth login --hostname github.com --scopes workflow'
owner=$(github_api user --jq .login) || die 'Could not read the signed-in GitHub account.'
[[ $owner =~ ^[a-zA-Z0-9-]+$ ]] || die 'Could not determine the signed-in GitHub username.'
target=$owner/$repository
repo_api=repos/$target

[[ -s $workflow ]] || die "Missing $workflow. Run this script from a complete project copy."
[[ -s dist/index.html && -s dist/config.js && -d dist/assets ]] ||
  die 'The project needs dist/index.html, dist/config.js, and dist/assets/.'

python3 - <<'PY'
from html.parser import HTMLParser
from pathlib import Path
import re
from urllib.parse import unquote, urlsplit

root = Path("dist").resolve()
css_urls = re.compile(r'''url\(\s*(?:"([^"]*)"|'([^']*)'|([^'"\n)]+))\s*\)''', re.IGNORECASE)
js_imports = re.compile(r'''\b(?:from\s+|import\s*)['"](\.{1,2}/[^'"\n]+\.m?js)['"]''')
js_assets = re.compile(r'''['"](\./assets/[^'"\n]+)['"]''')


def check_url(source, value):
    url = urlsplit(value.strip())
    if url.scheme or url.netloc or not url.path:
        return
    path = unquote(url.path)
    target = (source.parent / path).resolve()
    if path.startswith("/") or root not in target.parents or not target.is_file():
        raise SystemExit(f"Missing or non-relative asset {value!r} in {source.relative_to(root)}")


class AssetLinks(HTMLParser):
    def handle_starttag(self, tag, attrs):
        for name, value in attrs:
            if value and (name in {"src", "poster"} or tag == "link" and name == "href"):
                check_url(self.source, value)


for source in root.rglob("*"):
    if source.is_symlink():
        raise SystemExit(f"GitHub Pages artifacts cannot contain symlinks: {source.relative_to(root)}")
    suffix = source.suffix.lower()
    if suffix not in {".html", ".css", ".js", ".mjs"} or not source.is_file():
        continue
    content = source.read_text(encoding="utf-8")
    if suffix == ".html":
        links = AssetLinks()
        links.source = source
        links.feed(content)
    if suffix in {".html", ".css"}:
        for match in css_urls.finditer(content):
            check_url(source, next(value for value in match.groups() if value is not None))
    else:
        for value in js_imports.findall(content) + js_assets.findall(content):
            check_url(source, value)
PY

git_root=$(git rev-parse --show-toplevel 2>/dev/null || true)
if [[ -n $git_root ]]; then
  [[ $git_root == "$project_dir" ]] || die 'Move the project outside the enclosing Git checkout before publishing.'
  [[ $(git symbolic-ref --quiet --short HEAD || true) == main ]] ||
    die 'Switch this project to the main branch before publishing.'
  if git rev-parse --verify HEAD >/dev/null 2>&1; then
    # A push transfers reachable history, including files deleted in later commits.
    GIT_NO_REPLACE_OBJECTS=1 git log --root -m --no-renames --format= --name-only -z HEAD |
      while IFS= read -r -d '' path; do
        [[ -z $path ]] || is_project_path "$path" ||
          die "Local main history includes $path outside the website files. Publish from a fresh project copy."
      done
  fi
fi

has_origin=false
if [[ -n $git_root ]]; then
  if fetch_url=$(git remote get-url --all origin 2>/dev/null); then
    push_url=$(git remote get-url --push --all origin)
    matches_origin "$fetch_url" && matches_origin "$push_url" ||
      die "The existing origin points outside $target. Choose a matching name or publish from a fresh project copy."
    has_origin=true
  elif [[ -n $(git remote) ]]; then
    die 'This project already has a Git remote. Publish from a fresh project copy or use its configured repository.'
  fi
fi

repo_query='[.full_name, .visibility, (.fork|tostring), (.archived|tostring), .default_branch] | @tsv'
git_online=(git -c credential.helper= -c 'credential.https://github.com.helper=!gh auth git-credential')
remote_main_sha=
if repo_info=$(github_api "$repo_api" --jq "$repo_query" 2>&1); then
  [[ $has_origin == true ]] || die "$target already exists. Choose a different repository name."
  IFS=$'\t' read -r full_name visibility fork archived default_branch <<< "$repo_info"
  matches_origin "https://github.com/$full_name" && [[ $visibility == public && $fork == false && $archived == false ]] ||
    die "$target must be a public, writable repository owned by the signed-in account."

  remote_heads=$("${git_online[@]}" ls-remote --heads origin) || die "Could not read branches from $target."
  if [[ -n $remote_heads ]]; then
    [[ $default_branch == main ]] || die "$target has a default branch other than main."
    while IFS=$'\t' read -r sha ref; do
      if [[ $ref == refs/heads/main ]]; then
        remote_main_sha=$sha
        break
      fi
    done <<< "$remote_heads"
    [[ -n $remote_main_sha ]] && git merge-base --is-ancestor "$remote_main_sha" HEAD 2>/dev/null ||
      die "The local main branch does not contain $target's current main. Review and integrate the remote changes before publishing."
  fi
elif [[ $repo_info == *'(HTTP 404)'* ]]; then
  [[ $has_origin == false ]] || die "The configured origin $target is missing or inaccessible on GitHub."
else
  die "Could not check $target on GitHub. $repo_info"
fi

if [[ -z $git_root ]]; then
  git init -b main
fi

git var GIT_AUTHOR_IDENT >/dev/null 2>&1 && git var GIT_COMMITTER_IDENT >/dev/null 2>&1 ||
  die 'Set a local Git identity with git config --local user.name "Your Name" and git config --local user.email "you@example.com". Then rerun this script.'

project_files=()
for path in "${project_paths[@]}"; do
  if [[ -e $path || -n $(git ls-files -- "$path") ]]; then
    project_files+=("$path")
  fi
done
git add -A -- "${project_files[@]}"
git ls-files --error-unmatch -- dist/index.html dist/config.js "$workflow" >/dev/null
if ! git diff --cached --quiet -- "${project_files[@]}"; then
  git commit --only -m 'Update graduation website' -- "${project_files[@]}"
fi

if [[ $has_origin == false ]]; then
  github_api --method POST user/repos --raw-field "name=$repository" --field private=false --silent
  git remote add origin "https://github.com/$target.git"
  matches_origin "$(git remote get-url --all origin)" && matches_origin "$(git remote get-url --push --all origin)" ||
    die 'Git URL rewriting changed the new origin. Check the local Git configuration before publishing.'
fi

pages_query='[.build_type // "unknown", .html_url // ""] | join(" ")'
pages_changed=false
if pages_info=$(github_api "$repo_api/pages" --jq "$pages_query" 2>&1); then
  read -r build_type page_url <<< "$pages_info"
  if [[ $build_type != workflow ]]; then
    github_api --method PUT "$repo_api/pages" --raw-field build_type=workflow --silent
    pages_changed=true
  fi
elif [[ $pages_info == *'(HTTP 404)'* ]]; then
  page_url=$(github_api --method POST "$repo_api/pages" --raw-field build_type=workflow --jq '.html_url // ""') ||
    die "Could not enable GitHub Pages. Check https://github.com/$target/settings/pages and rerun this script."
  pages_changed=true
else
  die "Could not read GitHub Pages settings. $pages_info"
fi

"${git_online[@]}" -c remote.origin.mirror=false push --no-follow-tags --set-upstream origin refs/heads/main:refs/heads/main ||
  die 'Push failed. If GitHub rejected the workflow file, run gh auth refresh --hostname github.com --scopes workflow and rerun.'

# Updating a Pages setting cannot trigger a push event for an unchanged branch.
if [[ $pages_changed == true && $remote_main_sha == "$(git rev-parse HEAD)" ]]; then
  github_api --method POST "$repo_api/actions/workflows/pages.yml/dispatches" --raw-field ref=main --silent
fi

if [[ -z $page_url ]]; then
  page_url=$(python3 - "$owner" "$repository" <<'PY'
import sys

owner, repository = sys.argv[1:]
host = f"{owner.lower()}.github.io"
path = "" if repository.lower() == host else f"{repository}/"
print(f"https://{host}/{path}")
PY
  )
fi
printf '\nGitHub Pages URL: %s\n' "$page_url"
printf 'Watch the deployment: https://github.com/%s/actions/workflows/pages.yml\n' "$target"
