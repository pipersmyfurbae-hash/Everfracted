import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Check, Leaf, LockKeyhole, RefreshCw, Sparkles, UploadCloud } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import {
  doorChoices,
  moodChoices,
  seasonChoices,
  type DoorId,
  type MoodId,
  type MoodoorListing,
  type MoodProfile,
  type SeasonId,
} from '../services/moodoorMatching';
import {
  getMoodoorMatches,
  getMoodoorStudioListings,
  updateMoodoorPublication,
} from '../services/ecosystemApiClient';

type FinderStep = 1 | 2 | 3 | 4;
type MoodoorApiMatch = Awaited<ReturnType<typeof getMoodoorMatches>>['matches'][number];

const stepLabels = ['Feeling', 'Season', 'Door', 'Your edit'];

function Progress({ current }: { current: FinderStep }) {
  return (
    <div className="flex gap-2" aria-label={`Step ${current} of 4`}>
      {stepLabels.map((label, index) => {
        const isCurrent = index + 1 === current;
        const isDone = index + 1 < current;
        return (
          <div className="flex items-center gap-2" key={label}>
            <span className={`h-1.5 w-7 rounded-full transition-colors ${isDone || isCurrent ? 'bg-[#C9A84C]' : 'bg-white/15'}`} />
            {isCurrent && <span className="hidden text-[10px] font-semibold uppercase tracking-[0.16em] text-[#C9A84C] sm:inline">{label}</span>}
          </div>
        );
      })}
    </div>
  );
}

function FinderChoice<T extends string>({
  id,
  title,
  detail,
  selected,
  onSelect,
}: {
  id: T;
  title: string;
  detail: string;
  selected: boolean;
  onSelect: (id: T) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect(id)}
      className={`group flex min-h-24 w-full items-start justify-between border p-5 text-left transition-all focus:outline-none focus:ring-2 focus:ring-[#C9A84C] focus:ring-offset-2 focus:ring-offset-[#1A1714] ${selected ? 'border-[#C9A84C] bg-[#C9A84C]/10' : 'border-white/10 bg-white/[0.03] hover:border-white/30 hover:bg-white/[0.06]'}`}
      aria-pressed={selected}
    >
      <span>
        <span className="block font-serif text-2xl font-light text-[#F5F0E8]">{title}</span>
        <span className="mt-1 block text-sm leading-relaxed text-white/50">{detail}</span>
      </span>
      <span className={`mt-1 flex h-6 w-6 items-center justify-center rounded-full border ${selected ? 'border-[#C9A84C] bg-[#C9A84C] text-[#1A1714]' : 'border-white/20 text-transparent'}`}>
        <Check size={14} strokeWidth={2.5} />
      </span>
    </button>
  );
}

function ListingImage({ listing }: { listing: MoodoorListing }) {
  if (listing.imageUrl) {
    return <img src={listing.imageUrl} alt={listing.title} className="h-full w-full object-cover" />;
  }
  return (
    <div className="flex h-full w-full flex-col items-center justify-center bg-gradient-to-br from-[#2D4734] to-[#1A1714] text-center text-[#D4A96A]">
      <Leaf size={34} strokeWidth={1.2} />
      <span className="mt-3 font-mono text-[10px] uppercase tracking-[0.16em] text-white/45">Approved image pending</span>
    </div>
  );
}

function MatchCard({ match, primary }: { match: MoodoorApiMatch; primary: boolean }) {
  const { listing } = match;
  return (
    <article className={`overflow-hidden border ${primary ? 'border-[#C9A84C] bg-[#F7F2E8]' : 'border-[#1A1714]/10 bg-white'}`}>
      <div className="grid md:grid-cols-[240px_1fr]">
        <div className="h-56 md:h-full"><ListingImage listing={listing} /></div>
        <div className="p-7 md:p-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-[#4A6741]">{primary ? 'Your closest match' : 'Also considered'}</span>
            <span className={`rounded-full px-3 py-1 font-mono text-[10px] uppercase tracking-[0.1em] ${listing.availability === 'limited' ? 'bg-[#C9A84C]/15 text-[#7A5C19]' : 'bg-[#4A6741]/10 text-[#3D5A3E]'}`}>{listing.availability === 'limited' ? 'Limited availability' : 'Available now'}</span>
          </div>
          <h2 className="mt-5 font-serif text-4xl font-light leading-none text-[#1A1714]">{listing.title}</h2>
          <p className="mt-4 max-w-xl text-sm leading-7 text-[#5C5954]">{listing.summary}</p>
          <div className="mt-6 border-l-2 border-[#C9A84C] pl-4">
            <p className="font-serif text-xl italic leading-relaxed text-[#3F3B34]">“{match.explanation}”</p>
          </div>
          <div className="mt-7 flex flex-wrap items-center justify-between gap-4">
            <span className="font-serif text-2xl text-[#1A1714]">{listing.price !== null ? `$${listing.price.toFixed(0)}` : 'Price on request'}</span>
            <Link to={`/moodoor/listing/${listing.slug}`} className="inline-flex items-center gap-2 bg-[#1A1714] px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-white transition-colors hover:bg-[#4A6741]">
              Explore this wreath <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
}

export function MoodoorFinder() {
  const [step, setStep] = useState<FinderStep>(1);
  const [profile, setProfile] = useState<Partial<MoodProfile>>({});
  const [matches, setMatches] = useState<MoodoorApiMatch[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canAdvance = useMemo(() => {
    if (step === 1) return Boolean(profile.mood);
    if (step === 2) return Boolean(profile.season);
    if (step === 3) return Boolean(profile.door);
    return false;
  }, [profile, step]);

  async function findMatches() {
    if (!profile.mood || !profile.season || !profile.door) return;
    setLoading(true);
    setError(null);
    try {
      const response = await getMoodoorMatches(profile as MoodProfile);
      setMatches(response.matches);
      setStep(4);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Moodoor could not read the current wreath edit. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  function advance() {
    if (!canAdvance) return;
    if (step === 3) {
      void findMatches();
      return;
    }
    setStep((current) => (current + 1) as FinderStep);
  }

  function restart() {
    setProfile({});
    setMatches([]);
    setError(null);
    setStep(1);
  }

  const heading = step === 1 ? <>How do you want your home<br /><em className="text-[#D4A96A]">to feel?</em></> : step === 2 ? <>What season or moment<br /><em className="text-[#D4A96A]">are you holding?</em></> : <>What kind of door<br /><em className="text-[#D4A96A]">will hold it?</em></>;

  return (
    <main className="min-h-screen bg-[#1A1714] text-[#F5F0E8]">
      <div className="mx-auto max-w-6xl px-6 py-8 sm:px-10">
        <nav className="flex items-center justify-between border-b border-white/10 pb-6">
          <Link to="/moodoor" className="font-serif text-2xl tracking-tight">Mood<span className="italic text-[#D4A96A]">oor</span></Link>
          <Link to="/" className="text-[10px] font-semibold uppercase tracking-[0.15em] text-white/50 transition-colors hover:text-white">Evercrafted</Link>
        </nav>

        {step < 4 ? (
          <section className="mx-auto flex min-h-[calc(100vh-120px)] max-w-4xl flex-col justify-center py-16">
            <Progress current={step} />
            <p className="mt-14 font-mono text-[10px] uppercase tracking-[0.16em] text-[#C9A84C]">Moodoor / a quieter way to choose</p>
            <h1 className="mt-5 font-serif text-[clamp(3rem,7vw,5.7rem)] font-light leading-[0.95] tracking-tight">{heading}</h1>
            <p className="mt-7 max-w-xl text-lg leading-8 text-white/55">Three small choices help Moodoor surface only approved, currently available wreaths from the Evercrafted marketplace.</p>
            <div className="mt-12 grid gap-3 md:grid-cols-2">
              {step === 1 && moodChoices.map((choice) => <FinderChoice key={choice.id} id={choice.id} title={choice.label} detail={choice.description} selected={profile.mood === choice.id} onSelect={(mood) => setProfile((current) => ({ ...current, mood }))} />)}
              {step === 2 && seasonChoices.map((choice) => <FinderChoice key={choice.id} id={choice.id} title={choice.label} detail="Choose the season or occasion that feels closest right now." selected={profile.season === choice.id} onSelect={(season) => setProfile((current) => ({ ...current, season }))} />)}
              {step === 3 && doorChoices.map((choice) => <FinderChoice key={choice.id} id={choice.id} title={choice.label} detail={choice.description} selected={profile.door === choice.id} onSelect={(door) => setProfile((current) => ({ ...current, door }))} />)}
            </div>
            {error && <div role="alert" className="mt-6 border border-[#C9A84C]/50 bg-[#C9A84C]/10 p-4 text-sm leading-6 text-[#F5E7C0]">{error}</div>}
            <div className="mt-10 flex items-center justify-between gap-5">
              <button type="button" onClick={() => setStep((current) => Math.max(1, current - 1) as FinderStep)} disabled={step === 1 || loading} className="text-[11px] font-semibold uppercase tracking-[0.15em] text-white/45 transition-colors hover:text-white disabled:cursor-not-allowed disabled:opacity-30">Back</button>
              <button type="button" onClick={advance} disabled={!canAdvance || loading} className="inline-flex items-center gap-3 bg-[#C9A84C] px-7 py-4 text-[11px] font-bold uppercase tracking-[0.16em] text-[#1A1714] transition-colors hover:bg-[#E0BA69] disabled:cursor-not-allowed disabled:opacity-40">
                {loading ? 'Looking through the edit…' : step === 3 ? 'See my wreaths' : 'Continue'} <ArrowRight size={15} />
              </button>
            </div>
          </section>
        ) : (
          <section className="py-16 sm:py-20">
            <div className="flex flex-col justify-between gap-8 border-b border-white/10 pb-12 md:flex-row md:items-end">
              <div>
                <Progress current={4} />
                <p className="mt-12 font-mono text-[10px] uppercase tracking-[0.16em] text-[#C9A84C]">Your Moodoor edit</p>
                <h1 className="mt-4 font-serif text-[clamp(3rem,6vw,5.5rem)] font-light leading-[0.95]">Something made<br /><em className="text-[#D4A96A]">to belong.</em></h1>
              </div>
              <div className="max-w-xs text-sm leading-7 text-white/50"><LockKeyhole className="mb-3 text-[#C9A84C]" size={18} />Moodoor only reads customer-safe product information. Internal inventory counts, supplier details, and composition scores remain inside Evercrafted.</div>
            </div>

            {matches.length ? (
              <div className="mt-12 space-y-5">
                {matches.map((match, index) => <MatchCard key={match.listing.id} match={match} primary={index === 0} />)}
              </div>
            ) : (
              <div className="mt-12 border border-white/10 bg-white/[0.03] p-10 text-center sm:p-16">
                <Leaf className="mx-auto text-[#C9A84C]" size={34} strokeWidth={1.2} />
                <p className="mt-6 font-serif text-4xl font-light">Nothing in the current edit<br /><em className="text-[#D4A96A]">belongs closely enough.</em></p>
                <p className="mx-auto mt-5 max-w-xl text-sm leading-7 text-white/55">Moodoor will not suggest a design simply to fill the space. Try another mood, season, or door to see whether a different part of the current edit feels more natural.</p>
              </div>
            )}
            <div className="mt-12 flex flex-wrap justify-center gap-5">
              <button type="button" onClick={restart} className="inline-flex items-center gap-2 border border-white/20 px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.15em] text-white/75 transition-colors hover:border-white hover:text-white"><RefreshCw size={14} /> Try another mood</button>
              <Link to="/moodoor" className="inline-flex items-center gap-2 px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.15em] text-[#C9A84C]">Back to Moodoor <ArrowRight size={14} /></Link>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}

export function MoodoorStudio() {
  const { user, loading: authLoading } = useAuth();
  const [listings, setListings] = useState<MoodoorListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  async function loadListings() {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const response = await getMoodoorStudioListings();
      setListings(response.listings);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Moodoor Studio could not load your publishable marketplace designs.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!authLoading && user) void loadListings();
    if (!authLoading && !user) setLoading(false);
  }, [authLoading, user]);

  async function toggleListing(listing: MoodoorListing) {
    setBusyId(listing.id);
    setError(null);
    try {
      await updateMoodoorPublication(listing.id, listing.isMoodoorPublished ? 'unpublish' : 'publish');
      await loadListings();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'The publication state could not be updated. Please try again.');
    } finally {
      setBusyId(null);
    }
  }

  const publishedCount = listings.filter((listing) => listing.isMoodoorPublished).length;
  const limitedCount = listings.filter((listing) => listing.availability === 'limited').length;

  return (
    <main className="min-h-screen bg-[#F9F7F4] px-6 py-10 text-[#1A1714] sm:px-10 lg:px-16">
      <div className="mx-auto max-w-7xl">
        <header className="border-b border-[#1A1714]/10 pb-10">
          <div className="flex flex-col justify-between gap-8 md:flex-row md:items-end">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#4A6741]">Atelier surface / publisher workspace</p>
              <h1 className="mt-4 font-serif text-[clamp(3rem,6vw,5.5rem)] font-light leading-[0.92] tracking-tight">Moodoor <em className="text-[#4A6741]">Studio.</em></h1>
              <p className="mt-5 max-w-2xl text-base leading-8 text-[#5C5954]">Review your approved marketplace designs, then deliberately release them to Moodoor’s customer-facing edit. Publishing never exposes raw inventory, supplier data, or internal design scores.</p>
            </div>
            <Link to="/moodoor" className="inline-flex items-center gap-2 self-start border border-[#1A1714]/20 px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.14em] transition-colors hover:border-[#4A6741] hover:text-[#4A6741] md:self-auto">View consumer Moodoor <ArrowRight size={14} /></Link>
          </div>
        </header>

        <section className="grid border-b border-[#1A1714]/10 sm:grid-cols-3">
          {[['Eligible designs', listings.length], ['In Moodoor', publishedCount], ['Limited availability', limitedCount]].map(([label, value]) => <div className="border-r border-[#1A1714]/10 py-8 last:border-r-0" key={label as string}><p className="font-serif text-5xl font-light text-[#4A6741]">{value}</p><p className="mt-2 font-mono text-[10px] uppercase tracking-[0.14em] text-[#787878]">{label}</p></div>)}
        </section>

        <section className="py-12">
          <div className="mb-8 flex flex-wrap items-end justify-between gap-5">
            <div><p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#4A6741]">Public release register</p><h2 className="mt-2 font-serif text-4xl font-light">Approved, available designs.</h2></div>
            <p className="max-w-sm text-sm leading-6 text-[#5C5954]">A design must be published to the Evercrafted marketplace, in stock or limited availability, and meet the 0.78 quality gate before Moodoor can accept it.</p>
          </div>
          {error && <div role="alert" className="mb-6 border border-[#B5451B]/30 bg-[#B5451B]/5 p-4 text-sm text-[#7B2C14]">{error}</div>}
          {loading ? <div className="border border-[#1A1714]/10 bg-white p-12 text-sm text-[#787878]">Reading your approved marketplace designs…</div> : !listings.length ? <div className="border border-dashed border-[#1A1714]/20 bg-white p-12 text-center"><UploadCloud className="mx-auto text-[#4A6741]" size={32} strokeWidth={1.2} /><h3 className="mt-5 font-serif text-3xl font-light">Nothing ready to publish yet.</h3><p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-[#5C5954]">Complete the design approval and marketplace publication flow first. Moodoor will then surface only the designs that are genuinely ready to be considered by customers.</p><Link to="/app/order-studio" className="mt-7 inline-flex items-center gap-2 bg-[#1A1714] px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-white transition-colors hover:bg-[#4A6741]">Open Order Studio <ArrowRight size={14} /></Link></div> : <div className="grid gap-4 lg:grid-cols-2">{listings.map((listing) => <article key={listing.id} className="grid min-h-64 grid-cols-[132px_1fr] overflow-hidden border border-[#1A1714]/10 bg-white"><div className="h-full"><ListingImage listing={listing} /></div><div className="p-6"><div className="flex items-start justify-between gap-3"><span className={`font-mono text-[10px] uppercase tracking-[0.12em] ${listing.isMoodoorPublished ? 'text-[#4A6741]' : 'text-[#787878]'}`}>{listing.isMoodoorPublished ? 'In Moodoor' : 'Private to Evercrafted'}</span><span className="font-mono text-[10px] uppercase tracking-[0.12em] text-[#7A5C19]">{listing.availability === 'limited' ? 'Limited' : 'In stock'}</span></div><h3 className="mt-4 font-serif text-3xl font-light leading-none">{listing.title}</h3><p className="mt-3 line-clamp-2 text-sm leading-6 text-[#5C5954]">{listing.summary}</p><div className="mt-5 flex items-center justify-between gap-4"><span className="font-mono text-[10px] uppercase tracking-[0.12em] text-[#787878]">{listing.formula || 'Approved design'}</span><button type="button" onClick={() => void toggleListing(listing)} disabled={busyId === listing.id} className={`inline-flex items-center gap-2 px-4 py-2.5 text-[10px] font-semibold uppercase tracking-[0.14em] transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${listing.isMoodoorPublished ? 'border border-[#1A1714]/20 text-[#1A1714] hover:border-[#B5451B] hover:text-[#B5451B]' : 'bg-[#4A6741] text-white hover:bg-[#3B5535]'}`}>{busyId === listing.id ? 'Updating…' : listing.isMoodoorPublished ? 'Remove from Moodoor' : 'Release to Moodoor'} <ArrowRight size={13} /></button></div></div></article>)}</div>}
        </section>

        <section className="border-t border-[#1A1714]/10 pt-10 text-sm leading-7 text-[#5C5954]"><div className="grid gap-8 md:grid-cols-3"><div><Sparkles className="mb-3 text-[#4A6741]" size={19}/><h3 className="font-serif text-2xl text-[#1A1714]">Shared source of truth</h3><p className="mt-2">Moodoor is a read-only consumer projection of your Evercrafted marketplace data. There is no duplicate catalogue to maintain.</p></div><div><LockKeyhole className="mb-3 text-[#4A6741]" size={19}/><h3 className="font-serif text-2xl text-[#1A1714]">Private by construction</h3><p className="mt-2">Customer pages receive only product-safe title, story, availability, imagery, palette, and price information.</p></div><div><Leaf className="mb-3 text-[#4A6741]" size={19}/><h3 className="font-serif text-2xl text-[#1A1714]">Thoughtful release</h3><p className="mt-2">Publication remains a deliberate maker action. Unavailable or below-threshold designs are excluded from matching automatically.</p></div></div></section>
      </div>
    </main>
  );
}
