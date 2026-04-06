import { useRef } from 'react';
import { useGeneration, t } from '../context/GenerationContext';
import { parseCSV } from '../services/csvParser';
import { downloadAllAsZip } from '../utils/zipHelper';

const MODELS = [
  { id: 'eleven_text_to_sound_v2', name: 'ElevenLabs Text-to-Sound v2' },
  { id: 'eleven_flash', name: 'ElevenLabs Flash' },
];

export { MODELS };

export default function Header() {
  const { addBar, importCSV, runAll, clearAll, generationBars, isRunningAll, runAllIndex, logout, toggleLocale, locale } = useGeneration();
  const fileInputRef = useRef(null);

  const completedCount = generationBars.filter(b => b.status === 'complete').length;
  const totalCount = generationBars.length;

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

  return (
    <header className="sticky top-0 z-40 bg-[var(--bg-primary)]/90 backdrop-blur-xl border-b border-[var(--border-subtle)]">
      <div className="px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Left: Logo & Status */}
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-[var(--accent-glow)] flex items-center justify-center">
                <svg className="w-4 h-4 text-[var(--accent-primary)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM12 3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2z"/>
                </svg>
              </div>
              <span className="text-base font-medium text-[var(--text-primary)]">{t('soundFxBatcher')}</span>
            </div>

            {/* Status indicator */}
            {isRunningAll && (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--accent-glow)]">
                <span className="status-dot processing" />
                <span className="text-xs font-medium text-[var(--accent-primary)]">
                  {t('processing')} {runAllIndex + 1} {t('of')} {totalCount}
                </span>
              </div>
            )}

            {!isRunningAll && totalCount > 0 && (
              <span className="text-sm text-[var(--text-muted)]">
                {completedCount} {t('of')} {totalCount} {t('generated')}
              </span>
            )}
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="hidden"
            />

            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isRunningAll}
              className="btn btn-secondary"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                <path d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/>
              </svg>
              {t('importCsv')}
            </button>

            <button
              onClick={addBar}
              disabled={isRunningAll}
              className="btn btn-secondary"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                <path d="M12 4v16m8-8H4"/>
              </svg>
              {t('addBar')}
            </button>

            <button
              onClick={runAll}
              disabled={isRunningAll || totalCount === 0}
              className="btn btn-primary"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                <path d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"/>
                <path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
              {isRunningAll ? t('running') : t('runAll')}
            </button>

            <button
              onClick={() => downloadAllAsZip(generationBars)}
              disabled={completedCount === 0}
              className="btn btn-secondary"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                <path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
              </svg>
              {t('download')} ({completedCount})
            </button>

            {totalCount > 0 && (
              <button
                onClick={clearAll}
                disabled={isRunningAll}
                className="btn btn-danger"
              >
                {t('clear')}
              </button>
            )}

            <div className="w-px h-6 bg-[var(--border-subtle)] mx-2" />

            {/* Language Toggle */}
            <button
              onClick={toggleLocale}
              className="btn btn-secondary text-xs px-3"
              title="Toggle Language"
            >
              {locale === 'en' ? '中文' : 'EN'}
            </button>

            <button
              onClick={logout}
              className="btn btn-ghost p-2"
              title="Logout"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                <path d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
              </svg>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
