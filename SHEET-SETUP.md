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
| F | Inova 10 kg (antal) | scriptet |
| G | Bintje 10 kg (antal) | scriptet |
| H | Gul lök 5 kg (antal) | scriptet |
| I | Röd lök 5 kg (antal) | scriptet |
| J | Morötter 5 kg (antal) | scriptet |
| K | Summa kr | scriptet |
| L | Vinst kr | scriptet |
| M | **Betald** | ni, manuellt |
| N | **Utlämnad** | ni, manuellt |
| O | **Anteckning** | ni, manuellt |

M och N är kryssrutor: markera kolumnerna och välj **Infoga → Kryssruta**.

## Lägg upp `Sammanställning`

Skapa en ny flik som heter `Sammanställning` och klistra in det här i cell **A1**:

```
Vara	Antal sålda	Till oss	Till Niklas	Till klasskassan
King Edward 10 kg	=SUM(Beställningar!E2:E)	=B2*130	=B2*75	=C2-D2
Inova 10 kg	=SUM(Beställningar!F2:F)	=B3*130	=B3*75	=C3-D3
Bintje 10 kg	=SUM(Beställningar!G2:G)	=B4*130	=B4*75	=C4-D4
Gul lök 5 kg	=SUM(Beställningar!H2:H)	=B5*75	=B5*40	=C5-D5
Röd lök 5 kg	=SUM(Beställningar!I2:I)	=B6*75	=B6*40	=C6-D6
Morötter 5 kg	=SUM(Beställningar!J2:J)	=B7*75	=B7*40	=C7-D7
TOTALT	=SUM(B2:B7)	=SUM(C2:C7)	=SUM(D2:D7)	=SUM(E2:E7)
```

(Klistra in som *tabbseparerad* text så hamnar varje värde i rätt cell. Kopiera blocket
rakt av — Google Sheets delar upp det automatiskt.)

Lägg sedan in det här i **A10** för uppföljningen:

```
Antal beställningar	=COUNTA(Beställningar!B2:B)
Obetalda beställningar	=COUNTIF(Beställningar!M2:M;FALSE)
Inte utlämnade	=COUNTIF(Beställningar!N2:N;FALSE)
Obetalt belopp kr	=SUMIF(Beställningar!M2:M;FALSE;Beställningar!K2:K)
```

En rad till som är bra att ha när ni ska lägga ordern hos Niklas — **totalt antal säckar
per sort** står redan i kolumn B ovan. Det är den kolumnen ni läser upp för honom.

> Använder ditt Sheet komma i stället för semikolon som argumentavgränsare, byt
> `;` mot `,` i formlerna ovan.

### Läsa av den

- **Till oss** = vad kunderna ska betala in totalt.
- **Till Niklas** = vad ni ska betala vidare till bonden.
- **Till klasskassan** = det som blir kvar. Det är den siffran som också visas
  på hemsidan.

## Dela med de andra klassföräldrarna

Tryck **Dela** uppe till höger, lägg in deras e-postadresser och välj **Redigerare** —
de behöver kunna bocka i `Betald` och `Utlämnad`.

Dela **inte** Sheetet med "alla som har länken". Det innehåller namn, telefonnummer och
e-postadresser till utomstående köpare.

## Vanliga fixar

**En kund vill ändra sin beställning.** Rätta antalet direkt i raden och uppdatera
`Summa kr` (K) och `Vinst kr` (L) för hand. Priserna: potatis 130 kr in / 75 kr till
Niklas, lök och morötter 75 kr in / 40 kr till Niklas.

**Dubbelbeställning.** Radera hela raden. Sammanställningen och hemsidans räknare
uppdateras av sig själva.

**Någon beställde via SMS.** Lägg in raden manuellt — eller enklast: fyll i formuläret
på sidan i deras namn, så blir summorna rätt automatiskt.
