import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';

dayjs.extend(customParseFormat);

/**
 * Attempt to parse a timestamp value from Excel.
 * Handles various formats: ISO strings, date objects, custom formats.
 */
export function parseTimestamp(value) {
  if (!value) return null;

  // If it's already a Date object
  if (value instanceof Date) {
    return dayjs(value);
  }

  const str = String(value).trim();

  // Try common formats
  const formats = [
    'YYYY-MM-DD HH:mm:ss',
    'YYYY-MM-DD HH:mm',
    'MM/DD/YYYY HH:mm:ss',
    'MM/DD/YYYY HH:mm',
    'DD/MM/YYYY HH:mm:ss',
    'DD/MM/YYYY HH:mm',
    'M/D/YYYY H:mm:ss',
    'M/D/YYYY H:mm',
    'YYYY-MM-DDTHH:mm:ss',
  ];

  for (const fmt of formats) {
    const parsed = dayjs(str, fmt, true);
    if (parsed.isValid()) return parsed;
  }

  // Fallback: let dayjs try to parse it
  const fallback = dayjs(str);
  if (fallback.isValid()) return fallback;

  return null;
}

/**
 * Filter rows by shift time boundaries.
 *
 * @param {Array} rows - Array of row objects from parseExcel
 * @param {'morning'|'night'} shift - Shift selection
 * @param {string} timestampColumn - The column name containing the timestamp
 * @returns {Array} Filtered rows
 */
export function filterByShift(rows, shift, timestampColumn) {
  if (!timestampColumn) return rows;
  if (shift === 'all') return rows;

  // Find the earliest calendar date present in the dataset (time stripped off)
  let minDate = null;
  for (const row of rows) {
    const ts = parseTimestamp(row[timestampColumn]);
    if (ts && ts.isValid()) {
      const dayStart = ts.startOf('day');
      if (!minDate || dayStart.isBefore(minDate)) {
        minDate = dayStart;
      }
    }
  }

  if (!minDate) return [];

  // Night shift window: 20:00 on the earliest day -> 08:00 on the following day
  const nightStart = minDate.add(20, 'hour');
  const nightEnd = minDate.add(1, 'day').add(8, 'hour');

  return rows.filter((row) => {
    const ts = parseTimestamp(row[timestampColumn]);
    if (!ts || !ts.isValid()) return false;

    const hour = ts.hour();
    const minute = ts.minute();
    const totalMinutes = hour * 60 + minute;

    if (shift === 'morning') {
      // Morning: 08:00–20:00, same day — applies to any day present in the file
      return totalMinutes >= 480 && totalMinutes < 1200; // 8*60=480, 20*60=1200
    } else {
      // Night: bounded to the single window from the earliest day's 20:00
      // through the following day's 08:00 (no other day's hours qualify)
      return (ts.isSame(nightStart) || ts.isAfter(nightStart)) && ts.isBefore(nightEnd);
    }
  });
}

/**
 * Get the formatted date string from the first row's timestamp.
 */
export function getDateFromRows(rows, timestampColumn) {
  if (!rows.length || !timestampColumn) return '';
  const ts = parseTimestamp(rows[0][timestampColumn]);
  return ts ? ts.format('YYYY-MM-DD') : '';
}
