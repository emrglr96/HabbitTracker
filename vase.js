/* Vazo çizicisi: ayın günlerinden çarkta dönen üç boyutlu bir vazo üretir (WebGL). */
(() => {
'use strict';

const SHAPES = [
  { name: 'Amfora', p: [[0, 0.36], [0.07, 0.44], [0.28, 0.8], [0.46, 0.88], [0.64, 0.72], [0.8, 0.42], [0.9, 0.36], [1, 0.5]] },
  { name: 'Şişe', p: [[0, 0.42], [0.1, 0.56], [0.3, 0.66], [0.5, 0.62], [0.68, 0.36], [0.86, 0.24], [1, 0.34]] },
  { name: 'Küp', p: [[0, 0.42], [0.14, 0.66], [0.4, 0.9], [0.62, 0.86], [0.8, 0.62], [0.92, 0.52], [1, 0.62]] },
  { name: 'Lale', p: [[0, 0.32], [0.1, 0.38], [0.3, 0.52], [0.56, 0.76], [0.76, 0.7], [0.9, 0.54], [1, 0.68]] },
  { name: 'İbrik', p: [[0, 0.38], [0.1, 0.54], [0.28, 0.78], [0.45, 0.74], [0.6, 0.48], [0.78, 0.36], [1, 0.54]] },
  { name: 'Kadeh', p: [[0, 0.4], [0.08, 0.3], [0.22, 0.2], [0.36, 0.26], [0.55, 0.6], [0.8, 0.84], [1, 0.9]] },
];

const H = 2.1, Y0 = 0.05, RAD = 0.66, SUB = 4, SEG = 72, STRIDE = 16;

// Kontrol noktalarından yumuşak profil (Catmull-Rom)
function profile(shape, t) {
  const p = SHAPES[shape % SHAPES.length].p;
  let i = 0;
  while (i < p.length - 2 && t > p[i + 1][0]) i++;
  const a = p[Math.max(0, i - 1)], b = p[i], c = p[i + 1], d = p[Math.min(p.length - 1, i + 2)];
  const u = Math.max(0, Math.min(1, (t - b[0]) / (c[0] - b[0])));
  const m1 = (c[1] - a[1]) / Math.max(1e-4, c[0] - a[0]) * (c[0] - b[0]);
  const m2 = (d[1] - b[1]) / Math.max(1e-4, d[0] - b[0]) * (c[0] - b[0]);
  const u2 = u * u, u3 = u2 * u;
  return (2 * u3 - 3 * u2 + 1) * b[1] + (u3 - 2 * u2 + u) * m1 + (-2 * u3 + 3 * u2) * c[1] + (u3 - u2) * m2;
}

// model: { n, shape, rings: [{ f, col:[r,g,b], gold, open, perfect, wet }] }
function buildMesh(model) {
  const N = model.n, rings = model.rings, K = rings.length;
  const verts = [], idx = [], lines = [];
  const push = (x, y, z, nx, ny, nz, col, u, v, wet, perf, gold, open, kind) =>
    verts.push(x, y, z, nx, ny, nz, col[0], col[1], col[2], u, v, wet, perf, gold, open, kind);
  let baseR = 0.3, topY = Y0;

  if (K) {
    // halka genişliği: günün doluluğu, komşularla yumuşatılmış
    const raw = rings.map((r) => (r.f == null ? 0.7 : r.f));
    const f = raw.map((v, i) => 0.25 * raw[Math.max(0, i - 1)] + 0.5 * v + 0.25 * raw[Math.min(K - 1, i + 1)]);
    const last = rings[K - 1];
    const g = last.wet ? 0.3 + 0.7 * (last.f == null ? 0 : last.f) : 1;
    const rowCount = K * SUB + 1;
    const ys = [], rs = [], days = [], cols = [];
    for (let j = 0; j < rowCount; j++) {
      const dp = j / SUB;
      const dpy = Math.min(dp, K - 1) + Math.max(0, dp - (K - 1)) * g;
      const x = Math.max(0, Math.min(K - 1, dp - 0.5));
      const i0 = Math.floor(x), i1 = Math.min(K - 1, i0 + 1), fr = x - i0;
      const fi = f[i0] * (1 - fr) + f[i1] * fr;
      ys.push(Y0 + (H * dpy) / N);
      rs.push(profile(model.shape, dpy / N) * (0.8 + 0.2 * fi) * RAD);
      const ca = rings[i0].col, cb = rings[i1].col;
      cols.push([ca[0] * (1 - fr) + cb[0] * fr, ca[1] * (1 - fr) + cb[1] * fr, ca[2] * (1 - fr) + cb[2] * fr]);
      days.push(Math.min(K - 1, Math.floor(dp - 1e-4 < 0 ? 0 : dp - 1e-4)));
    }
    // taban ve ağız kıvrımı
    ys.unshift(0.0); rs.unshift(rs[0] * 0.93); days.unshift(0); cols.unshift(cols[0]);
    ys.push(ys[ys.length - 1] + 0.012); rs.push(rs[rs.length - 1] - 0.022); days.push(K - 1); cols.push(cols[cols.length - 1]);
    baseR = rs[0]; topY = ys[ys.length - 1];
    const R = ys.length;
    for (let j = 0; j < R; j++) {
      const a = Math.max(0, j - 1), b = Math.min(R - 1, j + 1);
      const slope = (rs[b] - rs[a]) / Math.max(1e-4, ys[b] - ys[a]);
      const il = 1 / Math.hypot(1, slope);
      const d = rings[days[j]];
      const vDay = Math.max(0, (j - 1) / SUB);
      for (let s = 0; s <= SEG; s++) {
        const th = (s / SEG) * Math.PI * 2, c = Math.cos(th), sn = Math.sin(th);
        push(rs[j] * c, ys[j], rs[j] * sn, c * il, -slope * il, sn * il, d.wet ? d.col : cols[j], s / SEG, vDay, d.wet ? 1 : 0, d.perfect ? 1 : 0, d.gold ? 1 : 0, d.open ? 1 : 0, 0);
      }
    }
    for (let j = 0; j < R - 1; j++) for (let s = 0; s < SEG; s++) {
      const a = j * (SEG + 1) + s, b = a + SEG + 1;
      idx.push(a, b, a + 1, a + 1, b, b + 1);
    }
  }

  // Henüz gelmemiş günlerin hayalet çizgisi
  for (let dday = K + 1; dday <= N; dday += 1) {
    const t = dday / N, y = Y0 + H * t, r = profile(model.shape, t) * 0.94 * RAD;
    for (let s = 0; s < SEG; s++) {
      const t1 = (s / SEG) * Math.PI * 2, t2 = ((s + 1) / SEG) * Math.PI * 2;
      lines.push(r * Math.cos(t1), y, r * Math.sin(t1), r * Math.cos(t2), y, r * Math.sin(t2));
    }
  }

  // Çark: üst tabla ve yan yüz
  const base = verts.length / STRIDE, WR = 1.0, WH = 0.09, wc = [0.36, 0.33, 0.33];
  for (let s = 0; s <= SEG; s++) {
    const th = (s / SEG) * Math.PI * 2, c = Math.cos(th), sn = Math.sin(th);
    push(0, 0, 0, 0, 1, 0, wc, s / SEG, 0, 0, 0, 0, 0, 1);
    push(WR * c, 0, WR * sn, 0, 1, 0, wc, s / SEG, 1, 0, 0, 0, 0, 1);
    push(WR * c, 0, WR * sn, c, 0, sn, wc, s / SEG, 1, 0, 0, 0, 0, 2);
    push(WR * c, -WH, WR * sn, c, 0, sn, wc, s / SEG, 1, 0, 0, 0, 0, 2);
  }
  for (let s = 0; s < SEG; s++) {
    const a = base + s * 4, b = a + 4;
    idx.push(a, a + 1, b + 1, a + 2, a + 3, b + 2, b + 2, a + 3, b + 3);
  }
  return { verts: new Float32Array(verts), idx: new Uint16Array(idx), lines: new Float32Array(lines), baseR, topY };
}

const VS = `
attribute vec3 aPos; attribute vec3 aNrm; attribute vec3 aCol; attribute vec4 aA; attribute vec3 aB;
uniform float uRot, uTilt, uOff; uniform vec2 uScale;
varying vec3 vN; varying vec3 vW; varying vec3 vCol; varying vec4 vA; varying vec3 vB;
void main() {
  float c = cos(uRot), s = sin(uRot), ct = cos(uTilt), st = sin(uTilt);
  vec3 p = vec3(c * aPos.x + s * aPos.z, aPos.y + uOff, -s * aPos.x + c * aPos.z);
  vec3 n = vec3(c * aNrm.x + s * aNrm.z, aNrm.y, -s * aNrm.x + c * aNrm.z);
  p = vec3(p.x, ct * p.y - st * p.z + 0.2, st * p.y + ct * p.z);
  n = vec3(n.x, ct * n.y - st * n.z, st * n.y + ct * n.z);
  vN = n; vW = aPos; vCol = aCol; vA = aA; vB = aB;
  float w = 1.0 - p.z * 0.11;
  gl_Position = vec4(p.x * uScale.x, p.y * uScale.y, -p.z * 0.3 * w, w);
}`;

const FS = `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
varying vec3 vN; varying vec3 vW; varying vec3 vCol; varying vec4 vA; varying vec3 vB;
uniform float uTime, uFire, uGhost, uBaseR, uPulse, uDark;
uniform vec4 uGhostCol;
const float PER = 9.0;
float hash(vec2 p) { p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
float noise(vec2 p) {
  vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x), f.y);
}
vec2 cellPt(vec2 c) { c.x = mod(c.x, PER); return vec2(hash(c), hash(c + 17.3)); }
float vorEdge(vec2 x) {
  vec2 n = floor(x), f = fract(x), mg = vec2(0.0), mr = vec2(0.0);
  float md = 8.0;
  for (int j = -1; j <= 1; j++) for (int i = -1; i <= 1; i++) {
    vec2 g = vec2(float(i), float(j)); vec2 r = g + cellPt(n + g) - f; float d = dot(r, r);
    if (d < md) { md = d; mr = r; mg = g; }
  }
  md = 8.0;
  for (int j = -2; j <= 2; j++) for (int i = -2; i <= 2; i++) {
    vec2 g = mg + vec2(float(i), float(j)); vec2 r = g + cellPt(n + g) - f;
    if (dot(mr - r, mr - r) > 0.00001) md = min(md, dot(0.5 * (mr + r), normalize(r - mr)));
  }
  return md;
}
void main() {
  if (uGhost > 0.5) { gl_FragColor = vec4(uGhostCol.rgb * uGhostCol.a, uGhostCol.a); return; }
  vec3 N = normalize(vN);
  bool inner = !gl_FrontFacing;
  if (inner) N = -N;
  vec3 V = vec3(0.0, 0.0, 1.0);
  vec3 L = normalize(vec3(-0.5, 0.62, 0.6));
  vec3 L2 = normalize(vec3(0.75, 0.15, 0.4));
  vec3 Lf = normalize(vec3(0.1, -0.72, 0.68));
  float flick = 0.86 + 0.09 * sin(uTime * 7.3) + 0.05 * sin(uTime * 13.1 + 1.7);
  vec3 fireCol = vec3(1.0, 0.44, 0.13) * uFire * flick;
  float amb = mix(0.46, 0.2, uDark);
  float key = mix(0.74, 0.95, uDark);
  float d1 = max(dot(N, L), 0.0), d2 = max(dot(N, L2), 0.0), df = max(dot(N, Lf), 0.0);
  vec3 Hh = normalize(L + V);
  float nh = max(dot(N, Hh), 0.0);
  float fres = pow(1.0 - max(dot(N, V), 0.0), 3.0);
  vec3 col;

  if (vB.z > 0.5) {
    // çark
    float r = length(vW.xz);
    float groove = 0.5 + 0.5 * sin(r * 85.0);
    vec3 base = mix(vec3(0.30, 0.28, 0.29), vec3(0.42, 0.40, 0.40), groove * 0.5);
    base = mix(base * vec3(1.5, 1.38, 1.26), mix(vec3(0.17, 0.18, 0.24), base, 0.55), uDark);
    float slip = smoothstep(uBaseR + 0.42, uBaseR, r) * (0.45 + 0.55 * noise(vW.xz * 9.0));
    base = mix(base, vec3(0.50, 0.37, 0.29), slip * 0.6);
    float ao = smoothstep(uBaseR * 0.9, uBaseR + 0.3, r);
    if (vB.z > 1.5) { base *= 0.62; ao = 1.0; }
    float sp = pow(nh, 30.0) * 0.25;
    col = base * (amb + d1 * key * 0.9 + d2 * 0.12) * mix(0.42, 1.0, ao) + sp + base * fireCol * (0.25 + df) * mix(0.35, 0.8, uDark);
  } else {
    float day = vA.y, fy = fract(day);
    vec3 base = vCol;
    float n1 = noise(vW.xy * 5.0) * 0.5 + noise(vW.zy * 5.0 + 7.0) * 0.5;
    float n2 = noise(vW.xy * 23.0) * 0.5 + noise(vW.zy * 23.0 + 3.0) * 0.5;
    base *= 0.88 + 0.2 * n1;
    base *= 0.985 + 0.03 * sin(day * 25.13);
    float gloss = 1.0;
    // kusursuz gün: ince inci çizgisi
    float pearl = vA.w * smoothstep(0.07, 0.025, abs(fy - 0.5));
    base = mix(base, vec3(0.99, 0.97, 0.9), pearl * 0.5);
    // ıslak kil: bugünün halkası
    if (vA.z > 0.5) {
      vec3 clay = mix(vec3(0.47, 0.33, 0.26), vCol * 0.55, 0.22) * (0.9 + 0.2 * n2);
      clay *= 0.93 + 0.07 * sin(day * 60.0 + n1 * 4.0);
      base = clay * (1.0 + uPulse * 0.5);
      gloss = 0.35;
    }
    float theta = vA.x * PER;
    float crack = max(vB.x, vB.y);
    float line = 0.0;
    if (crack > 0.02 && !inner) {
      float dayId = floor(day);
      float wob = 0.2 * sin(vA.x * 6.2832 * 3.0 + dayId * 1.7) + 0.1 * sin(vA.x * 6.2832 * 7.0 + dayId * 4.1);
      float seam = smoothstep(0.11, 0.05, abs(fy - 0.5 - wob));
      float e = vorEdge(vec2(theta, day * 0.8 + 3.0));
      float branch = smoothstep(0.06, 0.02, e) * smoothstep(0.5, 0.2, abs(fy - 0.5 - wob));
      line = max(seam, branch) * smoothstep(0.02, 0.4, crack);
    }
    vec3 lit = base * (amb + d1 * key + d2 * 0.16) + base * fres * 0.22;
    float sp = pow(nh, mix(14.0, 70.0, gloss)) * mix(0.18, 0.85, gloss);
    sp += pow(max(dot(N, normalize(L2 + V)), 0.0), 40.0) * 0.18 * gloss;
    col = lit + sp + (base * 0.5 + 0.2) * fireCol * mix(0.3, 0.62, uDark) * (pow(df, 1.6) + fres * 0.45);
    if (inner) col = base * (amb * 0.75 + d1 * 0.28) * 0.6;
    if (line > 0.0) {
      vec3 gold = vec3(1.0, 0.76, 0.3) * (0.42 + 0.8 * d1 + 0.25 * d2) + vec3(1.0, 0.93, 0.7) * pow(nh, 22.0) * 1.3 + fireCol * 0.5;
      vec3 dark = vec3(0.07, 0.05, 0.05);
      vec3 seamCol = mix(dark, gold, step(vB.y, vB.x - 0.001));
      if (vB.y > vB.x) seamCol = dark;
      col = mix(col, seamCol, line);
    }
  }
  gl_FragColor = vec4(col, 1.0);
}`;

function Renderer(canvas, preserve) {
  const gl = canvas.getContext('webgl', { antialias: true, alpha: true, premultipliedAlpha: true, preserveDrawingBuffer: !!preserve })
    || canvas.getContext('experimental-webgl', { antialias: true, alpha: true, preserveDrawingBuffer: !!preserve });
  if (!gl) return null;
  const sh = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s)); return s; };
  const pr = gl.createProgram();
  gl.attachShader(pr, sh(gl.VERTEX_SHADER, VS)); gl.attachShader(pr, sh(gl.FRAGMENT_SHADER, FS));
  gl.linkProgram(pr);
  if (!gl.getProgramParameter(pr, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(pr));
  gl.useProgram(pr);
  const U = {};
  ['uRot', 'uTilt', 'uOff', 'uScale', 'uTime', 'uFire', 'uGhost', 'uGhostCol', 'uBaseR', 'uPulse', 'uDark'].forEach((n) => { U[n] = gl.getUniformLocation(pr, n); });
  const A = {};
  ['aPos', 'aNrm', 'aCol', 'aA', 'aB'].forEach((n) => { A[n] = gl.getAttribLocation(pr, n); });
  const vbo = gl.createBuffer(), ibo = gl.createBuffer(), lbo = gl.createBuffer();
  let mesh = null;
  gl.enable(gl.DEPTH_TEST);
  gl.clearColor(0, 0, 0, 0);

  this.gl = gl;
  this.setMesh = (m) => {
    mesh = m;
    gl.bindBuffer(gl.ARRAY_BUFFER, vbo); gl.bufferData(gl.ARRAY_BUFFER, m.verts, gl.DYNAMIC_DRAW);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibo); gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, m.idx, gl.DYNAMIC_DRAW);
    gl.bindBuffer(gl.ARRAY_BUFFER, lbo); gl.bufferData(gl.ARRAY_BUFFER, m.lines, gl.DYNAMIC_DRAW);
  };
  this.draw = (o) => {
    if (!mesh) return;
    const w = canvas.width, h = canvas.height;
    gl.viewport(0, 0, w, h);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    const sy = 2 / 2.78, sx = Math.min(sy * (h / w), 0.9);
    gl.uniform1f(U.uRot, o.rot); gl.uniform1f(U.uTilt, 0.27); gl.uniform1f(U.uOff, -1.07);
    gl.uniform2f(U.uScale, sx, sx * (w / h));
    gl.uniform1f(U.uTime, o.time || 0); gl.uniform1f(U.uFire, o.fire || 0);
    gl.uniform1f(U.uBaseR, mesh.baseR); gl.uniform1f(U.uPulse, o.pulse || 0); gl.uniform1f(U.uDark, o.dark ? 1 : 0);
    const F = 4;
    gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibo);
    const ap = (loc, size, off) => { if (loc < 0) return; gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, size, gl.FLOAT, false, STRIDE * F, off * F); };
    ap(A.aPos, 3, 0); ap(A.aNrm, 3, 3); ap(A.aCol, 3, 6); ap(A.aA, 4, 9); ap(A.aB, 3, 13);
    gl.uniform1f(U.uGhost, 0);
    gl.disable(gl.BLEND);
    gl.drawElements(gl.TRIANGLES, mesh.idx.length, gl.UNSIGNED_SHORT, 0);
    if (mesh.lines.length) {
      gl.bindBuffer(gl.ARRAY_BUFFER, lbo);
      [A.aNrm, A.aCol, A.aA, A.aB].forEach((l) => { if (l >= 0) gl.disableVertexAttribArray(l); });
      gl.vertexAttribPointer(A.aPos, 3, gl.FLOAT, false, 0, 0);
      gl.uniform1f(U.uGhost, 1);
      const gc = o.dark ? [0.75, 0.82, 1.0, 0.2] : [0.1, 0.16, 0.36, 0.17];
      gl.uniform4f(U.uGhostCol, gc[0], gc[1], gc[2], gc[3]);
      gl.enable(gl.BLEND); gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
      gl.depthMask(false);
      gl.drawArrays(gl.LINES, 0, mesh.lines.length / 3);
      gl.depthMask(true);
    }
  };
}

// WebGL yoksa: düz kesit çizimi
function draw2D(canvas, model, dark) {
  const ctx = canvas.getContext('2d'); if (!ctx) return;
  const w = canvas.width, h = canvas.height;
  ctx.clearRect(0, 0, w, h);
  const K = model.rings.length, sc = h / 2.7, cx = w / 2, by = h - 0.35 * sc;
  ctx.fillStyle = dark ? '#3a3c4a' : '#6b6767';
  ctx.beginPath(); ctx.ellipse(cx, by, sc, sc * 0.22, 0, 0, 7); ctx.fill();
  for (let i = 0; i < K; i++) {
    const r = model.rings[i], t = (i + 0.5) / model.n;
    const rad = profile(model.shape, t) * (0.8 + 0.2 * (r.f == null ? 0.7 : r.f)) * RAD * sc;
    const y = by - ((i + 1) / model.n) * H * sc, hh = (H * sc) / model.n + 1;
    const c = r.col.map((v) => Math.round(v * 255));
    const g = ctx.createLinearGradient(cx - rad, 0, cx + rad, 0);
    g.addColorStop(0, `rgb(${c.map((v) => v * 0.45 | 0)})`); g.addColorStop(0.35, `rgb(${c.map((v) => Math.min(255, v * 1.15) | 0)})`); g.addColorStop(1, `rgb(${c.map((v) => v * 0.4 | 0)})`);
    ctx.fillStyle = g; ctx.fillRect(cx - rad, y, rad * 2, hh);
    if (r.gold) { ctx.fillStyle = '#e2b24a'; ctx.fillRect(cx - rad, y + hh / 2 - 1, rad * 2, 2); }
  }
}

let main = null, mainCanvas = null, thumbR = null, thumbCanvas = null, glFailed = false;
const st = { rot: 0.6, vel: 0.28, pulse: 0, fire: 0, dark: false, model: null, raf: 0, last: 0, drag: null, t0: 0 };

function ensureMain() {
  if (mainCanvas) return;
  mainCanvas = document.createElement('canvas');
  mainCanvas.className = 'vase-canvas';
  mainCanvas.setAttribute('role', 'img');
  if (!glFailed) {
    try { main = new Renderer(mainCanvas, false); if (!main.gl) main = null; } catch (e) { main = null; }
    if (!main) glFailed = true;
  }
  const down = (e) => { st.drag = { x: e.clientX, t: performance.now() }; try { mainCanvas.setPointerCapture(e.pointerId); } catch (err) { /* yok */ } };
  const move = (e) => {
    if (!st.drag) return;
    const now = performance.now(), dx = e.clientX - st.drag.x, dt = Math.max(1, now - st.drag.t);
    st.rot += dx * 0.012; st.vel = Math.max(-14, Math.min(14, (dx * 0.012) / (dt / 1000)));
    st.drag = { x: e.clientX, t: now };
  };
  const up = () => { st.drag = null; };
  mainCanvas.addEventListener('pointerdown', down);
  mainCanvas.addEventListener('pointermove', move);
  mainCanvas.addEventListener('pointerup', up);
  mainCanvas.addEventListener('pointercancel', up);
}

function resize() {
  if (!mainCanvas || !mainCanvas.parentNode) return false;
  const r = mainCanvas.parentNode.getBoundingClientRect();
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  const w = Math.max(2, Math.round(r.width * dpr)), h = Math.max(2, Math.round(r.height * dpr));
  if (mainCanvas.width !== w || mainCanvas.height !== h) { mainCanvas.width = w; mainCanvas.height = h; }
  return true;
}

function frame(now) {
  st.raf = 0;
  if (!mainCanvas || !mainCanvas.isConnected || document.hidden) return;
  const dt = Math.min(0.05, (now - (st.last || now)) / 1000);
  st.last = now;
  if (!st.drag) {
    st.rot += st.vel * dt;
    st.vel += (0.28 - st.vel) * Math.min(1, dt * 1.6);
  }
  st.pulse *= Math.pow(0.04, dt);
  resize();
  if (main) main.draw({ rot: st.rot, time: (now - st.t0) / 1000, fire: st.fire, pulse: st.pulse, dark: st.dark });
  st.raf = requestAnimationFrame(frame);
}
function start() { if (!st.raf && mainCanvas && mainCanvas.isConnected) { st.last = 0; st.raf = requestAnimationFrame(frame); } }

const reduce = () => window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

window.Vase = {
  shapes: SHAPES.map((s) => s.name),
  mount(slot, model, o) {
    ensureMain();
    st.fire = (o && o.fire) || 0; st.dark = !!(o && o.dark);
    if (mainCanvas.parentNode !== slot) slot.appendChild(mainCanvas);
    mainCanvas.setAttribute('aria-label', (o && o.label) || 'Vazo');
    this.setModel(model);
    resize();
    if (!main) { draw2D(mainCanvas, model, st.dark); return; }
    if (!st.t0) st.t0 = performance.now();
    if (reduce()) { st.vel = 0; main.draw({ rot: st.rot, time: 0, fire: st.fire, pulse: 0, dark: st.dark }); return; }
    start();
  },
  setModel(model) {
    st.model = model;
    if (main) main.setMesh(buildMesh(model));
  },
  kick() { st.vel = Math.min(16, Math.abs(st.vel) + 8); st.pulse = 1; start(); },
  thumb(model, w, h, o) {
    try {
      if (!thumbCanvas) { thumbCanvas = document.createElement('canvas'); if (!glFailed) { try { thumbR = new Renderer(thumbCanvas, true); if (!thumbR.gl) thumbR = null; } catch (e) { thumbR = null; } } }
      thumbCanvas.width = w; thumbCanvas.height = h;
      if (thumbR) { thumbR.setMesh(buildMesh(model)); thumbR.draw({ rot: 0.7, time: 0, fire: (o && o.fire) || 0, pulse: 0, dark: !!(o && o.dark) }); }
      else draw2D(thumbCanvas, model, !!(o && o.dark));
      return thumbCanvas.toDataURL('image/png');
    } catch (e) { return ''; }
  },
};

document.addEventListener('visibilitychange', () => { if (!document.hidden) start(); });
window.addEventListener('resize', () => { if (resize() && main && reduce()) main.draw({ rot: st.rot, time: 0, fire: st.fire, pulse: 0, dark: st.dark }); });
})();
