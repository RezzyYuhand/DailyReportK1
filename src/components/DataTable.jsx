import { useState } from 'react';
import { copyAsTSV } from '../utils/clipboard';

export default function DataTable({ title, headers, data, accentColor }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    const success = await copyAsTSV(data);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const colorClasses = {
    red: {
      badge: 'bg-primary-600/20 text-primary-400',
      headerBg: 'bg-primary-600/10',
      ring: 'ring-primary-500/20',
    },
    orange: {
      badge: 'bg-warning-400/20 text-warning-400',
      headerBg: 'bg-warning-400/10',
      ring: 'ring-warning-400/20',
    },
    green: {
      badge: 'bg-success-400/20 text-success-400',
      headerBg: 'bg-success-400/10',
      ring: 'ring-success-400/20',
    },
  };

  const colors = colorClasses[accentColor] || colorClasses.red;

  return (
    <div className="animate-fade-in">
      {/* Header bar */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <h3 className="text-surface-900 font-semibold">{title}</h3>
          <span className={`badge ${colors.badge}`}>
            {data.length} row{data.length !== 1 ? 's' : ''}
          </span>
        </div>
        <button
          id={`copy-btn-${title.toLowerCase()}`}
          onClick={handleCopy}
          disabled={data.length === 0}
          className={`
            flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium
            transition-all duration-200 cursor-pointer
            ${copied
              ? 'bg-success-400/20 text-success-600 border border-success-400/40'
              : 'bg-white text-surface-700 border border-surface-300 hover:bg-surface-100 hover:text-surface-900'
            }
            disabled:opacity-40 disabled:cursor-not-allowed
          `}
        >
          {copied ? (
            <>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              Copied!
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <rect x="9" y="9" width="13" height="13" rx="2" />
                <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
              </svg>
              Copy TSV
            </>
          )}
        </button>
      </div>

      {/* Table */}
      {data.length === 0 ? (
        <div className="glass-light rounded-xl p-10 text-center">
          <p className="text-surface-600 text-sm">No data to display for this format.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl ring-1 ring-surface-200 bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className={`${colors.headerBg}`}>
                <th className="px-3 py-2.5 text-left text-xs font-semibold text-surface-500 w-10">#</th>
                {headers.map((h, i) => (
                  <th
                    key={i}
                    className="px-3 py-2.5 text-left text-xs font-semibold text-surface-600 whitespace-nowrap"
                  >
                    {h || '—'}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-200/60">
              {data.map((row, rowIdx) => (
                <tr
                  key={rowIdx}
                  className="hover:bg-surface-50 transition-colors duration-100"
                >
                  <td className="px-3 py-2 text-xs text-surface-500">{rowIdx + 1}</td>
                  {row.map((cell, cellIdx) => (
                    <td
                      key={cellIdx}
                      className="px-3 py-2 text-surface-800 whitespace-nowrap max-w-48 truncate"
                      title={cell}
                    >
                      {cell || <span className="text-surface-400">—</span>}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
