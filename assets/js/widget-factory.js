/**
 * Widget Factory - Továrna na widgety a jejich správa
 * Verze: 3.0 - Modularní architektura
 * Autor: Dashboard System
 */

class WidgetFactory {
    constructor(dashboardCore) {
        this.core = dashboardCore;
        this.widgetTypes = new Map();
        this.activeWidgets = new Map();
        this.templates = new Map();
        
        this.setupWidgetTypes();
    }

    async init() {
        console.log('🧩 Inicializace WidgetFactory...');
        this.loadWidgetTemplates();
    }

    /**
     * Nastavení typů widgetů
     */
    setupWidgetTypes() {
        this.widgetTypes = new Map([
            ['metric-card', {
                name: 'Metrická karta',
                icon: 'fas fa-chart-simple',
                description: 'Zobrazení jedné metriky s trendem',
                category: 'metrics',
                configFields: [
                    {
                        key: 'title',
                        label: 'Název metriky',
                        type: 'text',
                        required: true,
                        placeholder: 'Celkové tržby'
                    },
                    {
                        key: 'dataSource',
                        label: 'Zdroj dat',
                        type: 'data-source',
                        required: true
                    },
                    {
                        key: 'valueField',
                        label: 'Pole s hodnotou',
                        type: 'field-select',
                        required: true,
                        dependsOn: 'dataSource'
                    },
                    {
                        key: 'aggregation',
                        label: 'Agregace',
                        type: 'select',
                        options: [
                            { value: 'sum', label: 'Součet' },
                            { value: 'average', label: 'Průměr' },
                            { value: 'count', label: 'Počet' },
                            { value: 'max', label: 'Maximum' },
                            { value: 'min', label: 'Minimum' },
                            { value: 'last', label: 'Poslední hodnota' }
                        ],
                        defaultValue: 'sum'
                    },
                    {
                        key: 'format',
                        label: 'Formát zobrazení',
                        type: 'select',
                        options: [
                            { value: 'number', label: 'Číslo' },
                            { value: 'currency', label: 'Měna' },
                            { value: 'percentage', label: 'Procenta' }
                        ],
                        defaultValue: 'number'
                    },
                    {
                        key: 'icon',
                        label: 'Ikona',
                        type: 'icon-picker',
                        defaultValue: 'fas fa-chart-line'
                    },
                    {
                        key: 'color',
                        label: 'Barva',
                        type: 'color',
                        defaultValue: 'primary'
                    }
                ]
            }],
            
            ['line-chart', {
                name: 'Čárový graf',
                icon: 'fas fa-chart-line',
                description: 'Zobrazení trendů v čase',
                category: 'charts',
                configFields: [
                    {
                        key: 'title',
                        label: 'Název grafu',
                        type: 'text',
                        required: true
                    },
                    {
                        key: 'dataSource',
                        label: 'Zdroj dat',
                        type: 'data-source',
                        required: true
                    },
                    {
                        key: 'xField',
                        label: 'Osa X (časová)',
                        type: 'field-select',
                        required: true,
                        dependsOn: 'dataSource'
                    },
                    {
                        key: 'yFields',
                        label: 'Osy Y (hodnoty)',
                        type: 'multi-field-select',
                        required: true,
                        dependsOn: 'dataSource'
                    },
                    {
                        key: 'groupBy',
                        label: 'Seskupit podle',
                        type: 'field-select',
                        required: false,
                        dependsOn: 'dataSource'
                    }
                ]
            }],
            
            ['bar-chart', {
                name: 'Sloupcový graf',
                icon: 'fas fa-chart-column',
                description: 'Porovnání kategorií',
                category: 'charts',
                configFields: [
                    {
                        key: 'title',
                        label: 'Název grafu',
                        type: 'text',
                        required: true
                    },
                    {
                        key: 'dataSource',
                        label: 'Zdroj dat',
                        type: 'data-source',
                        required: true
                    },
                    {
                        key: 'categoryField',
                        label: 'Pole kategorií',
                        type: 'field-select',
                        required: true,
                        dependsOn: 'dataSource'
                    },
                    {
                        key: 'valueField',
                        label: 'Pole hodnot',
                        type: 'field-select',
                        required: true,
                        dependsOn: 'dataSource'
                    },
                    {
                        key: 'orientation',
                        label: 'Orientace',
                        type: 'select',
                        options: [
                            { value: 'vertical', label: 'Svisle' },
                            { value: 'horizontal', label: 'Vodorovně' }
                        ],
                        defaultValue: 'vertical'
                    }
                ]
            }],
            
            ['pie-chart', {
                name: 'Koláčový graf',
                icon: 'fas fa-chart-pie',
                description: 'Poměrové rozložení',
                category: 'charts',
                configFields: [
                    {
                        key: 'title',
                        label: 'Název grafu',
                        type: 'text',
                        required: true
                    },
                    {
                        key: 'dataSource',
                        label: 'Zdroj dat',
                        type: 'data-source',
                        required: true
                    },
                    {
                        key: 'labelField',
                        label: 'Pole popisků',
                        type: 'field-select',
                        required: true,
                        dependsOn: 'dataSource'
                    },
                    {
                        key: 'valueField',
                        label: 'Pole hodnot',
                        type: 'field-select',
                        required: true,
                        dependsOn: 'dataSource'
                    }
                ]
            }],
            
            ['data-table', {
                name: 'Datová tabulka',
                icon: 'fas fa-table',
                description: 'Tabulka s vyhledáváním a filtrováním',
                category: 'tables',
                configFields: [
                    {
                        key: 'title',
                        label: 'Název tabulky',
                        type: 'text',
                        required: true
                    },
                    {
                        key: 'dataSource',
                        label: 'Zdroj dat',
                        type: 'data-source',
                        required: true
                    },
                    {
                        key: 'columns',
                        label: 'Sloupce k zobrazení',
                        type: 'column-selector',
                        required: true,
                        dependsOn: 'dataSource'
                    },
                    {
                        key: 'pageSize',
                        label: 'Počet řádků na stránku',
                        type: 'number',
                        defaultValue: 10,
                        min: 5,
                        max: 100
                    },
                    {
                        key: 'searchable',
                        label: 'Povolit vyhledávání',
                        type: 'checkbox',
                        defaultValue: true
                    },
                    {
                        key: 'sortable',
                        label: 'Povolit řazení',
                        type: 'checkbox',
                        defaultValue: true
                    }
                ]
            }],
            
            ['kpi-grid', {
                name: 'KPI mřížka',
                icon: 'fas fa-th',
                description: 'Několik metrik v mřížce',
                category: 'metrics',
                configFields: [
                    {
                        key: 'title',
                        label: 'Název sekce',
                        type: 'text',
                        required: true
                    },
                    {
                        key: 'dataSource',
                        label: 'Zdroj dat',
                        type: 'data-source',
                        required: true
                    },
                    {
                        key: 'metrics',
                        label: 'Metriky',
                        type: 'metrics-builder',
                        required: true,
                        dependsOn: 'dataSource'
                    }
                ]
            }]
        ]);
    }

    /**
     * Načtení šablon widgetů
     */
    loadWidgetTemplates() {
        // Šablona pro metrickou kartu
        this.templates.set('metric-card', `
            <div class="widget metric-card-widget" data-widget-id="{{id}}">
                <div class="card h-100">
                    <div class="card-body">
                        <div class="row align-items-center">
                            <div class="col">
                                <div class="widget-value">{{value}}</div>
                                <div class="widget-label">{{title}}</div>
                                {{#if change}}
                                <div class="widget-change text-{{changeColor}}">
                                    <i class="fas fa-{{changeIcon}} me-1"></i>{{change}}
                                </div>
                                {{/if}}
                            </div>
                            <div class="col-auto">
                                <div class="widget-icon bg-{{color}}">
                                    <i class="{{icon}}"></i>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="card-footer border-0 bg-transparent">
                        <div class="widget-controls">
                            <button class="btn btn-sm btn-outline-primary" onclick="WidgetFactory.showDetails('{{id}}')">
                                <i class="fas fa-search me-1"></i>Detail
                            </button>
                            <div class="dropdown d-inline">
                                <button class="btn btn-sm btn-outline-secondary dropdown-toggle" data-bs-toggle="dropdown">
                                    <i class="fas fa-ellipsis-v"></i>
                                </button>
                                <ul class="dropdown-menu">
                                    <li><a class="dropdown-item" onclick="ConfigManager.editWidget('{{id}}')">
                                        <i class="fas fa-edit me-2"></i>Upravit
                                    </a></li>
                                    <li><a class="dropdown-item" onclick="WidgetFactory.toggleWidget('{{id}}')">
                                        <i class="fas fa-eye-slash me-2"></i>Skrýt
                                    </a></li>
                                    <li><hr class="dropdown-divider"></li>
                                    <li><a class="dropdown-item text-danger" onclick="WidgetFactory.removeWidget('{{id}}')">
                                        <i class="fas fa-trash me-2"></i>Odstranit
                                    </a></li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `);

        // Šablona pro graf
        this.templates.set('chart-widget', `
            <div class="widget chart-widget" data-widget-id="{{id}}">
                <div class="card h-100">
                    <div class="card-header">
                        <div class="row align-items-center">
                            <div class="col">
                                <h5 class="card-title mb-0">{{title}}</h5>
                            </div>
                            <div class="col-auto">
                                <div class="widget-controls">
                                    <button class="btn btn-sm btn-outline-primary" onclick="WidgetFactory.showDetails('{{id}}')">
                                        <i class="fas fa-expand me-1"></i>Detail
                                    </button>
                                    <div class="dropdown d-inline">
                                        <button class="btn btn-sm btn-outline-secondary dropdown-toggle" data-bs-toggle="dropdown">
                                            <i class="fas fa-ellipsis-v"></i>
                                        </button>
                                        <ul class="dropdown-menu dropdown-menu-end">
                                            <li><a class="dropdown-item" onclick="ConfigManager.editWidget('{{id}}')">
                                                <i class="fas fa-edit me-2"></i>Upravit
                                            </a></li>
                                            <li><a class="dropdown-item" onclick="WidgetFactory.exportWidget('{{id}}')">
                                                <i class="fas fa-download me-2"></i>Export
                                            </a></li>
                                            <li><a class="dropdown-item" onclick="WidgetFactory.toggleWidget('{{id}}')">
                                                <i class="fas fa-eye-slash me-2"></i>Skrýt
                                            </a></li>
                                            <li><hr class="dropdown-divider"></li>
                                            <li><a class="dropdown-item text-danger" onclick="WidgetFactory.removeWidget('{{id}}')">
                                                <i class="fas fa-trash me-2"></i>Odstranit
                                            </a></li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="card-body">
                        <div class="chart-container">
                            <canvas id="chart_{{id}}" width="400" height="200"></canvas>
                        </div>
                    </div>
                </div>
            </div>
        `);

        // Šablona pro tabulku
        this.templates.set('table-widget', `
            <div class="widget table-widget" data-widget-id="{{id}}">
                <div class="card h-100">
                    <div class="card-header">
                        <div class="row align-items-center">
                            <div class="col">
                                <h5 class="card-title mb-0">{{title}}</h5>
                            </div>
                            <div class="col-auto">
                                {{#if searchable}}
                                <div class="input-group input-group-sm me-2" style="width: 200px;">
                                    <input type="text" class="form-control" placeholder="Vyhledávání..." 
                                           id="search_{{id}}" onkeyup="WidgetFactory.searchTable('{{id}}', this.value)">
                                    <span class="input-group-text"><i class="fas fa-search"></i></span>
                                </div>
                                {{/if}}
                                <div class="widget-controls d-inline">
                                    <button class="btn btn-sm btn-outline-primary" onclick="WidgetFactory.showDetails('{{id}}')">
                                        <i class="fas fa-expand me-1"></i>Detail
                                    </button>
                                    <div class="dropdown d-inline">
                                        <button class="btn btn-sm btn-outline-secondary dropdown-toggle" data-bs-toggle="dropdown">
                                            <i class="fas fa-ellipsis-v"></i>
                                        </button>
                                        <ul class="dropdown-menu dropdown-menu-end">
                                            <li><a class="dropdown-item" onclick="ConfigManager.editWidget('{{id}}')">
                                                <i class="fas fa-edit me-2"></i>Upravit
                                            </a></li>
                                            <li><a class="dropdown-item" onclick="WidgetFactory.exportWidget('{{id}}')">
                                                <i class="fas fa-download me-2"></i>Export CSV
                                            </a></li>
                                            <li><a class="dropdown-item" onclick="WidgetFactory.toggleWidget('{{id}}')">
                                                <i class="fas fa-eye-slash me-2"></i>Skrýt
                                            </a></li>
                                            <li><hr class="dropdown-divider"></li>
                                            <li><a class="dropdown-item text-danger" onclick="WidgetFactory.removeWidget('{{id}}')">
                                                <i class="fas fa-trash me-2"></i>Odstranit
                                            </a></li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="card-body p-0">
                        <div class="table-responsive">
                            <table class="table table-hover mb-0" id="table_{{id}}">
                                <thead></thead>
                                <tbody></tbody>
                            </table>
                        </div>
                        {{#if paginated}}
                        <div class="card-footer">
                            <div class="row align-items-center">
                                <div class="col">
                                    <small class="text-muted" id="tableInfo_{{id}}">Zobrazeno 0 z 0 záznamů</small>
                                </div>
                                <div class="col-auto">
                                    <nav>
                                        <ul class="pagination pagination-sm mb-0" id="pagination_{{id}}"></ul>
                                    </nav>
                                </div>
                            </div>
                        </div>
                        {{/if}}
                    </div>
                </div>
            </div>
        `);
    }

    /**
     * Vytvoření nového widgetu
     */
    async createWidget(widgetId, widgetConfig) {
        console.log(`🧩 Vytváření widgetu: ${widgetId}`, widgetConfig);

        try {
            const widgetType = this.widgetTypes.get(widgetConfig.type);
            if (!widgetType) {
                throw new Error(`Neznámý typ widgetu: ${widgetConfig.type}`);
            }

            // Vytvoř element widgetu
            const element = await this.renderWidget(widgetId, widgetConfig, widgetType);
            
            // Načti a zpracuj data
            await this.loadWidgetData(widgetId, widgetConfig);
            
            // Zaregistruj widget
            this.activeWidgets.set(widgetId, {
                element: element,
                config: widgetConfig,
                type: widgetType
            });

            console.log(`✅ Widget ${widgetId} vytvořen`);
            return element;

        } catch (error) {
            console.error(`❌ Chyba při vytváření widgetu ${widgetId}:`, error);
            return this.createErrorWidget(widgetId, error.message);
        }
    }

    /**
     * Vykreslení widgetu
     */
    async renderWidget(widgetId, config, widgetType) {
        const containerDiv = document.createElement('div');
        containerDiv.className = `col-lg-${config.size || 6} mb-4`;
        containerDiv.setAttribute('data-widget-id', widgetId);

        let html = '';
        
        switch (config.type) {
            case 'metric-card':
                html = this.renderMetricCard(widgetId, config);
                break;
                
            case 'line-chart':
            case 'bar-chart':
            case 'pie-chart':
                html = this.renderChart(widgetId, config);
                break;
                
            case 'data-table':
                html = this.renderTable(widgetId, config);
                break;
                
            case 'kpi-grid':
                html = this.renderKpiGrid(widgetId, config);
                break;
                
            default:
                html = this.renderGenericWidget(widgetId, config);
        }

        containerDiv.innerHTML = html;
        return containerDiv;
    }

    /**
     * Vykreslení metrické karty
     */
    renderMetricCard(widgetId, config) {
        const template = this.templates.get('metric-card');
        return this.processTemplate(template, {
            id: widgetId,
            title: config.title || 'Metrika',
            value: '...',
            icon: config.icon || 'fas fa-chart-line',
            color: config.color || 'primary'
        });
    }

    /**
     * Vykreslení grafu
     */
    renderChart(widgetId, config) {
        const template = this.templates.get('chart-widget');
        return this.processTemplate(template, {
            id: widgetId,
            title: config.title || 'Graf'
        });
    }

    /**
     * Vykreslení tabulky
     */
    renderTable(widgetId, config) {
        const template = this.templates.get('table-widget');
        return this.processTemplate(template, {
            id: widgetId,
            title: config.title || 'Tabulka',
            searchable: config.searchable !== false,
            paginated: config.pageSize > 0
        });
    }

    /**
     * Vykreslení KPI mřížky
     */
    renderKpiGrid(widgetId, config) {
        let html = `<div class="widget kpi-grid-widget" data-widget-id="${widgetId}">
            <div class="card h-100">
                <div class="card-header">
                    <h5 class="card-title mb-0">${config.title || 'KPI Přehled'}</h5>
                </div>
                <div class="card-body">
                    <div class="row" id="kpiGrid_${widgetId}">
                        <!-- KPI metriky se vloží dynamicky -->
                    </div>
                </div>
            </div>
        </div>`;
        
        return html;
    }

    /**
     * Načtení dat pro widget
     */
    async loadWidgetData(widgetId, config) {
        if (!config.dataSource) {
            console.warn(`⚠️ Widget ${widgetId} nemá nakonfigurovaný zdroj dat`);
            return;
        }

        try {
            // Získej data ze zdroje
            const sourceData = this.core.dataManager.getSourceData(config.dataSource);
            if (!sourceData) {
                throw new Error('Data nejsou dostupná');
            }

            // Zpracuj data podle typu widgetu
            const processedData = this.processWidgetData(sourceData, config);
            
            // Aktualizuj widget s daty
            await this.updateWidgetContent(widgetId, processedData, config);

        } catch (error) {
            console.error(`❌ Chyba při načítání dat pro widget ${widgetId}:`, error);
            this.showWidgetError(widgetId, error.message);
        }
    }

    /**
     * Zpracování dat pro widget
     */
    processWidgetData(sourceData, config) {
        if (!Array.isArray(sourceData)) {
            return sourceData;
        }

        let processedData = [...sourceData];

        // Aplikuj filtry
        if (config.filters && config.filters.length > 0) {
            processedData = this.core.dataManager.filterData(processedData, config.filters);
        }

        // Aplikuj agregace
        if (config.aggregation && config.aggregation.groupBy) {
            processedData = this.core.dataManager.aggregateData(processedData, config.aggregation);
        }

        // Seřaď data
        if (config.sortBy) {
            processedData.sort((a, b) => {
                const aVal = this.getFieldValue(a, config.sortBy.field);
                const bVal = this.getFieldValue(b, config.sortBy.field);
                
                if (config.sortBy.direction === 'desc') {
                    return bVal < aVal ? -1 : bVal > aVal ? 1 : 0;
                } else {
                    return aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
                }
            });
        }

        // Omez počet záznamů
        if (config.limit && config.limit > 0) {
            processedData = processedData.slice(0, config.limit);
        }

        return processedData;
    }

    /**
     * Aktualizace obsahu widgetu
     */
    async updateWidgetContent(widgetId, data, config) {
        const widget = this.activeWidgets.get(widgetId);
        if (!widget) return;

        switch (config.type) {
            case 'metric-card':
                this.updateMetricCard(widgetId, data, config);
                break;
                
            case 'line-chart':
                this.updateLineChart(widgetId, data, config);
                break;
                
            case 'bar-chart':
                this.updateBarChart(widgetId, data, config);
                break;
                
            case 'pie-chart':
                this.updatePieChart(widgetId, data, config);
                break;
                
            case 'data-table':
                this.updateDataTable(widgetId, data, config);
                break;
                
            case 'kpi-grid':
                this.updateKpiGrid(widgetId, data, config);
                break;
        }
    }

    /**
     * Aktualizace metrické karty
     */
    updateMetricCard(widgetId, data, config) {
        const element = document.querySelector(`[data-widget-id="${widgetId}"] .widget-value`);
        if (!element) return;

        try {
            // Vypočítej hodnotu
            let value = 0;
            if (Array.isArray(data) && data.length > 0) {
                const values = data.map(row => this.getFieldValue(row, config.valueField))
                                 .filter(v => typeof v === 'number');
                
                switch (config.aggregation) {
                    case 'sum':
                        value = values.reduce((a, b) => a + b, 0);
                        break;
                    case 'average':
                        value = values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0;
                        break;
                    case 'count':
                        value = data.length;
                        break;
                    case 'max':
                        value = Math.max(...values);
                        break;
                    case 'min':
                        value = Math.min(...values);
                        break;
                    case 'last':
                        value = values[values.length - 1] || 0;
                        break;
                    default:
                        value = values[0] || 0;
                }
            }

            // Formátuj hodnotu
            const formattedValue = this.formatValue(value, config.format);
            element.textContent = formattedValue;

            // Vypočítaj změnu pokud je to možné
            this.calculateAndUpdateChange(widgetId, value, data, config);

        } catch (error) {
            element.textContent = 'Chyba';
            console.error(`❌ Chyba při aktualizaci metriky ${widgetId}:`, error);
        }
    }

    /**
     * Aktualizace čárového grafu
     */
    updateLineChart(widgetId, data, config) {
        const canvas = document.getElementById(`chart_${widgetId}`);
        if (!canvas) return;

        try {
            const ctx = canvas.getContext('2d');
            
            // Zničení existujícího grafu
            if (canvas.chart) {
                canvas.chart.destroy();
            }

            // Příprava dat
            const chartData = this.prepareLineChartData(data, config);
            
            // Vytvoření grafu
            canvas.chart = new Chart(ctx, {
                type: 'line',
                data: chartData,
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        y: {
                            beginAtZero: true
                        }
                    },
                    plugins: {
                        legend: {
                            display: chartData.datasets.length > 1
                        }
                    },
                    onClick: (event, activeElements) => {
                        if (activeElements.length > 0) {
                            this.showDetails(widgetId);
                        }
                    }
                }
            });

        } catch (error) {
            console.error(`❌ Chyba při aktualizaci čárového grafu ${widgetId}:`, error);
            this.showWidgetError(widgetId, 'Chyba při vytváření grafu');
        }
    }

    /**
     * Aktualizace datové tabulky
     */
    updateDataTable(widgetId, data, config) {
        const table = document.getElementById(`table_${widgetId}`);
        if (!table) return;

        try {
            const thead = table.querySelector('thead');
            const tbody = table.querySelector('tbody');
            
            // Vyčisti tabulku
            thead.innerHTML = '';
            tbody.innerHTML = '';

            if (!Array.isArray(data) || data.length === 0) {
                tbody.innerHTML = '<tr><td colspan="100%" class="text-center py-4">Žádná data k zobrazení</td></tr>';
                return;
            }

            // Vytvoř hlavičku
            const columns = config.columns || this.getTableColumns(data[0]);
            const headerRow = thead.insertRow();
            
            columns.forEach(column => {
                const th = document.createElement('th');
                th.textContent = column.label || column.field;
                th.className = config.sortable ? 'sortable' : '';
                if (config.sortable) {
                    th.onclick = () => this.sortTable(widgetId, column.field);
                }
                headerRow.appendChild(th);
            });

            // Naplň data
            const pageSize = config.pageSize || data.length;
            const currentPage = 1;
            const startIndex = (currentPage - 1) * pageSize;
            const pageData = data.slice(startIndex, startIndex + pageSize);

            pageData.forEach((row, index) => {
                const tr = tbody.insertRow();
                columns.forEach(column => {
                    const td = tr.insertCell();
                    const value = this.getFieldValue(row, column.field);
                    td.textContent = this.formatTableValue(value, column);
                });
                
                // Přidej click handler pro řádek
                tr.onclick = () => this.showRowDetails(widgetId, row, index);
                tr.style.cursor = 'pointer';
            });

            // Aktualizuj info o stránkování
            this.updateTableInfo(widgetId, data.length, pageData.length, currentPage);

        } catch (error) {
            console.error(`❌ Chyba při aktualizaci tabulky ${widgetId}:`, error);
            this.showWidgetError(widgetId, 'Chyba při vytváření tabulky');
        }
    }

    /**
     * Pomocné metody
     */
    
    processTemplate(template, data) {
        let processed = template;
        
        // Jednoduchá šablona replacements
        for (const [key, value] of Object.entries(data)) {
            const regex = new RegExp(`{{${key}}}`, 'g');
            processed = processed.replace(regex, value);
        }
        
        // Podmíněné bloky {{#if condition}}...{{/if}}
        processed = processed.replace(/\{\{#if (\w+)\}\}([\s\S]*?)\{\{\/if\}\}/g, (match, condition, content) => {
            return data[condition] ? content : '';
        });
        
        return processed;
    }

    formatValue(value, format) {
        switch (format) {
            case 'currency':
                return this.core.formatCurrency(value);
            case 'percentage':
                return this.core.formatNumber(value, { style: 'percent', minimumFractionDigits: 1 });
            case 'number':
            default:
                return this.core.formatNumber(value);
        }
    }

    getFieldValue(obj, field) {
        return field.split('.').reduce((current, key) => {
            return current && current[key] !== undefined ? current[key] : null;
        }, obj);
    }

    createErrorWidget(widgetId, errorMessage) {
        const containerDiv = document.createElement('div');
        containerDiv.className = 'col-lg-6 mb-4';
        containerDiv.innerHTML = `
            <div class="card border-danger">
                <div class="card-body text-center py-4">
                    <i class="fas fa-exclamation-triangle text-danger fa-2x mb-3"></i>
                    <h5 class="card-title">Chyba widgetu</h5>
                    <p class="card-text text-muted">${errorMessage}</p>
                    <button class="btn btn-outline-primary btn-sm" onclick="ConfigManager.editWidget('${widgetId}')">
                        <i class="fas fa-edit me-1"></i>Upravit konfiguraci
                    </button>
                </div>
            </div>
        `;
        return containerDiv;
    }

    showWidgetError(widgetId, message) {
        const element = document.querySelector(`[data-widget-id="${widgetId}"]`);
        if (element) {
            element.innerHTML = `
                <div class="alert alert-danger" role="alert">
                    <i class="fas fa-exclamation-triangle me-2"></i>
                    Chyba: ${message}
                </div>
            `;
        }
    }

    /**
     * Veřejné API metody
     */
    
    static showDetails(widgetId) {
        const instance = window.WidgetFactory;
        if (instance && instance.core.detailModal) {
            instance.core.detailModal.showWidgetDetails(widgetId);
        }
    }

    static toggleWidget(widgetId) {
        const instance = window.WidgetFactory;
        if (instance) {
            const config = instance.core.widgets.get(widgetId);
            if (config) {
                config.enabled = !config.enabled;
                instance.core.saveUserConfiguration();
                instance.core.renderDashboard();
            }
        }
    }

    static removeWidget(widgetId) {
        const instance = window.WidgetFactory;
        if (instance) {
            if (confirm('Opravdu chcete odstranit tento widget?')) {
                instance.core.widgets.delete(widgetId);
                instance.core.saveUserConfiguration();
                instance.core.renderDashboard();
                instance.core.showToast('Widget byl odstraněn', 'info');
            }
        }
    }

    static exportWidget(widgetId) {
        // Implementace exportu widgetu
        console.log('Export widget:', widgetId);
    }

    /**
     * Aktualizace widgetu
     */
    async updateWidget(widgetId) {
        const config = this.core.widgets.get(widgetId);
        if (config && config.enabled !== false) {
            await this.loadWidgetData(widgetId, config);
        }
    }
}

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = WidgetFactory;
}

console.log('🧩 Widget Factory modul načten');
