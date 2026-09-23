#!/usr/bin/env python3
"""
Genererar affischen med QR-kod som A4-HTML, redo att skrivas ut.

Körs vid behov — resultatet (affisch.html) är incheckat och behöver inga
beroenden för att öppnas eller skrivas ut. Skriptet behövs bara om något
ska ändras.

    python3 -m venv .venv && .venv/bin/pip install segno
    .venv/bin/python affisch/generera-affisch.py

PDF:en skapas sedan med Chrome:

    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
      --headless --disable-gpu --no-pdf-header-footer \
      --print-to-pdf=affisch/affisch.pdf affisch/affisch.html
"""

import pathlib
import segno

URL = 'https://tobiascervin.github.io/potato-seller/'
KONTAKT_NAMN = 'Tobias'
KONTAKT_TEL = '073-726 60 67'
SISTA_DAG = '18 oktober'

# Felkorrigeringsnivå Q tål att en fjärdedel av koden skyms eller smutsas ned —
# rimligt för ett papper på en anslagstavla i en mataffär.
#
# border=4 är INTE dekoration: QR-standarden kräver en tyst zon på fyra moduler
# vit marginal runt koden. Utan den hittar många läsare inte koden alls, vilket
# är verifierat — border=0 gick inte att avkoda.
qr = segno.make(URL, error='q')
# omitsize=True ger en viewBox i stället för fasta width/height. Utan viewBox
# skalas inte ritningen när CSS sätter storleken — den beskärs, och koden blir
# oläsbar. Verifierat: med fast storlek gick affischens QR inte att avkoda.
qr_svg = qr.svg_inline(scale=10, border=4, omitsize=True, dark='#2b2118')

HTML = f"""<!DOCTYPE html>
<html lang="sv">
<head>
<meta charset="utf-8">
<title>Affisch — potatisförsäljning klass 4</title>
<style>
  @page {{ size: A4 portrait; margin: 0; }}

  * {{ box-sizing: border-box; }}

  body {{ margin: 0; }}

  /* Allt ligger i ett ark med fast höjd. overflow:hidden på <body> hindrar inte
     Chromes sidbrytning — den måste sitta på ett inre element, annars hamnar
     sista raden ensam på en sida 2. */
  .ark {{
    width: 210mm;
    height: 296mm;
    overflow: hidden;
    padding: 15mm 16mm 11mm;
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    background: #fdf8f0;
    color: #2b2118;
    font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }}

  .eyebrow {{
    font-size: 15pt;
    font-weight: 700;
    letter-spacing: .18em;
    text-transform: uppercase;
    color: #6b5843;
  }}

  h1 {{
    margin: 5mm 0 0;
    font-size: 48pt;
    line-height: .98;
    letter-spacing: -.02em;
  }}

  .odlare {{
    margin: 6mm 0 0;
    font-size: 15pt;
    line-height: 1.4;
    color: #5a4634;
  }}

  .priser {{
    display: flex;
    gap: 6mm;
    margin: 8mm 0 0;
    width: 100%;
  }}

  .pris {{
    flex: 1;
    padding: 6mm 3mm;
    background: #fff;
    border: 1.5pt solid #e0d3bd;
    border-radius: 4mm;
  }}

  .pris__vara {{ font-size: 15pt; font-weight: 700; }}
  .pris__sorter {{ margin-top: 1.5mm; font-size: 11pt; color: #6b5843; }}
  .pris__belopp {{ margin-top: 3mm; font-size: 30pt; font-weight: 800; color: #b5812a; }}

  .qr-ruta {{
    margin: 7mm 0 0;
    padding: 5mm;
    background: #fff;
    border: 1.5pt solid #e0d3bd;
    border-radius: 5mm;
  }}

  .qr-ruta svg {{ display: block; width: 57mm; height: 57mm; }}

  .skanna {{
    margin: 5mm 0 0;
    font-size: 19pt;
    font-weight: 700;
  }}

  .adress {{
    margin: 2mm 0 0;
    font-size: 12.5pt;
    color: #6b5843;
    word-break: break-all;
  }}

  .deadline {{
    margin: 7mm 0 0;
    padding: 4mm 9mm;
    background: #4f6b3a;
    color: #fff;
    border-radius: 3mm;
    font-size: 19pt;
    font-weight: 700;
  }}

  .fot {{
    margin-top: auto;
    padding-top: 5mm;
    font-size: 12.5pt;
    line-height: 1.55;
    color: #5a4634;
  }}

  .fot strong {{ color: #2b2118; }}
</style>
</head>
<body>
<div class="ark">

  <p class="eyebrow">Klass 4 på Rocknebyskolan säljer</p>

  <h1>Öländsk potatis<br>lök &amp; morötter</h1>

  <p class="odlare">
    Odlat av Niklas på <strong>Norrgårdens Grönsaker</strong><br>
    i Ventlinge på Öland
  </p>

  <div class="priser">
    <div class="pris">
      <div class="pris__vara">Potatis, 10 kg</div>
      <div class="pris__sorter">King Edward · Bintje · Asterix · Inova</div>
      <div class="pris__belopp">130 kr</div>
    </div>
    <div class="pris">
      <div class="pris__vara">Lök &amp; morötter, 5 kg</div>
      <div class="pris__sorter">Gul lök · Röd lök · Morötter</div>
      <div class="pris__belopp">75 kr</div>
    </div>
  </div>

  <div class="qr-ruta">{qr_svg}</div>

  <p class="skanna">Skanna med mobilkameran för att beställa</p>
  <p class="adress">{URL}</p>

  <p class="deadline">Sista beställningsdag {SISTA_DAG}</p>

  <p class="fot">
    Hela förtjänsten går till klasskassan.<br>
    Betalning med Swish vid utlämning — vi mejlar tid och plats när listan stängt.<br>
    Frågor? Ring <strong>{KONTAKT_NAMN}, {KONTAKT_TEL}</strong>
  </p>

</div>
</body>
</html>
"""

ut = pathlib.Path(__file__).parent / 'affisch.html'
ut.write_text(HTML, encoding='utf-8')
print('Skrev', ut, '—', len(HTML), 'tecken')
print('QR: version', qr.version, 'felkorrigering', qr.error.upper(), '→', URL)
