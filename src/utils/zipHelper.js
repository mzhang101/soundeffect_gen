import JSZip from 'jszip';

export async function downloadAllAsZip(bars) {
  const zip = new JSZip();

  const completedBars = bars.filter(b => b.status === 'complete');

  if (completedBars.length === 0) {
    alert('No completed audio to download');
    return;
  }

  let successCount = 0;
  let failCount = 0;

  for (const bar of completedBars) {
    const filename = bar.audioName || `${bar.title || 'sound'}.mp3`;

    // Try audioBlob first (in-session)
    if (bar.audioBlob) {
      zip.file(filename, bar.audioBlob);
      successCount++;
    } else if (bar.audioUrl && bar.audioUrl.startsWith('http')) {
      // Try fetching HTTP URLs
      try {
        const response = await fetch(bar.audioUrl);
        if (response.ok) {
          const blob = await response.blob();
          zip.file(filename, blob);
          successCount++;
        } else {
          failCount++;
          console.warn(`Failed to fetch audio for ${filename}: HTTP ${response.status}`);
        }
      } catch (e) {
        failCount++;
        console.warn(`Failed to fetch audio for ${filename}:`, e.message);
      }
    } else {
      // Stale blob URL or no audio
      failCount++;
      console.warn(`Audio no longer available for ${filename}: blob URL expired after refresh`);
    }
  }

  if (successCount === 0) {
    alert('Audio downloads failed. This may happen if the page was refreshed after generation. Please regenerate the audio.');
    return;
  }

  const blob = await zip.generateAsync({ type: 'blob' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = `sound_effects_batch_${Date.now()}.zip`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  if (failCount > 0) {
    console.warn(`${failCount} audio(s) could not be added to zip - they need to be regenerated`);
  }
}
