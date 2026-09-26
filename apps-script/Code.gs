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
var SHEET_ID = '1SSqP5TsYxc8MV5sQAlrVAeHu73TmT11c-H-xCm517n4';

var FLIK = 'Beställningar';
var SAMMANSTALLNING = 'Sammanställning';

// Talformat. KRONOR visar "0 kr" för nollor; ANTAL göms helt vid noll, så
// beställningsraderna inte blir en vägg av nollor.
var KRONOR = '# ##0 "kr";-# ##0 "kr";0 "kr"';
var ANTAL = '0;-0;';

// Bekräftelsemejl till köparen. Sätt till false för att stänga av helt.
var SKICKA_BEKRAFTELSE = true;

// Visningsnamnet köparen ser som avsändare. Själva adressen blir det Google-konto
// som publicerat scriptet — det går inte att ändra i Apps Script.
var AVSANDARNAMN = 'Klass 4, Rocknebyskolan';

// Text i mejlet om utlämningen.
var UTLAMNING = 'När beställningen stänger den 18 oktober mejlar vi ut tid och plats '
  + 'för utlämningen till alla som beställt.';

// Kolumnerna före och efter varorna. Ordningen här är ordningen i Sheetet.
var BARN = 'Barn i klassen';
var FORE = ['Tidpunkt', 'Namn', BARN, 'Telefon', 'E-post'];
var EFTER = ['Summa kr', 'Vinst kr', 'Betald', 'Utlämnad', 'Anteckning'];

// Måste matcha PRODUKTER i app.js — samma id, samma priser.
var PRODUKTER = [
  { id: 'kingedward', namn: 'King Edward 10 kg', inkop: 75, pris: 130 },
  { id: 'bintje',     namn: 'Bintje 10 kg',      inkop: 75, pris: 130 },
  { id: 'asterix',    namn: 'Asterix 10 kg',     inkop: 75, pris: 130 },
  { id: 'inova',      namn: 'Inova 10 kg',       inkop: 75, pris: 130 },
  { id: 'gullok',     namn: 'Gul lök 5 kg',      inkop: 40, pris: 75  },
  { id: 'rodlok',     namn: 'Röd lök 5 kg',      inkop: 40, pris: 75  },
  { id: 'morotter',   namn: 'Morötter 5 kg',     inkop: 40, pris: 75  }
];

/**
 * KÖR DEN HÄR FÖRST.
 *
 * Lägger rubrikraden i fliken "Beställningar" med rätt kolumner. Kör om den
 * varje gång sortimentet i PRODUKTER ändras, annars hamnar siffrorna fel.
 *
 * Den ligger överst i filen för att Apps Script förväljer den första
 * funktionen i Kör-rullgardinen. Spara filen (Cmd+S) om den inte syns i listan.
 */
function installera() {
  var s = blad();
  if (migreraBarnkolumn(s)) {
    Logger.log('Lade till kolumnen "%s" och flyttade befintliga rader åt höger.', BARN);
  }
  s.getRange(1, 1, 1, rubriker().length).setValues([rubriker()]);
  formatera(s);
  skapaSammanstallning();
  Logger.log('Klart. Fliken "%s" och Sammanställningen är på plats.', FLIK);
}

/**
 * Lägger in kolumnen för barn i ett Sheet som skapades innan den fanns.
 *
 * Skriver man bara nya rubriker hamnar gamla rader under fel kolumn —
 * antalet King Edward skulle stå under "Barn i klassen". Därför en riktig
 * kolumninsättning, som flyttar befintlig data åt höger. Gör ingenting om
 * kolumnen redan finns, så installera kan köras hur många gånger som helst.
 */
function migreraBarnkolumn(s) {
  var rubrikrad = lasRubriker(s);
  if (rubrikrad.indexOf(BARN) !== -1) return false;
  var namnKol = rubrikrad.indexOf('Namn') + 1;
  if (namnKol < 1) return false;            // okänd layout — rör ingenting
  s.insertColumnAfter(namnKol);
  s.getRange(1, namnKol + 1).setValue(BARN);
  return true;
}

/**
 * Bygger om fliken "Sammanställning" från PRODUKTER, så den alltid speglar
 * sortimentet. Fliken är helt genererad — allt du själv skriver in i den
 * försvinner nästa gång installera körs. Egna anteckningar hör hemma i
 * kolumnen Anteckning på beställningsraden.
 */
function skapaSammanstallning() {
  var ss = SpreadsheetApp.openById(SHEET_ID);
  var s = ss.getSheetByName(SAMMANSTALLNING);
  if (!s) {
    s = ss.insertSheet(SAMMANSTALLNING, 0);
  }
  s.clear();
  s.clearConditionalFormatRules();

  var kolBetald = kolumnBokstav(kol('Betald'));
  var kolUtlamnad = kolumnBokstav(kol('Utlämnad'));
  var kolSumma = kolumnBokstav(kol('Summa kr'));
  var kolNamn = kolumnBokstav(kol('Namn'));
  var bl = "'" + FLIK + "'!";

  var rutnat = [['Vara', 'Antal sålda', 'Till oss', 'Till Niklas', 'Till klasskassan']];

  PRODUKTER.forEach(function (p, i) {
    var k = kolumnBokstav(kol(p.namn));
    var r = i + 2;
    rutnat.push([
      p.namn,
      '=SUM(' + bl + k + '2:' + k + ')',
      '=B' + r + '*' + p.pris,
      '=B' + r + '*' + p.inkop,
      '=C' + r + '-D' + r
    ]);
  });

  var totalrad = PRODUKTER.length + 2;
  rutnat.push([
    'TOTALT',
    '=SUM(B2:B' + (totalrad - 1) + ')',
    '=SUM(C2:C' + (totalrad - 1) + ')',
    '=SUM(D2:D' + (totalrad - 1) + ')',
    '=SUM(E2:E' + (totalrad - 1) + ')'
  ]);

  s.getRange(1, 1, rutnat.length, 5).setValues(rutnat);

  // Två fällor undviks här:
  //
  //   1. Argumentavgränsare. Svenska Sheets vill ha ; och engelska vill ha , och
  //      Apps Script översätter inte. SUMPRODUCT med * i stället för flera
  //      argument slipper problemet — alla formler här tar ett argument.
  //
  //   2. Booleaner. FALSE/TRUE heter FALSKT/SANT på svenska, men att jämföra mot
  //      0 och 1 fungerar INTE: Sheets rankar tal under booleaner, så N2=0 blir
  //      falskt även för en urkryssad ruta. I aritmetik konverteras de däremot,
  //      så 1-FALSKT ger 1 och 1-SANT ger 0. Därför subtraktion, inte jämförelse.
  var SIST = 1000;
  var harNamn = '(' + bl + kolNamn + '2:' + kolNamn + SIST + '<>"")';
  var obetald = '(1-' + bl + kolBetald + '2:' + kolBetald + SIST + ')';
  var ejUtlamnad = '(1-' + bl + kolUtlamnad + '2:' + kolUtlamnad + SIST + ')';

  var uppfoljning = totalrad + 2;
  s.getRange(uppfoljning, 1, 4, 2).setValues([
    ['Antal beställningar', '=COUNTA(' + bl + kolNamn + '2:' + kolNamn + ')'],
    ['Obetalda beställningar', '=SUMPRODUCT(' + harNamn + '*' + obetald + ')'],
    ['Obetalt belopp', '=SUMPRODUCT(' + harNamn + '*' + obetald + '*'
      + bl + kolSumma + '2:' + kolSumma + SIST + ')'],
    ['Inte utlämnade', '=SUMPRODUCT(' + harNamn + '*' + ejUtlamnad + ')']
  ]);

  // Utseende
  s.getRange(1, 1, 1, 5)
    .setBackground('#4f6b3a').setFontColor('#ffffff').setFontWeight('bold');
  s.setFrozenRows(1);
  s.setColumnWidth(1, 190);
  s.setColumnWidth(2, 110);
  for (var k = 3; k <= 5; k++) s.setColumnWidth(k, 130);

  s.getRange(2, 2, PRODUKTER.length + 1, 1).setHorizontalAlignment('center');
  s.getRange(2, 3, PRODUKTER.length + 1, 3).setNumberFormat(KRONOR);
  s.getRange(totalrad, 1, 1, 5)
    .setFontWeight('bold')
    .setBackground('#f0e9dc')
    .setBorder(true, null, null, null, null, null);

  // Klasskassan är hela poängen — gör den grön och stor.
  s.getRange(totalrad, 5).setFontColor('#4f6b3a').setFontSize(13);

  s.getRange(uppfoljning, 1, 4, 1).setFontWeight('bold');
  s.getRange(uppfoljning + 2, 2).setNumberFormat(KRONOR);
}

/**
 * Gör Sheetet läsbart för mänskliga ögon. Körs av installera() och går att köra
 * om hur många gånger som helst — den rör bara utseendet, aldrig innehållet.
 */
function formatera(s) {
  var kolumner = rubriker().length;
  var rader = 1000;                          // formatera i förväg, växer med listan
  var forstaVara = FORE.length + 1;
  var sistaVara = FORE.length + PRODUKTER.length;
  var kolSumma = kol('Summa kr');
  var kolBetald = kol('Betald');
  var kolAnteckning = kol('Anteckning');

  // Rubrikraden: grön med vit text, låst så den följer med när man scrollar.
  s.getRange(1, 1, 1, kolumner)
    .setBackground('#4f6b3a')
    .setFontColor('#ffffff')
    .setFontWeight('bold')
    .setVerticalAlignment('middle')
    .setWrap(true);
  s.setRowHeight(1, 42);
  s.setFrozenRows(1);
  s.setFrozenColumns(3);                     // Tidpunkt, Namn och Barn syns alltid

  // Kolumnbredder — smala antalskolumner, breda textkolumner.
  s.setColumnWidth(kol('Tidpunkt'), 135);
  s.setColumnWidth(kol('Namn'), 170);
  s.setColumnWidth(kol(BARN), 120);
  s.setColumnWidth(kol('Telefon'), 115);
  s.setColumnWidth(kol('E-post'), 200);
  for (var k = forstaVara; k <= sistaVara; k++) s.setColumnWidth(k, 62);
  s.setColumnWidth(kolSumma, 85);
  s.setColumnWidth(kolSumma + 1, 85);
  s.setColumnWidth(kolBetald, 70);
  s.setColumnWidth(kolBetald + 1, 80);
  s.setColumnWidth(kolAnteckning, 220);

  // Datum utan sekunder, och telefon som text så inledande nolla inte försvinner.
  s.getRange(2, 1, rader, 1).setNumberFormat('yyyy-mm-dd HH:mm');
  s.getRange(2, kol('Telefon'), rader, 1).setNumberFormat('@');

  // Antalskolumnerna: centrerade, och nollor visas som tomt. Då ser man direkt
  // vad någon faktiskt beställt i stället för ett fält med sex nollor.
  s.getRange(2, forstaVara, rader, PRODUKTER.length)
    .setHorizontalAlignment('center')
    .setNumberFormat(ANTAL);

  // Belopp med kr och tusenavgränsare.
  s.getRange(2, kolSumma, rader, 2).setNumberFormat(KRONOR);
  s.getRange(2, kolSumma, rader, 1).setFontWeight('bold');

  s.getRange(2, kolAnteckning, rader, 1).setWrap(true);

  // Betalda rader tonas gröna, så man ser på en halv sekund vad som återstår.
  var regel = SpreadsheetApp.newConditionalFormatRule()
    .whenFormulaSatisfied('=$' + kolumnBokstav(kolBetald) + '2')
    .setBackground('#eaf3e3')
    .setRanges([s.getRange(2, 1, rader, kolumner)])
    .build();
  s.setConditionalFormatRules([regel]);

  // Kryssrutor på de rader som redan finns. Nya rader får sina i doPost —
  // annars skulle tusen tomma kryssrutor räknas som obetalda beställningar.
  var befintliga = s.getLastRow() - 1;
  if (befintliga > 0) s.getRange(2, kolBetald, befintliga, 2).insertCheckboxes();

  s.getRange(1, 1, rader + 1, kolumner).setVerticalAlignment('middle');
}

/* 1 → A, 14 → N. */
function kolumnBokstav(n) {
  var bokstav = '';
  while (n > 0) {
    var rest = (n - 1) % 26;
    bokstav = String.fromCharCode(65 + rest) + bokstav;
    n = Math.floor((n - 1) / 26);
  }
  return bokstav;
}

/* ---- Härifrån och ner: rör inte ---- */

function rubriker() {
  return FORE
    .concat(PRODUKTER.map(function (p) { return p.namn; }))
    .concat(EFTER);
}

/* Kolumnens nummer (1 = A) i den layout rubriker() beskriver. Används där
   installera redan har sett till att Sheetet ser ut så. */
function kol(namn) {
  var i = rubriker().indexOf(namn);
  if (i === -1) throw new Error('Okänd kolumn: ' + namn);
  return i + 1;
}

/* Rubrikraden som den faktiskt ser ut i Sheetet just nu. doPost och doGet
   går efter den i stället för efter rubriker(), så att en beställning som
   kommer in innan installera hunnit köras ändå hamnar i rätt kolumner. */
function lasRubriker(s) {
  var bredd = Math.max(1, s.getLastColumn());
  return s.getRange(1, 1, 1, bredd).getValues()[0];
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

    // Samma beställning två gånger? Klienten gör ett omtag om den inte kunde
    // läsa svaret, och då kommer identisk data med samma ref. Utan den här
    // kontrollen blir det två rader och två bekräftelsemejl.
    if (data.ref && redanMottagen(data.ref)) {
      return svara({ ok: true, dubblett: true, vinst: totalVinst() }, null);
    }

    var summa = 0;
    var vinst = 0;
    var antal = PRODUKTER.map(function (p) {
      var n = Number(varor[p.id]) || 0;
      summa += p.pris * n;
      vinst += (p.pris - p.inkop) * n;
      return n;
    });

    // Värdena knyts till rubriknamn, och raden byggs efter Sheetets faktiska
    // rubrikrad. Finns en kolumn inte (t.ex. Barn innan installera körts) så
    // hoppas den bara över — resten hamnar ändå rätt.
    var varden = {
      'Tidpunkt': new Date(),
      'Namn': data.namn || '',
      // Apostrof tvingar text: annars gör Sheets om 0701234567 till 701234567.
      'Telefon': data.telefon ? "'" + data.telefon : '',
      'E-post': data.epost || '',
      'Summa kr': summa,
      'Vinst kr': vinst
    };
    varden[BARN] = data.barn || '';
    PRODUKTER.forEach(function (p, i) { varden[p.namn] = antal[i]; });

    var s = blad();
    var rubrikrad = lasRubriker(s);
    s.appendRow(rubrikrad.map(function (r) {
      return Object.prototype.hasOwnProperty.call(varden, r) ? varden[r] : '';
    }));

    // Kryssrutor för Betald och Utlämnad på just den här raden.
    var nyRad = s.getLastRow();
    ['Betald', 'Utlämnad'].forEach(function (namn) {
      var k = rubrikrad.indexOf(namn) + 1;
      if (k > 0) s.getRange(nyRad, k).insertCheckboxes();
    });

    // Kvittera direkt efter appendRow. Skulle mejlet nedan hänga sig och
    // klienten göra ett omtag, ska omtaget se raden som redan mottagen.
    if (data.ref) kvittera(data.ref);

    // Egen try/catch: ett trasigt mejl får aldrig se ut som en misslyckad
    // beställning. Raden ligger redan i Sheetet när vi kommer hit.
    if (SKICKA_BEKRAFTELSE && data.epost) {
      try {
        skickaBekraftelse(data, antal, summa, vinst);
      } catch (mailFel) {
        Logger.log('Bekräftelsemejl misslyckades: %s', mailFel);
      }
    }

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
  var s = blad();
  var rader = s.getLastRow() - 1;
  if (rader < 1) return 0;
  var k = lasRubriker(s).indexOf('Vinst kr') + 1;
  if (k < 1) return 0;
  return s.getRange(2, k, rader, 1)
    .getValues()
    .reduce(function (sum, r) { return sum + (Number(r[0]) || 0); }, 0);
}

function antalRader() {
  return Math.max(0, blad().getLastRow() - 1);
}

/**
 * Har vi redan tagit emot beställningen med det här id:t?
 *
 * Id:na sparas bland scriptets egenskaper, inte i Sheetet, så att
 * kolumnerna inte påverkas. De städas bort av att hela projektet raderas
 * när försäljningen är över.
 */
function redanMottagen(ref) {
  return PropertiesService.getScriptProperties().getProperty('ref:' + ref) !== null;
}

function kvittera(ref) {
  PropertiesService.getScriptProperties()
    .setProperty('ref:' + ref, String(new Date().getTime()));
}

/**
 * Bekräftelse till köparen med underlaget för ordern.
 * Skickas från det konto som publicerat scriptet, med AVSANDARNAMN som visningsnamn.
 */
function skickaBekraftelse(data, antal, summa, vinst) {
  var poster = [];
  for (var i = 0; i < PRODUKTER.length; i++) {
    if (antal[i] > 0) {
      poster.push({
        namn: PRODUKTER[i].namn,
        antal: antal[i],
        belopp: PRODUKTER[i].pris * antal[i]
      });
    }
  }

  var text = 'Hej ' + data.namn + '!\n\n'
    + 'Tack för din beställning. Här är underlaget:\n\n'
    + poster.map(function (p) {
        return '  ' + p.namn + ' × ' + p.antal + '   ' + kronor(p.belopp) + ' kr';
      }).join('\n')
    + '\n\n  Att betala: ' + kronor(summa) + ' kr'
    + '\n  Varav till klasskassan: ' + kronor(vinst) + ' kr\n\n'
    + 'Betalning sker med Swish vid utlämningen. ' + UTLAMNING + '\n\n'
    + 'Varorna kommer från Niklas på Norrgårdens Grönsaker i Ventlinge på Öland.\n\n'
    + 'Vill du ändra eller avbeställa? Svara på det här mejlet.\n\n'
    + 'Tack för att du stöttar klassen!\n'
    + AVSANDARNAMN + '\n\n'
    + '---\n'
    + 'Dina uppgifter: ' + data.namn + ', ' + data.telefon + ', ' + data.epost
    + (data.barn ? '\nHandlat via: ' + data.barn : '');

  var html = '<div style="font-family:-apple-system,Segoe UI,sans-serif;'
    + 'font-size:15px;color:#3d2f22;max-width:520px">'
    + '<p>Hej ' + escapeHtml(data.namn) + '!</p>'
    + '<p>Tack för din beställning. Här är underlaget:</p>'
    + '<table cellpadding="6" cellspacing="0" style="border-collapse:collapse;width:100%">'
    + poster.map(function (p) {
        return '<tr>'
          + '<td style="border-bottom:1px solid #e3d7c4">'
          + escapeHtml(p.namn) + ' × ' + p.antal + '</td>'
          + '<td align="right" style="border-bottom:1px solid #e3d7c4;white-space:nowrap">'
          + kronor(p.belopp) + ' kr</td></tr>';
      }).join('')
    + '<tr><td style="padding-top:10px"><strong>Att betala</strong></td>'
    + '<td align="right" style="padding-top:10px"><strong>' + kronor(summa) + ' kr</strong></td></tr>'
    + '<tr><td colspan="2" style="color:#4f6b3a">Varav ' + kronor(vinst)
    + ' kr går till klasskassan.</td></tr>'
    + '</table>'
    + '<p>Betalning sker med <strong>Swish vid utlämningen</strong>. '
    + escapeHtml(UTLAMNING) + '</p>'
    + '<p>Varorna kommer från Niklas på Norrgårdens Grönsaker i Ventlinge på Öland.</p>'
    + '<p>Vill du ändra eller avbeställa? Svara på det här mejlet.</p>'
    + '<p>Tack för att du stöttar klassen!<br>' + escapeHtml(AVSANDARNAMN) + '</p>'
    + '<hr style="border:0;border-top:1px solid #e3d7c4">'
    + '<p style="font-size:13px;color:#6b5843">Dina uppgifter: '
    + escapeHtml(data.namn) + ', ' + escapeHtml(data.telefon) + ', '
    + escapeHtml(data.epost)
    + (data.barn ? '<br>Handlat via: ' + escapeHtml(data.barn) : '')
    + '</p>'
    + '</div>';

  MailApp.sendEmail({
    to: data.epost,
    name: AVSANDARNAMN,
    subject: 'Din beställning: potatis och rotfrukter — ' + kronor(summa) + ' kr',
    body: text,
    htmlBody: html
  });
}

/* 1 234 i stället för 1234, som på sidan. */
function kronor(n) {
  return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
}

function escapeHtml(v) {
  return String(v)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
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
