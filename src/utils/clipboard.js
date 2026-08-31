/**
 * Copy a 2D array as TSV to clipboard.
 * Joins cells with tabs and rows with newlines.
 *
 * @param {Array<Array<string>>} data - 2D array of cell values
 * @param {Array<string>} [headers] - Optional header row
 * @returns {Promise<boolean>} Whether the copy was successful
 */
export async function copyAsTSV(data, headers = null) {
  const lines = [];

  if (headers) {
    lines.push(headers.join('\t'));
  }

  for (const row of data) {
    lines.push(row.join('\t'));
  }

  const tsv = lines.join('\n');

  try {
    await navigator.clipboard.writeText(tsv);
    return true;
  } catch (err) {
    // Fallback for older browsers
    const textarea = document.createElement('textarea');
    textarea.value = tsv;
    textarea.style.position = 'fixed';
    textarea.style.left = '-9999px';
    document.body.appendChild(textarea);
    textarea.select();
    try {
      document.execCommand('copy');
      return true;
    } catch {
      console.error('Failed to copy to clipboard:', err);
      return false;
    } finally {
      document.body.removeChild(textarea);
    }
  }
}
