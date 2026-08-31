import { useState, useRef } from 'react';

const ICON_UPLOAD = (
  <svg className="w-12 h-12 text-primary-400" fill="none" viewBox="0 0 48 48" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M24 32V16m0 0l-6 6m6-6l6 6" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M40 32v4a4 4 0 01-4 4H12a4 4 0 01-4-4v-4" />
    <rect x="4" y="4" width="40" height="40" rx="6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const ICON_FILE = (
  <svg className="w-6 h-6 text-success-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

export default function UploadZone({ onFileLoaded, isLoading }) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [fileName, setFileName] = useState('');
  const inputRef = useRef(null);

  const handleFile = (file) => {
    if (!file) return;
    const validTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
    ];
    const isExcel = validTypes.includes(file.type) || file.name.endsWith('.xlsx') || file.name.endsWith('.xls');
    if (!isExcel) {
      alert('Please upload an Excel file (.xlsx or .xls)');
      return;
    }
    setFileName(file.name);
    onFileLoaded(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    handleFile(e.dataTransfer.files[0]);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => setIsDragOver(false);

  const handleClick = () => inputRef.current?.click();

  return (
    <div
      id="upload-zone"
      onClick={handleClick}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      className={`
        relative cursor-pointer rounded-2xl border-2 border-dashed p-10
        flex flex-col items-center justify-center gap-4
        transition-all duration-300 ease-out group
        ${isDragOver
          ? 'border-primary-400 bg-primary-500/10 scale-[1.01]'
          : fileName
            ? 'border-success-400/50 bg-success-400/5'
            : 'border-surface-300 hover:border-primary-500/50 hover:bg-surface-50/50'
        }
        ${isLoading ? 'pointer-events-none opacity-60' : ''}
      `}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".xlsx,.xls"
        className="hidden"
        onChange={(e) => handleFile(e.target.files[0])}
      />

      {isLoading ? (
        <div className="flex flex-col items-center gap-3 animate-fade-in">
          <div className="w-10 h-10 border-3 border-primary-400 border-t-transparent rounded-full animate-spin" />
          <p className="text-surface-600 text-sm">Parsing file...</p>
        </div>
      ) : fileName ? (
        <div className="flex items-center gap-3 animate-fade-in">
          {ICON_FILE}
          <div>
            <p className="text-surface-900 font-medium text-sm">{fileName}</p>
            <p className="text-surface-500 text-xs mt-0.5">Click or drop to replace</p>
          </div>
        </div>
      ) : (
        <>
          <div className="transition-transform duration-300 group-hover:scale-110 group-hover:-translate-y-1">
            {ICON_UPLOAD}
          </div>
          <div className="text-center">
            <p className="text-surface-700 font-medium">
              Drop your Excel file here
            </p>
            <p className="text-surface-600 text-sm mt-1">
              or <span className="text-primary-400 hover:underline">browse</span> to upload
            </p>
          </div>
          <span className="badge bg-surface-200 text-surface-700">.xlsx / .xls</span>
        </>
      )}
    </div>
  );
}
