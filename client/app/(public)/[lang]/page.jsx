import Link from 'next/link';
import { notFound } from 'next/navigation';
import { isLang, pageMetadata, DEFAULT_LANG, BRAND, absUrl, SITE_URL, breadcrumbData } from '../../../lib/seo.js';
import { getDictionary } from '../../../i18n/dictionaries.js';
import { JsonLd } from '../../../components/JsonLd.jsx';

export function generateMetadata({ params }) {
  if (!isLang(params.lang)) return {};
  const d = getDictionary(params.lang).home;
  return pageMetadata({ lang: params.lang, path: '', title: `${d.title} | ${BRAND}`, description: d.description });
}

export default function HomePage({ params }) {
  if (!isLang(params.lang)) notFound();
  const lang = params.lang;
  const d = getDictionary(lang).home;
  const data = [
    {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: BRAND,
      url: absUrl(DEFAULT_LANG, ''),
      logo: `${SITE_URL}/icon.svg`,
    },
    {
      '@context': 'https://schema.org',
      '@type': 'WebApplication',
      name: BRAND,
      url: absUrl(lang, ''),
      applicationCategory: 'LifestyleApplication',
      operatingSystem: 'Web',
      inLanguage: lang === 'bn' ? 'bn' : 'en',
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'BDT' },
    },
    breadcrumbData(lang, [{ name: BRAND, path: '' }]),
  ];
  return (
    <>
      <JsonLd data={data} />
      <div className="landing-page">
        <section className="landing-hero">
          <div className="landing-hero-copy">
            <p className="landing-kicker">{d.proof}</p>
            <h1>{d.h1}</h1>
            <p className="landing-lead">{d.lead}</p>
            <div className="landing-actions">
              <Link href="/app" className="landing-button landing-button-primary">{d.ctaApp}</Link>
              <Link href={`/${lang}/lessons`} className="landing-button landing-button-secondary">{d.ctaLessons}</Link>
            </div>
            <p className="landing-privacy">{d.privacyNote}</p>
          </div>
          <div className="landing-preview" aria-hidden="true">
            <div className="landing-preview-top">
              <span>✦</span><span>{lang === 'bn' ? 'আজকের রুটিন' : "Today's routine"}</span>
              <span className="landing-preview-count">3</span>
            </div>
            <div className="landing-preview-item">
              <span className="landing-preview-check">✓</span>
              <span>{lang === 'bn' ? 'সকালের হাঁটা' : 'Morning walk'}</span>
              <small>07:00</small>
            </div>
            <div className="landing-preview-item">
              <span className="landing-preview-check">✓</span>
              <span>{lang === 'bn' ? 'মনোযোগ দিয়ে পড়া' : 'Focused study'}</span>
              <small>09:30</small>
            </div>
            <div className="landing-preview-item">
              <span className="landing-preview-check landing-preview-pending">•</span>
              <span>{lang === 'bn' ? 'একটু বিরতি' : 'Take a short break'}</span>
              <small>11:00</small>
            </div>
            <div className="landing-preview-footer">{lang === 'bn' ? 'ছোট পদক্ষেপ, ধারাবাহিক অগ্রগতি' : 'Small steps. Steady progress.'}</div>
          </div>
        </section>

        <section className="landing-features" aria-labelledby="landing-features-heading">
          <h2 id="landing-features-heading">{d.featuresTitle}</h2>
          <div className="landing-feature-grid">
            {d.features.map(([title, description], index) => (
              <article className="landing-feature-card" key={title}>
                <span className="landing-feature-number" aria-hidden="true">0{index + 1}</span>
                <h3>{title}</h3>
                <p>{description}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="landing-final-cta">
          <h2>{d.finalCta}</h2>
          <Link href="/app" className="landing-button landing-button-primary">{d.ctaApp}</Link>
        </section>
      </div>
    </>
  );
}
