import * as XLSX from 'xlsx';

/**
 * Parse an uploaded Excel file and return an array of row objects.
 * Uses the first row as headers.
 */
export async function parseExcel(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array', cellDates: true });

        // Use the first sheet
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];

        // Convert to JSON with headers from first row
        const jsonData = XLSX.utils.sheet_to_json(worksheet, {
          defval: '',
          raw: true,
        });

        if (jsonData.length === 0) {
          reject(new Error('The Excel file is empty or has no data rows.'));
          return;
        }

        // Extract headers
        const headers = Object.keys(jsonData[0]);

        resolve({ headers, rows: jsonData });
      } catch (err) {
        reject(new Error(`Failed to parse Excel file: ${err.message}`));
      }
    };

    reader.onerror = () => reject(new Error('Failed to read the file.'));
    reader.readAsArrayBuffer(file);
  });
}
