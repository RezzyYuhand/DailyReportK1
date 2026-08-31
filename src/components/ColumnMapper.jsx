import { MAPPING_FIELDS } from '../utils/formatters';

export default function ColumnMapper({ headers, columnMap, onChange }) {
  const handleChange = (key, value) => {
    onChange({ ...columnMap, [key]: value });
  };

  return (
    <div id="column-mapper" className="glass rounded-2xl p-6 animate-slide-up">

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {MAPPING_FIELDS.map((field) => (
          <div key={field.key} className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-surface-700">
              {field.label}
              {field.required && <span className="text-danger-400 ml-1">*</span>}
            </label>
            <select
              value={columnMap[field.key] || ''}
              onChange={(e) => handleChange(field.key, e.target.value)}
              className={`
                w-full px-3 py-2 rounded-lg text-sm
                bg-white/80 border border-surface-300/50
                text-surface-800 focus:outline-none focus:border-primary-500/60
                transition-colors duration-150 cursor-pointer
                ${!columnMap[field.key] && field.required ? 'border-warning-400/40' : ''}
              `}
            >
              <option value="">— Not mapped —</option>
              {headers.map((h) => (
                <option key={h} value={h}>{h}</option>
              ))}
            </select>
          </div>
        ))}
      </div>
    </div>
  );
}
