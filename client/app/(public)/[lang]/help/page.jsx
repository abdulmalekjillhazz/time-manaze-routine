import { notFound } from 'next/navigation';
import { isLang, pageMetadata, titleWith } from '../../../../lib/seo.js';
import { getDictionary } from '../../../../i18n/dictionaries.js';
import { BreadcrumbJsonLd } from '../../../../components/JsonLd.jsx';

export function generateMetadata({ params }) {
  if (!isLang(params.lang)) return {};
  const d = getDictionary(params.lang).help;
  return pageMetadata({ lang: params.lang, path: '/help', title: titleWith(d.title), description: d.description });
}

export default function Page({ params }) {
  if (!isLang(params.lang)) notFound();
  const d = getDictionary(params.lang).help;
  return (
    <>
      <BreadcrumbJsonLd lang={params.lang} items={[
        { name: getDictionary(params.lang).brand, path: '' },
        { name: d.h1, path: '/help' },
      ]} />
      <h1 className="text-3xl font-bold text-sapphire">{d.h1}</h1>
      {d.body.map((p, i) => <p key={i} className="mt-4">{p}</p>)}
      {process.env.NEXT_PUBLIC_SUPPORT_EMAIL ? (
        <p className="mt-6">
          <a className="text-sapphire underline" href={`mailto:${process.env.NEXT_PUBLIC_SUPPORT_EMAIL}`}>{process.env.NEXT_PUBLIC_SUPPORT_EMAIL}</a>
        </p>
      ) : null}
    </>
  );
}
