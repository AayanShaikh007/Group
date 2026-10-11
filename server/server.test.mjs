import { test } from 'node:test';
import assert from 'node:assert/strict';
import { once } from 'node:events';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createApp } from './index.mjs';

async function harness(options) {
  const server = createApp(options); server.listen(0, '127.0.0.1'); await once(server, 'listening');
  const base = `http://127.0.0.1:${server.address().port}`;
  return { close: () => new Promise(resolve => server.close(resolve)),
    api: async (path, method = 'GET', body, token) => {
      const r = await fetch(base + path, {method, headers: {'Content-Type':'application/json', ...(token ? {Authorization:`Bearer ${token}`} : {})}, ...(body === undefined ? {} : {body:JSON.stringify(body)})});
      return {status:r.status, data:await r.json()};
    } };
}
test('two members: joining, private chat, plan permissions, location expiry and leaving', async t => {
  let now = 1700000000000;
  const h = await harness({clock:()=>now}); t.after(h.close);
  assert.equal((await h.api('/groups','POST',{name:'',memberName:'Alice'})).status,400);
  const created = await h.api('/groups','POST',{name:'Weekend crew',memberName:'Alice'});
  assert.equal(created.status,201); const a = created.data;
  assert.match(a.code,/^[A-F0-9]{8}$/);
  assert.equal((await h.api('/join','POST',{code:'XXXXXXXX',memberName:'Bob'})).status,404);
  const joined = await h.api('/join','POST',{code:a.code.toLowerCase(),memberName:'Bob'});
  assert.equal(joined.status,201); const b = joined.data;
  const other = (await h.api('/groups','POST',{name:'Other',memberName:'Carol'})).data;
  assert.equal((await h.api('/group')).status,401);
  assert.equal((await h.api('/group','GET',undefined,'fake')).status,401);
  assert.equal((await h.api('/messages','POST',{text:'See you at the park!'},a.token)).status,201);
  const snapshot = (await h.api('/group','GET',undefined,b.token)).data;
  assert.equal(snapshot.members.length,2);
  assert.equal(snapshot.messages[0].text,'See you at the park!');
  assert.equal(snapshot.messages[0].memberId,a.memberId);
  assert.equal((await h.api('/group','GET',undefined,other.token)).data.messages.length,0);
  assert.equal((await h.api('/messages','POST',{text:'   '},b.token)).status,400);
  assert.equal((await h.api('/meeting','PUT',{meeting:'Park · 2 pm'},b.token)).status,403);
  assert.equal((await h.api('/meeting','PUT',{meeting:'Park · 2 pm'},a.token)).status,200);
  assert.equal((await h.api('/group','GET',undefined,b.token)).data.meeting,'Park · 2 pm');
  assert.equal((await h.api('/location','PUT',{latitude:91,longitude:0},b.token)).status,400);
  await h.api('/location','PUT',{latitude:43.65,longitude:-79.38},b.token);
  assert.equal((await h.api('/group','GET',undefined,a.token)).data.members.find(m=>m.id===b.memberId).location.latitude,43.65);
  now += 120001;
  assert.equal((await h.api('/group','GET',undefined,a.token)).data.members.find(m=>m.id===b.memberId).location,null);
  await h.api('/location','PUT',{latitude:43.65,longitude:-79.38},b.token);
  await h.api('/location','DELETE',undefined,b.token);
  assert.equal((await h.api('/group','GET',undefined,a.token)).data.members.find(m=>m.id===b.memberId).location,null);
  await h.api('/membership','DELETE',undefined,a.token);
  assert.equal((await h.api('/group','GET',undefined,a.token)).status,401);
  assert.equal((await h.api('/group','GET',undefined,b.token)).data.ownerId,b.memberId);
  await h.api('/membership','DELETE',undefined,b.token);
  assert.equal((await h.api('/join','POST',{code:a.code,memberName:'Dan'})).status,404);
});
test('SQLite preserves sessions and messages after server restart', async () => {
  const folder = mkdtempSync(join(tmpdir(),'group-test-')), database = join(folder,'test.sqlite');
  let h;
  try {
    h = await harness({database});
    const a = (await h.api('/groups','POST',{name:'Persistent',memberName:'Alice'})).data;
    await h.api('/messages','POST',{text:'Still here'},a.token);
    await h.close(); h = await harness({database});
    const r = await h.api('/group','GET',undefined,a.token);
    assert.equal(r.status,200); assert.equal(r.data.messages[0].text,'Still here'); assert.equal(r.data.code,a.code);
  } finally { if(h) await h.close(); rmSync(folder,{recursive:true,force:true}); }
});
test('invite-code guessing is rate limited', async t => {
  const h = await harness(); t.after(h.close);
  for(let i=0;i<20;i++) assert.equal((await h.api('/join','POST',{code:'XXXXXXXX',memberName:'Bob'})).status,404);
  assert.equal((await h.api('/join','POST',{code:'XXXXXXXX',memberName:'Bob'})).status,429);
});
