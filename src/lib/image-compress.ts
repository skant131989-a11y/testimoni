/**
 * Client-side image compression via Canvas — used by the screenshot
 * import flows on the public tool page and the dashboard import
 * page. Loads the image, downscales to fit within MAX_DIM (px), then
 * re-encodes as JPEG at declining quality until the base64 payload
 * fits under maxBytes.
 *
 * Why: sessionStorage caps at ~5MB per origin (browser-dependent),
 * and API payloads are best kept small. Real phone screenshots are
 * often 3-8MB and don't need >1600px resolution for Claude Vision
 * to read the text — downscaling loses nothing perceptually.
 *
 * Runs entirely in the browser. Not usable server-side (needs
 * document + HTMLImageElement + HTMLCanvasElement).
 */

const DEFAULT_MAX_DIM = 1600;

export async function compressImageToDataUrl(
  file: File,
  maxBytes: number,
  maxDim: number = DEFAULT_MAX_DIM,
): Promise<string> {
  const img = await loadImage(file);
  const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
  const w = Math.round(img.width * scale);
  const h = Math.round(img.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D unsupported");
  ctx.drawImage(img, 0, 0, w, h);

  // Try decreasing JPEG quality until we fit under the byte cap.
  // Base64 char count is a close proxy for byte size (each 4 chars
  // ≈ 3 bytes of data — so allow the string length as the check).
  for (const q of [0.9, 0.8, 0.7, 0.6, 0.5, 0.4]) {
    const dataUrl = canvas.toDataURL("image/jpeg", q);
    if (dataUrl.length <= maxBytes) return dataUrl;
  }
  return canvas.toDataURL("image/jpeg", 0.4);
}

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Image load failed"));
    };
    img.src = url;
  });
}
