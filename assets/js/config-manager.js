/**
 * Configuration Manager - Správa konfigurace widgetů a datových zdrojů
 * Verze: 3.0 - Modularní architektura - OPRAVENO
 * Autor: Dashboard System
 */

class ConfigManager {
    constructor(dashboardCore) {
        this.core = dashboardCore;
        this.activeModal = null;
        this.currentDataSource = null;
        this.currentWidget = null;
    }

    async init() {
        console.log('⚙️ Inicializace ConfigManager...');
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Data sources modal
        document.getElementById('configDataSources')?.addEventListener('click', () => {
            this.openDataSourcesConfig();
        });

        // Widgets modal  
        document.getElementById('configWidgets')?.addEventListener('click', () => {
            this.openWidgetsConfig();
        });

        // Layout modal
        document.getElementById('configLayout')?.addEventListener('click', () => {
            this.openLayoutConfig();
        });

        // Export/Import
        document.getElementById('exportConfig')?.addEventListener('click', () => {
            this.exportConfiguration();
        });

        document.getElementById('importConfig')?.addEventListener('click', () => {
            this.importConfiguration();
        });

        // Save buttons
        document.getElementById('saveDataSourceBtn')?.addEventListener('click', () => {
            this.saveDataSourceConfig();
        });

        document.getElementById('saveWidgetBtn')?.addEventListener('click', () => {
            this.saveWidgetConfig();
        });

        // Add buttons
        document.getElementById('addDataSourceBtn')?.addEventListener('click', () => {
            this.addNewDataSource();
        });
    }

    // ========================================
    // DATA SOURCES CONFIGURATION
    // ========================================

    openDataSourcesConfig() {
        const modal = new bootstrap.Modal(document.getElementById('dataSourceModal'));
        this.activeModal = modal;
        this.refreshDataSourcesList();
        modal.show();
    }

    refreshDataSourcesList() {
        const container = document.getElementById('dataSourcesList');
        if (!container) return;

        const dataSources = this.core.getDataSources();
        
        container.innerHTML = '';
        
        Object.entries(dataSources).forEach(([id, config]) => {
            const item = document.createElement('div');
            item.className = 'list-group-item list-group-item-action d-flex justify-content-between align-items-center';
            item.innerHTML = `
                <div>
                    <h6 class="mb-1">${config.name || 'Unnamed Source'}</h6>
                    <small class="text-muted">${config.type}</small>
                </div>
                <div class="btn-group btn-group-sm">
                    <button class="btn btn-outline-primary" onclick="window.configManager.editDataSource('${id}')">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-outline-danger" onclick="window.configManager.deleteDataSource('${id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            `;
            container.appendChild(item);
        });

        if (Object.keys(dataSources).length === 0) {
            container.innerHTML = '<div class="text-center text-muted py-3">Žádné datové zdroje nejsou nakonfigurovány</div>';
        }
    }

    addNewDataSource() {
        this.currentDataSource = null;
        this.showDataSourceConfigForm();
    }

    editDataSource(sourceId) {
        const dataSources = this.core.getDataSources();
        this.currentDataSource = { id: sourceId, ...dataSources[sourceId] };
        this.showDataSourceConfigForm();
    }

    deleteDataSource(sourceId) {
        if (confirm('Opravdu chcete smazat tento datový zdroj?')) {
            this.core.removeDataSource(sourceId);
            this.refreshDataSourcesList();
            this.core.showToast('Datový zdroj byl smazán', 'success');
        }
    }

    showDataSourceConfigForm() {
        const configPanel = document.getElementById('dataSourceConfig');
        if (!configPanel) return;

        const isEdit = this.currentDataSource !== null;
        const sourceConfig = this.currentDataSource || { type: 'google-sheets' };

        configPanel.innerHTML = `
            <form id="dataSourceForm" class="needs-validation" novalidate>
                <div class="mb-3">
                    <label for="dsName" class="form-label">Název zdroje *</label>
                    <input type="text" class="form-control" id="dsName" value="${sourceConfig.name || ''}" required>
                </div>
                
                <div class="mb-3">
                    <label for="dsType" class="form-label">Typ zdroje *</label>
                    <select class="form-select" id="dsType" onchange="window.configManager.onDataSourceTypeChange()">
                        <option value="google-sheets" ${sourceConfig.type === 'google-sheets' ? 'selected' : ''}>Google Sheets</option>
                        <option value="json-api" ${sourceConfig.type === 'json-api' ? 'selected' : ''}>JSON API</option>
                        <option value="csv-file" ${sourceConfig.type === 'csv-file' ? 'selected' : ''}>CSV soubor</option>
                    </select>
                </div>
                
                <div id="dsTypeSpecificConfig">
                    ${this.renderDataSourceTypeConfig(sourceConfig.type, sourceConfig.config || {})}
                </div>
                
                <div class="mt-4">
                    <button type="button" class="btn btn-outline-info me-2" onclick="window.configManager.testDataSource()">
                        <i class="fas fa-flask me-1"></i>Otestovat připojení
                    </button>
                </div>
                
                <div id="testResult" class="mt-3"></div>
            </form>
        `;
    }

    renderDataSourceTypeConfig(type, config) {
        const supportedTypes = this.core.dataManager.supportedTypes;
        const typeConfig = supportedTypes[type];
        
        if (!typeConfig) return '<div class="alert alert-warning">Nepodporovaný typ zdroje</div>';

        let html = '';
        
        typeConfig.configFields.forEach(field => {
            const value = config[field.key] || field.defaultValue || '';
            const required = field.required ? 'required' : '';
            const placeholder = field.placeholder || '';
            
            switch (field.type) {
                case 'text':
                case 'url':
                    html += `
                        <div class="mb-3">
                            <label for="ds_${field.key}" class="form-label">
                                ${field.label} ${field.required ? '*' : ''}
                            </label>
                            <input type="${field.type}" class="form-control" id="ds_${field.key}" 
                                   value="${value}" placeholder="${placeholder}" ${required}>
                        </div>
                    `;
                    break;
                    
                case 'select':
                    html += `
                        <div class="mb-3">
                            <label for="ds_${field.key}" class="form-label">
                                ${field.label} ${field.required ? '*' : ''}
                            </label>
                            <select class="form-select" id="ds_${field.key}" ${required}>
                                <option value="">-- Vyberte --</option>
                                ${field.options.map(opt => 
                                    `<option value="${opt.value}" ${value === opt.value ? 'selected' : ''}>${opt.label}</option>`
                                ).join('')}
                            </select>
                        </div>
                    `;
                    break;
                    
                case 'textarea':
                    html += `
                        <div class="mb-3">
                            <label for="ds_${field.key}" class="form-label">
                                ${field.label} ${field.required ? '*' : ''}
                            </label>
                            <textarea class="form-control" id="ds_${field.key}" rows="3" 
                                      placeholder="${placeholder}" ${required}>${value}</textarea>
                        </div>
                    `;
                    break;
                    
                case 'file':
                    html += `
                        <div class="mb-3">
                            <label for="ds_${field.key}" class="form-label">
                                ${field.label} ${field.required ? '*' : ''}
                            </label>
                            <input type="file" class="form-control" id="ds_${field.key}" 
                                   accept="${field.accept || ''}" ${required}>
                        </div>
                    `;
                    break;
                    
                case 'checkbox':
                    html += `
                        <div class="mb-3 form-check">
                            <input type="checkbox" class="form-check-input" id="ds_${field.key}" 
                                   ${value || field.defaultValue ? 'checked' : ''}>
                            <label class="form-check-label" for="ds_${field.key}">
                                ${field.label}
                            </label>
                        </div>
                    `;
                    break;
            }
        });
        
        return html;
    }

    onDataSourceTypeChange() {
        const type = document.getElementById('dsType').value;
        const configContainer = document.getElementById('dsTypeSpecificConfig');
        if (configContainer) {
            configContainer.innerHTML = this.renderDataSourceTypeConfig(type, {});
        }
    }

    // OPRAVENÁ FUNKCE - řeší "Cannot read properties of undefined (reading 'count')"
    async testDataSource() {
        const resultDiv = document.getElementById('testResult');
        if (!resultDiv) return;

        resultDiv.innerHTML = '<div class="text-center"><div class="spinner-border spinner-border-sm me-2"></div>Testování připojení...</div>';

        try {
            const sourceConfig = this.collectDataSourceFormData();
            
            if (!sourceConfig.name || !sourceConfig.type) {
                throw new Error('Vyplňte všechna povinná pole');
            }

            // Vytvoř dočasné ID pro testování
            const tempId = 'test_' + Date.now();

            // OPRAVA: Ověř, že data jsou validní před voláním getDataStats
            const data = await this.core.dataManager.loadDataSource(tempId, sourceConfig);
            
            // OPRAVA: Kontrola dat před zpracováním statistik
            if (!data) {
                throw new Error('Data nejsou dostupná');
            }

            // OPRAVA: Bezpečné volání getDataStats
            let stats;
            if (Array.isArray(data)) {
                stats = this.core.dataManager.getDataStats ? this.core.dataManager.getDataStats(data) : { count: data.length, fields: [] };
            } else if (typeof data === 'object' && data !== null) {
                stats = { count: 1, fields: Object.keys(data) };
            } else {
                stats = { count: 0, fields: [] };
            }

            resultDiv.innerHTML = `
                <div class="alert alert-success">
                    <i class="fas fa-check-circle me-2"></i>
                    <strong>Připojení úspěšné!</strong><br>
                    Načteno: ${stats.count} záznamů<br>
                    ${stats.fields && stats.fields.length ? `Pole: ${stats.fields.length}` : ''}
                </div>
            `;

        } catch (error) {
            console.error('❌ Chyba při testování datového zdroje:', error);
            resultDiv.innerHTML = `
                <div class="alert alert-danger">
                    <i class="fas fa-exclamation-triangle me-2"></i>
                    <strong>Chyba při testování!</strong><br>
                    Detaily: ${error.message}
                </div>
            `;
        }
    }

    collectDataSourceFormData() {
        const name = document.getElementById('dsName')?.value || '';
        const type = document.getElementById('dsType')?.value || '';
        
        const config = {};
        const supportedTypes = this.core.dataManager.supportedTypes;
        const typeConfig = supportedTypes[type];
        
        if (typeConfig) {
            typeConfig.configFields.forEach(field => {
                const element = document.getElementById(`ds_${field.key}`);
                if (element) {
                    switch (field.type) {
                        case 'checkbox':
                            config[field.key] = element.checked;
                            break;
                        case 'file':
                            // Pro soubory by bylo potřeba přidat file reading logiku
                            if (element.files && element.files[0]) {
                                // TODO: Implementovat čtení souborů
                                config[field.key] = element.files[0].name;
                            }
                            break;
                        default:
                            config[field.key] = element.value;
                    }
                }
            });
        }
        
        return { name, type, config };
    }

    saveDataSourceConfig() {
        try {
            const sourceConfig = this.collectDataSourceFormData();
            
            if (!sourceConfig.name || !sourceConfig.type) {
                this.core.showToast('Vyplňte všechna povinná pole', 'warning');
                return;
            }

            const sourceId = this.currentDataSource?.id || 'id_' + Math.random().toString(36).substr(2, 9);
            
            this.core.addDataSource(sourceId, sourceConfig);
            this.refreshDataSourcesList();
            this.core.showToast('Datový zdroj byl uložen', 'success');
            
            // Vymaž formulář
            this.currentDataSource = null;
            document.getElementById('dataSourceConfig').innerHTML = `
                <div class="text-center py-4">
                    <i class="fas fa-arrow-left me-2"></i>
                    <span class="text-muted">Vyberte zdroj dat pro konfiguraci</span>
                </div>
            `;
            
        } catch (error) {
            console.error('❌ Chyba při ukládání datového zdroje:', error);
            this.core.showToast('Chyba při ukládání: ' + error.message, 'error');
        }
    }

    // ========================================
    // WIDGETS CONFIGURATION  
    // ========================================

    openWidgetsConfig() {
        const modal = new bootstrap.Modal(document.getElementById('widgetModal'));
        this.activeModal = modal;
        this.refreshWidgetsList();
        modal.show();
    }

    refreshWidgetsList() {
        // Implementace seznamu widgetů
        console.log('🧩 Refreshing widgets list...');
    }

    // ========================================
    // LAYOUT CONFIGURATION
    // ========================================

    openLayoutConfig() {
        console.log('📐 Opening layout configuration...');
        // Implementace layoutu
    }

    // ========================================
    // EXPORT/IMPORT
    // ========================================

    exportConfiguration() {
        try {
            const config = {
                dataSources: this.core.getDataSources(),
                widgets: this.core.getWidgets(),
                layout: this.core.getLayout(),
                version: '3.0',
                exportDate: new Date().toISOString()
            };

            const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = url;
            a.download = `dashboard-config-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            this.core.showToast('Konfigurace byla exportována', 'success');

        } catch (error) {
            console.error('❌ Chyba při exportu:', error);
            this.core.showToast('Chyba při exportu: ' + error.message, 'error');
        }
    }

    importConfiguration() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const config = JSON.parse(e.target.result);
                    
                    if (config.version && config.dataSources) {
                        // Import dat sources
                        Object.entries(config.dataSources).forEach(([id, sourceConfig]) => {
                            this.core.addDataSource(id, sourceConfig);
                        });
                        
                        // Import widgets
                        if (config.widgets) {
                            Object.entries(config.widgets).forEach(([id, widgetConfig]) => {
                                this.core.addWidget(id, widgetConfig);
                            });
                        }

                        this.core.showToast('Konfigurace byla importována', 'success');
                        this.refreshDataSourcesList();
                        
                    } else {
                        throw new Error('Neplatný formát konfiguračního souboru');
                    }

                } catch (error) {
                    console.error('❌ Chyba při importu:', error);
                    this.core.showToast('Chyba při importu: ' + error.message, 'error');
                }
            };
            
            reader.readAsText(file);
        };
        
        input.click();
    }

    // ========================================
    // HELPER METHODS
    // ========================================

    saveWidgetConfig() {
        console.log('💾 Saving widget config...');
        // Implementace ukládání widgetů
    }

    closeActiveModal() {
        if (this.activeModal) {
            this.activeModal.hide();
            this.activeModal = null;
        }
    }
}

// Export for module system
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ConfigManager;
}

// Global assignment for HTML onclick handlers
window.configManager = null;

console.log('⚙️ Configuration Manager modul načten - OPRAVENO');
