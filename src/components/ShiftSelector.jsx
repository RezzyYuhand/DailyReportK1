const SHIFTS = [
  {
    id: 'all',
    label: 'All Day',
    time: '24 Hours',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    id: 'morning',
    label: 'Morning',
    time: '08:00 – 20:00',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <circle cx="12" cy="12" r="5" />
        <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
      </svg>
    ),
  },
  {
    id: 'night',
    label: 'Night',
    time: '20:00 – 08:00',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
      </svg>
    ),
  },
];

export default function ShiftSelector({ value, onChange }) {
  return (
    <div id="shift-selector" className="flex gap-2">
      {SHIFTS.map((shift) => (
        <button
          key={shift.id}
          onClick={() => onChange(shift.id)}
          className={`
            flex items-center gap-2 px-4 py-2.5 rounded-xl
            text-sm font-medium transition-all duration-200 cursor-pointer
            ${value === shift.id
              ? 'bg-primary-600/20 text-primary-300 border border-primary-500/40 shadow-lg shadow-primary-600/10'
              : 'bg-white/60 text-surface-600 border border-surface-200/40 hover:border-surface-300 hover:text-surface-900 hover:bg-white'
            }
          `}
        >
          <span className={value === shift.id ? 'text-primary-600' : 'text-surface-600'}>
            {shift.icon}
          </span>
          <span>{shift.label}</span>
          <span className={`text-xs ${value === shift.id ? 'text-primary-600/70' : 'text-surface-500'}`}>
            {shift.time}
          </span>
        </button>
      ))}
    </div>
  );
}
