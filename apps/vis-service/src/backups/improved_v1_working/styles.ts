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
  };
  pipeline_config: {
    structural_protocol: string;
  };
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
      "dont": ["no ornate molding", "no heavy drapery", "no saturated colors", "no distressed wood", "no layered decor"]
    },
    "pipeline_config": {
      "structural_protocol": "rigid_base"
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
      "dont": ["no false walls", "no ornate trim", "no vintage ornament", "no bright primary colors", "no busy patterns"]
    },
    "pipeline_config": {
      "structural_protocol": "rigid_aperture_lock"
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
      "dont": ["no visible clutter", "no layered objects", "no decorative patterns", "no mixed finishes", "no statement decor"]
    },
    "pipeline_config": {
      "structural_protocol": "surface_only_transform"
    }
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
      "dont": ["no false walls", "no ornate molding", "no glossy marble", "no pastel colors", "no plush furniture"]
    },
    "pipeline_config": {
      "structural_protocol": "rigid_aperture_lock"
    }
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
      "dont": ["no gray monochrome palette", "no ornate molding", "no chrome glam finishes", "no bulky furniture", "no farmhouse decor"]
    },
    "pipeline_config": {
      "structural_protocol": "rigid_aperture_lock"
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
      "aperture_look": "white divided-pane windows",
      "dont": ["no high-gloss surfaces", "no heavy industrial metal", "no saturated colors", "no ornate gilding", "no ultra-modern forms"]
    },
    "pipeline_config": {
      "structural_protocol": "rigid_base"
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
      "dont": ["no nautical props", "no dark wood tones", "no black metal frames", "no tropical bright colors", "no cluttered surfaces"]
    },
    "pipeline_config": {
      "structural_protocol": "rigid_aperture_lock"
    }
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
      "dont": ["no glossy surfaces", "no bright colors", "no ornate decor", "no visible clutter", "no heavy upholstery"]
    },
    "pipeline_config": {
      "structural_protocol": "surface_only_transform"
    }
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
      "dont": ["no polished marble", "no sleek glass furniture", "no bright colors", "no chrome finishes", "no refined trim"]
    },
    "pipeline_config": {
      "structural_protocol": "rigid_base"
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
      "dont": ["no minimal staging", "no matching furniture sets", "no glossy finishes", "no monochrome palette", "no rigid symmetry"]
    },
    "pipeline_config": {
      "structural_protocol": "rigid_base"
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
      "dont": ["no artificial plants", "no neon lighting", "no dark enclosed corners", "no glossy finishes", "no synthetic textures"]
    },
    "pipeline_config": {
      "structural_protocol": "rigid_aperture_lock"
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
      "dont": ["no stark black palette", "no ultra-modern furniture", "no exposed ductwork", "no high-gloss surfaces", "no sharp minimal lines"]
    },
    "pipeline_config": {
      "structural_protocol": "rigid_aperture_lock"
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
      "dont": ["no bright colors", "no tall bulky furniture", "no ornate decoration", "no glossy finishes", "no exposed metal frames"]
    },
    "pipeline_config": {
      "structural_protocol": "rigid_aperture_lock"
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
      "dont": ["no exposed brick", "no rustic distressing", "no asymmetrical openings", "no bright colors", "no cluttered decor"]
    },
    "pipeline_config": {
      "structural_protocol": "rigid_aperture_lock"
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
      "dont": ["no ultra-modern minimalism", "no high-gloss finishes", "no stark monochrome palette", "no plastic furniture", "no oversized modern lighting"]
    },
    "pipeline_config": {
      "structural_protocol": "rigid_base"
    }
  }
];
