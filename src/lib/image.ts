/**
 * Downscale + re-encode an image file to a compact data URL, so challenge
 * evidence and future photo uploads don't bloat IndexedDB / sync payloads.
 * (Production roadmap: move large binaries to Supabase Storage — see docs.)
 */
export async function compressImage(file: File, maxEdge = 1280, quality = 0.82): Promise<string> {
  const dataUrl = await readAsDataURL(file);
  if (typeof document === "undefined") return dataUrl;

  const img = await loadImage(dataUrl);
  const scale = Math.min(1, maxEdge / Math.max(img.width, img.height));
  if (scale >= 1 && file.size < 300_000) return dataUrl;

  const canvas = document.createElement("canvas");
  canvas.width = Math.round(img.width * scale);
  canvas.height = Math.round(img.height * scale);
  const ctx = canvas.getContext("2d");
  if (!ctx) return dataUrl;
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/jpeg", quality);
}

function readAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}
