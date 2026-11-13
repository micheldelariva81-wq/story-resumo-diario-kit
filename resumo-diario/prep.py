"""prep.py lines     -> lines.json (falas para o Kokoro, voz pm_alex)
prep.py timeline  -> timeline.json, mix.wav (só a narração) e out/subs.json. Sai com código 2 se passar de 59 s."""
import sys, json, os
import numpy as np, soundfile as sf
HERE = os.path.dirname(os.path.abspath(__file__)); J = lambda *a: os.path.join(HERE, *a)
spec = json.load(open(J('spec.json'), encoding='utf-8'))
ids = [(si, ii, f's{si}i{ii}') for si, sc in enumerate(spec['scenes']) for ii, _ in enumerate(sc['items'])]
if sys.argv[1] == 'lines':
    lines = [{'id': i, 'text': spec['scenes'][si]['items'][ii]['say'], 'voice': spec.get('voice', 'pm_alex'), 'speed': spec.get('speed', 1.0), 'lang': 'pt-br'} for si, ii, i in ids]
    json.dump(lines, open(J('lines.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1); print('lines', len(lines)); sys.exit(0)
dur = json.load(open(J('voices', 'dur.json'), encoding='utf-8'))
LEAD, GAP, TURN, MOVE, TAIL = .28, .30, .40, .72, 1.3   # fala começa LEAD após a câmera chegar; pausa entre falas; silêncio antes da virada; troca de cena; respiro final
t = .35; scenes = []
for si, sc in enumerate(spec['scenes']):
    S = {'t0': round(t, 3), 'items': []}; t += LEAD
    for ii, it in enumerate(sc['items']):
        if it.get('turn'): t += TURN
        d = dur[f's{si}i{ii}']; S['items'].append({'t0': round(t, 3), 'dur': round(d, 3)}); t += d + GAP
    t += MOVE - GAP; scenes.append(S)
total = round(t - MOVE + TAIL, 3)
json.dump({'dur': total, 'scenes': scenes}, open(J('timeline.json'), 'w'), indent=1)
SR = 24000; mix = np.zeros(int(total * SR) + SR, np.float32)
for si, ii, i in ids:
    y, sr = sf.read(J('voices', i + '.wav')); y = y.mean(1) if y.ndim > 1 else y
    assert sr == SR, sr
    a = int(scenes[si]['items'][ii]['t0'] * SR); mix[a:a + len(y)] += y.astype(np.float32)
sf.write(J('mix24.wav'), mix[:int(total * SR)], SR)
import subprocess
subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', J('mix24.wav'), '-ar', '48000', '-ac', '2', J('mix.wav')], check=True)
os.makedirs(J('out'), exist_ok=True)
subs = [{'t0': scenes[si]['items'][ii]['t0'], 't1': round(scenes[si]['items'][ii]['t0'] + scenes[si]['items'][ii]['dur'] + .3, 2), 'text': spec['scenes'][si]['items'][ii].get('sub') or spec['scenes'][si]['items'][ii]['say']} for si, ii, i in ids]
json.dump(subs, open(J('out', 'subs.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
words = sum(len(spec['scenes'][si]['items'][ii]['say'].split()) for si, ii, i in ids)
print('DURACAO_S', total, '| palavras', words, '| capa em t =', round(scenes[1]['t0'] - .8, 2) if len(scenes) > 1 else 1)
LIM = float(spec.get('max_s', 59.0))   # story: 59 s; reel: pode ser maior
if total > LIM: print(f'LONGO_DEMAIS ({total}s > {LIM}s): encurte o roteiro e rode de novo'); sys.exit(2)
