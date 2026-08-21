import { useRef, useState, type ReactNode } from 'react';
import { HiOutlineUpload, HiOutlineTrash, HiOutlineDocumentText, HiOutlineExternalLink } from 'react-icons/hi';
import type { Loc } from '../lib/types';
import CropBox from './CropBox';
import { resolveCrop, type Crop } from '../lib/crop';
import { downscaleImage, formatBytes } from './imageTools';

/* Small building blocks shared by every admin panel. Deliberately plain —
   this UI never ships to production, so it optimises for speed of editing. */

/**
 * On/off switch.
 *
 * Two earlier versions of this drifted, and both are worth remembering:
 *
 *  1. `absolute` + `translate-x-[22px]` — Tailwind v4 emits the `translate`
 *     property, which stacked on top of the resolved static position and put
 *     the knob a full pill-width to the right, on top of the next label.
 *  2. flex + framer's `layout` prop — the admin re-clones its config on every
 *     keystroke, so the layout projection never settled and framer pinned the
 *     knob with a stale `translateX(20px)`.
 *
 * The knob is now laid out purely by margin, transitioned in CSS. There is no
 * transform involved anywhere, so nothing can accumulate.
 */
export function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!on)}
      role="switch"
      aria-checked={on}
      className={
        'flex h-6 w-11 shrink-0 items-center rounded-full p-0.5 transition-colors ' +
        (on ? 'bg-accent-500' : 'bg-zinc-700')
      }
    >
      {/* 44px pill − 2×2px padding − 20px knob = 20px of travel.
          Inline style rather than ml-* so it never depends on JIT class detection. */}
      <span
        style={{ marginLeft: on ? 20 : 0 }}
        className="block h-5 w-5 rounded-full bg-white shadow-sm transition-[margin-left] duration-200 ease-out"
      />
    </button>
  );
}

export function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <div className="block">
      <span className="mb-1.5 flex items-baseline gap-2">
        <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-zinc-500">{label}</span>
        {hint && <span className="text-[10px] text-zinc-600">{hint}</span>}
      </span>
      {children}
    </div>
  );
}

const inputCls =
  'w-full rounded-lg border border-line bg-ink-950 px-3 py-2 text-sm text-zinc-200 outline-none transition-colors placeholder:text-zinc-700 focus:border-accent-500/60';

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={inputCls} />;
}

export function TextArea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={inputCls + ' min-h-[90px] resize-y leading-relaxed'} />;
}

export function Select({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)} className={inputCls + ' cursor-pointer'}>
      {options.map((o) => (
        <option key={o.value} value={o.value} className="bg-ink-900">
          {o.label}
        </option>
      ))}
    </select>
  );
}

/**
 * Edits both halves of a bilingual field side by side.
 *
 * The language marker is its own column to the left of the text box rather than
 * an overlay — an absolutely-positioned badge sat on top of the value and long
 * strings ran underneath it.
 */
export function LocField({
  label,
  hint,
  value,
  onChange,
  multiline,
  placeholder,
}: {
  label: string;
  hint?: string;
  value: Loc;
  onChange: (v: Loc) => void;
  multiline?: boolean;
  placeholder?: string;
}) {
  const safe: Loc = value ?? { en: '', fr: '' };

  return (
    <div>
      <span className="mb-1.5 flex items-baseline gap-2">
        <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-zinc-500">{label}</span>
        {hint && <span className="text-[10px] text-zinc-600">{hint}</span>}
      </span>

      <div className="grid gap-2 sm:grid-cols-2">
        {(['en', 'fr'] as const).map((l) => (
          <div
            key={l}
            className="flex items-stretch overflow-hidden rounded-lg border border-line bg-ink-950 transition-colors focus-within:border-accent-500/60"
          >
            <span className="grid w-8 shrink-0 place-items-center border-r border-line bg-ink-900 font-mono text-[10px] uppercase text-zinc-500">
              {l}
            </span>
            {multiline ? (
              <textarea
                value={safe[l] ?? ''}
                onChange={(e) => onChange({ ...safe, [l]: e.target.value })}
                placeholder={placeholder ?? (l === 'en' ? 'English…' : 'Français…')}
                className="min-h-[90px] flex-1 resize-y bg-transparent px-3 py-2 text-sm leading-relaxed text-zinc-200 outline-none placeholder:text-zinc-700"
              />
            ) : (
              <input
                value={safe[l] ?? ''}
                onChange={(e) => onChange({ ...safe, [l]: e.target.value })}
                placeholder={placeholder ?? (l === 'en' ? 'English…' : 'Français…')}
                className="min-w-0 flex-1 bg-transparent px-3 py-2 text-sm text-zinc-200 outline-none placeholder:text-zinc-700"
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export function Button({
  children,
  variant = 'ghost',
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'ghost' | 'danger' }) {
  const styles = {
    primary: 'bg-accent-500 text-ink-950 hover:bg-accent-400 font-semibold',
    ghost: 'border border-line text-zinc-300 hover:border-zinc-600 hover:text-zinc-100',
    danger: 'border border-red-900/60 text-red-400 hover:bg-red-950/40',
  }[variant];
  return (
    <button {...rest} className={'rounded-lg px-3.5 py-2 text-xs transition-colors disabled:opacity-40 ' + styles}>
      {children}
    </button>
  );
}

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={'rounded-xl border border-line bg-ink-900 p-4 ' + className}>{children}</div>;
}

/* ------------------------------------------------------------------ */
/* Upload helper — posts a data URL to the dev-only /__admin/upload    */
/* endpoint, which writes the real file into public/<folder>/.         */
/* ------------------------------------------------------------------ */

async function uploadOne(file: File, folder: string): Promise<string | null> {
  // Images are downscaled in the browser first — a raw phone photo is ~10 MB,
  // which would dominate the page weight for no visible benefit.
  const isImage = /^image\//i.test(file.type);
  const prepared = isImage
    ? await downscaleImage(file)
    : {
        dataUrl: await new Promise<string>((res, rej) => {
          const r = new FileReader();
          r.onload = () => res(String(r.result));
          r.onerror = rej;
          r.readAsDataURL(file);
        }),
        filename: file.name,
        originalBytes: file.size,
        bytes: file.size,
      };

  if (isImage && prepared.bytes < prepared.originalBytes) {
    console.info(
      `[upload] ${file.name}: ${formatBytes(prepared.originalBytes)} -> ${formatBytes(prepared.bytes)}`,
    );
  }

  const resp = await fetch('/__admin/upload', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ filename: prepared.filename, folder, dataUrl: prepared.dataUrl }),
  });
  const json = await resp.json();
  if (json.url) return json.url;
  alert('Upload failed: ' + (json.error ?? 'unknown'));
  return null;
}

export function ImageDrop({
  images,
  onChange,
  folder = 'leadership',
  single,
  crop,
  onCrop,
  aspect,
  fit = 'cover',
}: {
  images: string[];
  onChange: (next: string[]) => void;
  folder?: string;
  single?: boolean;
  /** pass these to get a crop frame the moment a picture lands */
  crop?: Crop;
  onCrop?: (c: Crop) => void;
  aspect?: number;
  fit?: 'cover' | 'contain';
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  // the picture the crop frame acts on — the cover, i.e. the first one
  const cropTarget = images[0];

  async function upload(files: FileList | null) {
    if (!files?.length) return;
    setBusy(true);
    const uploaded: string[] = [];
    for (const file of Array.from(files)) {
      const url = await uploadOne(file, folder);
      if (url) uploaded.push(url);
    }
    setBusy(false);
    onChange(single ? uploaded.slice(-1) : [...images, ...uploaded]);
  }

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {images.map((src) => (
          <div key={src} className="group relative h-20 w-20 overflow-hidden rounded-lg border border-line">
            <img src={src} alt="" className="h-full w-full object-cover" />
            <button
              onClick={() => onChange(images.filter((i) => i !== src))}
              className="absolute inset-0 grid place-items-center bg-ink-950/80 opacity-0 transition-opacity group-hover:opacity-100"
              title="Remove from this entry"
            >
              <HiOutlineTrash className="text-red-400" size={16} />
            </button>
          </div>
        ))}

        <button
          onClick={() => inputRef.current?.click()}
          disabled={busy}
          className="grid h-20 w-20 place-items-center rounded-lg border border-dashed border-line text-zinc-600 transition-colors hover:border-accent-500/50 hover:text-accent-500 disabled:opacity-50"
        >
          {busy ? <span className="font-mono text-[10px]">…</span> : <HiOutlineUpload size={18} />}
        </button>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple={!single}
        hidden
        onChange={(e) => {
          upload(e.target.files);
          e.target.value = '';
        }}
      />
      <p className="mt-2 font-mono text-[10px] text-zinc-600">
        saved to public/{folder || ''}/ — commit these files so they appear on the live site
      </p>

      {/* the crop frame appears as soon as there is something to crop, rather
          than sitting in a separate field further down the form */}
      {onCrop && cropTarget && (
        <div className="mt-4 rounded-xl border border-line bg-ink-950/40 p-3">
          <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.15em] text-zinc-500">
            Adjust framing
          </p>
          <CropBox
            src={cropTarget}
            fit={fit}
            aspect={aspect}
            crop={crop ?? resolveCrop({})}
            onChange={onCrop}
          />
        </div>
      )}
    </div>
  );
}

/** Single-document picker: upload a PDF/deck, or paste an external URL. */
export function FileDrop({
  url,
  onChange,
  folder = 'docs',
  accept = '.pdf,.pptx,.ppt,.docx,.doc,.xlsx,.zip',
}: {
  url: string;
  onChange: (url: string) => void;
  folder?: string;
  accept?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  const filename = url ? url.split('/').pop() : '';
  const external = /^https?:/i.test(url);

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <Input
          value={url}
          placeholder="Upload a file, or paste a https:// link"
          onChange={(e) => onChange(e.target.value)}
        />
        <Button
          onClick={() => inputRef.current?.click()}
          disabled={busy}
          title={'Upload to public/' + folder + '/'}
        >
          <span className="flex items-center gap-1.5 whitespace-nowrap">
            <HiOutlineUpload size={13} />
            {busy ? '…' : 'Upload'}
          </span>
        </Button>
        {url && (
          <Button variant="danger" onClick={() => onChange('')} title="Clear">
            <HiOutlineTrash size={13} />
          </Button>
        )}
      </div>

      {url && (
        <div className="flex items-center gap-2 rounded-lg border border-line bg-ink-950 px-3 py-2">
          <HiOutlineDocumentText className="shrink-0 text-accent-500" size={15} />
          <span className="min-w-0 flex-1 truncate font-mono text-[11px] text-zinc-400">{filename}</span>
          <a
            href={url}
            target="_blank"
            rel="noreferrer"
            className="shrink-0 text-zinc-600 transition-colors hover:text-accent-400"
            title="Open"
          >
            <HiOutlineExternalLink size={13} />
          </a>
          <span className="shrink-0 font-mono text-[9px] uppercase text-zinc-700">
            {external ? 'link' : 'file'}
          </span>
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        hidden
        onChange={async (e) => {
          const f = e.target.files?.[0];
          e.target.value = '';
          if (!f) return;
          setBusy(true);
          const next = await uploadOne(f, folder);
          setBusy(false);
          if (next) onChange(next);
        }}
      />
    </div>
  );
}

/** Comma-separated list editor, used for tags and tech stacks. */
export function TagsInput({
  value,
  onChange,
  placeholder,
}: {
  value: string[];
  onChange: (v: string[]) => void;
  placeholder?: string;
}) {
  return (
    <Input
      value={value.join(', ')}
      placeholder={placeholder ?? 'tag one, tag two'}
      onChange={(e) => onChange(e.target.value.split(',').map((s) => s.trim()).filter(Boolean))}
    />
  );
}
