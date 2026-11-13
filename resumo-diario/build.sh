#!/bin/sh
# Story do resumo diário (quadro branco vertical). Uso: sh films/resumo-diario/build.sh   (a partir de qualquer pasta)
# Entrada: spec.json e foto.jpg nesta pasta. Saída: out/video.mp4, out/video.srt, out/capa.jpg
# Códigos: 2 = LONGO_DEMAIS (encurtar o roteiro) · 3 = AUDIO_COM_PROBLEMA (ver out/transcricao.json)
set -e
HERE=$(cd "$(dirname "$0")" && pwd); ROOT=$(cd "$HERE/../.." && pwd); cd "$ROOT"
PATH="$HOME/ffmpeg7:$PATH"; export PATH
PY=.venv/bin/python; D=films/$(basename "$HERE"); mkdir -p $D/out
GF=https://raw.githubusercontent.com/google/fonts/86aced91de05cd4f96a06838124cca45be337b2b
[ -s $D/fonts/ArchitectsDaughter-Regular.ttf ] || curl -fsSL -o $D/fonts/ArchitectsDaughter-Regular.ttf "$GF/ofl/architectsdaughter/ArchitectsDaughter-Regular.ttf"
$PY $D/prep.py lines
rm -rf $D/voices; $PY core/tts/tts.py $D/lines.json $D/voices
$PY $D/prep.py timeline | tee $D/out/prep.log
CAPA=$(sed -n 's/.*capa em t = \([0-9.]*\).*/\1/p' $D/out/prep.log)
rm -f $D/out/video24.mp4
node core/render/video.mjs $D --fps 24 --workers ${WORKERS:-2} --size 1080x1920 --q 'vp=1080x1920' --out $D/out/video24.mp4
sh core/render/mux.sh $D/out/video24.mp4 $D/mix.wav $D/out/video.mp4 24 2
$PY core/render/srt.py $D/out/subs.json $D/out/video.srt
node core/render/still.mjs $D "$CAPA" --size 1080x1920 --q 'vp=1080x1920&nosubs=1&nopens=1' --prefix capa_ --out $D/out/stills && cp $D/out/stills/capa_*.jpg $D/out/capa.jpg
$PY $D/confere_audio.py || exit 3
echo "pronto: $D/out/video.mp4"
