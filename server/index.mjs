import http from 'node:http';
import { DatabaseSync } from 'node:sqlite';
import { randomBytes, createHash, randomUUID } from 'node:crypto';
import { mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const hash = token => createHash('sha256').update(token).digest('hex');
const failure = (status, message) => Object.assign(new Error(message), { status });
const clean = (value, max, label) => {
  if (typeof value !== 'string' || !value.trim() || value.trim().length > max)
    throw failure(400, `${label} must contain 1–${max} characters.`);
  return value.trim();
};

export function createApp({ database = ':memory:', clock = Date.now } = {}) {
  const db = new DatabaseSync(database);
  db.exec(`PRAGMA foreign_keys=ON; PRAGMA journal_mode=WAL;
    CREATE TABLE IF NOT EXISTS groups (id TEXT PRIMARY KEY, code TEXT UNIQUE, name TEXT, meeting TEXT DEFAULT '', owner TEXT);
    CREATE TABLE IF NOT EXISTS members (id TEXT PRIMARY KEY, group_id TEXT REFERENCES groups(id), name TEXT, token_hash TEXT UNIQUE, lat REAL, lng REAL, location_at INTEGER);
    CREATE TABLE IF NOT EXISTS messages (id TEXT PRIMARY KEY, group_id TEXT REFERENCES groups(id), member_id TEXT, name TEXT, text TEXT, created_at INTEGER);
    CREATE INDEX IF NOT EXISTS message_group ON messages(group_id, created_at);`);
  const limits = new Map();
  const q = (sql, ...args) => db.prepare(sql).get(...args);
  const run = (sql, ...args) => db.prepare(sql).run(...args);
  const transaction = fn => {
    db.exec('BEGIN IMMEDIATE');
    try { const result = fn(); db.exec('COMMIT'); return result; }
    catch (e) { db.exec('ROLLBACK'); throw e; }
  };
  const newMember = (groupId, name) => {
    const token = randomBytes(32).toString('hex'), id = randomUUID();
    run('INSERT INTO members(id,group_id,name,token_hash) VALUES(?,?,?,?)', id, groupId, name, hash(token));
    return { token, memberId: id };
  };
  const server = http.createServer(async (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }
    const reply = (status, data) => { res.writeHead(status); res.end(JSON.stringify(data)); };
    try {
      const now = clock(), ip = req.socket.remoteAddress;
      run('UPDATE members SET lat=NULL,lng=NULL,location_at=NULL WHERE location_at <= ?', now - 120000);
      // Bound the limiter's memory and apply a stricter limit to code guessing.
      for (const [key, entry] of limits) if (now - entry.start > 60000) limits.delete(key);
      const path = new URL(req.url, 'http://localhost').pathname;
      const isEntry = req.method === 'POST' && ['/groups', '/join'].includes(path);
      const key = `${ip}:${isEntry ? 'entry' : 'normal'}`;
      const bucket = limits.get(key) ?? { start: now, count: 0 };
      limits.set(key, bucket);
      if (++bucket.count > (isEntry ? 20 : 240)) throw failure(429, 'Too many requests. Try again in a minute.');
      if (path === '/health' && req.method === 'GET') return reply(200, { ok: true });
      let body = {};
      if (['POST', 'PUT'].includes(req.method)) {
        const chunks = []; let size = 0;
        for await (const chunk of req) {
          size += chunk.length;
          if (size > 8192) throw failure(413, 'Request is too large.');
          chunks.push(chunk);
        }
        try { body = JSON.parse(Buffer.concat(chunks).toString() || '{}'); }
        catch { throw failure(400, 'Invalid JSON.'); }
        if (!body || typeof body !== 'object' || Array.isArray(body)) throw failure(400, 'Invalid request.');
      }
      if (path === '/groups' && req.method === 'POST') {
        const name = clean(body.name, 60, 'Group name'), memberName = clean(body.memberName, 40, 'Your name');
        const result = transaction(() => {
          const id = randomUUID(); let code;
          do { code = randomBytes(4).toString('hex').toUpperCase(); } while (q('SELECT id FROM groups WHERE code=?', code));
          run('INSERT INTO groups(id,code,name) VALUES(?,?,?)', id, code, name);
          const member = newMember(id, memberName);
          run('UPDATE groups SET owner=? WHERE id=?', member.memberId, id);
          return { ...member, groupId: id, code };
        });
        return reply(201, result);
      }
      if (path === '/join' && req.method === 'POST') {
        const code = clean(body.code, 8, 'Invite code').toUpperCase();
        const name = clean(body.memberName, 40, 'Your name');
        const group = q('SELECT * FROM groups WHERE code=?', code);
        if (!group) throw failure(404, 'No group found. Check the invite code.');
        if (q('SELECT COUNT(*) AS count FROM members WHERE group_id=?', group.id).count >= 100) throw failure(409, 'This group is full.');
        return reply(201, { ...newMember(group.id, name), groupId: group.id, code });
      }
      const token = (req.headers.authorization ?? '').replace(/^Bearer /, '');
      const member = q('SELECT * FROM members WHERE token_hash=?', hash(token));
      if (!member) throw failure(401, 'Your membership has ended. Join the group again.');
      const group = q('SELECT * FROM groups WHERE id=?', member.group_id);
      if (path === '/group' && req.method === 'GET') {
        const members = db.prepare('SELECT id,name,lat,lng,location_at FROM members WHERE group_id=?').all(group.id)
          .map(m => ({ id: m.id, name: m.name, location: m.location_at > now - 120000 ? { latitude: m.lat, longitude: m.lng, updatedAt: m.location_at } : null }));
        const messages = db.prepare('SELECT id,member_id AS memberId,name,text,created_at AS createdAt FROM messages WHERE group_id=? ORDER BY created_at DESC, rowid DESC LIMIT 200').all(group.id).reverse();
        return reply(200, { id: group.id, name: group.name, code: group.code, meeting: group.meeting, ownerId: group.owner, members, messages });
      }
      if (path === '/messages' && req.method === 'POST') {
        const text = clean(body.text, 1000, 'Message');
        run('INSERT INTO messages VALUES(?,?,?,?,?,?)', randomUUID(), group.id, member.id, member.name, text, now);
        return reply(201, { ok: true });
      }
      if (path === '/meeting' && req.method === 'PUT') {
        if (group.owner !== member.id) throw failure(403, 'Only the group creator can change the meeting point.');
        const meeting = typeof body.meeting === 'string' ? body.meeting.trim() : null;
        if (meeting === null || meeting.length > 300) throw failure(400, 'Meeting point must be at most 300 characters.');
        run('UPDATE groups SET meeting=? WHERE id=?', meeting, group.id);
        return reply(200, { ok: true });
      }
      if (path === '/location' && req.method === 'PUT') {
        const { latitude, longitude } = body;
        if (!Number.isFinite(latitude) || !Number.isFinite(longitude) || Math.abs(latitude) > 90 || Math.abs(longitude) > 180) throw failure(400, 'Invalid location.');
        run('UPDATE members SET lat=?,lng=?,location_at=? WHERE id=?', latitude, longitude, now, member.id);
        return reply(200, { ok: true });
      }
      if (path === '/location' && req.method === 'DELETE') {
        run('UPDATE members SET lat=NULL,lng=NULL,location_at=NULL WHERE id=?', member.id);
        return reply(200, { ok: true });
      }
      if (path === '/membership' && req.method === 'DELETE') {
        transaction(() => {
          run('DELETE FROM members WHERE id=?', member.id);
          const next = q('SELECT id FROM members WHERE group_id=? ORDER BY rowid LIMIT 1', group.id);
          if (!next) { run('DELETE FROM messages WHERE group_id=?', group.id); run('DELETE FROM groups WHERE id=?', group.id); }
          else if (group.owner === member.id) run('UPDATE groups SET owner=? WHERE id=?', next.id, group.id);
        });
        return reply(200, { ok: true });
      }
      throw failure(404, 'Not found.');
    } catch (error) {
      if (!error.status) console.error(error);
      reply(error.status ?? 500, { error: error.status ? error.message : 'Server error. Please try again.' });
    }
  });
  server.on('close', () => db.close());
  return server;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const data = process.env.DATA_DIR ?? join(dirname(fileURLToPath(import.meta.url)), 'data');
  mkdirSync(data, { recursive: true });
  const server = createApp({ database: join(data, 'group.sqlite') });
  server.listen(Number(process.env.PORT ?? 8787), '0.0.0.0', () => console.log('Group server listening on port ' + (process.env.PORT ?? 8787)));
}
