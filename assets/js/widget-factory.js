/**
 * Widget Factory - Továrna na widgety a jejich správa (OPRAVENO)
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
                    { key: 'title', label: 'Název metriky', type: 'text', required: true, placeholder: 'Celkové tržby' },
                    { key: 'dataSource', label: 'Zdroj dat', type: 'data-source', required: true },
                    { key: 'valueField', label: 'Pole s hodnotou', type: 'field-select', required: true, dependsOn: 'dataSource' },
                    { key: 'aggregation', label: 'Agregace', type: 'select', options: [
                        { value: 'sum', label: 'Součet' },
                        { value: 'average', label: 'Průměr' },
                        { value: 'count', label: 'Počet' },
                        { value: 'max', label: 'Maximum' },
                        { value: 'min', label: 'Minimum' },
                        { value: 'last', label: 'Poslední hodnota' }
                    ], defaultValue: 'sum' },
                    { key: 'format', label: 'Formát zobrazení', type: 'select', options: [
                        { value: 'number', label: 'Číslo' },
                        { value: 'currency', label: 'Měna' },
                        { value: 'percentage', label: 'Procenta' }
                    ], defaultValue: 'number' },
                    { key: 'icon', label: 'Ikona', type: 'icon-picker', defaultValue: 'fas fa-chart-line' },
                    { key: 'color', label: 'Barva', type: 'color', defaultValue: 'primary' }
                ]
            }],
            ['line-chart', {
                name: 'Čárový graf',
                icon: 'fas fa-chart-line',
                description: 'Zobrazení trendů v čase',
                category: 'charts',
                configFields: [
                    { key: 'title', label: 'Název grafu', type: 'text', required: true },
                    { key: 'dataSource', label: 'Zdroj dat', type: 'data-source', required: true },
                    { key: 'xField', label: 'Osa X (časová)', type: 'field-select', required: true, dependsOn: 'dataSource' },
                    { key: 'yFields', label: 'Osy Y (hodnoty)', type: 'multi-field-select', required: true, dependsOn: 'dataSource' },
                    { key: 'groupBy', label: 'Seskupit podle', type: 'field-select', required: false, dependsOn: 'dataSource' }
                ]
            }],
            ['bar-chart', {
                name: 'Sloupcový graf',
                icon: 'fas fa-chart-column',
                description: 'Porovnání kategorií',
                category: 'charts',
                configFields: [
                    { key: 'title', label: 'Název grafu', type: 'text', required: true },
                    { key: 'dataSource', label: 'Zdroj dat', type: 'data-source', required: true },
                    { key: 'categoryField', label: 'Pole kategorií', type: 'field-select', required: true, dependsOn: 'dataSource' },
                    { key: 'valueField', label: 'Pole hodnot', type: 'field-select', required: true, dependsOn: 'dataSource' },
                    { key: 'orientation', label: 'Orientace', type: 'select', options: [
                        { value: 'vertical', label: 'Svisle' },
                        { value: 'horizontal', label: 'Vodorovně' }
                    ], defaultValue: 'vertical' }
                ]
            }],
            ['pie-chart', {
                name: 'Koláčový graf',
                icon: 'fas fa-chart-pie',
                description: 'Poměrové rozložení',
                category: 'charts',
                configFields: [
                    { key: 'title', label: 'Název grafu', type: 'text', required: true },
                    { key: 'dataSource', label: 'Zdroj dat', type: 'data-source', required: true },
                    { key: 'labelField', label: 'Pole popisků', type: 'field-select', required: true, dependsOn: 'dataSource' },
                    { key: 'valueField', label: 'Pole hodnot', type: 'field-select', required: true, dependsOn: 'dataSource' }
                ]
            }],
            ['data-table', {
                name: 'Datová tabulka',
                icon: 'fas fa-table',
                description: 'Tabulka s vyhledáváním a filtrováním',
                category: 'tables',
                configFields: [
                    { key: 'title', label: 'Název tabulky', type: 'text', required: true },
                    { key: 'dataSource', label: 'Zdroj dat', type: 'data-source', required: true },
                    { key: 'columns', label: 'Sloupce k zobrazení', type: 'column-selector', required: true, dependsOn: 'dataSource' },
                    { key: 'pageSize', label: 'Počet řádků na stránku', type: 'number', defaultValue: 10, min: 5, max: 100 },
                    { key: 'searchable', label: 'Povolit vyhledávání', type: 'checkbox', defaultValue: true },
                    { key: 'sortable', label: 'Povolit řazení', type: 'checkbox', defaultValue: true }
                ]
            }],
            ['kpi-grid', {
                name: 'KPI mřížka',
                icon: 'fas fa-th',
                description: 'Několik metrik v mřížce',
                category: 'metrics',
                configFields: [
                    { key: 'title', label: 'Název sekce', type: 'text', required: true },
                    { key: 'dataSource', label: 'Zdroj dat', type: 'data-source', required: true },
                    { key: 'metrics', label: 'Metriky', type: 'metrics-builder', required: true, dependsOn: 'dataSource' }
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
            <div class="card h-100 widget-metric-card">
                <div class="card-header d-flex justify-content-between align-items-center">
                    <h6 class="card-title mb-0">{{title}}</h6>
                    <div class="widget-controls">
                        <button class="btn btn-sm btn-link text-muted" onclick="window.WidgetFactory.showDetails('{{id}}')">
                            <i class="fas fa-expand-alt"></i>
                        </button>
                        <div class="btn-group">
                            <button class="btn btn-sm btn-link text-muted" type="button" data-bs-toggle="dropdown">
                                <i class="fas fa-ellipsis-v"></i>
                            </button>
                            <ul class="dropdown-menu">
                                <li><a class="dropdown-item" href="#" onclick="window.WidgetFactory.editWidget('{{id}}')">
                                    <i class="fas fa-edit me-2"></i>Upravit
                                </a></li>
                                <li><a class="dropdown-item" href="#" onclick="window.WidgetFactory.duplicateWidget('{{id}}')">
                                    <i class="fas fa-copy me-2"></i>Duplikovat
                                </a></li>
                                <li><hr class="dropdown-divider"></li>
                                <li><a class="dropdown-item text-danger" href="#" onclick="window.WidgetFactory.removeWidget('{{id}}')">
                                    <i class="fas fa-trash me-2"></i>Smazat
                                </a></li>
                            </ul>
                        </div>
                    </div>
                </div>
                <div class="card-body text-center">
                    <div class="widget-icon mb-3">
                        <i class="{{icon}} fa-3x text-{{color}}"></i>
                    </div>
                    <div class="widget-value display-4 fw-bold mb-2" id="value_{{id}}">
                        <div class="spinner-border text-{{color}}" role="status">
                            <span class="visually-hidden">Loading...</span>
                        </div>
                    </div>
                    <div class="widget-change" id="change_{{id}}">
                        <small class="text-muted">Načítám data...</small>
                    </div>
                </div>
                <div class="card-footer">
                    <small class="text-muted">
                        <i class="fas fa-clock me-1"></i>
                        Aktualizováno: <span id="updated_{{id}}">nikdy</span>
                    </small>
                </div>
            </div>
        `);

        // Šablona pro graf
        this.templates.set('chart-widget', `
            <div class="card h-100 widget-chart">
                <div class="card-header d-flex justify-content-between align-items-center">
                    <h6 class="card-title mb-0">{{title}}</h6>
                    <div class="widget-controls">
                        <button class="btn btn-sm btn-link text-muted" onclick="window.WidgetFactory.showDetails('{{id}}')">
                            <i class="fas fa-expand-alt"></i>
                        </button>
                        <div class="btn-group">
                            <button class="btn btn-sm btn-link text-muted" type="button" data-bs-toggle="dropdown">
                                <i class="fas fa-ellipsis-v"></i>
                            </button>
                            <ul class="dropdown-menu">
                                <li><a class="dropdown-item" href="#" onclick="window.WidgetFactory.editWidget('{{id}}')">
                                    <i class="fas fa-edit me-2"></i>Upravit
                                </a></li>
                                <li><a class="dropdown-item" href="#" onclick="window.WidgetFactory.exportChart('{{id}}')">
                                    <i class="fas fa-download me-2"></i>Export PNG
                                </a></li>
                                <li><hr class="dropdown-divider"></li>
                                <li><a class="dropdown-item text-danger" href="#" onclick="window.WidgetFactory.removeWidget('{{id}}')">
                                    <i class="fas fa-trash me-2"></i>Smazat
                                </a></li>
                            </ul>
                        </div>
                    </div>
                </div>
                <div class="card-body">
                    <div class="chart-container" style="position: relative; height: 300px;">
                        <canvas id="chart_{{id}}" width="400" height="300"></canvas>
                    </div>
                </div>
            </div>
        `);

        // Šablona pro tabulku
        this.templates.set('table-widget', `
            <div class="card h-100 widget-table">
                <div class="card-header d-flex justify-content-between align-items-center">
                    <h6 class="card-title mb-0">{{title}}</h6>
                    <div class="widget-controls">
                        <button class="btn btn-sm btn-link text-muted" onclick="window.WidgetFactory.showDetails('{{id}}')">
                            <i class="fas fa-expand-alt"></i>
                        </button>
                        <div class="btn-group">
                            <button class="btn btn-sm btn-link text-muted" type="button" data-bs-toggle="dropdown">
                                <i class="fas fa-ellipsis-v"></i>
                            </button>
                            <ul class="dropdown-menu">
                                <li><a class="dropdown-item" href="#" onclick="window.WidgetFactory.editWidget('{{id}}')">
                                    <i class="fas fa-edit me-2"></i>Upravit
                                </a></li>
                                <li><a class="dropdown-item" href="#" onclick="window.WidgetFactory.exportTable('{{id}}')">
                                    <i class="fas fa-download me-2"></i>Export CSV
                                </a></li>
                                <li><hr class="dropdown-divider"></li>
                                <li><a class="dropdown-item text-danger" href="#" onclick="window.WidgetFactory.removeWidget('{{id}}')">
                                    <i class="fas fa-trash me-2"></i>Smazat
                                </a></li>
                            </ul>
                        </div>
                    </div>
                </div>
                <div class="card-body">
                    {{#searchable}}
                    <div class="table-search mb-3">
                        <input type="text" class="form-control form-control-sm" placeholder="Vyhledat v tabulce..." 
                               id="search_{{id}}" onkeyup="window.WidgetFactory.filterTable('{{id}}', this.value)">
                    </div>
                    {{/searchable}}
                    <div class="table-responsive">
                        <table class="table table-sm table-hover" id="table_{{id}}">
                            <thead class="table-light">
                                <!-- Dynamicky generováno -->
                            </thead>
                            <tbody>
                                <!-- Dynamicky generováno -->
                            </tbody>
                        </table>
                    </div>
                    {{#paginated}}
                    <div class="table-pagination mt-3 d-flex justify-content-between align-items-center">
                        <small class="text-muted" id="pagination_info_{{id}}"></small>
                        <div class="btn-group btn-group-sm" role="group" id="pagination_{{id}}">
                            <!-- Dynamicky generováno -->
                        </div>
                    </div>
                    {{/paginated}}
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
        let html = `
            <div class="card h-100 widget-kpi-grid">
                <div class="card-header">
                    <h6 class="card-title mb-0">${config.title || 'KPI Přehled'}</h6>
                </div>
                <div class="card-body">
                    <div class="row" id="kpi_grid_${widgetId}">
                        <div class="col-12 text-center">
                            <div class="spinner-border" role="status">
                                <span class="visually-hidden">Loading...</span>
                            </div>
                            <p class="mt-2 text-muted">Načítám KPI metriky...</p>
                        </div>
                    </div>
                </div>
            </div>
        `;
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
        const element = document.querySelector(`#value_${widgetId}`);
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
                tbody.innerHTML = `
                    <tr>
                        <td colspan="100%" class="text-center text-muted py-4">
                            <i class="fas fa-info-circle me-2"></i>Žádná data k zobrazení
                        </td>
                    </tr>
                `;
                return;
            }

            // Získej sloupce
            const columns = config.columns || Object.keys(data[0]);

            // Vytvoř hlavičku
            const headerRow = document.createElement('tr');
            columns.forEach(col => {
                const th = document.createElement('th');
                th.textContent = typeof col === 'object' ? col.label : col;
                if (config.sortable !== false) {
                    th.style.cursor = 'pointer';
                    th.onclick = () => this.sortTable(widgetId, col, config);
                }
                headerRow.appendChild(th);
            });
            thead.appendChild(headerRow);

            // Vytvoř řádky
            data.forEach((row, index) => {
                const tr = document.createElement('tr');
                columns.forEach(col => {
                    const td = document.createElement('td');
                    const field = typeof col === 'object' ? col.field : col;
                    const value = this.getFieldValue(row, field);
                    td.textContent = this.formatValue(value, col.format);
                    tr.appendChild(td);
                });
                tbody.appendChild(tr);
            });

        } catch (error) {
            console.error(`❌ Chyba při aktualizaci tabulky ${widgetId}:`, error);
            this.showWidgetError(widgetId, 'Chyba při vytváření tabulky');
        }
    }

    /**
     * Pomocné funkce
     */

    processTemplate(template, data) {
        let result = template;
        for (const [key, value] of Object.entries(data)) {
            const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
            result = result.replace(regex, value);
        }
        return result;
    }

    getFieldValue(obj, field) {
        return field.split('.').reduce((o, key) => o && o[key], obj);
    }

    formatValue(value, format = 'number') {
        if (value === null || value === undefined) return '-';

        switch (format) {
            case 'currency':
                return new Intl.NumberFormat('cs-CZ', { style: 'currency', currency: 'CZK' }).format(value);
            case 'percentage':
                return new Intl.NumberFormat('cs-CZ', { style: 'percent', minimumFractionDigits: 1 }).format(value / 100);
            case 'number':
            default:
                return new Intl.NumberFormat('cs-CZ').format(value);
        }
    }

    showWidgetError(widgetId, message) {
        const container = document.querySelector(`[data-widget-id="${widgetId}"]`);
        if (!container) return;

        container.innerHTML = `
            <div class="card border-danger">
                <div class="card-body text-center">
                    <i class="fas fa-exclamation-triangle fa-2x text-danger mb-3"></i>
                    <h6 class="text-danger">Chyba widgetu</h6>
                    <p class="text-muted mb-0">${message}</p>
                </div>
            </div>
        `;
    }

    createErrorWidget(widgetId, errorMessage) {
        const div = document.createElement('div');
        div.className = 'col-lg-6 mb-4';
        div.setAttribute('data-widget-id', widgetId);
        div.innerHTML = `
            <div class="card border-danger">
                <div class="card-body text-center">
                    <i class="fas fa-exclamation-triangle fa-2x text-danger mb-3"></i>
                    <h6 class="text-danger">Chyba widgetu</h6>
                    <p class="text-muted">${errorMessage}</p>
                </div>
            </div>
        `;
        return div;
    }

    /**
     * Aktualizace widgetu (volané z DashboardCore)
     */
    async updateWidget(widgetId) {
        const widgetConfig = this.core.widgets.get(widgetId);
        if (!widgetConfig) return;

        await this.loadWidgetData(widgetId, widgetConfig);
    }

    /**
     * Globální funkce pro HTML onclick handlers
     */
    static showDetails(widgetId) {
        window.WidgetFactory?.showDetails(widgetId);
    }

    static editWidget(widgetId) {
        window.WidgetFactory?.editWidget(widgetId);
    }

    static removeWidget(widgetId) {
        window.WidgetFactory?.removeWidget(widgetId);
    }

    showDetails(widgetId) {
        if (this.core.detailModal) {
            this.core.detailModal.show(widgetId);
        }
    }

    editWidget(widgetId) {
        if (this.core.configManager) {
            this.core.configManager.editWidget(widgetId);
        }
    }

    removeWidget(widgetId) {
        if (confirm('Opravdu chcete smazat tento widget?')) {
            this.core.widgets.delete(widgetId);
            const element = document.querySelector(`[data-widget-id="${widgetId}"]`);
            if (element) {
                element.remove();
            }
            this.core.saveUserConfiguration();
            this.core.checkEmptyDashboard();
        }
    }
}

// Export pro modul systém
if (typeof module !== 'undefined' && module.exports) {
    module.exports = WidgetFactory;
}

// Globální přiřazení
window.WidgetFactory = WidgetFactory;

console.log('🧩 Widget Factory modul načten - OPRAVENO');
