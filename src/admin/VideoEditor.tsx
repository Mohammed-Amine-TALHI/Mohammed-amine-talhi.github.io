import { useEffect, useRef, useState } from 'react';
import { HiOutlineUpload, HiOutlineTrash, HiOutlineScissors, HiOutlineVolumeOff } from 'react-icons/hi';
import { Button, Field, LocField, Toggle } from './ui';
import type { ProjectVideo } from '../lib/types';

const rid = () => 'vid-' + Math.random().toString(36).slice(2, 9);
const fmt = (s: number) => {
  const m = Math.floor(s / 60);
  return `${m}:${String(Math.floor(s % 60)).padStart(2, '0')}.${Math.floor((s % 1) * 10)}`;
};
const mb = (n: number) => (n / 1024 / 1024).toFixed(1) + ' MB';

/**
 * Demo videos for a project.
 *
 * Upload: the raw file is streamed to the dev server, which re-encodes it to
 * a web-friendly 720p MP4 and grabs a poster frame — a 90 MB phone clip lands
 * as a few MB. Each video then has a label, a "start muted" default, and a
 * trim tool: scrub the preview, mark the start and the end, optionally strip
 * the sound, and apply. Like the blur and the PDF trim, applying writes a new
 * file and the previous one is removed on save.
 */
export default function VideoEditor({
  videos,
  onChange,
}: {
  videos: ProjectVideo[];
  onChange: (next: ProjectVideo[]) => void;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const upload = async (file: File) => {
    setBusy(`Uploading ${file.name} (${mb(file.size)}) and converting — this can take a minute…`);
    try {
      const resp = await fetch('/__admin/upload-video?filename=' + encodeURIComponent(file.name), {
        method: 'POST',
        headers: { 'Content-Type': 'application/octet-stream' },
        body: file,
      });
      const json = await resp.json();
      if (!json.url) {
        alert('Video upload failed: ' + (json.error ?? 'unknown'));
        return;
      }
      onChange([...videos, { id: rid(), url: json.url, poster: json.poster, label: { en: '', fr: '' }, muted: false }]);
    } finally {
      setBusy(null);
    }
  };

  return (
    <Field label="Demo videos" hint="open in a pop-up player on the site — uploaded clips are converted to a light 720p MP4">
      <div className="space-y-3">
        {videos.map((v, i) => (
          <VideoRow
            key={v.id}
            video={v}
            onPatch={(p) => onChange(videos.map((x, k) => (k === i ? { ...x, ...p } : x)))}
            onRemove={() => onChange(videos.filter((_, k) => k !== i))}
          />
        ))}

        <div className="flex items-center gap-3">
          <Button onClick={() => input.current?.click()} disabled={Boolean(busy)}>
            <span className="flex items-center gap-1.5">
              <HiOutlineUpload size={13} /> Add a video
            </span>
          </Button>
          {busy && <span className="font-mono text-[10px] text-accent-400">{busy}</span>}
        </div>
        <input
          ref={input}
          type="file"
          accept="video/*,.mov,.mp4,.m4v,.webm"
          hidden
          onChange={(e) => {
            const f = e.target.files?.[0];
            e.target.value = '';
            if (f) upload(f);
          }}
        />
      </div>
    </Field>
  );
}

function VideoRow({
  video: v,
  onPatch,
  onRemove,
}: {
  video: ProjectVideo;
  onPatch: (p: Partial<ProjectVideo>) => void;
  onRemove: () => void;
}) {
  const ref = useRef<HTMLVideoElement>(null);
  const [info, setInfo] = useState<{ duration: number; bytes: number } | null>(null);
  const [trimming, setTrimming] = useState(false);
  const [start, setStart] = useState(0);
  const [end, setEnd] = useState(0);
  const [strip, setStrip] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch('/__admin/video-info?url=' + encodeURIComponent(v.url))
      .then((r) => r.json())
      .then((j) => {
        if (cancelled || !j.duration) return;
        setInfo({ duration: j.duration, bytes: j.bytes });
        setStart(0);
        setEnd(j.duration);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [v.url]);

  const duration = info?.duration ?? 0;
  const changed = start > 0.05 || (duration > 0 && end < duration - 0.05) || strip;

  const apply = async () => {
    setBusy(true);
    try {
      const resp = await fetch('/__admin/video-edit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: v.url, start, end: end < duration - 0.05 ? end : 0, mute: strip }),
      });
      const json = await resp.json();
      if (!json.url) {
        alert('Trim failed: ' + (json.error ?? 'unknown'));
        return;
      }
      onPatch({ url: json.url, poster: json.poster });
      setTrimming(false);
      setStrip(false);
    } finally {
      setBusy(false);
    }
  };

  const range = 'h-1.5 flex-1 cursor-pointer appearance-none rounded-full bg-ink-800 accent-accent-500';

  return (
    <div className="space-y-3 rounded-xl border border-line bg-ink-950/50 p-3">
      <div className="flex flex-wrap items-start gap-3">
        <video
          ref={ref}
          src={v.url}
          poster={v.poster}
          controls
          preload="metadata"
          muted={v.muted}
          className="h-36 w-64 shrink-0 rounded-lg border border-line bg-[#000]"
        />
        <div className="min-w-[14rem] flex-1 space-y-3">
          <LocField label="Title" value={v.label} onChange={(l) => onPatch({ label: l })} placeholder="Demonstration" />
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2.5">
              <Toggle on={v.muted === true} onChange={(m) => onPatch({ muted: m })} />
              <span className="text-xs text-zinc-300">Start muted</span>
            </div>
            <span className="font-mono text-[10px] text-zinc-600">
              {info ? `${fmt(info.duration)} · ${mb(info.bytes)}` : '…'}
            </span>
            <span className="ml-auto flex gap-2">
              <Button onClick={() => setTrimming((t) => !t)}>
                <span className="flex items-center gap-1.5">
                  <HiOutlineScissors size={13} /> Trim
                </span>
              </Button>
              <Button variant="danger" onClick={onRemove}>
                <HiOutlineTrash size={13} />
              </Button>
            </span>
          </div>
        </div>
      </div>

      {trimming && duration > 0 && (
        <div className="space-y-3 rounded-lg border border-accent-500/30 bg-ink-950/60 p-3">
          <p className="text-[11px] text-zinc-500">
            Scrub the preview above, then mark where the clip should start and end.
          </p>
          {(
            [
              ['Start', start, (n: number) => setStart(Math.min(n, end - 0.2))],
              ['End', end, (n: number) => setEnd(Math.max(n, start + 0.2))],
            ] as const
          ).map(([label, value, set]) => (
            <div key={label} className="flex items-center gap-3">
              <span className="w-10 shrink-0 font-mono text-[10px] uppercase tracking-wider text-zinc-500">{label}</span>
              <input
                type="range"
                min={0}
                max={duration}
                step={0.1}
                value={value}
                onChange={(e) => {
                  const n = Number(e.target.value);
                  set(n);
                  if (ref.current) ref.current.currentTime = n;
                }}
                className={range}
              />
              <span className="w-14 shrink-0 text-right font-mono text-xs text-accent-400">{fmt(value)}</span>
              <button
                onClick={() => ref.current && set(ref.current.currentTime)}
                className="shrink-0 font-mono text-[10px] text-zinc-500 underline decoration-dotted hover:text-accent-400"
              >
                use current
              </button>
            </div>
          ))}

          <div className="flex flex-wrap items-center gap-3">
            <label className="flex cursor-pointer items-center gap-2 text-xs text-zinc-300">
              <input type="checkbox" checked={strip} onChange={(e) => setStrip(e.target.checked)} className="accent-accent-500" />
              <HiOutlineVolumeOff size={14} /> Remove the sound track
            </label>
            <span className="font-mono text-[10px] text-zinc-600">
              keeps {fmt(Math.max(0, end - start))} of {fmt(duration)}
            </span>
            <span className="ml-auto flex gap-2">
              <Button onClick={() => setTrimming(false)}>Cancel</Button>
              <Button variant="primary" onClick={apply} disabled={!changed || busy}>
                {busy ? 'Encoding…' : 'Apply'}
              </Button>
            </span>
          </div>
          <p className="text-[10.5px] leading-relaxed text-zinc-600">
            Writes a new video file; the current one is removed from <code>public/</code> on your next save.
          </p>
        </div>
      )}
    </div>
  );
}
