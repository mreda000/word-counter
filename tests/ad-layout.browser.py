"""Layout regression tests with mocked ads only. No calls to Google's ad servers.
Run: pip install playwright && playwright install chromium
     python tests/ad-layout.browser.py
Offline DOM fixtures reproduce the main-container widths, not full games.
CSS loading is simulated; the placement source itself is evaluated unchanged.
"""
import json
import os
from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
WIDTHS = [320, 375, 390, 414, 600, 768, 820, 1024, 1280, 1366, 1500,
          1699, 1700, 1719, 1720, 1795, 1796, 1800, 1920, 2050, 2560]
PAGES = ['/', '/index.html', '/tools', '/games', '/word-counter', '/image-compressor',
         '/qr-code-generator', '/grade-calculator', '/random-team-generator',
         '/gaming-name-generator', '/blog', '/blog-analyze-text', '/faq', '/how-to-use',
         '/image-to-text', '/pdf-merger', '/focus-timer', '/percentage-calculator',
         '/aim-trainer', '/pet-the-chicken', '/typing-game', '/daily-word',
         '/reaction-time', '/word-scramble', '/spin-the-wheel', '/arcade', '/About']
STUB = """window.testAdRequests = 0; window.adsbygoogle = {push() {
 const ad = [...document.querySelectorAll('ins.adsbygoogle')].find(x => !x.dataset.testFilled);
 if (!ad) throw Error('Duplicate ad initialization');
 if (ad.getBoundingClientRect().width <= 0) throw Error('Requested hidden or zero-width ad');
 ad.dataset.testFilled = 'true'; ad.dataset.adStatus = 'filled';
 const iframe = document.createElement('iframe'); iframe.title = 'Mock advertisement';
 iframe.style.cssText = 'display:block;border:0;width:100%;height:' +
   (ad.closest('[data-ct-ad-position=bottom]') ? '100px' : '600px');
 iframe.srcdoc = '<body style="margin:0;font:14px Arial;background:#ddd;display:grid;place-items:center;height:100vh">Test advertisement</body>';
 ad.append(iframe); window.testAdRequests++;
}};"""


def fixture(path, existing_loader=False, short=False, optout=False):
    maxwidth = 1320 if 'aim-trainer' in path else 1120
    return f'''<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1">
<style>:root{{--muted:#666;--surface:#fff;--line:#ddd}}*{{box-sizing:border-box}}body{{margin:0;font:16px Arial}}header{{height:72px;background:#eee}}main{{position:relative;max-width:{maxwidth}px;width:calc(100% - 32px);min-height:{500 if short else 900}px;margin:auto;background:#f7f7f7}}.controls{{position:absolute;bottom:0;left:0;right:0;height:44px;background:#bde}}footer{{height:90px;background:#eee}}.ambient{{display:none}}</style>
{'<script src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-4432960986920022"></script>' if existing_loader else ''}
</head><body {'data-ads="off"' if optout else ''}><div id="ambient" class="ambient"></div><header><button id="themeToggle">Theme</button></header><main><h1>Layout test: {path}</h1><div class="controls"><button>Game / download control</button></div></main><footer><span id="year"></span>Footer</footer><script src="/site.js"></script></body></html>'''


def main():
    with sync_playwright() as pw:
        system = '/usr/bin/chromium'
        args = {'executable_path': system} if os.path.exists(system) else {}
        browser = pw.chromium.launch(headless=True, **args)
        errors = []
        fixture_options = {}
        cases = []
        page = None
        def visit(path, width):
            nonlocal page
            if page is not None:
                page.close()
            page = browser.new_page(viewport={'width': width, 'height': 900})
            page.on('pageerror', lambda error: errors.append(str(error)))
            page.route('**/*', lambda route: route.abort())
            html = fixture(path, **fixture_options).replace('<script src="/site.js"></script>', '')
            # No navigation or network is needed: embed CSS and simulate load
            # callbacks while evaluating the unchanged placement code in a
            # function whose location argument provides the fixture pathname.
            html = html.replace('<script src="https://', '<script type="text/plain" src="https://')
            page.set_content(html)
            page.add_style_tag(content=(ROOT/'ad-layout.css').read_text())
            page.evaluate(STUB)
            page.evaluate("""() => {
              const append = document.head.append.bind(document.head);
              document.head.append = function(node) {
                if (node.tagName === 'SCRIPT') node.type='text/plain';
                append(node);
                if (node.tagName === 'LINK' && node.dataset.ctAdStyles !== undefined) {
                  node.removeAttribute('href');
                  queueMicrotask(() => node.onload());
                }
              };
            }""")
            source = (ROOT/'ad-layout.js').read_text()
            page.evaluate('(location) => {' + source + '}', {'pathname':path})
            page.wait_for_timeout(30)
            page.wait_for_function('window.__ctAdLayoutStarted === true')

        def measure():
            return page.evaluate('''() => {
              const rect = el => {const r=el.getBoundingClientRect();return {left:r.left,right:r.right,top:r.top,bottom:r.bottom,width:r.width,height:r.height};};
              return {main:rect(document.querySelector('main')), footer:rect(document.querySelector('footer')),
                vw:document.documentElement.clientWidth, scroll:document.documentElement.scrollWidth,
                requests:window.testAdRequests,
                loaders:document.querySelectorAll('script[src*="pagead2.googlesyndication.com/pagead/js/adsbygoogle.js"]').length,
                ads:[...document.querySelectorAll('.ct-ad-placement:not([hidden])')].map(el=>({pos:el.dataset.ctAdPosition,outer:rect(el),panel:rect(el.querySelector('.ct-ad-panel')),ad:el.querySelector('ins')?rect(el.querySelector('ins')):null}))};
            }''')

        def check_layout(m):
            assert m['scroll'] <= m['vw'] + 1, m
            bottom = [a for a in m['ads'] if a['pos'] == 'bottom']
            assert len(bottom) == 1, m
            assert bottom[0]['panel']['top'] - m['main']['bottom'] >= 159.9, m
            assert bottom[0]['panel']['bottom'] <= m['footer']['top'], m
            for a in m['ads']:
                assert a['panel']['left'] >= 0 and a['panel']['right'] <= m['vw'] + .1, m
                if a['pos'] == 'side-left':
                    assert m['main']['left'] - a['panel']['right'] >= 159.9, m
                if a['pos'] == 'side-right':
                    assert a['panel']['left'] - m['main']['right'] >= 159.9, m
                if a['pos'] != 'bottom':
                    assert a['panel']['bottom'] <= m['main']['bottom'], m
            assert m['loaders'] == 1, m

        # Full screen-width matrix on standard and wide gameplay main layouts.
        for path in ['/tools', '/aim-trainer']:
            for width in WIDTHS:
                visit(path, width)
                page.wait_for_function('document.querySelector(".ct-ad-placement--bottom ins") !== null')
                m = measure(); check_layout(m)
                cases.append({'path': path, 'width': width, 'ads': len(m['ads'])})
        # Every existing public content route, plus extension and trailing-slash forms.
        for path in PAGES + ['/pdf-merger.html', '/pdf-merger/', '/index']:
            for width in [390, 2050]:
                visit(path, width); page.wait_for_function('window.testAdRequests >= 1')
                m = measure(); check_layout(m)
                cases.append({'path':path, 'width':width, 'ads':len(m['ads'])})
        # Existing loader must not be duplicated.
        fixture_options['existing_loader'] = True
        visit('/tools', 1920); page.wait_for_function('window.testAdRequests === 3'); check_layout(measure())
        fixture_options.clear()
        # No requests on account/privacy/credits, or an explicit opt-out.
        for path in ['/account', '/account.html', '/Privacy', '/Privacy.html', '/tool-credits', '/404', '/vendor/example', '/private/example']:
            visit(path, 2050)
            assert measure()['requests'] == 0 and measure()['loaders'] == 0, path
        fixture_options['optout'] = True
        visit('/tools', 2050); assert measure()['requests'] == 0
        fixture_options.clear()
        # Resizing changes visible rails, never recreates/re-requests units.
        visit('/tools', 390); page.wait_for_function('window.testAdRequests === 1')
        for width, expected in [(2050,3),(1700,3),(390,3),(2050,3)]:
            page.set_viewport_size({'width':width,'height':900}); page.wait_for_timeout(80)
            m=measure(); check_layout(m); assert m['requests']==expected, m
        # Dynamic main expansion hides rails instead of covering content.
        page.evaluate("document.querySelector('main').style.maxWidth='none'")
        page.wait_for_timeout(80); assert len(measure()['ads']) == 1
        # Pointer-locked gameplay and fullscreen hide side ads.
        visit('/aim-trainer', 2050); page.wait_for_function('window.testAdRequests === 3')
        for attr, event in [('pointerLockElement','pointerlockchange'), ('fullscreenElement','fullscreenchange')]:
            page.evaluate('''([a,e])=>{Object.defineProperty(document,a,{configurable:true,get:()=>document.querySelector('main')});document.dispatchEvent(new Event(e));}''',[attr,event])
            page.wait_for_timeout(50); assert len(measure()['ads'])==1
            page.evaluate('''([a,e])=>{Object.defineProperty(document,a,{configurable:true,get:()=>null});document.dispatchEvent(new Event(e));}''',[attr,event])
        # Short content must not put a tall side ad into the footer.
        fixture_options['short'] = True
        visit('/tools', 2050); page.wait_for_function('window.testAdRequests === 1')
        assert len(measure()['ads']) == 1
        fixture_options.clear()
        # Unfilled placements collapse without a retry.
        visit('/tools', 2050); page.wait_for_function('window.testAdRequests === 3')
        page.evaluate("document.querySelector('[data-ct-ad-position=bottom] ins').dataset.adStatus='unfilled'")
        page.wait_for_timeout(80)
        assert not any(a['pos']=='bottom' for a in measure()['ads'])
        assert measure()['requests']==3
        # Sample screenshots show test rectangles, not real ads.
        shots = ROOT / 'test-output'; shots.mkdir(exist_ok=True)
        for w, name in [(390,'mobile'),(820,'tablet'),(1920,'desktop')]:
            visit('/tools',w); page.wait_for_function('window.testAdRequests >= 1')
            page.screenshot(path=str(shots / f'{name}.png'),full_page=True)
        assert not errors, errors
        result={'status':'passed','viewport_cases':len(cases),'widths':WIDTHS,
                'additional_checks':['exclusions','loader deduplication','resize without repeat requests','dynamic content expansion','pointer lock/fullscreen','short content','unfilled collapse'],
                'scope':'Chromium fixtures with mocked ads; no live ad serving or account verification',
                'page_errors':errors,'cases':cases}
        (shots/'results.json').write_text(json.dumps(result,indent=2))
        print(json.dumps({k:v for k,v in result.items() if k!='cases'},indent=2))
        browser.close()

if __name__=='__main__':
    main()
