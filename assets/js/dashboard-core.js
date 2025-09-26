/**
 * Dashboard Core - Hlavní jádro modularní aplikace
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
            debugMode: false
        };

        // Moduly
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
    }

    /**
     * Inicializace aplikace
     */
    async init() {
        console.log(`🚀 Inicializace Dashboard Core v${this.version}`);
        
        try {
            // Načti konfiguraci
            await this.loadConfiguration();
            
            // Inicializace modulů
            await this.initializeModules();
            
            // Nastavení UI event listenerů
            this.setupEventListeners();
            
            // Načti uložené widgety a datové zdroje
            await this.loadUserConfiguration();
            
            // Skryj preloader
            this.hidePreloader();
            
            // Vykresli dashboard
            await this.renderDashboard();
            
            this.initialized = true;
            console.log('✅ Dashboard úspěšně inicializován');
            
            // Zobraz uvítací zprávu pokud je dashboard prázdný
            this.checkEmptyDashboard();
            
        } catch (error) {
            console.error('❌ Chyba při inicializaci:', error);
            this.showError('Chyba při inicializaci aplikace: ' + error.message);
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
        
        // ConfigManager
        if (typeof ConfigManager !== 'undefined') {
            this.configManager = new ConfigManager(this);
            await this.configManager.init();
            console.log('✅ ConfigManager inicializován');
        }
        
        // WidgetFactory
        if (typeof WidgetFactory !== 'undefined') {
            this.widgetFactory = new WidgetFactory(this);
            await this.widgetFactory.init();
            console.log('✅ WidgetFactory inicializován');
        }
        
        // DetailModal
        if (typeof DetailModal !== 'undefined') {
            this.detailModal = new DetailModal(this);
            await this.detailModal.init();
            console.log('✅ DetailModal inicializován');
        }
        
        // Registrace globálních referencí
        window.DashboardCore = this;
        window.DataManager = this.dataManager;
        window.ConfigManager = this.configManager;
        window.WidgetFactory = this.widgetFactory;
        window.DetailModal = this.detailModal;
    }

    /**
     * Nastavení event listenerů
     */
    setupEventListeners() {
        console.log('🎯 Nastavuji event listeners...');
        
        // Načítání dat
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
            });
        }
        
        // Přepínání témat
        const themeToggle = document.getElementById('themeToggle');
        if (themeToggle) {
            themeToggle.addEventListener('click', () => this.toggleTheme());
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

    /**
     * Načtení všech dat
     */
    async loadAllData() {
        if (this.loadingState) {
            console.log('⏳ Načítání již probíhá...');
            return;
        }
        
        this.loadingState = true;
        console.log('📊 Načítám všechna data...');
        
        try {
            this.showLoadingOverlay(true);
            this.updateLoadingStatus('Připojuji se k datovým zdrojům...', 0);
            
            // Načti data ze všech nakonfigurovaných zdrojů
            const dataPromises = [];
            let progress = 0;
            const progressStep = 100 / Math.max(this.dataSources.size, 1);
            
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
                }
            }
            
            // Aktualizuj widgety
            this.updateLoadingStatus('Aktualizuji widgety...', 90);
            await this.updateAllWidgets();
            
            // Dokončení
            this.updateLoadingStatus('Dokončeno!', 100);
            this.lastUpdate = new Date();
            this.updateLastUpdateTime();
            
            // Skryj loading overlay
            setTimeout(() => {
                this.showLoadingOverlay(false);
            }, 1000);
            
            // Zobraz notifikaci
            if (this.config.enableNotifications) {
                this.showToast('Data byla úspěšně načtena', 'success');
            }
            
            console.log('✅ Všechna data byla načtena');
            
        } catch (error) {
            console.error('❌ Chyba při načítání dat:', error);
            this.showError('Nepodařilo se načíst data: ' + error.message);
            this.showLoadingOverlay(false);
        } finally {
            this.loadingState = false;
        }
    }

    /**
     * Aktualizace všech widgetů
     */
    async updateAllWidgets() {
        console.log('🔄 Aktualizuji všechny widgety...');
        
        for (const [widgetId, widgetConfig] of this.widgets) {
            if (widgetConfig.enabled !== false) {
                try {
                    await this.widgetFactory.updateWidget(widgetId);
                } catch (error) {
                    console.error(`❌ Chyba při aktualizaci widgetu ${widgetId}:`, error);
                }
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
        
        // Vyčisti grid
        grid.innerHTML = '';
        
        // Pokud nejsou widgety, zobraz prázdný stav
        if (this.widgets.size === 0) {
            this.showEmptyDashboard();
            return;
        }
        
        // Seřaď widgety podle pozice
        const sortedWidgets = Array.from(this.widgets.entries())
            .filter(([id, config]) => config.enabled !== false)
            .sort(([,a], [,b]) => (a.position || 0) - (b.position || 0));
        
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
        }
        
        console.log(`✅ Dashboard vykreslen (${sortedWidgets.length} widgetů)`);
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
    }

    /**
     * Zobrazení prázdného stavu
     */
    showEmptyDashboard() {
        const emptyDiv = document.getElementById('emptyDashboard');
        if (emptyDiv) {
            emptyDiv.style.display = 'block';
        }
    }

    /**
     * Skrytí prázdného stavu
     */
    hideEmptyDashboard() {
        const emptyDiv = document.getElementById('emptyDashboard');
        if (emptyDiv) {
            emptyDiv.style.display = 'none';
        }
    }

    /**
     * Zobrazení/skrytí loading overlay
     */
    showLoadingOverlay(show) {
        const overlay = document.getElementById('loadingOverlay');
        if (overlay) {
            overlay.classList.toggle('d-none', !show);
        }
        
        const loadBtn = document.getElementById('loadDataBtn');
        const loadIcon = document.getElementById('loadDataIcon');
        if (loadBtn && loadIcon) {
            loadBtn.disabled = show;
            loadIcon.classList.toggle('fa-spin', show);
        }
    }

    /**
     * Aktualizace loading stavu
     */
    updateLoadingStatus(message, progress = 0) {
        const statusEl = document.getElementById('loadingStatus');
        if (statusEl) {
            statusEl.textContent = message;
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
        }
    }

    /**
     * Skrytí preloaderu
     */
    hidePreloader() {
        const preloader = document.getElementById('preloader');
        if (preloader) {
            setTimeout(() => {
                preloader.style.opacity = '0';
                setTimeout(() => {
                    preloader.style.display = 'none';
                }, 300);
            }, 500);
        }
    }

    /**
     * Přepínání témat
     */
    toggleTheme() {
        document.body.classList.toggle('dark-theme');
        const isDark = document.body.classList.contains('dark-theme');
        
        const themeIcon = document.querySelector('#themeToggle i');
        if (themeIcon) {
            themeIcon.className = isDark ? 'fas fa-sun' : 'fas fa-moon';
        }
        
        localStorage.setItem('dashboardTheme', isDark ? 'dark' : 'light');
        console.log('🎨 Téma změněno na:', isDark ? 'dark' : 'light');
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
        
        const toast = document.createElement('div');
        toast.className = `toast align-items-center text-bg-${type} border-0`;
        toast.setAttribute('role', 'alert');
        
        const toastId = 'toast_' + Date.now();
        toast.innerHTML = `
            <div class="d-flex">
                <div class="toast-body">
                    <i class="fas ${this.getToastIcon(type)} me-2"></i>
                    ${message}
                </div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto" 
                        data-bs-dismiss="toast" aria-label="Close"></button>
            </div>
        `;
        
        container.appendChild(toast);
        
        const bsToast = new bootstrap.Toast(toast, { delay: duration });
        bsToast.show();
        
        // Vyčisti po skrytí
        toast.addEventListener('hidden.bs.toast', () => {
            toast.remove();
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
    }
}

// Export pro použití v jiných modulech
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DashboardCore;
}

console.log('📦 Dashboard Core modul načten');
