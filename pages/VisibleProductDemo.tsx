import { useMemo, useState } from 'react';
import {
  ArrowRight,
  Check,
  ChevronRight,
  CircleDollarSign,
  Compass,
  Flower2,
  Leaf,
  LockKeyhole,
  Menu,
  Plus,
  Sparkles,
  WandSparkles,
} from 'lucide-react';

type View = 'discover' | 'maker';
type Mood = 'calm' | 'warm' | 'dramatic';
type Season = 'autumn' | 'winter' | 'celebration';
type Door = 'dark' | 'light' | 'modern';

type Listing = {
  id: string;
  title: string;
  mood: Mood;
  season: Season;
  formula: string;
  price: number;
  availability: string;
  description: string;
  colours: [string, string, string];
  checkout: boolean;
};

const listings: Listing[] = [
  {
    id: 'quiet-winter',
    title: 'Quiet Winter Welcome',
    mood: 'calm',
    season: 'winter',
    formula: 'Crescent sweep',
    price: 148,
    availability: 'Available now',
    description: 'Evergreen structure, ivory petals, and an unhurried crescent for a darker entry.',
    colours: ['#355A42', '#F5F0E8', '#C9A84C'],
    checkout: true,
  },
  {
    id: 'harvest-hour',
    title: 'Harvest Hour',
    mood: 'warm',
    season: 'autumn',
    formula: 'Asymmetric weight',
    price: 164,
    availability: 'Made in small runs',
    description: 'A generous, russet composition designed to bring warmth to a traditional front door.',
    colours: ['#744137', '#D6A95F', '#567158'],
    checkout: false,
  },
  {
    id: 'after-hours',
    title: 'After Hours',
    mood: 'dramatic',
    season: 'celebration',
    formula: 'Focal trio',
    price: 182,
    availability: 'Available now',
    description: 'Deep plum, ink-toned greens, and three intentional focal blooms for a confident threshold.',
    colours: ['#38273D', '#23392D', '#D7B086'],
    checkout: true,
  },
];

const moodOptions: Array<{ id: Mood; title: string; note: string }> = [
  { id: 'calm', title: 'Calm', note: 'quiet, clear, restorative' },
  { id: 'warm', title: 'Warm', note: 'welcoming, golden, generous' },
  { id: 'dramatic', title: 'Dramatic', note: 'moody, sculptural, expressive' },
];

const seasonOptions: Array<{ id: Season; title: string; note: string }> = [
  { id: 'autumn', title: 'Autumn', note: 'earthy and harvest-rich' },
  { id: 'winter', title: 'Winter', note: 'evergreen and luminous' },
  { id: 'celebration', title: 'Celebration', note: 'made for a moment' },
];

const doorOptions: Array<{ id: Door; title: string; note: string }> = [
  { id: 'dark', title: 'Dark wood', note: 'contrast and warmth' },
  { id: 'light', title: 'Light painted', note: 'softened colour' },
  { id: 'modern', title: 'Modern', note: 'clean architectural lines' },
];

function WreathArt({ colours, compact = false }: { colours: [string, string, string]; compact?: boolean }) {
  const size = compact ? 180 : 280;
  const center = size / 2;
  const ring = size * 0.31;
  const blooms = [
    [0.16, 0.62, 15], [0.29, 0.77, 12], [0.42, 0.68, 17], [0.55, 0.77, 12], [0.67, 0.59, 14],
    [0.78, 0.49, 11], [0.71, 0.34, 15], [0.56, 0.25, 10], [0.4, 0.27, 14], [0.25, 0.38, 11],
  ];
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-label="Wreath design preview" role="img">
      <defs>
        <filter id={`blur-${colours[0]}`} x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="7" /></filter>
      </defs>
      <circle cx={center} cy={center} r={ring} fill="none" stroke={colours[0]} strokeWidth={size * 0.1} opacity="0.9" />
      <circle cx={center} cy={center} r={ring * 0.74} fill="var(--demo-paper)" />
      <path d={`M${size * 0.14},${size * 0.52} C${size * 0.25},${size * 0.06} ${size * 0.75},${size * 0.05} ${size * 0.85},${size * 0.47}`} stroke={colours[0]} strokeWidth={size * 0.038} fill="none" opacity="0.72" />
      {blooms.map(([x, y, r], index) => (
        <g key={`${x}-${y}`} transform={`translate(${x * size} ${y * size})`}>
          <circle r={r * (size / 280)} fill={index % 3 === 0 ? colours[1] : colours[index % 2]} opacity="0.98" />
          <circle r={r * 0.46 * (size / 280)} fill={colours[2]} opacity="0.78" />
          <circle r={r * 1.28 * (size / 280)} fill="none" stroke={index % 2 ? colours[0] : colours[1]} strokeWidth="1.2" opacity="0.45" />
        </g>
      ))}
      <circle cx={size * 0.83} cy={size * 0.65} r={size * 0.055} fill={colours[2]} opacity="0.9" />
      <circle cx={size * 0.16} cy={size * 0.62} r={size * 0.04} fill={colours[1]} opacity="0.85" />
    </svg>
  );
}

function ChoiceButton<T extends string>({
  selected,
  title,
  note,
  onClick,
}: {
  selected: boolean;
  title: string;
  note: string;
  onClick: () => void;
}) {
  return (
    <button className={`demo-choice ${selected ? 'is-selected' : ''}`} onClick={onClick} type="button">
      <span className="choice-check">{selected && <Check size={14} strokeWidth={2.4} />}</span>
      <span><strong>{title}</strong><small>{note}</small></span>
    </button>
  );
}

function ListingCard({ listing, selected, onSelect }: { listing: Listing; selected: boolean; onSelect: () => void }) {
  return (
    <button type="button" onClick={onSelect} className={`listing-card ${selected ? 'is-selected' : ''}`}>
      <div className="listing-art"><WreathArt colours={listing.colours} compact /></div>
      <div className="listing-copy">
        <div className="eyebrow-row"><span>{listing.formula}</span><span>{listing.availability}</span></div>
        <h3>{listing.title}</h3>
        <p>{listing.description}</p>
        <div className="listing-price"><strong>${listing.price}</strong><span>View piece <ArrowRight size={14} /></span></div>
      </div>
    </button>
  );
}

export default function VisibleProductDemo() {
  const [view, setView] = useState<View>('discover');
  const [mood, setMood] = useState<Mood>('calm');
  const [season, setSeason] = useState<Season>('winter');
  const [door, setDoor] = useState<Door>('dark');
  const [selectedListingId, setSelectedListingId] = useState('quiet-winter');
  const [notice, setNotice] = useState('');
  const [brief, setBrief] = useState('A calm winter welcome for a dark wood door, with quiet contrast and an open crescent.');
  const [formula, setFormula] = useState('Crescent sweep');
  const [generated, setGenerated] = useState(false);
  const [published, setPublished] = useState(false);

  const recommendations = useMemo(() => {
    const exact = listings.filter((listing) => listing.mood === mood && listing.season === season);
    return exact.length ? [...exact, ...listings.filter((listing) => !exact.includes(listing))].slice(0, 3) : listings;
  }, [mood, season]);
  const selectedListing = listings.find((listing) => listing.id === selectedListingId) || listings[0];
  const activeMakerColours: [string, string, string] = formula === 'Focal trio' ? ['#38273D', '#F5F0E8', '#D7B086'] : formula === 'Full ring' ? ['#4E6E54', '#F4D9CB', '#C9A84C'] : ['#355A42', '#F5F0E8', '#C9A84C'];

  function showNotice(message: string) {
    setNotice(message);
    window.setTimeout(() => setNotice(''), 3600);
  }

  return (
    <main className="visible-demo">
      <style>{`
        .visible-demo { --demo-ink:#182019; --demo-muted:#697169; --demo-green:#48643F; --demo-pale:#EAF0E7; --demo-paper:#F8F6F1; --demo-warm:#EEE8DD; --demo-gold:#C39B59; min-height:100vh; background:var(--demo-paper); color:var(--demo-ink); font-family:Inter, ui-sans-serif,system-ui,sans-serif; }
        .visible-demo * { box-sizing:border-box; }
        .visible-demo button { font:inherit; }
        .demo-shell { max-width:1320px; margin:0 auto; padding:22px 32px 64px; }
        .demo-nav { display:flex; align-items:center; justify-content:space-between; padding:6px 0 22px; border-bottom:1px solid rgba(24,32,25,.12); }
        .demo-brand { display:flex; align-items:center; gap:10px; color:var(--demo-ink); font-family:Georgia,serif; font-size:25px; text-decoration:none; letter-spacing:-.04em; }
        .demo-brand b { color:var(--demo-green); font-weight:400; font-style:italic; }
        .demo-nav-right { display:flex; align-items:center; gap:10px; }
        .demo-nav button { border:0; background:transparent; color:var(--demo-muted); padding:10px 12px; cursor:pointer; font-size:12px; letter-spacing:.1em; text-transform:uppercase; transition:.2s; }
        .demo-nav button.active { color:var(--demo-ink); border-bottom:2px solid var(--demo-green); }
        .demo-nav .demo-pill { border:1px solid rgba(24,32,25,.15); border-radius:999px; padding:8px 12px; color:var(--demo-green); display:flex; gap:7px; align-items:center; font-size:11px; letter-spacing:.08em; text-transform:uppercase; }
        .demo-hero { display:grid; grid-template-columns:1.05fr .95fr; min-height:455px; margin-top:28px; background:var(--demo-ink); color:#F8F6F1; overflow:hidden; position:relative; }
        .demo-hero::after { content:''; position:absolute; width:520px; height:520px; border:1px solid rgba(234,240,231,.12); border-radius:50%; right:-190px; top:-155px; }
        .demo-hero-copy { position:relative; z-index:1; padding:72px 64px; display:flex; flex-direction:column; justify-content:center; }
        .demo-overline { color:#C9A96A; font-size:10px; font-weight:700; letter-spacing:.2em; text-transform:uppercase; display:flex; align-items:center; gap:9px; }
        .demo-overline::before { content:''; width:28px; height:1px; background:currentColor; }
        .demo-hero h1 { margin:24px 0 19px; max-width:600px; font-family:Georgia,serif; font-size:clamp(48px,6vw,82px); line-height:.9; font-weight:400; letter-spacing:-.065em; }
        .demo-hero h1 em { color:#C9A96A; font-weight:400; }
        .demo-hero p { max-width:530px; font-size:16px; line-height:1.7; color:rgba(248,246,241,.7); margin:0; }
        .demo-hero-buttons { display:flex; flex-wrap:wrap; gap:12px; margin-top:29px; }
        .demo-button { border:0; cursor:pointer; padding:14px 18px; display:inline-flex; align-items:center; gap:8px; font-size:11px; font-weight:700; letter-spacing:.12em; text-transform:uppercase; transition:.2s; }
        .demo-button.primary { background:#F8F6F1; color:var(--demo-ink); }
        .demo-button.primary:hover { background:#C9A96A; transform:translateY(-2px); }
        .demo-button.ghost { background:transparent; border:1px solid rgba(248,246,241,.28); color:#F8F6F1; }
        .demo-button.ghost:hover { border-color:#F8F6F1; }
        .demo-hero-art { position:relative; display:flex; justify-content:center; align-items:center; background:radial-gradient(circle at 48% 48%,rgba(203,174,113,.22),transparent 42%),linear-gradient(145deg,#314939,#1a221b); }
        .demo-hero-art .art-caption { position:absolute; left:28px; bottom:24px; color:rgba(248,246,241,.55); font-size:10px; letter-spacing:.16em; text-transform:uppercase; }
        .demo-workspace { display:grid; grid-template-columns:290px 1fr; gap:32px; margin-top:46px; }
        .demo-side { border-top:2px solid var(--demo-ink); padding-top:18px; }
        .demo-side h2 { font-family:Georgia,serif; font-size:31px; font-weight:400; margin:0; letter-spacing:-.04em; }
        .demo-side p { color:var(--demo-muted); line-height:1.65; font-size:14px; margin:14px 0 24px; }
        .demo-steps { display:grid; gap:12px; }
        .demo-step { display:flex; gap:11px; align-items:flex-start; padding:12px 0; border-bottom:1px solid rgba(24,32,25,.1); color:var(--demo-muted); font-size:12px; }
        .demo-step b { color:var(--demo-green); font-family:ui-monospace,monospace; font-size:10px; }
        .demo-step strong { display:block; color:var(--demo-ink); margin-bottom:4px; font-size:12px; }
        .demo-panel { background:#fff; border:1px solid rgba(24,32,25,.1); padding:28px; }
        .choice-block + .choice-block { border-top:1px solid rgba(24,32,25,.1); margin-top:24px; padding-top:24px; }
        .choice-label { display:flex; align-items:baseline; justify-content:space-between; margin-bottom:13px; }
        .choice-label b { font-family:Georgia,serif; font-weight:400; font-size:25px; letter-spacing:-.03em; }
        .choice-label span { color:var(--demo-green); font-size:10px; letter-spacing:.14em; text-transform:uppercase; }
        .choice-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:10px; }
        .demo-choice { text-align:left; min-height:86px; border:1px solid rgba(24,32,25,.13); background:#fff; display:flex; gap:11px; padding:14px; cursor:pointer; color:var(--demo-ink); transition:.2s; }
        .demo-choice:hover, .demo-choice.is-selected { border-color:var(--demo-green); background:var(--demo-pale); transform:translateY(-1px); }
        .choice-check { width:20px; height:20px; border:1px solid rgba(24,32,25,.24); border-radius:50%; display:grid; place-items:center; flex:0 0 auto; color:#fff; }
        .is-selected .choice-check { border-color:var(--demo-green); background:var(--demo-green); }
        .demo-choice strong { display:block; font-family:Georgia,serif; font-size:19px; font-weight:400; line-height:1; }
        .demo-choice small { display:block; font-size:11px; line-height:1.35; color:var(--demo-muted); margin-top:7px; }
        .match-header { margin:42px 0 20px; display:flex; justify-content:space-between; align-items:end; gap:20px; }
        .match-header h2 { margin:0; font-family:Georgia,serif; font-size:42px; letter-spacing:-.055em; font-weight:400; }
        .match-header p { color:var(--demo-muted); margin:0; font-size:13px; line-height:1.6; max-width:420px; }
        .listing-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:16px; }
        .listing-card { text-align:left; border:1px solid rgba(24,32,25,.12); background:#fff; padding:0; cursor:pointer; transition:.24s; color:var(--demo-ink); overflow:hidden; }
        .listing-card:hover,.listing-card.is-selected { border-color:var(--demo-green); box-shadow:0 16px 35px rgba(24,32,25,.08); transform:translateY(-3px); }
        .listing-art { min-height:180px; display:grid; place-items:center; background:var(--demo-warm); }
        .listing-copy { padding:20px; }
        .eyebrow-row { display:flex; justify-content:space-between; gap:8px; color:var(--demo-green); font-size:9px; font-weight:700; letter-spacing:.1em; text-transform:uppercase; }
        .eyebrow-row span:last-child { color:#987238; text-align:right; }
        .listing-copy h3 { font-family:Georgia,serif; font-size:28px; line-height:.95; margin:16px 0 10px; font-weight:400; letter-spacing:-.045em; }
        .listing-copy p { min-height:58px; font-size:12px; line-height:1.55; color:var(--demo-muted); margin:0; }
        .listing-price { margin-top:17px; padding-top:15px; border-top:1px solid rgba(24,32,25,.1); display:flex; justify-content:space-between; align-items:center; }
        .listing-price strong { font-family:Georgia,serif; font-size:25px; font-weight:400; }.listing-price span { display:flex; gap:6px; align-items:center; font-size:10px; font-weight:700; text-transform:uppercase; letter-spacing:.1em; color:var(--demo-green); }
        .detail-drawer { margin-top:18px; padding:22px; border:1px solid rgba(24,32,25,.12); background:var(--demo-pale); display:grid; grid-template-columns:112px 1fr auto; gap:20px; align-items:center; }
        .detail-drawer h3 { font-family:Georgia,serif; font-size:29px; letter-spacing:-.04em; margin:0 0 7px; font-weight:400; }.detail-drawer p { color:var(--demo-muted); font-size:13px; line-height:1.55; margin:0; }.detail-drawer .demo-button { background:var(--demo-ink); color:#fff; white-space:nowrap; }.detail-drawer .demo-button:hover { background:var(--demo-green); }
        .maker-wrap { margin-top:28px; display:grid; grid-template-columns:235px 1fr; min-height:710px; border:1px solid rgba(24,32,25,.12); background:#fff; }
        .maker-nav { background:var(--demo-ink); color:#F8F6F1; padding:26px 18px; display:flex; flex-direction:column; }.maker-nav h2 { font-family:Georgia,serif; font-size:27px; font-weight:400; margin:8px 0 28px; }.maker-nav .studio-tag { color:#C9A96A; font-size:9px; font-weight:700; letter-spacing:.16em; text-transform:uppercase; }.maker-nav-item { width:100%; border:0; color:rgba(248,246,241,.65); background:transparent; text-align:left; padding:12px 10px; display:flex; align-items:center; gap:10px; cursor:pointer; font-size:12px; }.maker-nav-item.active { background:rgba(255,255,255,.08); color:#fff; }.maker-nav footer { margin-top:auto; color:rgba(248,246,241,.42); font-size:10px; line-height:1.5; }
        .maker-content { padding:34px; background:var(--demo-paper); }.maker-head { display:flex; align-items:end; justify-content:space-between; gap:20px; border-bottom:1px solid rgba(24,32,25,.12); padding-bottom:23px; }.maker-head h1 { font-family:Georgia,serif; font-size:47px; font-weight:400; letter-spacing:-.055em; margin:0; }.maker-head p { margin:8px 0 0; color:var(--demo-muted); font-size:13px; }.maker-status { display:flex; align-items:center; gap:7px; color:var(--demo-green); font-size:10px; font-weight:700; letter-spacing:.12em; text-transform:uppercase; }.maker-status i { width:7px; height:7px; border-radius:50%; background:var(--demo-green); display:inline-block; }
        .maker-grid { display:grid; grid-template-columns:1.05fr .95fr; gap:25px; margin-top:26px; }.maker-card { background:#fff; border:1px solid rgba(24,32,25,.12); padding:23px; }.maker-card h3 { margin:0; font-family:Georgia,serif; font-size:27px; font-weight:400; letter-spacing:-.04em; }.maker-card p { margin:8px 0 18px; color:var(--demo-muted); font-size:12px; line-height:1.55; }.maker-label { display:block; margin:17px 0 7px; color:var(--demo-muted); font-size:9px; font-weight:700; letter-spacing:.12em; text-transform:uppercase; }.maker-input,.maker-textarea { width:100%; border:1px solid rgba(24,32,25,.16); background:var(--demo-paper); padding:11px 12px; font:inherit; font-size:13px; color:var(--demo-ink); outline:none; }.maker-textarea { min-height:98px; resize:vertical; line-height:1.55; }.maker-input:focus,.maker-textarea:focus { border-color:var(--demo-green); box-shadow:0 0 0 3px rgba(72,100,63,.11); }.formula-row { display:grid; grid-template-columns:repeat(3,1fr); gap:7px; }.formula-row button { border:1px solid rgba(24,32,25,.14); background:#fff; padding:10px 7px; cursor:pointer; color:var(--demo-muted); font-size:10px; line-height:1.25; }.formula-row button.active { background:var(--demo-pale); border-color:var(--demo-green); color:var(--demo-ink); }.maker-card .demo-button { margin-top:19px; background:var(--demo-green); color:#fff; }.maker-card .demo-button:hover { background:var(--demo-ink); }
        .blueprint-visual { min-height:350px; display:flex; align-items:center; justify-content:center; background:radial-gradient(circle at center,#F8F6F1 0 37%,#E5E9E0 38% 39%,transparent 40%),#EFF2EB; position:relative; overflow:hidden; }.blueprint-visual::after { content:'0°'; position:absolute; top:16px; left:50%; color:var(--demo-muted); font-family:ui-monospace,monospace; font-size:10px; }.blueprint-note { display:grid; grid-template-columns:repeat(3,1fr); border-top:1px solid rgba(24,32,25,.12); }.blueprint-note div { padding:14px; border-right:1px solid rgba(24,32,25,.12); }.blueprint-note div:last-child { border-right:0; }.blueprint-note strong { display:block; font-family:Georgia,serif; font-size:24px; font-weight:400; color:var(--demo-green); }.blueprint-note span { display:block; margin-top:4px; color:var(--demo-muted); font-size:9px; font-weight:700; letter-spacing:.1em; text-transform:uppercase; }
        .maker-bottom { margin-top:25px; display:grid; grid-template-columns:1fr auto; gap:18px; align-items:center; background:var(--demo-ink); padding:21px 23px; color:#F8F6F1; }.maker-bottom strong { font-family:Georgia,serif; font-size:23px; font-weight:400; }.maker-bottom p { margin:4px 0 0; color:rgba(248,246,241,.6); font-size:12px; }.maker-bottom .demo-button { background:#F8F6F1; color:var(--demo-ink); }.maker-bottom .demo-button:hover { background:#C9A96A; }
        .demo-notice { position:fixed; z-index:40; right:24px; bottom:24px; max-width:380px; background:var(--demo-ink); color:#F8F6F1; padding:15px 17px; box-shadow:0 18px 45px rgba(0,0,0,.25); font-size:13px; line-height:1.5; display:flex; gap:10px; align-items:flex-start; }.demo-notice svg { color:#C9A96A; flex:0 0 auto; margin-top:2px; }
        @media(max-width:900px){ .demo-shell{padding:18px 18px 48px}.demo-nav-right .demo-pill{display:none}.demo-hero{grid-template-columns:1fr}.demo-hero-copy{padding:52px 30px}.demo-hero-art{min-height:290px}.demo-workspace{grid-template-columns:1fr}.demo-side{display:none}.choice-grid,.listing-grid{grid-template-columns:1fr}.detail-drawer,.maker-wrap,.maker-grid{grid-template-columns:1fr}.detail-drawer .listing-art{display:none}.maker-nav{display:none}.maker-content{padding:25px 18px}.maker-bottom{grid-template-columns:1fr}.match-header{display:block}.match-header p{margin-top:11px}.demo-nav button{padding:8px 7px}.demo-nav-right{gap:2px}.formula-row{grid-template-columns:1fr}.demo-hero h1{font-size:56px} }
      `}</style>
      <div className="demo-shell">
        <nav className="demo-nav">
          <div className="demo-brand"><Flower2 size={20} strokeWidth={1.5} /><span>Ever<b>crafted</b></span></div>
          <div className="demo-nav-right">
            <button className={view === 'discover' ? 'active' : ''} onClick={() => setView('discover')}>Moodoor</button>
            <button className={view === 'maker' ? 'active' : ''} onClick={() => setView('maker')}>Maker studio</button>
            <span className="demo-pill"><Compass size={13} /> Visible product demo</span>
          </div>
        </nav>

        {view === 'discover' ? (
          <>
            <section className="demo-hero">
              <div className="demo-hero-copy">
                <div className="demo-overline">Moodoor by Evercrafted</div>
                <h1>Find the wreath that <em>feels</em> like home.</h1>
                <p>Tell us the feeling you want at your threshold. Moodoor shapes a small, considered edit around your mood, season, and door.</p>
                <div className="demo-hero-buttons"><button className="demo-button primary" onClick={() => document.getElementById('moodoor-workspace')?.scrollIntoView({ behavior: 'smooth' })}>Find my wreath <ArrowRight size={14} /></button><button className="demo-button ghost" onClick={() => setView('maker')}>I make wreaths <ChevronRight size={14} /></button></div>
              </div>
              <div className="demo-hero-art"><WreathArt colours={selectedListing.colours} /><span className="art-caption">A considered collection, not an endless marketplace</span></div>
            </section>

            <section className="demo-workspace" id="moodoor-workspace">
              <aside className="demo-side"><div className="demo-overline" style={{ color: 'var(--demo-green)' }}>Your Moodoor edit</div><h2>Three small choices. A more natural fit.</h2><p>There is no catalogue noise here. You begin with the atmosphere you want to create, then meet the pieces that belong there.</p><div className="demo-steps"><div className="demo-step"><b>01</b><div><strong>Choose the feeling</strong>How should your entry feel?</div></div><div className="demo-step"><b>02</b><div><strong>Choose the moment</strong>Seasonal, celebratory, or everyday.</div></div><div className="demo-step"><b>03</b><div><strong>Meet the edit</strong>Available pieces, intentionally short.</div></div></div></aside>
              <div>
                <div className="demo-panel">
                  <div className="choice-block"><div className="choice-label"><b>How should your home feel?</b><span>01 / feeling</span></div><div className="choice-grid">{moodOptions.map((option) => <ChoiceButton key={option.id} selected={mood === option.id} title={option.title} note={option.note} onClick={() => setMood(option.id)} />)}</div></div>
                  <div className="choice-block"><div className="choice-label"><b>What is the moment?</b><span>02 / season</span></div><div className="choice-grid">{seasonOptions.map((option) => <ChoiceButton key={option.id} selected={season === option.id} title={option.title} note={option.note} onClick={() => setSeason(option.id)} />)}</div></div>
                  <div className="choice-block"><div className="choice-label"><b>What kind of door holds it?</b><span>03 / setting</span></div><div className="choice-grid">{doorOptions.map((option) => <ChoiceButton key={option.id} selected={door === option.id} title={option.title} note={option.note} onClick={() => setDoor(option.id)} />)}</div></div>
                </div>
                <div className="match-header"><div><div className="demo-overline" style={{ color: 'var(--demo-green)', marginBottom: 10 }}>Your current edit</div><h2>Pieces that belong.</h2></div><p>Selected for a <strong>{mood}</strong>, <strong>{season}</strong> feeling on a <strong>{door === 'dark' ? 'dark wood' : door}</strong> door.</p></div>
                <div className="listing-grid">{recommendations.map((listing) => <ListingCard key={listing.id} listing={listing} selected={selectedListingId === listing.id} onSelect={() => setSelectedListingId(listing.id)} />)}</div>
                <div className="detail-drawer"><div className="listing-art"><WreathArt compact colours={selectedListing.colours} /></div><div><div className="demo-overline" style={{ color: 'var(--demo-green)' }}>{selectedListing.checkout ? 'Ready to ship' : 'Made in small runs'}</div><h3>{selectedListing.title}</h3><p>{selectedListing.checkout ? 'This piece can move into a secure checkout when your final collection is connected.' : 'This piece begins with a personal availability conversation, so the studio can confirm timing and fit.'}</p></div><button className="demo-button" onClick={() => showNotice(selectedListing.checkout ? 'In the live product, this opens a secure managed checkout. This demo keeps you in the experience.' : 'This starts an availability enquiry in the live product.')}><CircleDollarSign size={15} /> {selectedListing.checkout ? `Purchase $${selectedListing.price}` : 'Request availability'}</button></div>
              </div>
            </section>
          </>
        ) : (
          <section className="maker-wrap">
            <aside className="maker-nav"><div className="studio-tag">Evercrafted / Studio</div><h2>Your design room.</h2><button className="maker-nav-item active"><Sparkles size={15} /> Design brief</button><button className="maker-nav-item"><Leaf size={15} /> Inventory</button><button className="maker-nav-item"><WandSparkles size={15} /> Blueprint</button><button className="maker-nav-item"><Plus size={15} /> Marketplace</button><footer>This is a visible workspace demo. It works without a login so you can evaluate the product before connecting data.</footer></aside>
            <div className="maker-content"><header className="maker-head"><div><div className="demo-overline" style={{ color: 'var(--demo-green)' }}>Maker studio</div><h1>Make the idea buildable.</h1><p>Start with the story. The studio turns it into a visual composition you can refine and release.</p></div><div className="maker-status"><i /> Studio tier</div></header>
              <div className="maker-grid"><section className="maker-card"><h3>1. Shape the brief</h3><p>This is the maker’s starting point: a short, human description—not a technical form.</p><label className="maker-label">Design story</label><textarea className="maker-textarea" value={brief} onChange={(event) => setBrief(event.target.value)} /><label className="maker-label">Composition formula</label><div className="formula-row">{['Crescent sweep', 'Focal trio', 'Full ring'].map((item) => <button key={item} className={formula === item ? 'active' : ''} onClick={() => setFormula(item)} type="button">{item}</button>)}</div><button className="demo-button" onClick={() => { setGenerated(true); setPublished(false); showNotice('Blueprint preview refreshed from your brief.'); }}><WandSparkles size={14} /> Generate visual blueprint</button></section>
                <section className="maker-card"><div className="blueprint-visual"><WreathArt colours={activeMakerColours} /><span style={{ position: 'absolute', right: 17, bottom: 18, fontSize: 10, color: 'var(--demo-muted)', letterSpacing: '.12em', textTransform: 'uppercase' }}>{generated ? 'Blueprint ready' : 'Preview canvas'}</span></div><div className="blueprint-note"><div><strong>{generated ? '0.84' : '—'}</strong><span>quality score</span></div><div><strong>{formula === 'Full ring' ? '54' : formula === 'Focal trio' ? '48' : '46'}</strong><span>stems planned</span></div><div><strong>24″</strong><span>wreath size</span></div></div></section></div>
              <section className="maker-bottom"><div><strong>{published ? 'Ready for your public edit.' : generated ? 'A reviewable design is ready.' : 'Your next design begins with a feeling.'}</strong><p>{published ? 'The demo has moved this wreath into the Moodoor collection.' : generated ? 'Review the preview, then deliberately decide whether it belongs in Moodoor.' : 'Write a short story, choose a composition, and generate a visual preview.'}</p></div><button className="demo-button" onClick={() => { if (!generated) { setGenerated(true); showNotice('The visual blueprint is ready for your review.'); } else { setPublished(true); showNotice('Published to the Moodoor demo collection.'); } }}><LockKeyhole size={14} /> {published ? 'In Moodoor' : generated ? 'Publish to Moodoor' : 'Create blueprint'}</button></section>
            </div>
          </section>
        )}
      </div>
      {notice && <div className="demo-notice"><Sparkles size={17} /> <span>{notice}</span></div>}
    </main>
  );
}
