/**
 * Escape a CSV cell value — wraps in quotes if it contains commas, quotes, or newlines.
 */
function escapeCSVCell(value: string): string {
  if (value.includes('"') || value.includes(',') || value.includes('\n') || value.includes('\r')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

/**
 * Build a CSV string from headers and rows, trigger a browser download.
 */
export function exportToCSV(filename: string, headers: string[], rows: string[][]): void {
  const csvLines: string[] = [
    headers.map(escapeCSVCell).join(','),
    ...rows.map(row => row.map(cell => escapeCSVCell(cell ?? '')).join(',')),
  ];

  const csvContent = csvLines.join('\r\n');
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = filename.endsWith('.csv') ? filename : `${filename}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
