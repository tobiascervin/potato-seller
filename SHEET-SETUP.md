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
| E | Potatis 10 kg (antal) | scriptet |
| F | Morötter 5 kg (antal) | scriptet |
| G | Gul lök 5 kg (antal) | scriptet |
| H | Röd lök 5 kg (antal) | scriptet |
| I | Summa kr | scriptet |
| J | Vinst kr | scriptet |
| K | **Betald** | ni, manuellt |
| L | **Utlämnad** | ni, manuellt |
| M | **Anteckning** | ni, manuellt |

K och L är kryssrutor: markera kolumnerna och välj **Infoga → Kryssruta**.

## Lägg upp `Sammanställning`

Skapa en ny flik som heter `Sammanställning` och klistra in det här i cell **A1**:

```
Vara	Antal sålda	Till oss	Till bonden	Till klasskassan
Potatis 10 kg	=SUM(Beställningar!E2:E)	=B2*130	=B2*75	=C2-D2
Morötter 5 kg	=SUM(Beställningar!F2:F)	=B3*75	=B3*40	=C3-D3
Gul lök 5 kg	=SUM(Beställningar!G2:G)	=B4*75	=B4*40	=C4-D4
Röd lök 5 kg	=SUM(Beställningar!H2:H)	=B5*75	=B5*40	=C5-D5
TOTALT	=SUM(B2:B5)	=SUM(C2:C5)	=SUM(D2:D5)	=SUM(E2:E5)
```

(Klistra in som *tabbseparerad* text så hamnar varje värde i rätt cell. Kopiera blocket
rakt av — Google Sheets delar upp det automatiskt.)

Lägg sedan in det här i **A8** för uppföljningen:

```
Antal beställningar	=COUNTA(Beställningar!B2:B)
Obetalda beställningar	=COUNTIF(Beställningar!K2:K;FALSE)
Inte utlämnade	=COUNTIF(Beställningar!L2:L;FALSE)
Obetalt belopp kr	=SUMIF(Beställningar!K2:K;FALSE;Beställningar!I2:I)
```

> Använder ditt Sheet komma i stället för semikolon som argumentavgränsare, byt
> `;` mot `,` i formlerna ovan.

### Läsa av den

- **Till oss** = vad kunderna ska betala in totalt.
- **Till bonden** = vad ni ska betala vidare.
- **Till klasskassan** = det som blir kvar. Det är den siffran som också visas
  på hemsidan.

## Dela med de andra klassföräldrarna

Tryck **Dela** uppe till höger, lägg in deras e-postadresser och välj **Redigerare** —
de behöver kunna bocka i `Betald` och `Utlämnad`.

Dela **inte** Sheetet med "alla som har länken". Det innehåller namn, telefonnummer och
e-postadresser till utomstående köpare.

## Vanliga fixar

**En kund vill ändra sin beställning.** Rätta antalet direkt i raden och uppdatera
`Summa kr` (I) och `Vinst kr` (J) för hand. Priserna: potatis 130 kr in / 75 kr till
bonden, övriga 75 kr in / 40 kr till bonden.

**Dubbelbeställning.** Radera hela raden. Sammanställningen och hemsidans räknare
uppdateras av sig själva.

**Någon beställde via SMS.** Lägg in raden manuellt — eller enklast: fyll i formuläret
på sidan i deras namn, så blir summorna rätt automatiskt.
