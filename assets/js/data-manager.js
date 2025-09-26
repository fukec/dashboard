/**
 * Data Manager - Správa datových zdrojů a načítání dat (oprava URL)
 * Verze: 3.0 - Modularní architektura
 * Autor: Dashboard System
 */

class DataManager {
    constructor(dashboardCore) {
        this.core = dashboardCore;
        this.sourceData = new Map();
        this.loadingCache = new Map();
        this.lastFetch = new Map();
        this.callbackCounter = 0; // JSONP callback counter
    }

    async init() {
        console.log('📊 Inicializace DataManager...');
        this.setupDefaultDataSources();
    }

    setupDefaultDataSources() {
        this.supportedTypes = {
            'google-sheets': {
                name: 'Google Sheets',
                icon: 'fas fa-table',
                description: 'Data z Google Sheets přes Google Apps Script',
                configFields: [
                    { key: 'gasUrl', label: 'URL Google Apps Script', type: 'url', required: true, placeholder: 'https://script.google.com/…/exec' },
                    { key: 'sheetId', label: 'ID Google Sheets', type: 'text', required: true, placeholder: '1XF…' },
                    { key: 'range', label: 'Rozsah dat (range)', type: 'text', required: false, defaultValue: 'A1:Z1000' },
                    { key: 'action', label: 'API akce', type: 'select', options: [
                        {value:'dashboard',label:'Dashboard data'},
                        {value:'charts',label:'Charts data'},
                        {value:'tables',label:'Tables data'},
                        {value:'custom',label:'Custom endpoint'}
                    ], defaultValue: 'dashboard' }
                ]
            },
            'json-api': { /* ... */ },
            'csv-file': { /* ... */ }
        };
    }

    async loadDataSource(sourceId, sourceConfig) {
        const type = sourceConfig.type;
        let data;
        switch(type) {
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
                throw new Error(`Nepodporovaný typ zdroje: ${type}`);
        }
        this.sourceData.set(sourceId, data);
        return data;
    }

    // --- OPRAVENÁ FUNKCE loadGoogleSheetsData ---
    async loadGoogleSheetsData(config) {
        // Podpora uložení URL v config.gasUrl nebo config.config.gasUrl
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

    async fetchViaJsonp(url, params = {}) {
        return new Promise((resolve, reject) => {
            this.callbackCounter++;
            const cbName = `cb${this.callbackCounter}`;
            params.callback = cbName;
            params.t = Date.now();
            const query = new URLSearchParams(params).toString();
            const src = `${url}?${query}`;
            const script = document.createElement('script');
            script.src = src;
            script.onerror = () => reject(new Error('Network error'));
            window[cbName] = (resp) => {
                if (resp && resp.success) resolve(resp.data);
                else reject(new Error(resp.error || 'API error'));
                delete window[cbName];
                script.remove();
            };
            document.head.appendChild(script);
        });
    }

    async loadJsonApiData(config) { /* ... */ }
    async loadCsvFileData(config) { /* ... */ }

    // Další metody pro parsování, agregace, filtry...
}

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DataManager;
}

console.log('📊 Data Manager modul načten (opraveno)');
