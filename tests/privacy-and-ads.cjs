/* Local Chromium checks. All external resources are blocked; ads are mocked. */
// npm install --no-save playwright; npx playwright install chromium
// Optional: CHROME_PATH can select an existing Chrome installation.
const {chromium} = require('playwright');
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..');
async function main() {
  const browser = await chromium.launch({...(process.env.CHROME_PATH ? {executablePath:process.env.CHROME_PATH} : {}), headless:true});
  const context = await browser.newContext();
  const requests = [];
  const output = path.join(root, 'test-output'); fs.mkdirSync(output,{recursive:true});
  const errors = [];
  await context.route('**/*', async route => {
    const url = new URL(route.request().url());
    if (url.hostname !== 'chickentask.test') {requests.push(url.href); return route.abort();}
    let filename = decodeURIComponent(url.pathname).slice(1) || 'index.html';
    if (!path.extname(filename)) filename += '.html';
    const full = path.resolve(root, filename);
    if (!full.startsWith(root + path.sep) || !fs.existsSync(full)) return route.abort();
    const contentType = filename.endsWith('.js') ? 'text/javascript' : filename.endsWith('.css') ? 'text/css' : 'text/html';
    await route.fulfill({body:fs.readFileSync(full),contentType});
  });
  const page = await context.newPage();
  page.on('pageerror', err => errors.push(err.message));
  await page.addInitScript(() => {
    window.adsbygoogle = {push() {
      const unit = [...document.querySelectorAll('ins.adsbygoogle')].find(x=>!x.dataset.testRequested);
      if (!unit) throw Error('Duplicate unit request');
      unit.dataset.testRequested='true'; unit.dataset.adStatus='filled';
      unit.style.height=unit.closest('[data-ct-ad-position=bottom]')?'100px':'600px';
      unit.style.background='#ddd'; unit.textContent='Test advertisement';
    }};
  });
  await page.goto('https://chickentask.test/aim-trainer');
  await page.waitForSelector('[data-ct-ad-position=bottom] ins');
  assert(!requests.some(x=>x.includes('googletagmanager.com')), 'GA4 loaded before consent');
  const defaults=await page.evaluate(()=>Array.from(window.dataLayer[0]));
  assert.deepEqual(defaults.slice(0,2), ['consent','default']);
  for (const k of ['analytics_storage','ad_storage','ad_user_data','ad_personalization']) assert.equal(defaults[2][k],'denied');
  assert.equal(await page.locator('.game-guide').count(),1);
  await page.getByRole('button',{name:'Privacy choices',exact:true}).click();
  assert.equal(await page.locator('#ct-analytics-status').innerText(),'Optional analytics: off.');
  await page.getByRole('button',{name:'Allow analytics',exact:true}).click();
  await page.waitForFunction(()=>document.querySelector('script[src*="googletagmanager.com"]'));
  assert.equal(await page.locator('script[src*="googletagmanager.com"]').count(),1);
  await page.getByRole('button',{name:'Keep analytics off',exact:true}).click();
  assert.equal(await page.evaluate(()=>window['ga-disable-G-5ZKS0MWH8V']),true);
  await page.getByRole('button',{name:'Close',exact:true}).click();
  const before=requests.filter(x=>x.includes('googletagmanager.com')).length;
  await page.reload();
  await page.waitForSelector('.privacy-link');
  assert.equal(requests.filter(x=>x.includes('googletagmanager.com')).length,before,'Revoked consent did not persist');
  await page.evaluate(()=>localStorage.setItem('ct-analytics-consent-v1',JSON.stringify({allowed:true,time:Date.now()-181*86400000})));
  await page.reload(); await page.waitForSelector('.privacy-link');
  assert.equal(await page.evaluate(()=>ChickenTaskPrivacy.analyticsAllowed()),false,'Expired consent accepted');
  for (const width of [390,820,1500,2050,2560]) {
    await page.setViewportSize({width,height:900});
    await page.waitForTimeout(100);
    const m=await page.evaluate(()=>{
      const main=document.querySelector('main').getBoundingClientRect();
      const ads=[...document.querySelectorAll('.ct-ad-placement:not([hidden])')].map(e=>({pos:e.dataset.ctAdPosition,rect:e.querySelector('.ct-ad-panel').getBoundingClientRect().toJSON(),slot:e.querySelector('ins')?.dataset.adSlot}));
      return {main:main.toJSON(),ads,vw:document.documentElement.clientWidth,scroll:document.documentElement.scrollWidth};
    });
    assert(m.scroll<=m.vw+1,'Horizontal overflow at '+width);
    for (const ad of m.ads) {
      assert(ad.rect.left>=0 && ad.rect.right<=m.vw+1);
      if(ad.pos==='bottom'){assert(ad.rect.top-m.main.bottom>=159.9);assert.equal(ad.slot,'4877112993');}
      else {assert.equal(ad.slot,'4311141403');assert(ad.pos==='side-left'?m.main.left-ad.rect.right>=159.9:ad.rect.left-m.main.right>=159.9);}
    }
    if(width===390 || width===2050) await page.screenshot({path:path.join(output,'privacy-ads-'+width+'.png'),fullPage:true});
  }
  // All public HTML pages initialize privacy before any advertising loader.
  for (const name of ['aim-trainer','typing-game','daily-word','word-scramble','reaction-time','pet-the-chicken']) {
    assert(fs.readFileSync(path.join(root,name+'.html'),'utf8').includes('class="page-card game-guide"'),name+' missing guide');
  }
  let pages=0;
  for (const filename of fs.readdirSync(root).filter(x=>x.endsWith('.html'))) {
    const html=fs.readFileSync(path.join(root,filename),'utf8');
    if(!html.includes('<footer'))continue;
    assert(html.includes('/privacy.js?v=20261028'),filename+' missing privacy bootstrap');
    const ad=html.indexOf('<script async src="https://pagead2');
    if(ad>=0) assert(html.indexOf('/privacy.js?v=20261028')<ad,filename+' loads ads before consent defaults');
    pages++;
  }
  assert.deepEqual(errors,[]);
  console.log(JSON.stringify({status:'passed',publicPagesChecked:pages,widths:[390,820,1500,2050,2560],checks:['consent defaults before tags','no GA4 before opt-in','opt-in load once','revocation persistence','consent expiry','correct unit per placement','160px clearance','no horizontal overflow','six guides in HTML']}));
  await browser.close();
}
main().catch(err=>{console.error(err);process.exitCode=1});
