import { combatSpriteSinks } from './combat-sprite-draw.js';

const MAX_SPRITES = 512;
const MAX_TEXTURE_BYTES = 24 * 1024 * 1024;
const MAX_TEXTURES = 160;
const BARRIERS = [
  'drawImage', 'fill', 'stroke', 'fillRect', 'strokeRect', 'clearRect',
  'fillText', 'strokeText', 'putImageData', 'getImageData', 'drawFocusIfNeeded',
];

export async function createCombatGpuSpike(ctx, { minimum = 2, categories, gpuTiming = true } = {}) {
  const view = document.createElement('canvas');
  const gl = view.getContext('webgl2', {
    alpha: true, antialias: false, premultipliedAlpha: true, depth: false, stencil: true,
  });
  if (!gl) throw new Error('WebGL2 unavailable');

  let renderer;
  try {
    const { WebGLRenderer, Container, Sprite, ImageSource, CanvasSource, Texture, Rectangle, Matrix } =
      await import('./pixi-combat-spike-v8.min.js');
    renderer = new WebGLRenderer();
    await renderer.init({ canvas: view, context: gl, width: 1, height: 1, resolution: 1,
      antialias: false, backgroundAlpha: 0, clearBeforeRender: true });

    const stage = new Container();
    const matrix = new Matrix();
    const sprites = [];
    const queued = [];
    const textures = new Map();
    const maxSize = gl.getParameter(gl.MAX_TEXTURE_SIZE);
    const native = Object.fromEntries([...BARRIERS, 'save', 'restore', 'clip', 'reset']
      .filter(name => typeof ctx[name] === 'function').map(name => [name, ctx[name]]));
    const timer = gpuTiming ? gl.getExtension('EXT_disjoint_timer_query_webgl2') : null;
    const queries = [];
    const stats = {
      gpuSprites: { projectile: 0, aircraft: 0, fx: 0 }, nativeSprites: 0, passes: 0,
      drawCalls: 0, submitMs: 0, compositeMs: 0, compositePixels: 0, smallRuns: 0,
      textureBytes: 0, estimatedSurfaceBytes: 0, gpuCompletedMs: 0, gpuQueries: 0,
    };
    let frame = 0, clip = false, active = false, drawCalls = 0, recordingDrawCalls = false;
    const clipStack = [];
    let disabled = null;
    const gpu = gl.getExtension('WEBGL_debug_renderer_info');
    const device = gpu ? gl.getParameter(gpu.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER);

    for (const name of ['drawElements', 'drawArrays', 'drawElementsInstanced', 'drawArraysInstanced']) {
      const draw = gl[name].bind(gl);
      gl[name] = (...args) => {
        if (recordingDrawCalls) drawCalls++;
        return draw(...args);
      };
    }

    function pollGpuTime() {
      if (!timer || !queries.length) return;
      const disjoint = gl.getParameter(timer.GPU_DISJOINT_EXT);
      if (disjoint) {
        for (const query of queries.splice(0)) gl.deleteQuery(query);
        return;
      }
      while (queries.length && gl.getQueryParameter(queries[0], gl.QUERY_RESULT_AVAILABLE)) {
        const query = queries.shift();
        stats.gpuCompletedMs += gl.getQueryParameter(query, gl.QUERY_RESULT) / 1e6;
        stats.gpuQueries++;
        gl.deleteQuery(query);
      }
    }

    function dropTexture(image, entry) {
      for (const texture of entry.frames.values()) texture.destroy();
      entry.base.destroy(true);
      stats.textureBytes -= entry.bytes;
      textures.delete(image);
    }

    function trimTextures() {
      for (const [image, entry] of textures) {
        if (frame - entry.last > 180 || !(image.naturalWidth ?? image.width)) dropTexture(image, entry);
      }
    }

    function textureFor(job) {
      const { image, width, height, crop, sx, sy, sw, sh, smooth } = job;
      let entry = textures.get(image);
      if (entry && (entry.width !== width || entry.height !== height)) {
        dropTexture(image, entry);
        entry = null;
      }
      if (!entry) {
        const bytes = width * height * 4;
        if (stats.textureBytes + bytes > MAX_TEXTURE_BYTES || textures.size >= MAX_TEXTURES) return null;
        const Type = image instanceof HTMLImageElement ? ImageSource : CanvasSource;
        const source = new Type({ resource: image, width, height, resolution: 1, scaleMode: smooth ? 'linear' : 'nearest' });
        const base = new Texture({ source });
        entry = { bytes, width, height, base, frames: new Map(), last: frame, smooth };
        textures.set(image, entry);
        stats.textureBytes += bytes;
      }
      if (entry.smooth !== smooth) return null;
      entry.last = frame;
      if (!crop) return entry.base;
      const key = [sx, sy, sw, sh].join(':');
      if (!entry.frames.has(key)) {
        if (entry.frames.size >= 128) return null;
        entry.frames.set(key, new Texture({ source: entry.base.source, frame: new Rectangle(sx, sy, sw, sh) }));
      }
      return entry.frames.get(key);
    }

    function replayNative() {
      native.save.call(ctx);
      try {
        for (const job of queued) {
          const { m, alpha, smooth, quality, image, rect } = job;
          ctx.setTransform(m.a, m.b, m.c, m.d, m.e, m.f);
          ctx.globalAlpha = alpha;
          ctx.globalCompositeOperation = 'source-over';
          ctx.imageSmoothingEnabled = smooth;
          ctx.imageSmoothingQuality = quality;
          native.drawImage.call(ctx, image, ...rect);
          stats.nativeSprites++;
        }
      } finally {
        native.restore.call(ctx);
      }
    }

    function renderRun() {
      const w = ctx.canvas.width, h = ctx.canvas.height;
      if (!w || !h || w > maxSize || h > maxSize || gl.isContextLost()) return false;
      if (renderer.width !== w || renderer.height !== h) renderer.resize(w, h);
      stats.estimatedSurfaceBytes = w * h * 4;
      let left = w, top = h, right = 0, bottom = 0;
      for (let i = 0; i < queued.length; i++) {
        const job = queued[i], { m, x, y, dw, dh, sw, sh, alpha } = job;
        const texture = textureFor(job);
        if (!texture) return false;
        const sprite = sprites[i] ?? (sprites[i] = stage.addChild(new Sprite()));
        sprite.texture = texture;
        sprite.alpha = alpha;
        sprite.visible = true;
        const px = m.a * x + m.c * y + m.e, py = m.b * x + m.d * y + m.f;
        matrix.set(m.a * dw / sw, m.b * dw / sw, m.c * dh / sh, m.d * dh / sh, px, py);
        sprite.setFromMatrix(matrix);
        const vx = m.a * dw, vy = m.b * dw, ux = m.c * dh, uy = m.d * dh;
        left = Math.min(left, px + Math.min(vx, 0) + Math.min(ux, 0));
        top = Math.min(top, py + Math.min(vy, 0) + Math.min(uy, 0));
        right = Math.max(right, px + Math.max(vx, 0) + Math.max(ux, 0));
        bottom = Math.max(bottom, py + Math.max(vy, 0) + Math.max(uy, 0));
      }
      for (let i = queued.length; i < sprites.length && sprites[i].visible; i++) sprites[i].visible = false;
      left = Math.max(0, Math.floor(left) - 1);
      top = Math.max(0, Math.floor(top) - 1);
      right = Math.min(w, Math.ceil(right) + 1);
      bottom = Math.min(h, Math.ceil(bottom) + 1);
      if (right <= left || bottom <= top) return false;
      const query = timer && queries.length < 32 ? gl.createQuery() : null;
      const drawStarted = performance.now();
      drawCalls = 0;
      recordingDrawCalls = true;
      if (query) gl.beginQuery(timer.TIME_ELAPSED_EXT, query);
      try {
        renderer.render({ container: stage, clear: true });
      } finally {
        recordingDrawCalls = false;
        if (query) {
          gl.endQuery(timer.TIME_ELAPSED_EXT);
          queries.push(query);
        }
      }
      if (gl.isContextLost()) return false;
      stats.submitMs += performance.now() - drawStarted;

      const compositeStarted = performance.now();
      native.save.call(ctx);
      try {
        ctx.resetTransform();
        ctx.globalAlpha = 1;
        ctx.globalCompositeOperation = 'source-over';
        ctx.filter = 'none';
        ctx.shadowColor = 'transparent';
        ctx.imageSmoothingEnabled = false;
        // Only the GPU-rendered combat pixels cross the Canvas boundary.
        native.drawImage.call(ctx, view, left, top, right - left, bottom - top,
          left, top, right - left, bottom - top);
      } finally {
        native.restore.call(ctx);
      }
      stats.compositeMs += performance.now() - compositeStarted;
      stats.compositePixels += (right - left) * (bottom - top);
      stats.passes++;
      stats.drawCalls += drawCalls;
      for (const { kind } of queued) stats.gpuSprites[kind]++;
      return true;
    }

    function flush() {
      if (!queued.length) return;
      let rendered = false;
      if (!disabled && queued.length >= minimum) {
        try {
          rendered = renderRun();
        } catch (error) {
          disabled = String(error);
        }
      } else if (!disabled) stats.smallRuns++;
      try {
        if (!rendered) replayNative();
      } finally {
        queued.length = 0;
      }
    }

    function capture(kind, image, rect) {
      if (!active) return false;
      const width = image.naturalWidth ?? image.width, height = image.naturalHeight ?? image.height;
      const crop = rect.length === 8;
      const sx = crop ? rect[0] : 0, sy = crop ? rect[1] : 0;
      const sw = crop ? rect[2] : width, sh = crop ? rect[3] : height;
      const offset = crop ? 4 : 0;
      const x = rect[offset], y = rect[offset + 1];
      const dw = rect[offset + 2] ?? sw, dh = rect[offset + 3] ?? sh;
      if (disabled || clip || (categories && !categories.includes(kind)) ||
          !width || !height || width > maxSize || height > maxSize ||
          ![2, 4, 8].includes(rect.length) || !(image instanceof HTMLImageElement || image instanceof HTMLCanvasElement) ||
          (image instanceof HTMLImageElement && !image.complete) ||
          !rect.every(Number.isFinite) || sx < 0 || sy < 0 || sw <= 0 || sh <= 0 ||
          dw <= 0 || dh <= 0 || sx + sw > width || sy + sh > height ||
          ctx.globalCompositeOperation !== 'source-over' || (ctx.filter && ctx.filter !== 'none') ||
          ctx.shadowColor !== 'rgba(0, 0, 0, 0)') {
        stats.nativeSprites++;
        return false;
      }
      if (queued.length >= MAX_SPRITES) flush();
      queued.push({ kind, image, rect, width, height, crop, sx, sy, sw, sh, x, y, dw, dh,
        m: ctx.getTransform(), alpha: ctx.globalAlpha, smooth: ctx.imageSmoothingEnabled,
        quality: ctx.imageSmoothingQuality });
      return true;
    }

    // Preserve every intervening Canvas write in painter order. Queued sprites
    // hold their own transform and opacity, so ordinary save/restore is not a barrier.
    for (const name of BARRIERS) {
      if (native[name]) ctx[name] = function (...args) {
        flush();
        return native[name].apply(this, args);
      };
    }
    ctx.save = function () {
      if (active) clipStack.push(clip);
      native.save.call(this);
    };
    ctx.restore = function () {
      if (active) clip = clipStack.pop() ?? false;
      native.restore.call(this);
    };
    ctx.clip = function (...args) {
      flush();
      if (active) clip = true;
      native.clip.apply(this, args);
    };
    if (native.reset) ctx.reset = function () {
      flush();
      clipStack.length = 0;
      clip = false;
      native.reset.call(this);
    };
    combatSpriteSinks.set(ctx, capture);
    view.addEventListener('webglcontextlost', () => { disabled = 'WebGL2 context lost'; });

    return {
      begin() {
        active = !disabled && !gl.isContextLost();
        if (!active) return;
        frame++;
        pollGpuTime();
        if (frame % 30 === 0) trimTextures();
      },
      end() {
        try {
          flush();
        } finally {
          active = false;
          clipStack.length = 0;
          clip = false;
        }
      },
      read() {
        return { ...stats, gpuSprites: { ...stats.gpuSprites }, device,
          webgl: gl.getParameter(gl.VERSION), gpuTimerAvailable: !!timer, disabled };
      },
      loseContext() { gl.getExtension('WEBGL_lose_context')?.loseContext(); },
      destroy() {
        this.end();
        combatSpriteSinks.delete(ctx);
        for (const name of Object.keys(native)) delete ctx[name];
        for (const [image, entry] of textures) dropTexture(image, entry);
        for (const query of queries.splice(0)) gl.deleteQuery(query);
        stage.destroy({ children: true });
        renderer.destroy();
      },
    };
  } catch (error) {
    renderer?.destroy();
    throw error;
  }
}
