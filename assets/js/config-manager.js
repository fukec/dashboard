/**
 * Configuration Manager - Kompletní správa konfigurace
 * Verze: 3.0 - Modularní architektura - FUNKČNÍ
 * Autor: Dashboard System
 */

class ConfigManager {
    constructor(dashboardCore) {
        this.core = dashboardCore;
        this.activeModal = null;
        this.currentDataSource = null;
        this.currentWidget = null;
        
        // Globální přiřazení pro HTML onclick handlers
        window.configManager = this;
    }

    async init() {
        console.log('⚙️ Inicializace ConfigManager...');
        this.setupEventListeners();
        this.createRequiredModals();
    }

    /**
     * Vytvoření potřebných modálních oken
     */
    createRequiredModals() {
        // Vytvoř modal pro datové zdroje
        if (!document.getElementById('dataSourceModal')) {
            this.createDataSourceModal();
        }
        
        // Vytvoř modal pro widgety
        if (!document.getElementById('widgetModal')) {
            this.createWidgetModal();
        }
    }

    createDataSourceModal() {
        const modalHtml = `
            <div class="modal fade" id="dataSourceModal" tabindex="-1">
                <div class="modal-dialog modal-xl">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">
                                <i class="fas fa-database me-2"></i>Správa datových zdrojů
                            </h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <div class="row">
                                <div class="col-md-4">
                                    <div class="d-flex justify-content-between align-items-center mb-3">
                                        <h6 class="mb-0">Datové zdroje</h6>
                                        <button type="button" class="btn btn-primary btn-sm" id="addDataSourceBtn">
                                            <i class="fas fa-plus me-1"></i>Nový
                                        </button>
                                    </div>
                                    <div id="dataSourcesList" class="list-group">
                                        <!-- Dynamicky generováno -->
                                    </div>
                                </div>
                                <div class="col-md-8">
                                    <div id="dataSourceConfig">
                                        <div class="text-center py-5">
                                            <i class="fas fa-arrow-left fa-2x text-muted mb-3"></i>
                                            <p class="text-muted">Vyberte datový zdroj pro konfiguraci</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Zavřít</button>
                            <button type="button" class="btn btn-primary d-none" id="saveDataSourceBtn">Uložit zdroj</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHtml);
    }

    createWidgetModal() {
        const modalHtml = `
            <div class="modal fade" id="widgetModal" tabindex="-1">
                <div class="modal-dialog modal-xl">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">
                                <i class="fas fa-puzzle-piece me-2"></i>Správa widgetů
                            </h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <div class="row">
                                <div class="col-md-4">
                                    <div class="d-flex justify-content-between align-items-center mb-3">
                                        <h6 class="mb-0">Existující widgety</h6>
                                        <button type="button" class="btn btn-primary btn-sm" id="addWidgetBtn">
                                            <i class="fas fa-plus me-1"></i>Nový
                                        </button>
                                    </div>
                                    <div id="widgetsList" class="list-group mb-4">
                                        <!-- Dynamicky generováno -->
                                    </div>
                                    
                                    <h6 class="mb-3">Typy widgetů</h6>
                                    <div id="widgetTypes" class="row">
                                        <!-- Dynamicky generováno -->
                                    </div>
                                </div>
                                <div class="col-md-8">
                                    <div id="widgetConfig">
                                        <div class="text-center py-5">
                                            <i class="fas fa-puzzle-piece fa-2x text-muted mb-3"></i>
                                            <p class="text-muted">Vyberte typ widgetu nebo existující widget</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Zavřít</button>
                            <button type="button" class="btn btn-primary d-none" id="saveWidgetBtn">Uložit widget</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHtml);
    }

    setupEventListeners() {
        // Opožděné bindování pro jistotu
        setTimeout(() => {
            // Přidej event listenery pro modal tlačítka
            document.getElementById('addDataSourceBtn')?.addEventListener('click', () => {
                this.addNewDataSource();
            });

            document.getElementById('saveDataSourceBtn')?.addEventListener('click', () => {
                this.saveDataSourceConfig();
            });

            document.getElementById('addWidgetBtn')?.addEventListener('click', () => {
                this.showWidgetTypes();
            });

            document.getElementById('saveWidgetBtn')?.addEventListener('click', () => {
                this.saveWidgetConfig();
            });
        }, 100);
    }

    // ========================================
    // DATA SOURCES CONFIGURATION
    // ========================================

    openDataSourcesConfig() {
        console.log('🗂️ Otevírám konfiguraci datových zdrojů...');
        
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

        if (Object.keys(dataSources).length === 0) {
            container.innerHTML = `
                <div class="text-center py-4">
                    <i class="fas fa-database fa-2x text-muted mb-3"></i>
                    <p class="text-muted mb-0">Žádné datové zdroje</p>
                    <small class="text-muted">Klikněte na "Nový" pro přidání</small>
                </div>
            `;
            return;
        }

        Object.entries(dataSources).forEach(([id, config]) => {
            const item = document.createElement('div');
            item.className = 'list-group-item list-group-item-action d-flex justify-content-between align-items-center';
            item.innerHTML = `
                <div>
                    <h6 class="mb-1">${config.name || 'Unnamed Source'}</h6>
                    <small class="text-muted">
                        <i class="fas fa-plug me-1"></i>${config.type || 'unknown'}
                    </small>
                </div>
                <div class="btn-group btn-group-sm">
                    <button class="btn btn-outline-primary" onclick="window.configManager.editDataSource('${id}')" title="Upravit">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-outline-danger" onclick="window.configManager.deleteDataSource('${id}')" title="Smazat">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            `;
            container.appendChild(item);
        });
    }

    addNewDataSource() {
        this.currentDataSource = null;
        this.showDataSourceConfigForm();
    }

    editDataSource(sourceId) {
        console.log(`✏️ Editace datového zdroje: ${sourceId}`);
        const dataSources = this.core.getDataSources();
        this.currentDataSource = { id: sourceId, ...dataSources[sourceId] };
        this.showDataSourceConfigForm();
    }

    deleteDataSource(sourceId) {
        console.log(`🗑️ Mazání datového zdroje: ${sourceId}`);
        if (confirm('Opravdu chcete smazat tento datový zdroj?')) {
            this.core.removeDataSource(sourceId);
            this.refreshDataSourcesList();
            this.core.showToast('Datový zdroj byl smazán', 'success');
        }
    }

    showDataSourceConfigForm() {
        const configPanel = document.getElementById('dataSourceConfig');
        const saveBtn = document.getElementById('saveDataSourceBtn');
        
        if (!configPanel) return;

        const isEdit = this.currentDataSource !== null;
        const sourceConfig = this.currentDataSource || { type: 'google-sheets' };

        configPanel.innerHTML = `
            <form id="dataSourceForm">
                <div class="mb-3">
                    <label for="dsName" class="form-label">Název zdroje *</label>
                    <input type="text" class="form-control" id="dsName" value="${sourceConfig.name || ''}" required>
                </div>
                
                <div class="mb-3">
                    <label for="dsType" class="form-label">Typ zdroje *</label>
                    <select class="form-select" id="dsType" onchange="window.configManager.onDataSourceTypeChange()">
                        <option value="google-sheets" ${sourceConfig.type === 'google-sheets' ? 'selected' : ''}>Google Sheets</option>
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

        saveBtn.classList.remove('d-none');
    }

    renderDataSourceTypeConfig(type, config) {
        if (type === 'google-sheets') {
            return `
                <div class="mb-3">
                    <label for="ds_gasUrl" class="form-label">URL Google Apps Script *</label>
                    <input type="url" class="form-control" id="ds_gasUrl" 
                           value="${config.gasUrl || ''}" 
                           placeholder="https://script.google.com/macros/s/.../exec" required>
                    <div class="form-text">URL vašeho Google Apps Script deployment</div>
                </div>
                
                <div class="mb-3">
                    <label for="ds_sheetId" class="form-label">ID Google Sheets *</label>
                    <input type="text" class="form-control" id="ds_sheetId" 
                           value="${config.sheetId || ''}" 
                           placeholder="1XFkpSafhec8eQFYzQaHHq1P8UaadrBX5wQad48rHn0g" required>
                    <div class="form-text">ID tabulky z URL (mezi /d/ a /edit)</div>
                </div>
                
                <div class="mb-3">
                    <label for="ds_range" class="form-label">Rozsah dat</label>
                    <input type="text" class="form-control" id="ds_range" 
                           value="${config.range || 'A1:Z1000'}" 
                           placeholder="A1:Z1000">
                    <div class="form-text">Rozsah buněk k načtení (volitelné)</div>
                </div>
                
                <div class="mb-3">
                    <label for="ds_action" class="form-label">API akce</label>
                    <select class="form-select" id="ds_action">
                        <option value="dashboard" ${config.action === 'dashboard' ? 'selected' : ''}>Dashboard data</option>
                        <option value="charts" ${config.action === 'charts' ? 'selected' : ''}>Charts data</option>
                        <option value="tables" ${config.action === 'tables' ? 'selected' : ''}>Tables data</option>
                    </select>
                </div>
            `;
        }
        
        return '<div class="alert alert-info">Konfigurace pro tento typ zdroje bude implementována</div>';
    }

    onDataSourceTypeChange() {
        const type = document.getElementById('dsType').value;
        const configContainer = document.getElementById('dsTypeSpecificConfig');
        if (configContainer) {
            configContainer.innerHTML = this.renderDataSourceTypeConfig(type, {});
        }
    }

    async testDataSource() {
        const resultDiv = document.getElementById('testResult');
        if (!resultDiv) return;

        resultDiv.innerHTML = '<div class="text-center"><div class="spinner-border spinner-border-sm me-2"></div>Testování připojení...</div>';

        try {
            const sourceConfig = this.collectDataSourceFormData();
            
            if (!sourceConfig.name || !sourceConfig.type) {
                throw new Error('Vyplňte všechna povinná pole');
            }

            if (sourceConfig.type === 'google-sheets') {
                if (!sourceConfig.config.gasUrl || !sourceConfig.config.sheetId) {
                    throw new Error('Vyplňte URL a ID tabulky');
                }
            }

            // Vytvoř dočasné ID pro testování
            const tempId = 'test_' + Date.now();

            // Testuj připojení
            const data = await this.core.dataManager.loadDataSource(tempId, sourceConfig);
            
            if (!data) {
                throw new Error('Data nejsou dostupná');
            }

            // Zpracuj statistiky
            let stats = { count: 0, fields: [] };
            if (Array.isArray(data)) {
                stats.count = data.length;
                if (data.length > 0 && typeof data[0] === 'object') {
                    stats.fields = Object.keys(data[0]);
                }
            } else if (typeof data === 'object' && data !== null) {
                stats.count = 1;
                stats.fields = Object.keys(data);
            }

            resultDiv.innerHTML = `
                <div class="alert alert-success">
                    <i class="fas fa-check-circle me-2"></i>
                    <strong>Připojení úspěšné!</strong><br>
                    Načteno: ${stats.count} záznamů<br>
                    ${stats.fields.length ? `Pole: ${stats.fields.length} (${stats.fields.slice(0,3).join(', ')}${stats.fields.length > 3 ? '...' : ''})` : ''}
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
        
        if (type === 'google-sheets') {
            config.gasUrl = document.getElementById('ds_gasUrl')?.value || '';
            config.sheetId = document.getElementById('ds_sheetId')?.value || '';
            config.range = document.getElementById('ds_range')?.value || 'A1:Z1000';
            config.action = document.getElementById('ds_action')?.value || 'dashboard';
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

            const sourceId = this.currentDataSource?.id || 'ds_' + Math.random().toString(36).substr(2, 9);
            
            this.core.addDataSource(sourceId, sourceConfig);
            this.refreshDataSourcesList();
            this.core.showToast('Datový zdroj byl uložen', 'success');
            
            // Vymaž formulář
            this.resetDataSourceForm();
            
        } catch (error) {
            console.error('❌ Chyba při ukládání datového zdroje:', error);
            this.core.showToast('Chyba při ukládání: ' + error.message, 'error');
        }
    }

    resetDataSourceForm() {
        this.currentDataSource = null;
        const saveBtn = document.getElementById('saveDataSourceBtn');
        saveBtn.classList.add('d-none');
        
        document.getElementById('dataSourceConfig').innerHTML = `
            <div class="text-center py-5">
                <i class="fas fa-check-circle fa-2x text-success mb-3"></i>
                <p class="text-muted">Datový zdroj byl uložen</p>
            </div>
        `;
    }

    // ========================================
    // WIDGETS CONFIGURATION
    // ========================================

    openWidgetsConfig() {
        console.log('🧩 Otevírám konfiguraci widgetů...');
        
        const modal = new bootstrap.Modal(document.getElementById('widgetModal'));
        this.activeModal = modal;
        this.refreshWidgetsList();
        this.refreshWidgetTypes();
        modal.show();
    }

    refreshWidgetsList() {
        const container = document.getElementById('widgetsList');
        if (!container) return;

        const widgets = this.core.getWidgets();
        container.innerHTML = '';

        if (Object.keys(widgets).length === 0) {
            container.innerHTML = `
                <div class="text-center py-3">
                    <i class="fas fa-puzzle-piece fa-2x text-muted mb-2"></i>
                    <p class="text-muted mb-0">Žádné widgety</p>
                </div>
            `;
            return;
        }

        Object.entries(widgets).forEach(([id, config]) => {
            const item = document.createElement('div');
            item.className = 'list-group-item list-group-item-action d-flex justify-content-between align-items-center';
            item.innerHTML = `
                <div>
                    <h6 class="mb-1">${config.title || 'Unnamed Widget'}</h6>
                    <small class="text-muted">
                        <i class="fas fa-puzzle-piece me-1"></i>${config.type}
                    </small>
                </div>
                <div class="btn-group btn-group-sm">
                    <button class="btn btn-outline-primary" onclick="window.configManager.editWidget('${id}')" title="Upravit">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-outline-danger" onclick="window.configManager.deleteWidget('${id}')" title="Smazat">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            `;
            container.appendChild(item);
        });
    }

    refreshWidgetTypes() {
        const container = document.getElementById('widgetTypes');
        if (!container) return;

        const widgetTypes = this.core.widgetFactory.widgetTypes;
        container.innerHTML = '';

        widgetTypes.forEach((typeConfig, typeName) => {
            const card = document.createElement('div');
            card.className = 'col-6 mb-3';
            card.innerHTML = `
                <div class="card h-100 widget-type-card" onclick="window.configManager.createNewWidget('${typeName}')" style="cursor: pointer;">
                    <div class="card-body text-center">
                        <i class="${typeConfig.icon} fa-2x text-primary mb-2"></i>
                        <h6 class="card-title">${typeConfig.name}</h6>
                        <small class="text-muted">${typeConfig.description}</small>
                    </div>
                </div>
            `;
            container.appendChild(card);
        });
    }

    showWidgetTypes() {
        this.core.showToast('Vyberte typ widgetu ze seznamu vpravo', 'info');
    }

    createNewWidget(widgetType) {
        console.log(`➕ Vytváření nového widgetu typu: ${widgetType}`);
        
        this.currentWidget = {
            type: widgetType,
            title: '',
            dataSource: '',
            size: 6
        };
        
        this.showWidgetConfigForm();
    }

    editWidget(widgetId) {
        console.log(`✏️ Editace widgetu: ${widgetId}`);
        const widgets = this.core.getWidgets();
        this.currentWidget = { id: widgetId, ...widgets[widgetId] };
        this.showWidgetConfigForm();
    }

    deleteWidget(widgetId) {
        console.log(`🗑️ Mazání widgetu: ${widgetId}`);
        if (confirm('Opravdu chcete smazat tento widget?')) {
            this.core.removeWidget(widgetId);
            this.refreshWidgetsList();
            this.core.showToast('Widget byl smazán', 'success');
        }
    }

    showWidgetConfigForm() {
        const configPanel = document.getElementById('widgetConfig');
        const saveBtn = document.getElementById('saveWidgetBtn');
        
        if (!configPanel || !this.currentWidget) return;

        const widgetType = this.core.widgetFactory.widgetTypes.get(this.currentWidget.type);
        const dataSources = this.core.getDataSources();
        
        configPanel.innerHTML = `
            <form id="widgetForm">
                <div class="mb-3">
                    <label for="wTitle" class="form-label">Název widgetu *</label>
                    <input type="text" class="form-control" id="wTitle" value="${this.currentWidget.title || ''}" required>
                </div>
                
                <div class="mb-3">
                    <label for="wDataSource" class="form-label">Datový zdroj *</label>
                    <select class="form-select" id="wDataSource" required>
                        <option value="">-- Vyberte datový zdroj --</option>
                        ${Object.entries(dataSources).map(([id, config]) => 
                            `<option value="${id}" ${this.currentWidget.dataSource === id ? 'selected' : ''}>${config.name}</option>`
                        ).join('')}
                    </select>
                    ${Object.keys(dataSources).length === 0 ? 
                        '<small class="text-warning">⚠️ Nejprve vytvořte datový zdroj</small>' : ''
                    }
                </div>
                
                <div class="mb-3">
                    <label for="wSize" class="form-label">Velikost (Bootstrap cols)</label>
                    <select class="form-select" id="wSize">
                        <option value="3" ${this.currentWidget.size == 3 ? 'selected' : ''}>3 (malý)</option>
                        <option value="6" ${this.currentWidget.size == 6 ? 'selected' : ''}>6 (střední)</option>
                        <option value="9" ${this.currentWidget.size == 9 ? 'selected' : ''}>9 (velký)</option>
                        <option value="12" ${this.currentWidget.size == 12 ? 'selected' : ''}>12 (celá šířka)</option>
                    </select>
                </div>

                <div class="alert alert-info">
                    <strong>Typ widgetu:</strong> ${widgetType?.name || 'Neznámý'}
                    <br><small>${widgetType?.description || ''}</small>
                </div>
            </form>
        `;

        saveBtn.classList.remove('d-none');
    }

    saveWidgetConfig() {
        try {
            const widgetConfig = this.collectWidgetFormData();
            
            if (!widgetConfig.title || !widgetConfig.dataSource) {
                this.core.showToast('Vyplňte všechna povinná pole', 'warning');
                return;
            }

            const widgetId = this.currentWidget?.id || 'w_' + Math.random().toString(36).substr(2, 9);
            
            this.core.addWidget(widgetId, widgetConfig);
            this.refreshWidgetsList();
            this.core.showToast('Widget byl uložen', 'success');
            
            // Vymaž formulář
            this.resetWidgetForm();
            
        } catch (error) {
            console.error('❌ Chyba při ukládání widgetu:', error);
            this.core.showToast('Chyba při ukládání: ' + error.message, 'error');
        }
    }

    collectWidgetFormData() {
        return {
            title: document.getElementById('wTitle')?.value || '',
            type: this.currentWidget.type,
            dataSource: document.getElementById('wDataSource')?.value || '',
            size: parseInt(document.getElementById('wSize')?.value) || 6,
            created: new Date().toISOString()
        };
    }

    resetWidgetForm() {
        this.currentWidget = null;
        const saveBtn = document.getElementById('saveWidgetBtn');
        saveBtn.classList.add('d-none');
        
        document.getElementById('widgetConfig').innerHTML = `
            <div class="text-center py-5">
                <i class="fas fa-check-circle fa-2x text-success mb-3"></i>
                <p class="text-muted">Widget byl uložen</p>
            </div>
        `;
    }

    // ========================================
    // LAYOUT CONFIGURATION
    // ========================================

    openLayoutConfig() {
        console.log('📐 Layout konfigurace není implementována');
        this.core.showToast('Layout konfigurace bude implementována v budoucí verzi', 'info');
    }
}

// Export pro modul systém
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ConfigManager;
}

console.log('⚙️ Configuration Manager načten - FUNKČNÍ VERZE');
