import { motion } from 'framer-motion';
import { HiOutlineMail, HiOutlinePhone } from 'react-icons/hi';
import { FaLinkedinIn, FaGithub } from 'react-icons/fa6';
import SectionHeading from './SectionHeading';
import { useLang } from '../lib/i18n';
import { contact } from '../lib/data';
import CvDownload from './CvDownload';

export default function Contact() {
  const { ui, t } = useLang();

  const tel = (n: string) => 'tel:' + n.replace(/[^+\d]/g, '');

  // every value here is editable in the admin panel's Contact tab
  const channels = [
    { Icon: HiOutlineMail, label: 'Email', value: contact.email, href: 'mailto:' + contact.email },
    {
      Icon: HiOutlineMail,
      label: t({ en: 'Email (alt)', fr: 'Email (2)' }),
      value: contact.emailAlt,
      href: 'mailto:' + contact.emailAlt,
    },
    {
      Icon: HiOutlinePhone,
      label: t({ en: 'Phone', fr: 'Téléphone' }),
      value: contact.phone,
      href: tel(contact.phone),
    },
    {
      Icon: HiOutlinePhone,
      label: t({ en: 'Phone (FR)', fr: 'Téléphone (FR)' }),
      value: contact.phoneAlt,
      href: tel(contact.phoneAlt),
    },
    { Icon: FaLinkedinIn, label: 'LinkedIn', value: contact.linkedinLabel, href: contact.linkedinUrl },
    { Icon: FaGithub, label: 'GitHub', value: contact.githubLabel, href: contact.githubUrl },
  ].filter((c) => c.value && c.href);

  return (
    <section id="contact" className="relative px-5 pb-16 pt-24 sm:px-8 sm:pt-32">
      <div className="mx-auto max-w-6xl">
        <SectionHeading index="05" eyebrow={ui('contact.eyebrow')} title={ui('contact.title')} />

        <div className="grid gap-10 lg:grid-cols-[1fr_1.1fr] lg:gap-16">
          <motion.div
            initial={{ opacity: 0, y: 22 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-70px' }}
            transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
          >
            <p className="text-lg leading-relaxed text-zinc-400">{ui('contact.blurb')}</p>
            <a
              href={'mailto:' + contact.email}
              className="group relative mt-8 inline-flex items-center gap-2.5 overflow-hidden rounded-xl bg-gradient-to-r from-accent-400 to-accent-600 px-6 py-3.5 text-sm font-semibold text-ink-950 transition-transform hover:scale-[1.03]"
            >
              <HiOutlineMail size={17} className="relative z-10" />
              <span className="relative z-10">{ui('contact.email')}</span>
              <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/40 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
            </a>

            <div className="mt-8">
              <CvDownload variant="panel" />
            </div>
          </motion.div>

          <div className="grid gap-px overflow-hidden rounded-2xl border border-line bg-line sm:grid-cols-2">
            {channels.map((c, i) => (
              <motion.a
                key={c.label}
                href={c.href}
                target={c.href.startsWith('http') ? '_blank' : undefined}
                rel="noreferrer"
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-60px' }}
                transition={{ duration: 0.5, delay: i * 0.07 }}
                className="group relative bg-ink-900/80 p-5 backdrop-blur-sm transition-colors hover:bg-ink-850"
              >
                <c.Icon className="mb-3 text-zinc-600 transition-colors group-hover:text-accent-500" size={18} />
                <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-zinc-600">{c.label}</div>
                <div className="mt-1 truncate text-sm text-zinc-300 transition-colors group-hover:text-accent-300">
                  {c.value}
                </div>
              </motion.a>
            ))}
          </div>
        </div>

        <footer className="mt-24 flex flex-col items-center gap-2 border-t border-line pt-8 text-center sm:flex-row sm:justify-between sm:text-left">
          <p className="font-mono text-[11px] text-zinc-600">
            © {new Date().getFullYear()} {contact.displayName}
          </p>
          <p className="font-mono text-[11px] text-zinc-700">{ui('footer.built')}</p>
        </footer>
      </div>
    </section>
  );
}
