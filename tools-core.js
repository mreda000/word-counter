export function randomInt(max) {
  if (!Number.isInteger(max) || max < 1 || max > 0x100000000) throw Error('Invalid random range.');
  const limit = Math.floor(0x100000000 / max) * max;
  const value = new Uint32Array(1);
  do { crypto.getRandomValues(value); } while (value[0] >= limit);
  return value[0] % max;
}
export function entries(text, max = 100) {
  const list = text.split(/\r?\n/).map(s => s.trim()).filter(Boolean);
  if (list.length > max) throw Error(`Please use no more than ${max} entries.`);
  if (list.some(s => s.length > 60)) throw Error('Keep each entry under 61 characters.');
  return list;
}
export function shuffle(items, pick = randomInt) {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) { const j = pick(i + 1); [result[i], result[j]] = [result[j], result[i]]; }
  return result;
}
export function makeTeams(names, count, pick = randomInt) {
  if (names.length < 2 || !Number.isInteger(count) || count < 2 || count > names.length) throw Error('Choose between 2 teams and the number of players.');
  const teams = Array.from({length: count}, () => []);
  shuffle(names, pick).forEach((name, i) => teams[i % count].push(name));
  return teams;
}
const banks = {
  funny: [['Wobbly','Sneaky','Spicy','Sleepy','Chaotic','Mighty','Bouncy','Salty','Disco','Turbo','Crispy','Noodle','Cosmic','Grumpy','Fuzzy','Tiny','Flying','Silly'],['Waffle','Potato','Pickle','Goblin','Pancake','Goose','Ninja','Toast','Wizard','Bean','Nugget','Banana','Otter','Muffin','Badger','Biscuit']],
  competitive: [['Silent','Rapid','Iron','Apex','Shadow','Prime','Crimson','Vortex','Frost','Phantom','Nova','Blaze','Stealth','Storm','Venom','Onyx','Elite','Quantum'],['Strike','Squad','Force','Legion','Clutch','Reaper','Pulse','Wolves','Falcons','Guard','Rift','Edge','Fury','Vanguard','Ghost','Titans']],
  fantasy: [['Moonlit','Ancient','Ember','Silver','Arcane','Crystal','Hollow','Golden','Elder','Mystic','Wild','Celestial','Emerald','Runic','Starborn','Obsidian','Dawn','Dusk'],['Dragon','Phoenix','Raven','Warden','Mage','Knight','Grove','Drake','Oracle','Wraith','Crown','Blade','Griffin','Sprite','Rune','Voyager']],
  chicken: [['Clucking','Golden','Turbo','Fluffy','Fearless','Royal','Spicy','Cosmic','Sneaky','Mighty','Disco','Ninja','Epic','Moonlit','Crispy','Wild','Sunny','Tiny'],['Chicken','Rooster','Hen','Coop','Nugget','Feathers','Pecker','Egg','Flock','Cluck','Wing','Chick','Bantam','Beak','Hatchling','Strutter']]
};
export function generateNames(style, count, separator = '', pick = randomInt) {
  if (!banks[style] || !Number.isInteger(count) || count < 1 || count > 24) throw Error('Choose 1–24 names.');
  const [first, last] = banks[style];
  const candidates = first.flatMap(a => last.map(b => a + separator + b));
  return shuffle(candidates, pick).slice(0, count);
}
export function testGrade(correct, total) {
  if (!Number.isFinite(correct) || !Number.isFinite(total) || total <= 0 || correct < 0 || correct > total) throw Error('Enter a positive total and a correct count between zero and the total.');
  return correct / total * 100;
}
export function finalNeeded(current, target, weight) {
  if (![current, target, weight].every(Number.isFinite) || current < 0 || current > 100 || target < 0 || target > 100 || weight <= 0 || weight > 100) throw Error('Grades must be 0–100, and final weight must be greater than 0 and at most 100.');
  return (target - current * (1 - weight / 100)) / (weight / 100);
}
export function weightedGrade(rows) {
  if (!rows.length || rows.some(([grade, weight]) => !Number.isFinite(grade) || !Number.isFinite(weight) || grade < 0 || grade > 100 || weight <= 0 || weight > 100)) throw Error('Enter grades from 0–100 and positive weights up to 100.');
  const weight = rows.reduce((n, row) => n + row[1], 0);
  if (Math.abs(weight - 100) > 0.01) throw Error(`Weights currently total ${weight.toFixed(1)}%. They must total 100%.`);
  return rows.reduce((sum, [grade, weight]) => sum + grade * weight / 100, 0);
}
export function wifiPayload(ssid, password, security = 'WPA', hidden = false) {
  if (!ssid.trim()) throw Error('Enter the Wi-Fi network name.');
  const escape = value => value.replace(/([\\;,:\"])/g, '\\$1');
  return `WIFI:T:${security};S:${escape(ssid)};P:${security === 'nopass' ? '' : escape(password)};H:${hidden ? 'true' : 'false'};;`;
}
