var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// worker.mjs
var ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
var bytes = /* @__PURE__ */ __name((n) => crypto.getRandomValues(new Uint8Array(n)), "bytes");
var token = /* @__PURE__ */ __name(() => [...bytes(24)].map((b) => b.toString(16).padStart(2, "0")).join(""), "token");
var code = /* @__PURE__ */ __name(() => [...bytes(6)].map((b) => ALPHABET[b % ALPHABET.length]).join(""), "code");
var open = /* @__PURE__ */ __name((s) => s && s.readyState === 1, "open");
var send = /* @__PURE__ */ __name((socket, message) => {
  if (!open(socket))
    return;
  if (socket.bufferedAmount !== void 0 && socket.bufferedAmount > 1024 * 1024) {
    socket.close(1013, "Backpressure");
    return;
  }
  try {
    socket.send(JSON.stringify(message));
  } catch {
    try {
      socket.close(1011, "Send error");
    } catch {
    }
  }
}, "send");
var config = /* @__PURE__ */ __name((value) => value && typeof value.pilot === "string" && value.pilot.length < 40 && typeof value.plane === "string" && value.plane.length < 50 && ["central", "entente"].includes(value.faction) ? { pilot: value.pilot, plane: value.plane, faction: value.faction, nickname: String(value.nickname || "").slice(0, 12) } : null, "config");
var CoopHub = class {
  constructor(state) {
    this.state = state;
    this.rooms = /* @__PURE__ */ new Map();
    this.reconnectMs = 3e4;
    this.maxRooms = 500;
  }
  async fetch(request) {
    const url = new URL(request.url);
    if (url.pathname === "/health")
      return Response.json({ ok: true, rooms: this.rooms.size });
    if (url.pathname !== "/coop" || request.headers.get("Upgrade") !== "websocket")
      return new Response("Expected WebSocket", { status: 426 });
    const origin = request.headers.get("Origin");
    if (origin && !["https://head-on-aces.justzeon.chatgpt.site", "https://leesh603.github.io", "http://localhost:8787", "http://127.0.0.1:8787"].includes(origin)) {
      return new Response("Forbidden origin", { status: 403 });
    }
    const pair = new WebSocketPair();
    const [client, server] = Object.values(pair);
    this.accept(server);
    return new Response(null, { status: 101, webSocket: client });
  }
  accept(socket) {
    socket.accept();
    socket.meta = { room: null, role: null, windowAt: Date.now(), count: 0, bytes: 0 };
    socket.meta.helloTimer = setTimeout(() => {
      if (!socket.meta.room)
        socket.close(1008, "Join timeout");
    }, 1e4);
    socket.addEventListener("message", (e) => this.onMessage(socket, e.data));
    socket.addEventListener("close", () => this.onClose(socket));
    socket.addEventListener("error", () => this.onClose(socket));
  }
  lobby(room) {
    const state = {
      type: "lobby",
      code: room.code,
      started: !!room.start,
      players: ["host", "guest"].map((role) => ({
        role,
        connected: open(room[role]?.socket),
        ready: !!room[role]?.ready,
        config: room[role]?.config || null
      }))
    };
    for (const role of ["host", "guest"])
      send(room[role]?.socket, state);
  }
  end(room, reason) {
    this.rooms.delete(room.code);
    for (const role of ["host", "guest"]) {
      const p = room[role];
      if (p) {
        clearTimeout(p.expiry);
        send(p.socket, { type: "ended", reason });
        try {
          p.socket?.close(1e3, reason);
        } catch {
        }
      }
    }
  }
  onMessage(socket, raw) {
    const meta = socket.meta;
    const now = Date.now();
    if (now - meta.windowAt >= 1e3) {
      meta.windowAt = now;
      meta.count = 0;
      meta.bytes = 0;
    }
    if (typeof raw !== "string" || ++meta.count > 40 || (meta.bytes += raw.length) > 4 * 1024 * 1024) {
      socket.close(1008, "Rate limit");
      return;
    }
    let m;
    try {
      m = JSON.parse(raw);
    } catch {
      socket.close(1008, "Invalid message");
      return;
    }
    if (!m || typeof m.type !== "string")
      return;
    if (!meta.room) {
      let room2, role2;
      if (m.type === "create") {
        if (this.rooms.size >= this.maxRooms) {
          send(socket, { type: "error", message: "\uBC29\uC774 \uAC00\uB4DD \uCC3C\uC2B5\uB2C8\uB2E4. \uC7A0\uC2DC \uD6C4 \uB2E4\uC2DC \uC2DC\uB3C4\uD558\uC138\uC694." });
          return;
        }
        const fit = config(m.config);
        if (!fit) {
          send(socket, { type: "error", message: "\uD30C\uC77C\uB7FF \uC124\uC815\uC774 \uC62C\uBC14\uB974\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4." });
          return;
        }
        let key;
        do {
          key = code();
        } while (this.rooms.has(key));
        room2 = { code: key, created: now, host: { config: fit, token: token(), ready: false } };
        this.rooms.set(key, room2);
        role2 = "host";
      } else if (m.type === "join") {
        room2 = this.rooms.get(String(m.code || "").toUpperCase());
        if (!room2) {
          send(socket, { type: "error", message: "\uBC29 \uCF54\uB4DC\uB97C \uCC3E\uC744 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4." });
          return;
        }
        role2 = "guest";
        const fit = config(m.config), prior = room2.guest;
        if (prior && (open(prior.socket) || m.token !== prior.token)) {
          send(socket, { type: "error", message: "\uC774\uBBF8 \uB2E4\uB978 \uD50C\uB808\uC774\uC5B4\uAC00 \uC788\uC2B5\uB2C8\uB2E4. \uCF54\uB4DC\uB97C \uB2E4\uC2DC \uD655\uC778\uD558\uC138\uC694." });
          return;
        }
        if (!prior) {
          if (room2.start || !fit || fit.faction !== room2.host.config.faction) {
            send(socket, { type: "error", message: "Host\uC640 \uAC19\uC740 \uC9C4\uC601\uC758 \uD30C\uC77C\uB7FF\uC744 \uC120\uD0DD\uD558\uC138\uC694." });
            return;
          }
          room2.guest = { config: fit, token: token(), ready: false };
        }
      } else
        return;
      const peer = room2[role2];
      clearTimeout(peer.expiry);
      peer.socket = socket;
      meta.room = room2;
      meta.role = role2;
      clearTimeout(meta.helloTimer);
      send(socket, { type: "joined", code: room2.code, role: role2, token: peer.token });
      this.lobby(room2);
      if (room2.start) {
        send(socket, { ...room2.start, resumed: true });
        send(room2.host.socket, { type: "resync" });
        send(room2.host.socket, { type: "peer", connected: true });
      }
      return;
    }
    const room = meta.room, role = meta.role;
    if (!this.rooms.has(room.code) || room[role]?.socket !== socket)
      return;
    if (m.type === "ready" && !room.start) {
      room[role].ready = !!m.ready;
      this.lobby(room);
      if (room.host.ready && room.guest?.ready && open(room.host.socket) && open(room.guest.socket)) {
        room.start = { type: "start", seed: new DataView(bytes(4).buffer).getUint32(0, true), runId: token(), players: [room.host.config, room.guest.config] };
        send(room.host.socket, room.start);
        send(room.guest.socket, room.start);
      }
    } else if (role === "host" && m.type === "state" && room.start)
      send(room.guest?.socket, m);
    else if (role === "guest" && ["input", "action", "choose", "pause", "resync"].includes(m.type) && room.start)
      send(room.host.socket, m);
    else if (m.type === "leave") {
      if (role === "host")
        this.end(room, "Host\uAC00 \uBC29\uC744 \uB098\uAC14\uC2B5\uB2C8\uB2E4.");
      else
        this.end(room, "Guest\uAC00 \uC804\uC7A5\uC744 \uB5A0\uB0AC\uC2B5\uB2C8\uB2E4.");
    }
  }
  onClose(socket) {
    const meta = socket.meta;
    if (!meta)
      return;
    clearTimeout(meta.helloTimer);
    const room = meta.room;
    if (!room || !this.rooms.has(room.code) || room[meta.role]?.socket !== socket)
      return;
    room[meta.role].socket = null;
    if (meta.role === "host") {
      this.end(room, "Host \uC5F0\uACB0\uC774 \uB04A\uACA8 \uC804\uC7A5\uC774 \uC885\uB8CC\uB410\uC2B5\uB2C8\uB2E4.");
      return;
    }
    room.guest.ready = false;
    send(room.host.socket, { type: "peer", connected: false, reconnectMs: this.reconnectMs });
    this.lobby(room);
    room.guest.expiry = setTimeout(() => {
      if (!room.guest.socket) {
        if (room.start)
          this.end(room, "Guest \uC7AC\uC811\uC18D \uC2DC\uAC04\uC774 \uCD08\uACFC\uB410\uC2B5\uB2C8\uB2E4.");
        else {
          room.guest = null;
          this.lobby(room);
        }
      }
    }, this.reconnectMs);
  }
};
__name(CoopHub, "CoopHub");
var worker_default = {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === "/health") {
      const hub = env.COOP_HUB.get(env.COOP_HUB.idFromName("hub"));
      return hub.fetch(request);
    }
    if (url.pathname === "/coop") {
      if (request.headers.get("Upgrade") !== "websocket")
        return new Response("Expected WebSocket", { status: 426 });
      const hub = env.COOP_HUB.get(env.COOP_HUB.idFromName("hub"));
      return hub.fetch(request);
    }
    return new Response("HEAD-ON co-op relay", { status: 200 });
  }
};
export {
  CoopHub,
  worker_default as default
};
//# sourceMappingURL=worker.js.map
