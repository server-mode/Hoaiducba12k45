// High quality client-side image compression utility
// Strategy: resize large images down to max dimension, then attempt WebP encoding at descending qualities until size target met.
// Falls back to original if conversion fails.

export async function compressImageFile(file, options = {}) {
  const {
    maxDimension = 1920,          // max width or height
    targetMaxBytes = 350 * 1024,  // aim for <= 350KB
    initialQuality = 0.85,
    minQuality = 0.55,
    qualityStep = 0.1,
    mime = 'image/webp'
  } = options;

  if(!file || !file.type.startsWith('image/')) return file;
  // skip gif to preserve animation
  if(file.type === 'image/gif') return file;

  // Read as bitmap
  let bitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    return file; // fallback
  }

  // Determine resize
  let { width, height } = bitmap;
  const scale = Math.min(1, maxDimension / Math.max(width, height));
  if(scale < 1) { width = Math.round(width * scale); height = Math.round(height * scale); }

  const canvas = document.createElement('canvas');
  canvas.width = width; canvas.height = height;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(bitmap, 0, 0, width, height);

  // iterative quality attempts
  let quality = initialQuality;
  let bestBlob = null;
  while(quality >= minQuality) {
    const blob = await new Promise(res => canvas.toBlob(res, mime, quality));
    if(!blob) break;
    if(blob.size <= targetMaxBytes) { bestBlob = blob; break; }
    if(!bestBlob || blob.size < bestBlob.size) bestBlob = blob; // keep smallest so far
    quality -= qualityStep;
  }

  // if no improvement or best bigger than original, keep original
  if(!bestBlob || bestBlob.size >= file.size) return file;

  // attach original name with new extension
  const ext = mime.split('/')[1] || 'webp';
  const newName = file.name.replace(/\.[^.]+$/, '') + '.' + ext;
  return new File([bestBlob], newName, { type: mime, lastModified: Date.now() });
}

export async function compressMultiple(files, opts) {
  const out = [];
  for(const f of files) { out.push(await compressImageFile(f, opts)); }
  return out;
}
