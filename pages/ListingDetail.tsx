import { useEffect, useState } from 'react';
import { ArrowLeft, ArrowUpRight, Leaf, Loader2, Mail, ShoppingBag, Sparkles } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { createMoodoorCheckout, EcosystemApiError, getMoodoorPublicListing, type PublicMoodoorListing } from '../services/ecosystemApiClient';

function DetailImage({ listing }: { listing: PublicMoodoorListing }) {
  if (listing.imageUrl) {
    return <img src={listing.imageUrl} alt={listing.title} className="h-full w-full object-cover" />;
  }
  return (
    <div className="relative flex h-full min-h-[28rem] items-center justify-center overflow-hidden bg-[#1E3024] text-[#D4A96A]">
      <div className="absolute h-[27rem] w-[27rem] rounded-full border border-[#D4A96A]/25" />
      <div className="absolute h-[18rem] w-[18rem] rounded-full border border-[#D4A96A]/25" />
      <div className="relative text-center"><Leaf className="mx-auto" size={48} strokeWidth={1.1} /><p className="mt-4 font-mono text-[10px] uppercase tracking-[0.18em] text-white/55">Evercrafted release</p></div>
    </div>
  );
}

export default function ListingDetail() {
  const { slug } = useParams<{ slug: string }>();
  const [listing, setListing] = useState<PublicMoodoorListing | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [checkingOut, setCheckingOut] = useState(false);

  useEffect(() => {
    async function loadListing(): Promise<void> {
      if (!slug) {
        setError('This Moodoor wreath could not be found.');
        setLoading(false);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const response = await getMoodoorPublicListing(slug);
        setListing(response.listing);
      } catch (caught) {
        setError(caught instanceof EcosystemApiError ? caught.message : 'This Moodoor wreath could not be loaded. Please try again.');
      } finally {
        setLoading(false);
      }
    }
    void loadListing();
  }, [slug]);

  if (loading) {
    return <main className="flex min-h-screen items-center justify-center bg-[#F9F7F4] text-sm text-[#787878]"><Loader2 className="mr-3 animate-spin text-[#4A6741]" size={18} /> Opening this Moodoor wreath…</main>;
  }

  if (error || !listing) {
    return <main className="flex min-h-screen items-center justify-center bg-[#F9F7F4] px-6 text-[#1A1A1A]"><div className="max-w-xl border border-[#1A1A1A]/10 bg-white p-10 text-center"><Leaf className="mx-auto text-[#4A6741]" size={36} strokeWidth={1.1} /><h1 className="mt-6 font-serif text-5xl font-light">This edit has moved on.</h1><p className="mt-5 text-sm leading-7 text-[#5A5A5A]">{error || 'This Moodoor wreath is no longer part of the customer collection.'}</p><Link to="/moodoor/catalogue" className="mt-8 inline-flex items-center gap-2 bg-[#1A1A1A] px-5 py-3 text-[10px] font-semibold uppercase tracking-[0.15em] text-white">Browse the current edit <ArrowUpRight size={14} /></Link></div></main>;
  }

  const price = listing.price === null ? 'Price on request' : `$${listing.price.toFixed(0)}`;
  const enquiryHref = `mailto:?subject=${encodeURIComponent(`Moodoor enquiry — ${listing.title}`)}&body=${encodeURIComponent(`Hello Evercrafted,\n\nI would like to enquire about ${listing.title}.\n\nThank you.`)}`;

  async function beginCheckout(): Promise<void> {
    if (!slug || listing.commerce.mode !== 'direct_checkout') return;
    setCheckingOut(true);
    setCheckoutError(null);
    try {
      const { checkoutUrl } = await createMoodoorCheckout(slug);
      window.location.assign(checkoutUrl);
    } catch (caught) {
      setCheckoutError(caught instanceof EcosystemApiError ? caught.message : 'Checkout could not be prepared. Please request availability and we will be glad to assist.');
    } finally {
      setCheckingOut(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#F9F7F4] text-[#1A1A1A]">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-7 sm:px-10 lg:px-16"><Link to="/moodoor/catalogue" className="inline-flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.15em] text-[#4A6741] transition hover:text-[#1A1A1A]"><ArrowLeft size={14} /> Current edit</Link><Link to="/moodoor" className="font-serif text-3xl leading-none tracking-tight">Mood<span className="italic text-[#4A6741]">oor</span></Link></nav>

      <section className="mx-auto grid max-w-7xl border-t border-[#1A1A1A]/10 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="min-h-[34rem] bg-[#1E3024]"><DetailImage listing={listing} /></div>
        <article className="flex flex-col justify-between border-b border-[#1A1A1A]/10 bg-white p-8 sm:p-12 lg:border-b-0">
          <div>
            <div className="flex flex-wrap items-center justify-between gap-4"><p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#4A6741]">From the current Moodoor edit</p><span className={`border px-3 py-1 font-mono text-[9px] uppercase tracking-[0.12em] ${listing.availability === 'limited' ? 'border-[#C4922A]/45 text-[#8A681D]' : 'border-[#4A6741]/35 text-[#4A6741]'}`}>{listing.availability === 'limited' ? 'Limited availability' : 'Available now'}</span></div>
            <h1 className="mt-10 font-serif text-[clamp(3.5rem,6vw,6rem)] font-light leading-[0.84] tracking-[-0.04em]">{listing.title}</h1>
            <p className="mt-8 max-w-xl text-lg leading-8 text-[#4A4A4A]">{listing.summary}</p>
            <div className="mt-10 flex flex-wrap gap-2">{listing.moodTags.map((tag) => <span key={`mood-${tag}`} className="bg-[#EEF2ED] px-3 py-2 font-mono text-[9px] uppercase tracking-[0.12em] text-[#4A6741]">{tag}</span>)}{listing.seasonTags.map((tag) => <span key={`season-${tag}`} className="bg-[#F2EFE9] px-3 py-2 font-mono text-[9px] uppercase tracking-[0.12em] text-[#5A5A5A]">{tag}</span>)}</div>
          </div>
          <div className="mt-12 border-t border-[#1A1A1A]/10 pt-7"><div className="flex items-end justify-between gap-6"><div><p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#787878]">{listing.price === null ? 'A made-to-order conversation' : 'Starting at'}</p><p className="mt-2 font-serif text-4xl font-light">{price}</p></div>{listing.commerce.mode === 'direct_checkout' ? <button type="button" onClick={() => void beginCheckout()} disabled={checkingOut} className="inline-flex items-center gap-2 bg-[#4A6741] px-5 py-4 text-[10px] font-semibold uppercase tracking-[0.14em] text-white transition hover:bg-[#1A1A1A] disabled:cursor-not-allowed disabled:opacity-60"><ShoppingBag size={14} /> {checkingOut ? 'Preparing checkout…' : 'Purchase securely'}</button> : <a href={enquiryHref} className="inline-flex items-center gap-2 bg-[#1A1A1A] px-5 py-4 text-[10px] font-semibold uppercase tracking-[0.14em] text-white transition hover:bg-[#4A6741]"><Mail size={14} /> Request availability</a>}</div>{checkoutError && <p role="alert" className="mt-5 border-l-2 border-[#B94040] bg-[#FFF5F4] px-4 py-3 text-xs leading-6 text-[#8A2F2F]">{checkoutError}</p>}<p className="mt-5 text-xs leading-6 text-[#787878]">{listing.commerce.mode === 'direct_checkout' ? 'Secure payment, shipping, and order confirmation are completed in the managed checkout.' : 'Requesting availability opens your email client. This made-to-order piece begins with a considered conversation.'}</p></div>
        </article>
      </section>

      <section className="mx-auto grid max-w-7xl gap-px bg-[#1A1A1A]/10 md:grid-cols-3"><div className="bg-[#F9F7F4] p-8"><Sparkles className="text-[#4A6741]" size={19} /><h2 className="mt-5 font-serif text-3xl font-light">A considered composition</h2><p className="mt-3 text-sm leading-7 text-[#5A5A5A]">Every released wreath begins as a deliberate composition before becoming part of the Moodoor collection.</p></div><div className="bg-[#F9F7F4] p-8"><Leaf className="text-[#4A6741]" size={19} /><h2 className="mt-5 font-serif text-3xl font-light">Made for the threshold</h2><p className="mt-3 text-sm leading-7 text-[#5A5A5A]">Seasonal colour, visual balance, and a distinct silhouette help the wreath belong to the door that holds it.</p></div><div className="bg-[#F9F7F4] p-8"><Mail className="text-[#4A6741]" size={19} /><h2 className="mt-5 font-serif text-3xl font-light">Ask before deciding</h2><p className="mt-3 text-sm leading-7 text-[#5A5A5A]">The enquiry step leaves room to discuss timing, availability, and the best fit for your home.</p></div></section>
    </main>
  );
}
