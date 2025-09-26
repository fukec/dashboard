# Modularní Google Sheets Dashboard v3.0

## 📋 Přehled projektu

Toto je kompletně přepracovaná verze Google Sheets Dashboard s **modularní architekturou**, která umožňuje uživatelům vytvářet a konfigurovat vlastní datové widgety bez nutnosti programování.

### 🎯 Klíčové funkce verze 3.0

✅ **Uživatelská konfigurace datových zdrojů** - Nastavte si vlastní Google Sheets, JSON API nebo CSV soubory  
✅ **Grafický konfigurátor widgetů** - Vytváření widgetů pomocí drag & drop rozhraní  
✅ **Flexibilní agregace dat** - Součty, průměry, počty podle vlastních kritérií  
✅ **Zapínání/vypínání modulů** - Jednoduché ovládání viditelnosti widgetů  
✅ **Načítání na vyžádání** - Data se načítají pouze po stisknutí tlačítka  
✅ **Detailní zobrazení** - Po kliknutí na widget zobrazení podrobných dat  
✅ **Export/import konfigurace** - Zálohování a sdílení nastavení  
✅ **Responzivní design** - Funguje na desktop i mobilních zařízeních  
✅ **Tmavý/světlý režim** - Přizpůsobitelné téma

## 🏗️ Architektura systému

### Frontend moduly
- **`dashboard-core.js`** - Hlavní jádro aplikace, orchestrace
- **`data-manager.js`** - Správa datových zdrojů a načítání
- **`config-manager.js`** - Konfigurační UI pro widgety a zdroje
- **`widget-factory.js`** - Továrna na tvorbu widgetů
- **`detail-modal.js`** - Detailní zobrazení dat

### Backend
- **`gas-backend-v3.js`** - Google Apps Script s dynamickými endpointy

### Styly
- **`style.css`** - Základní styly s design systemem
- **`widgets.css`** - Specifické styly pro widgety

## 🚀 Rychlé spuštění

### 1. Příprava souborů

Vytvořte tuto strukturu složek:
```
google-sheets-dashboard-v3/
├── index.html
├── assets/
│   ├── css/
│   │   ├── style.css
│   │   └── widgets.css
│   └── js/
│       ├── dashboard-core.js
│       ├── data-manager.js
│       ├── config-manager.js
│       ├── widget-factory.js
│       └── detail-modal.js
├── gas-backend-v3.js
├── package.json
└── README.md
```

### 2. Google Apps Script nasazení

1. Jděte na [script.google.com](https://script.google.com)
2. Vytvořte nový projekt
3. Vložte obsah souboru `gas-backend-v3.js`
4. Upravte CONFIG sekci s vašimi Sheet ID
5. Nasaďte jako Web App:
   - Execute as: **Me**
   - Who has access: **Anyone**
6. Zkopírujte URL nasazené aplikace

### 3. GitHub Pages nastavení

1. Vytvořte GitHub repository
2. Nahrajte všechny soubory (kromě `gas-backend-v3.js`)
3. Povolte GitHub Pages v Settings
4. Otevřete `https://username.github.io/repository-name`

### 4. Konfigurace dashboard

1. Po načtení stiskněte `Ctrl+Shift+C` nebo klikněte na Konfigurace
2. **Zdroje dat**:
   - Klikněte "Přidat zdroj" 
   - Zadejte URL Google Apps Script
   - Vyberte typ "Google Sheets"
   - Zadejte Sheet ID a rozsah dat
   - Otestujte připojení
   
3. **Widgety**:
   - Vyberte typ widgetu (metrická karta, graf, tabulka)
   - Přiřaďte zdroj dat
   - Nakonfigurujte zobrazení
   - Uložte změny

### 5. Načtení dat

Klikněte na tlačítko **"Načíst aktuální data"** pro načtení všech nakonfigurovaných dat.

## 📊 Typy widgetů

### Metrické karty
- Zobrazení jedné hodnoty s trendem
- Podporované agregace: součet, průměr, počet, min, max
- Formáty: číslo, měna, procenta

### Grafy
- **Čárový graf** - trendy v čase
- **Sloupcový graf** - porovnání kategorií  
- **Koláčový graf** - poměrové rozložení

### Tabulky
- Filtrovatelné a prohledávatelné
- Stránkování
- Řazení podle sloupců
- Export do CSV

### KPI mřížky
- Několik metrik v přehledné mřížce
- Konfigurovatelné agregace

## 🔧 Konfigurace zdrojů dat

### Google Sheets
- **URL Google Apps Script**: Nasazená URL
- **Sheet ID**: ID vašeho Google Sheets
- **Rozsah**: např. `Summary!A1:E100`
- **API akce**: `dashboard`, `charts`, `tables`, `custom`

### JSON API
- **URL**: Adresa REST API
- **HTTP metoda**: GET nebo POST
- **Headers**: JSON s autorizačními hlavičkami

### CSV soubor
- **Soubor**: Upload lokálního CSV
- **Oddělovač**: čárka, středník, tab
- **Hlavičky**: má první řádek hlavičky

## 🎨 Uživatelské rozhraní

### Konfigurace
- **Zdroje dat**: Správa připojení k datům
- **Widgety**: Vytváření a úprava widgetů
- **Layout**: Uspořádání na obrazovce

### Ovládání
- **Načíst data** (`Ctrl+Shift+R`): Načtení všech dat
- **Konfigurace** (`Ctrl+Shift+C`): Otevření nastavení
- **Přepnout téma**: Světlý/tmavý režim

### Widget menu
- **Detail**: Rozšířené zobrazení s více daty
- **Upravit**: Změna konfigurace widgetu
- **Skrýt/Zobrazit**: Dočasné skrytí
- **Odstranit**: Permanentní smazání

## 📈 Pokročilé funkce

### Filtry a agregace
```javascript
// Příklad filtru
{
  "field": "kategorie",
  "operator": "equals", 
  "value": "Tržby"
}

// Příklad agregace
{
  "groupBy": "měsíc",
  "aggregateField": "hodnota",
  "aggregateFunction": "sum"
}
```

### Operátory filtrů
- `equals`, `not_equals`
- `greater`, `greater_equals`
- `less`, `less_equals`
- `contains`, `starts_with`, `ends_with`
- `in` (seznam hodnot)

### Export/Import
- **Export**: Stažení kompletní konfigurace jako JSON
- **Import**: Načtení konfigurace ze souboru
- **Zálohování**: Automatické ukládání do localStorage

## 🔒 Bezpečnost

### Google Apps Script
- Rate limiting: max 120 požadavků/min
- Validace vstupů
- Error handling s retry logikou
- Cache pro optimalizaci

### Frontend
- Input sanitization
- XSS ochrana
- HTTPS enforcement
- CORS konfigurace

## 🐛 Řešení problémů

### Časté problémy

**❌ "Nepodařilo se načíst data"**
- Zkontrolujte URL Google Apps Script
- Ověřte oprávnění k Google Sheets
- Otestujte připojení v konfiguraci

**❌ "Widget nezobrazuje data"**
- Zkontrolujte mapování polí
- Ověřte formát dat ve zdroji
- Zkuste restartovat načítání

**❌ "CORS error"**
- Použijte JSONP (automaticky)
- Zkontrolujte nastavení v Google Apps Script

### Debug režim
Zapněte v browser console:
```javascript
DashboardCore.config.debugMode = true;
```

## 🔄 Aktualizace

### Z verze 2.x na 3.0
1. Zálohujte stávající konfiguraci (Export)
2. Nasaďte nové soubory
3. Aktualizujte Google Apps Script
4. Importujte konfiguraci
5. Překonfigurujte zdroje dat

### Správa verzí
- Sledujte `version` pole v exportovaných konfiguracích
- Udržujte zálohy před velkými změnami
- Testujte na development prostředí

## 📞 Podpora

### Debugging
1. Otevřete Developer Tools (F12)
2. Sledujte console pro chybové zprávy
3. Zkontrolujte Network tab pro API volání
4. Použijte Export konfigurace pro analýzu

### Známé limitace
- Google Sheets API: 100 req/100s per user
- Google Apps Script: 6 min execution time
- localStorage: ~10MB per domain
- Chart.js: optimální do 1000 datových bodů

## 💡 Rozšíření

### Nové typy widgetů
1. Přidejte definici do `widget-factory.js`
2. Implementujte rendering metody
3. Přidejte CSS styly do `widgets.css`

### Nové datové zdroje
1. Rozšiřte `supportedTypes` v `data-manager.js`
2. Implementujte loading metodu
3. Přidejte UI konfigurace

### Vlastní agregace
1. Rozšiřte `calculateAggregation` v `data-manager.js`
2. Přidejte nové operátory
3. Dokumentujte použití

---

## 🎉 Shrnutí

Modularní Google Sheets Dashboard v3.0 poskytuje:

✅ **Kompletní samostatnost** - Konfigurace bez programování  
✅ **Profesionální výsledky** - Enterprise-ready dashboard  
✅ **Flexibilitu** - Přizpůsobení jakýmkoli datům  
✅ **Škálovatelnost** - Od malých projektů po velké organizace  
✅ **Udržitelnost** - Snadné aktualizace a rozšiřování  

**Hotovo za 30 minut, použitelné roky! 🚀**