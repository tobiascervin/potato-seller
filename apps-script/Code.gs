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
  s.getRange(1, 1, 1, rubriker().length).setValues([rubriker()]);
  formatera(s);
  skapaSammanstallning();
  Logger.log('Klart. Fliken "%s" och Sammanställningen är på plats.', FLIK);
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

  var kolBetald = kolumnBokstav(rubriker().length - 2);     // N
  var kolUtlamnad = kolumnBokstav(rubriker().length - 1);   // O
  var kolSumma = kolumnBokstav(KOL_SUMMA + 1);              // L
  var bl = "'" + FLIK + "'!";

  var rutnat = [['Vara', 'Antal sålda', 'Till oss', 'Till Niklas', 'Till klasskassan']];

  PRODUKTER.forEach(function (p, i) {
    var kol = kolumnBokstav(5 + i);
    var r = i + 2;
    rutnat.push([
      p.namn,
      '=SUM(' + bl + kol + '2:' + kol + ')',
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
  var harNamn = '(' + bl + 'B2:B' + SIST + '<>"")';
  var obetald = '(1-' + bl + kolBetald + '2:' + kolBetald + SIST + ')';
  var ejUtlamnad = '(1-' + bl + kolUtlamnad + '2:' + kolUtlamnad + SIST + ')';

  var uppfoljning = totalrad + 2;
  s.getRange(uppfoljning, 1, 4, 2).setValues([
    ['Antal beställningar', '=COUNTA(' + bl + 'B2:B)'],
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
  var kolumner = rubriker().length;          // 16
  var rader = 1000;                          // formatera i förväg, växer med listan
  var forstaVara = 5;                        // kolumn E
  var sistaVara = 4 + PRODUKTER.length;      // kolumn K med sju varor
  var kolSumma = KOL_SUMMA + 1;              // L
  var kolBetald = kolumner - 2;              // N
  var kolAnteckning = kolumner;              // P

  // Rubrikraden: grön med vit text, låst så den följer med när man scrollar.
  s.getRange(1, 1, 1, kolumner)
    .setBackground('#4f6b3a')
    .setFontColor('#ffffff')
    .setFontWeight('bold')
    .setVerticalAlignment('middle')
    .setWrap(true);
  s.setRowHeight(1, 42);
  s.setFrozenRows(1);
  s.setFrozenColumns(2);                     // Tidpunkt + Namn syns alltid

  // Kolumnbredder — smala antalskolumner, breda textkolumner.
  s.setColumnWidth(1, 135);                  // Tidpunkt
  s.setColumnWidth(2, 170);                  // Namn
  s.setColumnWidth(3, 115);                  // Telefon
  s.setColumnWidth(4, 200);                  // E-post
  for (var k = forstaVara; k <= sistaVara; k++) s.setColumnWidth(k, 62);
  s.setColumnWidth(kolSumma, 85);
  s.setColumnWidth(kolSumma + 1, 85);
  s.setColumnWidth(kolBetald, 70);
  s.setColumnWidth(kolBetald + 1, 80);
  s.setColumnWidth(kolAnteckning, 220);

  // Datum utan sekunder, och telefon som text så inledande nolla inte försvinner.
  s.getRange(2, 1, rader, 1).setNumberFormat('yyyy-mm-dd HH:mm');
  s.getRange(2, 3, rader, 1).setNumberFormat('@');

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

    var rad = [new Date(), data.namn || '', data.telefon || '', data.epost || '']
      .concat(antal)
      .concat([summa, vinst, '', '', '']);

    var s = blad();
    s.appendRow(rad);
    // Kryssrutor för Betald och Utlämnad på just den här raden.
    s.getRange(s.getLastRow(), rubriker().length - 2, 1, 2).insertCheckboxes();

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
    + 'Dina uppgifter: ' + data.namn + ', ' + data.telefon + ', ' + data.epost;

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
    + escapeHtml(data.epost) + '</p>'
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
