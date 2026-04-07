import { useGeneration, t } from '../context/GenerationContext';
import { MODELS } from './Header';
import AudioPlayer from './AudioPlayer';

export default function GenerationBar({ bar, index }) {
  const { updateBar, removeBar, translateBar, generateBar } = useGeneration();

  const isTranslating = bar.status === 'translating';
  const isGenerating = bar.status === 'generating';
  const isComplete = bar.status === 'complete';
  const isError = bar.status === 'error';
  const isProcessing = isTranslating || isGenerating;

  // Auto duration: 0 means let API decide
  const isAutoDuration = bar.duration === 0;

  return (
    <div className={`card p-6 fade-in ${isComplete ? 'border-[var(--success)]/30' : ''}`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-5">
        <div className="flex items-center gap-4 flex-1">
          {/* Index badge */}
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-sm font-medium ${
            isComplete
              ? 'bg-[rgba(124,179,135,0.15)] text-[var(--success)]'
              : 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)]'
          }`}>
            {isComplete ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M5 13l4 4L19 7"/>
              </svg>
            ) : (
              <span>{index + 1}</span>
            )}
          </div>

          <input
            type="text"
            value={bar.title}
            onChange={(e) => updateBar(bar.id, { title: e.target.value })}
            placeholder={t('soundTitle')}
            className="input flex-1 max-w-xs"
          />

          <select
            value={bar.model}
            onChange={(e) => updateBar(bar.id, { model: e.target.value })}
            className="select"
          >
            {MODELS.map(m => (
              <option key={m.id} value={m.id}>{m.name}</option>
            ))}
          </select>
        </div>

        <button
          onClick={() => removeBar(bar.id)}
          disabled={isProcessing}
          className="btn btn-ghost p-2 text-[var(--text-muted)] hover:text-[var(--error)]"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
            <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
          </svg>
        </button>
      </div>

      {/* Parameters */}
      <div className="grid grid-cols-2 gap-6 mb-5">
        {/* Influence slider */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3 flex-1">
            <span className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider w-20">{t('guidance')}</span>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={bar.promptInfluence}
              onChange={(e) => updateBar(bar.id, { promptInfluence: parseFloat(e.target.value) })}
              className="slider flex-1"
            />
            <span className="text-sm font-mono text-[var(--text-secondary)] w-8 text-right">{bar.promptInfluence.toFixed(2)}</span>
          </div>
        </div>

        {/* Duration with Auto/Manual toggle */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3 flex-1">
            <span className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider w-20">{t('duration')}</span>

            {/* Toggle switch */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={() => updateBar(bar.id, { duration: 0 })}
                className={`px-2 py-1 text-[10px] font-medium rounded transition-all ${
                  isAutoDuration
                    ? 'bg-[var(--accent-primary)] text-white'
                    : 'bg-[var(--bg-tertiary)] text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
                }`}
              >
                AUTO
              </button>
              <button
                onClick={() => updateBar(bar.id, { duration: bar.duration || 5 })}
                className={`px-2 py-1 text-[10px] font-medium rounded transition-all ${
                  !isAutoDuration
                    ? 'bg-[var(--accent-primary)] text-white'
                    : 'bg-[var(--bg-tertiary)] text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
                }`}
              >
                MANUAL
              </button>
            </div>

            {/* Manual duration slider */}
            {!isAutoDuration && (
              <>
                <input
                  type="range"
                  min="0.5"
                  max="30"
                  step="0.5"
                  value={bar.duration}
                  onChange={(e) => updateBar(bar.id, { duration: parseFloat(e.target.value) })}
                  className="slider flex-1"
                />
                <span className="text-sm font-mono text-[var(--text-secondary)] w-10 text-right">{bar.duration}s</span>
              </>
            )}

            {/* Auto indicator */}
            {isAutoDuration && (
              <span className="text-sm text-[var(--text-muted)] italic">API decides</span>
            )}
          </div>
        </div>
      </div>

      {/* Loop toggle */}
      <div className="flex items-center gap-3 mb-5">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={bar.loop}
            onChange={(e) => updateBar(bar.id, { loop: e.target.checked })}
            className="checkbox"
          />
          <span className="text-sm text-[var(--text-secondary)]">Loop</span>
        </label>
        <span className="text-xs text-[var(--text-muted)]">— repeat audio continuously</span>
      </div>

      {/* Prompt */}
      <div className="flex gap-3 mb-5">
        <div className="flex-1 relative">
          <textarea
            value={bar.promptChinese}
            onChange={(e) => updateBar(bar.id, { promptChinese: e.target.value })}
            placeholder={t('enterSoundDescription')}
            className="textarea h-24 pr-12"
          />
          <span className="absolute bottom-3 right-3 text-xs text-[var(--text-muted)]">
            {bar.promptChinese.length}
          </span>
        </div>

        <div className="flex flex-col gap-2 w-36">
          <button
            onClick={() => translateBar(bar.id)}
            disabled={!bar.promptChinese || isProcessing}
            className="btn btn-secondary flex-1"
          >
            {isTranslating ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                </svg>
                {t('translating')}
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                  <path d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129"/>
                </svg>
                {t('translate')}
              </span>
            )}
          </button>

          <button
            onClick={() => generateBar(bar.id)}
            disabled={!bar.promptChinese || isProcessing}
            className="btn btn-primary flex-1"
          >
            {isGenerating ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                </svg>
                {t('generating')}
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                  <path d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"/>
                  <path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
                {t('generate')}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Error state */}
      {isError && (
        <div className="flex items-center gap-3 p-4 bg-[var(--error)]/10 border border-[var(--error)]/20 rounded-lg mb-4">
          <svg className="w-5 h-5 text-[var(--error)] flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
            <path d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
          <span className="text-sm text-[var(--error)]">{bar.error}</span>
        </div>
      )}

      {/* Progress state */}
      {isGenerating && (
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-[var(--text-muted)]">{t('generatingAudio')}</span>
            <span className="text-[var(--accent-primary)] font-mono">{bar.progress}%</span>
          </div>
          <div className="progress">
            <div className="progress-bar" style={{ width: `${bar.progress}%` }}/>
          </div>
        </div>
      )}

      {/* Audio player */}
      {isComplete && <AudioPlayer bar={bar} />}
    </div>
  );
}
