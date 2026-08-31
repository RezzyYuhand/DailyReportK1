import { parseTimestamp } from './filterByShift';

/**
 * Format a Date object or string into a clean date string for the output tables.
 */
function formatOutputDate(val) {
  if (!val) return '';
  const parsed = parseTimestamp(val);
  if (parsed && parsed.isValid()) {
    return parsed.format('MM/DD/YYYY HH:mm:ss');
  }
  return String(val);
}

/**
 * Format rows into the DMR table structure.
 * Columns: Tgl, request by, Description, Pn, Sn, Qty, Category, Used For, [empty], [empty], Ref WO, WO Status, Supplied By
 */
export function toDMR(rows, columnMap) {
  const m = columnMap;
  return rows.map((row) => [
    formatOutputDate(row[m.timestamp]),
    row[m.requestor] || '',
    row[m.description] || '',
    row[m.partNumber] || '',
    row[m.serialNumber] || '',
    row[m.quantity] || '',
    row[m.category] || '',
    row[m.usedFor] || '',
    '', // Kosong
    '', // Kosong
    row[m.refWO] || '',
    'OPEN', // WO STATUS
    row[m.receiverShipper] || '',
  ]);
}

export const DMR_HEADERS = [
  'Created Date', 'Request By', 'Description', 'PN', 'SN', 'Qty',
  'Category', 'Used For', '', '', 'Ref WO', 'WO Status', 'Supplied By',
];

/**
 * Format rows into the SHIPPING table structure.
 * Columns: Tgl, From, Send to, Desc, Pn, Sn, Qty, [empty], Category, [empty], TO Trax, Status, [empty], Receiver/Shipper
 */
export function toShipping(rows, columnMap) {
  const m = columnMap;
  return rows.map((row) => [
    formatOutputDate(row[m.timestamp]),
    row[m.sourceLocation] || '',
    row[m.destination] || '',
    row[m.description] || '',
    row[m.partNumber] || '',
    row[m.serialNumber] || '',
    row[m.quantity] || '',
    '', // Kosong
    row[m.category] || '',
    '', // Kosong
    row[m.toTrax] || '',
    'OPEN', // STATUS
    '', // Kosong
    row[m.receiverShipper] || '',
  ]);
}

export const SHIPPING_HEADERS = [
  'Created Date', 'From', 'Send To', 'Desc', 'PN', 'SN', 'Qty',
  '', 'Category', '', 'TO Trax', 'Status', '', 'Receiver/Shipper',
];

/**
 * Format rows into the RECEIVING table structure.
 * Columns: Tgl, [empty], Send to, Desc, Pn, Sn, Bin, Qty, [empty], Category, [empty], TO Trax, Status, [empty], Shipper/Receiver
 */
export function toReceiving(rows, columnMap) {
  const m = columnMap;
  return rows.map((row) => [
    formatOutputDate(row[m.timestamp]),
    '', // Kosong
    'K1', // Destination
    row[m.description] || '',
    row[m.partNumber] || '',
    row[m.serialNumber] || '',
    row[m.bin] || '',
    row[m.quantity] || '',
    '', // Kosong
    row[m.category] || '',
    '', // Kosong
    row[m.toTrax] || '',
    'CLOSED', // STATUS
    '', // Kosong
    row[m.receiverShipper] || '',
  ]);
}

export const RECEIVING_HEADERS = [
  'Created Date', '', 'Send To', 'Desc', 'PN', 'SN', 'Bin', 'Qty',
  '', 'Category', '', 'TO Trax', 'Status', '', 'Shipper/Receiver',
];

/**
 * Default column mapping keys — user will map these to actual Excel headers.
 */
export const MAPPING_FIELDS = [
  { key: 'timestamp', label: 'Created Date', required: true },
  { key: 'requestor', label: 'Requestor / Request By' },
  { key: 'description', label: 'Description' },
  { key: 'partNumber', label: 'Part Number (PN)' },
  { key: 'serialNumber', label: 'Serial Number (SN)' },
  { key: 'quantity', label: 'Quantity (Qty)' },
  { key: 'category', label: 'Category' },
  { key: 'usedFor', label: 'Used For' },
  { key: 'refWO', label: 'Ref WO' },
  { key: 'woStatus', label: 'WO Status' },
  { key: 'receiverShipper', label: 'Receiver / Shipper' },
  { key: 'sourceLocation', label: 'Source Location (From)' },
  { key: 'destination', label: 'Destination (Send To)' },
  { key: 'toTrax', label: 'TO Trax' },
  { key: 'status', label: 'Status' },
  { key: 'bin', label: 'Bin Location' },
  { key: 'transactionType', label: 'Transaction Type (DMR/Shipping/Receiving)' },
];

/**
 * Try to auto-map Excel headers to our known field keys.
 * Uses fuzzy matching on common column name patterns.
 */
export function autoMapHeaders(headers) {
  const map = {};
  const lowerHeaders = headers.map((h) => h.toLowerCase().trim());

  const patterns = {
    timestamp: ['created date'],
    requestor: ['issued to'],
    description: ['defect description', 'description', 'desc', 'item description', 'deskripsi'],
    partNumber: ['p/n'],
    serialNumber: ['s/n'],
    quantity: ['qty', 'quantity', 'jumlah'],
    category: ['category', 'kategori'],
    usedFor: ['a/c', 'used for', 'used_for', 'usedfor', 'usage'],
    refWO: ['w/o'],
    woStatus: ['status', 'wo status', 'wostatus', 'wo_status', 'work order status'],
    receiverShipper: ['created by'],
    sourceLocation: ['location', 'source location', 'source', 'from', 'origin', 'lokasi asal'],
    destination: ['to location/bin'],
    toTrax: ['order no'],
    status: ['status'],
    bin: ['bin', 'bin location', 'bin loc', 'lokasi bin'],
    transactionType: ['transaction type', 'trans type', 'transactiontype', 'transaction_type', 'transaction'],
  };

  for (const [key, keywords] of Object.entries(patterns)) {
    // Pass 1: exact match — header text equals a keyword exactly.
    let matchIndex = -1;
    for (let i = 0; i < lowerHeaders.length; i++) {
      if (keywords.includes(lowerHeaders[i])) {
        matchIndex = i;
        break;
      }
    }

    // Pass 2: fallback to substring match if no exact match found.
    if (matchIndex === -1) {
      for (let i = 0; i < lowerHeaders.length; i++) {
        if (keywords.some((kw) => lowerHeaders[i].includes(kw))) {
          matchIndex = i;
          break;
        }
      }
    }

    if (matchIndex !== -1) {
      map[key] = headers[matchIndex]; // Use original casing
    }
  }

  return map;
}
