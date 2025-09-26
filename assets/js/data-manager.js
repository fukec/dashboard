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
                            { value: '\t', label: 'Tab' }
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
     * Opraveno: podporuje config.gasUrl i config.config.gasUrl
     */
    async loadGoogleSheetsData(config) {
        const gasUrl = config.gasUrl || (config.config && config.config.gasUrl);
        if (!gasUrl) {
            throw new Error('URL Google Apps Script není nakonfigurována');
        }

        const params = {
            action: config.action || (config.config && config.config.action) || 'dashboard',
            sheetId: config.sheetId || (config.config && config.config.sheetId),
            range: config.range || (config.config && config.config.range)
        };

        return await this.fetchViaJsonp(gasUrl, params);
    }

    /**
     * JSONP fetch pro Google Apps Script
     */
    fetchViaJsonp(url, params = {}) {
        return new Promise((resolve, reject) => {
            this.callbackCounter++;
            const callbackName = `dataCallback${this.callbackCounter}`;
            
            // Připrav parametry
            params.callback = callbackName;
            params.t = Date.now().toString();
            
            const urlParams = new URLSearchParams(params).toString();
            const fullUrl = `${url}?${urlParams}`;
            console.log(`🔗 JSONP volání:`, fullUrl);
            
            // Timeout
            const timeout = setTimeout(() => {
                cleanup();
                reject(new Error('Timeout - požadavek vypršel (30s)'));
            }, 30000);
            
            function cleanup() {
                if (window[callbackName]) delete window[callbackName];
                document.head.removeChild(script);
                clearTimeout(timeout);
            }
            
            // Callback
            window[callbackName] = (response) => {
                cleanup();
                if (response && response.success) resolve(response.data);
                else reject(new Error(response?.error || 'Chyba z API'));
            };
            
            // Script
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
            headers: { 'Content-Type': 'application/json', ...(this.parseHeaders(config.headers)) }
        };
        if (config.body && config.method === 'POST') options.body = JSON.stringify(config.body);

        const response = await fetch(config.url, options);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        return await response.json();
    }

    /**
     * Načtení dat z CSV souboru
     */
    async loadCsvFileData(config) {
        if (!config.fileContent) throw new Error('CSV obsah není dostupný');
        return this.parseCsv(config.fileContent, { delimiter: config.delimiter, hasHeader: config.hasHeader });
    }

    /**
     * Parsování CSV dat
     */
    parseCsv(csvText, options = {}) {
        const delim = options.delimiter || ',';
        const lines = csvText.trim().split('\n');
        const hasHeader = options.hasHeader !== false;
        let headers = hasHeader ? lines.shift().split(delim) : [];

        return lines.map(line => {
            const values = line.split(delim);
            if (hasHeader) {
                return Object.fromEntries(headers.map((h,i) => [h, this.parseValue(values[i])]));
            } else {
                return values.map(v => this.parseValue(v));
            }
        });
    }

    parseValue(value) {
        if (!value) return null;
        if (value.toLowerCase() === 'true') return true;
        if (value.toLowerCase() === 'false') return false;
        const num = parseFloat(value.replace(/[^0-9.-]/g, ''));
        if (!isNaN(num)) return num;
        const date = new Date(value);
        if (!isNaN(date)) return date;
        return value;
    }

    parseHeaders(str) {
        if (!str) return {};
        try { return JSON.parse(str); } catch { return {}; }
    }

    setCachedData(key, data) {
        this.loadingCache.set(key, { data, expires: Date.now() + 15*60*1000 });
    }

    getCachedData(key) {
        const entry = this.loadingCache.get(key);
        if (entry && Date.now() < entry.expires) return entry.data;
        if (entry) this.loadingCache.delete(key);
        return null;
    }

    isDataExpired(id, age=15*60*1000) {
        const last=this.lastFetch.get(id); if(!last) return true;
        return Date.now() - last > age;
    }

    setSourceData(id,data){ this.sourceData.set(id,data); }
    getSourceData(id){ return this.sourceData.get(id); }
    hasSourceData(id){ return this.sourceData.has(id); }
    clearCache(id=null){
        if(id){
            for(const k of this.loadingCache.keys()) if(k.startsWith(id)) this.loadingCache.delete(k);
            this.lastFetch.delete(id);
        } else {
            this.loadingCache.clear();
            this.lastFetch.clear();
        }
    }
    aggregateData(d,config){ /* ... */ }
    groupData(d,by){ /* ... */ }
    calculateAggregation(v,f){ /* ... */ }
    filterData(d,f){ /* ... */ }
    getDataStats(d){ /* ... */ }
    detectFieldType(v){ /* ... */ }
}

// Export for testing
if(typeof module!=='undefined') module.exports=DataManager;

console.log('📊 Data Manager modul načten');
