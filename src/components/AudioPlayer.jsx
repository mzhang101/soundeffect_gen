import { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import { t } from '../context/GenerationContext';
import { useTheme } from '../context/ThemeContext';

// Premium AudioPlayer with sleek DAW-inspired design
export default function AudioPlayer({ bar }) {
  const audioRef = useRef(null);
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const containerRef = useRef(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isHovering, setIsHovering] = useState(false);

  const { theme } = useTheme();

  const isCrossOriginHttpUrl = useCallback((url) => {
    if (!url || !/^https?:\/\//i.test(url)) {
      return false;
    }

    try {
      const parsed = new URL(url, window.location.origin);
      return parsed.origin !== window.location.origin;
    } catch {
      return false;
    }
  }, []);

  // Theme-aware colors
  const colors = useMemo(() => (theme === 'dark' ? {
    bgGradientStart: 'rgba(20, 20, 20, 0.95)',
    bgGradientEnd: 'rgba(15, 15, 15, 0.98)',
    accentPrimary: '#d4a574',
    accentSecondary: '#c4a078',
    accentMuted: 'rgba(212, 165, 116, 0.4)',
    textPrimary: 'rgba(255, 255, 255, 0.45)',
    textSecondary: 'rgba(255, 255, 255, 0.3)',
    textMuted: 'rgba(255, 255, 255, 0.2)',
    progressBg: 'rgba(255, 255, 255, 0.08)',
    borderSubtle: 'rgba(212, 165, 116, 0.15)',
    borderHover: 'rgba(212, 165, 116, 0.25)',
    btnBg: 'rgba(255, 255, 255, 0.05)',
    btnBorder: 'rgba(255, 255, 255, 0.08)',
    btnText: 'rgba(255, 255, 255, 0.5)',
    containerBgFrom: 'rgba(26, 26, 26, 0.8)',
    containerBgTo: 'rgba(20, 20, 20, 0.95)',
    dividerBorder: 'rgba(255, 255, 255, 0.04)',
    readyDot: '#4ade80',
  } : {
    bgGradientStart: 'rgba(250, 250, 250, 0.95)',
    bgGradientEnd: 'rgba(245, 245, 245, 0.98)',
    accentPrimary: '#e84932',
    accentSecondary: '#f36b2e',
    accentMuted: 'rgba(232, 73, 50, 0.4)',
    textPrimary: 'rgba(26, 26, 26, 0.45)',
    textSecondary: 'rgba(26, 26, 26, 0.3)',
    textMuted: 'rgba(26, 26, 26, 0.2)',
    progressBg: 'rgba(26, 26, 26, 0.08)',
    borderSubtle: 'rgba(232, 73, 50, 0.15)',
    borderHover: 'rgba(232, 73, 50, 0.25)',
    btnBg: 'rgba(26, 26, 26, 0.04)',
    btnBorder: 'rgba(26, 26, 26, 0.08)',
    btnText: 'rgba(26, 26, 26, 0.5)',
    containerBgFrom: 'rgba(250, 250, 250, 0.8)',
    containerBgTo: 'rgba(245, 245, 245, 0.95)',
    dividerBorder: 'rgba(26, 26, 26, 0.06)',
    readyDot: '#4ade80',
  }), [theme]);

  // Draw sleek waveform visualizer
  const drawVisualizer = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();

    // Set canvas size for retina
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const width = rect.width;
    const height = rect.height;

    // Background with subtle gradient
    const bgGradient = ctx.createLinearGradient(0, 0, 0, height);
    bgGradient.addColorStop(0, colors.bgGradientStart);
    bgGradient.addColorStop(1, colors.bgGradientEnd);
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, width, height);

    const barCount = 48;
    const barWidth = (width - barCount * 2) / barCount;
    const centerY = height / 2;

    // Draw center line
    ctx.strokeStyle = colors.accentMuted;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, centerY);
    ctx.lineTo(width, centerY);
    ctx.stroke();

    for (let i = 0; i < barCount; i++) {
      // Static idle animation - subtle sine wave
      const idleHeight = 3 + Math.sin(i * 0.25) * 2 + Math.sin(Date.now() * 0.002 + i * 0.1) * 1;
      const barHeight = isPlaying ? 0 : idleHeight;

      // Calculate bar position
      const x = i * (barWidth + 2) + 1;
      const y = centerY - barHeight / 2;

      // Create gradient for each bar
      const gradient = ctx.createLinearGradient(x, y + barHeight, x, y);
      gradient.addColorStop(0, colors.accentPrimary);
      gradient.addColorStop(0.5, colors.accentMuted);
      gradient.addColorStop(1, colors.accentMuted);

      // Draw rounded bar
      ctx.fillStyle = gradient;
      ctx.beginPath();
      const radius = Math.min(barWidth / 2, 2);
      ctx.roundRect(x, y, barWidth, barHeight, radius);
      ctx.fill();

      // Add subtle glow when idle
      if (!isPlaying) {
        ctx.shadowColor = colors.accentPrimary;
        ctx.shadowBlur = 4;
        ctx.fill();
        ctx.shadowBlur = 0;
      }
    }
  }, [isPlaying, colors]);

  // Initialize and run visualizer
  const startVisualization = useCallback(() => {
    const canvas = canvasRef.current;
    const analyser = analyserRef.current;
    if (!canvas || !analyser) return;

    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();

    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const width = rect.width;
    const height = rect.height;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const barCount = 48;
    const barWidth = (width - barCount * 2) / barCount;
    const centerY = height / 2;

    const drawFrame = () => {
      animationRef.current = requestAnimationFrame(drawFrame);
      analyser.getByteFrequencyData(dataArray);

      // Clear with subtle fade
      ctx.fillStyle = theme === 'dark' ? 'rgba(15, 15, 15, 0.85)' : 'rgba(250, 250, 250, 0.85)';
      ctx.fillRect(0, 0, width, height);

      // Draw center line
      ctx.strokeStyle = colors.accentPrimary;
      ctx.globalAlpha = 0.2;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, centerY);
      ctx.lineTo(width, centerY);
      ctx.stroke();
      ctx.globalAlpha = 1;

      for (let i = 0; i < barCount; i++) {
        const value = dataArray[i] || 0;
        const normalizedValue = value / 255;
        const barHeight = Math.max(3, normalizedValue * (height * 0.85));

        const x = i * (barWidth + 2) + 1;
        const y = centerY - barHeight / 2;

        // Dynamic gradient based on intensity
        const gradient = ctx.createLinearGradient(x, y + barHeight, x, y);
        const alpha = 0.5 + normalizedValue * 0.5;
        gradient.addColorStop(0, colors.accentPrimary);
        gradient.addColorStop(0.4, colors.accentSecondary);
        gradient.addColorStop(1, colors.accentMuted);

        ctx.fillStyle = gradient;
        ctx.globalAlpha = alpha;

        // Draw rounded bar
        ctx.beginPath();
        const radius = Math.min(barWidth / 2, 2);
        ctx.roundRect(x, y, barWidth, barHeight, radius);
        ctx.fill();

        // Glow effect for active bars
        if (normalizedValue > 0.3) {
          ctx.globalAlpha = 1;
          ctx.shadowColor = colors.accentPrimary;
          ctx.shadowBlur = 6 * normalizedValue;
          ctx.fill();
          ctx.shadowBlur = 0;
        }
      }
      ctx.globalAlpha = 1;
    };

    drawFrame();
  }, [theme, colors]);

  // Initialize audio context
  const initAudio = useCallback(() => {
    const audio = audioRef.current;
    if (!audio || audioContextRef.current) return;

    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 128;
      analyser.smoothingTimeConstant = 0.75;

      const source = audioContext.createMediaElementSource(audio);
      source.connect(analyser);
      analyser.connect(audioContext.destination);

      audioContextRef.current = audioContext;
      analyserRef.current = analyser;
    } catch (e) {
      console.error('Audio context init failed:', e);
    }
  }, []);

  // Toggle play
  const togglePlay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isCrossOriginHttpUrl(bar.audioUrl)) {
      alert('This audio URL is hosted on another domain and blocked by browser CORS. Please regenerate audio.');
      return;
    }

    if (isPlaying) {
      audio.pause();
    } else {
      initAudio();
      if (audioContextRef.current?.state === 'suspended') {
        audioContextRef.current.resume();
      }
      audio.play().then(() => startVisualization()).catch(console.error);
    }
  }, [bar.audioUrl, isCrossOriginHttpUrl, isPlaying, initAudio, startVisualization]);

  // Setup audio events
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onTimeUpdate = () => setCurrentTime(audio.currentTime);
    const onLoadedMetadata = () => setDuration(audio.duration);
    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onError = () => {
      if (isCrossOriginHttpUrl(bar.audioUrl)) {
        alert('Audio playback failed because the source is cross-origin without CORS permission. Please regenerate.');
        return;
      }
      alert('Audio playback failed. Please regenerate this sound.');
    };
    const onEnded = () => {
      setIsPlaying(false);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      drawVisualizer();
    };

    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('loadedmetadata', onLoadedMetadata);
    audio.addEventListener('play', onPlay);
    audio.addEventListener('pause', onPause);
    audio.addEventListener('error', onError);
    audio.addEventListener('ended', onEnded);

    return () => {
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('loadedmetadata', onLoadedMetadata);
      audio.removeEventListener('play', onPlay);
      audio.removeEventListener('pause', onPause);
      audio.removeEventListener('error', onError);
      audio.removeEventListener('ended', onEnded);
    };
  }, [bar.audioUrl, drawVisualizer, isCrossOriginHttpUrl]);

  // Draw idle visualizer
  useEffect(() => {
    if (!isPlaying) {
      drawVisualizer();
      const interval = setInterval(drawVisualizer, 50);
      return () => clearInterval(interval);
    }
  }, [isPlaying, drawVisualizer]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  const handleSeek = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const percentage = (e.clientX - rect.left) / rect.width;
    if (audioRef.current && duration) {
      audioRef.current.currentTime = percentage * duration;
    }
  };

  const handleVolume = (e) => {
    const v = parseFloat(e.target.value);
    setVolume(v);
    if (audioRef.current) audioRef.current.volume = v;
  };

  const formatTime = (s) => {
    if (!s || isNaN(s)) return '0:00';
    return `${Math.floor(s / 60)}:${Math.floor(s % 60).toString().padStart(2, '0')}`;
  };

  const progress = duration ? (currentTime / duration) * 100 : 0;
  const audioFormat = (bar.audioName?.split('.').pop() || 'mp3').toUpperCase();

  const handleDownload = () => {
    if (!bar.audioUrl) {
      alert('Audio not available. Please regenerate.');
      return;
    }

    // Check if it's a blob URL that's no longer valid
    if (bar.audioUrl.startsWith('blob:')) {
      // Verify the blob still exists by trying to create a new link
      const a = document.createElement('a');
      a.href = bar.audioUrl;
      a.download = `${bar.title || bar.audioName || 'sound'}.mp3`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } else if (bar.audioUrl.startsWith('http')) {
      if (isCrossOriginHttpUrl(bar.audioUrl)) {
        alert('Download blocked: this audio source is on another domain without CORS permission. Please regenerate audio.');
        return;
      }

      // For HTTP URLs, fetch and download
      fetch(bar.audioUrl)
        .then(res => {
          if (!res.ok) {
            throw new Error(`HTTP ${res.status}`);
          }
          return res.blob();
        })
        .then(blob => {
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `${bar.title || bar.audioName || 'sound'}.mp3`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        })
        .catch(() => {
          alert('Audio download failed. The page may have been refreshed after generation.');
        });
    }
  };

  return (
    <div
      ref={containerRef}
      className="relative rounded-xl p-4 border backdrop-blur-sm transition-all duration-300"
      style={{
        background: `linear-gradient(to bottom, ${colors.containerBgFrom}, ${colors.containerBgTo})`,
        borderColor: isHovering ? colors.borderHover : colors.borderSubtle,
      }}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      {/* Premium canvas visualizer - compact */}
      <canvas
        ref={canvasRef}
        className="w-full h-10 mb-3 rounded"
        style={{ width: '100%', height: '40px' }}
      />

      {/* Hidden audio */}
      <audio ref={audioRef} src={bar.audioUrl} />

      {/* Sleek controls - compact */}
      <div className="flex items-center gap-3">
        {/* Play/Pause - centered in button */}
        <button
          onClick={togglePlay}
          className="group w-9 h-9 rounded-full flex items-center justify-center transition-all duration-200 active:scale-95 flex-shrink-0"
          style={{
            background: `linear-gradient(135deg, ${colors.accentPrimary}, ${colors.accentSecondary})`,
            boxShadow: `0 2px 8px ${colors.accentPrimary}40`,
          }}
        >
          {isPlaying ? (
            <svg className="w-3.5 h-3.5" style={{ color: theme === 'dark' ? '#1a1a1a' : '#ffffff' }} fill="currentColor" viewBox="0 0 24 24">
              <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/>
            </svg>
          ) : (
            <svg className="w-3.5 h-3.5 translate-x-0.5" style={{ color: theme === 'dark' ? '#1a1a1a' : '#ffffff' }} fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z"/>
            </svg>
          )}
        </button>

        {/* Time */}
        <div className="font-mono text-[11px] tabular-nums w-9 flex-shrink-0" style={{ color: colors.textPrimary }}>
          {formatTime(currentTime)}
        </div>

        {/* Progress bar */}
        <div
          className="flex-1 group relative h-1 rounded-full cursor-pointer overflow-hidden"
          style={{ backgroundColor: colors.progressBg }}
          onClick={handleSeek}
        >
          {/* Progress fill */}
          <div
            className="absolute top-0 left-0 h-full rounded-full transition-all duration-100"
            style={{
              width: `${progress}%`,
              background: `linear-gradient(to right, ${colors.accentPrimary}, ${colors.accentSecondary})`,
            }}
          />
          {/* Glow dot */}
          <div
            className="absolute top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200"
            style={{
              left: `calc(${progress}% - 5px)`,
              backgroundColor: colors.accentPrimary,
              boxShadow: `0 0 6px ${colors.accentPrimary}`,
            }}
          />
        </div>

        {/* Duration */}
        <div className="font-mono text-[11px] tabular-nums w-9 text-right flex-shrink-0" style={{ color: colors.textSecondary }}>
          {formatTime(duration)}
        </div>

        {/* Volume - compact */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <svg className="w-3.5 h-3.5" style={{ color: colors.textPrimary }} fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
            <path d="M15.536 8.464a5 5 0 010 7.072M18.364 5.636a9 9 0 010 12.728M11 5L6 9H2v6h4l5 4V5z"/>
          </svg>
          <div className="w-12 h-0.5 rounded-full overflow-hidden" style={{ backgroundColor: colors.progressBg }}>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={volume}
              onChange={handleVolume}
              className="w-full h-full appearance-none bg-transparent cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-2 [&::-webkit-slider-thumb]:h-2 [&::-webkit-slider-thumb]:rounded-full"
              style={{ '--thumb-bg': colors.accentPrimary, '--thumb-shadow': `0 0 3px ${colors.accentPrimary}` }}
            />
          </div>
        </div>

        {/* Download */}
        <button
          onClick={handleDownload}
          className="px-3 py-1.5 rounded-md text-[11px] font-medium transition-all duration-200 active:scale-95 flex-shrink-0"
          style={{
            backgroundColor: colors.btnBg,
            borderColor: colors.btnBorder,
            borderWidth: '1px',
            borderStyle: 'solid',
            color: colors.btnText,
          }}
        >
          {t('downloadAudio')}
        </button>
      </div>

      {/* File name - compact */}
      <div className="mt-2 pt-2 flex items-center justify-between" style={{ borderTopColor: colors.dividerBorder, borderTopWidth: '1px', borderTopStyle: 'solid' }}>
        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: colors.readyDot }} />
          <span className="text-[11px] truncate max-w-[180px]" style={{ color: colors.textPrimary }}>
            {bar.audioName || bar.title || t('audioReady')}
          </span>
        </div>
        <span className="text-[10px]" style={{ color: colors.textMuted }}>{audioFormat}</span>
      </div>
    </div>
  );
}
