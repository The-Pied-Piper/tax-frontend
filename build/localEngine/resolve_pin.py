"""Finds the tax-engine release the public tax-service uses and writes a hashed requirements file for it.

Usage: python -I build/localEngine/resolve_pin.py <main|release> <committed requirements.txt> <output>

  main     the tax-engine pinned by tax-service's `main` (what the dev service runs);
  release  the one pinned by tax-service's latest release tag, the highest `v<number>` (what the
           prod service runs).

Everything is read over public git (`git ls-remote`, then a fetch of that exact commit): no
credentials, no API, and the commit is named by sha, so the file read is the one that was resolved.
tax-service's `requirements.txt` must carry exactly one `tax-engine==X` line. ANY failure (the repo is
unreachable, no such tag, no line, two lines, PyPI does not know the release) exits non-zero with a
message; a deploy build never falls back to the committed file.

The output has `tax-engine==X` with the sha256 of every file PyPI lists for that release, then the
PyYAML block of the committed requirements file (the engine's one dependency; this is installed with
--no-deps). The hashes come from PyPI when the build runs, so they protect the download, not against a
bad release: interim, until tax-service publishes its own hashed requirements (tax-service #91).

TAX_SERVICE_URL and PYPI_URL exist for the tests only.
"""

from __future__ import annotations

import json
import os
import re
import subprocess
import sys
import tempfile
import urllib.request
from pathlib import Path

SERVICE_URL = os.environ.get("TAX_SERVICE_URL", "https://github.com/The-Pied-Piper/tax-service")
PYPI_URL = os.environ.get("PYPI_URL", "https://pypi.org/pypi")
PIN = re.compile(r"^tax-engine==([0-9][0-9A-Za-z.+!-]*)[ \t]*(?:\\)?[ \t]*$")
TAG = re.compile(r"^refs/tags/v([1-9][0-9]*)(\^\{\})?$")


class Failure(Exception):
    pass


def git(*args: str, cwd: str | None = None) -> str:
    try:
        done = subprocess.run(
            ["git", *args], cwd=cwd, check=True, capture_output=True, text=True, timeout=120
        )
    except (subprocess.SubprocessError, OSError) as error:
        detail = getattr(error, "stderr", "") or error
        raise Failure(f"git {args[0]} failed: {str(detail).strip()}") from error
    return done.stdout


def commit_of(mode: str) -> tuple[str, str]:
    """The ref's name and the commit sha it points at."""
    if mode == "main":
        lines = git("ls-remote", SERVICE_URL, "refs/heads/main").split("\n")
        found = [line.split("\t") for line in lines if line]
        if len(found) != 1:
            raise Failure("tax-service has no single refs/heads/main")
        return "main", found[0][0]
    tags: dict[int, str] = {}
    for line in git("ls-remote", "--tags", SERVICE_URL, "refs/tags/v*").split("\n"):
        if not line:
            continue
        sha, ref = line.split("\t")
        match = TAG.match(ref)
        if match is None:
            continue
        number = int(match.group(1))
        # An annotated tag lists the tag object, then the commit it points at ("^{}"): keep the commit.
        if match.group(2) or number not in tags:
            tags[number] = sha
    if not tags:
        raise Failure("tax-service has no release tag v<number>")
    latest = max(tags)
    return f"v{latest}", tags[latest]


def requirements_at(sha: str) -> str:
    with tempfile.TemporaryDirectory() as folder:
        git("init", "-q", folder)
        git("fetch", "-q", "--depth", "1", SERVICE_URL, sha, cwd=folder)
        return git("show", f"{sha}:requirements.txt", cwd=folder)


def engine_version(requirements: str) -> str:
    found = [m.group(1) for line in requirements.split("\n") if (m := PIN.match(line))]
    if len(found) != 1:
        raise Failure(f"expected one tax-engine==X line in tax-service's requirements.txt, found {len(found)}")
    return found[0]


def pypi_hashes(version: str) -> list[str]:
    url = f"{PYPI_URL}/tax-engine/{version}/json"
    try:
        with urllib.request.urlopen(url, timeout=60) as answer:  # noqa: S310 (a fixed https address)
            files = json.load(answer)["urls"]
        hashes = sorted({file["digests"]["sha256"] for file in files})
    except (OSError, ValueError, KeyError, TypeError) as error:
        raise Failure(f"cannot read the files of tax-engine {version} from PyPI: {error}") from error
    if not hashes or not all(re.fullmatch(r"[0-9a-f]{64}", h) for h in hashes):
        raise Failure(f"PyPI lists no usable files for tax-engine {version}")
    return hashes


def pyyaml_block(committed: str) -> str:
    """The PyYAML pin of the committed requirements file, hashes included, as it is written there."""
    lines = committed.split("\n")
    start = next((i for i, line in enumerate(lines) if line.startswith("pyyaml==")), None)
    if start is None:
        raise Failure("the committed requirements file has no pyyaml pin")
    block = [lines[start]]
    for line in lines[start + 1 :]:
        if not block[-1].endswith("\\"):
            break
        block.append(line)
    return "\n".join(block) + "\n"


def main(mode: str, committed_file: str, output_file: str) -> None:
    if mode not in ("main", "release"):
        raise Failure("the first argument is main or release")
    ref, sha = commit_of(mode)
    version = engine_version(requirements_at(sha))
    hashes = pypi_hashes(version)
    pin = f"tax-engine=={version} \\\n" + " \\\n".join(f"    --hash=sha256:{h}" for h in hashes) + "\n"
    committed = Path(committed_file).read_text(encoding="utf-8")
    Path(output_file).write_text(pyyaml_block(committed) + pin, encoding="utf-8")
    print(f"tax-engine {version} from tax-service {ref} ({sha})")


if __name__ == "__main__":
    if len(sys.argv) != 4:
        sys.exit(__doc__)
    try:
        main(*sys.argv[1:])
    except Failure as failure:
        sys.exit(f"resolve_pin: {failure}")
