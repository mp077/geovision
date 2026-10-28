from typing import Dict, Any

GEOLOGICAL_TAXONOMY: Dict[str, Dict[str, Any]] = {
    "Banded Malachite": {
        "scientific_name": "Cu₂CO₃(OH)₂ (Basic Copper Carbonate)",
        "category": "Mineral",
        "mohs_hardness": "3.5 - 4.0",
        "crystal_system": "Monoclinic",
        "luster": "Adamantine to silky / vitreous",
        "cleavage_fracture": "Subconchoidal to uneven",
        "density": "3.80 g/cm³",
        "streak": "Pale apple-green",
        "occurrence": "Supergene oxidation zones of copper ore deposits",
        "diagnostic_features": [
            "Concentric alternating dark and light emerald-green bands",
            "Effervesces vigorously in warm dilute HCl",
            "Silky fibrous chatoyancy under directional illumination"
        ]
    },
    "Vesicular Basalt": {
        "scientific_name": "Extrusive Mafic Volcanic (Plagioclase + Pyroxene)",
        "category": "Igneous",
        "mohs_hardness": "5.5 - 6.5",
        "crystal_system": "Aphanitic vesicular groundmass",
        "luster": "Dull to earthy",
        "cleavage_fracture": "Uneven to rough fracture",
        "density": "2.40 - 2.80 g/cm³",
        "streak": "Dark gray to blackish",
        "occurrence": "Subaerial oceanic ridges, flood basalt plateaus, lava flows",
        "diagnostic_features": [
            "Abundant frozen gas bubbles (vesicles)",
            "Aphanitic dark charcoal to iron-black matrix",
            "Occasional yellow-green olivine phenocryst inclusions"
        ]
    },
    "Porphyritic Granite": {
        "scientific_name": "Felsic Plutonic (K-Feldspar + Quartz + Biotite)",
        "category": "Igneous",
        "mohs_hardness": "6.0 - 7.0",
        "crystal_system": "Phaneritic porphyritic texture",
        "luster": "Vitreous to pearly on feldspar faces",
        "cleavage_fracture": "Rough, irregular fracture; two cleavage planes on phenocrysts",
        "density": "2.65 - 2.75 g/cm³",
        "streak": "White",
        "occurrence": "Continental collision zones, massive batholiths and plutons",
        "diagnostic_features": [
            "Large pink/white euhedral K-feldspar phenocrysts (>15mm)",
            "Interlocking gray glassy anhedral quartz matrix",
            "Dispersed lustrous black flakes of biotite mica"
        ]
    },
    "Pyrite": {
        "scientific_name": "FeS₂ (Iron Disulfide)",
        "category": "Mineral",
        "mohs_hardness": "6.0 - 6.5",
        "crystal_system": "Isometric (Cubic, pyritohedral)",
        "luster": "Brilliant metallic",
        "cleavage_fracture": "Conchoidal to uneven, brittle",
        "density": "4.95 - 5.10 g/cm³",
        "streak": "Greenish-black to brownish-black",
        "occurrence": "Hydrothermal sulfide veins, sedimentary shale nodules, contact skarns",
        "diagnostic_features": [
            "Brassy yellow color with sharp striations on cubic crystal faces",
            "Scratches window glass and steel knife blades (unlike gold)",
            "Emits sulfurous odor when subjected to impact"
        ]
    },
    "Garnetiferous Gneiss": {
        "scientific_name": "High-Grade Regional Metamorphic (Pelitic protolith)",
        "category": "Metamorphic",
        "mohs_hardness": "6.5 - 7.5",
        "crystal_system": "Gneissose foliation banding",
        "luster": "Vitreous to sub-pearly",
        "cleavage_fracture": "Breaks along compositional foliation planes",
        "density": "2.85 - 3.15 g/cm³",
        "streak": "White to grayish",
        "occurrence": "Deep crustal metamorphic complexes, root zones of ancient orogens",
        "diagnostic_features": [
            "Alternating felsic (light quartz/feldspar) and mafic (dark biotite) bands",
            "Round deep-red almandine garnet porphyroblasts protruding from matrix",
            "Coarse crystalline texture without fissile slaty cleavage"
        ]
    },
    "Obsidian": {
        "scientific_name": "Extrusive Amorphous Felsic Silica Glass (>70% SiO₂)",
        "category": "Igneous",
        "mohs_hardness": "5.0 - 5.5",
        "crystal_system": "Amorphous (Non-crystalline glass)",
        "luster": "Vitreous, glossy mirror-like",
        "cleavage_fracture": "Perfect conchoidal fracture with razor-sharp edges",
        "density": "2.35 - 2.55 g/cm³",
        "streak": "White",
        "occurrence": "Lava dome margins, rapidly quenched rhyolitic flow carapaces",
        "diagnostic_features": [
            "Smooth curved conchoidal fracture surfaces",
            "Deep black vitreous luster",
            "Translucent amber or smokey rim in thin slivers"
        ]
    },
    "Amethyst Quartz": {
        "scientific_name": "SiO₂ (Crystalline Quartz with Fe³⁺ color centers)",
        "category": "Mineral",
        "mohs_hardness": "7.0",
        "crystal_system": "Trigonal (Hexagonal prisms terminated by rhombohedra)",
        "luster": "Vitreous (Glassy)",
        "cleavage_fracture": "Conchoidal fracture; lacks cleavage",
        "density": "2.65 g/cm³",
        "streak": "White",
        "occurrence": "Hydrothermal cavity linings in flood basalts and silica veins",
        "diagnostic_features": [
            "Hexagonal prismatic crystals with pyramidal terminations",
            "Characteristic violet to purple color zoned towards crystal apexes",
            "Hardness 7; readily scratches glass and hardened steel"
        ]
    },
    "Oolitic Limestone": {
        "scientific_name": "Carbonate Sedimentary (>95% CaCO₃)",
        "category": "Sedimentary",
        "mohs_hardness": "3.0",
        "crystal_system": "Grainstone / Packstone with calcite cement",
        "luster": "Earthy to dull sub-vitreous",
        "cleavage_fracture": "Granular, uniform freestone fracture",
        "density": "2.50 - 2.65 g/cm³",
        "streak": "White",
        "occurrence": "Warm agitated shallow tropical marine carbonate sand bars",
        "diagnostic_features": [
            "Spherical millimeter-sized ooids visible under hand lens",
            "Vigorous effervescence with a single drop of dilute HCl",
            "Easily scratched with a copper coin (Mohs 3.5)"
        ]
    },
    "Quartzite": {
        "scientific_name": "Recrystallized Meta-Sedimentary (>95% SiO₂)",
        "category": "Metamorphic",
        "mohs_hardness": "7.0",
        "crystal_system": "Granoblastic interlocking quartz mosaic",
        "luster": "Vitreous to greasy",
        "cleavage_fracture": "Conchoidal; fractures through quartz grains rather than around them",
        "density": "2.64 - 2.68 g/cm³",
        "streak": "White",
        "occurrence": "Contact or regional metamorphism of mature quartz arenite sandstone",
        "diagnostic_features": [
            "Breaks cleanly through original quartz sand grains",
            "Extreme hardness (scratches knife blades, cannot be scratched by steel)",
            "Does not react with hydrochloric acid"
        ]
    },
    "Specular Hematite": {
        "scientific_name": "Fe₂O₃ (Iron(III) Oxide)",
        "category": "Ore",
        "mohs_hardness": "5.5 - 6.5",
        "crystal_system": "Trigonal (Specularite tabular aggregate)",
        "luster": "Metallic, shimmering micaceous sparkle",
        "cleavage_fracture": "Uneven to sub-conchoidal; distinct basal parting",
        "density": "5.26 g/cm³",
        "streak": "Cherry-red to reddish-brown",
        "occurrence": "Metamorphosed banded iron formations and hydrothermal veins",
        "diagnostic_features": [
            "Glittering steel-gray metallic platelets",
            "Diagnostic blood-red to rust-brown streak on unglazed porcelain",
            "High specific gravity; heavy in hand"
        ]
    },
    "Schist": {
        "scientific_name": "Medium-Grade Metamorphic (Mica Schist)",
        "category": "Metamorphic",
        "mohs_hardness": "4.0 - 5.5",
        "crystal_system": "Lepidoblastic foliation",
        "luster": "Silky, shimmering mica sheen",
        "cleavage_fracture": "Pervasive schistosity along aligned mica sheets",
        "density": "2.75 - 2.95 g/cm³",
        "streak": "White to silvery gray",
        "occurrence": "Regional orogenic mountain-building metamorphic belts",
        "diagnostic_features": [
            "Prominent planar foliation of aligned muscovite and biotite micas",
            "Readily splits into thin crystalline leaves",
            "Silvery glistening luster across foliation planes"
        ]
    },
    "Sandstone": {
        "scientific_name": "Clastic Sedimentary (Quartz Arenite / Arkose)",
        "category": "Sedimentary",
        "mohs_hardness": "6.0 - 7.0 (grains)",
        "crystal_system": "Clastic grain-supported fabric",
        "luster": "Dull to gritty",
        "cleavage_fracture": "Granular; fractures around individual sand grains",
        "density": "2.20 - 2.60 g/cm³",
        "streak": "White",
        "occurrence": "Aeolian dunes, beach barriers, river channels, deltaic fans",
        "diagnostic_features": [
            "Visible gritty sand grains (0.06 - 2.0 mm) with abrasive sandpaper texture",
            "Bedding laminations or cross-bedding structures visible",
            "Breaks around sand grains rather than through them"
        ]
    }
}

CLASS_NAMES = list(GEOLOGICAL_TAXONOMY.keys())
