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

Saída em `films/<pasta>/out/`: `video.mp4`, `video.srt`, `capa.jpg`, `transcricao.json`.

O `build.sh` usa o nome da própria pasta, então dá para ter vários filmes lado a lado (`films/resumo-diario`, `films/reel-confisco`, ...) com o mesmo kit.

## spec.json

- `date`: "DD/MM/AAAA". Define o sorteio de paleta (classico, marinho, verde, grafite), layout (esquerda, centro, cartoes) e rota da câmera (zigzag, coluna, linha). Para fixar: `"palette"`, `"layout"`, `"route"`.
- `voice` (padrão `pm_alex`) e `speed` (padrão 1.0).
- `max_s`: duração máxima em segundos (padrão 59, para story; num Reel dá para usar mais).
- `cta`: chapa final de tela cheia, com `title` (lista de linhas), `lines` (lista), `badge` (selo, ex.: "LINK NA BIO") e `handle`. Quando existe, a última cena vira essa chapa: o cabeçalho e a legenda saem e ela desenha a foto no arco, o nome e a chamada. Ver `spec.reel-exemplo.json`.
- `scenes`: no story são 6 cenas (RESUMO DO DIA, MERCADO, INFLAÇÃO, OURO, ECONOMIA, ATÉ AMANHÃ); num Reel o número é livre. Cada uma com `title`, `icon` (calendar, chart, tag, gold, globe, star) e `items`.
- Cada item: `say` (fala, números por extenso), `sub` (legenda, com algarismos), `big` (número em destaque, opcional), `show` (rótulo), `turn: true` (frase "para o seu bolso": pausa antes e traço de destaque).
- `asr`: opcional, o texto como o transcritor deve ouvir. Serve para falas com grafia fonética (ver abaixo).
- Até 2 itens por cena; `show` com até cerca de 50 caracteres.

**Siglas na fala:** a voz lê sigla escrita por extenso errado ("IOF" sai como "GOF"). No campo `say` escreva a sigla foneticamente ("i-ó-éfe") e ponha a forma normal em `asr`, `sub` e `show`.

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
