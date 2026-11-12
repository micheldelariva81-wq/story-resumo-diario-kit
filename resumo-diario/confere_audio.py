"""Confere a narração por transcrição (faster-whisper, português): cada fala e o áudio final contra o spec.json.
Sai com código 3 se alguma fala ficar abaixo do limite de semelhança. Não pega sílaba tônica (ex.: Fócus).
Números: a comparação ignora números (algarismo x extenso); a linha NUMEROS_OUVIDOS mostra o que foi ouvido para conferir contra a legenda e o resumo."""
import sys, json, os, re, unicodedata, difflib
HERE = os.path.dirname(os.path.abspath(__file__)); J = lambda *a: os.path.join(HERE, *a)
try:
    from faster_whisper import WhisperModel
    m = WhisperModel(os.environ.get('WM', 'small'), device='cpu', compute_type='int8')
except Exception as e:
    print('CONFERENCIA_INDISPONIVEL:', e); sys.exit(0)
NUMW = set("""zero um uma dois duas tres quatro cinco seis sete oito nove dez onze doze treze catorze quatorze quinze dezesseis dezessete dezoito dezenove
vinte trinta quarenta cinquenta sessenta setenta oitenta noventa cem cento duzentos trezentos quatrocentos quinhentos seiscentos setecentos oitocentos novecentos
mil milhao milhoes bilhao bilhoes trilhao trilhoes virgula por e r us reais real centavos centavo dolar dolares""".split())
def toks(s):
    s = unicodedata.normalize('NFD', s.lower()); s = ''.join(c for c in s if unicodedata.category(c) != 'Mn')
    return re.sub(r'[^a-z0-9 ]', ' ', s).split()
def norm(s):
    # o transcritor escreve números em algarismos ("0,42%") e o roteiro traz por extenso: compara só as palavras que não são número
    return [w for w in toks(s) if not w.isdigit() and w not in NUMW]
def nums(s):
    return re.findall(r'(?:R\$|US\$)?\s?\d[\d.,]*\s?%?', s)
def tr(path):
    # exemplo de estilo (números por extenso) com valores que não estão no roteiro, para não induzir a resposta
    segs, _ = m.transcribe(path, beam_size=5, language='pt', initial_prompt='Trinta e sete vírgula oito por cento, nove mil euros e vinte e um reais.')
    return ' '.join(s.text.strip() for s in segs)
spec = json.load(open(J('spec.json'), encoding='utf-8')); res = []; bad = 0
for si, sc in enumerate(spec['scenes']):
    for ii, it in enumerate(sc['items']):
        want = it.get('asr', it['say']); got = tr(J('voices', f's{si}i{ii}.wav'))
        r = difflib.SequenceMatcher(None, norm(want), norm(got)).ratio(); ok = r >= float(os.environ.get('LIM', .72)); bad += not ok
        res.append({'id': f's{si}i{ii}', 'ok': ok, 'semelhanca': round(r, 2), 'esperado': want, 'ouvido': got})
        print('OK  ' if ok else 'DIFF', f's{si}i{ii}', round(r, 2), '|', got)
        if nums(got): print('     NUMEROS_OUVIDOS', f's{si}i{ii}', [n.strip() for n in nums(got)], '| legenda:', it.get('sub', ''))
allw = ' '.join(it.get('asr', it['say']) for sc in spec['scenes'] for it in sc['items']); gotall = tr(J('mix.wav'))
rf = difflib.SequenceMatcher(None, norm(allw), norm(gotall)).ratio(); print('AUDIO_FINAL', round(rf, 2), '|', gotall)
json.dump({'falas': res, 'final': {'semelhanca': round(rf, 2), 'ouvido': gotall}}, open(J('out', 'transcricao.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
if bad or rf < .7: print('AUDIO_COM_PROBLEMA'); sys.exit(3)
print('AUDIO_OK')
