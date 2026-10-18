import {randomInt, entries, makeTeams, generateNames, testGrade, finalNeeded, weightedGrade, wifiPayload} from './tools-core.js';
const $ = id => document.getElementById(id);
const status = (text, error = false) => { $('toolStatus').textContent = text; $('toolStatus').classList.toggle('error', error); };
const run = action => async event => { event?.preventDefault(); try { status(''); await action(); } catch (error) { status(error.message || 'Something went wrong. Please try again.', true); } };
function element(tag, text, className) { const el = document.createElement(tag); if (text !== undefined) el.textContent = text; if (className) el.className = className; return el; }
async function copy(text) { try { await navigator.clipboard.writeText(text); status('Copied to clipboard.'); } catch { status('Clipboard is unavailable. Select the result and copy it manually.', true); } }
function read(key, fallback) { try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; } }
function save(key, value) { try { localStorage.setItem(key, JSON.stringify(value)); } catch { throw Error('Your browser could not save this. Storage may be full or disabled.'); } }
function download(blob, name) { const url = URL.createObjectURL(blob); const a = element('a'); a.href = url; a.download = name; document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 5000); }
const type = document.body.dataset.tool;

if (type === 'wheel') {
  const colors = ['#f3b544','#78b6e8','#b5a0e9','#80cbb9','#ed9f9c','#e9cb7b','#9db2cc','#c3d993'];
  let rotation = 0, busy = false, chosen = '', history = [];
  function draw() {
    const list = entries($('wheelEntries').value, 60); $('entryCount').textContent = `${list.length} entries · equal chances per entry`;
    const size = 360 / Math.max(1, list.length);
    $('wheelDisc').style.background = list.length ? `conic-gradient(${list.map((_, i) => `${colors[i % colors.length]} ${i * size}deg ${(i + 1) * size}deg`).join(',')})` : 'var(--input)';
    $('entryLegend').replaceChildren(...list.map((name, i) => { const chip = element('span'); const dot = element('i'); dot.style.background = colors[i % colors.length]; chip.append(dot, document.createTextNode(name)); return chip; }));
    return list;
  }
  function refreshSaved() {
    const values = read('ct-wheels', []); $('savedWheels').replaceChildren(element('option', 'Choose a saved wheel'));
    if (Array.isArray(values)) values.slice(0, 20).forEach((wheel, i) => { if (typeof wheel?.title === 'string' && typeof wheel?.text === 'string') { const opt = element('option', wheel.title); opt.value = String(i); $('savedWheels').append(opt); } });
  }
  const shared = new URLSearchParams(location.search).get('entries');
  if (shared) { try { if (shared.length > 5000) throw Error(); const parsed = JSON.parse(shared); if (!Array.isArray(parsed) || parsed.some(s => typeof s !== 'string')) throw Error(); entries(parsed.join('\n'), 60); $('wheelEntries').value = parsed.join('\n'); } catch { status('This shared wheel is invalid. Start with your own entries.', true); } }
  $('wheelEntries').addEventListener('input', run(draw)); draw(); refreshSaved();
  $('spinWheel').addEventListener('click', run(async () => {
    if (busy) return; const list = draw(); if (list.length < 2) throw Error('Add at least two entries to spin.');
    busy = true; $('spinWheel').disabled = true; $('wheelEntries').disabled = true; $('removeWinner').disabled = true;
    const index = randomInt(list.length), sector = 360 / list.length;
    const target = (360 - (index + .5) * sector) % 360;
    rotation += 5 * 360 + ((target - rotation % 360 + 360) % 360);
    $('wheelDisc').style.transform = `rotate(${rotation}deg)`; $('winner').textContent = 'Spinning…';
    await new Promise(resolve => setTimeout(resolve, matchMedia('(prefers-reduced-motion: reduce)').matches ? 100 : 3900));
    chosen = list[index]; $('winner').textContent = chosen; history.unshift(chosen); history = history.slice(0, 5); $('wheelHistory').textContent = `Recent picks: ${history.join(' · ')}`;
    busy = false; $('spinWheel').disabled = false; $('wheelEntries').disabled = false; $('removeWinner').disabled = false;
  }));
  $('removeWinner').addEventListener('click', run(() => { if (!chosen) return; const list = draw(); const index = list.indexOf(chosen); if (index < 0) throw Error('That winner is no longer in the list. Spin again.'); list.splice(index, 1); $('wheelEntries').value = list.join('\n'); chosen = ''; $('removeWinner').disabled = true; draw(); }));
  $('saveWheel').addEventListener('click', run(() => { draw(); const title = $('wheelTitle').value.trim().slice(0, 40); if (!title) throw Error('Give your wheel a name first.'); const wheels = read('ct-wheels', []); const safe = Array.isArray(wheels) ? wheels.filter(w => w?.title !== title) : []; safe.unshift({title, text: $('wheelEntries').value}); save('ct-wheels', safe.slice(0, 20)); refreshSaved(); status('Wheel saved on this browser.'); }));
  $('loadWheel').addEventListener('click', run(() => { const index = Number($('savedWheels').value); if ($('savedWheels').selectedIndex === 0) throw Error('Choose a saved wheel.'); const wheel = read('ct-wheels', [])[index]; entries(wheel.text, 60); $('wheelEntries').value = wheel.text; $('wheelTitle').value = wheel.title; draw(); status('Wheel loaded.'); }));
  $('shareWheel').addEventListener('click', run(() => { const list = draw(); if (list.length < 2) throw Error('Add at least two entries first.'); const url = new URL(location.pathname, location.origin); url.searchParams.set('entries', JSON.stringify(list)); if (url.href.length > 7000) throw Error('This list is too long to share as a link. Try fewer or shorter entries.'); copy(url.href); }));
}

if (type === 'teams') {
  let result = '';
  $('teamForm').addEventListener('submit', run(() => {
    const names = entries($('playerNames').value, 200), count = Number($('teamCount').value);
    const teams = makeTeams(names, count); $('teamResults').replaceChildren(); result = '';
    teams.forEach((team, i) => { const card = element('div', undefined, 'team-card'); card.append(element('h3', `Team ${i + 1}`)); const list = element('ol'); team.forEach((name, j) => list.append(element('li', name + ($('captains').checked && j === 0 ? ' · Captain' : '')))); card.append(list); $('teamResults').append(card); result += `Team ${i + 1}\n${team.map((name, j) => name + ($('captains').checked && j === 0 ? ' (Captain)' : '')).join('\n')}\n\n`; });
    $('teamsEmpty').hidden = true; $('teamOutputActions').hidden = false; status(`${names.length} players split into ${teams.length} balanced teams. Each line counts as one player.`);
  }));
  $('copyTeams').addEventListener('click', () => copy(result));
  $('downloadTeams').addEventListener('click', () => download(new Blob([result], {type: 'text/plain'}), 'chickentask-teams.txt'));
}

if (type === 'names') {
  let current = [], favorites = read('ct-favorite-names', []); if (!Array.isArray(favorites)) favorites = []; favorites = favorites.filter(s => typeof s === 'string').slice(0, 50);
  function renderList(container, names, favoriteList = false) {
    container.replaceChildren(...names.map(name => { const row = element('div', undefined, 'name-row'); row.append(element('strong', name)); const buttons = element('div', undefined, 'name-buttons'); const cp = element('button', '⧉'); cp.type = 'button'; cp.setAttribute('aria-label', `Copy ${name}`); cp.addEventListener('click', () => copy(name)); const star = element('button', favorites.includes(name) ? '★' : '☆'); star.type = 'button'; star.setAttribute('aria-label', `${favoriteList ? 'Remove' : 'Favorite'} ${name}`); star.addEventListener('click', run(() => { if (favorites.includes(name)) favorites = favorites.filter(n => n !== name); else { if (favorites.length >= 50) throw Error('You can keep up to 50 favorites. Remove one first.'); favorites.push(name); } save('ct-favorite-names', favorites); render(); })); buttons.append(cp, star); row.append(buttons); return row; }));
  }
  function render() { renderList($('nameResults'), current); renderList($('favoriteNames'), favorites, true); $('favoritesEmpty').hidden = !!favorites.length; }
  $('nameForm').addEventListener('submit', run(() => { const separator = $('nameSeparator').value; current = generateNames($('nameStyle').value, Number($('nameCount').value), separator); $('namesEmpty').hidden = true; $('copyAllNames').hidden = false; render(); status('Names generated. Availability is not checked—try your favorites in your game.'); }));
  $('copyAllNames').addEventListener('click', () => copy(current.join('\n'))); render();
}

if (type === 'compress') {
  let original = null, image = null, result = null, imageURL = null;
  const size = n => n >= 1048576 ? `${(n / 1048576).toFixed(2)} MB` : `${(n / 1024).toFixed(1)} KB`;
  $('imageFile').addEventListener('change', run(async () => {
    image?.close?.(); image = null; original = $('imageFile').files[0]; result = null; $('imageDownload').hidden = true; if (!original) return;
    if (!['image/jpeg','image/png','image/webp'].includes(original.type)) throw Error('Choose a JPG, PNG, or WebP image.');
    if (original.size > 20 * 1048576) throw Error('Choose an image smaller than 20 MB.');
    image = await createImageBitmap(original);
    if (image.width * image.height > 32000000) { image.close(); image = null; throw Error('Choose an image with at most 32 megapixels.'); }
    $('originalSize').textContent = size(original.size); $('outputSize').textContent = 'Not compressed'; $('imageDimensions').textContent = `${image.width} × ${image.height} pixels`;
    if (imageURL) URL.revokeObjectURL(imageURL); imageURL = URL.createObjectURL(original); $('imagePreview').src = imageURL; $('imagePreview').hidden = false; $('imageEmpty').hidden = true; $('imageStats').hidden = false; status('Image loaded. Choose your target size and compress.');
  }));
  $('compressForm').addEventListener('submit', run(async () => {
    if (!image || !original) throw Error('Choose an image first.');
    const targetKB = Number($('targetSize').value), maxWidth = Number($('maxWidth').value);
    if (!Number.isFinite(targetKB) || targetKB < 10 || targetKB > 10000 || !Number.isFinite(maxWidth) || maxWidth < 100 || maxWidth > 8000) throw Error('Target must be 10–10,000 KB and maximum width 100–8,000 pixels.');
    $('compressButton').disabled = true; $('imageFile').disabled = true; status('Compressing locally…');
    try {
      const target = targetKB * 1024, type = $('imageFormat').value;
      let width = Math.min(image.width, maxWidth), height = Math.max(1, Math.round(image.height * width / image.width)), blob;
      const canvas = document.createElement('canvas'), ctx = canvas.getContext('2d');
      const encode = q => new Promise((resolve, reject) => canvas.toBlob(b => b ? resolve(b) : reject(Error('This browser could not export the image.')), type, q));
      for (let attempt = 0; attempt < 9; attempt++) {
        canvas.width = width; canvas.height = height; ctx.fillStyle = '#fff'; ctx.fillRect(0,0,width,height); ctx.drawImage(image,0,0,width,height);
        let low = .08, high = .94; blob = await encode(low);
        if (blob.type !== type) throw Error('Your browser does not support that output format. Try JPEG.');
        if (blob.size <= target) { for (let i = 0; i < 7; i++) { const q = (low + high) / 2, trial = await encode(q); if (trial.size <= target) { blob = trial; low = q; } else high = q; } break; }
        width = Math.max(32, Math.floor(width * .72)); height = Math.max(32, Math.round(image.height * width / image.width));
      }
      if (blob.size > target) throw Error('Could not meet this target. Try a larger file size.');
      result = blob; $('outputSize').textContent = size(blob.size); $('imageDimensions').textContent = `${canvas.width} × ${canvas.height} pixels · ${blob.size <= original.size ? Math.round((1 - blob.size / original.size) * 100) + '% smaller' : 'Larger than original; try a smaller target'}`;
      if (imageURL) URL.revokeObjectURL(imageURL); imageURL = URL.createObjectURL(blob); $('imagePreview').src = imageURL; $('imageDownload').hidden = false; status(`Ready: under ${targetKB} KB. Transparency is flattened onto white.`);
    } finally { $('compressButton').disabled = false; $('imageFile').disabled = false; }
  }));
  $('imageDownload').addEventListener('click', () => { if (result) download(result, 'chickentask-compressed.' + (result.type === 'image/webp' ? 'webp' : 'jpg')); });
}

if (type === 'qr') {
  let svg = '', canvas = null;
  function mode() { const wifi = $('qrType').value === 'wifi'; $('wifiFields').hidden = !wifi; $('qrTextFields').hidden = wifi; $('qrText').required = !wifi; $('wifiName').required = wifi; }
  $('qrType').addEventListener('change', mode); mode();
  $('qrForm').addEventListener('submit', run(() => {
    let text = $('qrText').value.trim();
    if ($('qrType').value === 'wifi') text = wifiPayload($('wifiName').value, $('wifiPassword').value, $('wifiSecurity').value, $('wifiHidden').checked);
    if (!text) throw Error('Enter text, a URL, or Wi-Fi details.'); if (new TextEncoder().encode(text).length > 1500) throw Error('Keep the encoded text under 1,500 bytes.');
    if (typeof window.qrcode !== 'function') throw Error('The QR library could not load. Refresh and try again.');
    const qr = window.qrcode(0, 'M'); window.qrcode.stringToBytes = value => Array.from(new TextEncoder().encode(value)); qr.addData(text); qr.make();
    const n = qr.getModuleCount(), cell = Math.max(4, Math.floor(900 / (n + 8))), dim = (n + 8) * cell;
    canvas = document.createElement('canvas'); canvas.width = dim; canvas.height = dim; canvas.setAttribute('aria-label', 'Generated QR code'); canvas.setAttribute('role', 'img'); const ctx = canvas.getContext('2d'); ctx.fillStyle = '#fff'; ctx.fillRect(0,0,dim,dim); ctx.fillStyle = '#000'; let path = '';
    for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (qr.isDark(r,c)) { ctx.fillRect((c + 4) * cell, (r + 4) * cell, cell, cell); path += `M${c+4} ${r+4}h1v1h-1z`; }
    svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${n+8} ${n+8}" width="${dim}" height="${dim}" shape-rendering="crispEdges"><rect width="100%" height="100%" fill="white"/><path d="${path}" fill="black"/></svg>`;
    $('qrOutput').replaceChildren(canvas); $('qrOutput').hidden = false; $('qrEmpty').hidden = true; $('qrDownloads').hidden = false; status('QR code ready. Scan it to check the contents before sharing. Static codes do not expire; linked websites can change.');
  }));
  $('downloadSVG').addEventListener('click', () => { if (svg) download(new Blob([svg], {type:'image/svg+xml'}), 'chickentask-qr.svg'); });
  $('downloadPNG').addEventListener('click', () => { if (canvas) canvas.toBlob(blob => { if (blob) download(blob,'chickentask-qr.png'); }); });
}

if (type === 'grade') {
  let mode = 'test';
  $('gradeForm').noValidate = true;
  document.querySelectorAll('[data-grade-mode]').forEach(button => button.addEventListener('click', () => { mode = button.dataset.gradeMode; document.querySelectorAll('[data-grade-mode]').forEach(b => b.setAttribute('aria-selected', String(b === button))); document.querySelectorAll('[data-grade-panel]').forEach(p => p.hidden = p.dataset.gradePanel !== mode); $('gradeValue').textContent = '—'; $('gradeDetail').textContent = 'Enter your numbers and calculate.'; status(''); }));
  function row(grade = '', weight = '') { const el = element('div', undefined, 'grade-row'); const g = element('input'); g.type = 'number'; g.min = 0; g.max = 100; g.step = 'any'; g.value = grade; g.placeholder = 'Grade %'; g.setAttribute('aria-label','Category grade percent'); const w = element('input'); w.type = 'number'; w.min = .01; w.max = 100; w.step = 'any'; w.value = weight; w.placeholder = 'Weight %'; w.setAttribute('aria-label','Category weight percent'); const remove = element('button','×','tool-button'); remove.type = 'button'; remove.setAttribute('aria-label','Remove category'); remove.addEventListener('click', () => el.remove()); el.append(g,w,remove); $('gradeRows').append(el); }
  row(85,40); row(90,60); $('addGradeRow').addEventListener('click', run(() => { if ($('gradeRows').children.length >= 20) throw Error('Use at most 20 categories.'); row(); }));
  $('gradeForm').addEventListener('submit', run(() => {
    const active = document.querySelector(`[data-grade-panel="${mode}"]`);
    if ([...active.querySelectorAll('input')].some(input => input.value.trim() === '')) throw Error('Fill in every field for this calculation.');
    let value, detail;
    if (mode === 'test') { value = testGrade(Number($('correctAnswers').value), Number($('totalQuestions').value)); detail = `${$('correctAnswers').value} out of ${$('totalQuestions').value} correct. Check your teacher’s grading scale for the letter grade.`; }
    if (mode === 'final') { value = finalNeeded(Number($('currentGrade').value), Number($('targetGrade').value), Number($('finalWeight').value)); detail = value > 100 ? 'This target requires more than 100% on the final under these weights.' : value < 0 ? 'You have already reached this target under these weights, even with 0% on the final.' : `You need at least ${value.toFixed(2)}% on the final to reach your target.`; }
    if (mode === 'weighted') { const rows = [...$('gradeRows').children].map(el => [...el.querySelectorAll('input')].map(input => input.value === '' ? NaN : Number(input.value))); value = weightedGrade(rows); detail = 'Weighted average. Category weights total 100%.'; }
    $('gradeValue').textContent = `${value.toFixed(2)}%`; $('gradeDetail').textContent = detail;
  }));
}
