import { useState, useRef, useEffect } from 'react';

export default function CreatedByFilter({ options, selected, onChange }) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) setIsOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!options.length) return null;

  const allSelected = selected.size === options.length;
  const noneSelected = selected.size === 0;

  const toggleOption = (opt) => {
    const next = new Set(selected);
    next.has(opt) ? next.delete(opt) : next.add(opt);
    onChange(next);
  };

  const toggleAll = () => onChange(allSelected ? new Set() : new Set(options));

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm bg-white/80 border border-surface-300/50 text-surface-800 hover:bg-white transition-colors duration-150 cursor-pointer"
      >
        <span>Created By</span>
        <span className="text-xs text-surface-500">
          {allSelected ? 'All' : noneSelected ? 'None' : `${selected.size}/${options.length}`}
        </span>
        <svg className={`w-4 h-4 text-surface-500 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute z-10 mt-2 w-56 max-h-72 overflow-y-auto glass rounded-xl p-3 shadow-lg border border-surface-200/60">
          <button
            onClick={toggleAll}
            className="w-full text-left text-xs font-medium text-primary-500 hover:text-primary-600 mb-2 cursor-pointer"
          >
            {allSelected ? 'Deselect all' : 'Select all'}
          </button>
          <div className="flex flex-col gap-1.5">
            {options.map((opt) => (
              <label key={opt} className="flex items-center gap-2 text-sm text-surface-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selected.has(opt)}
                  onChange={() => toggleOption(opt)}
                  className="rounded border-surface-300 text-primary-600 focus:ring-primary-500 cursor-pointer"
                />
                {opt || '(blank)'}
              </label>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}