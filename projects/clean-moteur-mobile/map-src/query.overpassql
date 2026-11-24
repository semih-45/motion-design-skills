[out:json][timeout:120];
(
  way["highway"~"^(motorway|trunk|primary|secondary|tertiary|unclassified|residential|living_street|pedestrian|service)$"](47.884,1.890,47.918,1.926);
  way["building"](47.884,1.890,47.918,1.926);
  way["natural"="water"](47.880,1.880,47.922,1.936);
  relation["natural"="water"](47.880,1.880,47.922,1.936);
  way["waterway"="riverbank"](47.880,1.880,47.922,1.936);
  way["leisure"~"^(park|garden)$"](47.884,1.890,47.918,1.926);
  way["landuse"~"^(grass|recreation_ground)$"](47.884,1.890,47.918,1.926);
  way["railway"="rail"](47.884,1.890,47.918,1.926);
);
out geom;
