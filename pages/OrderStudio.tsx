import React, { useEffect, useMemo, useState } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { CheckCircle2, ClipboardList, Download, Leaf, Loader2, Save, Sparkles, TriangleAlert } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import type { Blueprint, InventoryItem, ScoreReport } from '../types';
import { runOrchestrator } from '../services/BlueprintOrchestrator';
import { compileBlueprint } from '../services/orchestration/blueprintCompiler';
import { getInventory } from '../services/firebase/inventoryService';
import { createBlueprintSeed } from '../services/deterministicSeed';
import { createCompositionInput, createWreathDNA, type FormulaTemplate } from '../services/engine/compositionTemplates';
import { createMakerListing, EcosystemApiError, type MakerListingResult } from '../services/ecosystemApiClient';
import { engineToUI, normalizeBlueprint } from '../services/transformer';

const formulaOptions: Array<{ id: FormulaTemplate; label: string; detail: string }> = [
  { id: 'crescent', label: 'Crescent sweep', detail: 'A weighted arc with a protected silence space.' },
  { id: 'focal-trio', label: 'Focal trio', detail: 'Three anchors create a balanced triangular rhythm.' },
  { id: 'full-ring', label: 'Full ring', detail: 'Even seasonal coverage around the entire base.' },
  { id: 'asymmetric-weight', label: 'Asymmetric weight', detail: 'A bold, editorial mass offset by negative space.' },
];

function splitTags(value: string): string[] {
  return [...new Set(value.split(',').map((tag) => tag.trim().toLowerCase()).filter(Boolean))];
}

function roleSummary(blueprint: Blueprint): Array<[string, number]> {
  const counts = (blueprint.elements || []).reduce<Record<string, number>>((summary, element) => {
    summary[element.role] = (summary[element.role] || 0) + 1;
    return summary;
  }, {});
  return ['greenery', 'filler', 'accent', 'secondary', 'focal'].map((role) => [role, counts[role] || 0]);
}

export const OrderStudio: React.FC = () => {
  const { user } = useAuth();
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loadingInventory, setLoadingInventory] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [blueprint, setBlueprint] = useState<Blueprint | null>(null);
  const [report, setReport] = useState<ScoreReport | null>(null);
  const [listing, setListing] = useState<MakerListingResult | null>(null);

  const [title, setTitle] = useState('Quiet Winter Welcome');
  const [brief, setBrief] = useState('A calm, warm evergreen wreath with measured rhythm for a dark wood entry.');
  const [formula, setFormula] = useState<FormulaTemplate>('crescent');
  const [diameter, setDiameter] = useState(24);
  const [density, setDensity] = useState<'airy' | 'balanced' | 'full'>('full');
  const [price, setPrice] = useState('148');
  const [availability, setAvailability] = useState<'in_stock' | 'limited'>('in_stock');
  const [marketplaceStatus, setMarketplaceStatus] = useState<'draft' | 'published'>('draft');
  const [moodTags, setMoodTags] = useState('calm, warm, natural');
  const [seasonTags, setSeasonTags] = useState('winter');
  const [paletteTags, setPaletteTags] = useState('evergreen, ivory, golden');
  const [heroImageUrl, setHeroImageUrl] = useState('');
  const [commerceMode, setCommerceMode] = useState<'enquiry' | 'direct_checkout'>('enquiry');
  const [shopifyVariantId, setShopifyVariantId] = useState('');

  useEffect(() => {
    async function loadInventory(): Promise<void> {
      if (!user) {
        setInventory([]);
        setLoadingInventory(false);
        return;
      }
      try {
        setLoadingInventory(true);
        setInventory(await getInventory(user.uid));
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : 'Inventory could not be loaded.');
      } finally {
        setLoadingInventory(false);
      }
    }
    void loadInventory();
  }, [user]);

  const qualityScore = report ? report.total / 100 : null;
  const canPublish = report?.status === 'PASS' && (qualityScore || 0) >= 0.78;
  const selectedFormula = formulaOptions.find((option) => option.id === formula);
  const previewSeed = useMemo(() => createBlueprintSeed(`${title} ${brief}`, inventory, formula), [title, brief, inventory, formula]);

  async function generateBlueprint(): Promise<void> {
    if (!user) {
      setError('Sign in to generate a blueprint.');
      return;
    }
    if (!title.trim() || !brief.trim()) {
      setError('Add a design title and a short emotional brief before generating.');
      return;
    }

    setGenerating(true);
    setError(null);
    setListing(null);
    try {
      const seed = createBlueprintSeed(`${title} ${brief}`, inventory, formula);
      const compositionBrief = {
        title: title.trim(),
        intention: brief.trim(),
        formula,
        diameter,
        palette: splitTags(paletteTags),
        density,
        seed,
      };
      const raw = createCompositionInput(compositionBrief);
      const dna = createWreathDNA(compositionBrief);
      const compiled = compileBlueprint(raw, formula, dna, diameter, inventory);
      const result = await runOrchestrator(compiled, raw.emotion_profile);
      setBlueprint(result.blueprint);
      setReport(result.report);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'The blueprint could not be generated.');
    } finally {
      setGenerating(false);
    }
  }

  async function saveListing(): Promise<void> {
    if (!blueprint || !report) {
      setError('Generate and review a blueprint before saving a marketplace listing.');
      return;
    }
    if (commerceMode === 'direct_checkout' && !shopifyVariantId.trim()) {
      setError('Add the managed-commerce variant ID before enabling direct checkout.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const result = await createMakerListing({
        blueprint,
        public: {
          title: title.trim(),
          summary: brief.trim(),
          heroImageUrl: heroImageUrl.trim() || null,
          price: price.trim() === '' ? null : Number(price),
          moodTags: splitTags(moodTags),
          seasonTags: splitTags(seasonTags),
          paletteTags: splitTags(paletteTags),
          formula,
        },
        availability,
        marketplaceStatus,
        commerce: commerceMode === 'direct_checkout'
          ? { mode: 'direct_checkout', provider: 'shopify', variantId: shopifyVariantId.trim() }
          : { mode: 'enquiry', provider: null, variantId: null },
      });
      setListing(result);
      setMarketplaceStatus(result.marketplaceStatus);
    } catch (caught) {
      if (caught instanceof EcosystemApiError) {
        setError(caught.message);
      } else {
        setError(caught instanceof Error ? caught.message : 'The marketplace listing could not be saved.');
      }
    } finally {
      setSaving(false);
    }
  }

  function downloadBuilderGuide(): void {
    if (!blueprint || !report) return;
    const pdf = new jsPDF();
    pdf.setFontSize(20);
    pdf.text(title, 14, 18);
    pdf.setFontSize(11);
    pdf.text(`Formula: ${formula}  •  Seed: ${blueprint.seed}`, 14, 28);
    pdf.text(`Quality: ${(report.total / 100).toFixed(2)} (${report.status})`, 14, 35);
    pdf.text(`Builder sequence: 1) greenery skeleton  2) focal blooms  3) secondary clusters  4) accents  5) filler`, 14, 44, { maxWidth: 180 });

    const rawElements = blueprint.blueprint || (blueprint.elements ? blueprint.elements.map(engineToUI) : []);
    const elements = normalizeBlueprint(rawElements);
    autoTable(pdf, {
      head: [['Element', 'Role', 'Polar placement']],
      body: elements.map((item: any) => [item.element, item.category, `${item.angle_deg || 0}°`]),
      startY: 55,
      styles: { fontSize: 8 },
    });
    pdf.save(`${title.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-') || 'evercrafted-blueprint'}-builder-guide.pdf`);
  }

  return (
    <main className="min-h-screen bg-[#F9F7F4] px-5 py-8 text-[#1A1A1A] sm:px-8 lg:px-12">
      <div className="mx-auto max-w-7xl">
        <header className="border-b border-[#1A1A1A]/10 pb-8">
          <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-[#4A6741]">Studio workflow / deterministic composition</p>
          <div className="mt-4 flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
            <div>
              <h1 className="font-serif text-5xl font-light leading-[0.92] tracking-tight sm:text-6xl">From a feeling<br /><em className="text-[#4A6741]">to a buildable wreath.</em></h1>
              <p className="mt-5 max-w-2xl text-base leading-7 text-[#5B5B5B]">Create a seeded composition, inspect the quality gate, export the builder guide, then save a structured marketplace record that can be deliberately released to Moodoor.</p>
            </div>
            <div className="border border-[#1A1A1A]/10 bg-white px-5 py-4 text-right">
              <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#777]">Inventory signature</p>
              <p className="mt-1 font-serif text-2xl text-[#4A6741]">{loadingInventory ? 'Loading…' : `${inventory.length} materials`}</p>
            </div>
          </div>
        </header>

        <div className="grid gap-10 py-10 lg:grid-cols-[0.9fr_1.1fr]">
          <section className="space-y-7">
            <div className="border border-[#1A1A1A]/10 bg-white p-6 sm:p-8">
              <div className="flex items-center gap-3"><Leaf size={18} className="text-[#4A6741]" /><p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#4A6741]">01 / Design brief</p></div>
              <label className="mt-6 block text-sm font-medium">Design title<input value={title} onChange={(event) => setTitle(event.target.value)} className="mt-2 w-full border border-[#1A1A1A]/15 bg-[#F9F7F4] px-4 py-3 text-base outline-none focus:border-[#4A6741]" /></label>
              <label className="mt-5 block text-sm font-medium">Emotional brief<textarea value={brief} onChange={(event) => setBrief(event.target.value)} rows={4} className="mt-2 w-full resize-none border border-[#1A1A1A]/15 bg-[#F9F7F4] px-4 py-3 text-base leading-6 outline-none focus:border-[#4A6741]" /></label>
              <p className="mt-3 font-mono text-[10px] leading-5 text-[#777]">Seed preview: {previewSeed}</p>
            </div>

            <div className="border border-[#1A1A1A]/10 bg-white p-6 sm:p-8">
              <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#4A6741]">02 / Formula and density</p>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {formulaOptions.map((option) => <button key={option.id} type="button" onClick={() => setFormula(option.id)} className={`border p-4 text-left ${formula === option.id ? 'border-[#4A6741] bg-[#EEF2ED]' : 'border-[#1A1A1A]/10 bg-white hover:border-[#4A6741]/50'}`}><span className="block font-serif text-xl">{option.label}</span><span className="mt-1 block text-xs leading-5 text-[#666]">{option.detail}</span></button>)}
              </div>
              <div className="mt-6 grid gap-5 sm:grid-cols-2">
                <label className="block text-sm font-medium">Wreath diameter<select value={diameter} onChange={(event) => setDiameter(Number(event.target.value))} className="mt-2 w-full border border-[#1A1A1A]/15 bg-[#F9F7F4] px-3 py-3"><option value={18}>18 inches</option><option value={24}>24 inches</option></select></label>
                <label className="block text-sm font-medium">Density<select value={density} onChange={(event) => setDensity(event.target.value as 'airy' | 'balanced' | 'full')} className="mt-2 w-full border border-[#1A1A1A]/15 bg-[#F9F7F4] px-3 py-3"><option value="airy">Airy</option><option value="balanced">Balanced</option><option value="full">Full</option></select></label>
              </div>
              <button type="button" onClick={() => void generateBlueprint()} disabled={generating || loadingInventory} className="mt-7 inline-flex w-full items-center justify-center gap-2 bg-[#1A1A1A] px-5 py-4 text-[11px] font-bold uppercase tracking-[0.14em] text-white disabled:cursor-not-allowed disabled:opacity-50">{generating ? <><Loader2 size={15} className="animate-spin" /> Generating composition…</> : <><Sparkles size={15} /> Generate seeded blueprint</>}</button>
            </div>
          </section>

          <section className="space-y-7">
            <div className="border border-[#1A1A1A]/10 bg-[#1A1A1A] p-6 text-[#F9F7F4] sm:p-8">
              <div className="flex items-center justify-between gap-4"><p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#D4A96A]">03 / Quality gate</p>{report?.status === 'PASS' ? <CheckCircle2 size={22} className="text-[#95B68C]" /> : <TriangleAlert size={22} className="text-[#D4A96A]" />}</div>
              {report ? <><div className="mt-8 flex items-end justify-between"><div><p className="font-serif text-6xl font-light">{(report.total / 100).toFixed(2)}</p><p className="mt-2 text-sm text-white/55">Overall composition score</p></div><div className={`border px-3 py-2 font-mono text-[10px] uppercase tracking-[0.12em] ${report.status === 'PASS' ? 'border-[#95B68C]/60 text-[#95B68C]' : 'border-[#D4A96A]/60 text-[#D4A96A]'}`}>{report.status === 'PASS' ? 'Approved for publication' : 'Repair required'}</div></div><div className="mt-8 grid grid-cols-2 gap-px bg-white/10"><div className="bg-[#1A1A1A] p-4"><p className="font-mono text-[10px] uppercase tracking-[0.12em] text-white/45">Formula</p><p className="mt-2 font-serif text-2xl">{selectedFormula?.label}</p></div><div className="bg-[#1A1A1A] p-4"><p className="font-mono text-[10px] uppercase tracking-[0.12em] text-white/45">Placements</p><p className="mt-2 font-serif text-2xl">{blueprint?.elements.length || 0}</p></div></div></> : <div className="mt-8 border border-dashed border-white/20 p-8 text-center"><ClipboardList className="mx-auto text-[#D4A96A]" size={30} /><p className="mt-4 font-serif text-3xl font-light">Your quality report will appear here.</p><p className="mx-auto mt-3 max-w-md text-sm leading-6 text-white/55">Generation applies formula clusters, seeded polar placements, collision handling, and the scoring gate.</p></div>}
            </div>

            {blueprint && report && <div className="border border-[#1A1A1A]/10 bg-white p-6 sm:p-8"><div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start"><div><p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#4A6741]">04 / Builder handoff</p><h2 className="mt-2 font-serif text-4xl font-light">A repeatable recipe.</h2></div><button type="button" onClick={downloadBuilderGuide} className="inline-flex items-center gap-2 border border-[#1A1A1A]/20 px-4 py-3 text-[10px] font-bold uppercase tracking-[0.13em] hover:border-[#4A6741] hover:text-[#4A6741]"><Download size={14} /> Builder guide</button></div><div className="mt-6 grid grid-cols-5 divide-x divide-[#1A1A1A]/10 border-y border-[#1A1A1A]/10"><>{roleSummary(blueprint).map(([role, count]) => <div key={role} className="p-3 text-center"><p className="font-serif text-2xl text-[#4A6741]">{count}</p><p className="mt-1 font-mono text-[9px] uppercase tracking-[0.1em] text-[#777]">{role}</p></div>)}</></div>{report.warnings.length > 0 && <div className="mt-6 border-l-2 border-[#C4922A] bg-[#FCF8ED] px-4 py-3 text-sm leading-6 text-[#6D5A24]">{report.warnings.join(' ')}</div>}</div>}

            {blueprint && report && <div className="border border-[#1A1A1A]/10 bg-white p-6 sm:p-8"><p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#4A6741]">05 / Marketplace record</p><p className="mt-2 text-sm leading-6 text-[#666]">Save the private canonical listing first. Only approved, available, published listings may later be released to Moodoor.</p><div className="mt-6 grid gap-5 sm:grid-cols-2"><label className="block text-sm font-medium">Price (USD)<input value={price} inputMode="decimal" onChange={(event) => setPrice(event.target.value)} className="mt-2 w-full border border-[#1A1A1A]/15 bg-[#F9F7F4] px-3 py-3" /></label><label className="block text-sm font-medium">Availability<select value={availability} onChange={(event) => setAvailability(event.target.value as 'in_stock' | 'limited')} className="mt-2 w-full border border-[#1A1A1A]/15 bg-[#F9F7F4] px-3 py-3"><option value="in_stock">In stock</option><option value="limited">Limited</option></select></label><label className="block text-sm font-medium sm:col-span-2">Approved image URL <span className="font-normal text-[#777]">(optional)</span><input value={heroImageUrl} onChange={(event) => setHeroImageUrl(event.target.value)} placeholder="https://…" className="mt-2 w-full border border-[#1A1A1A]/15 bg-[#F9F7F4] px-3 py-3" /></label></div><div className="mt-6 border-y border-[#1A1A1A]/10 py-5"><p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#4A6741]">Customer purchase path</p><div className="mt-4 grid gap-3 sm:grid-cols-2"><button type="button" onClick={() => setCommerceMode('enquiry')} className={`border p-4 text-left ${commerceMode === 'enquiry' ? 'border-[#4A6741] bg-[#EEF2ED]' : 'border-[#1A1A1A]/15'}`}><span className="block font-serif text-2xl">Enquiry first</span><span className="mt-1 block text-xs leading-5 text-[#666]">Keep the personal availability conversation for bespoke or limited designs.</span></button><button type="button" onClick={() => setCommerceMode('direct_checkout')} className={`border p-4 text-left ${commerceMode === 'direct_checkout' ? 'border-[#4A6741] bg-[#EEF2ED]' : 'border-[#1A1A1A]/15'}`}><span className="block font-serif text-2xl">Direct checkout</span><span className="mt-1 block text-xs leading-5 text-[#666]">Route ready-to-ship designs through managed checkout and fulfilment.</span></button></div>{commerceMode === 'direct_checkout' && <label className="mt-5 block text-sm font-medium">Shopify product variant ID <span className="font-normal text-[#777]">(private)</span><input value={shopifyVariantId} onChange={(event) => setShopifyVariantId(event.target.value)} placeholder="gid://shopify/ProductVariant/…" className="mt-2 w-full border border-[#1A1A1A]/15 bg-[#F9F7F4] px-3 py-3" /><span className="mt-2 block text-xs leading-5 text-[#777]">This private identifier is used only by the checkout service and never appears on customer pages.</span></label>}</div><div className="mt-6 grid gap-5 sm:grid-cols-2"><label className="block text-sm font-medium">Mood tags<input value={moodTags} onChange={(event) => setMoodTags(event.target.value)} className="mt-2 w-full border border-[#1A1A1A]/15 bg-[#F9F7F4] px-3 py-3" /></label><label className="block text-sm font-medium">Season tags<input value={seasonTags} onChange={(event) => setSeasonTags(event.target.value)} className="mt-2 w-full border border-[#1A1A1A]/15 bg-[#F9F7F4] px-3 py-3" /></label><label className="block text-sm font-medium sm:col-span-2">Palette tags<input value={paletteTags} onChange={(event) => setPaletteTags(event.target.value)} className="mt-2 w-full border border-[#1A1A1A]/15 bg-[#F9F7F4] px-3 py-3" /></label></div><div className="mt-6 flex flex-col gap-3 sm:flex-row"><button type="button" onClick={() => setMarketplaceStatus('draft')} className={`flex-1 border px-4 py-3 text-[11px] font-bold uppercase tracking-[0.13em] ${marketplaceStatus === 'draft' ? 'border-[#4A6741] bg-[#EEF2ED] text-[#355132]' : 'border-[#1A1A1A]/15'}`}>Save as draft</button><button type="button" onClick={() => setMarketplaceStatus('published')} disabled={!canPublish} title={canPublish ? 'Publish an approved design' : 'The quality gate must pass before marketplace publication'} className={`flex-1 border px-4 py-3 text-[11px] font-bold uppercase tracking-[0.13em] disabled:cursor-not-allowed disabled:opacity-40 ${marketplaceStatus === 'published' ? 'border-[#1A1A1A] bg-[#1A1A1A] text-white' : 'border-[#1A1A1A]/15'}`}>Publish to marketplace</button></div><button type="button" onClick={() => void saveListing()} disabled={saving} className="mt-4 inline-flex w-full items-center justify-center gap-2 bg-[#4A6741] px-5 py-4 text-[11px] font-bold uppercase tracking-[0.14em] text-white disabled:cursor-not-allowed disabled:opacity-50">{saving ? <><Loader2 size={15} className="animate-spin" /> Saving canonical record…</> : <><Save size={15} /> Save marketplace record</>}</button>{listing && <div className={`mt-5 border px-4 py-4 text-sm leading-6 ${listing.marketplaceStatus === 'published' ? 'border-[#4A6741]/30 bg-[#EEF2ED] text-[#355132]' : 'border-[#C4922A]/30 bg-[#FCF8ED] text-[#6D5A24]'}`}>{listing.marketplaceStatus === 'published' ? 'Marketplace listing saved and approved. Open Moodoor Studio when you are ready to deliberately release it to customers.' : 'The canonical listing was saved as a draft. Resolve the quality review before requesting marketplace publication.'}</div>}</div>}
          </section>
        </div>

        {error && <div role="alert" className="fixed bottom-6 right-6 max-w-md border border-[#B94040]/30 bg-[#FFF5F4] px-5 py-4 text-sm leading-6 text-[#8A2F2F] shadow-lg">{error}</div>}
      </div>
    </main>
  );
};
