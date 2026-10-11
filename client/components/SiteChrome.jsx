import Link from 'next/link';
import { MobileMenu } from './MobileMenu.jsx';

export function Header({ lang, dict }) {
  return (
    <header className="public-site-header">
      <nav aria-label={dict.nav.label} className="mx-auto flex max-w-5xl flex-wrap items-center gap-x-4 px-4 py-3">
        <Link href={`/${lang}`} className="min-h-[44px] py-2 text-lg font-bold text-gold">{dict.brand}</Link>
        <MobileMenu label={dict.nav.menu} closeLabel={dict.nav.close}>
          <Link href={`/${lang}/lessons`} className="min-h-[44px] py-2">{dict.nav.lessons}</Link>
          <Link href={`/${lang}/about`} className="min-h-[44px] py-2">{dict.nav.about}</Link>
          <Link href={`/${lang}/help`} className="min-h-[44px] py-2">{dict.nav.help}</Link>
          <Link href="/app" className="min-h-[44px] rounded-lg bg-gold px-4 py-2 font-semibold text-on-gold md:ml-auto">{dict.nav.app}</Link>
        </MobileMenu>
      </nav>
    </header>
  );
}

export function Footer({ lang, dict }) {
  return (
    <footer className="public-site-footer">
      <div className="public-site-footer-inner">
        <span className="public-site-footer-brand">{dict.footer.note}</span>
        <nav aria-label={dict.footer.label} className="public-site-footer-links">
          <Link href={`/${lang}/privacy`}>{dict.footer.privacy}</Link>
          <Link href={`/${lang}/terms`}>{dict.footer.terms}</Link>
          <Link href={`/${lang}/help`}>{dict.footer.help}</Link>
        </nav>
      </div>
    </footer>
  );
}
