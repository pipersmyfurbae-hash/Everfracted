import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import multer from "multer";
import bcrypt from "bcryptjs";
import { supabase } from "./supabase.js";

dotenv.config();

const app = express();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024 }
});

const PORT = process.env.PORT || 8787;
const BUCKET = process.env.SUPABASE_STORAGE_BUCKET || "uploads";

app.use(cors({ origin: true }));
app.use(express.json({ limit: "2mb" }));

const FORMULAS = [
  { name: "Crescent", desc: "Asymmetric arc following the lower curve of the wreath. Defines a clear negative arc at top.", style: "Organic", focal: "Low", density: "Medium", dna: ["asymmetry", "low focal", "negative space arc"] },
  { name: "Double Echo", desc: "Two mirrored clusters radiating from opposite quadrants, creating visual resonance.", style: "Structured", focal: "Dual", density: "High", dna: ["bilateral rhythm", "echo clustering", "weighted symmetry"] },
  { name: "Bottom Heavy", desc: "Mass concentrated below the center line. Strong grounded visual weight.", style: "Grounded", focal: "Bottom", density: "High", dna: ["gravity pull", "base anchoring", "open crown"] },
  { name: "Side Sweep", desc: "Directional movement across one axis. Trailing greenery extends beyond the base form.", style: "Dynamic", focal: "Side", density: "Medium", dna: ["directional flow", "trailing gesture", "single axis"] },
  { name: "Open Arc", desc: "Structured arc with intentional silence at the opening. Edited, architectural.", style: "Editorial", focal: "Center", density: "Low", dna: ["silence arc", "architectural restraint", "open negative"] },
  { name: "Full Halo", desc: "Even distribution of mass around the entire form. Complete circle expression.", style: "Classic", focal: "Radial", density: "Full", dna: ["full coverage", "radial balance", "uniform rhythm"] },
  { name: "Split Garden", desc: "Two distinct material sections divided by a silence zone. Botanical contrast.", style: "Botanical", focal: "Split", density: "High", dna: ["zone division", "material contrast", "mid silence"] },
  { name: "Focal Burst", desc: "Single explosive focal point radiating outward from a defined center.", style: "Dramatic", focal: "Single", density: "High", dna: ["radial burst", "focal dominance", "outward energy"] },
  { name: "Laddered Rhythm", desc: "Sequential staggered placements creating visual cadence along one quadrant.", style: "Rhythmic", focal: "Staggered", density: "Medium", dna: ["sequential beat", "stagger depth", "linear cadence"] },
  { name: "Radial Burst", desc: "Geometric radiating stems from center. Mathematical, structured, precise.", style: "Geometric", focal: "Center", density: "Medium", dna: ["polar geometry", "equal radius", "angular precision"] },
  { name: "Bow Anchor", desc: "Ribbon or bow element serves as primary structural anchor at base or focal point.", style: "Decorative", focal: "Bow", density: "Medium", dna: ["bow anchor", "ribbon vector", "accent frame"] },
  { name: "Inventory Salvage", desc: "Adaptive composition optimized for available materials. Flexible formula, no waste.", style: "Adaptive", focal: "Variable", density: "Variable", dna: ["inventory-fit", "substitution logic", "adaptive layout"] }
];

const DNA_PROFILES = [
  { name: "Crescent Classic", formula: "Crescent", genes: { cluster_count: 0.45, cluster_weight: 0.7, cluster_spread: 0.5, density: 0.55, greenery_ratio: 0.4, focal_ratio: 0.2, silence_arc: 0.65, focal_depth: 0.45, silhouette_bias: -0.3, color_bias: 0.2, symmetry: 0.2, accent: 0.3 }, boundary: ["asymmetry", "negative-space", "low-focal"] },
  { name: "Halo Luxe", formula: "Full Halo", genes: { cluster_count: 0.9, cluster_weight: 0.5, cluster_spread: 0.9, density: 0.9, greenery_ratio: 0.5, focal_ratio: 0.25, silence_arc: 0.05, focal_depth: 0.6, silhouette_bias: 0, color_bias: 0.1, symmetry: 0.9, accent: 0.5 }, boundary: ["full-coverage", "radial-balance"] },
  { name: "Focal Burst Drama", formula: "Focal Burst", genes: { cluster_count: 0.3, cluster_weight: 0.9, cluster_spread: 0.2, density: 0.8, greenery_ratio: 0.25, focal_ratio: 0.4, silence_arc: 0.1, focal_depth: 0.9, silhouette_bias: 0.1, color_bias: -0.2, symmetry: 0.1, accent: 0.9 }, boundary: ["radial-burst", "focal-dominance"] },
  { name: "Woodland Sweep", formula: "Side Sweep", genes: { cluster_count: 0.5, cluster_weight: 0.6, cluster_spread: 0.55, density: 0.5, greenery_ratio: 0.7, focal_ratio: 0.15, silence_arc: 0.3, focal_depth: 0.3, silhouette_bias: 0.4, color_bias: -0.3, symmetry: 0.2, accent: 0.25 }, boundary: ["directional-flow", "trailing"] }
];

const INVENTORY_DATA = [
  { name: "Ivory Garden Rose", role: "focal", color: "Ivory / Cream", stock: 12, max: 24, formulas: ["Full Halo", "Crescent", "Focal Burst"], emotion: "Cozy & Calm", compat: "high" },
  { name: "Dusty Mauve Peony", role: "focal", color: "Mauve / Blush", stock: 6, max: 24, formulas: ["Crescent", "Double Echo", "Side Sweep"], emotion: "Vintage Melancholy", compat: "high" },
  { name: "Dried Wheat Bundle", role: "supporting", color: "Tan / Amber", stock: 34, max: 60, formulas: ["Bottom Heavy", "Crescent", "Inventory Salvage"], emotion: "Cozy & Calm", compat: "med" },
  { name: "Burgundy Ranunculus", role: "focal", color: "Burgundy / Wine", stock: 3, max: 24, formulas: ["Focal Burst", "Double Echo"], emotion: "Dramatic Tension", compat: "low" },
  { name: "Silver Dollar Eucalyptus", role: "greenery", color: "Silver / Green", stock: 48, max: 80, formulas: ["All"], emotion: "All", compat: "high" },
  { name: "Bleached Lunaria", role: "filler", color: "White / Silver", stock: 28, max: 50, formulas: ["Open Arc", "Crescent", "Side Sweep"], emotion: "Vintage Melancholy", compat: "high" },
  { name: "Rust Anemone", role: "supporting", color: "Rust / Orange", stock: 18, max: 40, formulas: ["Full Halo", "Focal Burst", "Radial Burst"], emotion: "Festive & Bright", compat: "high" },
  { name: "Navy Thistle", role: "supporting", color: "Navy / Indigo", stock: 9, max: 40, formulas: ["Split Garden", "Open Arc"], emotion: "Dramatic Tension", compat: "med" },
  { name: "Sage & Thyme Bundle", role: "greenery", color: "Green / Grey", stock: 55, max: 80, formulas: ["All"], emotion: "All", compat: "high" },
  { name: "Champagne Amaranthus", role: "filler", color: "Champagne", stock: 22, max: 50, formulas: ["Crescent", "Full Halo", "Double Echo"], emotion: "Cozy & Calm", compat: "high" },
  { name: "Terracotta Berry Spray", role: "filler", color: "Terracotta / Red", stock: 31, max: 60, formulas: ["Bottom Heavy", "Laddered Rhythm"], emotion: "Festive & Bright", compat: "med" },
  { name: "Black Protea", role: "focal", color: "Black / Dark", stock: 2, max: 16, formulas: ["Focal Burst", "Open Arc"], emotion: "Dramatic Tension", compat: "low" },
  { name: "Cotton Stem", role: "filler", color: "White / Natural", stock: 44, max: 60, formulas: ["Bottom Heavy", "Full Halo", "Inventory Salvage"], emotion: "Cozy & Calm", compat: "high" },
  { name: "Lavender Bunch", role: "greenery", color: "Lavender / Purple", stock: 38, max: 80, formulas: ["Crescent", "Side Sweep", "Full Halo"], emotion: "Vintage Melancholy", compat: "high" },
  { name: "Golden Banksia", role: "supporting", color: "Gold / Amber", stock: 7, max: 30, formulas: ["Focal Burst", "Radial Burst", "Bottom Heavy"], emotion: "Festive & Bright", compat: "med" }
];

function seedFromString(input) {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h += (h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24);
  }
  return h >>> 0;
}

function makeRng(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

function rnd(rng, min, max, dp = 2) {
  const val = rng() * (max - min) + min;
  return parseFloat(val.toFixed(dp));
}

function deriveEmotion(valence, arousal) {
  let quad = "Cozy & Calm";
  let design = "Warm muted tones · soft textures · generous negative space · low focal depth · organic asymmetry";
  let valenceTxt = "Positive";
  let arousalTxt = "Calm";

  if (valence > 0 && arousal > 0) {
    quad = "Festive & Bright";
    design = "High saturation palette · dense floral mass · accent-forward · asymmetric burst energy · warm contrast";
    valenceTxt = "Positive";
    arousalTxt = "Energized";
  } else if (valence < 0 && arousal > 0) {
    quad = "Dramatic Tension";
    design = "Deep contrast palette · rough textures · sparse silence arcs · bold single focal · sharp material edges";
    valenceTxt = "Negative";
    arousalTxt = "Energized";
  } else if (valence < 0 && arousal < 0) {
    quad = "Vintage Melancholy";
    design = "Desaturated dusty palette · heavy greenery ratio · low accent intensity · downward visual weight · silence arcs";
    valenceTxt = "Negative";
    arousalTxt = "Subdued";
  }

  return { quadrant: quad, design, valence_label: valenceTxt, arousal_label: arousalTxt };
}

function buildBlueprint({ formula, emotion, style, seedKey }) {
  const chosenFormula = formula || "Crescent";
  const chosenEmotion = emotion || "Cozy & Calm";
  const chosenStyle = style || "Organic Drape";
  const seed = seedFromString(seedKey || `${chosenFormula}|${chosenEmotion}|${chosenStyle}`);
  const rng = makeRng(seed);
  const id = `EC-${seed.toString(36).toUpperCase().slice(0, 6)}`;

  const dna = {
    cluster_count: Math.floor(rnd(rng, 3, 9, 0)),
    cluster_weight_distribution: rnd(rng, 0.3, 0.9),
    cluster_spread_deg: Math.floor(rnd(rng, 20, 120, 0)),
    density_profile: rnd(rng, 0.3, 1.0),
    greenery_direction: rnd(rng, -1, 1),
    silhouette_bias: rnd(rng, -0.5, 0.5),
    greenery_ratio: rnd(rng, 0.3, 0.7),
    focal_ratio: rnd(rng, 0.1, 0.4),
    silence_arc: rnd(rng, 0, 90, 0),
    focal_depth: rnd(rng, 0.2, 0.8),
    style_signature: chosenStyle,
    color_bias: rnd(rng, -0.5, 0.5)
  };

  const emotionMap = {
    "Cozy & Calm": { valence: rnd(rng, 0.1, 0.9), arousal: rnd(rng, -0.9, -0.1) },
    "Festive & Bright": { valence: rnd(rng, 0.1, 0.9), arousal: rnd(rng, 0.1, 0.9) },
    "Dramatic Tension": { valence: rnd(rng, -0.9, -0.1), arousal: rnd(rng, 0.1, 0.9) },
    "Vintage Melancholy": { valence: rnd(rng, -0.9, -0.1), arousal: rnd(rng, -0.9, -0.1) }
  };
  const emo = emotionMap[chosenEmotion] || { valence: 0, arousal: 0 };

  return {
    blueprint_id: id,
    base: {
      form: "circular",
      diameter_inches: [18, 20, 24][Math.floor(rnd(rng, 0, 2.99, 0))],
      frame_type: "wire_wreath_frame"
    },
    composition: {
      formula: chosenFormula,
      formula_index: FORMULAS.findIndex((f) => f.name === chosenFormula) + 1,
      zone_count: dna.cluster_count
    },
    dna,
    emotion_space: {
      valence: emo.valence,
      arousal: emo.arousal,
      quadrant_label: chosenEmotion,
      palette_bias: emo.valence > 0 ? "warm" : "cool",
      saturation_bias: Math.abs(emo.arousal).toFixed(2)
    },
    zones: Array.from({ length: dna.cluster_count }, (_, i) => ({
      zone_id: `Z${i + 1}`,
      angle_start: Math.floor((i / dna.cluster_count) * 360),
      angle_end: Math.floor(((i + 1) / dna.cluster_count) * 360),
      weight: rnd(rng, 0.05, 0.35),
      type: i === 0 ? "focal" : i % 3 === 0 ? "silence" : "fill"
    })),
    anchors: [
      { anchor_id: "A1", angle: 0, radius: 1.0, role: "focal_primary" },
      { anchor_id: "A2", angle: 180, radius: 0.85, role: "focal_secondary" }
    ],
    elements: [
      { role: "focal", count: Math.floor(rnd(rng, 1, 4, 0)), tier: "T1" },
      { role: "supporting", count: Math.floor(rnd(rng, 4, 10, 0)), tier: "T2" },
      { role: "filler", count: Math.floor(rnd(rng, 8, 20, 0)), tier: "T3" },
      { role: "greenery", count: Math.floor(rnd(rng, 12, 30, 0)), tier: "base" }
    ],
    scores: {
      emotion_fit: rnd(rng, 0.7, 0.99),
      dna_cohesion: rnd(rng, 0.75, 0.99),
      brand_alignment: rnd(rng, 0.8, 0.99),
      ec_certified: true
    },
    versioning: {
      schema: "EC_CANON_V1",
      generated: new Date().toISOString(),
      formula_engine: "deterministic_v1",
      cert: "EC_CERT_MFGSAFE_V1"
    }
  };
}

function makeCode(prefix = "EC") {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let out = `${prefix}-`;
  for (let i = 0; i < 6; i += 1) {
    out += chars[Math.floor(Math.random() * chars.length)];
  }
  return out;
}

function analyzeMemory({ memory, occasion, color_pref, size }) {
  const text = String(memory || "").toLowerCase();
  const positives = ["warm", "bright", "golden", "gentle", "joy", "celebration", "festive", "love", "light"];
  const negatives = ["melancholy", "quiet", "somber", "grief", "loss", "memorial", "shadow", "dark"];
  const highArousal = ["vibrant", "bold", "energized", "dynamic", "bright", "festive"];
  const lowArousal = ["calm", "quiet", "soft", "subtle", "still", "hushed"];

  let valence = 0;
  let arousal = 0;
  positives.forEach((w) => { if (text.includes(w)) valence += 0.15; });
  negatives.forEach((w) => { if (text.includes(w)) valence -= 0.15; });
  highArousal.forEach((w) => { if (text.includes(w)) arousal += 0.15; });
  lowArousal.forEach((w) => { if (text.includes(w)) arousal -= 0.15; });

  if (occasion && String(occasion).toLowerCase().includes("memorial")) valence -= 0.2;
  if (occasion && String(occasion).toLowerCase().includes("holiday")) arousal += 0.2;

  valence = Math.max(-1, Math.min(1, valence || 0.2));
  arousal = Math.max(-1, Math.min(1, arousal || -0.1));

  const quadrant = deriveEmotion(valence, arousal).quadrant;
  const formulaByQuadrant = {
    "Cozy & Calm": "Bottom Heavy",
    "Festive & Bright": "Full Halo",
    "Dramatic Tension": "Focal Burst",
    "Vintage Melancholy": "Crescent"
  };
  const formula = formulaByQuadrant[quadrant] || "Crescent";

  const emotional_tone = quadrant === "Cozy & Calm" ? "soft, grounded, intimate"
    : quadrant === "Festive & Bright" ? "luminous, energetic, celebratory"
    : quadrant === "Dramatic Tension" ? "architectural, moody, sculptural"
    : "muted, nostalgic, tender";

  const palette_direction = (color_pref && String(color_pref).trim()) || (valence > 0 ? "warm" : "cool");
  const density = arousal > 0.3 ? "high" : arousal < -0.3 ? "low" : "medium";
  const silence_arc_deg = Math.round(Math.abs(arousal) * 60);

  const blueprint = buildBlueprint({
    formula,
    emotion: quadrant,
    style: "Organic Drape",
    seedKey: `${memory || ""}|${occasion || ""}|${color_pref || ""}|${size || ""}`
  });

  const interpretation = `We translated your memory into a ${quadrant} emotional profile and anchored it with the ${formula} composition. The DNA leans toward ${density} density with a ${silence_arc_deg}° silence arc, balancing presence with restraint. This preserves the feeling you described while keeping the structure precise and production-ready.`;

  return {
    emotion: {
      valence,
      arousal,
      quadrant,
      formula,
      emotional_tone,
      palette_direction,
      density,
      silence_arc_deg
    },
    blueprint,
    interpretation
  };
}

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

app.get("/formulas", (_req, res) => {
  res.json({ ok: true, formulas: FORMULAS });
});

app.get("/formulas/:name", (req, res) => {
  const name = String(req.params.name || "").toLowerCase();
  const formula = FORMULAS.find((f) => f.name.toLowerCase() === name);
  if (!formula) {
    return res.status(404).json({ error: "Formula not found" });
  }
  return res.json({ ok: true, formula });
});

app.get("/dna-profiles", (_req, res) => {
  res.json({ ok: true, profiles: DNA_PROFILES });
});

app.get("/inventory", (_req, res) => {
  res.json({ ok: true, items: INVENTORY_DATA });
});

app.get("/emotion/map", (req, res) => {
  const valence = parseFloat(req.query.valence);
  const arousal = parseFloat(req.query.arousal);
  if (Number.isNaN(valence) || Number.isNaN(arousal)) {
    return res.status(400).json({ error: "Invalid valence/arousal" });
  }

  const sat = Math.max(0, Math.min(1, (valence + 1) / 2 * 0.6 + (arousal + 1) / 2 * 0.4));
  const den = Math.max(0, Math.min(1, (arousal + 1) / 2 * 0.7 + 0.15));
  const con = Math.max(0, Math.min(1, Math.abs(valence) * 0.5 + Math.abs(arousal) * 0.5));
  const sym = Math.max(0, Math.min(1, 1 - Math.abs(valence) * 0.4 - Math.abs(arousal) * 0.2));
  const acc = Math.max(0, Math.min(1, (arousal + 1) / 2 * 0.6 + Math.abs(valence) * 0.3));
  const sof = Math.max(0, Math.min(1, (valence + 1) / 2 * 0.5 + (1 - (arousal + 1) / 2) * 0.4));

  const quadrant = deriveEmotion(valence, arousal);
  const palette_bias = valence > 0 ? "warm" : "cool";

  return res.json({
    ok: true,
    valence,
    arousal,
    quadrant: quadrant.quadrant,
    palette_bias,
    saturation: parseFloat(sat.toFixed(2)),
    density: parseFloat(den.toFixed(2)),
    contrast: parseFloat(con.toFixed(2)),
    symmetry: parseFloat(sym.toFixed(2)),
    accent: parseFloat(acc.toFixed(2)),
    material_softness: parseFloat(sof.toFixed(2))
  });
});

app.get("/schemas", (_req, res) => {
  return res.json({
    ok: true,
    schemas: ["EC_CANON_V1"],
    current: "EC_CANON_V1",
    fields: { EC_CANON_V1: 48 }
  });
});

app.post("/placement/generate", async (req, res) => {
  try {
    const {
      stemCount = 40,
      clusterCount = 4,
      spreadDeg = 60,
      silenceDeg = 20,
      focalDepth = 0.6,
      greeneryRatio = 0.4,
      focalRatio = 0.15,
      formula = "Crescent"
    } = req.body || {};

    const seed = seedFromString(
      `${stemCount}|${clusterCount}|${spreadDeg}|${silenceDeg}|${focalDepth}|${greeneryRatio}|${focalRatio}|${formula}`
    );
    const rng = makeRng(seed);

    const silenceStart = (270 - silenceDeg / 2) * (Math.PI / 180);
    const silenceEnd = (270 + silenceDeg / 2) * (Math.PI / 180);
    const greeneryCount = Math.floor(stemCount * greeneryRatio);
    const focalCount = Math.max(1, Math.floor(stemCount * focalRatio));
    const fillerCount = stemCount - greeneryCount - focalCount;

    function getAngles(total) {
      const angles = [];
      if (formula === "Full Halo") {
        for (let i = 0; i < total; i++) angles.push((i / total) * Math.PI * 2);
      } else if (formula === "Crescent") {
        const span = Math.PI * 1.4;
        const offset = Math.PI * 0.3;
        for (let i = 0; i < total; i++) angles.push(offset + span * (i / (total - 1 || 1)));
      } else if (formula === "Bottom Heavy") {
        for (let i = 0; i < total; i++) angles.push(Math.PI * 0.1 + Math.PI * 0.8 * (i / (total - 1 || 1)) + (rng() - 0.5) * 0.2);
      } else if (formula === "Side Sweep") {
        for (let i = 0; i < total; i++) angles.push(-0.5 + i * (1 / total) + (rng() - 0.5) * 0.15);
      } else if (formula === "Radial Burst") {
        for (let i = 0; i < total; i++) angles.push((i / total) * Math.PI * 2);
      } else if (formula === "Focal Burst") {
        for (let i = 0; i < total; i++) angles.push((i / total) * Math.PI * 2 + (rng() - 0.5) * 0.3);
      } else {
        for (let c = 0; c < clusterCount; c++) {
          const cAngle = (c / clusterCount) * Math.PI * 2;
          const perCluster = Math.ceil(total / clusterCount);
          for (let j = 0; j < perCluster && angles.length < total; j++) {
            angles.push(
              cAngle + (j - perCluster / 2) * (spreadDeg * Math.PI / 180 / perCluster) + (rng() - 0.5) * 0.08
            );
          }
        }
      }
      return angles.slice(0, total);
    }

    const roles = ["greenery", "filler", "focal"];
    const roleCounts = [greeneryCount, fillerCount, focalCount];
    let sid = 1;
    const stems = [];

    roles.forEach((role, ri) => {
      const count = roleCounts[ri];
      const angles = getAngles(count);
      angles.forEach((a) => {
        const normA = ((a % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
        const inSilence = silenceDeg > 0 && normA > silenceStart && normA < silenceEnd;
        if (!inSilence || formula === "Full Halo") {
          const radius = role === "focal" ? 1 - focalDepth * 0.3 : 0.85 + rng() * 0.2;
          const depth = role === "focal" ? focalDepth : role === "greenery" ? 0.1 + rng() * 0.2 : 0.3 + rng() * 0.4;
          stems.push({
            id: `S${String(sid++).padStart(3, "0")}`,
            angle: Math.round(((a * 180) / Math.PI) % 360 + 360) % 360,
            radius: parseFloat(radius.toFixed(2)),
            role,
            depth: parseFloat(depth.toFixed(2)),
            cluster: Math.floor(rng() * clusterCount) + 1
          });
        }
      });
    });

    return res.json({ ok: true, stems });
  } catch (err) {
    return res.status(500).json({ error: "Placement generation failed" });
  }
});

app.post("/memory-weaver", async (req, res) => {
  try {
    const { memory, occasion, color_pref, size } = req.body || {};
    if (!memory) {
      return res.status(400).json({ error: "Missing memory" });
    }
    const analysis = analyzeMemory({ memory, occasion, color_pref, size });

    return res.json({
      ok: true,
      emotion: analysis.emotion,
      blueprint: analysis.blueprint,
      interpretation: analysis.interpretation
    });
  } catch (err) {
    return res.status(500).json({ error: "Memory weaver failed" });
  }
});

app.post("/design-drop", async (req, res) => {
  try {
    const { formula, emotion, style } = req.body || {};
    if (!formula || !emotion) {
      return res.status(400).json({ error: "Missing formula or emotion" });
    }

    const shopify = {
      title: `${formula} Wreath`,
      short_desc: `A ${emotion.toLowerCase()} composition built in ${style || "Organic Drape"} style.`,
      long_desc: `Designed around the ${formula} structure, this wreath translates ${emotion.toLowerCase()} into measured form and negative space.\nIt uses faux botanicals only, with a calm silhouette and precise balance for a refined, gallery-ready finish.`,
      tags: ["evercrafted", "wreath", "faux botanicals", "studio", "crafted", "seasonal", "design object", "limited"],
      seo_meta: `Evercrafted ${formula} wreath in ${emotion} tone. Faux botanicals, precise balance, and studio-grade composition.`
    };

    const instagram = {
      caption: `A ${emotion.toLowerCase()} wreath built on the ${formula} composition. Faux botanicals, intentional silence, and a shape that holds its own. Would you hang this at your entryway?`,
      hashtags: ["#evercrafted", "#wreathdesign", "#fauxbotanicals", "#studioflora", "#floraldesign", "#entryway", "#designobjects", "#seasonalwreath", "#crafted"]
    };

    const email = {
      subjects: [
        `${formula} · ${emotion}`,
        `A quiet study in ${emotion}`,
        `New release: ${formula}`
      ],
      body: `Hello,\n\nWe’ve released a new wreath built on the ${formula} composition, shaped by a ${emotion.toLowerCase()} emotional profile. Faux botanicals only, with measured density and a clear negative-space arc.\n\nIf you want a piece that feels considered and architectural, this is it.\n\n— Evercrafted`
    };

    const pinterest = {
      title: `${formula} Wreath · ${emotion}`,
      description: `Faux botanical wreath in ${emotion.toLowerCase()} tone. ${formula} composition with intentional negative space and studio finish.`,
      board_suggestion: "Wreath Design Inspiration"
    };

    const mj = {
      product_prompt: `luxury faux botanical wreath, ${formula.toLowerCase()} composition, ${emotion.toLowerCase()} tone, ${style || "organic drape"} style, asymmetric, matte finish, editorial product photography, black background, soft side lighting --ar 1:1 --v 6 --style raw`,
      lifestyle_prompt: `luxury faux botanical wreath on a textured door, ${formula.toLowerCase()} composition, ${emotion.toLowerCase()} tone, soft natural light, editorial interior styling --ar 4:5 --v 6`
    };

    return res.json({ ok: true, shopify, instagram, email, pinterest, mj });
  } catch (err) {
    return res.status(500).json({ error: "Design drop failed" });
  }
});

app.post("/chat/respond", async (req, res) => {
  try {
    const { message, blueprint } = req.body || {};
    if (!message) return res.status(400).json({ error: "Missing message" });

    const bp = blueprint || {};
    const formula = bp?.composition?.formula || "Crescent";
    const emotion = bp?.emotion_space?.quadrant || bp?.emotion_space?.quadrant_label || "Cozy & Calm";

    const reply = `Based on your ${emotion} direction and the ${formula} structure, I’d keep the core formula stable and adjust DNA softly. If you want more lift, increase cluster_spread_deg and focal_depth slightly. If you want more restraint, reduce density_profile and widen the silence_arc.`;

    return res.json({ ok: true, reply });
  } catch (err) {
    return res.status(500).json({ error: "Chat failed" });
  }
});

app.post("/inventory-ai/respond", async (req, res) => {
  try {
    const { message } = req.body || {};
    if (!message) return res.status(400).json({ error: "Missing message" });
    const text = String(message).toLowerCase();
    const lowStock = INVENTORY_DATA.filter((i) => i.stock / i.max < 0.3);
    const highStock = INVENTORY_DATA.filter((i) => i.stock / i.max > 0.6);
    let reply = "Inventory looks balanced. Ask about substitutions or low-stock risks.";
    if (text.includes("low") || text.includes("reorder")) {
      reply = `Low stock items: ${lowStock.map((i) => i.name).slice(0, 4).join(", ")}. Consider reordering these first.`;
    } else if (text.includes("high") || text.includes("excess")) {
      reply = `High stock items you can use aggressively: ${highStock.map((i) => i.name).slice(0, 4).join(", ")}.`;
    } else if (text.includes("substitute")) {
      reply = "Tell me the out-of-stock item name and I’ll suggest role- and color-matched substitutes.";
    }
    return res.json({ ok: true, reply });
  } catch (err) {
    return res.status(500).json({ error: "Inventory AI failed" });
  }
});

app.post("/inventory/substitutes", async (req, res) => {
  try {
    const { item } = req.body || {};
    if (!item) return res.status(400).json({ error: "Missing item" });
    const target = INVENTORY_DATA.find((i) => i.name.toLowerCase() === String(item).toLowerCase());
    if (!target) {
      return res.json({
        ok: true,
        substitutes: INVENTORY_DATA.slice(0, 3).map((i) => ({
          substitute: i.name,
          reason: "available",
          compat: i.compat
        }))
      });
    }
    const candidates = INVENTORY_DATA.filter((i) => i.name !== target.name && i.role === target.role);
    const substitutes = candidates.slice(0, 3).map((i) => ({
      substitute: i.name,
      reason: "role match",
      compat: i.compat
    }));
    return res.json({ ok: true, substitutes });
  } catch (err) {
    return res.status(500).json({ error: "Substitute lookup failed" });
  }
});

app.post("/blueprint/evaluate", async (req, res) => {
  try {
    const { formula, emotion, style, density, ribbon, symmetry, silk, crowded } = req.body || {};
    const hardIssues = [];
    if (ribbon) hardIssues.push({ severity: "critical", text: "Blocked: ribbon/bow materials violate brand rules." });
    if (silk) hardIssues.push({ severity: "critical", text: "Blocked: silk or plastic materials are prohibited." });
    if (symmetry) hardIssues.push({ severity: "critical", text: "Blocked: symmetry is prohibited; asymmetry is required." });

    const base = hardIssues.length ? 22 : 78;
    const overall = Math.max(0, Math.min(100, base - (crowded ? 8 : 0) + Math.floor((density || 0.7) * 10)));
    const dimensions = {
      emotion_alignment: hardIssues.length ? 62 : 82,
      brand_fit: hardIssues.length ? 12 : 85,
      composition_quality: hardIssues.length ? 24 : 78,
      material_integrity: hardIssues.length ? 8 : 92,
      negative_space: hardIssues.length ? 30 : 74,
      design_originality: hardIssues.length ? 46 : 80
    };
    const quick_fixes = hardIssues.length
      ? ["Remove all ribbon and bow SKUs.", "Rebuild with intentional asymmetry.", "Use faux botanicals only."]
      : ["Reduce crowding in outer arc.", "Widen silence arc by 5–10°.", "Increase focal depth slightly."];

    const narrative = `This ${formula || "Crescent"} composition aligns with a ${emotion || "Cozy & Calm"} intent, but the current density and material flags impact brand fit. Tighten negative space and reinforce asymmetry for a cleaner, more intentional read.`;

    return res.json({
      ok: true,
      overall,
      dimensions,
      issues: hardIssues,
      quick_fixes,
      narrative
    });
  } catch (err) {
    return res.status(500).json({ error: "Evaluation failed" });
  }
});

app.post("/build-sheet", async (req, res) => {
  try {
    const { formula, emotion, size, skill } = req.body || {};
    const stemBase = { 18: 22, 20: 28, 24: 36 }[parseInt(size, 10)] || 28;
    const cnts = {
      focal: Math.ceil(stemBase * 0.12),
      supporting: Math.ceil(stemBase * 0.22),
      filler: Math.ceil(stemBase * 0.26),
      greenery: Math.ceil(stemBase * 0.4)
    };
    const total = Object.values(cnts).reduce((a, b) => a + b, 0);
    const timeMap = { Beginner: "3–4 hrs", Intermediate: "2–2.5 hrs", Advanced: "1–1.5 hrs" }[skill] || "2–2.5 hrs";
    const roleMap = {
      focal: ["Ivory Garden Rose"],
      supporting: ["Dried Wheat Bundle"],
      filler: ["Bleached Lunaria"],
      greenery: ["Silver Dollar Eucalyptus", "Sage Bundle"]
    };
    const lenM = { focal: '4–6"', supporting: '6–9"', filler: '3–5"', greenery: '9–14"' };
    const items = [];
    Object.entries(cnts).forEach(([role, count]) => {
      roleMap[role].forEach((name, idx) => {
        items.push({ name, role, count: Math.ceil(count / (role === "greenery" ? 2 : 1)), len: lenM[role] });
      });
    });
    const steps = [
      { step: 1, title: "Prep frame", instruction: "Inspect frame, mark top center, and confirm size alignment." },
      { step: 2, title: "Greenery base", instruction: "Build a balanced base layer with varied angles for movement." },
      { step: 3, title: "Support layer", instruction: "Place supporting stems to establish weight and direction." },
      { step: 4, title: "Focal placement", instruction: "Set focal stems at the primary anchor with depth." },
      { step: 5, title: "Filler pass", instruction: "Fill gaps while preserving the silence arc and asymmetry." },
      { step: 6, title: "Quality check", instruction: "Confirm negative space and material rules before finish." }
    ];
    const bpId = `EC-BS-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
    const notes = `Build a ${formula || "Crescent"} wreath with a ${emotion || "Cozy & Calm"} feel. Prioritize silence arc clarity and asymmetry throughout.`;
    return res.json({ ok: true, items, steps, bpId, total, time: timeMap, notes });
  } catch (err) {
    return res.status(500).json({ error: "Build sheet failed" });
  }
});

app.post("/launch-plan", async (req, res) => {
  try {
    const { name, formula, type, qty, price, launchDate } = req.body || {};
    const timeline = [
      { day: "1", title: "Finalize concept", description: "Lock formula, pricing, and inventory availability.", type: "prep", status: "done" },
      { day: "3", title: "Product photography", description: "Capture hero and detail images for listings.", type: "content", status: "active" },
      { day: "6", title: "Draft launch copy", description: "Prepare Shopify, email, and Instagram copy.", type: "content", status: "pending" },
      { day: "10", title: "Finalize inventory", description: "Confirm build capacity and packaging materials.", type: "build", status: "pending" },
      { day: "14", title: "Launch day", description: "Publish listings and send email announcement.", type: "launch", status: "pending" }
    ];
    const checklist = [
      { text: "Confirm COGS and pricing", category: "Finance" },
      { text: "Upload listing imagery", category: "Shopify" },
      { text: "Schedule email blast", category: "Email" },
      { text: "Create Instagram post", category: "Instagram" },
      { text: "Prepare packaging inserts", category: "Ops" }
    ];
    const channels = [
      { channel: "Instagram", action: "Launch post + story", day: "14" },
      { channel: "Email", action: "Launch announcement", day: "14" },
      { channel: "Pinterest", action: "Pin hero image", day: "12" },
      { channel: "Shopify", action: "Publish product", day: "14" }
    ];
    const strategy = `Launch ${name || "this drop"} using the ${formula || "Crescent"} composition with a focused, editorial rollout. Build anticipation with precise imagery, then release with clear scarcity (${qty || "limited"} units) and a strong price anchor ($${price || "—"}). Follow with post‑launch reminders emphasizing design intent.`;
    return res.json({ ok: true, timeline, checklist, channels, strategy });
  } catch (err) {
    return res.status(500).json({ error: "Launch plan failed" });
  }
});

app.post("/orders/quote", async (req, res) => {
  try {
    const { name, email, memory, occasion, color, size } = req.body || {};
    if (!name || !memory) {
      return res.status(400).json({ error: "Missing name or memory" });
    }
    const analysis = analyzeMemory({ memory, occasion, color_pref: color, size });
    const rng = makeRng(seedFromString(`${name}|${memory}|${size}`));
    const scores = {
      emotion_fit: rnd(rng, 0.82, 0.93),
      brand_alignment: rnd(rng, 0.84, 0.95),
      memory_fidelity: rnd(rng, 0.80, 0.94)
    };
    const matCost = { 18: 32, 20: 42, 24: 58 }[parseInt(size, 10)] || 42;
    const laborHrs = { 18: 1.8, 20: 2.5, 24: 3.2 }[parseInt(size, 10)] || 2.5;
    const laborRate = 22;
    const laborCost = laborHrs * laborRate;
    const total = matCost + laborCost + 12 + 8 + 14;
    const leadWeeks = (String(size) === "24" || String(occasion || "").toLowerCase().includes("memorial")) ? 3 : 2;
    const order_id = makeCode("EC");
    const brief = `Hello ${name},\n\nWe translated your memory into a ${analysis.emotion.quadrant} profile and anchored the design with the ${analysis.emotion.formula} composition. The palette leans ${analysis.emotion.palette_direction}, with a ${analysis.emotion.density} density to protect the stillness you described.\n\nYour ${size || "20"}" wreath is scheduled for a ${leadWeeks}-week lead time. We use only faux botanicals, selected for long-term stability and a gallery-grade finish.`;
    const order = {
      id: order_id,
      customer: name,
      email: email || "",
      memory,
      formula: analysis.emotion.formula,
      emotion: analysis.emotion.quadrant,
      size: String(size || "20"),
      total: Number(total.toFixed(2)),
      lead: leadWeeks,
      status: "received",
      dna: analysis.blueprint.dna,
      scores,
      quote: { material_cost: matCost, labor_hours: laborHrs, labor_cost: laborCost, total },
      brief,
      blueprint_version: "EC_CANON_V1",
      created_at: new Date().toISOString()
    };
    return res.json({ ok: true, emotion: analysis.emotion, order });
  } catch (err) {
    return res.status(500).json({ error: "Order quote failed" });
  }
});

app.post("/orders", async (req, res) => {
  try {
    const { order } = req.body || {};
    if (!order || !order.customer) {
      return res.status(400).json({ error: "Missing order" });
    }
    const order_id = order.id || makeCode("EC");
    const payload = {
      order_id,
      customer: order.customer,
      email: order.email || "",
      memory: order.memory || "",
      formula: order.formula || "",
      emotion: order.emotion || "",
      size: order.size || "",
      total: order.total || null,
      lead_weeks: order.lead || null,
      status: order.status || "received",
      dna: order.dna || null,
      scores: order.scores || null,
      quote: order.quote || null,
      brief: order.brief || null
    };
    const { data, error } = await supabase
      .from("orders")
      .insert(payload)
      .select()
      .single();
    if (error) return res.status(400).json({ error: error.message });
    return res.json({ ok: true, order: { ...order, id: order_id } });
  } catch (err) {
    return res.status(500).json({ error: "Order save failed" });
  }
});

app.get("/orders", async (_req, res) => {
  try {
    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) return res.status(400).json({ error: error.message });
    const orders = (data || []).map((row) => ({
      id: row.order_id,
      customer: row.customer,
      email: row.email,
      memory: row.memory,
      formula: row.formula,
      emotion: row.emotion,
      size: row.size,
      total: row.total,
      lead: row.lead_weeks,
      status: row.status,
      dna: row.dna,
      scores: row.scores,
      quote: row.quote,
      brief: row.brief,
      created: row.created_at
    }));
    return res.json({ ok: true, orders });
  } catch (err) {
    return res.status(500).json({ error: "Order list failed" });
  }
});

app.patch("/orders/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body || {};
    if (!status) return res.status(400).json({ error: "Missing status" });
    const { error } = await supabase
      .from("orders")
      .update({ status })
      .eq("order_id", id);
    if (error) return res.status(400).json({ error: error.message });
    return res.json({ ok: true });
  } catch (err) {
    return res.status(500).json({ error: "Order update failed" });
  }
});

app.post("/orders/manual", async (req, res) => {
  try {
    const { customer, email, formula, size, total, emotion, lead, status } = req.body || {};
    if (!customer) return res.status(400).json({ error: "Missing customer" });
    const order_id = makeCode("EC");
    const payload = {
      order_id,
      customer,
      email: email || "",
      formula: formula || "Crescent",
      emotion: emotion || "—",
      size: size || "20",
      total: total || 0,
      lead_weeks: lead || 2,
      status: status || "received"
    };
    const { error } = await supabase.from("orders").insert(payload);
    if (error) return res.status(400).json({ error: error.message });
    return res.json({ ok: true, order: { id: order_id, ...payload, lead: payload.lead_weeks } });
  } catch (err) {
    return res.status(500).json({ error: "Manual order failed" });
  }
});

app.post("/orders/sample", async (_req, res) => {
  try {
    const samples = [
      { customer: "Eleanor Webb", formula: "Full Halo", size: "20", total: 198, emotion: "Cozy & Calm", status: "received" },
      { customer: "Marcus Flores", formula: "Focal Burst", size: "24", total: 265, emotion: "Dramatic Tension", status: "in-build" },
      { customer: "Diana Park", formula: "Crescent", size: "18", total: 142, emotion: "Vintage Melancholy", status: "quality-check" },
      { customer: "James Tanner", formula: "Double Echo", size: "20", total: 185, emotion: "Festive & Bright", status: "shipped" }
    ];
    const rows = samples.map((s) => ({
      order_id: makeCode("EC"),
      customer: s.customer,
      formula: s.formula,
      size: s.size,
      total: s.total,
      emotion: s.emotion,
      status: s.status,
      lead_weeks: 2
    }));
    const { data, error } = await supabase.from("orders").insert(rows).select();
    if (error) return res.status(400).json({ error: error.message });
    const orders = (data || []).map((row) => ({
      id: row.order_id,
      customer: row.customer,
      formula: row.formula,
      size: row.size,
      total: row.total,
      emotion: row.emotion,
      status: row.status,
      lead: row.lead_weeks,
      email: row.email || "",
      created: row.created_at
    }));
    return res.json({ ok: true, orders });
  } catch (err) {
    return res.status(500).json({ error: "Sample orders failed" });
  }
});

app.post("/orders/clear", async (_req, res) => {
  try {
    const { error } = await supabase.from("orders").delete().neq("order_id", "");
    if (error) return res.status(400).json({ error: error.message });
    return res.json({ ok: true });
  } catch (err) {
    return res.status(500).json({ error: "Clear orders failed" });
  }
});

app.post("/orders/status-email", async (req, res) => {
  try {
    const { order } = req.body || {};
    if (!order) return res.status(400).json({ error: "Missing order" });
    const statusMsg = {
      received: "We have received your order and are beginning the design process.",
      "in-build": "Your wreath is now being built by our design team.",
      "quality-check": "Your wreath has passed final quality check and is ready for packaging.",
      shipped: "Your order has been shipped and is on its way to you!"
    };
    const body = `Hello ${order.customer},\n\n${statusMsg[order.status] || "Your order has been updated."}\n\nOrder: ${order.id}\nDesign: ${order.formula} ${order.size}"\n\nWith care,\nEvercrafted Studio`;
    return res.json({ ok: true, email: body });
  } catch (err) {
    return res.status(500).json({ error: "Status email failed" });
  }
});

app.get("/drops", async (_req, res) => {
  try {
    const { data, error } = await supabase
      .from("drop_logs")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) return res.status(400).json({ error: error.message });
    const drops = (data || []).map((d) => ({
      id: d.drop_id,
      name: d.name,
      formula: d.formula,
      units: d.units,
      total: d.total,
      price: d.price,
      cogs: d.cogs,
      rev: d.revenue,
      profit: d.profit,
      mgn: d.margin,
      sellThru: d.sell_thru,
      month: d.month,
      created: d.created_at
    }));
    return res.json({ ok: true, drops });
  } catch (err) {
    return res.status(500).json({ error: "Drop list failed" });
  }
});

app.post("/drops", async (req, res) => {
  try {
    const { drop } = req.body || {};
    if (!drop || !drop.name) return res.status(400).json({ error: "Missing drop" });
    const drop_id = drop.id || makeCode("DROP");
    const payload = {
      drop_id,
      name: drop.name,
      formula: drop.formula,
      units: drop.units,
      total: drop.total,
      price: drop.price,
      cogs: drop.cogs,
      revenue: drop.rev,
      profit: drop.profit,
      margin: drop.mgn,
      sell_thru: drop.sellThru,
      month: drop.month
    };
    const { error } = await supabase.from("drop_logs").insert(payload);
    if (error) return res.status(400).json({ error: error.message });
    return res.json({ ok: true, drop: { ...drop, id: drop_id } });
  } catch (err) {
    return res.status(500).json({ error: "Drop save failed" });
  }
});

app.post("/drops/insight", async (req, res) => {
  try {
    let drops = req.body?.drops || [];
    if (!drops.length) {
      const { data } = await supabase.from("drop_logs").select("*");
      drops = (data || []).map((d) => ({
        name: d.name,
        formula: d.formula,
        units: d.units,
        total: d.total,
        rev: d.revenue,
        mgn: d.margin,
        sellThru: d.sell_thru
      }));
    }
    if (!drops.length) return res.json({ ok: true, insight: "Log drops to generate insights." });
    const totalRev = drops.reduce((s, d) => s + (d.rev || 0), 0);
    const best = drops.reduce((a, b) => ((a.rev || 0) > (b.rev || 0) ? a : b));
    const avgMgn = drops.reduce((s, d) => s + (d.mgn || 0), 0) / drops.length;
    const insight = `Overall revenue is $${Math.round(totalRev).toLocaleString()} with an average margin of ${avgMgn.toFixed(1)}%. The strongest drop was ${best.name} (${best.formula}).\n\nOpportunity: focus on formulas with consistently high margin and sell-through. If margin dips below 40%, tighten inventory and pricing to protect brand positioning.\n\nRecommendation: plan the next drop around the best-performing formula and raise limited-unit pricing by 5–8% to reinforce scarcity.`;
    return res.json({ ok: true, insight });
  } catch (err) {
    return res.status(500).json({ error: "Insight failed" });
  }
});

app.get("/blueprint-library", async (_req, res) => {
  try {
    const { data, error } = await supabase
      .from("blueprint_library")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) return res.status(400).json({ error: error.message });
    const blueprints = (data || []).map((b) => ({
      id: b.bp_id,
      name: b.name,
      formula: b.formula,
      emotion: b.emotion,
      notes: b.notes,
      tags: b.tags || [],
      version: b.version || 1,
      versions: b.versions || [],
      created: b.created_at
    }));
    return res.json({ ok: true, blueprints });
  } catch (err) {
    return res.status(500).json({ error: "Blueprint library failed" });
  }
});

app.post("/blueprint-library", async (req, res) => {
  try {
    const { blueprint } = req.body || {};
    if (!blueprint || !blueprint.name) return res.status(400).json({ error: "Missing blueprint" });
    const bp_id = makeCode("BP");
    const versions = [{ v: 1, date: new Date().toISOString(), note: "Initial save" }];
    const payload = {
      bp_id,
      name: blueprint.name,
      formula: blueprint.formula,
      emotion: blueprint.emotion,
      notes: blueprint.notes,
      tags: blueprint.tags || [],
      version: 1,
      versions
    };
    const { error } = await supabase.from("blueprint_library").insert(payload);
    if (error) return res.status(400).json({ error: error.message });
    return res.json({ ok: true, blueprint: { id: bp_id, ...payload, created: new Date().toISOString() } });
  } catch (err) {
    return res.status(500).json({ error: "Blueprint save failed" });
  }
});

app.post("/blueprint-library/clone", async (req, res) => {
  try {
    const { id } = req.body || {};
    if (!id) return res.status(400).json({ error: "Missing id" });
    const { data, error } = await supabase.from("blueprint_library").select("*").eq("bp_id", id).single();
    if (error || !data) return res.status(404).json({ error: "Blueprint not found" });
    const bp_id = makeCode("BP");
    const versions = [{ v: 1, date: new Date().toISOString(), note: `Cloned from ${id}` }];
    const payload = {
      bp_id,
      name: `${data.name} (Copy)`,
      formula: data.formula,
      emotion: data.emotion,
      notes: data.notes,
      tags: data.tags || [],
      version: 1,
      versions
    };
    const { error: insertError } = await supabase.from("blueprint_library").insert(payload);
    if (insertError) return res.status(400).json({ error: insertError.message });
    return res.json({ ok: true, blueprint: { id: bp_id, ...payload, created: new Date().toISOString() } });
  } catch (err) {
    return res.status(500).json({ error: "Blueprint clone failed" });
  }
});

app.delete("/blueprint-library/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { error } = await supabase.from("blueprint_library").delete().eq("bp_id", id);
    if (error) return res.status(400).json({ error: error.message });
    return res.json({ ok: true });
  } catch (err) {
    return res.status(500).json({ error: "Blueprint delete failed" });
  }
});

app.post("/blueprint-library/clear", async (_req, res) => {
  try {
    const { error } = await supabase.from("blueprint_library").delete().neq("bp_id", "");
    if (error) return res.status(400).json({ error: error.message });
    return res.json({ ok: true });
  } catch (err) {
    return res.status(500).json({ error: "Blueprint clear failed" });
  }
});

app.post("/blueprint-library/sample", async (_req, res) => {
  try {
    const samples = [
      { name: "Grandmother's Garden", formula: "Crescent", emotion: "Vintage Melancholy", notes: "Late summer memorial, deep burgundy tones", tags: ["memorial", "autumn", "burgundy"] },
      { name: "Winter Solstice Halo", formula: "Full Halo", emotion: "Cozy & Calm", notes: "Holiday edition, silver and white palette", tags: ["holiday", "winter", "silver"] },
      { name: "Dramatic Focal No. 3", formula: "Focal Burst", emotion: "Dramatic Tension", notes: "Editorial direction, black protea focal", tags: ["editorial", "dramatic", "dark"] },
      { name: "Harvest Bottom Heavy", formula: "Bottom Heavy", emotion: "Festive & Bright", notes: "October drop, terracotta and golden wheat", tags: ["harvest", "fall", "earthy"] }
    ];
    const rows = samples.map((s) => ({
      bp_id: makeCode("BP"),
      name: s.name,
      formula: s.formula,
      emotion: s.emotion,
      notes: s.notes,
      tags: s.tags,
      version: 1,
      versions: [{ v: 1, date: new Date().toISOString(), note: "Sample blueprint" }]
    }));
    const { data, error } = await supabase.from("blueprint_library").insert(rows).select();
    if (error) return res.status(400).json({ error: error.message });
    const blueprints = (data || []).map((b) => ({
      id: b.bp_id,
      name: b.name,
      formula: b.formula,
      emotion: b.emotion,
      notes: b.notes,
      tags: b.tags || [],
      version: b.version,
      versions: b.versions || [],
      created: b.created_at
    }));
    return res.json({ ok: true, blueprints });
  } catch (err) {
    return res.status(500).json({ error: "Sample blueprints failed" });
  }
});

app.post("/integrations/email/generate", async (req, res) => {
  try {
    const { name, order_id, formula, status } = req.body || {};
    const msg = {
      received: "We have received your order and our design team is reviewing your request. We'll begin building your wreath shortly.",
      "in-build": "Your wreath is now being hand-crafted by our design team. We're working with care to honor the story you shared with us.",
      "quality-check": "Your wreath has completed our quality review process and is being prepared for shipping.",
      shipped: "Your order is on its way. We hope it brings the feeling you were looking for into your home.",
      ready: "Your order is ready for pickup. We look forward to seeing you."
    }[status] || "Your order has been updated.";
    const body = `Hi ${name || "there"},\n\nThank you for trusting Evercrafted with something meaningful.\n\n${msg}\n\nOrder: ${order_id || "your order"}\nDesign: ${formula || "Evercrafted wreath"} — Faux Botanical Wreath\n\nWith care,\nEvercrafted Studio`;
    return res.json({ ok: true, email: body });
  } catch (err) {
    return res.status(500).json({ error: "Email generate failed" });
  }
});

app.post("/integrations/email/send", async (_req, res) => {
  return res.json({ ok: true });
});

app.post("/integrations/calendar/create", async (req, res) => {
  const { title, start, end, description, type } = req.body || {};
  return res.json({ ok: true, event: { title, start, end, description, type } });
});

app.post("/shopify/listing", async (req, res) => {
  try {
    const { formula, emotion, size, price, qty } = req.body || {};
    const title = `${emotion || "Cozy"} ${formula || "Crescent"} Wreath`;
    const handle = title.toLowerCase().replace(/[^a-z0-9 ]/g, "").trim().replace(/\s+/g, "-");
    const short_desc = `A ${emotion || "calm"} wreath built in the ${formula || "Crescent"} composition, balanced with measured density and intentional negative space.`;
    const long_desc = `Designed around the ${formula || "Crescent"} structure, this piece translates ${emotion || "quiet"} into form with studio-grade precision.\n\nFaux botanicals only, no ribbon, no bow — just sculpted texture, restrained movement, and a silhouette that reads architectural on any wall.`;
    const tags = ["evercrafted", "wreath", "faux botanicals", "studio", "crafted", "seasonal", "design object", "limited", "architectural", "botanical"];
    const seo = `Evercrafted ${formula || "Crescent"} wreath in a ${emotion || "calm"} tone. Faux botanicals, precise balance, and studio-grade composition.`;
    return res.json({ ok: true, listing: { title, handle, short_desc, long_desc, tags, seo } });
  } catch (err) {
    return res.status(500).json({ error: "Listing failed" });
  }
});

app.post("/shopify/publish", async (req, res) => {
  try {
    const { listing } = req.body || {};
    if (!listing) return res.status(400).json({ error: "Missing listing" });
    const listing_id = listing.id || makeCode("SH");
    const payload = {
      listing_id,
      title: listing.title,
      handle: listing.handle,
      data: listing,
      published: true
    };
    const { error } = await supabase.from("shopify_listings").insert(payload);
    if (error) return res.status(400).json({ error: error.message });
    return res.json({ ok: true, listing_id });
  } catch (err) {
    return res.status(500).json({ error: "Publish failed" });
  }
});

app.post("/blueprints/generate", async (req, res) => {
  try {
    const { formula, emotion, style } = req.body || {};
    const blueprint = buildBlueprint({ formula, emotion, style });
    return res.json({ ok: true, blueprint });
  } catch (err) {
    return res.status(500).json({ error: "Blueprint generation failed" });
  }
});

app.post("/uploads", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const timestamp = Date.now();
    const safeName = req.file.originalname.replace(/[^a-zA-Z0-9._-]/g, "_");
    const path = `${timestamp}_${safeName}`;

    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(path, req.file.buffer, {
        contentType: req.file.mimetype,
        upsert: false
      });

    if (uploadError) {
      return res.status(400).json({ error: uploadError.message });
    }

    const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(path);

    const { data: insertData, error: insertError } = await supabase
      .from("uploads")
      .insert({
        bucket: BUCKET,
        path,
        original_name: req.file.originalname,
        mime_type: req.file.mimetype,
        size_bytes: req.file.size,
        public_url: urlData.publicUrl
      })
      .select()
      .single();

    if (insertError) {
      return res.status(400).json({ error: insertError.message });
    }

    return res.json({ ok: true, upload: insertData });
  } catch (err) {
    return res.status(500).json({ error: "Upload failed" });
  }
});

app.post("/blueprints", async (req, res) => {
  try {
    const { name, data } = req.body || {};
    if (!name || !data) {
      return res.status(400).json({ error: "Missing name or data" });
    }

    const { data: inserted, error } = await supabase
      .from("blueprints")
      .insert({ name, data })
      .select()
      .single();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    return res.json({ ok: true, blueprint: inserted });
  } catch (err) {
    return res.status(500).json({ error: "Blueprint save failed" });
  }
});

app.post("/waitlist", async (req, res) => {
  try {
    const { first_name, last_name, email, studio_type, volume } = req.body || {};
    if (!first_name || !last_name || !email) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const { data, error } = await supabase
      .from("waitlist")
      .insert({
        first_name,
        last_name,
        email: String(email).toLowerCase(),
        studio_type,
        volume
      })
      .select()
      .single();

    if (error) return res.status(400).json({ error: error.message });
    return res.json({ ok: true, waitlist: data });
  } catch (err) {
    return res.status(500).json({ error: "Waitlist submit failed" });
  }
});

app.post("/contact", async (req, res) => {
  try {
    const {
      first_name,
      last_name,
      email,
      role,
      business,
      channel,
      volume,
      challenge,
      tier,
      extra,
      updates_opt_in
    } = req.body || {};

    if (!first_name || !last_name || !email) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const { data, error } = await supabase
      .from("contact_submissions")
      .insert({
        first_name,
        last_name,
        email: String(email).toLowerCase(),
        role,
        business,
        channel,
        volume,
        challenge,
        tier,
        extra,
        updates_opt_in: !!updates_opt_in
      })
      .select()
      .single();

    if (error) return res.status(400).json({ error: error.message });
    return res.json({ ok: true, contact: data });
  } catch (err) {
    return res.status(500).json({ error: "Contact submit failed" });
  }
});

app.post("/signup", async (req, res) => {
  try {
    const { first_name, last_name, email, password } = req.body || {};
    if (!first_name || !last_name || !email || !password) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const password_hash = await bcrypt.hash(String(password), 10);
    const { data, error } = await supabase
      .from("signup_requests")
      .insert({
        first_name,
        last_name,
        email: String(email).toLowerCase(),
        password_hash
      })
      .select()
      .single();

    if (error) return res.status(400).json({ error: error.message });
    return res.json({ ok: true, signup: data });
  } catch (err) {
    return res.status(500).json({ error: "Signup failed" });
  }
});

app.post("/signin", async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const { data: user, error } = await supabase
      .from("signup_requests")
      .select("*")
      .eq("email", String(email).toLowerCase())
      .single();

    if (error || !user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const ok = await bcrypt.compare(String(password), user.password_hash);
    if (!ok) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    return res.json({
      ok: true,
      user: {
        id: user.id,
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
        created_at: user.created_at
      }
    });
  } catch (err) {
    return res.status(500).json({ error: "Signin failed" });
  }
});

app.post("/password-reset", async (req, res) => {
  try {
    const { email } = req.body || {};
    if (!email) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const { data, error } = await supabase
      .from("password_reset_requests")
      .insert({ email: String(email).toLowerCase() })
      .select()
      .single();

    if (error) return res.status(400).json({ error: error.message });
    return res.json({ ok: true, reset: data });
  } catch (err) {
    return res.status(500).json({ error: "Password reset failed" });
  }
});

app.get("/blueprints", async (_req, res) => {
  try {
    const { data, error } = await supabase
      .from("blueprints")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    return res.json({ ok: true, blueprints: data });
  } catch (err) {
    return res.status(500).json({ error: "Blueprint fetch failed" });
  }
});

app.listen(PORT, () => {
  console.log(`Backend listening on http://localhost:${PORT}`);
});
