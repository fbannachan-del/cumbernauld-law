"""Screenshot the built site for review. Usage: python3 tools/shoot.py [outdir]
Starts a local static server on site/, captures desktop and phone views and key interactions."""
import os, sys, subprocess, time, json
from playwright.sync_api import sync_playwright

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SITE = os.path.join(ROOT, 'site')
OUT = sys.argv[1] if len(sys.argv) > 1 else os.path.join(ROOT, 'review')
os.makedirs(OUT, exist_ok=True)
PORT = 8765

server = subprocess.Popen([sys.executable, '-m', 'http.server', str(PORT), '--bind', '127.0.0.1'], cwd=SITE,
                          stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
time.sleep(0.8)
base = f'http://127.0.0.1:{PORT}/'
console = []
proxy = os.environ.get('HTTPS_PROXY')

try:
    with sync_playwright() as p:
        launch = {'args': ['--disable-dev-shm-usage']}
        if proxy:
            launch['proxy'] = {'server': proxy, 'bypass': '127.0.0.1,localhost'}
        browser = p.chromium.launch(**launch)

        def shoot(name, width, height, actions=None, full=True, mobile=False):
            ctx = browser.new_context(viewport={'width': width, 'height': height}, device_scale_factor=1,
                                      is_mobile=mobile, has_touch=mobile)
            page = ctx.new_page()
            page.on('console', lambda m: console.append({'shot': name, 'type': m.type, 'text': m.text}))
            page.on('pageerror', lambda e: console.append({'shot': name, 'type': 'pageerror', 'text': str(e)}))
            page.goto(base, wait_until='networkidle', timeout=30000)
            page.wait_for_timeout(900)
            if actions:
                actions(page)
                page.wait_for_timeout(900)
            page.screenshot(path=os.path.join(OUT, name + '.png'), full_page=full)
            ctx.close()

        # Desktop
        shoot('desktop-hero', 1440, 900, full=False)
        shoot('desktop-full', 1440, 900)
        def open_service(page):
            page.click('#svc-family-law'); page.wait_for_timeout(700)
            page.evaluate("document.querySelector('#services').scrollIntoView()")
        shoot('desktop-service-open', 1440, 900, open_service, full=False)
        def open_person(page):
            page.evaluate("document.querySelector('#people').scrollIntoView()")
            page.click('#person-sharon-gardner'); page.wait_for_timeout(800)
            page.evaluate("window.scrollBy(0, 260)")
        shoot('desktop-person-open', 1440, 900, open_person, full=False)
        def support_tab(page):
            page.evaluate("document.querySelector('#people').scrollIntoView()")
            page.click('#tab-support'); page.wait_for_timeout(300)
        shoot('desktop-support-tab', 1440, 900, support_tab, full=False)
        def scrolled(page):
            page.evaluate("document.querySelector('#about').scrollIntoView()")
        shoot('desktop-header-solid', 1440, 900, scrolled, full=False)
        def contact(page):
            page.evaluate("document.querySelector('#contact').scrollIntoView()")
        shoot('desktop-contact', 1440, 900, contact, full=False)
        def hover(page):
            page.mouse.move(1000, 450); page.wait_for_timeout(200); page.mouse.move(1050, 480); page.wait_for_timeout(400)
        shoot('desktop-hero-hover', 1440, 900, hover, full=False)

        # Phone
        shoot('phone-hero', 390, 844, full=False, mobile=True)
        shoot('phone-full', 390, 844, mobile=True)
        def menu(page):
            page.click('.menu-toggle'); page.wait_for_timeout(300)
        shoot('phone-menu', 390, 844, menu, full=False, mobile=True)
        def phone_service(page):
            page.evaluate("document.querySelector('#services').scrollIntoView()")
            page.click('#svc-private-client'); page.wait_for_timeout(800)
        shoot('phone-service-open', 390, 844, phone_service, full=False, mobile=True)

        # Tablet
        shoot('tablet-full', 820, 1180)

        # Legal page
        ctx = browser.new_context(viewport={'width': 1440, 'height': 900})
        page = ctx.new_page()
        page.on('console', lambda m: console.append({'shot': 'legal', 'type': m.type, 'text': m.text}))
        page.goto(base + 'legal/privacy.html', wait_until='networkidle')
        page.wait_for_timeout(600)
        page.screenshot(path=os.path.join(OUT, 'legal-privacy.png'), full_page=True)
        ctx.close()
        browser.close()
finally:
    server.terminate()

with open(os.path.join(OUT, 'console.json'), 'w') as f:
    json.dump(console, f, indent=1)
print('shots in', OUT)
print('console messages:', len(console))
for c in console:
    if c['type'] in ('error', 'warning', 'pageerror'):
        print(' ', c['shot'], c['type'], c['text'][:200])
