/* ============================================================
   ÄNDRA HÄR — allt du behöver pilla på ligger i det här blocket.
   ============================================================ */

/* Produkterna. `inkop` = vad vi betalar bonden, `pris` = vad kunden betalar.
   Skillnaden är vinsten till klasskassan och räknas ut automatiskt. */
const PRODUKTER = [
  { id: 'potatis',  namn: 'Potatis',    enhet: '10 kg', inkop: 75, pris: 130, ikon: '🥔' },
  { id: 'morotter', namn: 'Morötter',   enhet: '5 kg',  inkop: 40, pris: 75,  ikon: '🥕' },
  { id: 'gullok',   namn: 'Gul lök',    enhet: '5 kg',  inkop: 40, pris: 75,  ikon: '🧅' },
  { id: 'rodlok',   namn: 'Röd lök',    enhet: '5 kg',  inkop: 40, pris: 75,  ikon: '🧅' },
];

/* Klistra in /exec-URL:en från Apps Script här (se README.md steg 3). */
const SCRIPT_URL = '';

/* Swish-nummer som visas vid utlämning. */
const SWISH_NUMMER = '123 456 78 90';

/* Sista beställningsdag — ren text, skriv som du vill. */
const SISTA_DAG = 'söndag 5 oktober';

/* Valfritt insamlingsmål i kronor. Sätt till null för att dölja progressbaren. */
const MAL_KR = 5000;

/* ============================================================
   Härifrån och ner behöver du normalt inte ändra något.
   ============================================================ */

const kr = n => n.toLocaleString('sv-SE');

const antal = {};
PRODUKTER.forEach(p => { antal[p.id] = 0; });

let gemensamVinst = null;   // null = vi vet inte (räknaren är dold)

/* ---------- Beräkningar ---------- */

function total() {
  return PRODUKTER.reduce((s, p) => s + p.pris * antal[p.id], 0);
}

function vinst() {
  return PRODUKTER.reduce((s, p) => s + (p.pris - p.inkop) * antal[p.id], 0);
}

function valda() {
  return PRODUKTER.filter(p => antal[p.id] > 0);
}

/* ---------- Rendera varorna ---------- */

const varorEl = document.getElementById('varor');

PRODUKTER.forEach(p => {
  const li = document.createElement('li');
  li.className = 'vara';
  li.dataset.id = p.id;
  li.innerHTML = `
    <span class="vara__ikon" aria-hidden="true">${p.ikon}</span>
    <span class="vara__text">
      <span class="vara__namn">${p.namn}</span>
      <span class="vara__pris">${p.enhet} — ${kr(p.pris)} kr</span>
    </span>
    <span class="antal">
      <button type="button" class="antal__knapp" data-steg="-1"
              aria-label="Minska antal ${p.namn}" disabled>−</button>
      <span class="antal__varde" aria-live="polite"
            aria-label="Antal ${p.namn}">0</span>
      <button type="button" class="antal__knapp" data-steg="1"
              aria-label="Öka antal ${p.namn}">+</button>
    </span>`;
  varorEl.appendChild(li);
});

varorEl.addEventListener('click', e => {
  const knapp = e.target.closest('.antal__knapp');
  if (!knapp) return;
  const li = knapp.closest('.vara');
  const id = li.dataset.id;
  antal[id] = Math.max(0, antal[id] + Number(knapp.dataset.steg));
  rita(li, id);
  ritaSumma();
});

function rita(li, id) {
  li.querySelector('.antal__varde').textContent = antal[id];
  li.querySelector('[data-steg="-1"]').disabled = antal[id] === 0;
  li.classList.toggle('vara--vald', antal[id] > 0);
}

function ritaSumma() {
  document.getElementById('summa-total').textContent = kr(total());
  document.getElementById('summa-vinst').textContent = kr(vinst());
}

/* ---------- Statisk text ---------- */

document.getElementById('sista-dag').textContent = SISTA_DAG;
document.getElementById('tack-swishnr').textContent = SWISH_NUMMER;
ritaSumma();

/* ---------- Klasskasse-räknaren ---------- */
/* Hämtar BARA totalsummor från doGet. Misslyckas den göms fältet tyst —
   en trasig räknare får aldrig hindra någon från att beställa. */

const reduceraRorelse =
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function visaKassa(v) {
  gemensamVinst = v;
  if (v <= 0) return;

  const kassa = document.getElementById('kassa');
  kassa.hidden = false;
  raknaUpp(document.getElementById('kassa-sum'), v);

  if (MAL_KR) {
    document.getElementById('kassa-bar').hidden = false;
    const andel = Math.min(100, (v / MAL_KR) * 100);
    requestAnimationFrame(() => {
      document.getElementById('kassa-fill').style.width = andel + '%';
    });
    document.getElementById('kassa-meta').textContent =
      `av målet ${kr(MAL_KR)} kr`;
  }
}

function raknaUpp(el, till) {
  if (reduceraRorelse) { el.textContent = kr(till); return; }
  const start = performance.now();
  const tid = 800;
  (function steg(nu) {
    const t = Math.min(1, (nu - start) / tid);
    const mjuk = 1 - Math.pow(1 - t, 3);
    el.textContent = kr(Math.round(till * mjuk));
    if (t < 1) requestAnimationFrame(steg);
  })(start);
}

function hamtaKassa() {
  if (!SCRIPT_URL) return;

  fetch(SCRIPT_URL)
    .then(r => r.json())
    .then(d => visaKassa(Number(d.vinst) || 0))
    .catch(jsonp);          // CORS på GET är opålitligt i Apps Script
}

function jsonp() {
  const namn = '__kassa' + Date.now();
  const s = document.createElement('script');
  const timer = setTimeout(stad, 8000);

  window[namn] = d => { clearTimeout(timer); stad(); visaKassa(Number(d.vinst) || 0); };
  s.onerror = () => { clearTimeout(timer); stad(); };
  s.src = SCRIPT_URL + (SCRIPT_URL.includes('?') ? '&' : '?') + 'callback=' + namn;
  document.head.appendChild(s);

  function stad() { s.remove(); delete window[namn]; }
}

hamtaKassa();

/* ---------- Skicka beställningen ---------- */

const form = document.getElementById('order');
const skickaBtn = document.getElementById('skicka');
const felEl = document.getElementById('fel');

form.addEventListener('submit', async e => {
  e.preventDefault();
  felEl.hidden = true;

  const namn = document.getElementById('namn');
  const telefon = document.getElementById('telefon');
  const epost = document.getElementById('epost');

  [namn, telefon, epost].forEach(f => f.classList.remove('input--fel'));

  if (valda().length === 0) return visaFel('Välj minst en vara innan du skickar.');

  const tomma = [namn, telefon, epost].filter(f => !f.value.trim());
  if (tomma.length) {
    tomma.forEach(f => f.classList.add('input--fel'));
    tomma[0].focus();
    return visaFel('Fyll i namn, telefon och e-post så vi kan nå dig.');
  }
  if (!epost.checkValidity()) {
    epost.classList.add('input--fel');
    epost.focus();
    return visaFel('E-postadressen ser inte riktig ut.');
  }

  const bestallning = {
    namn: namn.value.trim(),
    telefon: telefon.value.trim(),
    epost: epost.value.trim(),
    varor: Object.fromEntries(PRODUKTER.map(p => [p.id, antal[p.id]])),
  };
  const dinaKr = total();
  const dinVinst = vinst();
  const radenVarorna = valda().map(p => ({ text: `${p.namn} ${p.enhet} × ${antal[p.id]}`,
                                           pris: p.pris * antal[p.id] }));

  skickaBtn.disabled = true;
  skickaBtn.textContent = 'Skickar…';

  const nyTotal = await skicka(bestallning);
  if (nyTotal === false) {
    skickaBtn.disabled = false;
    skickaBtn.textContent = 'Skicka beställning';
    return visaFel('Beställningen kunde inte skickas. Kolla nätet och försök igen.');
  }

  visaTack(dinaKr, dinVinst, radenVarorna, nyTotal);
});

/* Returnerar nya gemensamma totalen, null om okänd, eller false vid fel. */
async function skicka(data) {
  if (!SCRIPT_URL) {
    console.warn('SCRIPT_URL är tom — beställningen sparas inte. Se README.md.');
    return null;
  }
  try {
    // text/plain gör det till en "simple request" → ingen CORS-preflight.
    const r = await fetch(SCRIPT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(data),
    });
    const svar = await r.json();
    return svar && svar.vinst != null ? Number(svar.vinst) : null;
  } catch (err) {
    // Blockerar CORS svaret? Skicka blint — raden skrivs ändå i Sheetet.
    try {
      await fetch(SCRIPT_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(data),
      });
      return null;
    } catch (err2) {
      console.error(err2);
      return false;
    }
  }
}

function visaFel(text) {
  felEl.textContent = text;
  felEl.hidden = false;
}

/* ---------- Celebration ---------- */

const overlay = document.getElementById('overlay');
const stangBtn = document.getElementById('stang');
let sistaFokus = null;

function visaTack(dinaKr, dinVinst, rader, nyTotal) {
  sistaFokus = document.activeElement;

  const beloppEl = document.getElementById('tack-belopp');
  beloppEl.textContent = kr(dinVinst) + ' kr';

  document.getElementById('tack-summa').textContent = kr(dinaKr);

  document.getElementById('tack-lista').innerHTML = rader
    .map(r => `<li><span>${r.text}</span><span>${kr(r.pris)} kr</span></li>`)
    .join('');

  const gemensamt = nyTotal != null ? nyTotal
                  : gemensamVinst != null ? gemensamVinst + dinVinst
                  : null;
  const gemEl = document.getElementById('tack-gemensamt');
  if (gemensamt != null) {
    gemEl.textContent = `Tillsammans har vi nu samlat in ${kr(gemensamt)} kr.`;
    gemEl.hidden = false;
    visaKassa(gemensamt);
  }

  overlay.hidden = false;
  document.body.style.overflow = 'hidden';
  stangBtn.focus();
  if (!reduceraRorelse) konfetti();
}

function stangTack() {
  overlay.hidden = true;
  document.body.style.overflow = '';
  nollstall();
  if (sistaFokus) sistaFokus.focus();
}

/* Tomt formulär igen, så nästa person kan beställa direkt. */
function nollstall() {
  PRODUKTER.forEach(p => {
    antal[p.id] = 0;
    rita(document.querySelector(`.vara[data-id="${p.id}"]`), p.id);
  });
  ritaSumma();

  ['namn', 'telefon', 'epost'].forEach(id => {
    const f = document.getElementById(id);
    f.value = '';
    f.classList.remove('input--fel');
  });

  felEl.hidden = true;
  skickaBtn.disabled = false;
  skickaBtn.textContent = 'Skicka beställning';
}

stangBtn.addEventListener('click', stangTack);
overlay.addEventListener('click', e => { if (e.target === overlay) stangTack(); });
document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && !overlay.hidden) stangTack();
});

document.getElementById('kopiera').addEventListener('click', async e => {
  const belopp = document.getElementById('tack-summa').textContent.replace(/\s/g, '');
  try {
    await navigator.clipboard.writeText(belopp);
    e.target.textContent = 'Kopierat!';
    setTimeout(() => { e.target.textContent = 'Kopiera beloppet'; }, 2000);
  } catch {
    e.target.textContent = 'Kunde inte kopiera';
  }
});

/* ---------- Konfetti ---------- */
/* Ett par dussin rader eget canvas-konfetti. Inga beroenden, körs en gång. */

function konfetti() {
  const canvas = document.getElementById('konfetti');
  const ctx = canvas.getContext('2d');
  const skala = window.devicePixelRatio || 1;
  const b = canvas.width = innerWidth * skala;
  const h = canvas.height = innerHeight * skala;
  ctx.scale(skala, skala);

  const farger = ['#c9922f', '#d4622a', '#4f6b3a', '#fffdf8', '#8a6d3b'];
  const bitar = Array.from({ length: 60 }, () => ({
    x: Math.random() * innerWidth,
    y: -20 - Math.random() * innerHeight * 0.4,
    br: 6 + Math.random() * 6,
    hj: 3 + Math.random() * 5,
    vy: 2 + Math.random() * 3,
    vx: -1 + Math.random() * 2,
    vinkel: Math.random() * Math.PI,
    spin: -0.1 + Math.random() * 0.2,
    farg: farger[Math.floor(Math.random() * farger.length)],
  }));

  const slut = performance.now() + 3500;

  (function rita(nu) {
    ctx.clearRect(0, 0, b, h);
    let kvar = false;

    for (const p of bitar) {
      p.x += p.vx;
      p.y += p.vy;
      p.vinkel += p.spin;
      if (p.y < innerHeight + 30) kvar = true;

      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.vinkel);
      ctx.fillStyle = p.farg;
      ctx.fillRect(-p.br / 2, -p.hj / 2, p.br, p.hj);
      ctx.restore();
    }

    if (kvar && nu < slut) requestAnimationFrame(rita);
    else ctx.clearRect(0, 0, b, h);
  })(performance.now());
}
