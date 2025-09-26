/**
 * Dashboard Core - Hlavní orchestrace systému (v3.0 opraveno)
 * Verze: 3.0 - Modularní architektura
 * Autor: Dashboard System
 */

class DashboardCore {
    constructor() {
        this.config = {
            version: '3.0',
            debugMode: false
        };
        
        // Data storage
        this.dataSources = new Map();
        this.widgets = new Map();
        this.layout = { columns: 12, widgets: [] };
        
        // Module instances
        this.dataManager = null;
        this.configManager = null;
        this.widgetFactory = null;
        this.detailModal = null;
        
        // State
        this.isInitialized = false;
        this.isLoading = false;
    }

    async init() {
        console.log('🚀 Inicializace DashboardCore v3.0...');
        
        try {
            // Inicializace modulů v správném pořadí
            await this.initializeModules();
            
            // Nastavení event listenerů
            this.setupEventListeners();
            
            // Načtení konfigurace z localStorage
            this.loadConfiguration();
            
            // Skrytí preloaderu
            this.hidePreloader();
            
            // Označení jako inicializované
            this.isInitialized = true;
            
            console.log('✅ DashboardCore inicializován úspěšně');
            
        } catch (error) {
            console.error('❌ Chyba při inicializaci DashboardCore:', error);
            this.showToast('Chyba při inicializaci aplikace', 'error');
        }
    }

    async initializeModules() {
        console.log('📦 Inicializace modulů...');
        
        // Data Manager - prvotní inicializace
        this.dataManager = new DataManager(this);
        await this.dataManager.init();
        
        // Widget Factory
        this.widgetFactory = new WidgetFactory(this);
        await this.widgetFactory.init();
        
        // Configuration Manager
        this.configManager = new ConfigManager(this);
        await this.configManager.init();
        
        // Detail Modal
        this.detailModal = new DetailModal(this);
        await this.detailModal.init();
        
        // Globální přiřazení pro HTML onclick handlers
        window.configManager = this.configManager;
        
        console.log('✅ Všechny moduly inicializovány');
    }

    setupEventListeners() {
        console.log('🎯 Nastavení event listenerů...');
        
        // Load data button
        const loadDataBtn = document.getElementById('loadDataBtn');
        if (loadDataBtn) {
            loadDataBtn.addEventListener('click', () => {
                this.loadAllData();
            });
        }
        
        // Theme toggle
        const themeToggle = document.getElementById('themeToggle');
        if (themeToggle) {
            themeToggle.addEventListener('click', () => {
                this.toggleTheme();
            });
        }
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
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
        
        console.log('✅ Event listenery nastaveny');
    }

    // ========================================
    // DATA MANAGEMENT
    // ========================================

    async loadAllData(forceRefresh = false) {
        if (this.isLoading) {
            console.log('⏳ Načítání již probíhá...');
            return;
        }
        
        console.log('📊 Načítání všech dat...');
        
        this.isLoading = true;
        this.showLoadingOverlay();
        
        try {
            const results = new Map();
            const errors = [];
            
            // Načtení dat ze všech zdrojů
            for (const [sourceId, sourceConfig] of this.dataSources) {
                try {
                    console.log(`📡 Načítání ze zdroje: ${sourceId}`);
                    const data = await this.dataManager.loadDataSource(sourceId, sourceConfig);
                    results.set(sourceId, data);
                } catch (error) {
                    console.error(`❌ Chyba při načítání zdroje ${sourceId}:`, error);
                    errors.push({ sourceId, error: error.message });
                }
            }
            
            // Aktualizace widgetů s novými daty
            this.updateWidgetsWithData(results);
            
            // Aktualizace času
            this.updateLastUpdateTime();
            
            // Zobrazení úspěchu nebo chyb
            if (errors.length === 0) {
                this.showToast('Data úspěšně načtena', 'success');
            } else {
                this.showToast(`Načteno s ${errors.length} chybami`, 'warning');
            }
            
        } catch (error) {
            console.error('❌ Kritická chyba při načítání dat:', error);
            this.showToast('Kritická chyba při načítání dat', 'error');
        } finally {
            this.isLoading = false;
            this.hideLoadingOverlay();
        }
    }

    updateWidgetsWithData(dataResults) {
        console.log('🔄 Aktualizace widgetů s daty...');
        
        for (const [widgetId, widgetConfig] of this.widgets) {
            try {
                const sourceData = dataResults.get(widgetConfig.dataSourceId);
                if (sourceData) {
                    this.widgetFactory.updateWidget(widgetId, sourceData);
                }
            } catch (error) {
                console.error(`❌ Chyba při aktualizaci widgetu ${widgetId}:`, error);
            }
        }
    }

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
        
        // Odebrání závislých widgetů
        const dependentWidgets = Array.from(this.widgets.entries())
            .filter(([_, config]) => config.dataSourceId === sourceId);
            
        dependentWidgets.forEach(([widgetId]) => {
            this.removeWidget(widgetId);
        });
        
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
        
        // Vykreslení widgetu
        this.widgetFactory.renderWidget(widgetId, widgetConfig);
    }

    removeWidget(widgetId) {
        console.log(`🗑️ Odebrání widgetu: ${widgetId}`);
        this.widgets.delete(widgetId);
        
        // Odebrání z layoutu
        this.layout.widgets = this.layout.widgets.filter(w => w.id !== widgetId);
        
        // Odebrání z DOM
        const element = document.getElementById(`widget_${widgetId}`);
        if (element) {
            element.remove();
        }
        
        this.saveConfiguration();
    }

    getWidgets() {
        const widgets = {};
        this.widgets.forEach((config, id) => {
            widgets[id] = config;
        });
        return widgets;
    }

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

    // ========================================
    // UI HELPER METHODS
    // ========================================

    showLoadingOverlay() {
        const overlay = document.getElementById('loadingOverlay');
        if (overlay) {
            overlay.classList.remove('d-none');
        }
        
        const icon = document.getElementById('loadDataIcon');
        if (icon) {
            icon.classList.add('fa-spin');
        }
    }

    hideLoadingOverlay() {
        const overlay = document.getElementById('loadingOverlay');
        if (overlay) {
            overlay.classList.add('d-none');
        }
        
        const icon = document.getElementById('loadDataIcon');
        if (icon) {
            icon.classList.remove('fa-spin');
        }
    }

    hidePreloader() {
        const preloader = document.getElementById('preloader');
        if (preloader) {
            setTimeout(() => {
                preloader.style.opacity = '0';
                setTimeout(() => {
                    preloader.style.display = 'none';
                }, 300);
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

    toggleTheme() {
        document.body.classList.toggle('dark-theme');
        const isDark = document.body.classList.contains('dark-theme');
        
        const themeIcon = document.querySelector('#themeToggle i');
        if (themeIcon) {
            themeIcon.className = isDark ? 'fas fa-sun' : 'fas fa-moon';
        }
        
        localStorage.setItem('dashboardTheme', isDark ? 'dark' : 'light');
        console.log(`🎨 Téma změněno na: ${isDark ? 'tmavé' : 'světlé'}`);
    }

    showToast(message, type = 'info') {
        console.log(`📢 Toast: ${message} (${type})`);
        
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
                <div class="toast-body">${message}</div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
            </div>
        `;
        
        toastContainer.appendChild(toast);
        const bsToast = new bootstrap.Toast(toast);
        bsToast.show();
        
        toast.addEventListener('hidden.bs.toast', () => {
            if (toastContainer.contains(toast)) {
                toastContainer.removeChild(toast);
            }
        });
    }

    // ========================================
    // DEBUG METHODS
    // ========================================

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

// Export for module system
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DashboardCore;
}

console.log('📦 Dashboard Core modul načten - OPRAVENO');
