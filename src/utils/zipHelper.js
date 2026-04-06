import JSZip from 'jszip';

export async function downloadAllAsZip(bars) {
  const zip = new JSZip();

  const completedBars = bars.filter(b => b.status === 'complete' && b.audioUrl);

  if (completedBars.length === 0) {
    alert('No completed audio to download');
    return;
  }

  for (const bar of completedBars) {
    const filename = bar.audioName || `${bar.title}.mp3`;
    if (bar.audioBlob) {
      zip.file(filename, bar.audioBlob);
    } else {
      // For mock URLs, fetch and add
      try {
        const response = await fetch(bar.audioUrl);
        const blob = await response.blob();
        zip.file(filename, blob);
      } catch (e) {
        console.warn(`Failed to fetch audio for ${filename}:`, e);
      }
    }
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
}
