// HEAD-ON online co-op relay — Cloudflare Worker + single hub Durable Object.
// Protocol is identical to server/coop-relay.mjs (the Node reference): the client
// never changes between transports. Transport only — no scores, RNG or combat.
//
// Deploy: CLOUDFLARE_API_TOKEN=... npx wrangler deploy -c workers/coop-relay/wrangler.toml

const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const bytes = n => crypto.getRandomValues(new Uint8Array(n));
const token = () => [...bytes(24)].map(b => b.toString(16).padStart(2, '0')).join('');
const code = () => [...bytes(6)].map(b => ALPHABET[b % ALPHABET.length]).join('');
const open = s => s && s.readyState === 1;
const send = (socket, message) => {
  if (!open(socket)) return;
  if (socket.bufferedAmount !== undefined && socket.bufferedAmount > 1024 * 1024) { socket.close(1013, 'Backpressure'); return; }
  try { socket.send(JSON.stringify(message)); } catch { try { socket.close(1011, 'Send error'); } catch {} }
};
const config = value => value && typeof value.pilot === 'string' && value.pilot.length < 40 && typeof value.plane === 'string' && value.plane.length < 50 && ['central', 'entente'].includes(value.faction)
  ? { pilot: value.pilot, plane: value.plane, faction: value.faction, nickname: String(value.nickname || '').slice(0, 12) }
  : null;

export class CoopHub {
  constructor(state) {
    this.state = state;
    this.rooms = new Map();
    this.reconnectMs = 30000;
    this.maxRooms = 500;
  }

  async fetch(request) {
    const url = new URL(request.url);
    if (url.pathname === '/health') return Response.json({ ok: true, rooms: this.rooms.size });
    if (url.pathname !== '/coop' || request.headers.get('Upgrade') !== 'websocket') return new Response('Expected WebSocket', { status: 426 });
    const origin = request.headers.get('Origin');
    if (origin && !['https://leesh603.github.io', 'http://localhost:8787', 'http://127.0.0.1:8787'].includes(origin)) {
      return new Response('Forbidden origin', { status: 403 });
    }
    const pair = new WebSocketPair();
    const [client, server] = Object.values(pair);
    this.accept(server);
    return new Response(null, { status: 101, webSocket: client });
  }

  accept(socket) {
    socket.accept();
    socket.meta = { room: null, role: null, windowAt: Date.now(), count: 0, bytes: 0 };
    socket.meta.helloTimer = setTimeout(() => { if (!socket.meta.room) socket.close(1008, 'Join timeout'); }, 10000);
    socket.addEventListener('message', e => this.onMessage(socket, e.data));
    socket.addEventListener('close', () => this.onClose(socket));
    socket.addEventListener('error', () => this.onClose(socket));
  }

  lobby(room) {
    const state = {
      type: 'lobby', code: room.code, started: !!room.start,
      players: ['host', 'guest'].map(role => ({
        role,
        connected: open(room[role]?.socket),
        ready: !!room[role]?.ready,
        config: room[role]?.config || null,
      })),
    };
    for (const role of ['host', 'guest']) send(room[role]?.socket, state);
  }

  end(room, reason) {
    this.rooms.delete(room.code);
    for (const role of ['host', 'guest']) {
      const p = room[role];
      if (p) { clearTimeout(p.expiry); send(p.socket, { type: 'ended', reason }); try { p.socket?.close(1000, reason); } catch {} }
    }
  }

  onMessage(socket, raw) {
    const meta = socket.meta;
    const now = Date.now();
    if (now - meta.windowAt >= 1000) { meta.windowAt = now; meta.count = 0; meta.bytes = 0; }
    if (typeof raw !== 'string' || ++meta.count > 40 || (meta.bytes += raw.length) > 4 * 1024 * 1024) { socket.close(1008, 'Rate limit'); return; }
    let m;
    try { m = JSON.parse(raw); } catch { socket.close(1008, 'Invalid message'); return; }
    if (!m || typeof m.type !== 'string') return;

    if (!meta.room) {
      let room, role;
      if (m.type === 'create') {
        if (this.rooms.size >= this.maxRooms) { send(socket, { type: 'error', message: '방이 가득 찼습니다. 잠시 후 다시 시도하세요.' }); return; }
        const fit = config(m.config);
        if (!fit) { send(socket, { type: 'error', message: '파일럿 설정이 올바르지 않습니다.' }); return; }
        let key; do { key = code(); } while (this.rooms.has(key));
        room = { code: key, created: now, host: { config: fit, token: token(), ready: false } };
        this.rooms.set(key, room);
        role = 'host';
      } else if (m.type === 'join') {
        room = this.rooms.get(String(m.code || '').toUpperCase());
        if (!room) { send(socket, { type: 'error', message: '방 코드를 찾을 수 없습니다.' }); return; }
        role = 'guest';
        const fit = config(m.config), prior = room.guest;
        if (prior && (open(prior.socket) || m.token !== prior.token)) { send(socket, { type: 'error', message: '이미 다른 플레이어가 있습니다. 코드를 다시 확인하세요.' }); return; }
        if (!prior) {
          if (room.start || !fit || fit.faction !== room.host.config.faction) { send(socket, { type: 'error', message: 'Host와 같은 진영의 파일럿을 선택하세요.' }); return; }
          room.guest = { config: fit, token: token(), ready: false };
        }
      } else return;
      const peer = room[role];
      clearTimeout(peer.expiry);
      peer.socket = socket;
      meta.room = room; meta.role = role;
      clearTimeout(meta.helloTimer);
      send(socket, { type: 'joined', code: room.code, role, token: peer.token });
      this.lobby(room);
      if (room.start) {
        send(socket, { ...room.start, resumed: true });
        send(room.host.socket, { type: 'resync' });
        send(room.host.socket, { type: 'peer', connected: true });
      }
      return;
    }

    const room = meta.room, role = meta.role;
    if (!this.rooms.has(room.code) || room[role]?.socket !== socket) return;
    if (m.type === 'ready' && !room.start) {
      room[role].ready = !!m.ready;
      this.lobby(room);
      if (room.host.ready && room.guest?.ready && open(room.host.socket) && open(room.guest.socket)) {
        room.start = { type: 'start', seed: new DataView(bytes(4).buffer).getUint32(0, true), runId: token(), players: [room.host.config, room.guest.config] };
        send(room.host.socket, room.start);
        send(room.guest.socket, room.start);
      }
    } else if (role === 'host' && m.type === 'state' && room.start) send(room.guest?.socket, m);
    else if (role === 'guest' && ['input', 'action', 'choose', 'pause', 'resync'].includes(m.type) && room.start) send(room.host.socket, m);
    else if (m.type === 'leave') {
      if (role === 'host') this.end(room, 'Host가 방을 나갔습니다.');
      else this.end(room, 'Guest가 전장을 떠났습니다.');
    }
  }

  onClose(socket) {
    const meta = socket.meta;
    if (!meta) return;
    clearTimeout(meta.helloTimer);
    const room = meta.room;
    if (!room || !this.rooms.has(room.code) || room[meta.role]?.socket !== socket) return;
    room[meta.role].socket = null;
    if (meta.role === 'host') { this.end(room, 'Host 연결이 끊겨 전장이 종료됐습니다.'); return; }
    room.guest.ready = false;
    send(room.host.socket, { type: 'peer', connected: false, reconnectMs: this.reconnectMs });
    this.lobby(room);
    room.guest.expiry = setTimeout(() => {
      if (!room.guest.socket) {
        if (room.start) this.end(room, 'Guest 재접속 시간이 초과됐습니다.');
        else { room.guest = null; this.lobby(room); }
      }
    }, this.reconnectMs);
  }
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === '/health') {
      const hub = env.COOP_HUB.get(env.COOP_HUB.idFromName('hub'));
      return hub.fetch(request);
    }
    if (url.pathname === '/coop') {
      if (request.headers.get('Upgrade') !== 'websocket') return new Response('Expected WebSocket', { status: 426 });
      const hub = env.COOP_HUB.get(env.COOP_HUB.idFromName('hub'));
      return hub.fetch(request);
    }
    return new Response('HEAD-ON co-op relay', { status: 200 });
  },
};
