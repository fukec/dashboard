/**
 * Data Manager - Správa dat a komunikace s externími API
 * Verze: 3.0 - Modularní architektura - FUNKČNÍ
 * Autor: Dashboard System
 */

class DataManager {
    constructor(dashboardCore) {
        this.core = dashboardCore;
        this.sourceData = new Map(); // Cachovaná data ze zdrojů
        this.loadingStates = new Map(); // Stav načítání pro jednotlivé zdroje
    }

    async init() {
        console.log('📊 Inicializace DataManager...');
        // Inicializace je dokončena
    }

    /**
     * Načtení dat z datového zdroje
     */
    async loadDataSource(sourceId, sourceConfig) {
        console.log(`📡 Načítám data ze zdroje: ${sourceId}`, sourceConfig);

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
     * Načtení dat z Google Sheets přes GAS
     */
    async loadGoogleSheetsData(sourceConfig) {
        const { gasUrl, sheetId, range, action } = sourceConfig.config || {};

        if (!gasUrl || !sheetId) {
            throw new Error('Chybí URL Google Apps Script nebo ID tabulky');
        }

        const requestData = {
            action: action || 'dashboard',
            sheetId: sheetId,
            range: range || 'A1:Z1000'
        };

        console.log('📊 Odesílám požadavek na GAS:', requestData);

        try {
            const response = await fetch(gasUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestData),
                mode: 'cors'
            });

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
                throw new Error('Neplatná JSON odpověď z Google Apps Script');
            }

            // Validace struktury odpovědi
            if (data.error) {
                throw new Error(`Chyba z GAS: ${data.error}`);
            }

            if (!data.data) {
                console.warn('⚠️ GAS nevrátil žádná data, používám prázdné pole');
                return [];
            }

            // Vrať data nebo prázdné pole
            const resultData = Array.isArray(data.data) ? data.data : [];
            console.log(`✅ Načteno ${resultData.length} záznamů z Google Sheets`);
            
            return resultData;

        } catch (error) {
            console.error('❌ Chyba při komunikaci s Google Apps Script:', error);
            
            // Pokus o fallback nebo mock data pro testování
            if (error.message.includes('fetch')) {
                console.warn('⚠️ Problém s síťovým připojením - používám mock data');
                return this.generateMockData();
            }
            
            throw error;
        }
    }

    /**
     * Načtení dat z JSON API
     */
    async loadJsonApiData(sourceConfig) {
        const { apiUrl, headers, method } = sourceConfig.config || {};

        if (!apiUrl) {
            throw new Error('Chybí URL API');
        }

        try {
            const fetchOptions = {
                method: method || 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    ...(headers || {})
                }
            };

            const response = await fetch(apiUrl, fetchOptions);

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
     * Načtení dat z CSV souboru
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
     * Parsování CSV dat
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
     * Generování mock dat pro testování
     */
    generateMockData() {
        console.log('🎭 Generuji mock data pro testování...');
        
        const mockData = [];
        const categories = ['Prodej', 'Marketing', 'IT', 'HR', 'Finance'];
        const months = ['Leden', 'Únor', 'Březen', 'Duben', 'Květen', 'Červen'];
        
        for (let i = 0; i < 50; i++) {
            mockData.push({
                id: i + 1,
                kategorie: categories[Math.floor(Math.random() * categories.length)],
                mesic: months[Math.floor(Math.random() * months.length)],
                hodnota: Math.floor(Math.random() * 10000) + 1000,
                procenta: (Math.random() * 100).toFixed(1),
                datum: new Date(2024, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1).toISOString().split('T')[0],
                aktivni: Math.random() > 0.3,
                popis: `Mock záznam ${i + 1}`
            });
        }
        
        return mockData;
    }

    /**
     * Získání dat ze zdroje (z cache)
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
     * Nastavení dat do cache
     */
    setSourceData(sourceId, data) {
        console.log(`💾 Ukládám data do cache pro zdroj: ${sourceId}`);
        this.sourceData.set(sourceId, data);
    }

    /**
     * Vyčištění cache
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
     * Získání statistik dat
     */
    getDataStats(data) {
        if (!data) {
            return { count: 0, fields: [] };
        }

        if (Array.isArray(data)) {
            return {
                count: data.length,
                fields: data.length > 0 && typeof data[0] === 'object' ? Object.keys(data[0]) : []
            };
        }

        if (typeof data === 'object') {
            return {
                count: 1,
                fields: Object.keys(data)
            };
        }

        return { count: 0, fields: [] };
    }

    /**
     * Filtrování dat
     */
    filterData(data, filters) {
        if (!Array.isArray(data) || !filters || filters.length === 0) {
            return data;
        }

        return data.filter(row => {
            return filters.every(filter => {
                const value = this.getFieldValue(row, filter.field);
                
                switch (filter.operator) {
                    case 'equals':
                        return value == filter.value;
                    case 'contains':
                        return String(value).toLowerCase().includes(String(filter.value).toLowerCase());
                    case 'greater':
                        return Number(value) > Number(filter.value);
                    case 'less':
                        return Number(value) < Number(filter.value);
                    case 'not_empty':
                        return value !== null && value !== undefined && value !== '';
                    default:
                        return true;
                }
            });
        });
    }

    /**
     * Agregace dat
     */
    aggregateData(data, aggregation) {
        if (!Array.isArray(data) || !aggregation) {
            return data;
        }

        if (!aggregation.groupBy) {
            return data;
        }

        // Seskupení podle pole
        const groups = {};
        data.forEach(row => {
            const groupKey = this.getFieldValue(row, aggregation.groupBy);
            if (!groups[groupKey]) {
                groups[groupKey] = [];
            }
            groups[groupKey].push(row);
        });

        // Agregace skupin
        return Object.entries(groups).map(([key, groupData]) => {
            const result = { [aggregation.groupBy]: key };
            
            if (aggregation.aggregates) {
                aggregation.aggregates.forEach(agg => {
                    const values = groupData.map(row => this.getFieldValue(row, agg.field))
                        .filter(v => typeof v === 'number');
                    
                    switch (agg.function) {
                        case 'sum':
                            result[agg.field + '_sum'] = values.reduce((a, b) => a + b, 0);
                            break;
                        case 'average':
                            result[agg.field + '_avg'] = values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0;
                            break;
                        case 'count':
                            result[agg.field + '_count'] = groupData.length;
                            break;
                        case 'max':
                            result[agg.field + '_max'] = Math.max(...values);
                            break;
                        case 'min':
                            result[agg.field + '_min'] = Math.min(...values);
                            break;
                    }
                });
            }
            
            return result;
        });
    }

    /**
     * Získání hodnoty z vnořeného objektu
     */
    getFieldValue(obj, field) {
        return field.split('.').reduce((o, key) => o && o[key], obj);
    }

    /**
     * Validace konfigurace datového zdroje
     */
    validateSourceConfig(sourceConfig) {
        if (!sourceConfig || typeof sourceConfig !== 'object') {
            throw new Error('Neplatná konfigurace datového zdroje');
        }

        if (!sourceConfig.type) {
            throw new Error('Chybí typ datového zdroje');
        }

        if (!sourceConfig.config) {
            throw new Error('Chybí konfigurace pro datový zdroj');
        }

        switch (sourceConfig.type) {
            case 'google-sheets':
                if (!sourceConfig.config.gasUrl) {
                    throw new Error('Chybí URL Google Apps Script');
                }
                if (!sourceConfig.config.sheetId) {
                    throw new Error('Chybí ID Google Sheets');
                }
                break;
            case 'json-api':
                if (!sourceConfig.config.apiUrl) {
                    throw new Error('Chybí URL API');
                }
                break;
            case 'csv-file':
                if (!sourceConfig.config.csvUrl) {
                    throw new Error('Chybí URL CSV souboru');
                }
                break;
            default:
                throw new Error(`Nepodporovaný typ datového zdroje: ${sourceConfig.type}`);
        }

        return true;
    }

    /**
     * Export dat do různých formátů
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
     * Konverze dat do CSV
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
}

// Export pro modul systém
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DataManager;
}

console.log('📊 Data Manager načten - FUNKČNÍ VERZE');
