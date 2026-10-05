#!/usr/bin/env python3
"""Build a fully self-contained landing page by inlining all images as base64 data URIs."""
import base64, io, re, os
from PIL import Image

BASE = os.path.dirname(os.path.abspath(__file__))
SRC_DIRS = [os.path.join(BASE, "v2"), os.path.join(BASE, "images")]
TPL = os.path.join(BASE, "template.html")
OUT = os.path.join(BASE, "index.html")

def data_uri(path, max_w=1440, quality=82):
    im = Image.open(path).convert("RGB")
    if im.width > max_w:
        im = im.resize((max_w, int(im.height * max_w / im.width)), Image.LANCZOS)
    buf = io.BytesIO()
    im.save(buf, "JPEG", quality=quality, optimize=True)
    return "data:image/jpeg;base64," + base64.b64encode(buf.getvalue()).decode()

html = open(TPL, encoding="utf-8").read()
names = sorted(set(re.findall(r"\{\{IMG:([\w-]+)\}\}", html)))
print(f"Found {len(names)} image placeholders: {names}")
missing = []
for name in names:
    p = next((os.path.join(d, name + ".jpg") for d in SRC_DIRS if os.path.exists(os.path.join(d, name + ".jpg"))), None)
    if p is None:
        missing.append(name)
        continue
    uri = data_uri(p)
    html = html.replace("{{IMG:%s}}" % name, uri)
    print(f"  inlined {os.path.relpath(p, BASE)} -> {len(uri)//1024} KB data URI")
if missing:
    from svg_assets import SVGS
    for name in missing:
        if name in SVGS:
            import base64 as b64
            uri = "data:image/svg+xml;base64," + b64.b64encode(SVGS[name].encode("utf-8")).decode()
            html = html.replace("{{IMG:%s}}" % name, uri)
            print(f"  inlined {name} -> crafted SVG data URI ({len(uri)//1024} KB)")
        else:
            print(f"  WARNING: no asset for {name}, placeholder removed")
            html = html.replace("{{IMG:%s}}" % name, "")
open(OUT, "w", encoding="utf-8").write(html)
print(f"\nWrote {OUT}: {os.path.getsize(OUT)/1024/1024:.2f} MB")
