#!/usr/bin/env python3
"""GetCited authenticated QA harness.

Creates (idempotently) a QA user via the Supabase admin API, signs in with the
password grant, injects the @supabase/ssr session cookie into headless Chromium,
and screenshots every page. Secrets come from the repo's .env.local and are
never printed.

Usage: qa_browser.py [--base http://localhost:3210] [--out /tmp/getcited-shots]
"""
import base64, json, os, ssl, sys, urllib.request, urllib.error, argparse

REPO = "/Users/anandpareek/Documents/Projects/GetCited"
QA_EMAIL = "qa-harness@getcited.local"
QA_PASSWORD = "Qa-harness-2026-getcited!"

def env_local():
    env = {}
    for line in open(os.path.join(REPO, ".env.local")):
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        k, v = line.split("=", 1)
        v = v.strip()
        if len(v) >= 2 and v[0] == v[-1] and v[0] in "\"'":
            v = v[1:-1]
        env[k.strip()] = v
    return env

def req(url, method="GET", body=None, headers=None):
    r = urllib.request.Request(url, method=method,
        data=json.dumps(body).encode() if body is not None else None,
        headers={"Content-Type": "application/json", **(headers or {})})
    try:
        with urllib.request.urlopen(r) as resp:
            return resp.status, json.loads(resp.read() or b"{}")
    except urllib.error.HTTPError as e:
        return e.code, json.loads(e.read() or b"{}")

def get_session(env):
    sb, service, anon = env["NEXT_PUBLIC_SUPABASE_URL"].rstrip("/"), env["SUPABASE_SERVICE_ROLE_KEY"], env["NEXT_PUBLIC_SUPABASE_ANON_KEY"]
    admin = {"Authorization": f"Bearer {service}", "apikey": service}
    # idempotent create (422/400 if exists — fine)
    code, out = req(f"{sb}/auth/v1/admin/users", "POST",
                    {"email": QA_EMAIL, "password": QA_PASSWORD, "email_confirm": True}, admin)
    print(f"create qa user: HTTP {code}", file=sys.stderr)
    code, sess = req(f"{sb}/auth/v1/token?grant_type=password", "POST",
                     {"email": QA_EMAIL, "password": QA_PASSWORD},
                     {"apikey": anon})
    if code != 200:
        print(f"FATAL: password grant HTTP {code}: {sess.get('error_description') or sess.get('msg')}", file=sys.stderr)
        sys.exit(1)
    return sess

def session_cookies(env, sess, domain):
    """Reproduce @supabase/ssr cookie encoding: base64url JSON, chunked at 3180."""
    ref = env["NEXT_PUBLIC_SUPABASE_URL"].split("//")[1].split(".")[0]
    name = f"sb-{ref}-auth-token"
    payload = "base64-" + base64.urlsafe_b64encode(
        json.dumps(sess, separators=(",", ":")).encode()).decode().rstrip("=")
    CHUNK = 3180
    if len(payload) <= CHUNK:
        pairs = [(name, payload)]
    else:
        pairs = [(f"{name}.{i}", payload[i*CHUNK:(i+1)*CHUNK])
                 for i in range((len(payload) + CHUNK - 1) // CHUNK)]
    return [{"name": n, "value": v, "domain": domain, "path": "/",
             "httpOnly": False, "secure": False, "sameSite": "Lax"} for n, v in pairs]

PAGES = ["/", "/login", "/configure", "/assistant", "/connector", "/tracker", "/dashboard"]

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--base", default="http://localhost:3210")
    ap.add_argument("--out", default="/tmp/getcited-shots")
    ap.add_argument("--pages", default=",".join(PAGES))
    ap.add_argument("--width", type=int, default=1440)
    ap.add_argument("--height", type=int, default=900)
    ap.add_argument("--full", action="store_true", help="full-page screenshots")
    args = ap.parse_args()
    os.makedirs(args.out, exist_ok=True)

    if "SSL_CERT_FILE" not in os.environ:
        os.environ["SSL_CERT_FILE"] = "/Users/anandpareek/Documents/SEO content Skill/scripts/system-ca-bundle.pem"

    env = env_local()
    sess = get_session(env)
    domain = args.base.split("//")[1].split(":")[0]
    cookies = session_cookies(env, sess, domain)
    print(f"session ok, {len(cookies)} cookie chunk(s)", file=sys.stderr)

    from playwright.sync_api import sync_playwright
    with sync_playwright() as p:
        browser = p.chromium.launch(executable_path=
            "/Users/anandpareek/Library/Caches/ms-playwright/chromium_headless_shell-1228/"
            "chrome-headless-shell-mac-arm64/chrome-headless-shell")
        ctx = browser.new_context(viewport={"width": args.width, "height": args.height})
        ctx.add_cookies(cookies)
        page = ctx.new_page()
        errors = []
        page.on("console", lambda m: errors.append(m.text) if m.type == "error" else None)
        for path in args.pages.split(","):
            slug = path.strip("/").replace("/", "_") or "home"
            page.goto(args.base + path, wait_until="networkidle", timeout=45000)
            page.wait_for_timeout(600)
            page.screenshot(path=os.path.join(args.out, f"{slug}.png"), full_page=args.full)
            print(f"{path} -> {page.url} [{slug}.png]")
        browser.close()
        if errors:
            print("\nCONSOLE ERRORS:")
            for e in errors[:20]:
                print(" -", e[:200])

if __name__ == "__main__":
    main()
