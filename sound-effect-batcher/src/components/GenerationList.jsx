import { useRef } from 'react';
import { useGeneration, t } from '../context/GenerationContext';
import { parseCSV } from '../services/csvParser';
import GenerationBar from './GenerationBar';

export default function GenerationList() {
  const { generationBars, addBar, importCSV } = useGeneration();
  const fileInputRef = useRef(null);

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const bars = await parseCSV(file);
      importCSV(bars);
    } catch (error) {
      console.error('CSV parse error:', error);
    }
    e.target.value = '';
  };

  if (generationBars.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] px-6">
        {/* Empty state illustration */}
        <div className="relative mb-8">
          <div className="w-24 h-24 rounded-2xl bg-[var(--bg-tertiary)] border border-[var(--border-subtle)] flex items-center justify-center">
            <svg className="w-10 h-10 text-[var(--text-muted)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
              <path d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM12 3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2z"/>
            </svg>
          </div>
          {/* Decorative elements */}
          <div className="absolute -top-2 -right-2 w-4 h-4 rounded-full bg-[var(--accent-primary)] opacity-20"/>
          <div className="absolute -bottom-1 -left-3 w-6 h-6 rounded-full bg-[var(--accent-primary)] opacity-10"/>
        </div>

        <h2 className="text-xl font-medium text-[var(--text-primary)] mb-2">
          {t('noSoundEffectsYet')}
        </h2>
        <p className="text-[var(--text-muted)] text-center max-w-md mb-8">
          {t('importCsvOrAdd')}
        </p>

        {/* Action buttons */}
        <div className="flex items-center gap-3">
          <button
            onClick={addBar}
            className="btn btn-primary"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
              <path d="M12 4v16m8-8H4"/>
            </svg>
            {t('addGenerationBar')}
          </button>

          <button
            onClick={() => fileInputRef.current?.click()}
            className="btn btn-secondary"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
              <path d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/>
            </svg>
            {t('importCsv')}
          </button>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          onChange={handleFileChange}
          className="hidden"
        />

        {/* CSV Template download */}
        <div className="mt-8 p-4 bg-[var(--bg-secondary)] rounded-lg border border-[var(--border-subtle)]">
          <p className="text-xs text-[var(--text-muted)] mb-2">{t('needTemplate')}</p>
          <a
            href="/csv_template.csv"
            download="sound_fx_template.csv"
            className="text-sm text-[var(--accent-primary)] hover:underline flex items-center gap-1"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
              <path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
            </svg>
            {t('downloadCsvTemplate')}
          </a>
        </div>

        {/* Tips */}
        <div className="mt-8 p-4 bg-[var(--bg-secondary)] rounded-lg border border-[var(--border-subtle)] max-w-lg">
          <p className="text-xs text-[var(--text-muted)] uppercase tracking-wider mb-3">{t('tips')}</p>
          <ul className="text-sm text-[var(--text-secondary)] space-y-2">
            <li className="flex items-start gap-2">
              <span className="text-[var(--accent-primary)]">•</span>
              {t('csvFormat')}
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[var(--accent-primary)]">•</span>
              {t('useTranslateButton')}
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[var(--accent-primary)]">•</span>
              {t('adjustSettings')}
            </li>
          </ul>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="space-y-4 stagger">
        {generationBars.map((bar, index) => (
          <GenerationBar key={bar.id} bar={bar} index={index} />
        ))}
      </div>
    </div>
  );
}
