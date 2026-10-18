import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import vm from 'node:vm';
import {entries,makeTeams,generateNames,testGrade,finalNeeded,weightedGrade,wifiPayload,shuffle,randomInt} from '../tools-core.js';
assert.deepEqual(entries(' Alex \n\n Sam\r\nRiley '),['Alex','Sam','Riley']);
assert.throws(()=>entries(Array(101).fill('name').join('\n')));
assert.throws(()=>entries('x'.repeat(61)));
assert.throws(()=>randomInt(0));
const original=Array.from({length:17},(_,i)=>'Player '+i);
for(let count=2;count<=17;count++){
  const groups=makeTeams(original,count);
  assert.deepEqual(groups.flat().sort(),[...original].sort());
  assert.ok(Math.max(...groups.map(g=>g.length))-Math.min(...groups.map(g=>g.length))<=1);
}
assert.equal(original[0],'Player 0');
assert.throws(()=>makeTeams(['one'],2));
assert.throws(()=>makeTeams(['one','two'],3));
assert.equal(makeTeams(['Alex','Alex','Sam'],2).flat().length,3);
assert.deepEqual(shuffle(['a','b','c'],()=>0),['b','c','a']);
for(const style of ['funny','competitive','fantasy','chicken']){
 const names=generateNames(style,24,'_');assert.equal(names.length,24);assert.equal(new Set(names).size,24);assert.ok(names.every(n=>n.includes('_')));
}
assert.equal(testGrade(18,20),90);
assert.equal(testGrade(0,10),0);
assert.throws(()=>testGrade(11,10));assert.throws(()=>testGrade(0,0));
assert.ok(Math.abs(finalNeeded(85,90,30)-101.6666666667)<.00001);
assert.equal(finalNeeded(80,90,50),100);
assert.equal(weightedGrade([[85,40],[90,60]]),88);
assert.throws(()=>weightedGrade([[85,40],[90,40]]));
assert.throws(()=>finalNeeded(80,90,0));
assert.equal(wifiPayload('My;Network','a:b,c\\d','WPA'),String.raw`WIFI:T:WPA;S:My\;Network;P:a\:b\,c\\d;H:false;;`);
assert.equal(wifiPayload('Cafe','ignored','nopass',true),'WIFI:T:nopass;S:Cafe;P:;H:true;;');
assert.throws(()=>wifiPayload('','password'));
const context={};vm.createContext(context);vm.runInContext(await fs.readFile(new URL('../vendor/qrcode.js',import.meta.url),'utf8'),context);
const qr=context.qrcode(0,'M');qr.addData('HELLO WORLD');qr.make();assert.equal(qr.getModuleCount(),21);assert.equal(qr.isDark(0,0),true);assert.equal(qr.isDark(1,1),false);assert.equal(qr.isDark(3,3),true);
console.log('PASS: team balance and preservation, random bounds, names, grade formulas, input validation, Wi-Fi escaping, QR generation.');
