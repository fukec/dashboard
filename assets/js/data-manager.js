/**
 * Data Manager - Správa datových zdrojů a načítání dat
 * Verze: 3.0 - Modularní architektura
 * Autor: Dashboard System
 */

class DataManager {
    constructor(dashboardCore) {
        this.core = dashboardCore;
        this.sourceData = new Map();
        this.loadingCache = new Map();
        this.lastFetch = new Map();
        
        // JSONP callback counter
        this.callbackCounter = 0;
    }

    async init() {
        console.log('📊 Inicializace DataManager...');
        
        // Inicializace může obsahovat dodatečné nastavení
        this.setupDefaultDataSources();
    }

    /**
     * Nastavení výchozích typů datových zdrojů
     */
    setupDefaultDataSources() {
        this.supportedTypes = {
            'google-sheets': {
                name: 'Google Sheets',
                icon: 'fas fa-table',
                description: 'Data z Google Sheets přes Google Apps Script',
                configFields: [
                    {
                        key: 'gasUrl',
                        label: 'URL Google Apps Script',
                        type: 'url',
                        required: true,
                        placeholder: 'https://script.google.com/macros/s/.../exec'
                    },
                    {
                        key: 'sheetId',
                        label: 'ID Google Sheets',
                        type: 'text',
                        required: true,
                        placeholder: '1XFkpSafhec8eQFYzQaHHq1P8UaadrBX5wQad48rHn0g'
                    },
                    {
                        key: 'range',
                        label: 'Rozsah dat (range)',
                        type: 'text',
                        required: false,
                        placeholder: 'Summary!A1:E100',
                        defaultValue: 'A1:Z1000'
                    },
                    {
                        key: 'action',
                        label: 'API akce',
                        type: 'select',
                        options: [
                            { value: 'dashboard', label: 'Dashboard data' },
                            { value: 'charts', label: 'Charts data' },
                            { value: 'tables', label: 'Tables data' },
                            { value: 'custom', label: 'Custom endpoint' }
                        ],
                        defaultValue: 'dashboard'
                    }
                ]
            },
            'json-api': {
                name: 'JSON API',
                icon: 'fas fa-code',
                description: 'Externí JSON API endpoint',
                configFields: [
                    {
                        key: 'url',
                        label: 'API URL',
                        type: 'url',
                        required: true
                    },
                    {
                        key: 'method',
                        label: 'HTTP metoda',
                        type: 'select',
                        options: [
                            { value: 'GET', label: 'GET' },
                            { value: 'POST', label: 'POST' }
                        ],
                        defaultValue: 'GET'
                    },
                    {
                        key: 'headers',
                        label: 'Headers (JSON)',
                        type: 'textarea',
                        placeholder: '{"Authorization": "Bearer token"}'
                    }
                ]
            },
            'csv-file': {
                name: 'CSV soubor',
                icon: 'fas fa-file-csv',
                description: 'Upload CSV souboru pro analýzu',
                configFields: [
                    {
                        key: 'file',
                        label: 'CSV soubor',
                        type: 'file',
                        accept: '.csv',
                        required: true
                    },
                    {
                        key: 'delimiter',
                        label: 'Oddělovač',
                        type: 'select',
                        options: [
                            { value: ',', label: 'Čárka (,)' },
                            { value: ';', label: 'Středník (;)' },
                            { value: '\\t', label: 'Tab' }
                        ],
                        defaultValue: ','
                    },
                    {
                        key: 'hasHeader',
                        label: 'První řádek obsahuje hlavičky',
                        type: 'checkbox',
                        defaultValue: true
                    }
                ]
            }
        };
    }

    /**
     * Načtení dat ze zdroje
     */
    async loadDataSource(sourceId, sourceConfig) {
        console.log(`📡 Načítám data ze zdroje: ${sourceId}`, sourceConfig);

        try {
            // Kontrola cache
            const cacheKey = `${sourceId}_${JSON.stringify(sourceConfig)}`;
            const cached = this.getCachedData(cacheKey);
            if (cached && !this.isDataExpired(sourceId)) {
                console.log(`💾 Data načtena z cache: ${sourceId}`);
                return cached;
            }

            let data;
            
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
                    throw new Error(`Nepodporovaný typ zdroje: ${sourceConfig.type}`);
            }

            // Uložení do cache
            this.setCachedData(cacheKey, data);
            this.lastFetch.set(sourceId, new Date());
            
            console.log(`✅ Data úspěšně načtena ze zdroje: ${sourceId}`);
            return data;

        } catch (error) {
            console.error(`❌ Chyba při načítání zdroje ${sourceId}:`, error);
            throw error;
        }
    }

    /**
     * Načtení dat z Google Sheets
     */
    async loadGoogleSheetsData(config) {
        if (!config.gasUrl) {
            throw new Error('URL Google Apps Script není nakonfigurována');
        }

        const params = {
            action: config.action || 'dashboard',
            sheetId: config.sheetId,
            range: config.range
        };

        return await this.fetchViaJsonp(config.gasUrl, params);
    }

    /**
     * JSONP fetch pro Google Apps Script
     */
    fetchViaJsonp(url, params = {}) {
        return new Promise((resolve, reject) => {
            this.callbackCounter++;
            const callbackName = `dataCallback${this.callbackCounter}`;
            
            // Vytvoř URL s parametry
            const urlParams = new URLSearchParams(params);
            urlParams.set('callback', callbackName);
            urlParams.set('t', Date.now().toString());
            
            const fullUrl = `${url}?${urlParams.toString()}`;
            console.log(`🔗 JSONP volání:`, fullUrl);
            
            // Timeout
            const timeout = setTimeout(() => {
                cleanup();
                reject(new Error('Timeout - požadavek vypršel (30s)'));
            }, 30000);
            
            // Cleanup funkce
            const cleanup = () => {
                if (window[callbackName]) {
                    delete window[callbackName];
                }
                if (script && script.parentNode) {
                    script.parentNode.removeChild(script);
                }
                clearTimeout(timeout);
            };
            
            // Callback funkce
            window[callbackName] = (response) => {
                cleanup();
                
                if (response && response.success) {
                    console.log(`✅ JSONP data úspěšně načtena`);
                    resolve(response.data);
                } else {
                    const error = response?.error || 'Neznámá chyba z API';
                    reject(new Error(error));
                }
            };
            
            // Vytvoř script tag
            const script = document.createElement('script');
            script.src = fullUrl;
            script.onerror = () => {
                cleanup();
                reject(new Error('Síťová chyba při načítání dat'));
            };
            
            document.head.appendChild(script);
        });
    }

    /**
     * Načtení dat z JSON API
     */
    async loadJsonApiData(config) {
        const options = {
            method: config.method || 'GET',
            headers: {
                'Content-Type': 'application/json',
                ...this.parseHeaders(config.headers)
            }
        };

        if (config.body && config.method === 'POST') {
            options.body = JSON.stringify(config.body);
        }

        const response = await fetch(config.url, options);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return await response.json();
    }

    /**
     * Načtení dat z CSV souboru
     */
    async loadCsvFileData(config) {
        if (!config.fileContent) {
            throw new Error('CSV obsah není dostupný');
        }

        return this.parseCsv(config.fileContent, {
            delimiter: config.delimiter || ',',
            hasHeader: config.hasHeader !== false
        });
    }

    /**
     * Parsování CSV dat
     */
    parseCsv(csvText, options = {}) {
        const delimiter = options.delimiter || ',';
        const hasHeader = options.hasHeader !== false;
        
        const lines = csvText.trim().split('\n');
        const result = [];
        
        let headers = [];
        const startIndex = hasHeader ? 1 : 0;
        
        if (hasHeader && lines.length > 0) {
            headers = lines[0].split(delimiter).map(h => h.trim().replace(/^"|"$/g, ''));
        }
        
        for (let i = startIndex; i < lines.length; i++) {
            const values = lines[i].split(delimiter).map(v => v.trim().replace(/^"|"$/g, ''));
            
            if (hasHeader) {
                const obj = {};
                headers.forEach((header, index) => {
                    obj[header] = this.parseValue(values[index]);
                });
                result.push(obj);
            } else {
                result.push(values.map(v => this.parseValue(v)));
            }
        }
        
        return result;
    }

    /**
     * Parsování hodnoty (detekce čísel, datumů, booleanů)
     */
    parseValue(value) {
        if (!value || value === '') return null;
        
        // Boolean
        if (value.toLowerCase() === 'true') return true;
        if (value.toLowerCase() === 'false') return false;
        
        // Number
        const num = parseFloat(value.replace(/[^0-9.-]/g, ''));
        if (!isNaN(num) && isFinite(num)) {
            return num;
        }
        
        // Date
        const date = new Date(value);
        if (!isNaN(date.getTime()) && value.match(/\d{4}-\d{2}-\d{2}|\d{2}\/\d{2}\/\d{4}/)) {
            return date;
        }
        
        return value;
    }

    /**
     * Parsování headers ze stringu
     */
    parseHeaders(headersString) {
        if (!headersString) return {};
        
        try {
            return JSON.parse(headersString);
        } catch (error) {
            console.warn('⚠️ Chyba při parsování headers:', error);
            return {};
        }
    }

    /**
     * Uložení dat do cache
     */
    setCachedData(key, data) {
        this.loadingCache.set(key, {
            data: data,
            timestamp: new Date(),
            expires: new Date(Date.now() + (15 * 60 * 1000)) // 15 minut
        });
    }

    /**
     * Získání dat z cache
     */
    getCachedData(key) {
        const cached = this.loadingCache.get(key);
        
        if (cached && new Date() < cached.expires) {
            return cached.data;
        }
        
        if (cached) {
            this.loadingCache.delete(key);
        }
        
        return null;
    }

    /**
     * Kontrola, zda jsou data expirovaná
     */
    isDataExpired(sourceId, maxAge = 15 * 60 * 1000) {
        const lastFetch = this.lastFetch.get(sourceId);
        if (!lastFetch) return true;
        
        return (new Date() - lastFetch) > maxAge;
    }

    /**
     * Nastavení dat pro zdroj
     */
    setSourceData(sourceId, data) {
        this.sourceData.set(sourceId, data);
        console.log(`💾 Data uložena pro zdroj: ${sourceId}`);
    }

    /**
     * Získání dat ze zdroje
     */
    getSourceData(sourceId) {
        return this.sourceData.get(sourceId);
    }

    /**
     * Kontrola, zda je zdroj dostupný
     */
    hasSourceData(sourceId) {
        return this.sourceData.has(sourceId);
    }

    /**
     * Vyčištění cache
     */
    clearCache(sourceId = null) {
        if (sourceId) {
            // Vymaž cache pro konkrétní zdroj
            for (const key of this.loadingCache.keys()) {
                if (key.startsWith(sourceId)) {
                    this.loadingCache.delete(key);
                }
            }
            this.lastFetch.delete(sourceId);
        } else {
            // Vymaž celou cache
            this.loadingCache.clear();
            this.lastFetch.clear();
        }
        
        console.log('🗑️ Cache vyčištěna');
    }

    /**
     * Agregace dat podle konfigurace
     */
    aggregateData(sourceData, aggregationConfig) {
        if (!sourceData || !Array.isArray(sourceData) || !aggregationConfig) {
            return sourceData;
        }

        const { groupBy, aggregations } = aggregationConfig;
        
        if (!groupBy || !aggregations) {
            return sourceData;
        }

        // Seskupení dat
        const grouped = this.groupData(sourceData, groupBy);
        
        // Aplikace agregací
        const result = [];
        for (const [groupKey, groupData] of Object.entries(grouped)) {
            const aggregatedRow = { [groupBy]: groupKey };
            
            for (const agg of aggregations) {
                const values = groupData.map(row => this.getNestedValue(row, agg.field)).filter(v => v != null);
                aggregatedRow[agg.alias || agg.field] = this.calculateAggregation(values, agg.function);
            }
            
            result.push(aggregatedRow);
        }
        
        return result;
    }

    /**
     * Seskupení dat podle pole
     */
    groupData(data, groupBy) {
        const grouped = {};
        
        for (const row of data) {
            const groupValue = this.getNestedValue(row, groupBy) || 'N/A';
            
            if (!grouped[groupValue]) {
                grouped[groupValue] = [];
            }
            
            grouped[groupValue].push(row);
        }
        
        return grouped;
    }

    /**
     * Výpočet agregační funkce
     */
    calculateAggregation(values, func) {
        const numbers = values.filter(v => typeof v === 'number' && !isNaN(v));
        
        switch (func.toLowerCase()) {
            case 'sum':
                return numbers.reduce((a, b) => a + b, 0);
                
            case 'avg':
            case 'average':
                return numbers.length ? numbers.reduce((a, b) => a + b, 0) / numbers.length : 0;
                
            case 'count':
                return values.length;
                
            case 'min':
                return Math.min(...numbers);
                
            case 'max':
                return Math.max(...numbers);
                
            case 'first':
                return values[0];
                
            case 'last':
                return values[values.length - 1];
                
            default:
                return values.length;
        }
    }

    /**
     * Získání vnořené hodnoty z objektu
     */
    getNestedValue(obj, path) {
        return path.split('.').reduce((current, key) => {
            return current && current[key] !== undefined ? current[key] : null;
        }, obj);
    }

    /**
     * Filtrování dat podle podmínek
     */
    filterData(data, filters) {
        if (!filters || filters.length === 0) {
            return data;
        }

        return data.filter(row => {
            return filters.every(filter => {
                const value = this.getNestedValue(row, filter.field);
                return this.evaluateFilter(value, filter.operator, filter.value);
            });
        });
    }

    /**
     * Vyhodnocení filtru
     */
    evaluateFilter(value, operator, filterValue) {
        switch (operator) {
            case '=':
            case 'equals':
                return value == filterValue;
                
            case '!=':
            case 'not_equals':
                return value != filterValue;
                
            case '>':
            case 'greater':
                return Number(value) > Number(filterValue);
                
            case '>=':
            case 'greater_equals':
                return Number(value) >= Number(filterValue);
                
            case '<':
            case 'less':
                return Number(value) < Number(filterValue);
                
            case '<=':
            case 'less_equals':
                return Number(value) <= Number(filterValue);
                
            case 'contains':
                return String(value).toLowerCase().includes(String(filterValue).toLowerCase());
                
            case 'starts_with':
                return String(value).toLowerCase().startsWith(String(filterValue).toLowerCase());
                
            case 'ends_with':
                return String(value).toLowerCase().endsWith(String(filterValue).toLowerCase());
                
            default:
                return true;
        }
    }

    /**
     * Získání statistik o datech
     */
    getDataStats(data) {
        if (!Array.isArray(data) || data.length === 0) {
            return { count: 0, fields: [] };
        }

        const stats = {
            count: data.length,
            fields: [],
            sample: data.slice(0, 3)
        };

        // Analýza polí
        const fieldTypes = {};
        const sampleRow = data[0];
        
        if (typeof sampleRow === 'object' && sampleRow !== null) {
            Object.keys(sampleRow).forEach(field => {
                const values = data.map(row => row[field]).filter(v => v != null);
                
                fieldTypes[field] = {
                    name: field,
                    type: this.detectFieldType(values),
                    nullCount: data.length - values.length,
                    uniqueCount: new Set(values).size,
                    sampleValues: values.slice(0, 5)
                };
            });
        }

        stats.fields = Object.values(fieldTypes);
        return stats;
    }

    /**
     * Detekce typu pole
     */
    detectFieldType(values) {
        if (values.length === 0) return 'unknown';
        
        const sampleSize = Math.min(10, values.length);
        const sample = values.slice(0, sampleSize);
        
        const numberCount = sample.filter(v => typeof v === 'number').length;
        const dateCount = sample.filter(v => v instanceof Date).length;
        const boolCount = sample.filter(v => typeof v === 'boolean').length;
        
        if (numberCount / sampleSize > 0.8) return 'number';
        if (dateCount / sampleSize > 0.8) return 'date';
        if (boolCount / sampleSize > 0.8) return 'boolean';
        
        return 'string';
    }
}

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DataManager;
}

console.log('📊 Data Manager modul načten');
