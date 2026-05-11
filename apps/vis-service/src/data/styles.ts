export interface StyleObject {
  id: string;
  name: string;
  model_inputs: {
    core_materials: string[];
    color_palette: string[];
    lighting_style: string;
    material_finish: string;
    aperture_look: string;
    dont: string[];
    signature_elements: string[];
  };
  pipeline_config: {
    structural_protocol: string;
    staging_density: 'low' | 'medium' | 'high';
  };
  conflict_resolution?: string[];
}

export const STYLE_REGISTRY: StyleObject[] = [
  {
    "id": "modern",
    "name": "Modern",
    "model_inputs": {
      "core_materials": ["white plaster", "light oak", "black steel"],
      "color_palette": ["warm white", "greige", "charcoal"],
      "lighting_style": "soft directional daylight",
      "material_finish": "matte and smooth",
      "aperture_look": "",
      "dont": ["no ornate molding", "no heavy drapery", "no saturated colors", "no distressed wood", "no layered decor"],
      "signature_elements": ["rectilinear furniture with clean unadorned profiles", "flush or integrated cabinetry", "single large-format wall art", "geometric rug with minimal pattern"]
    },
    "pipeline_config": {
      "structural_protocol": "rigid_base",
      "staging_density": "low"
    }
  },
  {
    "id": "contemporary",
    "name": "Contemporary",
    "model_inputs": {
      "core_materials": ["travertine", "boucle upholstery", "smoked glass"],
      "color_palette": ["off-white", "taupe", "espresso"],
      "lighting_style": "soft layered daylight",
      "material_finish": "matte with soft sheen",
      "aperture_look": "large frameless glass openings",
      "dont": ["no false walls", "no ornate trim", "no vintage ornament", "no bright primary colors", "no busy patterns"],
      "signature_elements": ["layered neutral textiles with mixed textures", "sculptural accent lighting", "organic-form vases or decorative objects", "statement area rug anchoring seating arrangement"]
    },
    "pipeline_config": {
      "structural_protocol": "rigid_aperture_lock",
      "staging_density": "medium"
    }
  },
  {
    "id": "minimalist",
    "name": "Minimalist",
    "model_inputs": {
      "core_materials": ["microcement", "white plaster", "light oak"],
      "color_palette": ["white", "soft gray", "sand"],
      "lighting_style": "even diffuse daylight",
      "material_finish": "matte and seamless",
      "aperture_look": "",
      "dont": ["no visible clutter", "no layered objects", "no decorative patterns", "no mixed finishes", "no statement decor"],
      "signature_elements": ["unadorned surfaces with visible material grain", "single intentional decorative object", "monochromatic layered textiles", "deliberate negative space as compositional element"]
    },
    "pipeline_config": {
      "structural_protocol": "surface_only_transform",
      "staging_density": "low"
    },
    "conflict_resolution": [
      "Clean surface pressure on built-in niches: style contents to minimum (single object or empty) — never remove, fill, or conceal niches behind panels or flush surfaces.",
      "Flush ceiling pressure on ceiling fixtures: if a fixture is confirmed present, it may be rendered as recessed or minimal flush-mount within its existing location — cannot be removed.",
      "Clutter-free pressure: remove decor and staging objects to meet LOW density — never remove architectural elements, built-ins, or fixtures."
    ]
  },
  {
    "id": "industrial",
    "name": "Industrial",
    "model_inputs": {
      "core_materials": ["exposed brick", "black steel", "poured concrete"],
      "color_palette": ["charcoal", "rust", "concrete gray"],
      "lighting_style": "hard directional daylight",
      "material_finish": "raw and textured",
      "aperture_look": "black steel grid windows",
      "dont": ["no false walls", "no ornate molding", "no glossy marble", "no pastel colors", "no plush furniture"],
      "signature_elements": ["exposed pipe or conduit as decorative surface element", "Edison-bulb or bare filament pendant lighting", "raw metal shelving or pipe-framed furniture", "concrete or brick feature wall surface treatment"]
    },
    "pipeline_config": {
      "structural_protocol": "rigid_aperture_lock",
      "staging_density": "medium"
    },
    "conflict_resolution": [
      "Raw/exposed structure aspiration: apply raw surface treatments (concrete paint, oxidized metal finish, exposed brick texture) to existing wall surfaces only — never add beams, columns, ductwork, or structural elements not present in the source.",
      "Open-plan feel aspiration: achieve through low-profile furniture and visual depth — never remove walls, doors, or partitions.",
      "Warehouse character: express through pendant fixtures (within confirmed ceiling fixture locations), materials, and open shelving — never alter ceiling height or structural geometry."
    ]
  },
  {
    "id": "midcentury_modern",
    "name": "Midcentury Modern",
    "model_inputs": {
      "core_materials": ["walnut wood", "tan leather", "terrazzo"],
      "color_palette": ["walnut brown", "olive green", "mustard"],
      "lighting_style": "clear directional daylight",
      "material_finish": "low-sheen and matte",
      "aperture_look": "horizontal glazing bands",
      "dont": ["no gray monochrome palette", "no ornate molding", "no chrome glam finishes", "no bulky furniture", "no farmhouse decor"],
      "signature_elements": ["tapered wooden legs on all major furniture pieces", "sunburst or geometric wall art", "atomic-age ceramics or sculptural accent objects", "low-profile furniture with horizontal silhouettes"]
    },
    "pipeline_config": {
      "structural_protocol": "rigid_aperture_lock",
      "staging_density": "medium"
    }
  },
  {
    "id": "farmhouse",
    "name": "Farmhouse",
    "model_inputs": {
      "core_materials": ["painted shiplap", "aged pine wood", "linen"],
      "color_palette": ["warm white", "oat beige", "muted black"],
      "lighting_style": "soft natural daylight",
      "material_finish": "matte and lightly distressed",
      "aperture_look": "soft white window treatments, warm trim tones, and simple farmhouse framing around existing windows",
      "dont": ["no high-gloss surfaces", "no heavy industrial metal", "no saturated colors", "no ornate gilding", "no ultra-modern forms"],
      "signature_elements": ["shiplap or board-and-batten wall paneling", "open wood shelving with ceramic or enamelware vessels", "galvanized metal or cast iron accent pieces", "linen or grain sack patterned textiles"]
    },
    "pipeline_config": {
      "structural_protocol": "rigid_base",
      "staging_density": "high"
    }
  },
  {
    "id": "coastal",
    "name": "Coastal",
    "model_inputs": {
      "core_materials": ["whitewashed wood", "linen", "rattan"],
      "color_palette": ["crisp white", "sand beige", "soft blue"],
      "lighting_style": "bright natural daylight",
      "material_finish": "matte and weathered",
      "aperture_look": "wide white-framed windows",
      "dont": ["no nautical props", "no dark wood tones", "no black metal frames", "no tropical bright colors", "no cluttered surfaces"],
      "signature_elements": ["seagrass or jute area rug", "weathered driftwood or bleached wood accent pieces", "white or linen slip-covered upholstery", "blue-and-white layered textiles on soft furnishings"]
    },
    "pipeline_config": {
      "structural_protocol": "rigid_aperture_lock",
      "staging_density": "medium"
    },
    "conflict_resolution": [
      "Brightness aspiration: achieve through white or light-blue palette on walls, high-sheen floor tile or light hardwood, and sheer white curtains — never enlarge windows or add openings.",
      "Indoor/outdoor connection aspiration: express through natural fiber materials, weathered wood, and furniture placement near existing windows — not through structural changes to openings.",
      "Wide-framed window aesthetic: express through trim paint color and window treatment style only — never change window geometry, dimensions, or count."
    ]
  },
  {
    "id": "japandi",
    "name": "Japandi",
    "model_inputs": {
      "core_materials": ["light oak", "linen", "limestone"],
      "color_palette": ["warm white", "sand", "muted taupe"],
      "lighting_style": "soft diffuse daylight",
      "material_finish": "matte and natural",
      "aperture_look": "",
      "dont": ["no glossy surfaces", "no bright colors", "no ornate decor", "no visible clutter", "no heavy upholstery"],
      "signature_elements": ["low-profile furniture sitting close to the floor", "wabi-sabi ceramic or stoneware objects", "natural undyed fiber textiles", "minimal asymmetric grouping of functional objects"]
    },
    "pipeline_config": {
      "structural_protocol": "surface_only_transform",
      "staging_density": "low"
    },
    "conflict_resolution": [
      "Natural light aspiration: achieve through pale palette (off-white, warm grey, sand), polished or satin-finish surfaces on floor and walls, and minimal window treatments (sheers only) — never add windows, skylights, or transparent walls.",
      "Airy/open feel aspiration: achieve through furniture restraint and deliberate negative space — never alter wall geometry, add partitions, or remove structural elements.",
      "Minimalism pressure on built-in niches: style niche contents to a single object or leave empty — never remove, fill, or conceal niches."
    ]
  },
  {
    "id": "rustic",
    "name": "Rustic",
    "model_inputs": {
      "core_materials": ["reclaimed wood", "fieldstone", "wrought iron"],
      "color_palette": ["earth brown", "stone gray", "forest green"],
      "lighting_style": "warm directional daylight",
      "material_finish": "raw and textured",
      "aperture_look": "",
      "dont": ["no polished marble", "no sleek glass furniture", "no bright colors", "no chrome finishes", "no refined trim"],
      "signature_elements": ["exposed ceiling beams or rough-hewn timber accent surface", "stone hearth or fieldstone wall surface treatment", "chunky handwoven throw textiles and hide rugs", "wrought iron hardware and fixture accents"]
    },
    "pipeline_config": {
      "structural_protocol": "rigid_base",
      "staging_density": "high"
    }
  },
  {
    "id": "bohemian",
    "name": "Bohemian",
    "model_inputs": {
      "core_materials": ["rattan", "woven textiles", "aged wood"],
      "color_palette": ["terracotta", "ochre", "teal"],
      "lighting_style": "bright natural daylight",
      "material_finish": "matte and textured",
      "aperture_look": "",
      "dont": ["no minimal staging", "no matching furniture sets", "no glossy finishes", "no monochrome palette", "no rigid symmetry"],
      "signature_elements": ["macramé or woven wall hangings", "layered patterned rugs and textiles aligned to the warm palette", "abundant indoor plants (at least three visible)", "rattan or cane accent furniture pieces"]
    },
    "pipeline_config": {
      "structural_protocol": "rigid_base",
      "staging_density": "high"
    }
  },
  {
    "id": "biophilic",
    "name": "Biophilic",
    "model_inputs": {
      "core_materials": ["light oak", "river stone", "indoor plants"],
      "color_palette": ["leaf green", "warm white", "soil brown"],
      "lighting_style": "dappled natural daylight",
      "material_finish": "matte and natural",
      "aperture_look": "large garden-facing glass openings",
      "dont": ["no artificial plants", "no neon lighting", "no dark enclosed corners", "no glossy finishes", "no synthetic textures"],
      "signature_elements": ["grouped large-leaf potted plants as primary decor", "hanging or trailing vine planters near windows or walls", "natural live-edge or slab wood surfaces", "stone or moss-covered accent texture on a surface"]
    },
    "pipeline_config": {
      "structural_protocol": "rigid_aperture_lock",
      "staging_density": "high"
    }
  },
  {
    "id": "french_country",
    "name": "French Country",
    "model_inputs": {
      "core_materials": ["limestone", "washed oak", "linen"],
      "color_palette": ["cream", "muted blue", "pale taupe"],
      "lighting_style": "soft filtered daylight",
      "material_finish": "matte and gently aged",
      "aperture_look": "tall divided-pane French windows",
      "dont": ["no stark black palette", "no ultra-modern furniture", "no exposed ductwork", "no high-gloss surfaces", "no sharp minimal lines"],
      "signature_elements": ["exposed ceiling beams or painted plank ceiling detail", "distressed painted cabinetry or armoire furniture", "toile or delicate floral patterned textiles", "wrought iron or aged bronze hardware and fixtures"]
    },
    "pipeline_config": {
      "structural_protocol": "rigid_aperture_lock",
      "staging_density": "medium"
    }
  },
  {
    "id": "japanese",
    "name": "Japanese",
    "model_inputs": {
      "core_materials": ["hinoki wood", "shoji paper", "river stone"],
      "color_palette": ["off-white", "light tan", "charcoal"],
      "lighting_style": "soft diffused daylight",
      "material_finish": "matte and natural",
      "aperture_look": "shoji screen openings",
      "dont": ["no bright colors", "no tall bulky furniture", "no ornate decoration", "no glossy finishes", "no exposed metal frames"],
      "signature_elements": ["shoji screen panels as room dividers or window treatments", "tatami mat areas or low platform floor seating", "ikebana-style asymmetric floral arrangement", "engawa-style minimal ledge or threshold element"]
    },
    "pipeline_config": {
      "structural_protocol": "rigid_aperture_lock",
      "staging_density": "low"
    }
  },
  {
    "id": "neoclassic",
    "name": "Neoclassic",
    "model_inputs": {
      "core_materials": ["painted paneling", "white marble", "brushed brass"],
      "color_palette": ["ivory", "stone gray", "muted gold"],
      "lighting_style": "balanced frontal daylight",
      "material_finish": "smooth matte with polished accents",
      "aperture_look": "tall symmetrical openings",
      "dont": ["no exposed brick", "no rustic distressing", "no asymmetrical openings", "no bright colors", "no cluttered decor"],
      "signature_elements": ["wall paneling or wainscoting as a surface treatment", "symmetrical framed art groupings on walls", "layered drapery with tiebacks on windows", "tufted or fluted upholstery on seating pieces"]
    },
    "pipeline_config": {
      "structural_protocol": "rigid_aperture_lock",
      "staging_density": "medium"
    }
  },
  {
    "id": "vintage",
    "name": "Vintage",
    "model_inputs": {
      "core_materials": ["aged walnut", "velvet", "antique brass"],
      "color_palette": ["dusty rose", "olive green", "walnut brown"],
      "lighting_style": "soft natural daylight",
      "material_finish": "soft patina and low sheen",
      "aperture_look": "",
      "dont": ["no ultra-modern minimalism", "no high-gloss finishes", "no stark monochrome palette", "no plastic furniture", "no oversized modern lighting"],
      "signature_elements": ["velvet or brocade upholstery on seating pieces", "ornate dark-wood furniture with curved profiles", "layered mismatched antique frames grouped on walls", "brass or gold-toned decorative objects and hardware"]
    },
    "pipeline_config": {
      "structural_protocol": "rigid_base",
      "staging_density": "high"
    }
  }
];
