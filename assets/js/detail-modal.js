/**
 * Detail Modal - Zobrazování detailních informací o widgetech
 * Verze: 3.0 - Modularní architektura
 * Autor: Dashboard System
 */

class DetailModal {
    constructor(dashboardCore) {
        this.core = dashboardCore;
        this.modal = null;
        this.currentWidget = null;
        this.currentData = null;
    }

    async init() {
        console.log('🔍 Inicializace DetailModal...');
        this.setupModal();
    }

    /**
     * Nastavení modal dialogu
     */
    setupModal() {
        this.modal = document.getElementById('detailModal');
        
        if (this.modal) {
            // Export tlačítko
            const exportBtn = document.getElementById('exportDetailBtn');
            if (exportBtn) {
                exportBtn.addEventListener('click', () => this.exportCurrentData());
            }
        }
    }

    /**
     * Zobrazení detailů widgetu
     */
    async showWidgetDetails(widgetId) {
        console.log(`🔍 Zobrazuji detail widgetu: ${widgetId}`);
        
        if (!this.modal) {
            console.error('Detail modal není k dispozici');
            return;
        }

        this.currentWidget = widgetId;
        const widgetConfig = this.core.widgets.get(widgetId);
        
        if (!widgetConfig) {
            this.showError('Widget nebyl nalezen');
            return;
        }

        try {
            // Nastav titul modal
            this.setModalTitle(widgetConfig.title || widgetId, widgetConfig.type);
            
            // Zobraz loading
            this.showLoading();
            
            // Získej data
            const data = await this.getWidgetDetailData(widgetId, widgetConfig);
            this.currentData = data;
            
            // Vykresli detail podle typu widgetu
            await this.renderDetailContent(widgetId, widgetConfig, data);
            
            // Zobraz modal
            const bsModal = new bootstrap.Modal(this.modal);
            bsModal.show();
            
        } catch (error) {
            console.error(`❌ Chyba při zobrazování detailu widgetu ${widgetId}:`, error);
            this.showError('Chyba při načítání detailu: ' + error.message);
        }
    }

    /**
     * Nastavení titulku modal
     */
    setModalTitle(title, type) {
        const titleElement = document.getElementById('detailModalTitle');
        if (titleElement) {
            const widgetType = this.core.widgetFactory.widgetTypes.get(type);
            const icon = widgetType?.icon || 'fas fa-search';
            
            titleElement.innerHTML = `
                <i class="${icon} me-2"></i>
                Detail: ${title}
            `;
        }
    }

    /**
     * Zobrazení loading stavu
     */
    showLoading() {
        const content = document.getElementById('detailContent');
        if (content) {
            content.innerHTML = `
                <div class="text-center py-5">
                    <div class="spinner-border text-primary" role="status"></div>
                    <div class="mt-3">Načítám detailní data...</div>
                </div>
            `;
        }
    }

    /**
     * Zobrazení chybové zprávy
     */
    showError(message) {
        const content = document.getElementById('detailContent');
        if (content) {
            content.innerHTML = `
                <div class="alert alert-danger" role="alert">
                    <i class="fas fa-exclamation-triangle me-2"></i>
                    ${message}
                </div>
            `;
        }
    }

    /**
     * Získání detailních dat pro widget
     */
    async getWidgetDetailData(widgetId, widgetConfig) {
        if (!widgetConfig.dataSource) {
            throw new Error('Widget nemá nakonfigurovaný zdroj dat');
        }

        // Získej raw data ze zdroje
        let sourceData = this.core.dataManager.getSourceData(widgetConfig.dataSource);
        
        if (!sourceData) {
            // Pokud data nejsou v cache, pokus se je načíst
            const sourceConfig = this.core.dataSources.get(widgetConfig.dataSource);
            if (sourceConfig) {
                sourceData = await this.core.dataManager.loadDataSource(widgetConfig.dataSource, sourceConfig);
            }
        }

        if (!sourceData) {
            throw new Error('Data nejsou dostupná');
        }

        return sourceData;
    }

    /**
     * Vykreslení detailního obsahu
     */
    async renderDetailContent(widgetId, widgetConfig, data) {
        const content = document.getElementById('detailContent');
        if (!content) return;

        switch (widgetConfig.type) {
            case 'metric-card':
                this.renderMetricDetail(content, widgetConfig, data);
                break;
                
            case 'line-chart':
            case 'bar-chart':
            case 'pie-chart':
                this.renderChartDetail(content, widgetId, widgetConfig, data);
                break;
                
            case 'data-table':
                this.renderTableDetail(content, widgetConfig, data);
                break;
                
            case 'kpi-grid':
                this.renderKpiDetail(content, widgetConfig, data);
                break;
                
            default:
                this.renderGenericDetail(content, widgetConfig, data);
        }
    }

    /**
     * Detail pro metrickou kartu
     */
    renderMetricDetail(content, config, data) {
        let html = `
            <div class="row">
                <div class="col-md-6">
                    <div class="card">
                        <div class="card-header">
                            <h6><i class="fas fa-chart-line me-2"></i>Detaily metriky</h6>
                        </div>
                        <div class="card-body">
        `;

        if (Array.isArray(data) && data.length > 0) {
            // Vypočítej všechny agregace
            const values = data.map(row => this.getNestedValue(row, config.valueField))
                             .filter(v => typeof v === 'number');
            
            if (values.length > 0) {
                const sum = values.reduce((a, b) => a + b, 0);
                const avg = sum / values.length;
                const min = Math.min(...values);
                const max = Math.max(...values);
                const count = values.length;
                
                html += `
                    <table class="table table-sm">
                        <tr><td><strong>Počet záznamů:</strong></td><td>${count}</td></tr>
                        <tr><td><strong>Součet:</strong></td><td>${this.core.formatNumber(sum)}</td></tr>
                        <tr><td><strong>Průměr:</strong></td><td>${this.core.formatNumber(avg)}</td></tr>
                        <tr><td><strong>Minimum:</strong></td><td>${this.core.formatNumber(min)}</td></tr>
                        <tr><td><strong>Maximum:</strong></td><td>${this.core.formatNumber(max)}</td></tr>
                        <tr><td><strong>Rozptyl:</strong></td><td>${this.core.formatNumber(max - min)}</td></tr>
                    </table>
                `;
            } else {
                html += `<p class="text-muted">Žádná numerická data k zobrazení.</p>`;
            }
        } else {
            html += `<p class="text-muted">Žádná data k zobrazení.</p>`;
        }

        html += `
                        </div>
                    </div>
                </div>
                <div class="col-md-6">
                    <div class="card">
                        <div class="card-header">
                            <h6><i class="fas fa-table me-2"></i>Poslední záznamy</h6>
                        </div>
                        <div class="card-body">
        `;

        // Zobraz posledních 10 záznamů
        if (Array.isArray(data) && data.length > 0) {
            const recentData = data.slice(-10);
            
            html += `<div class="table-responsive">
                <table class="table table-sm table-striped">
                    <thead>
                        <tr>
                            <th>Pořadí</th>
                            <th>${config.valueField}</th>
                        </tr>
                    </thead>
                    <tbody>
            `;
            
            recentData.forEach((row, index) => {
                const value = this.getNestedValue(row, config.valueField);
                html += `
                    <tr>
                        <td>${data.length - recentData.length + index + 1}</td>
                        <td>${this.formatValue(value, config.format)}</td>
                    </tr>
                `;
            });
            
            html += `</tbody></table></div>`;
        }

        html += `
                        </div>
                    </div>
                </div>
            </div>
        `;

        content.innerHTML = html;
    }

    /**
     * Detail pro graf
     */
    renderChartDetail(content, widgetId, config, data) {
        let html = `
            <div class="row">
                <div class="col-md-8">
                    <div class="card">
                        <div class="card-header">
                            <h6><i class="fas fa-chart-area me-2"></i>Rozšířený graf</h6>
                        </div>
                        <div class="card-body">
                            <div class="chart-container" style="height: 400px;">
                                <canvas id="detailChart_${widgetId}"></canvas>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="col-md-4">
                    <div class="card">
                        <div class="card-header">
                            <h6><i class="fas fa-info-circle me-2"></i>Statistiky</h6>
                        </div>
                        <div class="card-body">
        `;

        // Statistiky dat
        if (Array.isArray(data) && data.length > 0) {
            const stats = this.calculateChartStats(data, config);
            
            html += `
                <table class="table table-sm">
                    <tr><td><strong>Počet bodů:</strong></td><td>${stats.dataPoints}</td></tr>
                    <tr><td><strong>Rozsah dat:</strong></td><td>${stats.dateRange}</td></tr>
                    ${stats.valueStats ? `
                        <tr><td><strong>Průměrná hodnota:</strong></td><td>${this.core.formatNumber(stats.valueStats.avg)}</td></tr>
                        <tr><td><strong>Min/Max:</strong></td><td>${this.core.formatNumber(stats.valueStats.min)} / ${this.core.formatNumber(stats.valueStats.max)}</td></tr>
                    ` : ''}
                </table>
            `;
        }

        html += `
                        </div>
                    </div>
                    
                    <div class="card mt-3">
                        <div class="card-header">
                            <h6><i class="fas fa-download me-2"></i>Export možnosti</h6>
                        </div>
                        <div class="card-body">
                            <div class="d-grid gap-2">
                                <button class="btn btn-outline-primary btn-sm" onclick="DetailModal.exportChartImage('${widgetId}')">
                                    <i class="fas fa-image me-1"></i>Export jako PNG
                                </button>
                                <button class="btn btn-outline-primary btn-sm" onclick="DetailModal.exportChartData('${widgetId}')">
                                    <i class="fas fa-file-csv me-1"></i>Export data (CSV)
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        content.innerHTML = html;

        // Vytvoř rozšířený graf
        setTimeout(() => {
            this.createDetailChart(widgetId, config, data);
        }, 100);
    }

    /**
     * Detail pro tabulku
     */
    renderTableDetail(content, config, data) {
        let html = `
            <div class="row">
                <div class="col-md-12">
                    <div class="card">
                        <div class="card-header">
                            <div class="row align-items-center">
                                <div class="col">
                                    <h6><i class="fas fa-table me-2"></i>Kompletní tabulka dat</h6>
                                </div>
                                <div class="col-auto">
                                    <div class="input-group input-group-sm">
                                        <input type="text" class="form-control" placeholder="Vyhledávání..." 
                                               id="detailTableSearch" onkeyup="DetailModal.searchDetailTable(this.value)">
                                        <span class="input-group-text"><i class="fas fa-search"></i></span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="card-body p-0">
                            <div class="table-responsive" style="max-height: 600px;">
                                <table class="table table-striped table-hover mb-0" id="detailTable">
                                    <thead class="table-dark sticky-top">
        `;

        if (Array.isArray(data) && data.length > 0) {
            // Hlavičky tabulky
            const firstRow = data[0];
            const columns = typeof firstRow === 'object' ? Object.keys(firstRow) : ['Hodnota'];
            
            html += '<tr>';
            columns.forEach(column => {
                html += `<th onclick="DetailModal.sortDetailTable('${column}')" style="cursor: pointer;">
                    ${column} <i class="fas fa-sort ms-1"></i>
                </th>`;
            });
            html += '</tr></thead><tbody>';

            // Data řádky
            data.forEach((row, index) => {
                html += '<tr>';
                columns.forEach(column => {
                    const value = typeof row === 'object' ? (row[column] || '') : row;
                    html += `<td>${this.formatTableValue(value)}</td>`;
                });
                html += '</tr>';
            });

            html += '</tbody></table>';
        } else {
            html += '<tr><td colspan="100%" class="text-center py-4">Žádná data k zobrazení</td></tr></tbody></table>';
        }

        html += `
                            </div>
                        </div>
                        <div class="card-footer">
                            <div class="row align-items-center">
                                <div class="col">
                                    <small class="text-muted">Celkem ${Array.isArray(data) ? data.length : 0} záznamů</small>
                                </div>
                                <div class="col-auto">
                                    <button class="btn btn-outline-primary btn-sm" onclick="DetailModal.exportCurrentData()">
                                        <i class="fas fa-download me-1"></i>Export CSV
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        content.innerHTML = html;
    }

    /**
     * Obecný detail
     */
    renderGenericDetail(content, config, data) {
        let html = `
            <div class="card">
                <div class="card-header">
                    <h6><i class="fas fa-info-circle me-2"></i>Detailní informace</h6>
                </div>
                <div class="card-body">
        `;

        // Konfigurace widgetu
        html += `
            <h6>Konfigurace widgetu:</h6>
            <table class="table table-sm mb-4">
                <tr><td><strong>Typ:</strong></td><td>${config.type}</td></tr>
                <tr><td><strong>Název:</strong></td><td>${config.title || 'Bez názvu'}</td></tr>
                <tr><td><strong>Zdroj dat:</strong></td><td>${config.dataSource || 'Není nakonfigurován'}</td></tr>
            </table>
        `;

        // Základní info o datech
        if (data) {
            const stats = this.core.dataManager.getDataStats(data);
            
            html += `
                <h6>Statistiky dat:</h6>
                <table class="table table-sm">
                    <tr><td><strong>Počet záznamů:</strong></td><td>${stats.count}</td></tr>
                    <tr><td><strong>Počet polí:</strong></td><td>${stats.fields.length}</td></tr>
                </table>
            `;

            if (stats.fields.length > 0) {
                html += `
                    <h6>Dostupná pole:</h6>
                    <div class="table-responsive">
                        <table class="table table-sm">
                            <thead>
                                <tr>
                                    <th>Název pole</th>
                                    <th>Typ</th>
                                    <th>Unikátní hodnoty</th>
                                    <th>Prázdné hodnoty</th>
                                </tr>
                            </thead>
                            <tbody>
                `;
                
                stats.fields.forEach(field => {
                    html += `
                        <tr>
                            <td><code>${field.name}</code></td>
                            <td><span class="badge bg-secondary">${field.type}</span></td>
                            <td>${field.uniqueCount}</td>
                            <td>${field.nullCount}</td>
                        </tr>
                    `;
                });
                
                html += '</tbody></table></div>';
            }

            // Ukázka dat
            if (stats.sample && stats.sample.length > 0) {
                html += `
                    <h6 class="mt-4">Ukázka dat:</h6>
                    <pre class="bg-light p-3 rounded"><code>${JSON.stringify(stats.sample, null, 2)}</code></pre>
                `;
            }
        }

        html += `
                </div>
            </div>
        `;

        content.innerHTML = html;
    }

    /**
     * Vytvoření detailního grafu
     */
    createDetailChart(widgetId, config, data) {
        const canvas = document.getElementById(`detailChart_${widgetId}`);
        if (!canvas) return;

        try {
            const ctx = canvas.getContext('2d');
            
            // Příprava dat podle typu grafu
            let chartData, chartOptions;
            
            switch (config.type) {
                case 'line-chart':
                    ({ chartData, chartOptions } = this.prepareDetailLineChart(data, config));
                    break;
                case 'bar-chart':
                    ({ chartData, chartOptions } = this.prepareDetailBarChart(data, config));
                    break;
                case 'pie-chart':
                    ({ chartData, chartOptions } = this.prepareDetailPieChart(data, config));
                    break;
                default:
                    return;
            }
            
            // Vytvoření grafu
            new Chart(ctx, {
                type: config.type.replace('-chart', ''),
                data: chartData,
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    ...chartOptions
                }
            });

        } catch (error) {
            console.error(`❌ Chyba při vytváření detailního grafu:`, error);
            const canvas = document.getElementById(`detailChart_${widgetId}`);
            if (canvas && canvas.parentNode) {
                canvas.parentNode.innerHTML = `
                    <div class="alert alert-warning">
                        <i class="fas fa-exclamation-triangle me-2"></i>
                        Chyba při vytváření grafu: ${error.message}
                    </div>
                `;
            }
        }
    }

    /**
     * Příprava dat pro detailní čárový graf
     */
    prepareDetailLineChart(data, config) {
        if (!Array.isArray(data) || data.length === 0) {
            return { chartData: { datasets: [] }, chartOptions: {} };
        }

        const labels = data.map(row => this.getNestedValue(row, config.xField));
        const yFields = Array.isArray(config.yFields) ? config.yFields : [config.yFields].filter(Boolean);
        
        const datasets = yFields.map((field, index) => {
            const values = data.map(row => this.getNestedValue(row, field));
            const color = this.getChartColor(index);
            
            return {
                label: field,
                data: values,
                borderColor: color,
                backgroundColor: color + '20',
                fill: false,
                tension: 0.4
            };
        });

        return {
            chartData: { labels, datasets },
            chartOptions: {
                scales: {
                    y: {
                        beginAtZero: true
                    }
                },
                plugins: {
                    legend: {
                        display: datasets.length > 1
                    }
                }
            }
        };
    }

    /**
     * Výpočet statistik pro graf
     */
    calculateChartStats(data, config) {
        const stats = {
            dataPoints: data.length,
            dateRange: 'N/A',
            valueStats: null
        };

        if (data.length > 0) {
            // Rozsah dat
            if (config.xField) {
                const xValues = data.map(row => this.getNestedValue(row, config.xField))
                                  .filter(v => v != null);
                if (xValues.length > 0) {
                    const first = xValues[0];
                    const last = xValues[xValues.length - 1];
                    stats.dateRange = `${first} - ${last}`;
                }
            }

            // Statistiky hodnot
            const valueFields = config.yFields || [config.valueField];
            if (valueFields && valueFields.length > 0) {
                const allValues = [];
                valueFields.forEach(field => {
                    const values = data.map(row => this.getNestedValue(row, field))
                                     .filter(v => typeof v === 'number');
                    allValues.push(...values);
                });

                if (allValues.length > 0) {
                    stats.valueStats = {
                        avg: allValues.reduce((a, b) => a + b, 0) / allValues.length,
                        min: Math.min(...allValues),
                        max: Math.max(...allValues)
                    };
                }
            }
        }

        return stats;
    }

    /**
     * Export aktuálních dat
     */
    exportCurrentData() {
        if (!this.currentData) {
            this.core.showToast('Žádná data k exportu', 'warning');
            return;
        }

        try {
            const csv = this.convertToCSV(this.currentData);
            const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            
            const filename = `dashboard-data-${this.currentWidget || 'export'}-${new Date().toISOString().slice(0,10)}.csv`;
            link.href = URL.createObjectURL(blob);
            link.download = filename;
            link.click();
            
            this.core.showToast('Data byla exportována', 'success');
            
        } catch (error) {
            console.error('❌ Chyba při exportu:', error);
            this.core.showToast('Chyba při exportu dat', 'error');
        }
    }

    /**
     * Konverze dat na CSV
     */
    convertToCSV(data) {
        if (!Array.isArray(data) || data.length === 0) {
            return '';
        }

        const firstRow = data[0];
        let headers, rows;

        if (typeof firstRow === 'object' && firstRow !== null) {
            // Objekty
            headers = Object.keys(firstRow);
            rows = data.map(row => 
                headers.map(header => {
                    const value = row[header];
                    return this.escapeCsvValue(value);
                }).join(',')
            );
        } else {
            // Primitívní hodnoty
            headers = ['Hodnota'];
            rows = data.map(value => this.escapeCsvValue(value));
        }

        return [headers.join(','), ...rows].join('\n');
    }

    /**
     * Escape hodnoty pro CSV
     */
    escapeCsvValue(value) {
        if (value == null) return '';
        
        const str = String(value);
        
        // Pokud obsahuje čárky, uvozovky nebo nové řádky, zabal do uvozovek
        if (str.includes(',') || str.includes('"') || str.includes('\n')) {
            return '"' + str.replace(/"/g, '""') + '"';
        }
        
        return str;
    }

    /**
     * Formátování hodnot pro tabulku
     */
    formatTableValue(value) {
        if (value == null) return '';
        
        if (typeof value === 'number') {
            return this.core.formatNumber(value);
        }
        
        if (value instanceof Date) {
            return this.core.formatDate(value);
        }
        
        return String(value);
    }

    /**
     * Formátování hodnot podle typu
     */
    formatValue(value, format) {
        if (value == null) return '';
        
        switch (format) {
            case 'currency':
                return this.core.formatCurrency(value);
            case 'percentage':
                return this.core.formatNumber(value / 100, { style: 'percent' });
            case 'number':
            default:
                return this.core.formatNumber(value);
        }
    }

    /**
     * Získání vnořené hodnoty
     */
    getNestedValue(obj, path) {
        if (!path) return null;
        return path.split('.').reduce((current, key) => {
            return current && current[key] !== undefined ? current[key] : null;
        }, obj);
    }

    /**
     * Získání barvy pro graf
     */
    getChartColor(index) {
        const colors = [
            '#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd',
            '#8c564b', '#e377c2', '#7f7f7f', '#bcbd22', '#17becf'
        ];
        return colors[index % colors.length];
    }

    /**
     * Statické API metody
     */
    static searchDetailTable(query) {
        const table = document.getElementById('detailTable');
        if (!table) return;

        const rows = table.querySelectorAll('tbody tr');
        const searchText = query.toLowerCase();

        rows.forEach(row => {
            const text = row.textContent.toLowerCase();
            row.style.display = text.includes(searchText) ? '' : 'none';
        });
    }

    static sortDetailTable(column) {
        // TODO: Implementace řazení tabulky
        console.log('Řazení podle sloupce:', column);
    }

    static exportChartImage(widgetId) {
        const canvas = document.getElementById(`detailChart_${widgetId}`);
        if (canvas) {
            const link = document.createElement('a');
            link.download = `chart-${widgetId}-${new Date().toISOString().slice(0,10)}.png`;
            link.href = canvas.toDataURL();
            link.click();
        }
    }

    static exportChartData(widgetId) {
        const instance = window.DetailModal;
        if (instance) {
            instance.exportCurrentData();
        }
    }

    static exportCurrentData() {
        const instance = window.DetailModal;
        if (instance) {
            instance.exportCurrentData();
        }
    }
}

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DetailModal;
}

console.log('🔍 Detail Modal modul načten');
