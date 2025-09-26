/**
 * Configuration Manager - Správa konfigurace dashboard a widgetů
 * Verze: 3.0 - Modularní architektura
 * Autor: Dashboard System
 */

class ConfigManager {
    constructor(dashboardCore) {
        this.core = dashboardCore;
        this.currentDataSource = null;
        this.currentWidget = null;
        this.modals = {};
    }

    async init() {
        console.log('⚙️ Inicializace ConfigManager...');
        this.setupModals();
    }

    /**
     * Nastavení modal dialogů
     */
    setupModals() {
        this.modals.dataSource = document.getElementById('dataSourceModal');
        this.modals.widget = document.getElementById('widgetModal');
        
        if (this.modals.dataSource) {
            this.setupDataSourceModal();
        }
        
        if (this.modals.widget) {
            this.setupWidgetModal();
        }
    }

    /**
     * Nastavení modal dialogu pro datové zdroje
     */
    setupDataSourceModal() {
        // Tlačítko pro přidání nového zdroje
        const addBtn = document.getElementById('addDataSourceBtn');
        if (addBtn) {
            addBtn.addEventListener('click', () => this.addNewDataSource());
        }
        
        // Tlačítko pro uložení
        const saveBtn = document.getElementById('saveDataSourceBtn');
        if (saveBtn) {
            saveBtn.addEventListener('click', () => this.saveDataSource());
        }
    }

    /**
     * Nastavení modal dialogu pro widgety
     */
    setupWidgetModal() {
        // Tlačítko pro uložení widgetu
        const saveBtn = document.getElementById('saveWidgetBtn');
        if (saveBtn) {
            saveBtn.addEventListener('click', () => this.saveWidget());
        }
    }

    /**
     * Otevření konfigurace datových zdrojů
     */
    openDataSourcesConfig() {
        console.log('📊 Otevírám konfiguraci datových zdrojů...');
        
        this.renderDataSourcesList();
        
        const modal = new bootstrap.Modal(this.modals.dataSource);
        modal.show();
    }

    /**
     * Vykreslení seznamu datových zdrojů
     */
    renderDataSourcesList() {
        const container = document.getElementById('dataSourcesList');
        if (!container) return;
        
        container.innerHTML = '';
        
        // Přidej existující zdroje
        for (const [sourceId, sourceConfig] of this.core.dataSources) {
            const item = this.createDataSourceListItem(sourceId, sourceConfig);
            container.appendChild(item);
        }
        
        // Pokud nejsou žádné zdroje, zobraz nápovědu
        if (this.core.dataSources.size === 0) {
            container.innerHTML = `
                <div class="text-center py-4 text-muted">
                    <i class="fas fa-database fa-2x mb-3"></i>
                    <p>Žádné datové zdroje nejsou nakonfigurovány</p>
                    <small>Klikněte na "Přidat zdroj" pro začátek</small>
                </div>
            `;
        }
    }

    /**
     * Vytvoření položky v seznamu datových zdrojů
     */
    createDataSourceListItem(sourceId, sourceConfig) {
        const item = document.createElement('div');
        item.className = 'list-group-item list-group-item-action d-flex justify-content-between align-items-center';
        item.dataset.sourceId = sourceId;
        
        const typeInfo = this.core.dataManager.supportedTypes[sourceConfig.type];
        
        item.innerHTML = `
            <div>
                <div class="d-flex align-items-center">
                    <i class="${typeInfo?.icon || 'fas fa-database'} me-2"></i>
                    <div>
                        <div class="fw-semibold">${sourceConfig.name || sourceId}</div>
                        <small class="text-muted">${typeInfo?.name || sourceConfig.type}</small>
                    </div>
                </div>
            </div>
            <div>
                <div class="btn-group btn-group-sm">
                    <button class="btn btn-outline-primary" title="Upravit" onclick="ConfigManager.editDataSource('${sourceId}')">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-outline-danger" title="Odstranit" onclick="ConfigManager.deleteDataSource('${sourceId}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `;
        
        item.addEventListener('click', (e) => {
            if (!e.target.closest('button')) {
                this.selectDataSource(sourceId);
            }
        });
        
        return item;
    }

    /**
     * Přidání nového datového zdroje
     */
    addNewDataSource() {
        const sourceId = this.core.generateId();
        const newSource = {
            name: 'Nový zdroj dat',
            type: 'google-sheets',
            config: {}
        };
        
        this.core.dataSources.set(sourceId, newSource);
        this.renderDataSourcesList();
        this.selectDataSource(sourceId);
        this.editDataSource(sourceId);
    }

    /**
     * Výběr datového zdroje
     */
    selectDataSource(sourceId) {
        // Odznač všechny položky
        document.querySelectorAll('#dataSourcesList .list-group-item').forEach(item => {
            item.classList.remove('active');
        });
        
        // Označ vybranou položku
        const selectedItem = document.querySelector(`[data-source-id="${sourceId}"]`);
        if (selectedItem) {
            selectedItem.classList.add('active');
        }
        
        this.currentDataSource = sourceId;
        this.renderDataSourceConfig(sourceId);
    }

    /**
     * Vykreslení konfigurace datového zdroje
     */
    renderDataSourceConfig(sourceId) {
        const container = document.getElementById('dataSourceConfig');
        if (!container) return;
        
        const sourceConfig = this.core.dataSources.get(sourceId);
        if (!sourceConfig) return;
        
        const typeInfo = this.core.dataManager.supportedTypes[sourceConfig.type];
        
        let html = `
            <div class="mb-3">
                <h6><i class="${typeInfo?.icon || 'fas fa-database'} me-2"></i>${sourceConfig.name || sourceId}</h6>
                <small class="text-muted">${typeInfo?.description || ''}</small>
            </div>
            
            <form id="dataSourceForm">
                <div class="row">
                    <div class="col-md-6">
                        <div class="mb-3">
                            <label class="form-label">Název zdroje</label>
                            <input type="text" class="form-control" name="name" value="${sourceConfig.name || ''}" required>
                        </div>
                    </div>
                    <div class="col-md-6">
                        <div class="mb-3">
                            <label class="form-label">Typ zdroje</label>
                            <select class="form-select" name="type" onchange="ConfigManager.onDataSourceTypeChange()">
        `;
        
        // Přidej možnosti typů
        for (const [typeKey, typeData] of Object.entries(this.core.dataManager.supportedTypes)) {
            const selected = sourceConfig.type === typeKey ? 'selected' : '';
            html += `<option value="${typeKey}" ${selected}>${typeData.name}</option>`;
        }
        
        html += `
                            </select>
                        </div>
                    </div>
                </div>
                
                <div id="typeSpecificFields">
        `;
        
        // Přidej specifická pole pro typ
        if (typeInfo && typeInfo.configFields) {
            for (const field of typeInfo.configFields) {
                html += this.renderConfigField(field, sourceConfig.config[field.key] || field.defaultValue || '');
            }
        }
        
        html += `
                </div>
                
                <div class="mt-4">
                    <button type="button" class="btn btn-outline-primary" onclick="ConfigManager.testDataSource('${sourceId}')">
                        <i class="fas fa-play me-2"></i>Otestovat připojení
                    </button>
                </div>
            </form>
            
            <div id="testResults" class="mt-3" style="display: none;"></div>
        `;
        
        container.innerHTML = html;
    }

    /**
     * Vykreslení konfiguračního pole
     */
    renderConfigField(field, value) {
        let html = `<div class="mb-3">
            <label class="form-label">${field.label}`;
        
        if (field.required) {
            html += ` <span class="text-danger">*</span>`;
        }
        
        html += `</label>`;
        
        switch (field.type) {
            case 'text':
            case 'url':
                html += `<input type="${field.type}" class="form-control" name="${field.key}" 
                        value="${value}" placeholder="${field.placeholder || ''}" 
                        ${field.required ? 'required' : ''}>`;
                break;
                
            case 'textarea':
                html += `<textarea class="form-control" name="${field.key}" rows="3" 
                        placeholder="${field.placeholder || ''}" 
                        ${field.required ? 'required' : ''}>${value}</textarea>`;
                break;
                
            case 'select':
                html += `<select class="form-select" name="${field.key}" ${field.required ? 'required' : ''}>`;
                if (!field.required) {
                    html += `<option value="">-- Vyberte --</option>`;
                }
                for (const option of field.options || []) {
                    const selected = value === option.value ? 'selected' : '';
                    html += `<option value="${option.value}" ${selected}>${option.label}</option>`;
                }
                html += `</select>`;
                break;
                
            case 'number':
                html += `<input type="number" class="form-control" name="${field.key}" 
                        value="${value}" ${field.min ? `min="${field.min}"` : ''} 
                        ${field.max ? `max="${field.max}"` : ''} ${field.required ? 'required' : ''}>`;
                break;
                
            case 'checkbox':
                const checked = value === true || value === 'true' ? 'checked' : '';
                html += `<div class="form-check">
                    <input type="checkbox" class="form-check-input" name="${field.key}" ${checked}>
                    <label class="form-check-label">${field.label}</label>
                </div>`;
                break;
                
            case 'file':
                html += `<input type="file" class="form-control" name="${field.key}" 
                        accept="${field.accept || ''}" ${field.required ? 'required' : ''}
                        onchange="ConfigManager.onFileUpload(this)">`;
                break;
                
            default:
                html += `<input type="text" class="form-control" name="${field.key}" 
                        value="${value}" ${field.required ? 'required' : ''}>`;
        }
        
        html += `</div>`;
        return html;
    }

    /**
     * Změna typu datového zdroje
     */
    onDataSourceTypeChange() {
        if (!this.currentDataSource) return;
        
        const form = document.getElementById('dataSourceForm');
        if (!form) return;
        
        const typeSelect = form.querySelector('[name="type"]');
        const newType = typeSelect.value;
        
        // Aktualizuj konfiguraci
        const sourceConfig = this.core.dataSources.get(this.currentDataSource);
        if (sourceConfig) {
            sourceConfig.type = newType;
            sourceConfig.config = {}; // Vyčisti konfiguraci při změně typu
        }
        
        // Překresli formulář
        this.renderDataSourceConfig(this.currentDataSource);
    }

    /**
     * Test datového zdroje
     */
    async testDataSource(sourceId) {
        const resultsDiv = document.getElementById('testResults');
        if (!resultsDiv) return;
        
        resultsDiv.style.display = 'block';
        resultsDiv.innerHTML = `
            <div class="alert alert-info">
                <i class="fas fa-spinner fa-spin me-2"></i>Testuji připojení...
            </div>
        `;
        
        try {
            // Uložíme aktuální konfiguraci
            this.saveDataSourceFromForm();
            
            const sourceConfig = this.core.dataSources.get(sourceId);
            const data = await this.core.dataManager.loadDataSource(sourceId, sourceConfig);
            
            const stats = this.core.dataManager.getDataStats(data);
            
            resultsDiv.innerHTML = `
                <div class="alert alert-success">
                    <i class="fas fa-check-circle me-2"></i>Připojení úspěšné!
                    <div class="mt-2">
                        <strong>Statistiky dat:</strong><br>
                        • Počet záznamů: ${stats.count}<br>
                        • Počet polí: ${stats.fields.length}<br>
                        ${stats.fields.length > 0 ? `• Pole: ${stats.fields.map(f => f.name).join(', ')}` : ''}
                    </div>
                </div>
            `;
            
        } catch (error) {
            resultsDiv.innerHTML = `
                <div class="alert alert-danger">
                    <i class="fas fa-exclamation-triangle me-2"></i>Chyba při testování!
                    <div class="mt-2">
                        <strong>Detaily:</strong><br>
                        ${error.message}
                    </div>
                </div>
            `;
        }
    }

    /**
     * Uložení datového zdroje z formuláře
     */
    saveDataSourceFromForm() {
        if (!this.currentDataSource) return;
        
        const form = document.getElementById('dataSourceForm');
        if (!form) return;
        
        const formData = new FormData(form);
        const sourceConfig = this.core.dataSources.get(this.currentDataSource);
        
        if (sourceConfig) {
            // Základní konfigurace
            sourceConfig.name = formData.get('name') || sourceConfig.name;
            sourceConfig.type = formData.get('type') || sourceConfig.type;
            
            // Specifické konfigurace typu
            const typeInfo = this.core.dataManager.supportedTypes[sourceConfig.type];
            if (typeInfo && typeInfo.configFields) {
                for (const field of typeInfo.configFields) {
                    let value = formData.get(field.key);
                    
                    // Speciální zpracování pro různé typy polí
                    if (field.type === 'checkbox') {
                        value = form.querySelector(`[name="${field.key}"]`).checked;
                    } else if (field.type === 'number') {
                        value = value ? parseFloat(value) : null;
                    }
                    
                    sourceConfig.config[field.key] = value;
                }
            }
        }
    }

    /**
     * Uložení datového zdroje
     */
    saveDataSource() {
        this.saveDataSourceFromForm();
        this.core.saveUserConfiguration();
        this.core.showToast('Datový zdroj byl uložen', 'success');
        
        // Aktualizuj seznam
        this.renderDataSourcesList();
    }

    /**
     * Úprava datového zdroje
     */
    editDataSource(sourceId) {
        this.selectDataSource(sourceId);
    }

    /**
     * Smazání datového zdroje
     */
    deleteDataSource(sourceId) {
        if (confirm('Opravdu chcete odstranit tento datový zdroj? Všechny widgety, které jej používají, přestanou fungovat.')) {
            this.core.dataSources.delete(sourceId);
            this.core.saveUserConfiguration();
            this.renderDataSourcesList();
            
            // Vyčisti konfigurační panel
            const container = document.getElementById('dataSourceConfig');
            if (container) {
                container.innerHTML = `
                    <div class="text-center py-4">
                        <i class="fas fa-arrow-left me-2"></i>
                        <span class="text-muted">Vyberte zdroj dat pro konfiguraci</span>
                    </div>
                `;
            }
            
            this.core.showToast('Datový zdroj byl odstraněn', 'info');
        }
    }

    /**
     * Otevření konfigurace widgetů
     */
    openWidgetsConfig() {
        console.log('🧩 Otevírám konfiguraci widgetů...');
        
        this.renderActiveWidgetsList();
        this.renderWidgetTypesList();
        
        const modal = new bootstrap.Modal(this.modals.widget);
        modal.show();
    }

    /**
     * Vykreslení seznamu aktivních widgetů
     */
    renderActiveWidgetsList() {
        const container = document.getElementById('activeWidgetsList');
        if (!container) return;
        
        container.innerHTML = '';
        
        if (this.core.widgets.size === 0) {
            container.innerHTML = `
                <div class="text-center py-4 text-muted">
                    <i class="fas fa-puzzle-piece fa-2x mb-3"></i>
                    <p>Žádné widgety nejsou nakonfigurovány</p>
                </div>
            `;
            return;
        }
        
        // Seřaď widgety podle pozice
        const sortedWidgets = Array.from(this.core.widgets.entries())
            .sort(([,a], [,b]) => (a.position || 0) - (b.position || 0));
        
        for (const [widgetId, widgetConfig] of sortedWidgets) {
            const item = this.createWidgetListItem(widgetId, widgetConfig);
            container.appendChild(item);
        }
    }

    /**
     * Vytvoření položky v seznamu widgetů
     */
    createWidgetListItem(widgetId, widgetConfig) {
        const widgetType = this.core.widgetFactory.widgetTypes.get(widgetConfig.type);
        
        const item = document.createElement('div');
        item.className = `widget-list-item ${widgetConfig.enabled === false ? 'disabled' : ''}`;
        item.dataset.widgetId = widgetId;
        
        item.innerHTML = `
            <div class="d-flex align-items-center">
                <div class="widget-drag-handle me-2">
                    <i class="fas fa-grip-vertical text-muted"></i>
                </div>
                <div class="widget-icon me-2">
                    <i class="${widgetType?.icon || 'fas fa-puzzle-piece'}"></i>
                </div>
                <div class="flex-grow-1">
                    <div class="widget-title">${widgetConfig.title || widgetId}</div>
                    <small class="text-muted">${widgetType?.name || widgetConfig.type}</small>
                </div>
                <div class="widget-controls">
                    <button class="btn btn-sm btn-outline-primary" title="Upravit" 
                            onclick="ConfigManager.editWidget('${widgetId}')">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-secondary" title="${widgetConfig.enabled === false ? 'Povolit' : 'Zakázat'}" 
                            onclick="ConfigManager.toggleWidget('${widgetId}')">
                        <i class="fas fa-${widgetConfig.enabled === false ? 'eye' : 'eye-slash'}"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-danger" title="Odstranit" 
                            onclick="ConfigManager.deleteWidget('${widgetId}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `;
        
        return item;
    }

    /**
     * Vykreslení seznamu typů widgetů
     */
    renderWidgetTypesList() {
        const container = document.getElementById('widgetTypesList');
        if (!container) return;
        
        container.innerHTML = '';
        
        // Seskup widgety podle kategorií
        const categories = {};
        for (const [typeKey, typeData] of this.core.widgetFactory.widgetTypes) {
            const category = typeData.category || 'other';
            if (!categories[category]) {
                categories[category] = [];
            }
            categories[category].push({ key: typeKey, data: typeData });
        }
        
        // Vykreslení kategorií
        for (const [categoryKey, widgets] of Object.entries(categories)) {
            const categoryTitle = this.getCategoryTitle(categoryKey);
            
            const categoryDiv = document.createElement('div');
            categoryDiv.className = 'widget-category mb-3';
            
            let categoryHtml = `
                <h6 class="category-title">${categoryTitle}</h6>
                <div class="category-widgets">
            `;
            
            for (const widget of widgets) {
                categoryHtml += `
                    <div class="widget-type-item" onclick="ConfigManager.addWidget('${widget.key}')">
                        <i class="${widget.data.icon}"></i>
                        <div class="widget-type-info">
                            <div class="widget-type-name">${widget.data.name}</div>
                            <small class="text-muted">${widget.data.description}</small>
                        </div>
                    </div>
                `;
            }
            
            categoryHtml += `</div>`;
            categoryDiv.innerHTML = categoryHtml;
            container.appendChild(categoryDiv);
        }
    }

    /**
     * Získání názvu kategorie
     */
    getCategoryTitle(categoryKey) {
        const titles = {
            'metrics': 'Metriky',
            'charts': 'Grafy',
            'tables': 'Tabulky',
            'other': 'Ostatní'
        };
        return titles[categoryKey] || categoryKey;
    }

    /**
     * Přidání nového widgetu
     */
    addWidget(widgetType) {
        const widgetId = this.core.generateId();
        const widgetConfig = {
            type: widgetType,
            title: `Nový ${this.core.widgetFactory.widgetTypes.get(widgetType)?.name || 'widget'}`,
            enabled: true,
            position: this.core.widgets.size,
            size: 6 // Bootstrap column size
        };
        
        this.core.widgets.set(widgetId, widgetConfig);
        this.core.saveUserConfiguration();
        this.renderActiveWidgetsList();
        
        // Automaticky otevři editor
        this.editWidget(widgetId);
        
        this.core.showToast('Widget byl přidán', 'success');
    }

    /**
     * Úprava widgetu
     */
    editWidget(widgetId) {
        this.currentWidget = widgetId;
        this.renderWidgetConfigPanel(widgetId);
    }

    /**
     * Vykreslení konfiguračního panelu widgetu
     */
    renderWidgetConfigPanel(widgetId) {
        const container = document.getElementById('widgetConfigPanel');
        if (!container) return;
        
        const widgetConfig = this.core.widgets.get(widgetId);
        if (!widgetConfig) return;
        
        const widgetType = this.core.widgetFactory.widgetTypes.get(widgetConfig.type);
        
        let html = `
            <div class="mb-3">
                <h6><i class="${widgetType?.icon || 'fas fa-puzzle-piece'} me-2"></i>${widgetType?.name || widgetConfig.type}</h6>
                <small class="text-muted">${widgetType?.description || ''}</small>
            </div>
            
            <form id="widgetForm">
        `;
        
        // Základní konfigurace
        html += `
            <div class="row">
                <div class="col-md-8">
                    <div class="mb-3">
                        <label class="form-label">Název widgetu</label>
                        <input type="text" class="form-control" name="title" value="${widgetConfig.title || ''}" required>
                    </div>
                </div>
                <div class="col-md-4">
                    <div class="mb-3">
                        <label class="form-label">Velikost</label>
                        <select class="form-select" name="size">
                            <option value="3" ${widgetConfig.size === 3 ? 'selected' : ''}>Malý (1/4)</option>
                            <option value="4" ${widgetConfig.size === 4 ? 'selected' : ''}>Třetina</option>
                            <option value="6" ${widgetConfig.size === 6 ? 'selected' : ''}>Polovina</option>
                            <option value="8" ${widgetConfig.size === 8 ? 'selected' : ''}>Dvě třetiny</option>
                            <option value="12" ${widgetConfig.size === 12 ? 'selected' : ''}>Celá šířka</option>
                        </select>
                    </div>
                </div>
            </div>
        `;
        
        // Specifická pole pro typ widgetu
        if (widgetType && widgetType.configFields) {
            for (const field of widgetType.configFields) {
                const value = widgetConfig[field.key] || field.defaultValue || '';
                html += this.renderWidgetConfigField(field, value, widgetId);
            }
        }
        
        html += `</form>`;
        container.innerHTML = html;
    }

    /**
     * Vykreslení konfiguračního pole widgetu
     */
    renderWidgetConfigField(field, value, widgetId) {
        let html = `<div class="mb-3">
            <label class="form-label">${field.label}`;
        
        if (field.required) {
            html += ` <span class="text-danger">*</span>`;
        }
        
        html += `</label>`;
        
        switch (field.type) {
            case 'data-source':
                html += `<select class="form-select" name="${field.key}" ${field.required ? 'required' : ''} 
                        onchange="ConfigManager.onDataSourceFieldChange('${widgetId}')">`;
                if (!field.required) {
                    html += `<option value="">-- Vyberte zdroj dat --</option>`;
                }
                for (const [sourceId, sourceConfig] of this.core.dataSources) {
                    const selected = value === sourceId ? 'selected' : '';
                    html += `<option value="${sourceId}" ${selected}>${sourceConfig.name || sourceId}</option>`;
                }
                html += `</select>`;
                break;
                
            case 'field-select':
                html += `<select class="form-select" name="${field.key}" ${field.required ? 'required' : ''}>`;
                if (!field.required) {
                    html += `<option value="">-- Vyberte pole --</option>`;
                }
                
                // Získej dostupná pole ze zdroje dat
                const sourceId = this.getWidgetDataSource(widgetId);
                if (sourceId) {
                    const fields = this.getDataSourceFields(sourceId);
                    for (const fieldName of fields) {
                        const selected = value === fieldName ? 'selected' : '';
                        html += `<option value="${fieldName}" ${selected}>${fieldName}</option>`;
                    }
                }
                html += `</select>`;
                break;
                
            default:
                html += this.renderConfigField(field, value);
        }
        
        html += `</div>`;
        return html;
    }

    /**
     * Změna datového zdroje u widgetu
     */
    onDataSourceFieldChange(widgetId) {
        // Překresli formulář pro aktualizaci závislých polí
        this.renderWidgetConfigPanel(widgetId);
    }

    /**
     * Získání datového zdroje widgetu
     */
    getWidgetDataSource(widgetId) {
        const widgetConfig = this.core.widgets.get(widgetId);
        return widgetConfig?.dataSource;
    }

    /**
     * Získání polí z datového zdroje
     */
    getDataSourceFields(sourceId) {
        const sourceData = this.core.dataManager.getSourceData(sourceId);
        if (!sourceData || !Array.isArray(sourceData) || sourceData.length === 0) {
            return [];
        }
        
        const firstRow = sourceData[0];
        if (typeof firstRow === 'object' && firstRow !== null) {
            return Object.keys(firstRow);
        }
        
        return [];
    }

    /**
     * Uložení widgetu
     */
    saveWidget() {
        if (!this.currentWidget) return;
        
        const form = document.getElementById('widgetForm');
        if (!form) return;
        
        const formData = new FormData(form);
        const widgetConfig = this.core.widgets.get(this.currentWidget);
        
        if (widgetConfig) {
            // Základní konfigurace
            widgetConfig.title = formData.get('title') || widgetConfig.title;
            widgetConfig.size = parseInt(formData.get('size')) || 6;
            
            // Specifické konfigurace typu
            const widgetType = this.core.widgetFactory.widgetTypes.get(widgetConfig.type);
            if (widgetType && widgetType.configFields) {
                for (const field of widgetType.configFields) {
                    let value = formData.get(field.key);
                    
                    // Speciální zpracování pro různé typy polí
                    if (field.type === 'checkbox') {
                        value = form.querySelector(`[name="${field.key}"]`).checked;
                    } else if (field.type === 'number') {
                        value = value ? parseFloat(value) : null;
                    }
                    
                    widgetConfig[field.key] = value;
                }
            }
        }
        
        this.core.saveUserConfiguration();
        this.core.showToast('Widget byl uložen', 'success');
        
        // Aktualizuj seznam a dashboard
        this.renderActiveWidgetsList();
        this.core.renderDashboard();
    }

    /**
     * Smazání widgetu
     */
    deleteWidget(widgetId) {
        if (confirm('Opravdu chcete odstranit tento widget?')) {
            this.core.widgets.delete(widgetId);
            this.core.saveUserConfiguration();
            this.renderActiveWidgetsList();
            this.core.renderDashboard();
            this.core.showToast('Widget byl odstraněn', 'info');
        }
    }

    /**
     * Přepnutí stavu widgetu (enabled/disabled)
     */
    toggleWidget(widgetId) {
        const widgetConfig = this.core.widgets.get(widgetId);
        if (widgetConfig) {
            widgetConfig.enabled = !widgetConfig.enabled;
            this.core.saveUserConfiguration();
            this.renderActiveWidgetsList();
            this.core.renderDashboard();
        }
    }

    /**
     * Upload souboru
     */
    onFileUpload(input) {
        const file = input.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = (e) => {
            // Ulož obsah souboru do konfigurace
            const fieldName = input.name + 'Content';
            const form = input.closest('form');
            
            // Vytvoř skryté pole pro obsah
            let hiddenField = form.querySelector(`[name="${fieldName}"]`);
            if (!hiddenField) {
                hiddenField = document.createElement('input');
                hiddenField.type = 'hidden';
                hiddenField.name = fieldName;
                form.appendChild(hiddenField);
            }
            
            hiddenField.value = e.target.result;
        };
        
        reader.readAsText(file);
    }

    /**
     * Otevření konfigurace layoutu
     */
    openLayoutConfig() {
        // TODO: Implementace konfigurace layoutu
        this.core.showToast('Konfigurace layoutu zatím není implementována', 'warning');
    }
    
    /**
     * Globální API
     */
    static editWidget(widgetId) {
        const instance = window.ConfigManager;
        if (instance) {
            instance.editWidget(widgetId);
        }
    }
    
    static editDataSource(sourceId) {
        const instance = window.ConfigManager;
        if (instance) {
            instance.editDataSource(sourceId);
        }
    }
    
    static deleteDataSource(sourceId) {
        const instance = window.ConfigManager;
        if (instance) {
            instance.deleteDataSource(sourceId);
        }
    }
    
    static deleteWidget(widgetId) {
        const instance = window.ConfigManager;
        if (instance) {
            instance.deleteWidget(widgetId);
        }
    }
    
    static toggleWidget(widgetId) {
        const instance = window.ConfigManager;
        if (instance) {
            instance.toggleWidget(widgetId);
        }
    }
    
    static addWidget(widgetType) {
        const instance = window.ConfigManager;
        if (instance) {
            instance.addWidget(widgetType);
        }
    }
    
    static onDataSourceTypeChange() {
        const instance = window.ConfigManager;
        if (instance) {
            instance.onDataSourceTypeChange();
        }
    }
    
    static onDataSourceFieldChange(widgetId) {
        const instance = window.ConfigManager;
        if (instance) {
            instance.onDataSourceFieldChange(widgetId);
        }
    }
    
    static testDataSource(sourceId) {
        const instance = window.ConfigManager;
        if (instance) {
            instance.testDataSource(sourceId);
        }
    }
    
    static onFileUpload(input) {
        const instance = window.ConfigManager;
        if (instance) {
            instance.onFileUpload(input);
        }
    }
}

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ConfigManager;
}

console.log('⚙️ Configuration Manager modul načten');
