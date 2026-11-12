// Story do resumo diário — quadro branco vertical (1080x1920), dirigido por spec.json + timeline.json.
// spec.json: { date, palette?, layout?, route?, scenes:[{ title, icon?, items:[{ say, sub, show, big?, turn? }] }] }
// timeline.json (gerado por prep.py): { dur, scenes:[{ t0, items:[{ t0, dur }] }] }
import * as W from './engine/wb.js';
import { clamp } from '/core/lib.js';

const { VW, VH } = W, Q = new URLSearchParams(location.search);
const ACCENT = '#d97757';                                  // borda do arco e detalhes fixos do cabeçalho
const PALETTES = {                                         // k = coisas, b = medição/rótulos, o = o que importa
  classico: { k: '#23262c', b: '#2a5cb3', o: '#d97757' },
  marinho: { k: '#1f2a44', b: '#1f8a8a', o: '#d97757' },
  verde: { k: '#23262c', b: '#2e7a4d', o: '#c8413a' },
  grafite: { k: '#3a3f47', b: '#7a4fb3', o: '#d97757' },
};
const LAYOUTS = ['esquerda', 'centro', 'cartoes'], ROUTES = ['zigzag', 'coluna', 'linha'];
const ICONS = ['calendar', 'chart', 'tag', 'gold', 'globe', 'star'];
const hashStr = s => { let h = 2166136261; for (const c of String(s)) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; };

function icon(name, x, y, s) {
  const w = 8, L = (a, b, c, d) => W.line(x + a * s, y + b * s, x + c * s, y + d * s, { w });
  const P = pts => W.poly(pts.map(([a, b]) => [x + a * s, y + b * s]), { w });
  switch (name) {
    case 'calendar': return [W.roundRect(x + .08 * s, y + .18 * s, .84 * s, .74 * s, .1 * s, { w }), L(.1, .42, .9, .42), L(.3, .06, .3, .3), L(.7, .06, .7, .3), L(.27, .6, .41, .6), L(.59, .6, .73, .6), L(.27, .77, .41, .77)];
    case 'chart': return [P([[.1, .05], [.1, .92], [.95, .92]]), P([[.22, .74], [.42, .5], [.58, .62], [.88, .2]]), P([[.68, .2], [.88, .2], [.88, .4]])];
    case 'tag': return [P([[.08, .12], [.52, .12], [.92, .52], [.52, .92], [.08, .5], [.08, .12]]), W.circle(x + .28 * s, y + .31 * s, .07 * s, { w: 7 })];
    case 'gold': return [P([[.2, .56], [.8, .56], [.92, .9], [.08, .9], [.2, .56]]), P([[.33, .2], [.67, .2], [.77, .5], [.23, .5], [.33, .2]])];
    case 'globe': return [W.circle(x + .5 * s, y + .5 * s, .42 * s, { w }), L(.08, .5, .92, .5), W.arc(x + .5 * s, y + .5 * s, .19 * s, -1.6, 4.9, { ry: .42 * s, w: 7 })];
    default: { const p = []; for (let i = 0; i <= 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? .2 : .46; p.push([.5 + Math.cos(a) * r, .52 + Math.sin(a) * r]); } return [P(p)]; }
  }
}
const widthOf = (str, h) => W.text(str, 0, 0, { h, seed: 7 }).width;
const fitH = (str, h, maxW) => { const w = widthOf(str, h); return w > maxW ? h * maxW / w : h; };
function wrap(str, h, maxW) {
  const rows = []; let cur = '';
  for (const w of String(str).split(' ')) { const t = cur ? cur + ' ' + w : w; if (cur && widthOf(t, h) > maxW) { rows.push(cur); cur = w; } else cur = t; }
  if (cur) rows.push(cur); return rows;
}

export async function build() {
  await W.loadFont('tech', 'fonts/EMSTech.json');
  const spec = await (await fetch('spec.json')).json(), TL = await (await fetch('timeline.json')).json();
  const img = new Image(); img.src = 'foto.jpg'; try { await img.decode(); } catch (e) { console.warn('foto.jpg não carregou'); }
  const hd = hashStr(spec.date || 'x');
  const palName = spec.palette || Object.keys(PALETTES)[hd % 4], pal = PALETTES[palName] || PALETTES.classico;
  const layout = spec.layout || LAYOUTS[(hd >>> 3) % 3], route = spec.route || ROUTES[(hd >>> 6) % 3];
  console.log('variação', palName, layout, route);
  const centered = layout === 'centro', cards = layout === 'cartoes';

  const tl = new W.Timeline();
  const K = new W.Pen('k', pal.k, { park: [VW + 260, VH + 260], len: 300 }), B = new W.Pen('bb', pal.b, { park: [VW + 330, VH - 240], len: 300 }), O = new W.Pen('ooo', pal.o, { park: [-260, VH + 300], len: 300 });
  const n = spec.scenes.length, M = 400;
  const origin = i => route === 'coluna' ? [M, M + i * 2250] : route === 'linha' ? [M + i * 1450, M] : [M + (i % 2) * 1450, M + i * 1250];
  const centers = [], BW = Math.max(...spec.scenes.map((_, i) => origin(i)[0])) + VW + M, BH = Math.max(...spec.scenes.map((_, i) => origin(i)[1])) + VH + M;

  spec.scenes.forEach((sc, si) => {
    const [ox, oy] = origin(si), T = TL.scenes[si], s0 = T.t0; centers.push([ox + VW / 2, oy + VH / 2]);
    // cabeçalho da cena: ícone + título + traço
    tl.draw(K, icon(sc.icon || ICONS[si % ICONS.length], ox + 96, oy + 350, 132), s0 + .02, { by: s0 + .42, tag: 'icon' });
    const th = fitH(sc.title, 80, 720);
    tl.draw(K, W.text(sc.title, ox + 262, oy + 458, { h: th }), s0 + .45, { by: s0 + 1.05, tag: 'title' });
    tl.draw(K, W.line(ox + 96, oy + 540, ox + 984, oy + 532, { w: 9, over: 10 }), s0 + 1.08, { by: s0 + 1.3, tag: 'rule' });
    // itens
    let y = oy + 636;
    sc.items.forEach((it, ii) => {
      const I = T.items[ii], t0 = I.t0, d = I.dur, x = centered ? ox + VW / 2 : ox + 112, align = centered ? 'center' : 'left', y0 = y;
      let tBig = t0 + .08;
      if (it.big) {
        const h = fitH(it.big, 98, 850); tBig = t0 + clamp(d * .45, .5, 1.4);
        tl.draw(O, W.text(it.big, x, y + h, { h, align }), t0 + .08, { by: tBig, tag: 'big' }); y += h + 40;
      }
      if (it.show) {
        const rows = wrap(it.show, 44, 850), tB = t0 + Math.max(1.2, d * .9);
        const st = rows.map((r, k) => W.text(r, x, y + 44 + k * 64, { h: fitH(r, 44, 850), align }));
        tl.draw(it.turn ? K : B, st, Math.min(tBig, tB - .6), { by: tB, tag: 'show' }); y += rows.length * 64 + 16;
        if (it.turn) { const wd = Math.max(...st.map(s => s.width)), xa = centered ? x - wd / 2 : x; tl.draw(O, W.line(xa, y + 4, xa + wd, y - 4, { w: 9 }), tB + .05, { by: tB + .4, tag: 'turn' }); y += 14; }
      }
      if (cards) tl.draw(K, W.roundRect(ox + 70, y0 - 22, 940, y - y0 + 34, 26, { w: 5, alpha: .8 }), t0 + Math.max(1.3, d * .9) + (it.turn ? .5 : .05), { by: t0 + Math.max(1.3, d * .9) + (it.turn ? .95 : .5), tag: 'card' });
      y += 44;
    });
    if (y > oy + 1300) console.warn(`cena ${si} (${sc.title}) passa da área útil: y=${Math.round(y - oy)}`);
  });
  tl.end();

  // câmera: uma região por cena, deslocamento curto entre elas e leve aproximação enquanto fala
  const keys = [];
  centers.forEach(([cx, cy], i) => {
    const tEnd = i + 1 < n ? TL.scenes[i + 1].t0 - .68 : TL.dur;
    keys.push(i === 0 ? [0, cx, cy, 1, 0, 'l'] : [TL.scenes[i].t0 - .03, cx, cy, 1, 0, 'io']);
    keys.push([tEnd, cx, cy + 10, 1.03, 0, 'l']);
  });
  const cam = new W.Camera(keys), board = new W.Board(tl, { W: BW, H: BH });
  const PENS = [K, B, O];
  if (!Q.has('nopens')) board.objs.push({ draw: (ctx, t, c) => { for (const p of PENS) W.drawMarker(ctx, p, W.penPose(p, t, cam), c, t); } });

  // cabeçalho fixo (tela): foto no arco, nome e cargo
  board.overlays.push({
    draw: ctx => {
      const x = 70, y = 62, w = 176, h = 224, r = w / 2;
      const arch = () => { ctx.beginPath(); ctx.moveTo(x, y + h); ctx.lineTo(x, y + r); ctx.arc(x + r, y + r, r, Math.PI, 0); ctx.lineTo(x + w, y + h); ctx.closePath(); };
      ctx.save(); ctx.shadowColor = 'rgba(30,30,40,.22)'; ctx.shadowBlur = 16; ctx.shadowOffsetY = 5; ctx.fillStyle = '#fdfcf8'; arch(); ctx.fill(); ctx.restore();
      ctx.save(); arch(); ctx.clip();
      if (img.naturalWidth) { const k = Math.max(w / img.naturalWidth, h / img.naturalHeight), iw = img.naturalWidth * k, ih = img.naturalHeight * k; ctx.imageSmoothingQuality = 'high'; ctx.drawImage(img, x + (w - iw) / 2, y + (h - ih) / 2, iw, ih); }
      ctx.restore();
      ctx.lineWidth = 7; ctx.strokeStyle = ACCENT; ctx.lineJoin = 'round'; arch(); ctx.stroke();
      ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
      ctx.fillStyle = '#23262c'; ctx.font = '52px AD'; ctx.fillText('Michel Ebertz', 276, 168);
      ctx.fillStyle = '#5b6068'; ctx.font = '32px AD'; ctx.fillText('Assessor de Investimentos', 278, 218);
      ctx.fillStyle = ACCENT; ctx.fillRect(278, 238, 120, 6);
      // rodapé fixo
      ctx.fillStyle = '#6b7078'; ctx.font = '25px AD'; ctx.textAlign = 'center'; ctx.fillText('conteúdo educativo · não é recomendação de investimento', VW / 2, 1526);
    }
  });

  // legendas queimadas (parte baixa, deixando livres os ~20% inferiores)
  const subs = [];
  spec.scenes.forEach((sc, si) => sc.items.forEach((it, ii) => { const I = TL.scenes[si].items[ii]; subs.push({ t0: Math.max(0, I.t0 - .05), t1: I.t0 + I.dur + .3, text: it.sub || it.say }); }));
  for (let i = 0; i < subs.length - 1; i++) subs[i].t1 = Math.min(subs[i].t1, subs[i + 1].t0 - .04);
  if (!Q.has('nosubs')) board.overlays.push({
    draw: (ctx, t) => {
      const s = subs.find(s => t >= s.t0 && t < s.t1); if (!s) return;
      const a = Math.min(1, (t - s.t0) / .12, (s.t1 - t) / .12);
      ctx.font = '45px AD';
      const rows = []; let cur = '';
      for (const w of s.text.split(' ')) { const tt = cur ? cur + ' ' + w : w; if (cur && ctx.measureText(tt).width > 880) { rows.push(cur); cur = w; } else cur = tt; }
      if (cur) rows.push(cur);
      const w = Math.max(...rows.map(r => ctx.measureText(r).width)) + 64, h = 72 + (rows.length - 1) * 54, y0 = 1486 - h;
      ctx.globalAlpha = a * .93; ctx.fillStyle = '#fdfcf8'; ctx.shadowColor = 'rgba(30,30,40,.18)'; ctx.shadowBlur = 18; ctx.shadowOffsetY = 4;
      ctx.beginPath(); ctx.roundRect(VW / 2 - w / 2, y0, w, h, 14); ctx.fill();
      ctx.shadowColor = 'transparent'; ctx.globalAlpha = a;
      ctx.fillStyle = pal.o; ctx.fillRect(VW / 2 - w / 2 + 22, y0 + h - 12, 36, 4);
      ctx.fillStyle = '#23262c'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      rows.forEach((r, i) => ctx.fillText(r, VW / 2, y0 + 38 + i * 54));
    }
  });

  // quadro com desfoque de movimento quando a câmera corre
  const off = new OffscreenCanvas(VW, VH), oc = off.getContext('2d');
  function render(ctx, t) {
    const dt = 1 / 24, a = cam.at(t), b = cam.at(Math.max(0, t - dt));
    const sp = Math.hypot((a.x - b.x) * a.z, (a.y - b.y) * a.z) + Math.abs(Math.log(a.z / b.z)) * 900;
    const N = sp > 14 ? Math.min(8, Math.ceil(sp * .5 / 6)) : 1;
    if (N === 1) { board.render(ctx, t, cam); return; }
    const ov = board.overlays; board.overlays = [];
    for (let i = 0; i < N; i++) { board.render(oc, t - dt * .5 * i / (N - 1), cam); ctx.globalAlpha = 1 / (i + 1); ctx.drawImage(off, 0, 0); }
    ctx.globalAlpha = 1; board.overlays = ov;
    for (const o of ov) { ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); o.draw(ctx, t); ctx.restore(); }
  }
  return { dur: TL.dur, render, ev: tl.ev, subs, cues: { palette: palName, layout, route } };
}
