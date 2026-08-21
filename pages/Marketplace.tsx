import { useEffect, useMemo, useState } from 'react';
import { ArrowRight, Leaf, Loader2, SlidersHorizontal } from 'lucide-react';
import { Link } from 'react-router-dom';
import { EcosystemApiError, getMoodoorPublicListings, type PublicMoodoorListing } from '../services/ecosystemApiClient';

const seasonFilters = ['all', 'spring', 'summer', 'autumn', 'winter', 'occasion'] as const;
type SeasonFilter = typeof seasonFilters[number];

function ListingImage({ listing }: { listing: PublicMoodoorListing }) {
  if (listing.imageUrl) {
    return <img src={listing.imageUrl} alt={listing.title} className="h-full w-full object-cover transition duration-700 group-hover:scale-[1.03]" />;
  }

  return (
    <div className="relative flex h-full w-full items-center justify-center overflow-hidden bg-[#DDE6D8] text-[#4A6741]">
      <div className="absolute -left-12 -top-12 h-44 w-44 rounded-full border border-[#4A6741]/20" />
      <div className="absolute -bottom-14 -right-6 h-52 w-52 rounded-full border border-[#4A6741]/20" />
      <div className="relative text-center"><Leaf className="mx-auto" size={42} strokeWidth={1.1} /><p className="mt-4 font-mono text-[9px] uppercase tracking-[0.16em]">A considered edit</p></div>
    </div>
  );
}

export default function Marketplace() {
  const [listings, setListings] = useState<PublicMoodoorListing[]>([]);
  const [selectedSeason, setSelectedSeason] = useState<SeasonFilter>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadCatalogue(): Promise<void> {
      setLoading(true);
      setError(null);
      try {
        const response = await getMoodoorPublicListings();
        setListings(response.listings);
      } catch (caught) {
        setError(caught instanceof EcosystemApiError ? caught.message : 'The current Moodoor edit could not be loaded. Please try again.');
      } finally {
        setLoading(false);
      }
    }
    void loadCatalogue();
  }, []);

  const visibleListings = useMemo(() => {
    if (selectedSeason === 'all') return listings;
    return listings.filter((listing) => listing.seasonTags.includes(selectedSeason));
  }, [listings, selectedSeason]);

  return (
    <main className="min-h-screen bg-[#F9F7F4] text-[#1A1A1A]">
      <header className="overflow-hidden border-b border-[#1A1A1A]/10 bg-[#EEF2ED] px-6 pb-14 pt-7 sm:px-10 lg:px-16 lg:pb-20">
        <nav className="mx-auto flex max-w-7xl items-center justify-between border-b border-[#1A1A1A]/10 pb-5">
          <Link to="/moodoor" className="font-serif text-3xl leading-none tracking-tight">Mood<span className="italic text-[#4A6741]">oor</span></Link>
          <Link to="/moodoor/find" className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[#4A6741] transition hover:text-[#1A1A1A]">Find by feeling</Link>
        </nav>
        <div className="mx-auto grid max-w-7xl gap-8 pt-14 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
          <div>
            <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-[#4A6741]">The current Moodoor edit</p>
            <h1 className="mt-5 max-w-3xl font-serif text-[clamp(3.6rem,7.5vw,7rem)] font-light leading-[0.84] tracking-[-0.045em]">Wreaths made<br /><em className="text-[#4A6741]">to feel at home.</em></h1>
          </div>
          <p className="max-w-md border-l border-[#4A6741]/35 pl-6 text-base leading-8 text-[#4A4A4A]">A considered collection of available Evercrafted designs. Ready-to-ship pieces can move directly to secure checkout; bespoke and limited releases retain a more personal enquiry path.</p>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-6 py-12 sm:px-10 lg:px-16 lg:py-16">
        <div className="flex flex-col justify-between gap-6 border-b border-[#1A1A1A]/10 pb-7 lg:flex-row lg:items-center">
          <div className="flex items-center gap-3 text-[#4A6741]"><SlidersHorizontal size={16} /><p className="font-mono text-[10px] uppercase tracking-[0.15em]">Browse by season</p></div>
          <div className="flex flex-wrap gap-x-5 gap-y-3">
            {seasonFilters.map((season) => <button key={season} type="button" onClick={() => setSelectedSeason(season)} className={`border-b pb-1 text-[10px] font-semibold uppercase tracking-[0.14em] transition ${selectedSeason === season ? 'border-[#4A6741] text-[#4A6741]' : 'border-transparent text-[#787878] hover:text-[#1A1A1A]'}`}>{season}</button>)}
          </div>
        </div>

        {loading ? <div className="flex min-h-80 items-center justify-center gap-3 text-sm text-[#787878]"><Loader2 size={18} className="animate-spin text-[#4A6741]" /> Curating the current edit…</div> : error ? <div role="alert" className="my-12 border border-[#B94040]/25 bg-[#FFF5F4] p-7 text-sm leading-7 text-[#8A2F2F]">{error}</div> : visibleListings.length ? <div className="mt-10 grid gap-x-7 gap-y-12 sm:grid-cols-2 xl:grid-cols-3">{visibleListings.map((listing, index) => <article className={`group ${index === 0 ? 'sm:col-span-2 xl:col-span-2' : ''}`} key={listing.id}><Link to={`/moodoor/listing/${listing.slug}`} className={`block overflow-hidden bg-white ${index === 0 ? 'sm:grid sm:grid-cols-[1.1fr_0.9fr]' : ''}`}><div className={`${index === 0 ? 'h-80 sm:h-full' : 'h-80'} overflow-hidden`}><ListingImage listing={listing} /></div><div className={`border border-[#1A1A1A]/10 ${index === 0 ? 'flex flex-col justify-center p-8 sm:border-l-0 sm:p-10' : 'border-t-0 p-6'}`}><div className="flex items-center justify-between gap-3"><span className="font-mono text-[9px] uppercase tracking-[0.15em] text-[#4A6741]">{listing.formula?.replace(/-/g, ' ') || 'Evercrafted design'}</span><span className={`font-mono text-[9px] uppercase tracking-[0.12em] ${listing.commerce.mode === 'direct_checkout' ? 'text-[#4A6741]' : 'text-[#A37418]'}`}>{listing.commerce.mode === 'direct_checkout' ? 'Secure checkout' : 'Enquiry available'}</span></div><h2 className={`${index === 0 ? 'mt-8 text-5xl' : 'mt-5 text-3xl'} font-serif font-light leading-[0.95]`}>{listing.title}</h2><p className="mt-4 line-clamp-3 text-sm leading-7 text-[#5A5A5A]">{listing.summary}</p><div className="mt-7 flex items-end justify-between gap-4"><span className="font-serif text-2xl">{listing.price === null ? 'Price on request' : `$${listing.price.toFixed(0)}`}</span><span className="inline-flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#4A6741]">{listing.commerce.mode === 'direct_checkout' ? 'View & purchase' : 'Discover & enquire'} <ArrowRight size={14} /></span></div></div></Link></article>)}</div> : <div className="my-14 border border-dashed border-[#1A1A1A]/20 bg-white p-12 text-center"><Leaf className="mx-auto text-[#4A6741]" size={35} strokeWidth={1.2} /><h2 className="mt-5 font-serif text-4xl font-light">No pieces in this edit yet.</h2><p className="mx-auto mt-4 max-w-lg text-sm leading-7 text-[#5A5A5A]">Moodoor only presents designs after a maker has deliberately released an approved, available listing.</p><Link to="/moodoor/find" className="mt-7 inline-flex items-center gap-2 bg-[#1A1A1A] px-5 py-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-white">Find by feeling <ArrowRight size={14} /></Link></div>}
      </section>
    </main>
  );
}
