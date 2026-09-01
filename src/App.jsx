import { useState, useMemo, useEffect } from 'react';
import UploadZone from './components/UploadZone';
import ShiftSelector from './components/ShiftSelector';
import ColumnMapper from './components/ColumnMapper';
import DataTable from './components/DataTable';
import { parseExcel } from './utils/parseExcel';
import { filterByShift, parseTimestamp } from './utils/filterByShift';
import CreatedByFilter from './components/CreatedByFilter';
import {
  toDMR, toShipping, toReceiving,
  DMR_HEADERS, SHIPPING_HEADERS, RECEIVING_HEADERS,
  autoMapHeaders,
} from './utils/formatters';

const TABS = [
  { id: 'all_raw', label: 'All Data', color: 'red' },
  { id: 'dmr', label: 'DMR', color: 'red' },
  { id: 'shipping', label: 'Shipping', color: 'orange' },
  { id: 'receiving', label: 'Receiving', color: 'green' },
];

export default function App() {
  const [rawData, setRawData] = useState(null);   // { headers, rows }
  const [columnMap, setColumnMap] = useState({});
  const [shift, setShift] = useState('all');
  const [activeTab, setActiveTab] = useState('dmr');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isMapperOpen, setIsMapperOpen] = useState(true);
  const [selectedCreators, setSelectedCreators] = useState(new Set());

  // Handle file upload
  const handleFileLoaded = async (file) => {
    setIsLoading(true);
    setError('');
    try {
      const result = await parseExcel(file);
      setRawData(result);
      // Auto-map columns
      const autoMap = autoMapHeaders(result.headers);
      setColumnMap(autoMap);
    } catch (err) {
      setError(err.message);
      setRawData(null);
    } finally {
      setIsLoading(false);
    }
  };

  // Unique "Created By" values available for filtering
  const creatorOptions = useMemo(() => {
    if (!rawData || !columnMap.receiverShipper) return [];
    const values = new Set();
    for (const row of rawData.rows) {
      const val = row[columnMap.receiverShipper];
      values.add(val === undefined || val === null ? '' : String(val).trim());
    }
    return Array.from(values).sort((a, b) => a.localeCompare(b));
  }, [rawData, columnMap.receiverShipper]);

  // Default to "all selected" whenever the option list changes (new file / new mapping)
  useEffect(() => {
    setSelectedCreators(new Set(creatorOptions));
  }, [creatorOptions]);

  // Filter rows by shift, then sort by date ascending (oldest → newest)
  const filteredRows = useMemo(() => {
    if (!rawData) return [];
    const filtered = filterByShift(rawData.rows, shift, columnMap.timestamp);

    if (!columnMap.timestamp) return filtered;

    return [...filtered].sort((a, b) => {
      const dateA = parseTimestamp(a[columnMap.timestamp]);
      const dateB = parseTimestamp(b[columnMap.timestamp]);
      const timeA = dateA && dateA.isValid() ? dateA.valueOf() : 0;
      const timeB = dateB && dateB.isValid() ? dateB.valueOf() : 0;
      return timeA - timeB; // ascending: lowest (oldest) → highest (newest)
    });
  }, [rawData, shift, columnMap.timestamp]);

  // Apply Created By checklist filter on top of shift-filtered + sorted rows
  const visibleRows = useMemo(() => {
    if (!columnMap.receiverShipper || selectedCreators.size === creatorOptions.length) {
      return filteredRows;
    }
    return filteredRows.filter((row) => {
      const val = row[columnMap.receiverShipper];
      const normalized = val === undefined || val === null ? '' : String(val).trim();
      return selectedCreators.has(normalized);
    });
  }, [filteredRows, columnMap.receiverShipper, selectedCreators, creatorOptions.length]);

  // Categorize rows by transaction type
  // const categorizedRows = useMemo(() => {
  //   const typeCol = columnMap.transactionType;
  //   if (!typeCol) {
  //     // If no category column mapped, show all rows in each tab
  //     return { all_raw: filteredRows, dmr: filteredRows, shipping: filteredRows, receiving: filteredRows };
  //   }

  //   const dmr = [];
  //   const shipping = [];
  //   const receiving = [];

  //   for (const row of filteredRows) {
  //     const type = String(row[typeCol] || '').toUpperCase().trim();
  //     if (type === 'ISSUED') {
  //       dmr.push(row);
  //     } else if (type === 'TO/CREATE' || type === 'TP/CREATE') {
  //       shipping.push(row);
  //     } else if (type === 'TO/RECEIVING' || type === 'TP/RECEIVING') {
  //       receiving.push(row);
  //     } else {
  //       // Fallback: If it doesn't match the expected types, put it in all tabs so it's not completely lost.
  //       dmr.push(row);
  //       shipping.push(row);
  //       receiving.push(row);
  //     }
  //   }

  //   return { all_raw: filteredRows, dmr, shipping, receiving };
  // }, [filteredRows, columnMap.transactionType]);

  const categorizedRows = useMemo(() => {
    const typeCol = columnMap.transactionType;
    if (!typeCol) {
      return { all_raw: visibleRows, dmr: visibleRows, shipping: visibleRows, receiving: visibleRows };
    }

    const dmr = [];
    const shipping = [];
    const receiving = [];

    for (const row of visibleRows) {
      const type = String(row[typeCol] || '').toUpperCase().trim();
      if (type === 'ISSUED') {
        dmr.push(row);
      } else if (type === 'TO/CREATE' || type === 'TP/CREATE') {
        shipping.push(row);
      } else if (type === 'TO/RECEIVING' || type === 'TP/RECEIVING') {
        receiving.push(row);
      }
      // Anything else (e.g. RTS/WO) is intentionally excluded from DMR/Shipping/Receiving —
      // it still remains visible in the "All Data" tab via visibleRows.
    }

    return { all_raw: visibleRows, dmr, shipping, receiving };
  }, [visibleRows, columnMap.transactionType]);


  // Format rows for the active tab
  const formattedData = useMemo(() => {
    const rows = categorizedRows[activeTab] || [];
    switch (activeTab) {
      case 'all_raw':
        return rows.map((row) =>
          rawData.headers.map((h) => {
            const val = row[h];
            if (val instanceof Date) return val.toISOString();
            return String(val ?? '').replace(/[\r\n]+/g, ' ').trim();
          })
        );
      case 'dmr':
        return toDMR(rows, columnMap);
      case 'shipping':
        return toShipping(rows, columnMap);
      case 'receiving':
        return toReceiving(rows, columnMap);
      default:
        return [];
    }
  }, [categorizedRows, activeTab, columnMap, rawData]);

  const activeHeaders = activeTab === 'all_raw'
    ? rawData?.headers || []
    : activeTab === 'dmr'
      ? DMR_HEADERS
      : activeTab === 'shipping'
        ? SHIPPING_HEADERS
        : RECEIVING_HEADERS;

  const activeColor = TABS.find((t) => t.id === activeTab)?.color || 'red';

  return (
    <div className="min-h-screen px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <header className="max-w-6xl mx-auto mb-8 animate-slide-up">
        <div className='flex items-center justify-center w-full'>
          <img src="LionGroupIndonesia.png" alt="logo Lion" className="w-50" />
        </div>
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center shadow-lg shadow-primary-600/20">
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <div>
            <h1 className="text-xl font-bold text-surface-900">Excel Format for Daily Report K1 CGK</h1>
            <p className="text-surface-600 text-sm">K1 CGK Daily Report • Parse → Filter → Copy</p>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto space-y-6">
        {/* Upload */}
        <section className="animate-slide-up" style={{ animationDelay: '0.05s' }}>
          <UploadZone onFileLoaded={handleFileLoaded} isLoading={isLoading} />
        </section>

        {/* Error */}
        {error && (
          <div className="bg-danger-400/10 border border-danger-400/30 text-danger-400 rounded-xl px-5 py-3 text-sm animate-fade-in">
            {error}
          </div>
        )}

        {/* Column Mapper */}
        {rawData && (
          <section style={{ animationDelay: '0.1s' }}>
            <div className="glass rounded-2xl overflow-hidden">
              <button
                onClick={() => setIsMapperOpen((prev) => !prev)}
                className="w-full flex items-center justify-between px-6 py-4 cursor-pointer hover:bg-white/40 transition-colors duration-150"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-primary-600/20 flex items-center justify-center">
                    <svg className="w-4 h-4 text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16m-7 6h7" />
                    </svg>
                  </div>
                  <div className="text-left">
                    <h3 className="text-surface-900 font-semibold text-sm">Column Mapping</h3>
                    <p className="text-surface-600 text-xs">Map your Excel columns to the output fields</p>
                  </div>
                </div>
                <svg
                  className={`w-5 h-5 text-surface-500 transition-transform duration-200 ${isMapperOpen ? 'rotate-180' : ''}`}
                  fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {isMapperOpen && (
                <div className="px-6 pb-6">
                  <ColumnMapper
                    headers={rawData.headers}
                    columnMap={columnMap}
                    onChange={setColumnMap}
                    hideHeader
                  />
                </div>
              )}
            </div>
          </section>
        )}

        {/* Controls + Data */}
        {rawData && (
          <section className="glass rounded-2xl p-6 animate-slide-up" style={{ animationDelay: '0.15s' }}>
            {/* Shift + Tabs row */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
              <div className="flex flex-wrap items-center gap-3">
                <ShiftSelector value={shift} onChange={setShift} />
                <CreatedByFilter
                  options={creatorOptions}
                  selected={selectedCreators}
                  onChange={setSelectedCreators}
                />
              </div>

              <div className="flex items-center gap-1 bg-white/60 ring-1 ring-surface-200/50 rounded-xl p-1">
                {TABS.map((tab) => {
                  const count = categorizedRows[tab.id]?.length || 0;
                  return (
                    <button
                      key={tab.id}
                      id={`tab-${tab.id}`}
                      onClick={() => setActiveTab(tab.id)}
                      className={`
                        px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer
                        ${activeTab === tab.id
                          ? 'bg-white text-primary-600 shadow-sm ring-1 ring-surface-200'
                          : 'text-surface-600 hover:text-surface-900 hover:bg-white/50'
                        }
                      `}
                    >
                      {tab.label}
                      <span className={`ml-1.5 text-xs ${activeTab === tab.id ? 'text-primary-500' : 'text-surface-500'}`}>
                        ({count})
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Info: total rows */}
            <div className="flex items-center gap-2 mb-4">
              <span className="text-surface-500 text-xs">
                Total filtered: <span className="text-surface-800 font-medium">{visibleRows.length}</span> rows
                {columnMap.transactionType && (
                  <>
                    {' • '}Categorized by <span className="text-primary-400 font-medium">{columnMap.transactionType}</span>
                  </>
                )}
              </span>
            </div>

            {/* Table */}
            <DataTable
              title={TABS.find((t) => t.id === activeTab)?.label}
              headers={activeHeaders}
              data={formattedData}
              accentColor={activeColor}
            />
          </section>
        )}

        {/* Empty state */}
        {!rawData && !isLoading && !error && (
          <div className="text-center py-16 animate-fade-in" style={{ animationDelay: '0.2s' }}>
            <p className="text-surface-600 text-sm">
              Upload an Excel file to get started
            </p>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="max-w-6xl mx-auto mt-12 pt-6 border-t border-surface-200/60">
        <p className="text-surface-500 text-xs text-center">
          Excel Data Formatter — K1 CGK Daily Report Tool
        </p>
      </footer>
    </div>
  );
}
