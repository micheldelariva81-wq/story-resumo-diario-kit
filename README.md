# Kit do story do resumo diário (quadro branco vertical)

Vídeo vertical 1080x1920 no estilo quadro branco para o resumo diário de mercado.
Roda sobre a biblioteca [lemo-opuscar](https://github.com/lemomo-ai/lemo-opuscar) (estilo Whiteboard Explainer).

## Como usar

```sh
# 1. biblioteca e dependências (voz Kokoro, cerca de 350 MB)
git clone https://github.com/lemomo-ai/lemo-opuscar ~/lemo-opuscar
cd ~/lemo-opuscar && sh plugin/skills/lemo-opuscar/scripts/setup.sh deps voice music

# 2. ffmpeg 7+ sem mexer no sistema
uv pip install --python .venv/bin/python imageio-ffmpeg
mkdir -p ~/ffmpeg7 && ln -sf ~/lemo-opuscar/.venv/lib/python*/site-packages/imageio_ffmpeg/binaries/ffmpeg-linux-* ~/ffmpeg7/ffmpeg

# 3. este kit
git clone https://github.com/micheldelariva81-wq/story-resumo-diario-kit ~/kit
cp -r ~/kit/resumo-diario ~/lemo-opuscar/films/

# 4. colocar em ~/lemo-opuscar/films/resumo-diario/:
#    foto.jpg  (foto do cabeçalho, vai na moldura em arco)
#    spec.json (roteiro do dia; ver spec.exemplo.json)

# 5. gerar
sh ~/lemo-opuscar/films/resumo-diario/build.sh
```

Saída em `films/resumo-diario/out/`: `story_do_dia.mp4`, `story_do_dia.srt`, `capa.jpg`, `transcricao.json`.

## spec.json

- `date`: "DD/MM/AAAA". Define o sorteio de paleta (classico, marinho, verde, grafite), layout (esquerda, centro, cartoes) e rota da câmera (zigzag, coluna, linha). Para fixar: `"palette"`, `"layout"`, `"route"`.
- `voice` (padrão `pm_alex`) e `speed` (padrão 1.0).
- `scenes`: 6 cenas (RESUMO DO DIA, MERCADO, INFLAÇÃO, OURO, ECONOMIA, ATÉ AMANHÃ), cada uma com `title`, `icon` (calendar, chart, tag, gold, globe, star) e `items`.
- Cada item: `say` (fala, números por extenso), `sub` (legenda, com algarismos), `big` (número em destaque, opcional), `show` (rótulo), `turn: true` (frase "para o seu bolso": pausa antes e traço de destaque).
- Até 2 itens por cena; `show` com até cerca de 50 caracteres.

## Códigos de saída do build.sh

- `2` LONGO_DEMAIS: passou de 59 s; encurtar as falas.
- `3` AUDIO_COM_PROBLEMA: a transcrição da narração não bateu com o roteiro; ver `out/transcricao.json`.

A conferência ignora números na comparação (o transcritor escreve "0,42%" e o roteiro traz por extenso) e imprime `NUMEROS_OUVIDOS` em cada fala: conferir esses números contra a legenda e o resumo. Ela não pega sílaba tônica; as regras de pronúncia continuam valendo no campo `say`.

## Arquivos

- `film.js`: desenha o vídeo a partir de `spec.json` e `timeline.json`.
- `engine/wb.js`: motor do quadro branco da lemo-opuscar adaptado para vertical (`?vp=1080x1920`) e com a cedilha desenhada.
- `prep.py`: gera as falas, a linha do tempo e o áudio (só narração, sem trilha).
- `confere_audio.py`: conferência por transcrição (faster-whisper).
- `fonts/`: EMS Tech (traço único) e Architects Daughter, ambas sob a SIL Open Font License.

A foto não fica no repositório: é gravada como `foto.jpg` na hora de gerar.
