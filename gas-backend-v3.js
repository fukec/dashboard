/**
 * Google Apps Script Backend - V3.0 Modularní architektura
 * Verze: 3.0 - Rozšířeno pro dynamické datové zdroje
 * Podporuje konfigurovatelné endpointy a agregace
 */

// ========================================
// KONFIGURACE - UPRAVTE PODLE SVÝCH POTŘEB
// ========================================

const CONFIG = {
  // ID vašich Google Sheets - NAHRAĎTE SKUTEČNÝMI ID
  SHEETS: {
    FINANCIAL_DATA: '1XFkpSafhec8eQFYzQaHHq1P8UaadrBX5wQad48rHn0g',
    SALES_DATA: '1Palhqiq4yLgujvu_vNFayPssmmmo4joQkAr1zNs1nj4',
    HR_DATA: '15BIXP9QWLzc-gRro9SbC8yRThBLXdxPpc38WkhrKKF0'
  },
  
  // Nastavení cache (v sekundách)
  CACHE_DURATION: 1800, // 30 minut
  SHORT_CACHE: 300,     // 5 minut
  LONG_CACHE: 3600,     // 1 hodina
  
  // API rate limiting
  MAX_REQUESTS_PER_MINUTE: 120,
  REQUEST_TIMEOUT: 30000,
  
  // Logging
  ENABLE_LOGGING: true,
  LOG_LEVEL: 'INFO',
  
  // CORS nastavení
  CORS_ORIGIN: '*', // Pro development, v production nastavte specifickou doménu
  
  // Výchozí data pro testování
  USE_MOCK_DATA: false,
  
  // Formát dat
  DATE_FORMAT: 'cs-CZ',
  CURRENCY_FORMAT: 'CZK'
};

// ========================================
// HLAVNÍ API ENDPOINTS - ROZŠÍŘENO PRO V3.0
// ========================================

/**
 * GET endpoint - Hlavní vstupní bod s podporou JSONP a dynamických zdrojů
 */
function doGet(e) {
  const startTime = new Date().getTime();
  
  try {
    logInfo('=== Nový GET požadavek v3.0 ===');
    logInfo('Parametry:', e.parameter);
    
    // Rate limiting check
    if (!checkRateLimit()) {
      return createResponse('Rate limit exceeded. Zkuste to později.', false, 429, e.parameter.callback);
    }
    
    const action = e.parameter.action || 'dashboard';
    const forceRefresh = e.parameter.refresh === 'true';
    const callback = e.parameter.callback;
    const sheetId = e.parameter.sheetId;
    const range = e.parameter.range;
    
    let result;
    
    // Router pro různé akce
    switch(action) {
      case 'dashboard':
        result = getDashboardData(forceRefresh);
        break;
        
      case 'charts':
        result = getChartsData(forceRefresh);
        break;
        
      case 'tables':
        result = getTablesData(forceRefresh);
        break;
        
      case 'metrics':
        result = getMetricsData(forceRefresh);
        break;
        
      case 'custom':
        // Nový endpoint pro dynamické zdroje
        result = getCustomData(sheetId, range, forceRefresh);
        break;
        
      case 'aggregate':
        // Nový endpoint pro agregace
        result = getAggregatedData(e.parameter);
        break;
        
      case 'health':
        result = getHealthCheck();
        break;
        
      case 'config':
        result = getConfigInfo();
        break;
        
      default:
        return createResponse(`Neznámá akce: ${action}`, false, 400, callback);
    }
    
    const executionTime = new Date().getTime() - startTime;
    logApiUsage(action, executionTime, true);
    
    return createResponse(result, true, 200, callback, {
      executionTime: executionTime + 'ms',
      timestamp: new Date().toISOString(),
      version: '3.0',
      dataSource: sheetId || 'default'
    });
    
  } catch (error) {
    const executionTime = new Date().getTime() - startTime;
    logError('Chyba v doGet:', error);
    logApiUsage(e.parameter.action || 'unknown', executionTime, false);
    
    return createResponse(error.toString(), false, 500, e.parameter.callback);
  }
}

/**
 * Nový endpoint pro dynamické načítání dat
 */
function getCustomData(sheetId, range, forceRefresh = false) {
  if (!sheetId) {
    throw new Error('Sheet ID je povinný parametr');
  }
  
  const cacheKey = `custom_data_${sheetId}_${range || 'full'}`;
  
  if (!forceRefresh) {
    const cached = getCachedData(cacheKey);
    if (cached) {
      logInfo('Custom data načtena z cache');
      return cached;
    }
  }
  
  logInfo(`Loading custom data from sheet: ${sheetId}, range: ${range || 'A1:Z1000'}`);
  
  try {
    const data = getSheetData(sheetId, range || 'A1:Z1000');
    
    const result = {
      data: data,
      metadata: {
        sheetId: sheetId,
        range: range || 'A1:Z1000',
        rowCount: data.length,
        columnCount: data.length > 0 ? data[0].length : 0,
        lastUpdate: new Date().toISOString(),
        dataTypes: analyzeDataTypes(data)
      }
    };
    
    setCachedData(cacheKey, result, CONFIG.CACHE_DURATION);
    logInfo('Custom data processed and cached');
    
    return result;
    
  } catch (error) {
    logError('Error in getCustomData:', error);
    
    if (CONFIG.USE_MOCK_DATA) {
      return getMockCustomData(sheetId, range);
    }
    
    throw error;
  }
}

/**
 * Nový endpoint pro agregované data
 */
function getAggregatedData(parameters) {
  const sheetId = parameters.sheetId;
  const range = parameters.range;
  const groupBy = parameters.groupBy;
  const aggregateField = parameters.aggregateField;
  const aggregateFunction = parameters.aggregateFunction || 'sum';
  const filters = parameters.filters ? JSON.parse(parameters.filters) : null;
  
  if (!sheetId || !groupBy || !aggregateField) {
    throw new Error('Parametry sheetId, groupBy a aggregateField jsou povinné');
  }
  
  const cacheKey = `aggregated_${sheetId}_${groupBy}_${aggregateField}_${aggregateFunction}`;
  
  const cached = getCachedData(cacheKey);
  if (cached) {
    logInfo('Aggregated data načtena z cache');
    return cached;
  }
  
  try {
    // Načti základní data
    const rawData = getSheetData(sheetId, range || 'A1:Z1000');
    
    if (rawData.length < 2) {
      throw new Error('Nedostatek dat pro agregaci');
    }
    
    // Převeď na objekty
    const headers = rawData[0];
    const dataObjects = rawData.slice(1).map(row => {
      const obj = {};
      headers.forEach((header, index) => {
        obj[header] = row[index];
      });
      return obj;
    });
    
    // Aplikuj filtry pokud jsou definovány
    let filteredData = dataObjects;
    if (filters && Array.isArray(filters)) {
      filteredData = applyFilters(dataObjects, filters);
    }
    
    // Proveď agregaci
    const aggregatedData = performAggregation(filteredData, groupBy, aggregateField, aggregateFunction);
    
    const result = {
      data: aggregatedData,
      metadata: {
        originalRowCount: dataObjects.length,
        filteredRowCount: filteredData.length,
        aggregatedRowCount: aggregatedData.length,
        groupBy: groupBy,
        aggregateField: aggregateField,
        aggregateFunction: aggregateFunction,
        filters: filters,
        timestamp: new Date().toISOString()
      }
    };
    
    setCachedData(cacheKey, result, CONFIG.SHORT_CACHE);
    logInfo('Aggregated data processed and cached');
    
    return result;
    
  } catch (error) {
    logError('Error in getAggregatedData:', error);
    throw error;
  }
}

// ========================================
// NOVÉ UTILITY FUNKCE PRO V3.0
// ========================================

/**
 * Aplikování filtrů na data
 */
function applyFilters(data, filters) {
  return data.filter(row => {
    return filters.every(filter => {
      const value = row[filter.field];
      return evaluateFilter(value, filter.operator, filter.value);
    });
  });
}

/**
 * Vyhodnocení jednotlivého filtru
 */
function evaluateFilter(value, operator, filterValue) {
  switch (operator.toLowerCase()) {
    case 'equals':
    case '=':
      return value == filterValue;
      
    case 'not_equals':
    case '!=':
      return value != filterValue;
      
    case 'greater':
    case '>':
      return Number(value) > Number(filterValue);
      
    case 'greater_equals':
    case '>=':
      return Number(value) >= Number(filterValue);
      
    case 'less':
    case '<':
      return Number(value) < Number(filterValue);
      
    case 'less_equals':
    case '<=':
      return Number(value) <= Number(filterValue);
      
    case 'contains':
      return String(value).toLowerCase().includes(String(filterValue).toLowerCase());
      
    case 'starts_with':
      return String(value).toLowerCase().startsWith(String(filterValue).toLowerCase());
      
    case 'ends_with':
      return String(value).toLowerCase().endsWith(String(filterValue).toLowerCase());
      
    case 'in':
      const values = Array.isArray(filterValue) ? filterValue : filterValue.split(',');
      return values.includes(String(value));
      
    default:
      return true;
  }
}

/**
 * Provedení agregace dat
 */
function performAggregation(data, groupBy, aggregateField, aggregateFunction) {
  const groups = {};
  
  // Seskup data
  data.forEach(row => {
    const groupValue = row[groupBy] || 'N/A';
    if (!groups[groupValue]) {
      groups[groupValue] = [];
    }
    groups[groupValue].push(row);
  });
  
  // Proveď agregace
  const result = [];
  for (const [groupValue, groupData] of Object.entries(groups)) {
    const values = groupData.map(row => Number(row[aggregateField])).filter(v => !isNaN(v));
    
    let aggregatedValue;
    switch (aggregateFunction.toLowerCase()) {
      case 'sum':
        aggregatedValue = values.reduce((a, b) => a + b, 0);
        break;
        
      case 'avg':
      case 'average':
        aggregatedValue = values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0;
        break;
        
      case 'count':
        aggregatedValue = groupData.length;
        break;
        
      case 'min':
        aggregatedValue = values.length ? Math.min(...values) : 0;
        break;
        
      case 'max':
        aggregatedValue = values.length ? Math.max(...values) : 0;
        break;
        
      case 'first':
        aggregatedValue = groupData.length ? groupData[0][aggregateField] : null;
        break;
        
      case 'last':
        aggregatedValue = groupData.length ? groupData[groupData.length - 1][aggregateField] : null;
        break;
        
      default:
        aggregatedValue = values.length;
    }
    
    result.push({
      [groupBy]: groupValue,
      [aggregateField + '_' + aggregateFunction]: aggregatedValue,
      count: groupData.length
    });
  }
  
  // Seřaď výsledky podle hodnoty agregace
  return result.sort((a, b) => {
    const aVal = a[aggregateField + '_' + aggregateFunction];
    const bVal = b[aggregateField + '_' + aggregateFunction];
    return bVal - aVal;
  });
}

/**
 * Analýza typů dat
 */
function analyzeDataTypes(data) {
  if (!data || data.length < 2) {
    return {};
  }
  
  const headers = data[0];
  const sampleSize = Math.min(10, data.length - 1);
  const types = {};
  
  headers.forEach((header, colIndex) => {
    const columnValues = [];
    for (let rowIndex = 1; rowIndex <= sampleSize; rowIndex++) {
      if (data[rowIndex] && data[rowIndex][colIndex] !== undefined && data[rowIndex][colIndex] !== '') {
        columnValues.push(data[rowIndex][colIndex]);
      }
    }
    
    types[header] = detectColumnType(columnValues);
  });
  
  return types;
}

/**
 * Detekce typu sloupce
 */
function detectColumnType(values) {
  if (values.length === 0) return 'unknown';
  
  let numberCount = 0;
  let dateCount = 0;
  let boolCount = 0;
  
  values.forEach(value => {
    if (typeof value === 'number' || (!isNaN(Number(value)) && value !== '')) {
      numberCount++;
    } else if (isValidDate(value)) {
      dateCount++;
    } else if (typeof value === 'boolean' || value === 'true' || value === 'false') {
      boolCount++;
    }
  });
  
  const total = values.length;
  
  if (numberCount / total > 0.8) return 'number';
  if (dateCount / total > 0.8) return 'date';
  if (boolCount / total > 0.8) return 'boolean';
  
  return 'string';
}

/**
 * Validace datumu
 */
function isValidDate(value) {
  if (!value) return false;
  const date = new Date(value);
  return !isNaN(date.getTime()) && String(value).match(/\d{4}-\d{2}-\d{2}|\d{2}\/\d{2}\/\d{4}|\d{1,2}\.\d{1,2}\.\d{4}/);
}

// ========================================
// ROZŠÍŘENÉ DATA PROCESSING FUNKCE
// ========================================

/**
 * Pokročilé zpracování metrik s podporou více zdrojů
 */
function processAdvancedMetrics(dataSources) {
  try {
    const metrics = [];
    
    for (const [sourceKey, sourceData] of Object.entries(dataSources)) {
      if (!sourceData || sourceData.length < 2) continue;
      
      const dataRows = sourceData.slice(1);
      const headers = sourceData[0];
      
      // Najdi číselné sloupce
      const numericColumns = [];
      headers.forEach((header, index) => {
        const sampleValues = dataRows.slice(0, 5).map(row => row[index]);
        if (sampleValues.some(val => typeof val === 'number' || !isNaN(Number(val)))) {
          numericColumns.push({ header, index });
        }
      });
      
      // Vytvoř metriky pro každý číselný sloupec
      numericColumns.forEach(column => {
        const values = dataRows.map(row => Number(row[column.index])).filter(v => !isNaN(v));
        
        if (values.length > 0) {
          const sum = values.reduce((a, b) => a + b, 0);
          const avg = sum / values.length;
          const min = Math.min(...values);
          const max = Math.max(...values);
          
          metrics.push({
            source: sourceKey,
            field: column.header,
            title: `${column.header} (${sourceKey})`,
            value: formatCurrency(sum),
            rawValue: sum,
            statistics: {
              count: values.length,
              average: avg,
              minimum: min,
              maximum: max,
              sum: sum
            },
            change: calculateTrend(values),
            icon: "fas fa-chart-line",
            color: getRandomColor()
          });
        }
      });
    }
    
    return metrics;
    
  } catch (error) {
    logError('Error in processAdvancedMetrics:', error);
    return [];
  }
}

/**
 * Výpočet trendu z řady hodnot
 */
function calculateTrend(values) {
  if (values.length < 2) return '0%';
  
  const recentValues = values.slice(-5); // Posledních 5 hodnot
  if (recentValues.length < 2) return '0%';
  
  const firstVal = recentValues[0];
  const lastVal = recentValues[recentValues.length - 1];
  
  if (firstVal === 0) return lastVal > 0 ? '+100%' : '0%';
  
  const change = ((lastVal - firstVal) / firstVal) * 100;
  const sign = change > 0 ? '+' : '';
  
  return `${sign}${change.toFixed(1)}%`;
}

// ========================================
// MOCK DATA PRO TESTOVÁNÍ
// ========================================

/**
 * Mock data pro custom endpoint
 */
function getMockCustomData(sheetId, range) {
  const mockData = [
    ['Datum', 'Hodnota', 'Kategorie', 'Status'],
    ['2024-01-01', 1500, 'Kategorie A', 'Aktivní'],
    ['2024-01-02', 2300, 'Kategorie B', 'Aktivní'],
    ['2024-01-03', 1800, 'Kategorie A', 'Neaktivní'],
    ['2024-01-04', 2100, 'Kategorie C', 'Aktivní'],
    ['2024-01-05', 1900, 'Kategorie B', 'Aktivní']
  ];
  
  return {
    data: mockData,
    metadata: {
      sheetId: sheetId,
      range: range || 'A1:Z1000',
      rowCount: mockData.length,
      columnCount: mockData[0].length,
      lastUpdate: new Date().toISOString(),
      isMockData: true,
      dataTypes: {
        'Datum': 'date',
        'Hodnota': 'number',
        'Kategorie': 'string',
        'Status': 'string'
      }
    }
  };
}

// ========================================
// ROZŠÍŘENÉ PŮVODNÍ FUNKCE (zachovány pro kompatibilitu)
// ========================================

/**
 * Dashboard overview data - rozšířeno
 */
function getDashboardData(forceRefresh = false) {
  const cacheKey = 'dashboard_data_v3';
  
  if (!forceRefresh) {
    const cached = getCachedData(cacheKey);
    if (cached) {
      logInfo('Dashboard data loaded from cache');
      return cached;
    }
  }
  
  logInfo('Loading fresh dashboard data v3.0...');
  
  try {
    // Načti data ze všech nakonfigurovaných zdrojů
    const dataSources = {};
    
    for (const [key, sheetId] of Object.entries(CONFIG.SHEETS)) {
      try {
        if (sheetId && !sheetId.includes('NAHRADTE')) {
          dataSources[key.toLowerCase()] = getSheetData(sheetId, 'A1:Z100');
        }
      } catch (error) {
        logWarn(`Cannot load data from ${key}: ${error.message}`);
      }
    }
    
    // Zpracuj pokročilé metriky
    const metrics = processAdvancedMetrics(dataSources);
    
    const result = {
      metrics: metrics,
      summary: {
        totalSources: Object.keys(dataSources).length,
        totalMetrics: metrics.length,
        lastUpdate: new Date().toISOString(),
        dataQuality: assessDataSourcesQuality(dataSources),
        version: '3.0'
      },
      rawDataSources: Object.keys(dataSources) // Pro debugging
    };
    
    setCachedData(cacheKey, result, CONFIG.CACHE_DURATION);
    logInfo('Dashboard data v3.0 processed and cached');
    
    return result;
    
  } catch (error) {
    logError('Error in getDashboardData v3.0:', error);
    
    if (CONFIG.USE_MOCK_DATA) {
      return getMockDashboardData();
    }
    
    throw error;
  }
}

/**
 * Posouzení kvality datových zdrojů
 */
function assessDataSourcesQuality(dataSources) {
  if (Object.keys(dataSources).length === 0) return 'no-data';
  
  let qualityScore = 0;
  let totalSources = 0;
  
  for (const [key, data] of Object.entries(dataSources)) {
    totalSources++;
    
    if (data && Array.isArray(data) && data.length > 1) {
      qualityScore += data.length > 10 ? 2 : 1; // Bonus za více dat
    }
  }
  
  if (totalSources === 0) return 'no-data';
  
  const avgScore = qualityScore / totalSources;
  
  if (avgScore >= 1.5) return 'excellent';
  if (avgScore >= 1) return 'good';
  if (avgScore >= 0.5) return 'fair';
  return 'poor';
}

// ========================================
// ZACHOVANÉ PŮVODNÍ FUNKCE (pro kompatibilitu)
// ========================================

/**
 * Charts data - rozšířeno o více flexibility
 */
function getChartsData(forceRefresh = false) {
  const cacheKey = 'charts_data_v3';
  
  if (!forceRefresh) {
    const cached = getCachedData(cacheKey);
    if (cached) {
      logInfo('Charts data loaded from cache');
      return cached;
    }
  }
  
  logInfo('Loading fresh charts data v3.0...');
  
  try {
    const batchRequests = [
      { key: 'monthly', sheetId: CONFIG.SHEETS.SALES_DATA, range: 'Charts!A1:F50' },
      { key: 'categories', sheetId: CONFIG.SHEETS.SALES_DATA, range: 'Categories!A1:C20' },
      { key: 'trends', sheetId: CONFIG.SHEETS.SALES_DATA, range: 'Trends!A1:E30' }
    ];
    
    const batchData = batchReadSheets(batchRequests);
    
    const result = {
      monthlyTrends: processMonthlyData(batchData.monthly),
      categoryDistribution: processCategoryData(batchData.categories),
      trendAnalysis: processTrendData(batchData.trends),
      chartMetadata: {
        dataPoints: batchData.monthly?.length || 0,
        categories: batchData.categories?.length || 0,
        lastUpdate: new Date().toISOString(),
        version: '3.0'
      }
    };
    
    setCachedData(cacheKey, result, CONFIG.CACHE_DURATION);
    logInfo('Charts data v3.0 processed and cached');
    
    return result;
    
  } catch (error) {
    logError('Error in getChartsData v3.0:', error);
    
    if (CONFIG.USE_MOCK_DATA) {
      return getMockChartsData();
    }
    
    throw error;
  }
}

/**
 * Tables data - beze změny
 */
function getTablesData(forceRefresh = false) {
  const cacheKey = 'tables_data_v3';
  
  if (!forceRefresh) {
    const cached = getCachedData(cacheKey);
    if (cached) {
      logInfo('Tables data loaded from cache');
      return cached;
    }
  }
  
  logInfo('Loading fresh tables data v3.0...');
  
  try {
    const batchRequests = [
      { key: 'employees', sheetId: CONFIG.SHEETS.HR_DATA, range: 'Employees!A1:G200' },
      { key: 'departments', sheetId: CONFIG.SHEETS.HR_DATA, range: 'Departments!A1:E20' }
    ];
    
    const batchData = batchReadSheets(batchRequests);
    
    const result = {
      employees: processEmployeeData(batchData.employees),
      departments: processDepartmentData(batchData.departments),
      statistics: {
        totalEmployees: (batchData.employees?.length || 1) - 1,
        totalDepartments: (batchData.departments?.length || 1) - 1,
        averagePerformance: calculateAveragePerformance(batchData.employees),
        lastUpdate: new Date().toISOString(),
        version: '3.0'
      }
    };
    
    setCachedData(cacheKey, result, CONFIG.CACHE_DURATION);
    logInfo('Tables data v3.0 processed and cached');
    
    return result;
    
  } catch (error) {
    logError('Error in getTablesData v3.0:', error);
    
    if (CONFIG.USE_MOCK_DATA) {
      return getMockTablesData();
    }
    
    throw error;
  }
}

// ========================================
// VŠECHNY PŮVODNÍ UTILITY FUNKCE ZACHOVÁNY
// (getSheetData, batchReadSheets, cache funkce, atd.)
// ========================================

/**
 * Universální načtení dat ze Sheets
 */
function getSheetData(spreadsheetId, range) {
  if (!spreadsheetId || spreadsheetId.includes('NAHRADTE')) {
    logWarn(`Invalid sheet ID: ${spreadsheetId}`);
    return [];
  }
  
  try {
    logDebug(`Loading data from sheet: ${spreadsheetId}, range: ${range}`);
    const sheet = SpreadsheetApp.openById(spreadsheetId);
    const values = sheet.getRange(range).getValues();
    
    // Filtruj úplně prázdné řádky
    const filteredValues = values.filter(row =>
      row.some(cell => cell !== null && cell !== undefined && cell.toString().trim() !== '')
    );
    
    logDebug(`Loaded ${filteredValues.length} rows from sheet`);
    return filteredValues;
    
  } catch (error) {
    logError(`Error loading sheet ${spreadsheetId}:`, error);
    return [];
  }
}

/**
 * Batch načítání z více sheets
 */
function batchReadSheets(requests) {
  const results = {};
  const errors = [];
  
  logInfo(`Starting batch read of ${requests.length} sheets`);
  
  requests.forEach(request => {
    try {
      const data = getSheetData(request.sheetId, request.range);
      results[request.key] = data;
      logDebug(`Batch read success: ${request.key} (${data.length} rows)`);
    } catch (error) {
      logError(`Batch read error for ${request.key}:`, error);
      results[request.key] = [];
      errors.push({ key: request.key, error: error.toString() });
    }
  });
  
  if (errors.length > 0) {
    logWarn('Batch read completed with errors:', errors);
  } else {
    logInfo('Batch read completed successfully');
  }
  
  return results;
}

// ========================================
// CACHE MANAGEMENT - BEZE ZMĚNY
// ========================================

function getCachedData(key) {
  try {
    const cache = CacheService.getScriptCache();
    const cached = cache.get(key);
    if (cached) {
      const data = JSON.parse(cached);
      logDebug(`Cache hit: ${key}`);
      return data;
    }
    logDebug(`Cache miss: ${key}`);
    return null;
  } catch (error) {
    logError(`Cache read error for ${key}:`, error);
    return null;
  }
}

function setCachedData(key, data, duration = CONFIG.CACHE_DURATION) {
  try {
    const cache = CacheService.getScriptCache();
    cache.put(key, JSON.stringify(data), duration);
    logDebug(`Cache set: ${key} (TTL: ${duration}s)`);
  } catch (error) {
    logError(`Cache write error for ${key}:`, error);
  }
}

// Všechny ostatní původní funkce zůstávají zachovány...
// (createResponse, logging funkce, utility funkce, mock data, atd.)

// ========================================
// RESPONSE HELPER - BEZE ZMĚNY
// ========================================

function createResponse(data, success = true, statusCode = 200, callback = null, metadata = {}) {
  const response = {
    success: success,
    statusCode: statusCode,
    timestamp: new Date().toISOString(),
    version: '3.0'
  };
  
  if (success) {
    response.data = data;
    if (metadata && Object.keys(metadata).length > 0) {
      response.metadata = metadata;
    }
  } else {
    response.error = data;
  }
  
  const jsonString = JSON.stringify(response);
  
  // JSONP podpora
  if (callback) {
    const jsonpResponse = `${callback}(${jsonString});`;
    return ContentService
      .createTextOutput(jsonpResponse)
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  } else {
    return ContentService
      .createTextOutput(jsonString)
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// ========================================
// VŠECHNY OSTATNÍ PŮVODNÍ FUNKCE ZACHOVÁNY
// ========================================

// Zde by pokračovaly všechny ostatní funkce z původního kódu:
// - processMetricsData
// - processMonthlyData  
// - processCategoryData
// - processEmployeeData
// - všechny utility funkce
// - mock data funkce
// - logging funkce
// - rate limiting
// - atd.

// Pro úsporu místa nejsou zde duplikovány, ale v reálném nasazení 
// by zde byly všechny původní funkce, které zajišťují kompatibilitu

console.log('🚀 Google Apps Script Dashboard Backend v3.0 - Modularní architektura - načten úspěšně');