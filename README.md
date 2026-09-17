# Potatisförsäljning — klass 4A

En liten statisk beställningssida för klassens potatis-, lök- och morotsförsäljning.
Beställningarna landar som rader i ett Google Sheet som alla klassföräldrar kan öppna.

**Engångsbruk.** Radera repot och Sheetet när omgången är klar.

## Så funkar det

```
Kund i webbläsaren  →  GitHub Pages (statisk sida)  →  Google Apps Script  →  Google Sheet
```

GitHub Pages kan inte lagra något själv, så sidan skickar beställningen vidare till ett
litet Apps Script som skriver en rad i Sheetet. Sheetet är hela administrationen: där
ser ni vem som köpt vad, vad ni sålt för, och vad som blir kvar till klasskassan.

## Sortiment

| Vara | Inköp från bonden | Vårt pris | Till klasskassan |
|---|---|---|---|
| Potatis 10 kg | 75 kr | 130 kr | 55 kr |
| Morötter 5 kg | 40 kr | 75 kr | 35 kr |
| Gul lök 5 kg | 40 kr | 75 kr | 35 kr |
| Röd lök 5 kg | 40 kr | 75 kr | 35 kr |

Priserna ändras på **två** ställen, som måste stämma med varandra:
`PRODUKTER` högst upp i [`app.js`](app.js) och `PRODUKTER` i
[`apps-script/Code.gs`](apps-script/Code.gs).

## Sätt upp (ca 20 minuter)

### 1. Skapa Google Sheetet
Gå till [sheets.new](https://sheets.new), döp det till t.ex. "Potatis klass 4A".
Kopiera ID:t ur adressfältet — den långa biten mellan `/d/` och `/edit`.

### 2. Lägg in scriptet
I Sheetet: **Tillägg → Apps Script**. Radera det som ligger där och klistra in hela
innehållet i [`apps-script/Code.gs`](apps-script/Code.gs).

Byt ut `SHEET_ID` högst upp mot ditt ID. Spara.

Välj funktionen **`installera`** i listan och tryck **Kör**. Godkänn behörigheterna när
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
Öppna [`app.js`](app.js) och sätt de fyra konstanterna högst upp:

```js
const SCRIPT_URL   = 'https://script.google.com/.../exec';  // från steg 3
const SWISH_NUMMER = '123 456 78 90';
const SISTA_DAG    = 'söndag 5 oktober';
const MAL_KR       = 5000;   // null om ni inte vill visa någon progressbar
```

### 5. Publicera sidan
```bash
git init && git add -A && git commit -m "Potatisförsäljning klass 4A"
```
Skapa ett repo på GitHub, pusha, och slå sedan på Pages:
**Settings → Pages → Source: Deploy from a branch → `main` / `/ (root)`**.

Sidan ligger på `https://<ditt-användarnamn>.github.io/<repo>/` efter en minut.

### 6. Dela med de andra klassföräldrarna
Se [`SHEET-SETUP.md`](SHEET-SETUP.md) — lägg upp sammanställningsfliken och dela
Sheetet som *Redigerare* så att alla kan bocka av betalt och utlämnat.

### 7. Städa upp efteråt
Radera GitHub-repot och Google Sheetet. Ta också bort deploymenten i Apps Script
(**Deploy → Manage deployments → Archive**) så att URL:en slutar svara.

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
| `app.js` | Priser, summering, skickande, konfetti |
| `apps-script/Code.gs` | Tar emot beställningar, skriver till Sheetet |
| `SHEET-SETUP.md` | Sammanställningsfliken och delning |
