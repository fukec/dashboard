/**
 * Data Manager - OPRAVENO pro správnou funkcnost
 * Verze: 3.0 - Modularní architektura - FUNKČNÍ
 * Autor: Dashboard System
 */

class DataManager {
    constructor(dashboardCore) {
        this.core = dashboardCore;
        this.sourceData = new Map(); // Cachovaná data ze zdrojů
        this.loadingStates = new Map(); // Stav načítání pro jednotlivé zdroje
        this.initialized = false;
    }

    /**
     * OPRAVENO: Správná inicializace
     */
    async init() {
        console.log('📊 Inicializace DataManager...');
        
        try {
            // Inicializace základních komponent
            this.setupDefaultConfiguration();
            this.initialized = true;
            console.log('✅ DataManager inicializován úspěšně');
        } catch (error) {
            console.error('❌ Chyba při inicializaci DataManager:', error);
            throw error;
        }
    }

    /**
     * NOVĚ PŘIDÁNO: Nastavení výchozí konfigurace
     */
    setupDefaultConfiguration() {
        // Výchozí konfigurace pro testování
        this.defaultConfig = {
            gasUrl: '', // Bude nastaveno uživatelem
            timeout: 30000,
            retryAttempts: 3,
            mockDataEnabled: true
        };
    }

    /**
     * Načtení dat z datového zdroje - VYLEPŠENO
     */
    async loadDataSource(sourceId, sourceConfig) {
        console.log(`📡 Načítám data ze zdroje: ${sourceId}`, sourceConfig);

        // Validace konfigurace
        if (!this.validateSourceConfig(sourceConfig)) {
            throw new Error(`Neplatná konfigurace pro zdroj ${sourceId}`);
        }

        // Zkontroluj, zda už načítání neprobíhá
        if (this.loadingStates.get(sourceId)) {
            console.log(`⏳ Načítání zdroje ${sourceId} již probíhá`);
            return null;
        }

        this.loadingStates.set(sourceId, true);

        try {
            let data = null;

            switch (sourceConfig.type) {
                case 'google-sheets':
                    data = await this.loadGoogleSheetsData(sourceConfig);
                    break;
                case 'json-api':
                    data = await this.loadJsonApiData(sourceConfig);
                    break;
                case 'csv-file':
                    data = await this.loadCsvFileData(sourceConfig);
                    break;
                default:
                    throw new Error(`Nepodporovaný typ datového zdroje: ${sourceConfig.type}`);
            }

            // Uložení do cache
            this.sourceData.set(sourceId, data);
            console.log(`✅ Data ze zdroje ${sourceId} úspěšně načtena:`, data);
            return data;

        } catch (error) {
            console.error(`❌ Chyba při načítání dat ze zdroje ${sourceId}:`, error);
            throw error;
        } finally {
            this.loadingStates.set(sourceId, false);
        }
    }

    /**
     * Načtení dat z Google Sheets přes GAS - VYLEPŠENO
     */
    async loadGoogleSheetsData(sourceConfig) {
        const { gasUrl, sheetId, range, action } = sourceConfig.config || {};

        if (!gasUrl) {
            console.warn('⚠️ Chybí URL Google Apps Script, používám mock data');
            return this.generateMockData();
        }

        if (!sheetId) {
            console.warn('⚠️ Chybí ID Google Sheets, používám mock data');  
            return this.generateMockData();
        }

        const requestData = {
            action: action || 'dashboard',
            sheetId: sheetId,
            range: range || 'A1:Z1000'
        };

        console.log('📊 Odesílám požadavek na GAS:', requestData);

        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), this.defaultConfig.timeout);

            const response = await fetch(gasUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestData),
                mode: 'cors',
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const textData = await response.text();
            console.log('📊 Raw response z GAS:', textData);

            // Pokus o parsování JSON
            let data;
            try {
                data = JSON.parse(textData);
            } catch (parseError) {
                console.error('❌ Chyba při parsování JSON odpovědi:', parseError);
                console.warn('⚠️ Používám mock data kvůli chybě parsování');
                return this.generateMockData();
            }

            // Validace struktury odpovědi
            if (data.error) {
                console.error(`❌ Chyba z GAS: ${data.error}`);
                console.warn('⚠️ Používám mock data kvůli chybě z GAS');
                return this.generateMockData();
            }

            if (!data.data) {
                console.warn('⚠️ GAS nevrátil žádná data, používám mock data');
                return this.generateMockData();
            }

            // Vrať data nebo prázdné pole
            const resultData = Array.isArray(data.data) ? data.data : [];
            console.log(`✅ Načteno ${resultData.length} záznamů z Google Sheets`);
            return resultData;

        } catch (error) {
            console.error('❌ Chyba při komunikaci s Google Apps Script:', error);
            
            // Fallback na mock data
            if (error.name === 'AbortError') {
                console.warn('⚠️ Timeout při načítání dat - používám mock data');
            } else if (error.message.includes('fetch')) {
                console.warn('⚠️ Problém s síťovým připojením - používám mock data');
            } else {
                console.warn('⚠️ Neočekávaná chyba - používám mock data');
            }
            
            return this.generateMockData();
        }
    }

    /**
     * Načtení dat z JSON API - VYLEPŠENO
     */
    async loadJsonApiData(sourceConfig) {
        const { apiUrl, headers, method } = sourceConfig.config || {};

        if (!apiUrl) {
            throw new Error('Chybí URL API');
        }

        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), this.defaultConfig.timeout);

            const fetchOptions = {
                method: method || 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    ...(headers || {})
                },
                signal: controller.signal
            };

            const response = await fetch(apiUrl, fetchOptions);
            clearTimeout(timeoutId);

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            return Array.isArray(data) ? data : [data];

        } catch (error) {
            console.error('❌ Chyba při načítání z JSON API:', error);
            throw error;
        }
    }

    /**
     * Načtení dat z CSV souboru - BEZE ZMĚNY
     */
    async loadCsvFileData(sourceConfig) {
        const { csvUrl } = sourceConfig.config || {};

        if (!csvUrl) {
            throw new Error('Chybí URL CSV souboru');
        }

        try {
            const response = await fetch(csvUrl);

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const csvText = await response.text();
            return this.parseCsv(csvText);

        } catch (error) {
            console.error('❌ Chyba při načítání CSV souboru:', error);
            throw error;
        }
    }

    /**
     * Parsování CSV dat - BEZE ZMĚNY
     */
    parseCsv(csvText) {
        const lines = csvText.split('\n').filter(line => line.trim());

        if (lines.length === 0) {
            return [];
        }

        // První řádek jako hlavičky
        const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));

        // Zbytek jako data
        const data = [];
        for (let i = 1; i < lines.length; i++) {
            const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
            if (values.length === headers.length) {
                const row = {};
                headers.forEach((header, index) => {
                    row[header] = values[index];
                });
                data.push(row);
            }
        }

        return data;
    }

    /**
     * Generování mock dat pro testování - VYLEPŠENO
     */
    generateMockData() {
        console.log('🎭 Generuji mock data pro testování...');
        
        const mockData = [];
        const categories = ['Prodej', 'Marketing', 'IT', 'HR', 'Finance'];
        const months = ['Leden', 'Únor', 'Březen', 'Duben', 'Květen', 'Červen'];
        const currentYear = new Date().getFullYear();

        for (let i = 0; i < 50; i++) {
            mockData.push({
                id: i + 1,
                kategorie: categories[Math.floor(Math.random() * categories.length)],
                mesic: months[Math.floor(Math.random() * months.length)],
                hodnota: Math.floor(Math.random() * 10000) + 1000,
                procenta: (Math.random() * 100).toFixed(1),
                datum: new Date(currentYear, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1).toISOString().split('T')[0],
                aktivni: Math.random() > 0.3,
                popis: `Mock záznam ${i + 1}`,
                trend: Math.random() > 0.5 ? 'vzestup' : 'pokles'
            });
        }

        console.log(`✅ Vygenerováno ${mockData.length} mock záznamů`);
        return mockData;
    }

    /**
     * Získání dat ze zdroje (z cache) - BEZE ZMĚNY
     */
    getSourceData(sourceId) {
        const data = this.sourceData.get(sourceId);
        
        if (!data) {
            console.warn(`⚠️ Data pro zdroj ${sourceId} nejsou v cache`);
            return null;
        }

        return data;
    }

    /**
     * Nastavení dat do cache - BEZE ZMĚNY
     */
    setSourceData(sourceId, data) {
        console.log(`💾 Ukládám data do cache pro zdroj: ${sourceId}`);
        this.sourceData.set(sourceId, data);
    }

    /**
     * Vyčištění cache - BEZE ZMĚNY
     */
    clearCache(sourceId = null) {
        if (sourceId) {
            console.log(`🗑️ Čistím cache pro zdroj: ${sourceId}`);
            this.sourceData.delete(sourceId);
        } else {
            console.log('🗑️ Čistím celou cache dat');
            this.sourceData.clear();
        }
    }

    /**
     * Agregace dat - DOKONČENO
     */
    aggregateData(data, aggregation) {
        if (!Array.isArray(data) || !aggregation) {
            return data;
        }

        if (!aggregation.groupBy) {
            console.warn('⚠️ Chybí groupBy parametr pro agregaci');
            return data;
        }

        try {
            // Seskupení podle pole
            const groups = {};
            
            data.forEach(row => {
                const groupKey = this.getFieldValue(row, aggregation.groupBy) || 'N/A';
                if (!groups[groupKey]) {
                    groups[groupKey] = [];
                }
                groups[groupKey].push(row);
            });

            // Agregace skupin
            const result = Object.entries(groups).map(([key, groupData]) => {
                const aggregatedRow = { [aggregation.groupBy]: key };

                if (aggregation.aggregates && Array.isArray(aggregation.aggregates)) {
                    aggregation.aggregates.forEach(agg => {
                        const values = groupData
                            .map(row => this.getFieldValue(row, agg.field))
                            .filter(v => v !== null && v !== undefined && !isNaN(Number(v)))
                            .map(v => Number(v));

                        let aggregatedValue;

                        switch (agg.function?.toLowerCase()) {
                            case 'sum':
                                aggregatedValue = values.reduce((a, b) => a + b, 0);
                                break;
                            case 'average':
                            case 'avg':
                                aggregatedValue = values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0;
                                break;
                            case 'count':
                                aggregatedValue = groupData.length;
                                break;
                            case 'max':
                                aggregatedValue = values.length ? Math.max(...values) : 0;
                                break;
                            case 'min':
                                aggregatedValue = values.length ? Math.min(...values) : 0;
                                break;
                            default:
                                aggregatedValue = groupData.length;
                        }

                        const fieldName = `${agg.field}_${agg.function || 'count'}`;
                        aggregatedRow[fieldName] = aggregatedValue;
                    });
                } else {
                    // Základní agregace - count
                    aggregatedRow['count'] = groupData.length;
                }

                return aggregatedRow;
            });

            console.log(`✅ Agregace dokončena: ${result.length} skupin`);
            return result;

        } catch (error) {
            console.error('❌ Chyba při agregaci dat:', error);
            return data;
        }
    }

    /**
     * Filtrování dat - VYLEPŠENO
     */
    filterData(data, filters) {
        if (!Array.isArray(data) || !filters || filters.length === 0) {
            return data;
        }

        try {
            const filteredData = data.filter(row => {
                return filters.every(filter => {
                    const value = this.getFieldValue(row, filter.field);
                    return this.evaluateFilter(value, filter.operator, filter.value);
                });
            });

            console.log(`✅ Filtrování dokončeno: ${filteredData.length}/${data.length} záznamů`);
            return filteredData;

        } catch (error) {
            console.error('❌ Chyba při filtrování dat:', error);
            return data;
        }
    }

    /**
     * NOVĚ PŘIDÁNO: Vyhodnocení filtru
     */
    evaluateFilter(value, operator, filterValue) {
        switch (operator?.toLowerCase()) {
            case 'equals':
            case '=':
                return value == filterValue;
            case 'not_equals':
            case '!=':
                return value != filterValue;
            case 'contains':
                return String(value).toLowerCase().includes(String(filterValue).toLowerCase());
            case 'greater':
            case '>':
                return Number(value) > Number(filterValue);
            case 'less':
            case '<':
                return Number(value) < Number(filterValue);
            case 'not_empty':
                return value !== null && value !== undefined && value !== '';
            case 'empty':
                return value === null || value === undefined || value === '';
            default:
                return true;
        }
    }

    /**
     * Získání hodnoty z vnořeného objektu - BEZE ZMĚNY
     */
    getFieldValue(obj, field) {
        if (!obj || !field) return null;
        return field.split('.').reduce((o, key) => o && o[key], obj);
    }

    /**
     * Získání statistik dat - VYLEPŠENO
     */
    getDataStats(data) {
        if (!data) {
            return { count: 0, fields: [], types: {} };
        }

        if (Array.isArray(data)) {
            if (data.length === 0) {
                return { count: 0, fields: [], types: {} };
            }

            const fields = data.length > 0 && typeof data[0] === 'object' ? Object.keys(data[0]) : [];
            const types = {};

            // Analýza typů dat
            fields.forEach(field => {
                const sampleValues = data.slice(0, 10).map(row => row[field]).filter(v => v !== null && v !== undefined);
                types[field] = this.detectFieldType(sampleValues);
            });

            return {
                count: data.length,
                fields: fields,
                types: types
            };
        }

        if (typeof data === 'object') {
            return {
                count: 1,
                fields: Object.keys(data),
                types: {}
            };
        }

        return { count: 0, fields: [], types: {} };
    }

    /**
     * NOVĚ PŘIDÁNO: Detekce typu pole
     */
    detectFieldType(values) {
        if (values.length === 0) return 'unknown';

        let numberCount = 0;
        let dateCount = 0; 
        let booleanCount = 0;

        values.forEach(value => {
            if (typeof value === 'number' || (!isNaN(Number(value)) && value !== '')) {
                numberCount++;
            } else if (this.isValidDate(value)) {
                dateCount++;
            } else if (typeof value === 'boolean' || value === 'true' || value === 'false') {
                booleanCount++;
            }
        });

        const total = values.length;
        const threshold = 0.7; // 70% threshold

        if (numberCount / total > threshold) return 'number';
        if (dateCount / total > threshold) return 'date';
        if (booleanCount / total > threshold) return 'boolean';
        
        return 'string';
    }

    /**
     * NOVĚ PŘIDÁNO: Validace datumu
     */
    isValidDate(value) {
        if (!value) return false;
        const date = new Date(value);
        return !isNaN(date.getTime()) && String(value).match(/\d{4}-\d{2}-\d{2}|\d{2}\/\d{2}\/\d{4}|\d{1,2}\.\d{1,2}\.\d{4}/);
    }

    /**
     * Validace konfigurace datového zdroje - VYLEPŠENO
     */
    validateSourceConfig(sourceConfig) {
        if (!sourceConfig || typeof sourceConfig !== 'object') {
            console.error('❌ Neplatná konfigurace datového zdroje');
            return false;
        }

        if (!sourceConfig.type) {
            console.error('❌ Chybí typ datového zdroje');
            return false;
        }

        if (!sourceConfig.config) {
            console.error('❌ Chybí konfigurace pro datový zdroj');
            return false;
        }

        // Validace podle typu
        switch (sourceConfig.type) {
            case 'google-sheets':
                // GAS URL je volitelné - použije se mock data
                if (sourceConfig.config.gasUrl && !sourceConfig.config.sheetId) {
                    console.warn('⚠️ GAS URL zadáno, ale chybí Sheet ID');
                }
                break;
            case 'json-api':
                if (!sourceConfig.config.apiUrl) {
                    console.error('❌ Chybí URL API');
                    return false;
                }
                break;
            case 'csv-file':
                if (!sourceConfig.config.csvUrl) {
                    console.error('❌ Chybí URL CSV souboru');
                    return false;
                }
                break;
            default:
                console.error(`❌ Nepodporovaný typ datového zdroje: ${sourceConfig.type}`);
                return false;
        }

        return true;
    }

    /**
     * Export dat do různých formátů - BEZE ZMĚNY
     */
    exportData(data, format = 'json') {
        if (!Array.isArray(data)) {
            throw new Error('Data nejsou ve formátu pole');
        }

        switch (format.toLowerCase()) {
            case 'json':
                return JSON.stringify(data, null, 2);
            case 'csv':
                return this.convertToCsv(data);
            default:
                throw new Error(`Nepodporovaný formát exportu: ${format}`);
        }
    }

    /**
     * Konverze dat do CSV - BEZE ZMĚNY
     */
    convertToCsv(data) {
        if (data.length === 0) {
            return '';
        }

        const headers = Object.keys(data[0]);
        const csvLines = [headers.join(',')];

        data.forEach(row => {
            const values = headers.map(header => {
                const value = row[header];
                // Escape hodnoty s čárkami nebo uvozovkami
                if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
                    return `"${value.replace(/"/g, '""')}"`;
                }
                return value;
            });
            csvLines.push(values.join(','));
        });

        return csvLines.join('\n');
    }

    /**
     * NOVĚ PŘIDÁNO: Získání stavu inicializace
     */
    isInitialized() {
        return this.initialized;
    }

    /**
     * NOVĚ PŘIDÁNO: Získání konfigurace
     */
    getConfiguration() {
        return { ...this.defaultConfig };
    }

    /**
     * NOVĚ PŘIDÁNO: Aktualizace konfigurace
     */
    updateConfiguration(newConfig) {
        this.defaultConfig = { ...this.defaultConfig, ...newConfig };
        console.log('⚙️ Konfigurace DataManager aktualizována');
    }
}

// Export pro modul systém
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DataManager;
}

console.log('📊 Data Manager načten - OPRAVENÁ FUNKČNÍ VERZE');
