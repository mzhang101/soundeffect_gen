import Papa from 'papaparse';

export function parseCSV(file) {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      encoding: 'UTF-8',
      complete: (results) => {
        const bars = results.data
          .filter(row => row.id && row.description_en)
          .map(row => ({
            id: crypto.randomUUID(),
            title: row.name || row.id,
            model: 'eleven_text_to_sound_v2',
            promptInfluence: 0.3,
            duration: parseFloat(row.duration_seconds) || 5.0,
            promptChinese: row.description_en || '',
            status: 'idle',
            audioUrl: null,
            audioName: null,
            error: null,
            progress: 0,
            createdAt: Date.now(),
          }));
        resolve(bars);
      },
      error: reject
    });
  });
}
