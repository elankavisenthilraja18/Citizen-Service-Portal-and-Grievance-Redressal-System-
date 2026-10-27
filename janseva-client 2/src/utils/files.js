/**
 * Reads a File (from an <input type="file">) into a base64 data URL so it can
 * be sent to the backend as a plain string (ApplicationDocument.fileUrl /
 * Grievance.photoUrl are just TEXT columns - no separate file-storage service
 * exists yet). Caps at 5MB to match the UI's stated limit.
 */
export function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    if (!file) { reject(new Error('No file selected')); return; }
    if (file.size > 5 * 1024 * 1024) { reject(new Error('File is larger than 5MB')); return; }
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('Could not read file'));
    reader.readAsDataURL(file);
  });
}

/** Try to read the device's current GPS position; resolves to null if unavailable/denied. */
export function getCurrentPosition() {
  return new Promise((resolve) => {
    if (!navigator.geolocation) { resolve(null); return; }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => resolve(null),
      { timeout: 5000 }
    );
  });
}
