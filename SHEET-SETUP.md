# Sammanställningen i Google Sheet

Fliken `Beställningar` fylls automatiskt. Det här dokumentet visar hur du lägger till en
`Sammanställning`-flik som räknar ut allt ni behöver veta, och hur du delar Sheetet med
de andra klassföräldrarna.

## Kolumnerna i `Beställningar`

| Kolumn | Innehåll | Fylls av |
|---|---|---|
| A | Tidpunkt | scriptet |
| B | Namn | scriptet |
| C | Telefon | scriptet |
| D | E-post | scriptet |
| E | King Edward 10 kg (antal) | scriptet |
| F | Bintje 10 kg (antal) | scriptet |
| G | Asterix 10 kg (antal) | scriptet |
| H | Inova 10 kg (antal) | scriptet |
| I | Gul lök 5 kg (antal) | scriptet |
| J | Röd lök 5 kg (antal) | scriptet |
| K | Morötter 5 kg (antal) | scriptet |
| L | Summa kr | scriptet |
| M | Vinst kr | scriptet |
| N | **Betald** | ni, manuellt |
| O | **Utlämnad** | ni, manuellt |
| P | **Anteckning** | ni, manuellt |

`installera` sköter formateringen åt dig:

- Grön låst rubrikrad, och kolumnerna Tidpunkt + Namn låsta i sidled så du ser vems
  rad du tittar på även när du scrollar åt höger.
- Antalskolumnerna är smala och centrerade, och **nollor visas som tomt** — då ser
  du på en blick vad någon faktiskt beställt i stället för sju nollor per rad.
  Beloppskolumnerna visar däremot alltid en siffra, även `0 kr`, så en tom cell
  aldrig kan förväxlas med ett fel.
- Summa och Vinst visas som `465 kr`, med Summa i fetstil.
- **Betalda rader tonas gröna.** Kryssa i `Betald` så byter hela raden färg, och det
  som återstår syns direkt.
- Kryssrutor i `Betald` och `Utlämnad` läggs till automatiskt på varje ny beställning.

Kör om `installera` när du vill — den rör bara utseendet, aldrig innehållet.

## Fliken `Sammanställning`

Skapas automatiskt av `installera` — inga formler att klistra in för hand. Den byggs
från `PRODUKTER` i scriptet, så den speglar alltid sortimentet.

| Kolumn | Betyder |
|---|---|
| Antal sålda | Antal säckar per sort. **Det här är listan ni läser upp för Niklas** |
| Till oss | Vad kunderna ska betala in |
| Till Niklas | Vad ni ska betala vidare till bonden |
| Till klasskassan | Det som blir kvar — samma siffra som visas på hemsidan |

Längst ner: antal beställningar, obetalda beställningar, obetalt belopp och hur många
som inte hämtat ut ännu.

Formlerna är skrivna för att undvika två fällor:

- **Argumentavgränsare.** Svenska Sheets vill ha `;` och engelska `,`, och Apps Script
  översätter inte. Därför tar alla genererade formler bara ett argument —
  `SUMPRODUCT` med `*` gör samma jobb som `COUNTIFS`.
- **Kryssrutor.** `FALSE`/`TRUE` heter `FALSKT`/`SANT` på svenska, men att jämföra mot
  `0` och `1` fungerar inte heller: Sheets rankar tal under booleaner, så `N2=0` blir
  falskt även för en urkryssad ruta. I aritmetik konverteras de däremot, så formlerna
  räknar `1-N2` i stället för att jämföra.

> **Fliken är helt genererad.** Kör du om `installera` skrivs den över. Skriv därför
> inga egna noteringar där — de hör hemma i kolumnen `Anteckning` på beställningsraden.

## Dela med de andra klassföräldrarna

Tryck **Dela** uppe till höger, lägg in deras e-postadresser och välj **Redigerare** —
de behöver kunna bocka i `Betald` och `Utlämnad`.

Dela **inte** Sheetet med "alla som har länken". Det innehåller namn, telefonnummer och
e-postadresser till utomstående köpare.

## Vanliga fixar

**En kund vill ändra sin beställning.** Rätta antalet direkt i raden och uppdatera
`Summa kr` (L) och `Vinst kr` (M) för hand. Priserna: potatis 130 kr in / 75 kr till
Niklas, lök och morötter 75 kr in / 40 kr till Niklas.

**Dubbelbeställning.** Radera hela raden. Sammanställningen och hemsidans räknare
uppdateras av sig själva.

**Någon beställde via SMS.** Lägg in raden manuellt — eller enklast: fyll i formuläret
på sidan i deras namn, så blir summorna rätt automatiskt.
