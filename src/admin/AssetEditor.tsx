import { TbFileTypePdf, TbPresentation, TbLayoutBoardSplit, TbBrandGithub, TbLink } from 'react-icons/tb';
import { HiOutlineTrash } from 'react-icons/hi';
import { Button, LocField, FileDrop, Field, Select } from './ui';
import { ASSET_LABEL } from '../lib/data';
import type { AssetKind, ProjectAsset } from '../lib/types';

const rid = (p: string) => p + '-' + Math.random().toString(36).slice(2, 9);

export const KINDS: { value: AssetKind; label: string; Icon: typeof TbFileTypePdf }[] = [
  { value: 'report', label: 'Report (PDF)', Icon: TbFileTypePdf },
  { value: 'presentation', label: 'Presentation', Icon: TbPresentation },
  { value: 'poster', label: 'Poster', Icon: TbLayoutBoardSplit },
  { value: 'code', label: 'Code', Icon: TbBrandGithub },
  { value: 'link', label: 'Link', Icon: TbLink },
];

const KIND_ICON = Object.fromEntries(KINDS.map((k) => [k.value, k.Icon])) as Record<
  AssetKind,
  typeof TbFileTypePdf
>;

/**
 * Attach reports, decks, posters, code and links to anything.
 *
 * Shared by the Projects and Leadership tabs so both behave identically —
 * upload a file into public/docs/, or paste an external URL.
 */
export default function AssetEditor({
  assets,
  onChange,
  label = 'Documents',
  hint = 'report, slide deck, poster, code — uploaded or linked',
}: {
  assets: ProjectAsset[];
  onChange: (next: ProjectAsset[]) => void;
  label?: string;
  hint?: string;
}) {
  return (
    <Field label={label} hint={hint}>
      <div className="space-y-3">
        {assets.map((a, ai) => {
          const Icon = KIND_ICON[a.kind] ?? TbLink;
          const patch = (next: Partial<ProjectAsset>) => {
            const list = [...assets];
            list[ai] = { ...a, ...next };
            onChange(list);
          };

          return (
            <div key={a.id} className="rounded-lg border border-line bg-ink-950/60 p-3">
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <Icon className="shrink-0 text-accent-500" size={16} />
                <div className="w-44 shrink-0">
                  <Select
                    value={a.kind}
                    onChange={(v) => patch({ kind: v as AssetKind })}
                    options={KINDS.map((k) => ({ value: k.value, label: k.label }))}
                  />
                </div>
                <span className="ml-auto font-mono text-[10px] text-zinc-700">
                  default label: “{ASSET_LABEL[a.kind].en}”
                </span>
                <Button variant="danger" onClick={() => onChange(assets.filter((_, x) => x !== ai))}>
                  <HiOutlineTrash size={13} />
                </Button>
              </div>

              <FileDrop folder="docs" url={a.url} onChange={(url) => patch({ url })} />

              <div className="mt-3">
                <LocField
                  label="Custom label"
                  hint="optional"
                  value={a.label}
                  onChange={(v) => patch({ label: v })}
                  placeholder={ASSET_LABEL[a.kind].en}
                />
              </div>
            </div>
          );
        })}

        <div className="flex flex-wrap gap-2">
          {KINDS.map((k) => (
            <Button
              key={k.value}
              onClick={() =>
                onChange([...assets, { id: rid('asset'), kind: k.value, label: { en: '', fr: '' }, url: '' }])
              }
            >
              <span className="flex items-center gap-1.5">
                <k.Icon size={13} /> {k.label}
              </span>
            </Button>
          ))}
        </div>
      </div>
    </Field>
  );
}
