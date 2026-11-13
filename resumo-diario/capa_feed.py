"""Capa do Reel pensada para o feed do Instagram.
Entrega 1080x1920 (o tamanho da capa) com todo o conteúdo dentro do recorte central de
1080x1350, que é o pedaço que o feed mostra; a grade do perfil corta em 1080x1440, mais
folgado, então quem cabe no 4:5 cabe nos dois. Uso: python capa_feed.py saida.jpg"""
import os, sys
from PIL import Image, ImageDraw, ImageFont

HERE = os.path.dirname(os.path.abspath(__file__)); J = lambda *a: os.path.join(HERE, *a)
OUT = sys.argv[1] if len(sys.argv) > 1 else J('out', 'capa_feed.jpg')
W, H = 1080, 1920
SAFE_T, SAFE_B = (H - 1350) // 2, (H + 1350) // 2      # 285 e 1635: recorte do feed
PAPER, INK, SOFT, ACCENT = (242, 239, 232), (35, 38, 44), (90, 95, 103), (217, 119, 87)
F = lambda s: ImageFont.truetype(J('fonts', 'ArchitectsDaughter-Regular.ttf'), s)

im = Image.new('RGB', (W, H), PAPER); d = ImageDraw.Draw(im)
# textura leve de papel, igual à do quadro branco
for y in range(H):
    v = int(10 * (1 - abs(y - 900) / 1100))
    d.line([(0, y), (W, y)], fill=(PAPER[0] - v, PAPER[1] - v, PAPER[2] - v))

def center(txt, y, size, fill, max_w=900):
    f = F(size)
    while d.textlength(txt, font=f) > max_w and size > 20:
        size -= 2; f = F(size)
    d.text((W / 2, y), txt, font=f, fill=fill, anchor='ma')
    return size

# marca: foto em arco + nome, no topo da zona segura
pw, ph = 128, 163; px, py = 92, SAFE_T + 56; r = pw // 2
foto = Image.open(J('foto.jpg')).convert('RGB')
k = max(pw / foto.width, ph / foto.height)
foto = foto.resize((round(foto.width * k), round(foto.height * k)), Image.LANCZOS)
foto = foto.crop(((foto.width - pw) // 2, (foto.height - ph) // 2,
                  (foto.width - pw) // 2 + pw, (foto.height - ph) // 2 + ph))
mask = Image.new('L', (pw, ph), 0); md = ImageDraw.Draw(mask)
md.pieslice([0, 0, pw - 1, pw - 1], 180, 360, fill=255)
md.rectangle([0, r, pw - 1, ph - 1], fill=255)
im.paste(foto, (px, py), mask)
d.arc([px - 3, py - 3, px + pw + 2, py + pw + 2], 180, 360, fill=ACCENT, width=7)
d.line([(px - 3, py + r), (px - 3, py + ph + 2)], fill=ACCENT, width=7)
d.line([(px + pw + 2, py + r), (px + pw + 2, py + ph + 2)], fill=ACCENT, width=7)
d.line([(px - 6, py + ph + 2), (px + pw + 5, py + ph + 2)], fill=ACCENT, width=7)
d.text((px + pw + 34, py + 36), 'Michel Ebertz', font=F(46), fill=INK)
d.text((px + pw + 36, py + 92), 'Assessor de Investimentos', font=F(30), fill=SOFT)

# gancho
y = SAFE_T + 330
for line in ['EM 1990 O GOVERNO', 'TRAVOU O DINHEIRO', 'NOS BANCOS']:
    center(line, y, 94, INK, 920); y += 112
d.rectangle([W / 2 - 110, y + 26, W / 2 + 110, y + 34], fill=ACCENT)

# o que o vídeo responde
y += 108
center('Pode repetir?', y, 60, ACCENT, 880); y += 86
for line in ['Daquele jeito, não. Mas a conta do', 'governo se paga por 3 portas', 'bem mais silenciosas.']:
    center(line, y, 46, SOFT, 880); y += 62

# rodapé, ainda dentro da zona segura
center('@michel_ebertz_investsmart', SAFE_B - 150, 36, SOFT, 880)
center('conteúdo educativo · não é recomendação de investimento', SAFE_B - 88, 26, (120, 125, 132), 900)

os.makedirs(os.path.dirname(OUT), exist_ok=True)
im.save(OUT, quality=92, subsampling=0)
# recortes que o Instagram aplica, para conferir o que aparece em cada lugar
base = os.path.splitext(OUT)[0]
im.crop((0, SAFE_T, W, SAFE_B)).save(base + '_feed_4x5.jpg', quality=92, subsampling=0)
im.crop((0, (H - 1440) // 2, W, (H + 1440) // 2)).save(base + '_grade_3x4.jpg', quality=92, subsampling=0)
print('capa:', OUT, '| recortes:', base + '_feed_4x5.jpg', base + '_grade_3x4.jpg')
