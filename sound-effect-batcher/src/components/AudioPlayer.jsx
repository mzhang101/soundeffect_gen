import { useRef, useState, useEffect, useCallback } from 'react';
import { t } from '../context/GenerationContext';

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
    bgGradient.addColorStop(0, 'rgba(20, 20, 20, 0.95)');
    bgGradient.addColorStop(1, 'rgba(15, 15, 15, 0.98)');
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, width, height);

    const barCount = 48;
    const barWidth = (width - barCount * 2) / barCount;
    const centerY = height / 2;

    // Draw center line
    ctx.strokeStyle = 'rgba(212, 165, 116, 0.15)';
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
      gradient.addColorStop(0, 'rgba(212, 165, 116, 0.9)');
      gradient.addColorStop(0.5, 'rgba(212, 165, 116, 0.6)');
      gradient.addColorStop(1, 'rgba(184, 149, 108, 0.4)');

      // Draw rounded bar
      ctx.fillStyle = gradient;
      ctx.beginPath();
      const radius = Math.min(barWidth / 2, 2);
      ctx.roundRect(x, y, barWidth, barHeight, radius);
      ctx.fill();

      // Add subtle glow when idle
      if (!isPlaying) {
        ctx.shadowColor = 'rgba(212, 165, 116, 0.3)';
        ctx.shadowBlur = 4;
        ctx.fill();
        ctx.shadowBlur = 0;
      }
    }
  }, [isPlaying]);

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
      ctx.fillStyle = 'rgba(15, 15, 15, 0.85)';
      ctx.fillRect(0, 0, width, height);

      // Draw center line
      ctx.strokeStyle = 'rgba(212, 165, 116, 0.2)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, centerY);
      ctx.lineTo(width, centerY);
      ctx.stroke();

      for (let i = 0; i < barCount; i++) {
        const value = dataArray[i] || 0;
        const normalizedValue = value / 255;
        const barHeight = Math.max(3, normalizedValue * (height * 0.85));

        const x = i * (barWidth + 2) + 1;
        const y = centerY - barHeight / 2;

        // Dynamic gradient based on intensity
        const gradient = ctx.createLinearGradient(x, y + barHeight, x, y);
        const alpha = 0.5 + normalizedValue * 0.5;
        gradient.addColorStop(0, `rgba(212, 165, 116, ${alpha})`);
        gradient.addColorStop(0.4, `rgba(232, 185, 136, ${alpha * 0.8})`);
        gradient.addColorStop(1, `rgba(184, 149, 108, ${alpha * 0.5})`);

        ctx.fillStyle = gradient;

        // Draw rounded bar
        ctx.beginPath();
        const radius = Math.min(barWidth / 2, 2);
        ctx.roundRect(x, y, barWidth, barHeight, radius);
        ctx.fill();

        // Glow effect for active bars
        if (normalizedValue > 0.3) {
          ctx.shadowColor = 'rgba(212, 165, 116, 0.5)';
          ctx.shadowBlur = 6 * normalizedValue;
          ctx.fill();
          ctx.shadowBlur = 0;
        }
      }
    };

    drawFrame();
  }, []);

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

    if (isPlaying) {
      audio.pause();
    } else {
      initAudio();
      if (audioContextRef.current?.state === 'suspended') {
        audioContextRef.current.resume();
      }
      audio.play().then(() => startVisualization()).catch(console.error);
    }
  }, [isPlaying, initAudio, startVisualization]);

  // Setup audio events
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onTimeUpdate = () => setCurrentTime(audio.currentTime);
    const onLoadedMetadata = () => setDuration(audio.duration);
    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
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
    audio.addEventListener('ended', onEnded);

    return () => {
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('loadedmetadata', onLoadedMetadata);
      audio.removeEventListener('play', onPlay);
      audio.removeEventListener('pause', onPause);
      audio.removeEventListener('ended', onEnded);
    };
  }, [drawVisualizer]);

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

  const handleDownload = () => {
    if (!bar.audioUrl) return;
    const a = document.createElement('a');
    a.href = bar.audioUrl;
    a.download = bar.audioName || `${bar.title || 'sound'}.mp3`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div
      ref={containerRef}
      className="relative bg-gradient-to-b from-[rgba(26,26,26,0.8)] to-[rgba(20,20,20,0.95)] rounded-xl p-4 border border-[rgba(212,165,116,0.15)] backdrop-blur-sm transition-all duration-300 hover:border-[rgba(212,165,116,0.25)]"
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
          className="group w-9 h-9 rounded-full bg-gradient-to-br from-[#d4a574] to-[#b8956c] flex items-center justify-center transition-all duration-200 hover:from-[#e0b585] hover:to-[#c4a078] hover:shadow-lg hover:shadow-[rgba(212,165,116,0.3)] active:scale-95 flex-shrink-0"
        >
          {isPlaying ? (
            <svg className="w-3.5 h-3.5 text-[#1a1a1a]" fill="currentColor" viewBox="0 0 24 24">
              <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/>
            </svg>
          ) : (
            <svg className="w-3.5 h-3.5 text-[#1a1a1a] translate-x-0.5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z"/>
            </svg>
          )}
        </button>

        {/* Time */}
        <div className="font-mono text-[11px] text-[rgba(255,255,255,0.45)] tabular-nums w-9 flex-shrink-0">
          {formatTime(currentTime)}
        </div>

        {/* Progress bar */}
        <div
          className="flex-1 group relative h-1 bg-[rgba(255,255,255,0.08)] rounded-full cursor-pointer overflow-hidden"
          onClick={handleSeek}
        >
          {/* Progress fill */}
          <div
            className="absolute top-0 left-0 h-full bg-gradient-to-r from-[#d4a574] to-[#c4a078] rounded-full transition-all duration-100"
            style={{ width: `${progress}%` }}
          />
          {/* Glow dot */}
          <div
            className="absolute top-1/2 -translate-y-1/2 w-2.5 h-2.5 bg-[#d4a574] rounded-full shadow-[0_0_6px_rgba(212,165,116,0.6)] opacity-0 group-hover:opacity-100 transition-opacity duration-200"
            style={{ left: `calc(${progress}% - 5px)` }}
          />
        </div>

        {/* Duration */}
        <div className="font-mono text-[11px] text-[rgba(255,255,255,0.3)] tabular-nums w-9 text-right flex-shrink-0">
          {formatTime(duration)}
        </div>

        {/* Volume - compact */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <svg className="w-3.5 h-3.5 text-[rgba(255,255,255,0.35)]" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
            <path d="M15.536 8.464a5 5 0 010 7.072M18.364 5.636a9 9 0 010 12.728M11 5L6 9H2v6h4l5 4V5z"/>
          </svg>
          <div className="w-12 h-0.5 bg-[rgba(255,255,255,0.08)] rounded-full overflow-hidden">
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={volume}
              onChange={handleVolume}
              className="w-full h-full appearance-none bg-transparent cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-2 [&::-webkit-slider-thumb]:h-2 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#d4a574] [&::-webkit-slider-thumb]:shadow-[0_0_3px_rgba(212,165,116,0.5)]"
            />
          </div>
        </div>

        {/* Download */}
        <button
          onClick={handleDownload}
          className="px-3 py-1.5 rounded-md bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.08)] text-[rgba(255,255,255,0.5)] text-[11px] font-medium transition-all duration-200 hover:bg-[rgba(255,255,255,0.08)] hover:border-[rgba(255,255,255,0.15)] hover:text-white active:scale-95 flex-shrink-0"
        >
          {t('downloadAudio')}
        </button>
      </div>

      {/* File name - compact */}
      <div className="mt-2 pt-2 border-t border-[rgba(255,255,255,0.04)] flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-[#4ade80] animate-pulse" />
          <span className="text-[11px] text-[rgba(255,255,255,0.35)] truncate max-w-[180px]">
            {bar.audioName || bar.title || t('audioReady')}
          </span>
        </div>
        <span className="text-[10px] text-[rgba(255,255,255,0.2)]">MP3</span>
      </div>
    </div>
  );
}
