/**
 * Widget Factory - Továrna pro vytváření a správu widgetů
 * Verze: 3.0 - Modularní architektura 
 * Autor: Dashboard System
 */

class WidgetFactory {
    constructor(dashboardCore) {
        this.core = dashboardCore;
        this.widgetTypes = new Map();
    }

    async init() {
        console.log('🧩 Inicializace WidgetFactory...');
        this.registerDefaultWidgetTypes();
    }

    registerDefaultWidgetTypes() {
        // Metrická karta
        this.widgetTypes.set('metric-card', {
            name: 'Metrická karta',
            icon: 'fas fa-square',
            description: 'Zobrazení jedné metriky s trendem',
            defaultConfig: {
                title: 'Nová metrika',
                width: 3,
                height: 2,
                aggregation: 'count'
            },
            configFields: [
                { key: 'title', label: 'Název', type: 'text', required: true },
                { key: 'field', label: 'Datové pole', type: 'text', required: true },
                { key: 'aggregation', label: 'Agregace', type: 'select', options: [
                    { value: 'count', label: 'Počet' },
                    { value: 'sum', label: 'Součet' },
                    { value: 'avg', label: 'Průměr' },
                    { value: 'min', label: 'Minimum' },
                    { value: 'max', label: 'Maximum' }
                ]},
                { key: 'format', label: 'Formát', type: 'select', options: [
                    { value: 'number', label: 'Číslo' },
                    { value: 'currency', label: 'Měna' },
                    { value: 'percent', label: 'Procenta' }
                ]}
            ],
            render: this.renderMetricCard.bind(this)
        });

        // Graf
        this.widgetTypes.set('chart', {
            name: 'Graf',
            icon: 'fas fa-chart-line',
            description: 'Čárový, sloupcový nebo koláčový graf',
            defaultConfig: {
                title: 'Nový graf',
                width: 6,
                height: 4,
                chartType: 'line'
            },
            configFields: [
                { key: 'title', label: 'Název', type: 'text', required: true },
                { key: 'chartType', label: 'Typ grafu', type: 'select', options: [
                    { value: 'line', label: 'Čárový' },
                    { value: 'bar', label: 'Sloupcový' },
                    { value: 'pie', label: 'Koláčový' }
                ]},
                { key: 'xField', label: 'X osa (pole)', type: 'text' },
                { key: 'yField', label: 'Y osa (pole)', type: 'text' }
            ],
            render: this.renderChart.bind(this)
        });

        // Tabulka
        this.widgetTypes.set('table', {
            name: 'Tabulka',
            icon: 'fas fa-table',
            description: 'Filtrovatelná datová tabulka',
            defaultConfig: {
                title: 'Nová tabulka',
                width: 12,
                height: 6,
                pageSize: 10
            },
            configFields: [
                { key: 'title', label: 'Název', type: 'text', required: true },
                { key: 'pageSize', label: 'Řádků na stránku', type: 'number', defaultValue: 10 },
                { key: 'showSearch', label: 'Zobrazit vyhledávání', type: 'checkbox', defaultValue: true }
            ],
            render: this.renderTable.bind(this)
        });

        console.log('✅ Registrováno', this.widgetTypes.size, 'typů widgetů');
    }

    // ========================================
    // WIDGET RENDERING
    // ========================================

    renderWidget(widgetId, widgetConfig) {
        const widgetType = this.widgetTypes.get(widgetConfig.type);
        if (!widgetType) {
            console.error(`❌ Neznámý typ widgetu: ${widgetConfig.type}`);
            return;
        }

        try {
            const container = this.createWidgetContainer(widgetId, widgetConfig);
            widgetType.render(container, widgetConfig);
            this.addWidgetToGrid(container, widgetConfig);
            
            console.log(`✅ Widget ${widgetId} vykreslen`);
        } catch (error) {
            console.error(`❌ Chyba při vykreslování widgetu ${widgetId}:`, error);
        }
    }

    createWidgetContainer(widgetId, widgetConfig) {
        const container = document.createElement('div');
        container.id = `widget_${widgetId}`;
        container.className = 'dashboard-widget';
        container.innerHTML = `
            <div class="card h-100">
                <div class="card-header d-flex justify-content-between align-items-center">
                    <h6 class="mb-0">${widgetConfig.title || 'Widget'}</h6>
                    <div class="widget-controls">
                        <button class="btn btn-sm btn-outline-secondary" onclick="window.widgetFactory.showWidgetDetail('${widgetId}')" title="Detail">
                            <i class="fas fa-expand"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-secondary" onclick="window.widgetFactory.editWidget('${widgetId}')" title="Upravit">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-danger" onclick="window.widgetFactory.deleteWidget('${widgetId}')" title="Smazat">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
                <div class="card-body widget-content" id="widget-content-${widgetId}">
                    <div class="d-flex justify-content-center align-items-center" style="min-height: 100px;">
                        <div class="spinner-border text-primary" role="status"></div>
                    </div>
                </div>
            </div>
        `;
        return container;
    }

    addWidgetToGrid(container, widgetConfig) {
        const grid = document.getElementById('dashboardGrid');
        if (!grid) {
            console.error('❌ Dashboard grid nenalezen');
            return;
        }

        // Skryj prázdný dashboard
        const emptyDashboard = document.getElementById('emptyDashboard');
        if (emptyDashboard) {
            emptyDashboard.style.display = 'none';
        }

        grid.appendChild(container);
    }

    // ========================================
    // WIDGET TYPE RENDERERS
    // ========================================

    renderMetricCard(container, widgetConfig) {
        const contentDiv = container.querySelector('.widget-content');
        
        // Mock data pro ukázku
        const mockValue = Math.floor(Math.random() * 10000);
        const mockChange = (Math.random() * 20 - 10).toFixed(1);
        const changeClass = mockChange >= 0 ? 'success' : 'danger';
        const changeIcon = mockChange >= 0 ? 'arrow-up' : 'arrow-down';

        contentDiv.innerHTML = `
            <div class="text-center">
                <h2 class="display-4 fw-bold text-primary mb-2">${mockValue.toLocaleString()}</h2>
                <div class="d-flex justify-content-center align-items-center">
                    <span class="badge bg-${changeClass} me-2">
                        <i class="fas fa-${changeIcon} me-1"></i>${Math.abs(mockChange)}%
                    </span>
                    <small class="text-muted">vs. minulý měsíc</small>
                </div>
            </div>
        `;
    }

    renderChart(container, widgetConfig) {
        const contentDiv = container.querySelector('.widget-content');
        const canvasId = `chart_${Date.now()}`;
        
        contentDiv.innerHTML = `
            <canvas id="${canvasId}" width="400" height="200"></canvas>
        `;

        // Vytvoření grafu s mock daty
        setTimeout(() => {
            const ctx = document.getElementById(canvasId);
            if (!ctx) return;

            const mockLabels = ['Leden', 'Únor', 'Březen', 'Duben', 'Květen', 'Červen'];
            const mockData = Array.from({length: 6}, () => Math.floor(Math.random() * 1000));

            new Chart(ctx, {
                type: widgetConfig.chartType || 'line',
                data: {
                    labels: mockLabels,
                    datasets: [{
                        label: widgetConfig.title,
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
                    },
                    scales: {
                        y: {
                            beginAtZero: true
                        }
                    }
                }
            });
        }, 100);
    }

    renderTable(container, widgetConfig) {
        const contentDiv = container.querySelector('.widget-content');
        
        // Mock data pro tabulku
        const mockData = [
            { id: 1, name: 'Jan Novák', department: 'IT', position: 'Developer', salary: 45000 },
            { id: 2, name: 'Marie Svobodová', department: 'Marketing', position: 'Manager', salary: 55000 },
            { id: 3, name: 'Petr Dvořák', department: 'Sales', position: 'Representative', salary: 35000 },
            { id: 4, name: 'Jana Procházková', department: 'HR', position: 'Specialist', salary: 40000 }
        ];

        let tableHtml = `
            ${widgetConfig.showSearch !== false ? `
                <div class="mb-3">
                    <input type="text" class="form-control form-control-sm" placeholder="Vyhledat..." onkeyup="window.widgetFactory.filterTable(this, '${container.id}')">
                </div>
            ` : ''}
            <div class="table-responsive">
                <table class="table table-sm table-striped">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Jméno</th>
                            <th>Oddělení</th>
                            <th>Pozice</th>
                            <th>Plat</th>
                        </tr>
                    </thead>
                    <tbody>
        `;

        mockData.forEach(row => {
            tableHtml += `
                <tr>
                    <td>${row.id}</td>
                    <td>${row.name}</td>
                    <td><span class="badge bg-primary">${row.department}</span></td>
                    <td>${row.position}</td>
                    <td><strong>${row.salary.toLocaleString()} Kč</strong></td>
                </tr>
            `;
        });

        tableHtml += `
                    </tbody>
                </table>
            </div>
        `;

        contentDiv.innerHTML = tableHtml;
    }

    // ========================================
    // WIDGET MANAGEMENT
    // ========================================

    updateWidget(widgetId, data) {
        console.log(`🔄 Aktualizace widgetu ${widgetId} s novými daty`);
        
        const widget = this.core.widgets.get(widgetId);
        if (!widget) return;

        const container = document.getElementById(`widget_${widgetId}`);
        if (!container) return;

        // Re-render widgetu s novými daty
        const widgetType = this.widgetTypes.get(widget.type);
        if (widgetType) {
            const contentDiv = container.querySelector('.widget-content');
            if (contentDiv) {
                // TODO: Předání skutečných dat do rendereru
                widgetType.render(container, { ...widget, data });
            }
        }
    }

    showWidgetDetail(widgetId) {
        const widget = this.core.widgets.get(widgetId);
        if (!widget) return;

        if (this.core.detailModal) {
            this.core.detailModal.show(widgetId, widget);
        }
    }

    editWidget(widgetId) {
        console.log(`✏️ Editace widgetu: ${widgetId}`);
        // TODO: Otevřít konfigurační modal pro widget
        this.core.showToast('Editace widgetu bude implementována', 'info');
    }

    deleteWidget(widgetId) {
        if (confirm('Opravdu chcete smazat tento widget?')) {
            this.core.removeWidget(widgetId);
        }
    }

    // ========================================
    // TABLE UTILITIES
    // ========================================

    filterTable(searchInput, containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        const table = container.querySelector('table tbody');
        if (!table) return;

        const filter = searchInput.value.toLowerCase();
        const rows = table.querySelectorAll('tr');

        rows.forEach(row => {
            const text = row.textContent.toLowerCase();
            row.style.display = text.includes(filter) ? '' : 'none';
        });
    }

    // ========================================
    // HELPER METHODS
    // ========================================

    getAvailableWidgetTypes() {
        const types = {};
        this.widgetTypes.forEach((config, type) => {
            types[type] = {
                name: config.name,
                icon: config.icon,
                description: config.description,
                defaultConfig: config.defaultConfig
            };
        });
        return types;
    }

    registerWidgetType(type, config) {
        this.widgetTypes.set(type, config);
        console.log(`✅ Registrován widget typ: ${type}`);
    }
}

// Export for module system
if (typeof module !== 'undefined' && module.exports) {
    module.exports = WidgetFactory;
}

// Global assignment for HTML onclick handlers
window.widgetFactory = null;

console.log('🧩 Widget Factory modul načten');
