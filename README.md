# Öländsk potatis — klass 4, Rocknebyskolan

En liten statisk beställningssida för klassens försäljning av öländsk potatis, lök och
morötter från Niklas på Norrgårdens Grönsaker i Ventlinge. Beställningarna landar som
rader i ett Google Sheet som alla klassföräldrar kan öppna.

**Engångsbruk.** Radera repot och Sheetet när omgången är klar.

## Så funkar det

```
Kund i webbläsaren  →  GitHub Pages (statisk sida)  →  Google Apps Script  →  Google Sheet
```

GitHub Pages kan inte lagra något själv, så sidan skickar beställningen vidare till ett
litet Apps Script som skriver en rad i Sheetet. Sheetet är hela administrationen: där
ser ni vem som köpt vad, vad ni sålt för, och vad som blir kvar till klasskassan.

## Sortiment

Potatisen finns i fyra sorter, som köparen väljer mellan:

| Vara | Inköp från Niklas | Vårt pris | Till klasskassan |
|---|---|---|---|
| King Edward 10 kg (mjölig) | 75 kr | 130 kr | 55 kr |
| Bintje 10 kg (mellan-fast) | 75 kr | 130 kr | 55 kr |
| Asterix 10 kg | 75 kr | 130 kr | 55 kr |
| Inova 10 kg (fast) | 75 kr | 130 kr | 55 kr |
| Gul lök 5 kg | 40 kr | 75 kr | 35 kr |
| Röd lök 5 kg | 40 kr | 75 kr | 35 kr |
| Morötter 5 kg | 40 kr | 75 kr | 35 kr |

Sortimentet och priserna ändras på **två** ställen, som måste stämma med varandra:
`PRODUKTER` högst upp i [`app.js`](app.js) och `PRODUKTER` i
[`apps-script/Code.gs`](apps-script/Code.gs). Samma `id`, samma priser — annars blir
summorna i Sheetet fel.

Varje vara har en kort beskrivning (`text`) som hjälper köparen välja sort, och en egen
ikon (se `IKONER` längre ner i `app.js`). Ikonerna är egna
SVG:er, inte emoji — Unicode har ingen röd lök, så gul och röd lök skulle annars sett
exakt likadana ut.

## Svenskt Apps Script-gränssnitt

Instruktionerna nedan använder de engelska menynamnen. Har du Google på svenska:

| Engelska | Svenska |
|---|---|
| Extensions → Apps Script | Tillägg → Apps Script |
| Run | Kör |
| Save | Spara |
| Executions | Körningar |
| Deploy | **Implementera** (blå knapp uppe till höger) |
| New deployment | Ny implementering |
| Manage deployments | Hantera implementeringar |
| Web app | Webbapp |
| Execute as: Me | Kör som: Jag |
| Who has access: Anyone | Vem har åtkomst: Alla |
| Advanced → Go to … (unsafe) | Avancerat → fortsätt till projektet ändå |

Översättningarna i undermenyerna kan variera. Gå efter strukturen: Implementera är
alltid blå knappen uppe till höger, sedan väljer du typ via kugghjulet, sedan två
rullgardiner innan du bekräftar.

## Sätt upp (ca 20 minuter)

### 1. Google Sheetet
Redan skapat, och ID:t är inlagt i `SHEET_ID` i
[`apps-script/Code.gs`](apps-script/Code.gs). Byter ni Sheet är det ID:t ur adressfältet
— den långa biten mellan `/d/` och `/edit` — som ska in där.

### 2. Lägg in scriptet
I Sheetet: **Tillägg → Apps Script**. Radera det som ligger där och klistra in hela
innehållet i [`apps-script/Code.gs`](apps-script/Code.gs).

Spara.

Spara filen (**Cmd+S**) — funktionslistan uppdateras först då. Kontrollera att
**`installera`** står i rullgardinen bredvid ▶ Kör (den ligger överst i filen och är
förvald) och tryck **Kör**. Godkänn behörigheterna när
Google frågar (den vill komma åt ditt eget Sheet — det är förväntat). Nu finns fliken
`Beställningar` med rubrikraden.

### 3. Publicera scriptet
**Deploy → New deployment → kugghjulet → Web app**:

| Fält | Värde |
|---|---|
| Execute as | **Me** |
| Who has access | **Anyone** |

Tryck **Deploy** och kopiera **Web app-URL:en** (den slutar på `/exec`).

> "Anyone" behövs för att vem som helst ska kunna beställa utan Google-konto.
> Scriptet lämnar aldrig ut namn eller telefonnummer — `doGet` returnerar bara
> totalsummor.

### 4. Fyll i sidan
Öppna [`app.js`](app.js) och sätt de tre konstanterna högst upp:

```js
const SCRIPT_URL = 'https://script.google.com/.../exec';  // från steg 3
const SISTA_DAG  = 'söndag 18 oktober';
const MAL_KR     = 5000;   // null om ni inte vill visa någon progressbar
```

Sidan visar inget Swish-nummer — den konstaterar bara att köparen swishar vid
utlämningen. Ni uppger numret på plats.

### 5. Publicera sidan
```bash
git init && git add -A && git commit -m "Potatisförsäljning klass 4"
```
Skapa ett repo på GitHub, pusha, och slå sedan på Pages:
**Settings → Pages → Source: Deploy from a branch → `main` / `/ (root)`**.

Sidan ligger på `https://<ditt-användarnamn>.github.io/<repo>/` efter en minut.

### 6. Dela med de andra klassföräldrarna
Dela Sheetet som *Redigerare* så att alla kan bocka av betalt och utlämnat. Se
[`SHEET-SETUP.md`](SHEET-SETUP.md) för vad kolumnerna betyder.

### 7. Städa upp efteråt
Radera GitHub-repot och Google Sheetet. Ta också bort deploymenten i Apps Script
(**Deploy → Manage deployments → Archive**) så att URL:en slutar svara.

## Bekräftelsemejl

Köparen får ett mejl med orderunderlaget direkt när beställningen skickas — sorter,
antal, summa, vad som går till klasskassan, och att betalning sker med Swish vid
utlämningen.

Mejlet skickas av **det Google-konto som publicerat scriptet**. Det går inte att ändra i
Apps Script, så köparen ser den adressen och svar hamnar i den inkorgen. Köparen ser
`AVSANDARNAMN` ("Klass 4, Rocknebyskolan") som avsändarnamn.

Kvoten är 100 mejl per dag på ett vanligt Gmail-konto (1 500 på Workspace) — långt mer
än en klassomgång behöver.

Inställningarna ligger högst upp i [`apps-script/Code.gs`](apps-script/Code.gs):

```js
var SKICKA_BEKRAFTELSE = true;                      // false stänger av utskicket
var AVSANDARNAMN = 'Klass 4, Rocknebyskolan';
var UTLAMNING = 'Vi hör av oss när varorna är här...';   // uppdatera när plats är bestämd
```

> **Lägger du till mejlutskicket efter att ni redan satt upp scriptet** måste ni
> publicera om det: Google behöver godkänna den nya behörigheten att skicka mejl.
> **Deploy → Manage deployments → pennan → Version: New version → Deploy**, och godkänn
> behörigheterna när frågan kommer.

Om utskicket misslyckas ligger beställningen ändå kvar i Sheetet — mejlet har ett eget
felskydd och kan inte sänka beställningen. Misslyckade utskick loggas i Apps Script
under **Executions**.

## Validering av kunduppgifter

Formuläret släpper inte igenom en beställning förrän namn, telefon och e-post är
ifyllda och ser rimliga ut. Felen visas under respektive fält.

- **Telefon** godtar mobil (070, 072, 073, 076, 079) och fast telefoni, skrivet med
  mellanslag, bindestreck eller parenteser. `+46` och `0046` översätts till `0`.
  Numret sparas normaliserat i Sheetet — `+46 70 123 45 67` blir `0701234567` — så att
  kolumnen blir enhetlig och sökbar.
- **E-post** kräver tecken före och efter `@` samt en toppdomän. Sparas i gemener.
  (`type="email"` släpper i sig igenom `a@b`, så regeln i `app.js` är strängare.)
- **Namn** måste vara minst två tecken.

Reglerna ligger i `FALT` i [`app.js`](app.js). Vill ni mjuka upp något — t.ex. tillåta
utländska nummer — är det en rad där.

## Testa lokalt

```bash
python3 -m http.server 8000
```

Öppna <http://localhost:8000>. Med tom `SCRIPT_URL` sparas inget, men hela formuläret,
summeringen och tack-pop-upen fungerar — bra för att testa utseendet.

## Filer

| Fil | Vad den gör |
|---|---|
| `index.html` | Sidans struktur |
| `style.css` | Utseende, mobilförst |
| `app.js` | Priser, ikoner, summering, skickande, konfetti |
| `apps-script/Code.gs` | Tar emot beställningar, skriver till Sheetet |
| `SHEET-SETUP.md` | Sammanställningsfliken och delning |
