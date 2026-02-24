import { useState, useEffect } from 'react';

const cache = new Map<string, string>();

function extractDominantColor(imageUrl: string): Promise<string | null> {
  return new Promise((resolve) => {
    if (cache.has(imageUrl)) {
      resolve(cache.get(imageUrl)!);
      return;
    }

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const size = 50;
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        if (!ctx) { resolve(null); return; }

        ctx.drawImage(img, 0, 0, size, size);
        const { data } = ctx.getImageData(0, 0, size, size);

        const buckets = new Map<string, { count: number; r: number; g: number; b: number }>();

        for (let i = 0; i < data.length; i += 4) {
          const r = data[i], g = data[i + 1], b = data[i + 2], a = data[i + 3];

          // Skip transparent
          if (a < 128) continue;

          // Skip near-white
          if (r > 220 && g > 220 && b > 220) continue;

          // Skip near-black
          if (r < 35 && g < 35 && b < 35) continue;

          // Skip low-saturation grays
          const max = Math.max(r, g, b);
          const min = Math.min(r, g, b);
          if (max - min < 30) continue;

          // Bucket by rounding to nearest 16
          const kr = Math.round(r / 16) * 16;
          const kg = Math.round(g / 16) * 16;
          const kb = Math.round(b / 16) * 16;
          const key = `${kr},${kg},${kb}`;

          const existing = buckets.get(key);
          if (existing) {
            existing.count++;
          } else {
            buckets.set(key, { count: 1, r, g, b });
          }
        }

        if (buckets.size === 0) { resolve(null); return; }

        // Find the most popular bucket
        let best = { count: 0, r: 0, g: 0, b: 0 };
        for (const bucket of buckets.values()) {
          if (bucket.count > best.count) best = bucket;
        }

        const hex = `#${best.r.toString(16).padStart(2, '0')}${best.g.toString(16).padStart(2, '0')}${best.b.toString(16).padStart(2, '0')}`;
        cache.set(imageUrl, hex);
        resolve(hex);
      } catch {
        resolve(null);
      }
    };
    img.onerror = () => resolve(null);
    img.src = imageUrl;
  });
}

export function useExtractedColor(imageUrl: string | undefined | null): string | null {
  const [color, setColor] = useState<string | null>(
    imageUrl && cache.has(imageUrl) ? cache.get(imageUrl)! : null
  );

  useEffect(() => {
    if (!imageUrl) return;
    if (cache.has(imageUrl)) {
      setColor(cache.get(imageUrl)!);
      return;
    }
    let cancelled = false;
    extractDominantColor(imageUrl).then((c) => {
      if (!cancelled && c) setColor(c);
    });
    return () => { cancelled = true; };
  }, [imageUrl]);

  return color;
}
