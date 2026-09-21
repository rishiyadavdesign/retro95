#!/usr/bin/env python3
"""Download render-time dependencies and point the exported Framer pages at them."""

from __future__ import annotations

from concurrent.futures import ThreadPoolExecutor, as_completed
from html import unescape
from pathlib import Path
from urllib.parse import urlsplit
from urllib.request import Request, urlopen
import re


ROOT = Path(__file__).resolve().parents[1]
PAGES = sorted(ROOT.glob("**/index.html"))
RESOURCE_DOMAINS = {
    "framerusercontent.com": "vendor/framerusercontent",
    "fonts.gstatic.com": "vendor/fonts",
}
RESOURCE_URL_RE = re.compile(
    r"https://(?:framerusercontent\.com|fonts\.gstatic\.com)"
    r"/[A-Za-z0-9._~:/?#\[\]@!$&()*+,;=%-]+"
    r"|https://motionape-website\.s3\.us-east-1\.amazonaws\.com/"
    r"[A-Za-z0-9._~:/?#\[\]@!$&()*+,;=%-]+"
)


def destination(url: str) -> Path | None:
    parsed = urlsplit(url)
    if parsed.netloc in RESOURCE_DOMAINS:
        return ROOT / RESOURCE_DOMAINS[parsed.netloc] / parsed.path.lstrip("/")
    if parsed.netloc == "motionape-website.s3.us-east-1.amazonaws.com":
        return ROOT / "vendor/sound/click-09.mp3"
    return None


def download(item: tuple[str, Path]) -> tuple[Path, int]:
    url, target = item
    if target.exists() and target.stat().st_size:
        return target, target.stat().st_size
    target.parent.mkdir(parents=True, exist_ok=True)
    request = Request(url, headers={"User-Agent": "Mozilla/5.0"})
    with urlopen(request, timeout=60) as response:
        content = response.read()
    target.write_bytes(content)
    return target, len(content)


def main() -> None:
    page_text = {page: page.read_text(errors="strict") for page in PAGES}
    downloads: dict[Path, str] = {}

    for text in page_text.values():
        for raw_url in RESOURCE_URL_RE.findall(text):
            url = unescape(raw_url)
            target = destination(url)
            if target is not None:
                parsed = urlsplit(url)
                source = parsed._replace(query="", fragment="").geturl()
                downloads.setdefault(target, source)

    failures = []
    with ThreadPoolExecutor(max_workers=12) as pool:
        futures = {
            pool.submit(download, (url, target)): (url, target)
            for target, url in downloads.items()
        }
        for future in as_completed(futures):
            url, target = futures[future]
            try:
                future.result()
            except Exception as exc:
                failures.append((url, target, exc))

    if failures:
        for url, target, exc in failures:
            print(f"FAILED {url} -> {target}: {exc}")
        raise SystemExit(1)

    while True:
        discovered = 0
        code_files = list((ROOT / "vendor").rglob("*.mjs"))
        code_files += list((ROOT / "vendor").rglob("*.js"))
        code_files += list((ROOT / "vendor").rglob("*.json"))
        for code_file in code_files:
            text = code_file.read_text(errors="ignore")
            for raw_url in RESOURCE_URL_RE.findall(text):
                url = unescape(raw_url)
                target = destination(url)
                if target is None or target in downloads:
                    continue
                parsed = urlsplit(url)
                downloads[target] = parsed._replace(query="", fragment="").geturl()
                discovered += 1
        if not discovered:
            break
        failures = []
        with ThreadPoolExecutor(max_workers=12) as pool:
            futures = {
                pool.submit(download, (url, target)): (url, target)
                for target, url in downloads.items()
                if not target.exists()
            }
            for future in as_completed(futures):
                url, target = futures[future]
                try:
                    future.result()
                except Exception as exc:
                    failures.append((url, target, exc))
        if failures:
            for url, target, exc in failures:
                print(f"FAILED {url} -> {target}: {exc}")
            raise SystemExit(1)

    while True:
        relative_downloads = {}
        code_files = list((ROOT / "vendor/framerusercontent").rglob("*.mjs"))
        code_files += list((ROOT / "vendor/framerusercontent").rglob("*.js"))
        for code_file in code_files:
            text = code_file.read_text(errors="ignore")
            specs = re.findall(
                r'(?:from|import\()\s*["\x27]([^"\x27]+)["\x27]',
                text,
            )
            for spec in specs:
                if not spec.startswith("."):
                    continue
                target = (code_file.parent / spec).resolve()
                if target.exists():
                    continue
                relative = target.relative_to(
                    (ROOT / "vendor/framerusercontent").resolve()
                )
                relative_downloads[target] = (
                    "https://framerusercontent.com/" + relative.as_posix()
                )
        if not relative_downloads:
            break
        with ThreadPoolExecutor(max_workers=12) as pool:
            futures = {
                pool.submit(download, (url, target)): (url, target)
                for target, url in relative_downloads.items()
            }
            for future in as_completed(futures):
                future.result()

    for page, text in page_text.items():
        text = re.sub(
            r'<script async src="https://events\.framer\.com/[^"]*"[^>]*></script>',
            "",
            text,
        )
        text = re.sub(
            r'<link rel="modulepreload" href="https://framer\.com/edit/init\.mjs"[^>]*>',
            "",
            text,
        )
        text = re.sub(
            r'<link href="https://fonts\.gstatic\.com" rel="preconnect"[^>]*>',
            "",
            text,
        )
        text = re.sub(
            r'<script>try\{if\(localStorage\.get\("__framer_force_showing_editorbar_since"\)\)'
            r'.*?</script>',
            "",
            text,
        )
        text = text.replace(
            "https://framerusercontent.com", "/vendor/framerusercontent"
        )
        text = text.replace("https://fonts.gstatic.com", "/vendor/fonts")
        text = text.replace(
            "https://motionape-website.s3.us-east-1.amazonaws.com/"
            "Freebies/SoundFX/Sounds/Mouse-click/Click-09.mp3",
            "/vendor/sound/click-09.mp3",
        )
        page.write_text(text)

    code_files = list((ROOT / "vendor").rglob("*.mjs"))
    code_files += list((ROOT / "vendor").rglob("*.js"))
    code_files += list((ROOT / "vendor").rglob("*.json"))
    for code_file in code_files:
        text = code_file.read_text(errors="ignore")
        text = text.replace(
            "https://framerusercontent.com", "/vendor/framerusercontent"
        )
        text = text.replace("https://fonts.gstatic.com", "/vendor/fonts")
        text = text.replace(
            "https://assets.mixkit.co/music/preview/mixkit-tech-house-vibes-130.mp3",
            "/vendor/framerusercontent/assets/uAScMrddW5pnUx2eWO2PWeeTipw.mp3",
        )
        text = text.replace(
            "https://motionape-website.s3.us-east-1.amazonaws.com/"
            "Freebies/SoundFX/Sounds/Mouse-click/Click-09.mp3",
            "/vendor/sound/click-09.mp3",
        )
        text = text.replace(
            "https://framer.com/edit/init.mjs", "/vendor/no-editor.mjs"
        )
        code_file.write_text(text)

    total = sum(path.stat().st_size for path in downloads if path.exists())
    print(f"Localized {len(downloads)} files ({total / 1024 / 1024:.1f} MiB)")
    print(f"Rewrote {len(PAGES)} pages")


if __name__ == "__main__":
    main()
