"""Local checks: internal links/assets resolve, every page has title, description, canonical and JSON-LD,
writing rules (no em dashes, no hype verbs) hold in content. Run: python tools/check.py"""
import glob
import json
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
HYPE = re.compile(r"\b(unlock|leverage|supercharge|transform|delve|harness|empower)\w*", re.I)
errors = []


def resolve(href):
    href = href.split("#")[0].split("?")[0]
    if not href:
        return True
    p = os.path.join(ROOT, href.lstrip("/"))
    if href.endswith("/"):
        p = os.path.join(p, "index.html")
    return os.path.exists(p)


pages = [p for p in glob.glob(os.path.join(ROOT, "**/*.html"), recursive=True) if ".git" not in p]
titles = {}
for p in pages:
    rel = os.path.relpath(p, ROOT).replace("\\", "/")
    s = open(p, encoding="utf-8").read()
    for attr in re.findall(r'(?:href|src)="([^"]+)"', s):
        if attr.startswith(("http", "mailto:", "#", "data:")):
            continue
        if not resolve(attr):
            errors.append(f"{rel}: broken link {attr}")
    t = re.search(r"<title>(.*?)</title>", s)
    if not t:
        errors.append(f"{rel}: no title")
    elif rel != "404.html":
        if t.group(1) in titles:
            errors.append(f"{rel}: duplicate title with {titles[t.group(1)]}")
        titles[t.group(1)] = rel
    for need in ['name="description"', 'rel="canonical"', "application/ld+json", "G-VBSEWX39L4", "og:image"]:
        if need not in s:
            errors.append(f"{rel}: missing {need}")
    for block in re.findall(r'<script type="application/ld\+json">(.*?)</script>', s, re.S):
        try:
            json.loads(block)
        except ValueError as ex:
            errors.append(f"{rel}: bad JSON-LD {ex}")
    text = re.sub(r"<script.*?</script>", "", s, flags=re.S)
    if "—" in text:
        errors.append(f"{rel}: em dash")
    for m in HYPE.findall(re.sub(r"<[^>]+>", " ", text)):
        errors.append(f"{rel}: hype word {m}")
json.load(open(os.path.join(ROOT, "news/feed.json"), encoding="utf-8"))
print(f"{len(pages)} pages checked, {len(errors)} problems")
for e in errors:
    print(" -", e)
sys.exit(1 if errors else 0)
