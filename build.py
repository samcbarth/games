"""Build games.samcbarth.com (Lunchbreak Arcade) into static HTML.

Sources:
  content/games.json        game pages (how to play, tips, FAQ)
  content/news/*.json       one file per news story
  games/<slug>/game.js      hand-written game code (not generated)
Run:  python build.py
"""
import glob
import html
import json
import os
from datetime import datetime, timezone
from email.utils import format_datetime

ROOT = os.path.dirname(os.path.abspath(__file__))
SITE = {
    "name": "Lunchbreak Arcade",
    "domain": "games.samcbarth.com",
    "url": "https://games.samcbarth.com",
    "tagline": "Free original browser games you can finish on a lunch break.",
    "news_brand": "Lunchbreak Dispatch",
    "author": "Sam Barth",
    "author_url": "https://samcbarth.com",
    # Contact: a HubSpot form (portal 20693956) if a form id is set, otherwise a mailto link.
    "hubspot_portal": "20693956",
    "hubspot_form_id": "",
    "contact_email": "samcbarth@gmail.com",
}
# Sam's own games. Plain links only, nothing copied from those projects. Empty url = shown without a link.
SAM_GAMES = [
    {"name": "Lantern Survivors", "url": "", "blurb": "an action game about holding back the dark with a lantern"},
    {"name": "Dead Acre", "url": "", "blurb": "a wave-survival first-person shooter"},
    {"name": "Starforge", "url": "", "blurb": "a sci-fi looter-shooter"},
]
NETWORK = [
    ("realestate", "Real Estate"), ("tools", "Tools"), ("games", "Games"), ("streaming", "Streaming"),
    ("homerepair", "Home Repair"), ("deals", "Deals"), ("news", "News"),
]
GTM = """<script async src="https://www.googletagmanager.com/gtm.js?id=GTM-KMS4X55L"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
</script>"""
# Extra on-screen controls under specific games
EXTRA_CONTROLS = {
    "glowworm": '<div class="controls" aria-label="Direction buttons"><button type="button" data-dir="left" aria-label="Left">&larr;</button>'
                '<button type="button" data-dir="up" aria-label="Up">&uarr;</button><button type="button" data-dir="down" aria-label="Down">&darr;</button>'
                '<button type="button" data-dir="right" aria-label="Right">&rarr;</button></div>',
    "sinkhole-sweep": '<div class="controls"><button type="button" data-act="flag">Flag mode: off</button></div>',
}
BUILD_TIME = datetime.now(timezone.utc)
e = html.escape


def out(path, text):
    full = os.path.join(ROOT, path)
    os.makedirs(os.path.dirname(full), exist_ok=True)
    with open(full, "w", encoding="utf-8", newline="\n") as f:
        f.write(text)


def ld(obj):
    return '<script type="application/ld+json">' + json.dumps(obj, ensure_ascii=False).replace("</", "<\\/") + "</script>"


def crumbs_ld(items):
    return {"@context": "https://schema.org", "@type": "BreadcrumbList", "itemListElement": [
        {"@type": "ListItem", "position": i + 1, "name": n, "item": SITE["url"] + u} for i, (n, u) in enumerate(items)]}


WEBSITE_LD = {"@context": "https://schema.org", "@type": "WebSite", "name": SITE["name"], "url": SITE["url"] + "/",
              "description": SITE["tagline"], "publisher": {"@type": "Person", "name": SITE["author"], "url": SITE["author_url"]}}


def article_ld(title, desc, path, img, date=None, kind="Article"):
    d = (date or BUILD_TIME.strftime("%Y-%m-%d"))
    return {"@context": "https://schema.org", "@type": kind, "headline": title[:110], "description": desc,
            "url": SITE["url"] + path, "image": SITE["url"] + img, "datePublished": d, "dateModified": d,
            "author": {"@type": "Person", "name": SITE["author"], "url": SITE["author_url"]},
            "publisher": {"@type": "Person", "name": SITE["author"], "url": SITE["author_url"]},
            "mainEntityOfPage": SITE["url"] + path}


def page(path, title, desc, body, crumbs=None, lds=(), img="/assets/img/og-default.webp", og_type="website", nav="", scripts=""):
    full_title = title if title == SITE["name"] else f"{title} | {SITE['name']}"
    canonical = SITE["url"] + path
    crumbs = crumbs or [("Home", "/")]
    ld_html = "\n".join(ld(x) for x in [WEBSITE_LD, crumbs_ld(crumbs), *lds])
    crumb_html = ""
    if len(crumbs) > 1:
        parts = [f'<a href="{u}">{e(n)}</a>' for n, u in crumbs[:-1]] + [e(crumbs[-1][0])]
        crumb_html = '<nav class="crumbs" aria-label="Breadcrumb">' + " / ".join(parts) + "</nav>"

    def navlink(href, label, key):
        cur = ' aria-current="page"' if nav == key else ""
        return f'<a href="{href}"{cur}>{label}</a>'
    netbar = " ".join(
        (f'<a href="https://{s}.samcbarth.com/" aria-current="page">{lbl}</a>' if s == "games" else f'<a href="https://{s}.samcbarth.com/">{lbl}</a>')
        for s, lbl in NETWORK)
    return f"""<!doctype html>
<html lang="en">
<head>
{GTM}
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{e(full_title)}</title>
<meta name="description" content="{e(desc)}">
<link rel="canonical" href="{canonical}">
<meta property="og:site_name" content="{e(SITE['name'])}">
<meta property="og:type" content="{og_type}">
<meta property="og:title" content="{e(title)}">
<meta property="og:description" content="{e(desc)}">
<meta property="og:url" content="{canonical}">
<meta property="og:image" content="{SITE['url']}{img}">
<meta name="twitter:card" content="summary_large_image">
<meta name="theme-color" content="#d9480f">
<link rel="icon" href="/assets/img/favicon.svg" type="image/svg+xml">
<link rel="alternate" type="application/rss+xml" title="{e(SITE['news_brand'])}" href="/rss.xml">
<link rel="alternate" type="application/feed+json" title="{e(SITE['news_brand'])}" href="/news/feed.json">
<link rel="stylesheet" href="/assets/style.css">
<script src="/assets/config.js"></script>
<script src="/assets/site.js"></script>
{ld_html}
</head>
<body>
<a class="skip" href="#main">Skip to content</a>
<header class="site"><div class="wrap">
<a class="brand" href="/"><span class="dot" aria-hidden="true"></span>{e(SITE['name'])}</a>
<nav class="main" aria-label="Main">{navlink('/games/', 'Games', 'games')}{navlink('/news/', 'News', 'news')}{navlink('/about/', 'About', 'about')}
<button class="theme-btn" type="button" aria-label="Toggle dark mode">Theme</button></nav>
</div></header>
<main id="main"><div class="wrap">
{crumb_html}
{body}
</div></main>
<footer class="site"><div class="wrap">
<div class="foot-links"><a href="/games/">All games</a><a href="/news/">{e(SITE['news_brand'])}</a><a href="/about/">About</a><a href="/contact/">Contact</a><a href="/privacy/">Privacy Policy</a><a href="/terms/">Terms</a><a href="/rss.xml">RSS</a></div>
<nav class="netbar" aria-label="samcbarth.com network"><strong>samcbarth.com network:</strong> {netbar}</nav>
<p>&copy; {BUILD_TIME.year} {e(SITE['author'])}. All games on this site are original works made for {e(SITE['name'])}.</p>
</div></footer>
{scripts}
</body>
</html>
"""


def ad(slot, cls=""):
    return f'<div class="ad-slot {cls}" data-slot="{slot}"></div>'


def more_from_sam():
    items = []
    for g in SAM_GAMES:
        name = f'<a href="{e(g["url"])}">{e(g["name"])}</a>' if g["url"] else f"<strong>{e(g['name'])}</strong>"
        items.append(f"<li>{name}: {e(g['blurb'])}{'' if g['url'] else ' (link coming soon)'}</li>")
    return ('<section class="more-sam"><h2>More from Sam</h2><p>Larger games Sam Barth is making on his own:</p><ul>'
            + "".join(items) + "</ul></section>")


def fmt_date(d):
    return datetime.strptime(d, "%Y-%m-%d").strftime("%B %-d, %Y") if os.name != "nt" else datetime.strptime(d, "%Y-%m-%d").strftime("%B %#d, %Y")


# ---------- images ----------
def make_images(games, stories):
    from PIL import Image, ImageDraw, ImageFont
    os.makedirs(os.path.join(ROOT, "assets/img"), exist_ok=True)

    def font(size, bold=True):
        for f in (["segoeuib.ttf", "arialbd.ttf"] if bold else ["segoeui.ttf", "arial.ttf"]):
            try:
                return ImageFont.truetype(os.path.join(os.environ.get("WINDIR", "C:/Windows"), "Fonts", f), size)
            except OSError:
                try:
                    return ImageFont.truetype(f, size)
                except OSError:
                    pass
        return ImageFont.load_default()

    def hexrgb(h):
        h = h.lstrip("#")
        return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4))

    def card(path, title, sub, c1, c2, glyph):
        W, H = 1200, 630
        im = Image.new("RGB", (W, H), hexrgb(c1))
        d = ImageDraw.Draw(im)
        a, b = hexrgb(c1), hexrgb(c2)
        for y in range(H):
            t = y / H * 0.35
            d.line([(0, y), (W, y)], fill=tuple(int(a[i] * (1 - t) + b[i] * t) for i in range(3)))
        d.rounded_rectangle([760, 120, 1110, 470], radius=48, fill=b)
        gf = font(150)
        bb = d.textbbox((0, 0), glyph, font=gf)
        d.text((935 - (bb[2] - bb[0]) / 2 - bb[0], 295 - (bb[3] - bb[1]) / 2 - bb[1]), glyph, font=gf, fill=a)
        tf = font(64)
        words, lines, line = title.split(), [], ""
        for w in words:
            if d.textlength((line + " " + w).strip(), font=tf) > 640:
                lines.append(line)
                line = w
            else:
                line = (line + " " + w).strip()
        lines.append(line)
        y = 300 - len(lines[:4]) * 40
        for ln in lines[:4]:
            d.text((70, y), ln, font=tf, fill=(255, 255, 255))
            y += 80
        d.text((70, 60), sub, font=font(32, False), fill=(255, 255, 255))
        d.text((70, 540), SITE["domain"], font=font(30), fill=b)
        im.save(os.path.join(ROOT, path), "WEBP", quality=82)

    card("assets/img/og-default.webp", "Free original browser games", SITE["name"], "#2b1d4a", "#ff8a4c", "GO")
    card("assets/img/news.webp", SITE["news_brand"], "Gaming, indie and browser game news", "#1c2541", "#ffd43b", "NEWS")
    for g in games:
        card(f"assets/img/{g['slug']}.webp", g["name"], g["genre"] + " | play free", g["color"][0], g["color"][1], g["glyph"])
    for s in stories:
        p = f"assets/img/news-{s['slug']}.webp"
        if not os.path.exists(os.path.join(ROOT, p)):
            card(p, s["title"], SITE["news_brand"] + " | " + fmt_date(s["date"]), "#1c2541", "#ffd43b", "NEWS")
    out("assets/img/favicon.svg", '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">'
        '<stop offset="0" stop-color="#d9480f"/><stop offset="1" stop-color="#f59f00"/></linearGradient></defs>'
        '<rect width="64" height="64" rx="14" fill="url(#g)"/><circle cx="22" cy="34" r="8" fill="#fff"/>'
        '<rect x="36" y="26" width="16" height="16" rx="3" fill="#fff"/></svg>')


# ---------- pages ----------
def game_card(g):
    return (f'<a class="card" href="/games/{g["slug"]}/"><img src="/assets/img/{g["slug"]}.webp" alt="{e(g["name"])} title art" '
            f'width="1200" height="630" loading="lazy"><div class="body"><span class="tag">{e(g["genre"])}</span>'
            f'<h3>{e(g["name"])}</h3><p>{e(g["short"])}</p></div></a>')


def build_game(g, games, stories):
    path = f"/games/{g['slug']}/"
    img = f"/assets/img/{g['slug']}.webp"
    title = f"{g['name']}: free {g['genre'].lower()} game"
    how = "".join(f"<li>{e(s)}</li>" for s in g["how"])
    ctl = "".join(f"<tr><td>{e(a)}</td><td>{e(b)}</td></tr>" for a, b in g["controls"])
    tips = "".join(f"<li>{e(t)}</li>" for t in g["tips"])
    faq = "".join(f"<details><summary>{e(q)}</summary><p>{e(a)}</p></details>" for q, a in g["faq"])
    others = [o for o in games if o["slug"] != g["slug"]][:3]
    news_links = [s for s in stories if g["slug"] in s.get("related", [])][:3]
    news_html = ""
    if news_links:
        news_html = "<h2>Related news</h2><ul>" + "".join(
            f'<li><a href="/news/{s["slug"]}/">{e(s["title"])}</a></li>' for s in news_links) + "</ul>"
    vg = {"@context": "https://schema.org", "@type": "VideoGame", "name": g["name"], "description": g["short"],
          "url": SITE["url"] + path, "image": SITE["url"] + img, "genre": g["schema_genre"], "gamePlatform": ["Web browser", "Mobile web browser"],
          "applicationCategory": "Game", "operatingSystem": "Any", "playMode": "SinglePlayer", "inLanguage": "en",
          "isAccessibleForFree": True, "offers": {"@type": "Offer", "price": "0", "priceCurrency": "USD"},
          "author": {"@type": "Person", "name": SITE["author"], "url": SITE["author_url"]},
          "publisher": {"@type": "Person", "name": SITE["author"]}}
    faq_ld = {"@context": "https://schema.org", "@type": "FAQPage", "mainEntity": [
        {"@type": "Question", "name": q, "acceptedAnswer": {"@type": "Answer", "text": a}} for q, a in g["faq"]]}
    body = f"""<div class="layout"><article>
<h1>{e(g['name'])}</h1>
<p class="lede answer">{e(g['lede'])}</p>
<div class="stage-wrap">
<div class="stage" id="stage"><canvas id="game" aria-label="{e(g['name'])} game area" role="img"></canvas><div class="overlay" id="overlay"></div></div>
<div class="hud" aria-live="polite"><span id="hud-score">Score: 0</span><span id="hud-best">Best: -</span></div>
{EXTRA_CONTROLS.get(g['slug'], '')}
<noscript><p>This game needs JavaScript turned on.</p></noscript>
</div>
{ad('between', 'between-slot')}
<div class="prose">
<h2>How do you play {e(g['name'])}?</h2>
<ol>{how}</ol>
{ad('intro')}
<h2>What are the controls?</h2>
<table class="controls-table"><thead><tr><th>Input</th><th>Action</th></tr></thead><tbody>{ctl}</tbody></table>
<h2>Tips for a higher score</h2>
<ul>{tips}</ul>
{ad('mid')}
<h2>{e(g['name'])} FAQ</h2>
{faq}
{news_html}
<h2>More free games</h2>
</div>
<div class="grid">{''.join(game_card(o) for o in others)}</div>
{more_from_sam()}
{ad('end')}
</article>
<aside><div class="sticky">{ad('sidebar')}</div></aside></div>"""
    scripts = '<script src="/assets/kit.js"></script>\n<script src="/games/' + g["slug"] + '/game.js"></script>'
    out(f"games/{g['slug']}/index.html", page(path, title, g["short"], body,
        crumbs=[("Home", "/"), ("Games", "/games/"), (g["name"], path)],
        lds=[vg, article_ld(f"How to play {g['name']}", g["short"], path, img), faq_ld], img=img, nav="games", scripts=scripts))


def build_news(stories, games):
    gmap = {g["slug"]: g for g in games}
    for s in stories:
        path = f"/news/{s['slug']}/"
        img = f"/assets/img/news-{s['slug']}.webp"
        paras = "".join(f"<p>{e(p)}</p>" for p in s["body"])
        rel = [gmap[r] for r in s.get("related", []) if r in gmap]
        rel_html = ("<h2>Play something while you read</h2><ul>" + "".join(
            f'<li><a href="/games/{g["slug"]}/">{e(g["name"])}</a>: {e(g["genre"].lower())}</li>' for g in rel) + "</ul>") if rel else ""
        body = f"""<div class="layout"><article class="prose">
<span class="tag">{e(SITE['news_brand'])}</span>
<h1>{e(s['title'])}</h1>
<p class="meta">Published {fmt_date(s['date'])} by {e(SITE['author'])}</p>
<p class="answer">{e(s['summary'])}</p>
{paras}
<div class="source-box"><strong>Source:</strong> <a href="{e(s['source_url'])}" rel="noopener">{e(s['source_name'])}</a></div>
<p class="meta">Tags: {e(', '.join(s['tags']))}</p>
{ad('mid')}
{rel_html}
<p><a href="/news/">More gaming news</a></p>
</article><aside><div class="sticky">{ad('sidebar')}</div></aside></div>"""
        na = article_ld(s["title"], s["summary"], path, img, s["date"], "NewsArticle")
        na["isBasedOn"] = s["source_url"]
        out(f"news/{s['slug']}/index.html", page(path, s["title"], s["summary"], body,
            crumbs=[("Home", "/"), ("News", "/news/"), (s["title"], path)], lds=[na], img=img, og_type="article", nav="news"))
    items = "".join(
        f'<li><span class="meta">{fmt_date(s["date"])} &middot; {e(", ".join(s["tags"]))}</span><br>'
        f'<a class="title" href="/news/{s["slug"]}/">{e(s["title"])}</a><p>{e(s["summary"])}</p></li>' for s in stories)
    desc = "Short, sourced write-ups on the gaming industry, indie games and browser games, with links to every original source."
    body = f"""<h1>{e(SITE['news_brand'])}: gaming, indie and browser game news</h1>
<p class="lede answer">{e(SITE['news_brand'])} covers gaming industry, indie and browser game news in short, original write-ups. Every story says what happened, why it matters and links to its source.</p>
<ul class="news-list">{items}</ul>
{ad('end')}
<p>Follow along with the <a href="/news/feed.json">JSON Feed</a> or <a href="/rss.xml">RSS</a>.</p>"""
    out("news/index.html", page("/news/", f"{SITE['news_brand']}: gaming and indie game news", desc, body,
        crumbs=[("Home", "/"), ("News", "/news/")], lds=[article_ld(SITE["news_brand"], desc, "/news/", "/assets/img/news.webp")],
        img="/assets/img/news.webp", nav="news"))
    feed = {"version": "https://jsonfeed.org/version/1.1", "title": f"{SITE['news_brand']} ({SITE['name']})",
            "home_page_url": SITE["url"] + "/news/", "feed_url": SITE["url"] + "/news/feed.json", "description": desc,
            "language": "en", "icon": SITE["url"] + "/assets/img/og-default.webp",
            "authors": [{"name": SITE["author"], "url": SITE["author_url"]}],
            "items": [{"id": SITE["url"] + f"/news/{s['slug']}/", "url": SITE["url"] + f"/news/{s['slug']}/",
                       "title": s["title"], "summary": s["summary"],
                       "content_text": "\n\n".join(s["body"]) + f"\n\nSource: {s['source_name']} {s['source_url']}",
                       "external_url": s["source_url"], "image": SITE["url"] + f"/assets/img/news-{s['slug']}.webp",
                       "date_published": s["date"] + "T12:00:00Z", "tags": s["tags"]} for s in stories]}
    out("news/feed.json", json.dumps(feed, indent=2, ensure_ascii=False))
    rss_items = "".join(f"""<item><title>{e(s['title'])}</title><link>{SITE['url']}/news/{s['slug']}/</link><guid>{SITE['url']}/news/{s['slug']}/</guid>
<pubDate>{format_datetime(datetime.strptime(s['date'] + ' 12:00', '%Y-%m-%d %H:%M').replace(tzinfo=timezone.utc))}</pubDate><description>{e(s['summary'])}</description></item>
""" for s in stories)
    out("rss.xml", f"""<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"><channel><title>{e(SITE['news_brand'])}</title><link>{SITE['url']}/news/</link><description>{e(desc)}</description><language>en</language>
{rss_items}</channel></rss>
""")


def build_static(games, stories):
    # Home
    latest = "".join(f'<li><span class="meta">{fmt_date(s["date"])}</span><br><a class="title" href="/news/{s["slug"]}/">{e(s["title"])}</a></li>' for s in stories[:4])
    desc = "Play free original browser games: word puzzles, match-three, a runner, block puzzle, solitaire, tower defense and more. No download, works on phones."
    body = f"""<h1>Free browser games you can finish on a lunch break</h1>
<p class="lede answer">{e(SITE['name'])} is a collection of {len(games)} free, original games that run in your browser on desktop and mobile. No download, no account. Each round takes a few minutes and your best score is saved on your device.</p>
<h2>Pick a game</h2>
<div class="grid">{''.join(game_card(g) for g in games)}</div>
{ad('intro')}
<h2>Latest from {e(SITE['news_brand'])}</h2>
<ul class="news-list">{latest}</ul>
<p><a href="/news/">All gaming news</a></p>
<div class="prose">
<h2>Are these games really free?</h2>
<p>Yes. Every game is free to play with no sign-up. The site is supported by ads placed outside the play area, never on top of a game and never before you press Play.</p>
<h2>Do the games work on phones and tablets?</h2>
<p>Yes. Every game has touch controls and resizes to fit your screen. Keyboard controls work on desktop.</p>
<h2>Where are high scores stored?</h2>
<p>In your own browser's local storage. Nothing is sent to a server, and clearing site data resets them.</p>
</div>
{more_from_sam()}"""
    out("index.html", page("/", SITE["name"], desc, body, lds=[article_ld(SITE["name"], desc, "/", "/assets/img/og-default.webp"),
        {"@context": "https://schema.org", "@type": "ItemList", "itemListElement": [
            {"@type": "ListItem", "position": i + 1, "url": SITE["url"] + f"/games/{g['slug']}/", "name": g["name"]} for i, g in enumerate(games)]}]))
    # Games index
    gd = "All free games on Lunchbreak Arcade: word, puzzle, arcade, card, typing, reaction and strategy games that run in your browser."
    out("games/index.html", page("/games/", "All free browser games", gd,
        f"""<h1>All games</h1><p class="lede answer">There are {len(games)} free games here, each original and playable in any modern browser on desktop or mobile.</p>
<div class="grid">{''.join(game_card(g) for g in games)}</div>{ad('end')}{more_from_sam()}""",
        crumbs=[("Home", "/"), ("Games", "/games/")], lds=[article_ld("All games", gd, "/games/", "/assets/img/og-default.webp")], nav="games"))

    def simple(path, title, desc, inner, nav=""):
        out(path.strip("/") + "/index.html", page(path, title, desc, f'<article class="prose"><h1>{e(title)}</h1>{inner}</article>',
            crumbs=[("Home", "/"), (title, path)], lds=[article_ld(title, desc, path, "/assets/img/og-default.webp")], nav=nav))

    simple("/about/", "About Lunchbreak Arcade", "Who makes Lunchbreak Arcade, how the games are made and how the site is funded.", f"""
<p class="answer">{e(SITE['name'])} is a small collection of free, original browser games run by {e(SITE['author'])}. The games are short, work on phones and desktops, and need no download or account.</p>
<h2>Who makes the games?</h2>
<p>The site is owned and run by <a href="{SITE['author_url']}">{e(SITE['author'])}</a>. Every game here was written for this site in plain JavaScript and HTML canvas. Genres are familiar (word puzzles, match-three, solitaire, tower defense), but the names, art, rules details and levels are original.</p>
<h2>How is the site funded?</h2>
<p>Through display advertising. Ads sit outside the play area, never cover a game and never block input. There are no ads before you press Play.</p>
<h2>What is {e(SITE['news_brand'])}?</h2>
<p>The site's news section: short write-ups on gaming industry, indie and browser game news. Each story links to its original source, and nothing is reported that the source does not support.</p>
<h2>Part of a network</h2>
<p>{e(SITE['name'])} is one of several sites on samcbarth.com, listed in the footer of every page.</p>
<h2>How can I get in touch?</h2>
<p>Use the <a href="/contact/">contact page</a> for bug reports, game ideas or corrections to a news story.</p>""", "about")
    if SITE["hubspot_form_id"]:
        form = (f'<div id="hs-form"></div><script src="https://js.hsforms.net/forms/embed/v2.js"></script><script>'
                f'hbspt.forms.create({{region:"na1",portalId:"{SITE["hubspot_portal"]}",formId:"{SITE["hubspot_form_id"]}",target:"#hs-form"}});</script>')
    else:
        form = f'<p><a class="btn" href="mailto:{SITE["contact_email"]}?subject=Lunchbreak%20Arcade">Email {e(SITE["contact_email"])}</a></p>'
    simple("/contact/", "Contact", "Contact Lunchbreak Arcade about bugs, game ideas, news corrections or advertising.", f"""
<p class="answer">The fastest way to reach {e(SITE['name'])} is by email. Bug reports, game ideas and news corrections are all welcome.</p>
{form}
<h2>What should a bug report include?</h2>
<p>The game name, your device and browser, and what happened just before the problem. A screenshot helps.</p>
<h2>Found a mistake in a news story?</h2>
<p>Send the story link and the correction with a source. Confirmed errors are fixed and noted on the story.</p>""")
    simple("/privacy/", "Privacy Policy", "How Lunchbreak Arcade uses cookies, Google advertising, analytics and local storage.", f"""
<p class="meta">Last updated {BUILD_TIME.strftime('%B %d, %Y')}</p>
<p class="answer">{e(SITE['name'])} ({SITE['domain']}) does not ask you to create an account and does not collect your name or email unless you email us. It uses cookies and similar technologies for analytics and advertising, as described below.</p>
<h2>What does the site store on my device?</h2>
<p>Games save your best score and your light or dark theme choice in your browser's local storage. This stays on your device and is not sent to us.</p>
<h2>Analytics</h2>
<p>We use Google Tag Manager and Google Analytics to understand which pages are visited and how the site performs. These tools set cookies and collect information such as pages viewed, approximate location, device and browser type. See <a href="https://policies.google.com/technologies/partner-sites" rel="noopener">how Google uses information from sites that use its services</a>.</p>
<h2>Advertising and Google AdSense</h2>
<p>We use or plan to use Google AdSense to show ads. Third-party vendors, including Google, use cookies to serve ads based on your prior visits to this and other websites. Google's use of advertising cookies enables it and its partners to serve ads based on your visits to this site and other sites on the internet. You can opt out of personalized advertising at <a href="https://adssettings.google.com/" rel="noopener">Google Ads Settings</a> or <a href="https://www.aboutads.info/choices/" rel="noopener">aboutads.info</a>. Where required by law, you will be asked for consent before personalized ads are shown.</p>
<h2>Affiliate links</h2>
<p>This site does not currently use affiliate links. If it does in the future, those links will be labeled, and we may earn a commission when you buy through them at no extra cost to you.</p>
<h2>Children</h2>
<p>The site is meant for a general audience and is not directed at children under 13. We do not knowingly collect personal information from children.</p>
<h2>Your choices</h2>
<p>You can block or delete cookies in your browser settings, and clear local storage to remove saved scores. Contact us through the <a href="/contact/">contact page</a> with any privacy question.</p>
<h2>Changes</h2>
<p>We may update this policy. The date at the top shows the latest version.</p>""")
    simple("/terms/", "Terms of Use", "Terms for using Lunchbreak Arcade games and content.", f"""
<p class="meta">Last updated {BUILD_TIME.strftime('%B %d, %Y')}</p>
<p class="answer">By using {e(SITE['name'])} you agree to these terms. The games are free for personal entertainment and are provided as they are.</p>
<h2>Use of the games and content</h2>
<p>You may play the games and read the content for personal, non-commercial use. The games, artwork, code and text on this site are owned by {e(SITE['author'])}. Do not copy, re-host or embed them elsewhere without written permission.</p>
<h2>News content</h2>
<p>News stories are original summaries that link to their sources. Third-party names and trademarks belong to their owners and are used only to identify them.</p>
<h2>No warranty</h2>
<p>The site and games are provided without warranties of any kind. We are not liable for any loss arising from use of the site, to the extent the law allows.</p>
<h2>Third-party links and ads</h2>
<p>Links and ads may lead to sites we do not control. Their terms and privacy policies apply there.</p>
<h2>Changes</h2>
<p>We may change these terms at any time. Continued use after a change means you accept the new terms.</p>
<h2>Contact</h2>
<p>Questions about these terms can be sent through the <a href="/contact/">contact page</a>.</p>""")
    out("404.html", page("/404.html", "Page not found", "This page does not exist.",
        '<h1>Page not found</h1><p class="lede">That page is not here. Try one of the games instead.</p><div class="grid">'
        + "".join(game_card(g) for g in games[:4]) + "</div>"))
    # sitemap / robots / llms / misc
    urls = ["/", "/games/", "/news/", "/about/", "/contact/", "/privacy/", "/terms/"] + [f"/games/{g['slug']}/" for g in games] + [f"/news/{s['slug']}/" for s in stories]
    today = BUILD_TIME.strftime("%Y-%m-%d")
    out("sitemap.xml", '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' + "".join(
        f"<url><loc>{SITE['url']}{u}</loc><lastmod>{today}</lastmod></url>\n" for u in urls) + "</urlset>\n")
    out("robots.txt", f"User-agent: *\nAllow: /\n\nSitemap: {SITE['url']}/sitemap.xml\n")
    out("llms.txt", f"# {SITE['name']}\n\n> {SITE['tagline']} {len(games)} original HTML5 games that run in any browser, plus {SITE['news_brand']}, short sourced gaming news.\n\n"
        "## Games\n" + "".join(f"- [{g['name']}]({SITE['url']}/games/{g['slug']}/): {g['short']}\n" for g in games)
        + f"\n## News\n- [{SITE['news_brand']}]({SITE['url']}/news/): gaming industry, indie and browser game news\n- [JSON Feed]({SITE['url']}/news/feed.json)\n"
        + "".join(f"- [{s['title']}]({SITE['url']}/news/{s['slug']}/)\n" for s in stories)
        + f"\n## About\n- [About]({SITE['url']}/about/)\n- [Contact]({SITE['url']}/contact/)\n- [Privacy]({SITE['url']}/privacy/)\n- [Terms]({SITE['url']}/terms/)\n")
    out("CNAME", SITE["domain"] + "\n")
    out(".nojekyll", "")


def main():
    with open(os.path.join(ROOT, "content/games.json"), encoding="utf-8") as f:
        games = json.load(f)
    stories = []
    for p in glob.glob(os.path.join(ROOT, "content/news/*.json")):
        with open(p, encoding="utf-8") as f:
            stories.append(json.load(f))
    stories.sort(key=lambda s: (s["date"], s["slug"]), reverse=True)
    make_images(games, stories)
    for g in games:
        build_game(g, games, stories)
    build_news(stories, games)
    build_static(games, stories)
    print(f"Built {len(games)} games, {len(stories)} news stories.")


if __name__ == "__main__":
    main()
