/**
 * Widget Factory - Továrna na widgety (FUNKČNÍ VERZE)
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
        
        // Globální přiřazení pro HTML onclick handlers
        window.WidgetFactory = this;
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
                    { key: 'title', label: 'Název metriky', type: 'text', required: true },
                    { key: 'dataSource', label: 'Zdroj dat', type: 'data-source', required: true },
                    { key: 'aggregation', label: 'Agregace', type: 'select', options: [
                        { value: 'sum', label: 'Součet' },
                        { value: 'average', label: 'Průměr' },
                        { value: 'count', label: 'Počet' },
                        { value: 'max', label: 'Maximum' },
                        { value: 'min', label: 'Minimum' }
                    ], defaultValue: 'count' },
                    { key: 'format', label: 'Formát zobrazení', type: 'select', options: [
                        { value: 'number', label: 'Číslo' },
                        { value: 'currency', label: 'Měna' },
                        { value: 'percentage', label: 'Procenta' }
                    ], defaultValue: 'number' }
                ]
            }],
            ['line-chart', {
                name: 'Čárový graf',
                icon: 'fas fa-chart-line',
                description: 'Zobrazení trendů v čase',
                category: 'charts',
                configFields: [
                    { key: 'title', label: 'Název grafu', type: 'text', required: true },
                    { key: 'dataSource', label: 'Zdroj dat', type: 'data-source', required: true }
                ]
            }],
            ['bar-chart', {
                name: 'Sloupcový graf',
                icon: 'fas fa-chart-column',
                description: 'Porovnání kategorií',
                category: 'charts',
                configFields: [
                    { key: 'title', label: 'Název grafu', type: 'text', required: true },
                    { key: 'dataSource', label: 'Zdroj dat', type: 'data-source', required: true }
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
                    { key: 'pageSize', label: 'Počet řádků na stránku', type: 'number', defaultValue: 10 }
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
                                <li><hr class="dropdown-divider"></li>
                                <li><a class="dropdown-item text-danger" href="#" onclick="window.WidgetFactory.removeWidget('{{id}}')">
                                    <i class="fas fa-trash me-2"></i>Smazat
                                </a></li>
                            </ul>
                        </div>
                    </div>
                </div>
                <div class="card-body text-center">
                    <div class="widget-value display-4 fw-bold mb-2 text-primary" id="value_{{id}}">
                        <div class="spinner-border" role="status">
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
                <div class="card-header">
                    <h6 class="card-title mb-0">{{title}}</h6>
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
                <div class="card-header">
                    <h6 class="card-title mb-0">{{title}}</h6>
                </div>
                <div class="card-body">
                    <div class="table-responsive">
                        <table class="table table-sm table-striped" id="table_{{id}}">
                            <thead></thead>
                            <tbody></tbody>
                        </table>
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

            // Bezpečné načítání dat - nekončí chybou pokud zdroj neexistuje
            try {
                await this.loadWidgetData(widgetId, widgetConfig);
            } catch (dataError) {
                console.warn(`⚠️ Nelze načíst data pro widget ${widgetId}:`, dataError.message);
                this.showWidgetWarning(widgetId, 'Datový zdroj není dostupný');
            }

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
                html = this.renderChart(widgetId, config);
                break;
            case 'data-table':
                html = this.renderTable(widgetId, config);
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
            title: config.title || 'Metrika'
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
            title: config.title || 'Tabulka'
        });
    }

    /**
     * Načtení dat pro widget - BEZPEČNÉ
     */
    async loadWidgetData(widgetId, config) {
        // Kontrola existence datového zdroje
        if (!config.dataSource) {
            console.warn(`⚠️ Widget ${widgetId} nemá nakonfigurovaný zdroj dat`);
            this.showWidgetWarning(widgetId, 'Chybí datový zdroj');
            return;
        }

        // Kontrola existence zdroje v core.dataSources
        if (!this.core.dataSources.has(config.dataSource)) {
            console.warn(`⚠️ Datový zdroj ${config.dataSource} pro widget ${widgetId} neexistuje`);
            this.showWidgetWarning(widgetId, 'Datový zdroj neexistuje');
            return;
        }

        try {
            // Získej data ze zdroje
            const sourceData = this.core.dataManager.getSourceData(config.dataSource);
            if (!sourceData) {
                console.warn(`⚠️ Data pro zdroj ${config.dataSource} nejsou dostupná`);
                this.showWidgetWarning(widgetId, 'Data nejsou načtena');
                return;
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

        // Omez počet záznamů pro výkon
        if (config.limit && config.limit > 0) {
            processedData = processedData.slice(0, config.limit);
        }

        return processedData;
    }

    /**
     * Aktualizace obsahu widgetu
     */
    async updateWidgetContent(widgetId, data, config) {
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
            case 'data-table':
                this.updateDataTable(widgetId, data, config);
                break;
            default:
                console.warn(`⚠️ Aktualizace pro typ ${config.type} není implementována`);
        }
    }

    /**
     * Aktualizace metrické karty
     */
    updateMetricCard(widgetId, data, config) {
        const element = document.querySelector(`#value_${widgetId}`);
        if (!element) return;

        try {
            let value = 0;

            if (Array.isArray(data) && data.length > 0) {
                switch (config.aggregation || 'count') {
                    case 'count':
                        value = data.length;
                        break;
                    case 'sum':
                        // Mock hodnota pro ukázku
                        value = Math.floor(Math.random() * 100000);
                        break;
                    default:
                        value = data.length;
                }
            }

            // Formátuj hodnotu
            const formattedValue = this.formatValue(value, config.format);
            element.textContent = formattedValue;

            // Aktualizuj časová razítka
            const updatedElement = document.querySelector(`#updated_${widgetId}`);
            if (updatedElement) {
                updatedElement.textContent = new Date().toLocaleTimeString('cs-CZ');
            }

            const changeElement = document.querySelector(`#change_${widgetId}`);
            if (changeElement) {
                // Mock trend pro ukázku
                const changePercent = (Math.random() * 20 - 10).toFixed(1);
                const changeClass = parseFloat(changePercent) >= 0 ? 'success' : 'danger';
                const changeIcon = parseFloat(changePercent) >= 0 ? 'arrow-up' : 'arrow-down';
                
                changeElement.innerHTML = `
                    <span class="badge bg-${changeClass} me-2">
                        <i class="fas fa-${changeIcon} me-1"></i>${Math.abs(changePercent)}%
                    </span>
                    <small class="text-muted">vs. minulý měsíc</small>
                `;
            }

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

            // Mock data pro ukázku
            const mockLabels = ['Leden', 'Únor', 'Březen', 'Duben', 'Květen', 'Červen'];
            const mockData = Array.from({length: 6}, () => Math.floor(Math.random() * 1000));

            // Vytvoření grafu
            if (window.Chart) {
                canvas.chart = new Chart(ctx, {
                    type: 'line',
                    data: {
                        labels: mockLabels,
                        datasets: [{
                            label: config.title || 'Data',
                            data: mockData,
                            borderColor: 'rgb(75, 192, 192)',
                            backgroundColor: 'rgba(75, 192, 192, 0.1)',
                            tension: 0.4
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: {
                                display: false
                            }
                        }
                    }
                });
            }

        } catch (error) {
            console.error(`❌ Chyba při aktualizaci čárového grafu ${widgetId}:`, error);
        }
    }

    /**
     * Aktualizace sloupcového grafu
     */
    updateBarChart(widgetId, data, config) {
        const canvas = document.getElementById(`chart_${widgetId}`);
        if (!canvas) return;

        try {
            const ctx = canvas.getContext('2d');

            // Zničení existujícího grafu
            if (canvas.chart) {
                canvas.chart.destroy();
            }

            // Mock data pro ukázku
            const mockLabels = ['Kategorie A', 'Kategorie B', 'Kategorie C', 'Kategorie D'];
            const mockData = Array.from({length: 4}, () => Math.floor(Math.random() * 1000));

            // Vytvoření grafu
            if (window.Chart) {
                canvas.chart = new Chart(ctx, {
                    type: 'bar',
                    data: {
                        labels: mockLabels,
                        datasets: [{
                            label: config.title || 'Data',
                            data: mockData,
                            backgroundColor: [
                                'rgba(255, 99, 132, 0.2)',
                                'rgba(54, 162, 235, 0.2)',
                                'rgba(255, 205, 86, 0.2)',
                                'rgba(75, 192, 192, 0.2)'
                            ],
                            borderColor: [
                                'rgba(255, 99, 132, 1)',
                                'rgba(54, 162, 235, 1)',
                                'rgba(255, 205, 86, 1)',
                                'rgba(75, 192, 192, 1)'
                            ],
                            borderWidth: 1
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: {
                                display: false
                            }
                        },
                        scales: {
                            y: {
                                beginAtZero: true
                            }
                        }
                    }
                });
            }

        } catch (error) {
            console.error(`❌ Chyba při aktualizaci sloupcového grafu ${widgetId}:`, error);
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
            const columns = Object.keys(data[0]);

            // Vytvoř hlavičku
            const headerRow = document.createElement('tr');
            columns.forEach(col => {
                const th = document.createElement('th');
                th.textContent = col;
                headerRow.appendChild(th);
            });
            thead.appendChild(headerRow);

            // Vytvoř řádky (omez na prvních 10 pro výkon)
            const displayData = data.slice(0, config.pageSize || 10);
            displayData.forEach(row => {
                const tr = document.createElement('tr');
                columns.forEach(col => {
                    const td = document.createElement('td');
                    const value = row[col];
                    td.textContent = this.formatValue(value);
                    tr.appendChild(td);
                });
                tbody.appendChild(tr);
            });

            // Pokud je více dat, ukaž poznámku
            if (data.length > (config.pageSize || 10)) {
                const noteRow = document.createElement('tr');
                const noteCell = document.createElement('td');
                noteCell.colSpan = columns.length;
                noteCell.className = 'text-center text-muted py-2';
                noteCell.innerHTML = `<small>Zobrazeno prvních ${config.pageSize || 10} z ${data.length} záznamů</small>`;
                noteRow.appendChild(noteCell);
                tbody.appendChild(noteRow);
            }

        } catch (error) {
            console.error(`❌ Chyba při aktualizaci tabulky ${widgetId}:`, error);
        }
    }

    /**
     * Zobrazení varování u widgetu
     */
    showWidgetWarning(widgetId, message) {
        const element = document.querySelector(`#value_${widgetId}`);
        if (element) {
            element.innerHTML = `<i class="fas fa-exclamation-triangle text-warning"></i>`;
        }

        const changeElement = document.querySelector(`#change_${widgetId}`);
        if (changeElement) {
            changeElement.innerHTML = `<small class="text-warning"><i class="fas fa-exclamation-triangle me-1"></i>${message}</small>`;
        }
    }

    /**
     * Zobrazení chyby u widgetu
     */
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

    /**
     * Vytvoření error widgetu
     */
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
     * Pomocné funkce
     */
    processTemplate(template, data) {
        let result = template;
        for (const [key, value] of Object.entries(data)) {
            const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
            result = result.replace(regex, value || '');
        }
        return result;
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
                if (typeof value === 'number') {
                    return new Intl.NumberFormat('cs-CZ').format(value);
                }
                return String(value);
        }
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
            this.core.removeWidget(widgetId);
        }
    }
}

// Export pro modul systém
if (typeof module !== 'undefined' && module.exports) {
    module.exports = WidgetFactory;
}

console.log('🧩 Widget Factory načten - FUNKČNÍ VERZE');
