/**
 * Potatisförsäljning klass 4, Rocknebyskolan — mottagare och läsare.
 *
 * Klistras in i Apps Script kopplat till Google Sheetet (se README.md).
 *
 *   doPost  skriver en rad per beställning och svarar med nya totala vinsten.
 *   doGet   svarar med BARA totalsummor — aldrig namn eller kontaktuppgifter.
 */

/* ---- ÄNDRA HÄR ---- */

// ID:t ur Sheet-URL:en: docs.google.com/spreadsheets/d/<DET HÄR>/edit
var SHEET_ID = 'KLISTRA_IN_SHEET_ID_HÄR';

var FLIK = 'Beställningar';

// Måste matcha PRODUKTER i app.js — samma id, samma priser.
var PRODUKTER = [
  { id: 'kingedward', namn: 'King Edward 10 kg', inkop: 75, pris: 130 },
  { id: 'inova',      namn: 'Inova 10 kg',       inkop: 75, pris: 130 },
  { id: 'bintje',     namn: 'Bintje 10 kg',      inkop: 75, pris: 130 },
  { id: 'gullok',     namn: 'Gul lök 5 kg',      inkop: 40, pris: 75  },
  { id: 'rodlok',     namn: 'Röd lök 5 kg',      inkop: 40, pris: 75  },
  { id: 'morotter',   namn: 'Morötter 5 kg',     inkop: 40, pris: 75  }
];

/* ---- Härifrån och ner: rör inte ---- */

var KOL_SUMMA = 4 + PRODUKTER.length;      // 0-indexerad kolumn för "Summa kr"
var KOL_VINST = KOL_SUMMA + 1;

function rubriker() {
  return ['Tidpunkt', 'Namn', 'Telefon', 'E-post']
    .concat(PRODUKTER.map(function (p) { return p.namn; }))
    .concat(['Summa kr', 'Vinst kr', 'Betald', 'Utlämnad', 'Anteckning']);
}

function blad() {
  var ss = SpreadsheetApp.openById(SHEET_ID);
  var s = ss.getSheetByName(FLIK);
  if (!s) {
    s = ss.insertSheet(FLIK);
    s.appendRow(rubriker());
    s.setFrozenRows(1);
  }
  return s;
}

function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    var data = JSON.parse(e.postData.contents);
    var varor = data.varor || {};

    var summa = 0;
    var vinst = 0;
    var antal = PRODUKTER.map(function (p) {
      var n = Number(varor[p.id]) || 0;
      summa += p.pris * n;
      vinst += (p.pris - p.inkop) * n;
      return n;
    });

    var rad = [new Date(), data.namn || '', data.telefon || '', data.epost || '']
      .concat(antal)
      .concat([summa, vinst, '', '', '']);

    blad().appendRow(rad);

    return svara({ ok: true, vinst: totalVinst() }, null);
  } catch (err) {
    return svara({ ok: false, fel: String(err) }, null);
  } finally {
    lock.releaseLock();
  }
}

function doGet(e) {
  var callback = e && e.parameter ? e.parameter.callback : null;
  try {
    return svara({ vinst: totalVinst(), antal: antalRader() }, callback);
  } catch (err) {
    return svara({ vinst: 0, antal: 0 }, callback);
  }
}

function totalVinst() {
  return summeraKolumn(KOL_VINST);
}

function summeraKolumn(index) {
  var s = blad();
  var rader = s.getLastRow() - 1;
  if (rader < 1) return 0;
  return s.getRange(2, index + 1, rader, 1)
    .getValues()
    .reduce(function (sum, r) { return sum + (Number(r[0]) || 0); }, 0);
}

function antalRader() {
  return Math.max(0, blad().getLastRow() - 1);
}

function svara(obj, callback) {
  var json = JSON.stringify(obj);
  if (callback) {
    return ContentService
      .createTextOutput(callback + '(' + json + ')')
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }
  return ContentService
    .createTextOutput(json)
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Kör den här en gång från Apps Script-editorn för att lägga rubrikraden
 * med rätt kolumner. Välj funktionen "installera" och tryck Kör.
 */
function installera() {
  var s = blad();
  s.getRange(1, 1, 1, rubriker().length).setValues([rubriker()]);
  s.setFrozenRows(1);
  Logger.log('Klart. Fliken "%s" har rubrikerna på plats.', FLIK);
}
