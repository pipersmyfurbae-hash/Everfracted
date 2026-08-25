import { ArrowLeft, ArrowRight, Check, Leaf, Mail, Sparkles } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { FIRST_COLLECTION, collectionAvailabilityLabel, getFirstCollectionProduct } from '../services/firstCollection';

function NotFound() {
  return <main className="flex min-h-screen items-center justify-center bg-[#F9F7F4] px-6 text-[#1A1A1A]"><div className="max-w-xl border border-[#1A1A1A]/10 bg-white p-10 text-center"><Leaf className="mx-auto text-[#4A6741]" size={36} strokeWidth={1.1} /><h1 className="mt-6 font-serif text-5xl font-light">This edit has moved on.</h1><p className="mt-5 text-sm leading-7 text-[#5A5A5A]">The piece you are looking for is not part of the current collection.</p><Link to="/moodoor/catalogue" className="mt-8 inline-flex items-center gap-2 bg-[#1A1A1A] px-5 py-3 text-[10px] font-semibold uppercase tracking-[0.15em] text-white">Browse the collection <ArrowRight size={14} /></Link></div></main>;
}

export default function ListingDetail() {
  const { slug } = useParams<{ slug: string }>();
  const product = getFirstCollectionProduct(slug);
  if (!product) return <NotFound />;

  const otherPieces = FIRST_COLLECTION.products.filter((item) => item.slug !== product.slug);
  const enquiryHref = `mailto:?subject=${encodeURIComponent(`Moodoor release enquiry — ${product.title}`)}&body=${encodeURIComponent(`Hello Evercrafted,\n\nI would like to request availability for ${product.title} from the First Threshold Edit.\n\nPreferred date or question:\n\nThank you.`)}`;

  return (
    <main className="min-h-screen bg-[#F9F7F4] text-[#1A1A1A]">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-7 sm:px-10 lg:px-16"><Link to="/moodoor/catalogue" className="inline-flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.15em] text-[#4A6741] transition hover:text-[#1A1A1A]"><ArrowLeft size={14} /> The first threshold edit</Link><Link to="/moodoor" className="font-serif text-3xl leading-none tracking-tight">Mood<span className="italic text-[#4A6741]">oor</span></Link></nav>

      <section className="mx-auto grid max-w-7xl border-y border-[#1A1A1A]/10 lg:grid-cols-[1.08fr_0.92fr]">
        <div className="min-h-[38rem] overflow-hidden bg-[#203025]"><img src={product.imageUrl} alt={`${product.title} wreath displayed on a front door`} className="h-full w-full object-cover" /></div>
        <article className="flex flex-col justify-between bg-white p-8 sm:p-12 lg:p-14">
          <div>
            <div className="flex flex-wrap items-center justify-between gap-4"><p className="font-mono text-[9px] uppercase tracking-[0.16em] text-[#4A6741]">{product.eyebrow} / {product.formula}</p><span className="border border-[#C4922A]/45 px-3 py-1 font-mono text-[9px] uppercase tracking-[0.12em] text-[#8A681D]">{collectionAvailabilityLabel(product.availability)}</span></div>
            <h1 className="mt-12 font-serif text-[clamp(4rem,6.4vw,6.4rem)] font-light leading-[0.78] tracking-[-0.05em]">{product.title}</h1>
            <p className="mt-8 max-w-xl text-lg leading-8 text-[#4A4A4A]">{product.summary}</p>
            <div className="mt-8 flex flex-wrap gap-2">{product.mood.map((tag) => <span key={tag} className="bg-[#EEF2ED] px-3 py-2 font-mono text-[8px] uppercase tracking-[0.13em] text-[#4A6741]">{tag}</span>)}{product.palette.map((tag) => <span key={tag} className="bg-[#F2EFE9] px-3 py-2 font-mono text-[8px] uppercase tracking-[0.13em] text-[#5A5A5A]">{tag}</span>)}</div>
          </div>
          <div className="mt-12 border-t border-[#1A1A1A]/10 pt-7"><div className="flex flex-wrap items-end justify-between gap-7"><div><p className="font-mono text-[9px] uppercase tracking-[0.14em] text-[#787878]">Studio release</p><p className="mt-2 font-serif text-4xl font-light">${product.price}</p></div><a href={enquiryHref} className="inline-flex items-center gap-2 bg-[#1A1A1A] px-5 py-4 text-[10px] font-semibold uppercase tracking-[0.14em] text-white transition hover:bg-[#4A6741]"><Mail size={14} /> Request availability</a></div><p className="mt-5 text-xs leading-6 text-[#787878]">{product.fulfilment} Managed checkout is made available only after a piece is confirmed ready to ship.</p></div>
        </article>
      </section>

      <section className="mx-auto grid max-w-7xl gap-12 px-6 py-16 sm:px-10 lg:grid-cols-[0.82fr_1.18fr] lg:px-16 lg:py-24">
        <aside><p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#4A6741]">The composition</p><h2 className="mt-5 font-serif text-5xl font-light leading-[0.9] tracking-[-0.035em]">A study in<br /><em>threshold rhythm.</em></h2></aside>
        <div><p className="max-w-2xl font-serif text-3xl font-light leading-[1.22] text-[#2E3B31] sm:text-4xl">{product.story}</p><div className="mt-10 grid gap-px bg-[#1A1A1A]/10 sm:grid-cols-2"><div className="bg-[#F9F7F4] p-6"><p className="font-mono text-[9px] uppercase tracking-[0.14em] text-[#787878]">Silhouette</p><p className="mt-3 text-sm leading-7 text-[#4A4A4A]">{product.silhouette}</p></div><div className="bg-[#F9F7F4] p-6"><p className="font-mono text-[9px] uppercase tracking-[0.14em] text-[#787878]">Scale</p><p className="mt-3 text-sm leading-7 text-[#4A4A4A]">{product.scale}</p></div></div></div>
      </section>

      <section className="border-y border-[#1A1A1A]/10 bg-[#EEF2ED] px-6 py-16 sm:px-10 lg:px-16 lg:py-20"><div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-3"><div><Sparkles className="text-[#4A6741]" size={21} strokeWidth={1.3} /><p className="mt-5 font-mono text-[10px] uppercase tracking-[0.16em] text-[#4A6741]">Materials and setting</p><h2 className="mt-5 font-serif text-4xl font-light leading-[0.9]">The details<br />that make it belong.</h2></div><div><p className="font-mono text-[9px] uppercase tracking-[0.14em] text-[#787878]">Selected materials</p><ul className="mt-5 space-y-3">{product.materials.map((material) => <li key={material} className="flex items-center gap-3 text-sm text-[#38443B]"><Check size={15} className="text-[#4A6741]" />{material}</li>)}</ul></div><div className="space-y-7"><div><p className="font-mono text-[9px] uppercase tracking-[0.14em] text-[#787878]">Best setting</p><p className="mt-3 text-sm leading-7 text-[#38443B]">{product.setting}</p></div><div><p className="font-mono text-[9px] uppercase tracking-[0.14em] text-[#787878]">Care and storage</p><p className="mt-3 text-sm leading-7 text-[#38443B]">{product.care}</p></div></div></div></section>

      <section className="mx-auto max-w-7xl px-6 py-16 sm:px-10 lg:px-16 lg:py-24"><div className="flex flex-col gap-6 border-b border-[#1A1A1A]/10 pb-8 sm:flex-row sm:items-end sm:justify-between"><div><p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#4A6741]">Continue the edit</p><h2 className="mt-4 font-serif text-5xl font-light leading-[0.9]">Other ways to meet the door.</h2></div><Link to="/moodoor/catalogue" className="inline-flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#4A6741]">View all three <ArrowRight size={14} /></Link></div><div className="mt-10 grid gap-7 md:grid-cols-2">{otherPieces.map((piece) => <Link key={piece.slug} to={`/moodoor/listing/${piece.slug}`} className="group bg-white"><div className="h-80 overflow-hidden"><img src={piece.imageUrl} alt="" className="h-full w-full object-cover transition duration-700 group-hover:scale-[1.025]" loading="lazy" /></div><div className="border border-[#1A1A1A]/10 border-t-0 p-6"><p className="font-mono text-[9px] uppercase tracking-[0.14em] text-[#4A6741]">{piece.eyebrow}</p><h3 className="mt-3 font-serif text-4xl font-light leading-none">{piece.title}</h3><span className="mt-5 inline-flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#4A6741]">View piece <ArrowRight size={14} /></span></div></Link>)}</div></section>
    </main>
  );
}
