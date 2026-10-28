import type { SpecimenRecord } from '../types/specimen';

export const MOCK_SPECIMENS: SpecimenRecord[] = [
  {
    id: 'GEO-8492',
    commonName: 'Banded Malachite',
    scientificName: 'Cu₂CO₃(OH)₂',
    category: 'Mineral',
    confidence: 0.964,
    capturedAt: '2026-10-24T14:32:00Z',
    inputMethod: 'upload',
    imageUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80',
    gradCamUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80',
    notes: 'Exquisite concentric botryoidal banding. Sourced from oxidized copper zone in Katanga. Clear silky luster across radial fibers.',
    dimensions: '2048 x 1536 px',
    fileSize: '3.4 MB',
    modelVersion: 'v2.4-convnext-large',
    location: 'Katanga Copperbelt, DR Congo',
    status: 'cataloged',
    topCandidates: [
      {
        name: 'Banded Malachite',
        category: 'Mineral',
        confidence: 0.964,
        mohsHardness: '3.5 - 4.0',
        description: 'Basic copper carbonate characterized by concentric emerald green banding.'
      },
      {
        name: 'Chrysocolla Botryoidal',
        category: 'Mineral',
        confidence: 0.024,
        mohsHardness: '2.5 - 3.5',
        description: 'Hydrated copper cyclosilicate with similar blue-green hue but lower density.'
      },
      {
        name: 'Green Agate / Moss Agate',
        category: 'Mineral',
        confidence: 0.012,
        mohsHardness: '6.5 - 7.0',
        description: 'Cryptocrystalline silica containing dendrites of chlorite or hornblende.'
      }
    ],
    characteristics: {
      mohsHardness: '3.5 - 4.0',
      crystalSystem: 'Monoclinic',
      chemicalFormula: 'Cu₂CO₃(OH)₂',
      luster: 'Adamantine to silky / vitreous',
      cleavageFracture: 'Subconchoidal to uneven',
      density: '3.80 g/cm³',
      streak: 'Pale apple-green',
      occurrence: 'Supergene enrichment zone of copper porphyry deposits',
      diagnosticFeatures: [
        'Concentric alternating dark & pale emerald-green bands',
        'Vigorous effervescence in cold dilute HCl',
        'Silky chatoyancy on fibrous fractures'
      ]
    }
  },
  {
    id: 'GEO-8488',
    commonName: 'Vesicular Basalt',
    scientificName: 'Mafic Extrusive (Plagioclase + Pyroxene)',
    category: 'Igneous',
    confidence: 0.938,
    capturedAt: '2026-10-24T11:18:00Z',
    inputMethod: 'scanner',
    imageUrl: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=800&q=80',
    notes: 'High vesicle density (32% porosity estimated). Specimen retrieved from quaternary subaerial lava field.',
    dimensions: '1920 x 1080 px',
    fileSize: '2.1 MB',
    modelVersion: 'v2.4-convnext-large',
    location: 'Eldhraun Field, Skaftárhreppur, Iceland',
    status: 'analyzed',
    topCandidates: [
      {
        name: 'Vesicular Basalt',
        category: 'Igneous',
        confidence: 0.938,
        mohsHardness: '6.0',
        description: 'Fine-grained extrusive mafic volcanic rock with trapped volcanic gas voids.'
      },
      {
        name: 'Scoria Mafic Cinder',
        category: 'Igneous',
        confidence: 0.048,
        mohsHardness: '5.5 - 6.0',
        description: 'Extremely vesicular pyroclastic rock with rougher glassy walls.'
      },
      {
        name: 'Vesicular Andesite',
        category: 'Igneous',
        confidence: 0.014,
        mohsHardness: '6.0 - 6.5',
        description: 'Intermediate volcanic rock containing higher plagioclase phenocryst ratio.'
      }
    ],
    characteristics: {
      mohsHardness: '6.0',
      crystalSystem: 'Aphanitic micro-crystalline',
      chemicalFormula: 'SiO₂ 45-52%, FeO+MgO >15%',
      luster: 'Dull to earthy',
      cleavageFracture: 'Uneven to rough',
      density: '2.45 g/cm³ (apparent due to voids)',
      streak: 'Dark gray to blackish',
      occurrence: 'Subaerial pahoehoe and aa basaltic lava flow margins',
      diagnosticFeatures: [
        'Abundant spherical vesicles formed by exsolved volcanic volatile gases',
        'Dark iron-black to charcoal fine-grained groundmass',
        'Weak magnetic pull on neodymium probe'
      ]
    }
  },
  {
    id: 'GEO-8475',
    commonName: 'Pyrite ("Fool\'s Gold")',
    scientificName: 'FeS₂ (Iron Disulfide)',
    category: 'Mineral',
    confidence: 0.975,
    capturedAt: '2026-10-23T16:45:00Z',
    inputMethod: 'upload',
    imageUrl: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?auto=format&fit=crop&w=800&q=80',
    notes: 'Striking interlocking pyritohedral and cubic crystals embedded in a light marl matrix. Sharp striations on cube faces.',
    dimensions: '2560 x 1440 px',
    fileSize: '4.8 MB',
    modelVersion: 'v2.4-convnext-large',
    location: 'Victoria Mine, Navajún, La Rioja, Spain',
    status: 'cataloged',
    topCandidates: [
      {
        name: 'Pyrite',
        category: 'Mineral',
        confidence: 0.975,
        mohsHardness: '6.0 - 6.5',
        description: 'Brass-yellow iron sulfide forming geometric isometric crystals.'
      },
      {
        name: 'Marcasite (White Iron Pyrite)',
        category: 'Mineral',
        confidence: 0.018,
        mohsHardness: '6.0 - 6.5',
        description: 'Orthorhombic polymorph of iron sulfide, typically paler and more tabular.'
      },
      {
        name: 'Chalcopyrite',
        category: 'Mineral',
        confidence: 0.007,
        mohsHardness: '3.5 - 4.0',
        description: 'Copper-iron sulfide with softer hardness and deeper iridescent tarnish.'
      }
    ],
    characteristics: {
      mohsHardness: '6.0 - 6.5',
      crystalSystem: 'Isometric (Cubic)',
      chemicalFormula: 'FeS₂',
      luster: 'Brilliant metallic',
      cleavageFracture: 'Conchoidal to uneven, brittle',
      density: '5.01 g/cm³',
      streak: 'Greenish-black to brownish-black',
      occurrence: 'Hydrothermal veins, sedimentary nodules, and contact metamorphic skarns',
      diagnosticFeatures: [
        'Sharp 90-degree cubic geometry with striated crystal faces',
        'Scratches common pocketknife blade (distinguishing from gold and chalcopyrite)',
        'Sulfur dioxide aroma when struck'
      ]
    }
  },
  {
    id: 'GEO-8461',
    commonName: 'Porphyritic Granite',
    scientificName: 'Felsic Plutonic (K-Feldspar + Quartz + Plagioclase)',
    category: 'Igneous',
    confidence: 0.912,
    capturedAt: '2026-10-22T09:20:00Z',
    inputMethod: 'upload',
    imageUrl: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=800&q=80',
    notes: 'Well-formed pinkish potassium feldspar phenocrysts measuring up to 35mm. High quartz proportion in medium-grained groundmass.',
    dimensions: '2048 x 1536 px',
    fileSize: '3.1 MB',
    modelVersion: 'v2.4-convnext-large',
    location: 'Haytor Rocks, Dartmoor Batholith, Devon, UK',
    status: 'cataloged',
    topCandidates: [
      {
        name: 'Porphyritic Granite',
        category: 'Igneous',
        confidence: 0.912,
        mohsHardness: '6.0 - 7.0',
        description: 'Coarse intrusive felsic rock displaying bimodal crystal size distribution.'
      },
      {
        name: 'Granodiorite',
        category: 'Igneous',
        confidence: 0.065,
        mohsHardness: '6.0 - 6.5',
        description: 'Plutonic rock with plagioclase dominating over potassium feldspar.'
      },
      {
        name: 'Syenite',
        category: 'Igneous',
        confidence: 0.023,
        mohsHardness: '6.0',
        description: 'Plutonic rock with low quartz (<5%) and high alkali feldspar.'
      }
    ],
    characteristics: {
      mohsHardness: '6.5',
      crystalSystem: 'Phaneritic porphyritic',
      chemicalFormula: 'SiO₂ > 70%, Al₂O₃, K₂O, Na₂O',
      luster: 'Vitreous (quartz) to pearly (feldspars)',
      cleavageFracture: 'Irregular fracture; two cleavages visible on phenocrysts',
      density: '2.68 g/cm³',
      streak: 'White (abrasive powder)',
      occurrence: 'Continental collision zones and massive batholiths',
      diagnosticFeatures: [
        'Euhedral pink orthoclase crystals protruding from weathered matrix',
        'Interlocking vitreous gray quartz filling interstices',
        'Evenly dispersed black flakes of biotite mica'
      ]
    }
  },
  {
    id: 'GEO-8450',
    commonName: 'Garnetiferous Gneiss',
    scientificName: 'High-grade Metamorphic (Pelitic protolith)',
    category: 'Metamorphic',
    confidence: 0.895,
    capturedAt: '2026-10-21T15:10:00Z',
    inputMethod: 'scanner',
    imageUrl: 'https://images.unsplash.com/photo-1596704017254-9b121068fb31?auto=format&fit=crop&w=800&q=80',
    notes: 'Segregated quartz-feldspar leucosomes alternating with biotite melanosomes. Porphyroblasts of almandine garnet up to 8mm.',
    dimensions: '1920 x 1080 px',
    fileSize: '2.4 MB',
    modelVersion: 'v2.4-convnext-large',
    location: 'Scourie Bay, Lewisian Complex, Northwest Scotland',
    status: 'analyzed',
    topCandidates: [
      {
        name: 'Garnetiferous Gneiss',
        category: 'Metamorphic',
        confidence: 0.895,
        mohsHardness: '7.0',
        description: 'Foliated metamorphic rock displaying distinct compositional banding with red garnets.'
      },
      {
        name: 'Migmatite Leucosome',
        category: 'Metamorphic',
        confidence: 0.078,
        mohsHardness: '6.5 - 7.0',
        description: 'Composite rock formed at the boundary between metamorphism and partial melting.'
      },
      {
        name: 'Biotite Schist',
        category: 'Metamorphic',
        confidence: 0.027,
        mohsHardness: '5.5',
        description: 'Medium-grade pelitic rock with more continuous mica foliation planes.'
      }
    ],
    characteristics: {
      mohsHardness: '7.0',
      crystalSystem: 'Gneissose granoblastic foliation',
      chemicalFormula: 'Metamorphic assemblage: Qtz + Plag + Bt + Grt',
      luster: 'Pearly to vitreous',
      cleavageFracture: 'Breaks along compositional foliation boundaries',
      density: '2.95 g/cm³',
      streak: 'White to grayish',
      occurrence: 'Deep regional metamorphic terranes; root zones of ancient orogens',
      diagnosticFeatures: [
        'Alternating light felsic and dark mafic crystalline ribbons',
        'Hard wine-red almandine porphyroblasts wrapped by foliation lines',
        'Coarse grain size without fissile slaty cleavage'
      ]
    }
  },
  {
    id: 'GEO-8442',
    commonName: 'Amethyst Quartz Geode',
    scientificName: 'SiO₂ (Silicate with Fe³⁺ color centers)',
    category: 'Mineral',
    confidence: 0.982,
    capturedAt: '2026-10-20T13:40:00Z',
    inputMethod: 'upload',
    imageUrl: 'https://images.unsplash.com/photo-1567401893414-76b7b1e5a7a5?auto=format&fit=crop&w=800&q=80',
    notes: 'Exceptional deep Siberian violet coloration with sharp terminating rhombohedral faces inside an agate-lined basalt vug.',
    dimensions: '3000 x 2000 px',
    fileSize: '5.2 MB',
    modelVersion: 'v2.4-convnext-large',
    location: 'Ametista do Sul, Rio Grande do Sul, Brazil',
    status: 'cataloged',
    topCandidates: [
      {
        name: 'Amethyst Quartz',
        category: 'Mineral',
        confidence: 0.982,
        mohsHardness: '7.0',
        description: 'Violet to purple macro-crystalline variety of quartz.'
      },
      {
        name: 'Fluorite Octahedron',
        category: 'Mineral',
        confidence: 0.012,
        mohsHardness: '4.0',
        description: 'Halide mineral with similar purple tones but softer hardness and cubic cleavage.'
      },
      {
        name: 'Cordierite (Iolite)',
        category: 'Mineral',
        confidence: 0.006,
        mohsHardness: '7.0 - 7.5',
        description: 'Cyclosilicate with strong blue-violet pleochroism.'
      }
    ],
    characteristics: {
      mohsHardness: '7.0',
      crystalSystem: 'Trigonal (Hexagonal trapezohedral)',
      chemicalFormula: 'SiO₂',
      luster: 'Vitreous (Glassy)',
      cleavageFracture: 'Conchoidal fracture; lacks cleavage',
      density: '2.65 g/cm³',
      streak: 'White',
      occurrence: 'Hydrothermal vugs in tholeiitic flood basalts and silica veins',
      diagnosticFeatures: [
        'Hexagonal prisms terminated by interlocking rhombohedral pyramids',
        'Vivid purple coloration intensified at crystal apexes',
        'Readily scratches window glass and hardened steel file'
      ]
    }
  },
  {
    id: 'GEO-8431',
    commonName: 'Obsidian (Volcanic Glass)',
    scientificName: 'Amorphous Extrusive Silica Glass (>70% SiO₂)',
    category: 'Igneous',
    confidence: 0.951,
    capturedAt: '2026-10-19T10:15:00Z',
    inputMethod: 'upload',
    imageUrl: 'https://images.unsplash.com/photo-1508280756991-9fcece66228b?auto=format&fit=crop&w=800&q=80',
    notes: 'Jet black homogeneous glass with razor-sharp conchoidal fracture rims and translucent smokey edges in thin flakes.',
    dimensions: '2048 x 1536 px',
    fileSize: '2.9 MB',
    modelVersion: 'v2.4-convnext-large',
    location: 'Big Obsidian Flow, Newberry Volcano, Oregon, USA',
    status: 'cataloged',
    topCandidates: [
      {
        name: 'Obsidian Glass',
        category: 'Igneous',
        confidence: 0.951,
        mohsHardness: '5.5',
        description: 'Rapidly cooled felsic volcanic glass devoid of macroscopic crystals.'
      },
      {
        name: 'Tachylite (Basaltic Glass)',
        category: 'Igneous',
        confidence: 0.038,
        mohsHardness: '5.5 - 6.0',
        description: 'Mafic volcanic glass with higher iron-titanium content.'
      },
      {
        name: 'Anthracite Coal',
        category: 'Sedimentary',
        confidence: 0.011,
        mohsHardness: '2.5 - 3.0',
        description: 'Metamorphosed carbonaceous organic rock with significantly lower density.'
      }
    ],
    characteristics: {
      mohsHardness: '5.5',
      crystalSystem: 'Amorphous (Non-crystalline)',
      chemicalFormula: 'SiO₂ ~73%, Al₂O₃, Na₂O, K₂O, FeO',
      luster: 'Vitreous, glossy sheen',
      cleavageFracture: 'Perfect conchoidal fracture with razor sharp margins',
      density: '2.40 g/cm³',
      streak: 'White',
      occurrence: 'Lava dome margins and rapidly quenched rhyolitic flow carapaces',
      diagnosticFeatures: [
        'Curved shell-like conchoidal fracture waves',
        'Deep vitreous mirror gloss across fresh surfaces',
        'Translucent amber-gray tint at thin edge chips'
      ]
    }
  },
  {
    id: 'GEO-8419',
    commonName: 'Oolitic Limestone',
    scientificName: 'Biogenic / Chemical Carbonate (>95% CaCO₃)',
    category: 'Sedimentary',
    confidence: 0.887,
    capturedAt: '2026-10-18T14:55:00Z',
    inputMethod: 'scanner',
    imageUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=800&q=80',
    notes: 'Well-sorted millimeter spherical ooids cemented in sparry calcite matrix. Hand lens reveals concentric internal laminate structures.',
    dimensions: '1920 x 1080 px',
    fileSize: '2.2 MB',
    modelVersion: 'v2.4-convnext-large',
    location: 'Isle of Portland, Dorset Jurassic Coast, UK',
    status: 'analyzed',
    topCandidates: [
      {
        name: 'Oolitic Limestone',
        category: 'Sedimentary',
        confidence: 0.887,
        mohsHardness: '3.0',
        description: 'Carbonate rock composed of spherical concentric calcium carbonate grains.'
      },
      {
        name: 'Calcareous Sandstone',
        category: 'Sedimentary',
        confidence: 0.082,
        mohsHardness: '4.5 - 6.0',
        description: 'Quartz sandstone cemented by calcite binder.'
      },
      {
        name: 'Travertine / Tufa',
        category: 'Sedimentary',
        confidence: 0.031,
        mohsHardness: '3.0',
        description: 'Terrestrial calcium carbonate precipitated at freshwater geothermal springs.'
      }
    ],
    characteristics: {
      mohsHardness: '3.0',
      crystalSystem: 'Grainstone / Packstone texture',
      chemicalFormula: 'CaCO₃',
      luster: 'Earthy to dull sub-vitreous',
      cleavageFracture: 'Granular, even freestone fracture',
      density: '2.55 g/cm³',
      streak: 'White',
      occurrence: 'Agitated warm shallow tropical marine carbonate sand bars',
      diagnosticFeatures: [
        'Visible round sand-sized grains resembling fish roe under 10x lens',
        'Vigorous bubbling upon contact with a single drop of 10% HCl',
        'Easily scratched with a copper penny (Mohs 3.5)'
      ]
    }
  }
];
