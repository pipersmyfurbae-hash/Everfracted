import { ArrowRight, ChevronDown, Leaf, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { FIRST_COLLECTION, collectionAvailabilityLabel, type CollectionProduct } from '../services/firstCollection';

function ProductImage({ product, priority = false }: { product: CollectionProduct; priority?: boolean }) {
  return (
    <div className="relative h-full min-h-[26rem] overflow-hidden bg-[#243327]">
      <img
        src={product.imageUrl}
        alt={`${product.title} wreath displayed on a front door`}
        className="h-full w-full object-cover transition duration-700 group-hover:scale-[1.025]"
        loading={priority ? 'eager' : 'lazy'}
      />
      <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/45 to-transparent" />
      <span className="absolute bottom-5 left-5 border border-white/45 bg-black/20 px-3 py-2 font-mono text-[9px] uppercase tracking-[0.16em] text-white backdrop-blur-sm">24-inch studio wreath</span>
    </div>
  );
}

function CollectionCard({ product, feature = false }: { product: CollectionProduct; feature?: boolean }) {
  return (
    <article className={`group overflow-hidden bg-white ${feature ? 'lg:col-span-2 lg:grid lg:grid-cols-[1.08fr_0.92fr]' : ''}`}>
      <Link to={`/moodoor/listing/${product.slug}`} className="contents">
        <ProductImage product={product} priority={feature} />
        <div className={`flex flex-col justify-between border border-[#1A1A1A]/10 ${feature ? 'border-t-0 p-7 lg:border-l-0 lg:border-t lg:p-12' : 'border-t-0 p-7'}`}>
          <div>
            <div className="flex items-center justify-between gap-4">
              <span className="font-mono text-[9px] uppercase tracking-[0.15em] text-[#4A6741]">{product.formula}</span>
              <span className="font-mono text-[9px] uppercase tracking-[0.13em] text-[#A37418]">{collectionAvailabilityLabel(product.availability)}</span>
            </div>
            <p className="mt-8 font-mono text-[9px] uppercase tracking-[0.15em] text-[#787878]">{product.eyebrow}</p>
            <h2 className={`${feature ? 'mt-4 text-5xl sm:text-6xl' : 'mt-4 text-4xl'} font-serif font-light leading-[0.86] tracking-[-0.035em]`}>{product.title}</h2>
            <p className="mt-5 max-w-xl text-sm leading-7 text-[#5A5A5A]">{product.summary}</p>
            <div className="mt-6 flex flex-wrap gap-2">{product.mood.slice(0, 2).map((tag) => <span key={tag} className="bg-[#EEF2ED] px-2.5 py-1.5 font-mono text-[8px] uppercase tracking-[0.13em] text-[#4A6741]">{tag}</span>)}</div>
          </div>
          <div className="mt-10 flex items-end justify-between gap-4 border-t border-[#1A1A1A]/10 pt-5">
            <div><p className="font-mono text-[8px] uppercase tracking-[0.14em] text-[#787878]">Studio release from</p><p className="mt-1 font-serif text-2xl font-light">${product.price}</p></div>
            <span className="inline-flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#4A6741]">View piece <ArrowRight size={14} /></span>
          </div>
        </div>
      </Link>
    </article>
  );
}

export default function Marketplace() {
  const [featured, ...remaining] = FIRST_COLLECTION.products;

  return (
    <main className="min-h-screen bg-[#F9F7F4] text-[#1A1A1A]">
      <header className="bg-[#183022] px-6 pb-14 pt-7 text-[#F9F7F4] sm:px-10 lg:px-16 lg:pb-20">
        <nav className="mx-auto flex max-w-7xl items-center justify-between border-b border-white/15 pb-5">
          <Link to="/moodoor" className="font-serif text-3xl leading-none tracking-tight">Mood<span className="italic text-[#D5AF67]">oor</span></Link>
          <div className="flex items-center gap-5"><Link to="/moodoor/find" className="text-[10px] font-semibold uppercase tracking-[0.15em] text-white/70 transition hover:text-white">Find by feeling</Link><Link to="/experience" className="text-[10px] font-semibold uppercase tracking-[0.15em] text-white/70 transition hover:text-white">Studio</Link></div>
        </nav>
        <div className="mx-auto grid max-w-7xl gap-10 pt-16 lg:grid-cols-[1.15fr_0.85fr] lg:items-end">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.17em] text-[#D5AF67]">{FIRST_COLLECTION.kicker}</p>
            <h1 className="mt-6 max-w-4xl font-serif text-[clamp(4.2rem,9vw,8.5rem)] font-light leading-[0.78] tracking-[-0.055em]">The first <em className="text-[#D5AF67]">threshold</em><br />edit.</h1>
          </div>
          <div className="border-l border-[#D5AF67]/45 pl-6"><p className="font-mono text-[9px] uppercase tracking-[0.15em] text-[#D5AF67]">{FIRST_COLLECTION.season}</p><p className="mt-4 max-w-md text-base leading-8 text-white/70">{FIRST_COLLECTION.story}</p></div>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-6 py-12 sm:px-10 lg:px-16 lg:py-20">
        <div className="flex flex-col gap-6 border-b border-[#1A1A1A]/10 pb-8 md:flex-row md:items-end md:justify-between">
          <div><div className="flex items-center gap-3 text-[#4A6741]"><Leaf size={16} strokeWidth={1.3} /><p className="font-mono text-[10px] uppercase tracking-[0.15em]">Three compositions, deliberately released</p></div><h2 className="mt-5 font-serif text-5xl font-light leading-[0.9] tracking-[-0.035em]">Choose the feeling<br />that meets the door.</h2></div>
          <a href="#collection" className="inline-flex w-fit items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#4A6741]">Meet the release <ChevronDown size={14} /></a>
        </div>

        <div id="collection" className="mt-12 grid gap-7 lg:grid-cols-2">
          <CollectionCard product={featured} feature />
          {remaining.map((product) => <CollectionCard key={product.slug} product={product} />)}
        </div>
      </section>

      <section className="border-y border-[#1A1A1A]/10 bg-[#EEF2ED] px-6 py-14 sm:px-10 lg:px-16">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.7fr_1.3fr] lg:items-center">
          <div><Sparkles className="text-[#4A6741]" size={22} strokeWidth={1.4} /><p className="mt-5 font-mono text-[10px] uppercase tracking-[0.15em] text-[#4A6741]">A deliberately small collection</p></div>
          <p className="max-w-3xl font-serif text-3xl font-light leading-tight text-[#263B2C] sm:text-4xl">Every piece begins with a complete composition, then enters the collection only when it is ready to be released with intention.</p>
        </div>
      </section>

      <footer className="mx-auto flex max-w-7xl flex-col gap-5 px-6 py-10 text-[10px] uppercase tracking-[0.14em] text-[#787878] sm:px-10 md:flex-row md:items-center md:justify-between lg:px-16"><span>Evercrafted / Moodoor</span><div className="flex gap-5"><Link to="/moodoor/find" className="hover:text-[#1A1A1A]">Find by feeling</Link><Link to="/moodoor" className="hover:text-[#1A1A1A]">Moodoor home</Link></div></footer>
    </main>
  );
}
