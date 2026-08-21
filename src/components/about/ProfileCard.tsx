import { motion } from 'framer-motion';
import { HiOutlineLocationMarker } from 'react-icons/hi';
import { useLang } from '../../lib/i18n';
import { config, contact, softSkills } from '../../lib/data';
import { dur, on } from '../../lib/anim';
import CvDownload from '../CvDownload';
import { asset } from '../../lib/asset';

/* Small decorative dots that orbit the portrait. */
const ORBIT = [
  { size: 8, radius: 148, duration: 18, delay: 0, color: 'bg-accent-400' },
  { size: 5, radius: 168, duration: 24, delay: -6, color: 'bg-sky-400' },
  { size: 6, radius: 130, duration: 14, delay: -3, color: 'bg-emerald-400' },
];

export default function ProfileCard() {
  const { t, lang } = useLang();
  const paragraphs = t(config.profile.intro).split('\n\n').filter(Boolean);

  return (
    <div className="grid items-center gap-12 lg:grid-cols-[320px_1fr] lg:gap-16">
      {/* ---------------- portrait ---------------- */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true, margin: '-80px' }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        className="relative mx-auto h-[300px] w-[300px] shrink-0"
      >
        {/* slowly rotating conic ring */}
        <motion.div
          className="absolute inset-0 rounded-[2rem]"
          style={{
            background:
              'conic-gradient(from 0deg, transparent 0deg, var(--color-accent-500) 70deg, var(--color-accent-300) 110deg, transparent 180deg, transparent 360deg)',
          }}
          animate={on('orbitDots') ? { rotate: 360 } : undefined}
          transition={{ duration: dur(9), repeat: Infinity, ease: 'linear' }}
        />
        {/* inset mask turns the rotating gradient into a thin animated border */}
        <div className="absolute inset-[2px] rounded-[calc(2rem-2px)] bg-ink-950" />

        {/* soft glow behind the whole thing */}
        <div className="absolute inset-6 rounded-[2rem] bg-accent-600/25 blur-3xl" />

        <div className="absolute inset-[10px] overflow-hidden rounded-[1.6rem] border border-white/[0.06]">
          <img
            src={asset(config.profile.photo)}
            alt={contact.displayName}
            className="h-full w-full object-cover grayscale transition-all duration-700 hover:grayscale-0"
            onError={(e) => {
              // graceful placeholder until a real photo is dropped into public/
              const el = e.currentTarget;
              el.style.display = 'none';
              el.parentElement?.classList.add(
                'grid',
                'place-items-center',
                'bg-gradient-to-br',
                'from-ink-800',
                'to-ink-950',
              );
              const span = document.createElement('span');
              span.className = 'font-display text-6xl font-bold text-accent-500/40';
              span.textContent = 'MA';
              el.parentElement?.appendChild(span);
            }}
          />
          {/* warm gradient wash so the portrait sits in the palette */}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink-950/70 via-transparent to-transparent" />
        </div>

        {/* orbiting accent dots */}
        {on('orbitDots') &&
          ORBIT.map((o, i) => (
          <motion.div
            key={i}
            className="absolute left-1/2 top-1/2 h-0 w-0"
            animate={{ rotate: 360 }}
            transition={{ duration: dur(o.duration), repeat: Infinity, ease: 'linear', delay: dur(o.delay) }}
          >
            <span
              className={`absolute block rounded-full ${o.color} shadow-[0_0_12px_currentColor]`}
              style={{ width: o.size, height: o.size, transform: `translate(${o.radius}px, -50%)` }}
            />
          </motion.div>
          ))}

        {/* corner brackets */}
        {[
          'left-0 top-0 border-l-2 border-t-2 rounded-tl-2xl',
          'right-0 top-0 border-r-2 border-t-2 rounded-tr-2xl',
          'left-0 bottom-0 border-l-2 border-b-2 rounded-bl-2xl',
          'right-0 bottom-0 border-r-2 border-b-2 rounded-br-2xl',
        ].map((cls) => (
          <span key={cls} className={`pointer-events-none absolute h-7 w-7 border-accent-500/50 ${cls}`} />
        ))}
      </motion.div>

      {/* ---------------- introduction ---------------- */}
      <div>
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.7, delay: 0.15 }}
          className="mb-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-zinc-500"
        >
          <span className="flex items-center gap-1.5">
            <HiOutlineLocationMarker className="text-accent-500" size={15} />
            {t(contact.location)}
          </span>
          <span className="h-1 w-1 rounded-full bg-zinc-700" />
          <a href={'mailto:' + contact.email} className="font-mono text-xs transition-colors hover:text-accent-400">
            {contact.email}
          </a>
        </motion.div>

        {paragraphs.map((p, i) => (
          <motion.p
            key={i}
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.65, delay: 0.2 + i * 0.12, ease: [0.22, 1, 0.36, 1] }}
            className={`mb-4 leading-relaxed ${i === 0 ? 'text-lg text-zinc-300' : 'text-[15px] text-zinc-400'}`}
          >
            {p}
          </motion.p>
        ))}

        {/* soft skills as quiet chips */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="mt-7 flex flex-wrap gap-2"
        >
          {softSkills(lang).map((s) => (
            <span
              key={s}
              className="rounded-full border border-line bg-white/[0.02] px-3 py-1.5 text-xs text-zinc-400 transition-colors hover:border-accent-500/30 hover:text-accent-300"
            >
              {s}
            </span>
          ))}
        </motion.div>

        <CvDownload />

      </div>
    </div>
  );
}
