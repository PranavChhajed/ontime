/**
 * Turn whatever the camera or gallery gives us into a small square JPEG.
 * A phone photo is 3-8 MB; the app only ever shows it small, so 512 px is plenty
 * (about 40 KB) and keeps uploads quick on a factory Wi-Fi.
 */
export const PHOTO_SIZE = 512;

export async function resizeToSquareJpeg(file: Blob, size = PHOTO_SIZE): Promise<Blob> {
  // "from-image" applies the phone's rotation, so an upright face stays upright.
  const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  try {
    const side = Math.min(bitmap.width, bitmap.height);
    const sx = (bitmap.width - side) / 2;
    // Faces sit in the upper part of a portrait photo, so crop a little above the centre.
    const sy = bitmap.height > bitmap.width ? Math.max(0, (bitmap.height - side) / 2 - side * 0.08) : (bitmap.height - side) / 2;
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = size;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("This browser can’t prepare the photo. Try another browser.");
    ctx.drawImage(bitmap, sx, sy, side, side, 0, 0, size, size);
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.82));
    if (!blob) throw new Error("Couldn’t prepare the photo. Please try another one.");
    return blob;
  } finally {
    bitmap.close();
  }
}
