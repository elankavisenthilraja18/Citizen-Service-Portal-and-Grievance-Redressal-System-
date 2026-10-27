import { useRef, useState } from 'react';
import { fileToDataUrl } from '../utils/files';

/**
 * A single mandatory-document / photo upload control.
 * - label: what's being uploaded (e.g. "Aadhaar Card")
 * - value: current data URL (or null)
 * - onChange(dataUrl): called once the file is read
 * - error: pass a message to show a red "required" state
 */
export default function ImageUploadField({ label, value, onChange, error, hint }) {
  const inputRef = useRef(null);
  const [busy, setBusy] = useState(false);
  const [localError, setLocalError] = useState('');

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    setLocalError('');
    try {
      const dataUrl = await fileToDataUrl(file);
      onChange(dataUrl);
    } catch (err) {
      setLocalError(err.message);
      onChange(null);
    } finally {
      setBusy(false);
    }
  };

  const showError = error || localError;

  return (
    <div className="field">
      <label>{label} <span style={{ color: 'var(--danger)' }}>*</span></label>
      <div
        className="upload-box"
        style={{
          cursor: 'pointer',
          borderColor: showError ? 'var(--danger)' : value ? 'var(--green)' : undefined,
          background: value ? 'var(--ok-tint)' : undefined,
          padding: value ? 10 : undefined,
        }}
        onClick={() => inputRef.current?.click()}
      >
        {value ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <img src={value} alt={label} style={{ width: 46, height: 46, objectFit: 'cover', borderRadius: 6, border: '1px solid var(--line)' }} />
            <div style={{ textAlign: 'left', fontSize: 12 }}>
              <div style={{ fontWeight: 700, color: 'var(--green-deep)' }}>✓ Uploaded</div>
              <div style={{ color: 'var(--slate)' }}>Click to replace</div>
            </div>
          </div>
        ) : busy ? (
          'Reading file…'
        ) : (
          <>📤 {hint || 'Click to upload — JPG/PNG up to 5MB'}</>
        )}
      </div>
      <input ref={inputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFile} />
      {showError && <div className="help" style={{ color: 'var(--danger)', fontWeight: 600 }}>{showError}</div>}
    </div>
  );
}
