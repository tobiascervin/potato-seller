/* ============================================================
   ÄNDRA HÄR — allt du behöver pilla på ligger i det här blocket.
   ============================================================ */

/* Produkterna. `inkop` = vad vi betalar Niklas, `pris` = vad kunden betalar.
   Skillnaden är vinsten till klasskassan och räknas ut automatiskt.
   `ikon` pekar på en av ikonerna längre ner i filen. */
const PRODUKTER = [
  { id: 'kingedward', namn: 'King Edward', sort: 'mjölig',      enhet: '10 kg', inkop: 75, pris: 130, ikon: 'potatis' },
  { id: 'inova',      namn: 'Inova',       sort: 'fast',        enhet: '10 kg', inkop: 75, pris: 130, ikon: 'potatis' },
  { id: 'bintje',     namn: 'Bintje',      sort: 'mellan-fast', enhet: '10 kg', inkop: 75, pris: 130, ikon: 'potatis' },
  { id: 'gullok',     namn: 'Gul lök',     sort: '',            enhet: '5 kg',  inkop: 40, pris: 75,  ikon: 'gullok'  },
  { id: 'rodlok',     namn: 'Röd lök',     sort: '',            enhet: '5 kg',  inkop: 40, pris: 75,  ikon: 'rodlok'  },
  { id: 'morotter',   namn: 'Morötter',    sort: '',            enhet: '5 kg',  inkop: 40, pris: 75,  ikon: 'morot'   },
];

/* Klistra in /exec-URL:en från Apps Script här (se README.md steg 3). */
const SCRIPT_URL = '';

/* Sista beställningsdag — ren text, skriv som du vill. */
const SISTA_DAG = 'söndag 18 oktober';

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

/* ---------- Ikoner ---------- */
/* Egna SVG:er i stället för emoji. Unicode har ingen röd lök — bara 🧅 — så
   gul och röd lök skulle annars se exakt likadana ut. Egna ikoner ser dessutom
   likadana ut i alla webbläsare. */

const IKONER = {
  potatis: `
    <svg viewBox="0 0 32 32" aria-hidden="true">
      <ellipse cx="16" cy="16.5" rx="13" ry="9.5"
               transform="rotate(-16 16 16.5)" fill="#cfa469"/>
      <path d="M6 13c3-4 9-5 14-3" stroke="#e0bb8b" stroke-width="2.4"
            fill="none" stroke-linecap="round"/>
      <circle cx="12" cy="14" r="1.15" fill="#9d7541"/>
      <circle cx="19" cy="12.5" r=".95" fill="#9d7541"/>
      <circle cx="17" cy="20" r="1.05" fill="#9d7541"/>
      <circle cx="23" cy="18" r=".85" fill="#9d7541"/>
    </svg>`,

  gullok: lok('#e8c25c', '#c79a32', '#f3dc9e'),
  rodlok: lok('#a9497f', '#7e3260', '#c87aa6'),

  morot: `
    <svg viewBox="0 0 32 32" aria-hidden="true">
      <path d="M14 8c1-3 3-4 5-4-1 2-1 3-1 4z" fill="#5f8340"/>
      <path d="M17 8c2-2.6 4.5-3 6.5-2.4-1.8 1.4-2.5 2.4-3 3.4z" fill="#4f6b3a"/>
      <path d="M16 29.5 10.2 13.4Q16 10.4 21.8 13.4Z" fill="#dd6b28"/>
      <path d="M12.4 17.5h6.2M13.6 21.5h4.4" stroke="#b74f18"
            stroke-width="1.3" stroke-linecap="round"/>
    </svg>`,
};

/* Löken delar form mellan gul och röd — bara färgerna skiljer. */
function lok(skal, skugga, ljus) {
  return `
    <svg viewBox="0 0 32 32" aria-hidden="true">
      <path d="M16 6.5c1.5 1.6 2.2 2.6 2.2 2.6h-4.4S14.5 8.1 16 6.5z" fill="#5f8340"/>
      <path d="M16 8c5.4 5.2 10 9.2 10 14.1 0 4.6-4.5 7.9-10 7.9S6 26.7 6 22.1C6 17.2 10.6 13.2 16 8z"
            fill="${skal}"/>
      <path d="M16 8c5.4 5.2 10 9.2 10 14.1 0 4.6-4.5 7.9-10 7.9V8z"
            fill="${skugga}" opacity=".55"/>
      <path d="M16 9.5V29M11.2 12.8C9 16 8 19 8 22.1c0 2.4 1.3 4.4 3.3 5.6M20.8 12.8C23 16 24 19 24 22.1c0 2.4-1.3 4.4-3.3 5.6"
            stroke="${ljus}" stroke-width="1.1" fill="none"
            stroke-linecap="round" opacity=".8"/>
    </svg>`;
}

/* ---------- Rendera varorna ---------- */

const varorEl = document.getElementById('varor');

PRODUKTER.forEach(p => {
  const li = document.createElement('li');
  li.className = 'vara';
  li.dataset.id = p.id;
  const sort = p.sort ? ` · ${p.sort}` : '';
  li.innerHTML = `
    <span class="vara__ikon">${IKONER[p.ikon]}</span>
    <span class="vara__text">
      <span class="vara__namn">${p.namn}</span>
      <span class="vara__meta">${p.enhet}${sort}</span>
      <span class="vara__belopp">${kr(p.pris)} kr</span>
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

/* ---------- Validering ---------- */

/* Plockar bort mellanslag, bindestreck, punkter och parenteser, och gör
   +46/0046 till en vanlig nolla. "+46 70 123 45 67" blir "0701234567". */
function normaliseraTelefon(v) {
  return v.replace(/[\s\-().\/]/g, '')
          .replace(/^\+46/, '0')
          .replace(/^0046/, '0');
}

/* Svenska mobilnummer: 070, 072, 073, 076, 079 + sju siffror. */
const MOBIL = /^07[02369]\d{7}$/;
/* Fast telefoni: riktnummer + abonnentnummer, totalt 8-10 siffror. */
const FASTNAT = /^0[1-9]\d{6,8}$/;
/* Kräver tecken före @, efter @, och en toppdomän på minst två bokstäver.
   type="email" släpper igenom "a@b" — det gör inte den här. */
const EPOST = /^[^\s@]+@[^\s@]+\.[a-zA-ZåäöÅÄÖ]{2,}$/;

const FALT = [
  {
    id: 'namn',
    kontrollera(v) {
      if (!v) return 'Fyll i ditt namn.';
      if (v.length < 2) return 'Namnet ser för kort ut.';
      return null;
    },
  },
  {
    id: 'telefon',
    kontrollera(v) {
      if (!v) return 'Fyll i ditt telefonnummer.';
      const n = normaliseraTelefon(v);
      if (n.startsWith('+')) return 'Vi kan bara nå svenska nummer — skriv det som 070-123 45 67.';
      if (!/^\d+$/.test(n)) return 'Telefonnummer ska bara innehålla siffror.';
      if (!n.startsWith('0')) return 'Skriv numret som 070-123 45 67 eller +46 70 123 45 67.';
      if (MOBIL.test(n) || FASTNAT.test(n)) return null;
      return n.length < 8 ? 'Numret ser för kort ut.'
           : n.length > 11 ? 'Numret ser för långt ut.'
           : 'Kontrollera numret — t.ex. 070-123 45 67.';
    },
    /* Spara numret i normaliserad form, så Sheetet blir enhetligt. */
    stada: normaliseraTelefon,
  },
  {
    id: 'epost',
    kontrollera(v) {
      if (!v) return 'Fyll i din e-postadress.';
      if (!v.includes('@')) return 'E-postadressen saknar @.';
      if (!EPOST.test(v)) return 'E-postadressen ser inte riktig ut.';
      return null;
    },
    stada: v => v.toLowerCase(),
  },
];

function visaFaltfel(falt, text) {
  const input = document.getElementById(falt.id);
  const felrad = document.getElementById('fel-' + falt.id);

  input.classList.toggle('input--fel', Boolean(text));
  input.setAttribute('aria-invalid', text ? 'true' : 'false');
  felrad.textContent = text || '';
  felrad.hidden = !text;
}

/* Returnerar första ogiltiga fältet, eller null om allt är ifyllt och rimligt. */
function granskaAlla() {
  let forsta = null;
  FALT.forEach(falt => {
    const v = document.getElementById(falt.id).value.trim();
    const fel = falt.kontrollera(v);
    visaFaltfel(falt, fel);
    if (fel && !forsta) forsta = falt;
  });
  return forsta;
}

/* Visa fel när man lämnar fältet, men göm det så fort man rättar — att bli
   tillrättavisad medan man skriver är irriterande. */
FALT.forEach(falt => {
  const input = document.getElementById(falt.id);
  input.addEventListener('blur', () => {
    if (input.value.trim()) visaFaltfel(falt, falt.kontrollera(input.value.trim()));
  });
  input.addEventListener('input', () => {
    if (input.classList.contains('input--fel')) visaFaltfel(falt, null);
  });
});

/* ---------- Skicka beställningen ---------- */

const form = document.getElementById('order');
const skickaBtn = document.getElementById('skicka');
const felEl = document.getElementById('fel');

form.addEventListener('submit', async e => {
  e.preventDefault();
  felEl.hidden = true;

  if (valda().length === 0) return visaFel('Välj minst en vara innan du skickar.');

  const trasigt = granskaAlla();
  if (trasigt) {
    document.getElementById(trasigt.id).focus();
    return visaFel('Kontrollera dina uppgifter så vi kan nå dig om beställningen.');
  }

  const varde = id => {
    const falt = FALT.find(f => f.id === id);
    const v = document.getElementById(id).value.trim();
    return falt.stada ? falt.stada(v) : v;
  };

  const bestallning = {
    namn: varde('namn'),
    telefon: varde('telefon'),
    epost: varde('epost'),
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

  FALT.forEach(falt => {
    document.getElementById(falt.id).value = '';
    visaFaltfel(falt, null);
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
