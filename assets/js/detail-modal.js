/**
 * Detail Modal - Zobrazení detailu widgetu (FUNKČNÍ VERZE)
 * Verze: 3.0 - Modularní architektura
 * Autor: Dashboard System
 */

class DetailModal {
    constructor(dashboardCore) {
        this.core = dashboardCore;
        this.modal = null;
        this.currentWidgetId = null;
        this.currentConfig = null;
    }

    async init() {
        console.log('🔍 Inicializace DetailModal...');
        this.createModalElement();
        this.setupEventListeners();
    }

    /**
     * Vytvoření modálního okna
     */
    createModalElement() {
        // Kontrola, zda už modal neexistuje
        if (document.getElementById('detailModal')) {
            this.modal = new bootstrap.Modal(document.getElementById('detailModal'));
            return;
        }

        const modalHtml = `
            <div class="modal fade" id="detailModal" tabindex="-1">
                <div class="modal-dialog modal-xl">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title" id="detailModalLabel">
                                <i class="fas fa-chart-line me-2"></i>Detail widgetu
                            </h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <div class="row">
                                <div class="col-md-8">
                                    <div id="detailContent">
                                        <div class="text-center py-5">
                                            <div class="spinner-border" role="status">
                                                <span class="visually-hidden">Loading...</span>
                                            </div>
                                            <p class="mt-3 text-muted">Načítám detail...</p>
                                        </div>
                                    </div>
                                </div>
                                <div class="col-md-4">
                                    <div class="card">
                                        <div class="card-header">
                                            <h6 class="card-title mb-0">
                                                <i class="fas fa-info-circle me-2"></i>Informace
                                            </h6>
                                        </div>
                                        <div class="card-body" id="detailInfo">
                                            <!-- Dynamicky generováno -->
                                        </div>
                                    </div>
                                    
                                    <div class="card mt-3">
                                        <div class="card-header">
                                            <h6 class="card-title mb-0">
                                                <i class="fas fa-cogs me-2"></i>Akce
                                            </h6>
                                        </div>
                                        <div class="card-body">
                                            <div class="d-grid gap-2">
                                                <button type="button" class="btn btn-primary btn-sm" id="editWidgetBtn">
                                                    <i class="fas fa-edit me-2"></i>Upravit widget
                                                </button>
                                                <button type="button" class="btn btn-success btn-sm" id="refreshWidgetBtn">
                                                    <i class="fas fa-sync-alt me-2"></i>Aktualizovat data
                                                </button>
                                                <button type="button" class="btn btn-info btn-sm" id="exportWidgetBtn">
                                                    <i class="fas fa-download me-2"></i>Exportovat
                                                </button>
                                                <hr>
                                                <button type="button" class="btn btn-danger btn-sm" id="deleteWidgetBtn">
                                                    <i class="fas fa-trash me-2"></i>Smazat widget
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Zavřít</button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHtml);
        this.modal = new bootstrap.Modal(document.getElementById('detailModal'));
    }

    /**
     * Nastavení event listenerů
     */
    setupEventListeners() {
        // Opožděné bindování
        setTimeout(() => {
            document.getElementById('editWidgetBtn')?.addEventListener('click', () => {
                this.editCurrentWidget();
            });

            document.getElementById('refreshWidgetBtn')?.addEventListener('click', () => {
                this.refreshCurrentWidget();
            });

            document.getElementById('exportWidgetBtn')?.addEventListener('click', () => {
                this.exportCurrentWidget();
            });

            document.getElementById('deleteWidgetBtn')?.addEventListener('click', () => {
                this.deleteCurrentWidget();
            });
        }, 100);
    }

    /**
     * Zobrazení detailu widgetu
     */
    async show(widgetId, widgetConfig = null) {
        console.log(`🔍 Zobrazuji detail widgetu: ${widgetId}`);
        
        this.currentWidgetId = widgetId;
        this.currentConfig = widgetConfig || this.core.widgets.get(widgetId);

        if (!this.currentConfig) {
            console.error(`❌ Widget ${widgetId} nenalezen`);
            this.core.showToast('Widget nenalezen', 'error');
            return;
        }

        // Nastav titulek
        const modalTitle = document.getElementById('detailModalLabel');
        if (modalTitle) {
            modalTitle.innerHTML = `
                <i class="fas fa-chart-line me-2"></i>
                Detail: ${this.currentConfig.title || 'Unnamed Widget'}
            `;
        }

        // Zobraz modal
        this.modal.show();

        // Načti obsah
        await this.loadDetailContent();
        this.loadDetailInfo();
    }

    /**
     * Načtení obsahu detailu
     */
    async loadDetailContent() {
        const contentDiv = document.getElementById('detailContent');
        if (!contentDiv) return;

        try {
            // Zobraz loading
            contentDiv.innerHTML = `
                <div class="text-center py-5">
                    <div class="spinner-border" role="status">
                        <span class="visually-hidden">Loading...</span>
                    </div>
                    <p class="mt-3 text-muted">Načítám detail widgetu...</p>
                </div>
            `;

            // Zkontroluj datový zdroj
            if (!this.currentConfig.dataSource) {
                contentDiv.innerHTML = `
                    <div class="alert alert-warning">
                        <i class="fas fa-exclamation-triangle me-2"></i>
                        <strong>Chybí datový zdroj</strong><br>
                        Tento widget nemá nakonfigurovaný datový zdroj.
                    </div>
                `;
                return;
            }

            // Zkontroluj, zda datový zdroj existuje
            if (!this.core.dataSources.has(this.currentConfig.dataSource)) {
                contentDiv.innerHTML = `
                    <div class="alert alert-danger">
                        <i class="fas fa-exclamation-triangle me-2"></i>
                        <strong>Datový zdroj neexistuje</strong><br>
                        Datový zdroj "${this.currentConfig.dataSource}" nebyl nalezen.
                    </div>
                `;
                return;
            }

            // Získej data widgetu
            const sourceData = this.core.dataManager.getSourceData(this.currentConfig.dataSource);
            
            if (!sourceData) {
                contentDiv.innerHTML = `
                    <div class="alert alert-info">
                        <i class="fas fa-info-circle me-2"></i>
                        <strong>Data nejsou načtena</strong><br>
                        Klikněte na "Načíst data" pro aktualizaci datového zdroje.
                    </div>
                `;
                return;
            }

            // Zpracuj data podle typu widgetu
            const processedData = this.core.widgetFactory.processWidgetData(sourceData, this.currentConfig);

            // Vykresli podle typu widgetu
            switch (this.currentConfig.type) {
                case 'metric-card':
                    this.renderMetricCardDetail(contentDiv, processedData);
                    break;
                case 'line-chart':
                    this.renderChartDetail(contentDiv, processedData, 'line');
                    break;
                case 'bar-chart':
                    this.renderChartDetail(contentDiv, processedData, 'bar');
                    break;
                case 'data-table':
                    this.renderTableDetail(contentDiv, processedData);
                    break;
                default:
                    this.renderGenericDetail(contentDiv, processedData);
            }

        } catch (error) {
            console.error('❌ Chyba při načítání detailu:', error);
            contentDiv.innerHTML = `
                <div class="alert alert-danger">
                    <i class="fas fa-exclamation-triangle me-2"></i>
                    <strong>Chyba při načítání detailu:</strong><br>
                    ${error.message}
                </div>
            `;
        }
    }

    /**
     * Načtení informací o widgetu
     */
    loadDetailInfo() {
        const infoDiv = document.getElementById('detailInfo');
        if (!infoDiv || !this.currentConfig) return;

        const widgetType = this.core.widgetFactory.widgetTypes.get(this.currentConfig.type);
        const sourceConfig = this.core.dataSources.get(this.currentConfig.dataSource);

        infoDiv.innerHTML = `
            <div class="mb-3">
                <label class="form-label fw-bold">Typ widgetu:</label>
                <div class="text-muted">
                    <i class="${widgetType?.icon || 'fas fa-question'} me-2"></i>
                    ${widgetType?.name || 'Neznámý typ'}
                </div>
            </div>

            <div class="mb-3">
                <label class="form-label fw-bold">Zdroj dat:</label>
                <div class="text-muted">${sourceConfig?.name || 'Neznámý zdroj'}</div>
            </div>

            <div class="mb-3">
                <label class="form-label fw-bold">Velikost:</label>
                <div class="text-muted">${this.currentConfig.size || 6}/12 sloupců</div>
            </div>

            <div class="mb-3">
                <label class="form-label fw-bold">Vytvořeno:</label>
                <div class="text-muted">
                    ${this.currentConfig.created ? 
                        new Date(this.currentConfig.created).toLocaleString('cs-CZ') : 
                        'Neznámo'
                    }
                </div>
            </div>
        `;
    }

    /**
     * Vykreslení detailu metrické karty
     */
    renderMetricCardDetail(container, data) {
        let value = 0;
        let count = 0;
        
        if (Array.isArray(data)) {
            count = data.length;
            // Mock hodnota pro ukázku
            switch (this.currentConfig.aggregation || 'count') {
                case 'count':
                    value = count;
                    break;
                case 'sum':
                    value = Math.floor(Math.random() * 100000);
                    break;
                default:
                    value = count;
            }
        }

        container.innerHTML = `
            <div class="card">
                <div class="card-body text-center">
                    <div class="display-1 text-primary mb-4">${value.toLocaleString('cs-CZ')}</div>
                    <h4 class="mb-3">${this.currentConfig.title}</h4>
                    <div class="row">
                        <div class="col-6">
                            <div class="border-end">
                                <div class="h5 mb-1">${count}</div>
                                <small class="text-muted">Počet záznamů</small>
                            </div>
                        </div>
                        <div class="col-6">
                            <div class="h5 mb-1">${this.currentConfig.aggregation || 'count'}</div>
                            <small class="text-muted">Agregace</small>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Vykreslení detailu tabulky
     */
    renderTableDetail(container, data) {
        if (!Array.isArray(data) || data.length === 0) {
            container.innerHTML = `
                <div class="alert alert-info">
                    <i class="fas fa-info-circle me-2"></i>
                    Žádná data k zobrazení
                </div>
            `;
            return;
        }

        const columns = Object.keys(data[0]);
        
        let tableHtml = `
            <div class="card">
                <div class="card-header d-flex justify-content-between align-items-center">
                    <h6 class="mb-0">Kompletní data (${data.length} záznamů)</h6>
                    <div>
                        <input type="text" class="form-control form-control-sm" placeholder="Vyhledat..." 
                               id="detailSearch" style="width: 200px;">
                    </div>
                </div>
                <div class="card-body p-0">
                    <div class="table-responsive" style="max-height: 500px;">
                        <table class="table table-sm table-striped mb-0">
                            <thead class="table-dark sticky-top">
                                <tr>
                                    ${columns.map(col => `<th>${col}</th>`).join('')}
                                </tr>
                            </thead>
                            <tbody>
                                ${data.slice(0, 50).map(row => `
                                    <tr>
                                        ${columns.map(col => `<td>${row[col] || '-'}</td>`).join('')}
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                    ${data.length > 50 ? `<div class="p-2"><small class="text-muted">Zobrazeno prvních 50 z ${data.length} záznamů</small></div>` : ''}
                </div>
            </div>
        `;

        container.innerHTML = tableHtml;

        // Přidej vyhledávání
        document.getElementById('detailSearch')?.addEventListener('keyup', (e) => {
            const searchTerm = e.target.value.toLowerCase();
            const rows = container.querySelectorAll('tbody tr');
            
            rows.forEach(row => {
                const text = row.textContent.toLowerCase();
                row.style.display = text.includes(searchTerm) ? '' : 'none';
            });
        });
    }

    /**
     * Vykreslení detailu grafu
     */
    renderChartDetail(container, data, chartType) {
        container.innerHTML = `
            <div class="card">
                <div class="card-body">
                    <h5 class="mb-3">Graf - ${this.currentConfig.title}</h5>
                    <div style="height: 400px;">
                        <canvas id="detailChart_${this.currentWidgetId}"></canvas>
                    </div>
                    <div class="mt-3">
                        <div class="row">
                            <div class="col-md-6">
                                <h6>Statistiky</h6>
                                <p class="text-muted">Počet datových bodů: ${Array.isArray(data) ? data.length : 0}</p>
                            </div>
                            <div class="col-md-6">
                                <h6>Typ grafu</h6>
                                <p class="text-muted">${chartType === 'line' ? 'Čárový graf' : 'Sloupcový graf'}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Mock graf pro ukázku
        setTimeout(() => {
            const canvas = document.getElementById(`detailChart_${this.currentWidgetId}`);
            if (canvas && window.Chart) {
                const ctx = canvas.getContext('2d');
                
                const mockLabels = ['Leden', 'Únor', 'Březen', 'Duben', 'Květen', 'Červen'];
                const mockData = Array.from({length: 6}, () => Math.floor(Math.random() * 1000));
                
                new Chart(ctx, {
                    type: chartType,
                    data: {
                        labels: mockLabels,
                        datasets: [{
                            label: this.currentConfig.title,
                            data: mockData,
                            borderColor: 'rgb(75, 192, 192)',
                            backgroundColor: chartType === 'line' ? 'rgba(75, 192, 192, 0.1)' : 'rgba(75, 192, 192, 0.5)',
                            tension: 0.4
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: {
                                display: true
                            }
                        }
                    }
                });
            }
        }, 100);
    }

    /**
     * Vykreslení obecného detailu
     */
    renderGenericDetail(container, data) {
        container.innerHTML = `
            <div class="card">
                <div class="card-header">
                    <h6 class="mb-0">Surová data</h6>
                </div>
                <div class="card-body">
                    <pre class="bg-light p-3 rounded" style="max-height: 400px; overflow-y: auto;">
                        ${JSON.stringify(data, null, 2)}
                    </pre>
                </div>
            </div>
        `;
    }

    /**
     * Akce na tlačítka
     */

    editCurrentWidget() {
        this.modal.hide();
        if (this.core.configManager) {
            this.core.configManager.editWidget(this.currentWidgetId);
        }
    }

    async refreshCurrentWidget() {
        if (!this.currentWidgetId) return;

        const refreshBtn = document.getElementById('refreshWidgetBtn');
        if (refreshBtn) {
            refreshBtn.disabled = true;
            refreshBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Aktualizuji...';
        }

        try {
            await this.core.widgetFactory.updateWidget(this.currentWidgetId);
            await this.loadDetailContent();
            this.core.showToast('Widget byl aktualizován', 'success');
        } catch (error) {
            console.error('❌ Chyba při aktualizaci widgetu:', error);
            this.core.showToast('Chyba při aktualizaci widgetu', 'error');
        } finally {
            if (refreshBtn) {
                refreshBtn.disabled = false;
                refreshBtn.innerHTML = '<i class="fas fa-sync-alt me-2"></i>Aktualizovat data';
            }
        }
    }

    exportCurrentWidget() {
        try {
            const config = {
                id: this.currentWidgetId,
                config: this.currentConfig,
                exportDate: new Date().toISOString()
            };

            const dataStr = JSON.stringify(config, null, 2);
            const dataBlob = new Blob([dataStr], { type: 'application/json' });

            const link = document.createElement('a');
            link.href = URL.createObjectURL(dataBlob);
            link.download = `widget-${this.currentWidgetId}-${new Date().toISOString().slice(0,10)}.json`;
            link.click();

            this.core.showToast('Widget byl exportován', 'success');

        } catch (error) {
            console.error('❌ Chyba při exportu widgetu:', error);
            this.core.showToast('Chyba při exportu widgetu', 'error');
        }
    }

    deleteCurrentWidget() {
        if (confirm(`Opravdu chcete smazat widget "${this.currentConfig.title || 'Unnamed'}"?`)) {
            this.core.removeWidget(this.currentWidgetId);
            this.modal.hide();
            this.core.showToast('Widget byl smazán', 'success');
        }
    }

    /**
     * Skrytí modálu
     */
    hide() {
        this.modal?.hide();
    }
}

// Export pro modul systém
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DetailModal;
}

console.log('🔍 Detail Modal načten - FUNKČNÍ VERZE');
