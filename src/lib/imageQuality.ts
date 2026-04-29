const MAX_DISPLAY_WIDTH = 1920;
const OUTPUT_QUALITY = 0.86;

const getImageMimeType = () => {
  const canvas = document.createElement('canvas');
  return canvas.toDataURL('image/webp').startsWith('data:image/webp') ? 'image/webp' : 'image/jpeg';
};

const blobFromCanvas = (canvas: HTMLCanvasElement, type: string, quality: number) =>
  new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error('Could not process image'));
    }, type, quality);
  });

export async function normalizePropertyPhoto(file: File): Promise<File> {
  if (!file.type.startsWith('image/')) return file;

  try {
    const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
    const scale = Math.min(1, MAX_DISPLAY_WIDTH / bitmap.width);
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');
    if (!ctx) return file;

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.filter = 'brightness(1.015) contrast(1.045) saturate(1.025)';
    ctx.drawImage(bitmap, 0, 0, width, height);
    bitmap.close();

    const type = getImageMimeType();
    const blob = await blobFromCanvas(canvas, type, OUTPUT_QUALITY);
    const ext = type === 'image/webp' ? 'webp' : 'jpg';
    const baseName = file.name.replace(/\.[^.]+$/, '') || 'property-photo';

    return new File([blob], `${baseName}.${ext}`, {
      type,
      lastModified: Date.now(),
    });
  } catch {
    return file;
  }
}

export function storageDisplayImageUrl(publicUrl: string, width = MAX_DISPLAY_WIDTH, quality = 82) {
  if (!publicUrl.includes('/storage/v1/object/public/')) return publicUrl;
  const transformed = publicUrl.replace('/storage/v1/object/public/', '/storage/v1/render/image/public/');
  const separator = transformed.includes('?') ? '&' : '?';
  return `${transformed}${separator}width=${width}&quality=${quality}&resize=contain`;
}