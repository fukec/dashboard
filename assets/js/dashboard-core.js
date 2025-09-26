/**
 * Dashboard Core - Hlavní jádro modularní aplikace
 * Dashboard Core - Hlavní orchestrace systému (v3.0 opraveno)
* Verze: 3.0 - Modularní architektura
* Autor: Dashboard System
*/

class DashboardCore {
constructor() {
        this.version = '3.0.0';
        this.initialized = false;
        this.loadingState = false;
        this.lastUpdate = null;
        
        // Konfigurace
this.config = {
            gasUrl: '',
            autoRefresh: false,
            refreshInterval: 300, // 5 minut
            enableNotifications: true,
            version: '3.0',
debugMode: false
};

        // Moduly
        
        // Data storage
        this.dataSources = new Map();
        this.widgets = new Map();
        this.layout = { columns: 12, widgets: [] };
        
        // Module instances
this.dataManager = null;
this.configManager = null;
this.widgetFactory = null;
this.detailModal = null;

        // Stav aplikace
        this.widgets = new Map();
        this.dataSources = new Map();
        this.activeLayout = 'grid';
        
        // Event listeners
        this.eventListeners = new Map();
        // State
        this.isInitialized = false;
        this.isLoading = false;
}

    /**
     * Inicializace aplikace
     */
async init() {
        console.log(`🚀 Inicializace Dashboard Core v${this.version}`);
        console.log('🚀 Inicializace DashboardCore v3.0...');

try {
            // Načti konfiguraci
            await this.loadConfiguration();
            
            // Inicializace modulů
            // Inicializace modulů v správném pořadí
await this.initializeModules();

            // Nastavení UI event listenerů
            // Nastavení event listenerů
this.setupEventListeners();

            // Načti uložené widgety a datové zdroje
            await this.loadUserConfiguration();
            // Načtení konfigurace z localStorage
            this.loadConfiguration();

            // Skryj preloader
            // Skrytí preloaderu
this.hidePreloader();

            // Vykresli dashboard
            await this.renderDashboard();
            
            this.initialized = true;
            console.log('✅ Dashboard úspěšně inicializován');
            // Označení jako inicializované
            this.isInitialized = true;

            // Zobraz uvítací zprávu pokud je dashboard prázdný
            this.checkEmptyDashboard();
            console.log('✅ DashboardCore inicializován úspěšně');

} catch (error) {
            console.error('❌ Chyba při inicializaci:', error);
            this.showError('Chyba při inicializaci aplikace: ' + error.message);
            console.error('❌ Chyba při inicializaci DashboardCore:', error);
            this.showToast('Chyba při inicializaci aplikace', 'error');
}
}

    /**
     * Inicializace modulů
     */
async initializeModules() {
console.log('📦 Inicializace modulů...');

        // DataManager
        if (typeof DataManager !== 'undefined') {
            this.dataManager = new DataManager(this);
            await this.dataManager.init();
            console.log('✅ DataManager inicializován');
        }
        // Data Manager - prvotní inicializace
        this.dataManager = new DataManager(this);
        await this.dataManager.init();

        // ConfigManager
        if (typeof ConfigManager !== 'undefined') {
            this.configManager = new ConfigManager(this);
            await this.configManager.init();
            console.log('✅ ConfigManager inicializován');
        }
        // Widget Factory
        this.widgetFactory = new WidgetFactory(this);
        await this.widgetFactory.init();

        // WidgetFactory
        if (typeof WidgetFactory !== 'undefined') {
            this.widgetFactory = new WidgetFactory(this);
            await this.widgetFactory.init();
            console.log('✅ WidgetFactory inicializován');
        }
        // Configuration Manager
        this.configManager = new ConfigManager(this);
        await this.configManager.init();

        // DetailModal
        if (typeof DetailModal !== 'undefined') {
            this.detailModal = new DetailModal(this);
            await this.detailModal.init();
            console.log('✅ DetailModal inicializován');
        }
        // Detail Modal
        this.detailModal = new DetailModal(this);
        await this.detailModal.init();
        
        // Globální přiřazení pro HTML onclick handlers
        window.configManager = this.configManager;

        // Registrace globálních referencí
        window.DashboardCore = this;
        window.DataManager = this.dataManager;
        window.ConfigManager = this.configManager;
        window.WidgetFactory = this.widgetFactory;
        window.DetailModal = this.detailModal;
        console.log('✅ Všechny moduly inicializovány');
}

    /**
     * Nastavení event listenerů
     */
setupEventListeners() {
        console.log('🎯 Nastavuji event listeners...');
        console.log('🎯 Nastavení event listenerů...');

        // Načítání dat
        // Load data button
const loadDataBtn = document.getElementById('loadDataBtn');
if (loadDataBtn) {
            loadDataBtn.addEventListener('click', () => this.loadAllData());
        }
        
        // Konfigurace
        const configDataSources = document.getElementById('configDataSources');
        if (configDataSources) {
            configDataSources.addEventListener('click', (e) => {
                e.preventDefault();
                this.configManager?.openDataSourcesConfig();
            });
        }
        
        const configWidgets = document.getElementById('configWidgets');
        if (configWidgets) {
            configWidgets.addEventListener('click', (e) => {
                e.preventDefault();
                this.configManager?.openWidgetsConfig();
            });
        }
        
        const configLayout = document.getElementById('configLayout');
        if (configLayout) {
            configLayout.addEventListener('click', (e) => {
                e.preventDefault();
                this.configManager?.openLayoutConfig();
            });
        }
        
        // Export/Import konfigurace
        const exportConfig = document.getElementById('exportConfig');
        if (exportConfig) {
            exportConfig.addEventListener('click', (e) => {
                e.preventDefault();
                this.exportConfiguration();
            });
        }
        
        const importConfig = document.getElementById('importConfig');
        if (importConfig) {
            importConfig.addEventListener('click', (e) => {
                e.preventDefault();
                this.importConfiguration();
            loadDataBtn.addEventListener('click', () => {
                this.loadAllData();
});
}

        // Přepínání témat
        // Theme toggle
const themeToggle = document.getElementById('themeToggle');
if (themeToggle) {
            themeToggle.addEventListener('click', () => this.toggleTheme());
            themeToggle.addEventListener('click', () => {
                this.toggleTheme();
            });
}

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.shiftKey && e.code === 'KeyR') {
                e.preventDefault();
                this.loadAllData();
            }
            if (e.ctrlKey && e.shiftKey && e.code === 'KeyC') {
                e.preventDefault();
                this.configManager?.openWidgetsConfig();
            if (e.ctrlKey && e.shiftKey) {
                if (e.code === 'KeyC') {
                    e.preventDefault();
                    this.configManager.openDataSourcesConfig();
                } else if (e.code === 'KeyR') {
                    e.preventDefault();
                    this.loadAllData();
                }
}
});

        console.log('✅ Event listeners nastaveny');
    }

    /**
     * Načtení konfigurace aplikace
     */
    async loadConfiguration() {
        try {
            const savedConfig = localStorage.getItem('dashboardConfig');
            if (savedConfig) {
                const parsed = JSON.parse(savedConfig);
                this.config = { ...this.config, ...parsed };
            }
            
            console.log('📋 Konfigurace načtena:', this.config);
        } catch (error) {
            console.warn('⚠️ Chyba při načítání konfigurace:', error);
        }
    }

    /**
     * Načtení uživatelské konfigurace (widgety, datové zdroje)
     */
    async loadUserConfiguration() {
        try {
            // Načti datové zdroje
            const savedDataSources = localStorage.getItem('dashboardDataSources');
            if (savedDataSources) {
                const dataSources = JSON.parse(savedDataSources);
                for (const [id, config] of Object.entries(dataSources)) {
                    this.dataSources.set(id, config);
                }
                console.log(`📊 Načteno ${this.dataSources.size} datových zdrojů`);
            }
            
            // Načti widgety
            const savedWidgets = localStorage.getItem('dashboardWidgets');
            if (savedWidgets) {
                const widgets = JSON.parse(savedWidgets);
                for (const [id, config] of Object.entries(widgets)) {
                    this.widgets.set(id, config);
                }
                console.log(`🧩 Načteno ${this.widgets.size} widgetů`);
            }
            
        } catch (error) {
            console.warn('⚠️ Chyba při načítání uživatelské konfigurace:', error);
        }
        console.log('✅ Event listenery nastaveny');
}

    /**
     * Uložení uživatelské konfigurace
     */
    saveUserConfiguration() {
        try {
            // Ulož datové zdroje
            const dataSourcesObj = Object.fromEntries(this.dataSources);
            localStorage.setItem('dashboardDataSources', JSON.stringify(dataSourcesObj));
            
            // Ulož widgety
            const widgetsObj = Object.fromEntries(this.widgets);
            localStorage.setItem('dashboardWidgets', JSON.stringify(widgetsObj));
            
            console.log('💾 Uživatelská konfigurace uložena');
        } catch (error) {
            console.error('❌ Chyba při ukládání konfigurace:', error);
        }
    }
    // ========================================
    // DATA MANAGEMENT
    // ========================================

    /**
     * Načtení všech dat
     */
    async loadAllData() {
        if (this.loadingState) {
    async loadAllData(forceRefresh = false) {
        if (this.isLoading) {
console.log('⏳ Načítání již probíhá...');
return;
}

        this.loadingState = true;
        console.log('📊 Načítám všechna data...');
        console.log('📊 Načítání všech dat...');
        
        this.isLoading = true;
        this.showLoadingOverlay();

try {
            this.showLoadingOverlay(true);
            this.updateLoadingStatus('Připojuji se k datovým zdrojům...', 0);
            
            // Načti data ze všech nakonfigurovaných zdrojů
            const dataPromises = [];
            let progress = 0;
            const progressStep = 100 / Math.max(this.dataSources.size, 1);
            const results = new Map();
            const errors = [];

            // Načtení dat ze všech zdrojů
for (const [sourceId, sourceConfig] of this.dataSources) {
                console.log(`📡 Načítám data ze zdroje: ${sourceId}`);
                
                const promise = this.dataManager.loadDataSource(sourceId, sourceConfig)
                    .then(data => {
                        progress += progressStep;
                        this.updateLoadingStatus(`Načten zdroj: ${sourceConfig.name}`, progress);
                        return { sourceId, data };
                    })
                    .catch(error => {
                        console.error(`❌ Chyba při načítání zdroje ${sourceId}:`, error);
                        return { sourceId, error };
                    });
                
                dataPromises.push(promise);
            }
            
            // Čekej na všechna data
            const results = await Promise.all(dataPromises);
            
            // Zpracuj výsledky
            for (const result of results) {
                if (result.error) {
                    this.showToast(`Chyba při načítání ${result.sourceId}`, 'error');
                } else {
                    this.dataManager.setSourceData(result.sourceId, result.data);
                try {
                    console.log(`📡 Načítání ze zdroje: ${sourceId}`);
                    const data = await this.dataManager.loadDataSource(sourceId, sourceConfig);
                    results.set(sourceId, data);
                } catch (error) {
                    console.error(`❌ Chyba při načítání zdroje ${sourceId}:`, error);
                    errors.push({ sourceId, error: error.message });
}
}

            // Aktualizuj widgety
            this.updateLoadingStatus('Aktualizuji widgety...', 90);
            await this.updateAllWidgets();
            // Aktualizace widgetů s novými daty
            this.updateWidgetsWithData(results);

            // Dokončení
            this.updateLoadingStatus('Dokončeno!', 100);
            this.lastUpdate = new Date();
            // Aktualizace času
this.updateLastUpdateTime();

            // Skryj loading overlay
            setTimeout(() => {
                this.showLoadingOverlay(false);
            }, 1000);
            
            // Zobraz notifikaci
            if (this.config.enableNotifications) {
                this.showToast('Data byla úspěšně načtena', 'success');
            // Zobrazení úspěchu nebo chyb
            if (errors.length === 0) {
                this.showToast('Data úspěšně načtena', 'success');
            } else {
                this.showToast(`Načteno s ${errors.length} chybami`, 'warning');
}

            console.log('✅ Všechna data byla načtena');
            
} catch (error) {
            console.error('❌ Chyba při načítání dat:', error);
            this.showError('Nepodařilo se načíst data: ' + error.message);
            this.showLoadingOverlay(false);
            console.error('❌ Kritická chyba při načítání dat:', error);
            this.showToast('Kritická chyba při načítání dat', 'error');
} finally {
            this.loadingState = false;
            this.isLoading = false;
            this.hideLoadingOverlay();
}
}

    /**
     * Aktualizace všech widgetů
     */
    async updateAllWidgets() {
        console.log('🔄 Aktualizuji všechny widgety...');
    updateWidgetsWithData(dataResults) {
        console.log('🔄 Aktualizace widgetů s daty...');

for (const [widgetId, widgetConfig] of this.widgets) {
            if (widgetConfig.enabled !== false) {
                try {
                    await this.widgetFactory.updateWidget(widgetId);
                } catch (error) {
                    console.error(`❌ Chyba při aktualizaci widgetu ${widgetId}:`, error);
            try {
                const sourceData = dataResults.get(widgetConfig.dataSourceId);
                if (sourceData) {
                    this.widgetFactory.updateWidget(widgetId, sourceData);
}
            } catch (error) {
                console.error(`❌ Chyba při aktualizaci widgetu ${widgetId}:`, error);
}
}
        
        console.log('✅ Všechny widgety aktualizovány');
}

    /**
     * Vykreslení dashboard
     */
    async renderDashboard() {
        console.log('🎨 Vykresluji dashboard...');
        
        const grid = document.getElementById('dashboardGrid');
        if (!grid) return;
    // ========================================
    // DATA SOURCES MANAGEMENT
    // ========================================

    addDataSource(sourceId, sourceConfig) {
        console.log(`➕ Přidání datového zdroje: ${sourceId}`, sourceConfig);
        this.dataSources.set(sourceId, sourceConfig);
        this.saveConfiguration();
    }

    removeDataSource(sourceId) {
        console.log(`🗑️ Odebrání datového zdroje: ${sourceId}`);
        this.dataSources.delete(sourceId);

        // Vyčisti grid
        grid.innerHTML = '';
        // Odebrání závislých widgetů
        const dependentWidgets = Array.from(this.widgets.entries())
            .filter(([_, config]) => config.dataSourceId === sourceId);
            
        dependentWidgets.forEach(([widgetId]) => {
            this.removeWidget(widgetId);
        });

        // Pokud nejsou widgety, zobraz prázdný stav
        if (this.widgets.size === 0) {
            this.showEmptyDashboard();
            return;
        this.saveConfiguration();
    }

    getDataSources() {
        const sources = {};
        this.dataSources.forEach((config, id) => {
            sources[id] = config;
        });
        return sources;
    }

    // ========================================
    // WIDGETS MANAGEMENT
    // ========================================

    addWidget(widgetId, widgetConfig) {
        console.log(`🧩 Přidání widgetu: ${widgetId}`, widgetConfig);
        this.widgets.set(widgetId, widgetConfig);
        this.saveConfiguration();
        
        // Přidání do layoutu pokud není
        if (!this.layout.widgets.find(w => w.id === widgetId)) {
            this.layout.widgets.push({
                id: widgetId,
                x: 0,
                y: 0,
                width: widgetConfig.width || 6,
                height: widgetConfig.height || 4,
                visible: true
            });
}

        // Seřaď widgety podle pozice
        const sortedWidgets = Array.from(this.widgets.entries())
            .filter(([id, config]) => config.enabled !== false)
            .sort(([,a], [,b]) => (a.position || 0) - (b.position || 0));
        // Vykreslení widgetu
        this.widgetFactory.renderWidget(widgetId, widgetConfig);
    }

    removeWidget(widgetId) {
        console.log(`🗑️ Odebrání widgetu: ${widgetId}`);
        this.widgets.delete(widgetId);

        // Vykresli všechny widgety
        for (const [widgetId, widgetConfig] of sortedWidgets) {
            try {
                const widgetElement = await this.widgetFactory.createWidget(widgetId, widgetConfig);
                if (widgetElement) {
                    grid.appendChild(widgetElement);
                }
            } catch (error) {
                console.error(`❌ Chyba při vykreslování widgetu ${widgetId}:`, error);
            }
        // Odebrání z layoutu
        this.layout.widgets = this.layout.widgets.filter(w => w.id !== widgetId);
        
        // Odebrání z DOM
        const element = document.getElementById(`widget_${widgetId}`);
        if (element) {
            element.remove();
}

        console.log(`✅ Dashboard vykreslen (${sortedWidgets.length} widgetů)`);
        this.saveConfiguration();
}

    /**
     * Kontrola prázdného dashboard
     */
    checkEmptyDashboard() {
        const hasActiveWidgets = Array.from(this.widgets.values())
            .some(config => config.enabled !== false);
            
        if (!hasActiveWidgets) {
            this.showEmptyDashboard();
        } else {
            this.hideEmptyDashboard();
        }
    getWidgets() {
        const widgets = {};
        this.widgets.forEach((config, id) => {
            widgets[id] = config;
        });
        return widgets;
}

    /**
     * Zobrazení prázdného stavu
     */
    showEmptyDashboard() {
        const emptyDiv = document.getElementById('emptyDashboard');
        if (emptyDiv) {
            emptyDiv.style.display = 'block';
    // ========================================
    // LAYOUT MANAGEMENT
    // ========================================

    getLayout() {
        return this.layout;
    }

    updateLayout(newLayout) {
        this.layout = { ...this.layout, ...newLayout };
        this.saveConfiguration();
    }

    // ========================================
    // CONFIGURATION PERSISTENCE
    // ========================================

    loadConfiguration() {
        console.log('📂 Načítání konfigurace z localStorage...');
        
        try {
            const saved = localStorage.getItem('dashboardConfig_v3');
            if (saved) {
                const config = JSON.parse(saved);
                
                // Načtení datových zdrojů
                if (config.dataSources) {
                    Object.entries(config.dataSources).forEach(([id, sourceConfig]) => {
                        this.dataSources.set(id, sourceConfig);
                    });
                }
                
                // Načtení widgetů
                if (config.widgets) {
                    Object.entries(config.widgets).forEach(([id, widgetConfig]) => {
                        this.widgets.set(id, widgetConfig);
                    });
                }
                
                // Načtení layoutu
                if (config.layout) {
                    this.layout = config.layout;
                }
                
                console.log('✅ Konfigurace načtena z localStorage');
            }
        } catch (error) {
            console.error('❌ Chyba při načítání konfigurace:', error);
}
}

    /**
     * Skrytí prázdného stavu
     */
    hideEmptyDashboard() {
        const emptyDiv = document.getElementById('emptyDashboard');
        if (emptyDiv) {
            emptyDiv.style.display = 'none';
    saveConfiguration() {
        console.log('💾 Ukládání konfigurace do localStorage...');
        
        try {
            const config = {
                version: this.config.version,
                timestamp: new Date().toISOString(),
                dataSources: this.getDataSources(),
                widgets: this.getWidgets(),
                layout: this.layout
            };
            
            localStorage.setItem('dashboardConfig_v3', JSON.stringify(config));
            console.log('✅ Konfigurace uložena');
        } catch (error) {
            console.error('❌ Chyba při ukládání konfigurace:', error);
}
}

    /**
     * Zobrazení/skrytí loading overlay
     */
    showLoadingOverlay(show) {
    // ========================================
    // UI HELPER METHODS
    // ========================================

    showLoadingOverlay() {
const overlay = document.getElementById('loadingOverlay');
if (overlay) {
            overlay.classList.toggle('d-none', !show);
            overlay.classList.remove('d-none');
}

        const loadBtn = document.getElementById('loadDataBtn');
        const loadIcon = document.getElementById('loadDataIcon');
        if (loadBtn && loadIcon) {
            loadBtn.disabled = show;
            loadIcon.classList.toggle('fa-spin', show);
        const icon = document.getElementById('loadDataIcon');
        if (icon) {
            icon.classList.add('fa-spin');
}
}

    /**
     * Aktualizace loading stavu
     */
    updateLoadingStatus(message, progress = 0) {
        const statusEl = document.getElementById('loadingStatus');
        if (statusEl) {
            statusEl.textContent = message;
    hideLoadingOverlay() {
        const overlay = document.getElementById('loadingOverlay');
        if (overlay) {
            overlay.classList.add('d-none');
}

        const progressEl = document.querySelector('#loadingProgress .progress-bar');
        if (progressEl) {
            progressEl.style.width = progress + '%';
            progressEl.setAttribute('aria-valuenow', progress);
        }
    }

    /**
     * Aktualizace času poslední aktualizace
     */
    updateLastUpdateTime() {
        const timeEl = document.getElementById('lastUpdateTime');
        if (timeEl && this.lastUpdate) {
            timeEl.textContent = this.lastUpdate.toLocaleTimeString('cs-CZ');
        const icon = document.getElementById('loadDataIcon');
        if (icon) {
            icon.classList.remove('fa-spin');
}
}

    /**
     * Skrytí preloaderu
     */
hidePreloader() {
const preloader = document.getElementById('preloader');
if (preloader) {
@@ -480,13 +370,21 @@ class DashboardCore {
setTimeout(() => {
preloader.style.display = 'none';
}, 300);
            }, 500);
            }, 1000);
        }
    }

    updateLastUpdateTime() {
        const timeElement = document.getElementById('lastUpdateTime');
        if (timeElement) {
            const now = new Date();
            timeElement.textContent = now.toLocaleTimeString('cs-CZ', {
                hour: '2-digit',
                minute: '2-digit'
            });
}
}

    /**
     * Přepínání témat
     */
toggleTheme() {
document.body.classList.toggle('dark-theme');
const isDark = document.body.classList.contains('dark-theme');
@@ -497,177 +395,70 @@ class DashboardCore {
}

localStorage.setItem('dashboardTheme', isDark ? 'dark' : 'light');
        console.log('🎨 Téma změněno na:', isDark ? 'dark' : 'light');
        console.log(`🎨 Téma změněno na: ${isDark ? 'tmavé' : 'světlé'}`);
}

    /**
     * Export konfigurace
     */
    exportConfiguration() {
        try {
            const config = {
                version: this.version,
                timestamp: new Date().toISOString(),
                dataSources: Object.fromEntries(this.dataSources),
                widgets: Object.fromEntries(this.widgets),
                settings: this.config
            };
            
            const dataStr = JSON.stringify(config, null, 2);
            const dataBlob = new Blob([dataStr], { type: 'application/json' });
            
            const link = document.createElement('a');
            link.href = URL.createObjectURL(dataBlob);
            link.download = `dashboard-config-${new Date().toISOString().slice(0,10)}.json`;
            link.click();
            
            this.showToast('Konfigurace byla exportována', 'success');
            
        } catch (error) {
            console.error('❌ Chyba při exportu:', error);
            this.showToast('Chyba při exportu konfigurace', 'error');
        }
    }

    /**
     * Import konfigurace
     */
    importConfiguration() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    try {
                        const config = JSON.parse(e.target.result);
                        
                        // Validace
                        if (!config.version || !config.dataSources || !config.widgets) {
                            throw new Error('Neplatný formát konfiguračního souboru');
                        }
                        
                        // Import dat
                        this.dataSources.clear();
                        for (const [id, sourceConfig] of Object.entries(config.dataSources)) {
                            this.dataSources.set(id, sourceConfig);
                        }
                        
                        this.widgets.clear();
                        for (const [id, widgetConfig] of Object.entries(config.widgets)) {
                            this.widgets.set(id, widgetConfig);
                        }
                        
                        if (config.settings) {
                            this.config = { ...this.config, ...config.settings };
                        }
                        
                        // Uložit a znovu vykreslit
                        this.saveUserConfiguration();
                        this.renderDashboard();
                        
                        this.showToast('Konfigurace byla úspěšně importována', 'success');
                        
                    } catch (error) {
                        console.error('❌ Chyba při importu:', error);
                        this.showToast('Chyba při importu konfigurace: ' + error.message, 'error');
                    }
                };
                reader.readAsText(file);
            }
        });
        input.click();
    }

    /**
     * Zobrazení chybové zprávy
     */
    showError(message) {
        console.error('❌ ERROR:', message);
        this.showToast(message, 'error');
    }

    /**
     * Zobrazení toast notifikace
     */
    showToast(message, type = 'info', duration = 5000) {
        const container = document.querySelector('.toast-container');
        if (!container) return;
    showToast(message, type = 'info') {
        console.log(`📢 Toast: ${message} (${type})`);

        const toast = document.createElement('div');
        toast.className = `toast align-items-center text-bg-${type} border-0`;
        toast.setAttribute('role', 'alert');
        const toastContainer = document.querySelector('.toast-container');
        if (!toastContainer) return;

const toastId = 'toast_' + Date.now();
        const bgClass = {
            'success': 'bg-success',
            'error': 'bg-danger',
            'warning': 'bg-warning',
            'info': 'bg-info'
        }[type] || 'bg-info';
        
        const toast = document.createElement('div');
        toast.id = toastId;
        toast.className = `toast align-items-center text-white ${bgClass}`;
        toast.setAttribute('role', 'alert');
toast.innerHTML = `
           <div class="d-flex">
                <div class="toast-body">
                    <i class="fas ${this.getToastIcon(type)} me-2"></i>
                    ${message}
                </div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto" 
                        data-bs-dismiss="toast" aria-label="Close"></button>
                <div class="toast-body">${message}</div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
           </div>
       `;

        container.appendChild(toast);
        
        const bsToast = new bootstrap.Toast(toast, { delay: duration });
        toastContainer.appendChild(toast);
        const bsToast = new bootstrap.Toast(toast);
bsToast.show();

        // Vyčisti po skrytí
toast.addEventListener('hidden.bs.toast', () => {
            toast.remove();
            if (toastContainer.contains(toast)) {
                toastContainer.removeChild(toast);
            }
});
}

    /**
     * Získání ikony pro toast
     */
    getToastIcon(type) {
        const icons = {
            'success': 'fa-check-circle',
            'error': 'fa-exclamation-triangle',
            'warning': 'fa-exclamation-circle',
            'info': 'fa-info-circle'
        };
        return icons[type] || icons.info;
    }
    // ========================================
    // DEBUG METHODS
    // ========================================

    /**
     * Utility metody
     */
    generateId() {
        return 'id_' + Math.random().toString(36).substr(2, 9);
    }
    
    formatDate(date) {
        return new Intl.DateTimeFormat('cs-CZ', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }).format(date);
    }
    
    formatNumber(number, options = {}) {
        return new Intl.NumberFormat('cs-CZ', options).format(number);
    }
    
    formatCurrency(amount, currency = 'CZK') {
        return new Intl.NumberFormat('cs-CZ', {
            style: 'currency',
            currency: currency
        }).format(amount);
    getDebugInfo() {
        return {
            version: this.config.version,
            isInitialized: this.isInitialized,
            isLoading: this.isLoading,
            dataSourcesCount: this.dataSources.size,
            widgetsCount: this.widgets.size,
            layoutWidgets: this.layout.widgets.length,
            modules: {
                dataManager: !!this.dataManager,
                configManager: !!this.configManager,
                widgetFactory: !!this.widgetFactory,
                detailModal: !!this.detailModal
            }
        };
}
}

// Export pro použití v jiných modulech
// Export for module system
if (typeof module !== 'undefined' && module.exports) {
module.exports = DashboardCore;
}

console.log('📦 Dashboard Core modul načten');
console.log('📦 Dashboard Core modul načten - OPRAVENO');
