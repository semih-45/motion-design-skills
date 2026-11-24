"""Builds src/data/orleans.json from OpenStreetMap tiles of central Orléans.

Data © OpenStreetMap contributors (ODbL). Tiles were fetched from the OSM API (api/0.6/map) into
OSM_DIR (20 tiles of 0.005° covering lon 1.897–1.917, lat 47.887–47.912).
Output is in local metres: x = east, y = south (north is up on screen), origin ORIGIN.

  python3 map-src/build_orleans.py [OSM_DIR]
"""
import glob
import heapq
import json
import math
import os
import random
import sys
import xml.etree.ElementTree as ET

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OSM_DIR = sys.argv[1] if len(sys.argv) > 1 else '/tmp/claude-0/osm'
ORIGIN = (1.9070, 47.9010)  # lon, lat (≈ Place du Martroi / Rue Royale)
KX = math.cos(math.radians(ORIGIN[1])) * 111320
KY = 110574

# Fictional-free addresses: street names only (no house numbers), so no one's actual home is shown.
START_STREET = 'Avenue Dauphine'
HOME_STREET = "Rue Jeanne d'Arc"
OFFICE_STREET = 'Boulevard Alexandre Martin'
START_NEAR = (1.9060, 47.8962)
HOME_NEAR = (1.90646, 47.90163)
OFFICE_NEAR = (1.9100, 47.9068)


def proj(lon, lat):
    return ((lon - ORIGIN[0]) * KX, -(lat - ORIGIN[1]) * KY)


nodes, ways, rels = {}, {}, {}
for f in sorted(glob.glob(os.path.join(OSM_DIR, 't-*.osm'))):
    r = ET.parse(f).getroot()
    for n in r.iter('node'):
        nodes[n.get('id')] = (float(n.get('lon')), float(n.get('lat')))
    for w in r.iter('way'):
        ways[w.get('id')] = ([nd.get('ref') for nd in w.iter('nd')], {t.get('k'): t.get('v') for t in w.iter('tag')})
    for rl in r.iter('relation'):
        rels[rl.get('id')] = ([(m.get('type'), m.get('ref'), m.get('role')) for m in rl.iter('member')], {t.get('k'): t.get('v') for t in rl.iter('tag')})
print(f'{len(nodes)} nodes, {len(ways)} ways, {len(rels)} relations')


def pts_of(nd):
    return [proj(*nodes[i]) for i in nd if i in nodes]


def dp(pts, eps):
    """Douglas-Peucker simplification."""
    if len(pts) < 3:
        return pts
    a, b = pts[0], pts[-1]
    dx, dy = b[0] - a[0], b[1] - a[1]
    L = math.hypot(dx, dy) or 1e-9
    dmax, idx = 0, 0
    for i in range(1, len(pts) - 1):
        d = abs(dy * pts[i][0] - dx * pts[i][1] + b[0] * a[1] - b[1] * a[0]) / L
        if d > dmax:
            dmax, idx = d, i
    if dmax > eps:
        return dp(pts[: idx + 1], eps)[:-1] + dp(pts[idx:], eps)
    return [a, b]


def dp_ring(pts, eps):
    """Simplify a closed ring (first point not repeated): split at the farthest vertex."""
    if len(pts) < 4:
        return pts
    far = max(range(len(pts)), key=lambda i: math.dist(pts[0], pts[i]))
    a = dp(pts[: far + 1], eps)
    b = dp(pts[far:] + [pts[0]], eps)
    return a[:-1] + b[:-1]


def rnd(pts):
    return [[round(x, 1), round(y, 1)] for x, y in pts]


def area(pts):
    return 0.5 * abs(sum(pts[i][0] * pts[(i + 1) % len(pts)][1] - pts[(i + 1) % len(pts)][0] * pts[i][1] for i in range(len(pts))))


# ---------------- roads
CLS = {
    'trunk': ('major', 20), 'primary': ('major', 18), 'secondary': ('major', 15), 'primary_link': ('major', 10), 'secondary_link': ('major', 10),
    'tertiary': ('medium', 12), 'tertiary_link': ('medium', 9), 'unclassified': ('minor', 9), 'residential': ('minor', 9),
    'living_street': ('minor', 8), 'pedestrian': ('ped', 8), 'service': ('service', 5),
}
roads = []
for wid, (nd, t) in ways.items():
    hw = t.get('highway')
    if hw not in CLS or t.get('area') == 'yes':
        continue
    p = pts_of(nd)
    if len(p) < 2:
        continue
    c, w = CLS[hw]
    roads.append({'c': c, 'w': w, 'n': t.get('name', ''), 'p': rnd(dp(p, 0.8))})

# ---------------- buildings
buildings = []
landmarks = []
rng = random.Random(7)
for wid, (nd, t) in ways.items():
    if 'building' not in t or len(nd) < 4 or nd[0] != nd[-1]:
        continue
    p = pts_of(nd[:-1])
    if len(p) < 3:
        continue
    p = dp_ring(p, 0.6)
    if len(p) < 3 or area(p) < 18:
        continue
    h = None
    if 'height' in t:
        try:
            h = float(t['height'].replace('m', '').strip())
        except ValueError:
            h = None
    if h is None and 'building:levels' in t:
        try:
            h = float(t['building:levels']) * 3.2 + 1.5
        except ValueError:
            h = None
    if h is None:
        h = rng.choice([9, 11, 12.5, 14, 15.5, 17])
    name = t.get('name', '')
    if 'Sainte-Croix' in name and ('Cathédrale' in name or t.get('building') == 'cathedral'):
        h = max(h, 48)
        cx = sum(q[0] for q in p) / len(p)
        cy = sum(q[1] for q in p) / len(p)
        landmarks.append({'name': 'Cathédrale Sainte-Croix', 'x': round(cx, 1), 'y': round(cy, 1)})
    buildings.append({'h': round(min(h, 60), 1), 'p': rnd(p)})

# ---------------- water (Loire multipolygon outer chains) + parks
def join_chains(segs):
    segs = [list(s) for s in segs]
    chains = []
    while segs:
        ch = segs.pop()
        changed = True
        while changed:
            changed = False
            for i, s in enumerate(segs):
                if s[0] == ch[-1]:
                    ch += s[1:]
                elif s[-1] == ch[-1]:
                    ch += s[::-1][1:]
                elif s[-1] == ch[0]:
                    ch = s[:-1] + ch
                elif s[0] == ch[0]:
                    ch = s[::-1][:-1] + ch
                else:
                    continue
                segs.pop(i)
                changed = True
                break
        chains.append(ch)
    return chains


water = []
for rid, (members, t) in rels.items():
    if t.get('natural') == 'water' or t.get('waterway') == 'riverbank':
        outer = [ways[ref][0] for typ, ref, role in members if typ == 'way' and role in ('outer', '') and ref in ways]
        for ch in join_chains(outer):
            closed = ch[0] == ch[-1]
            p = pts_of(ch[:-1] if closed else ch)
            if len(p) > 2:
                water.append({'closed': closed, 'p': rnd(dp_ring(p, 1.5) if closed else dp(p, 1.5))})
for wid, (nd, t) in ways.items():
    if (t.get('natural') == 'water' or t.get('waterway') == 'riverbank') and nd and nd[0] == nd[-1]:
        p = pts_of(nd[:-1])
        if len(p) > 3:
            water.append({'closed': True, 'p': rnd(dp_ring(p, 1.5))})
river_center = []
for wid, (nd, t) in ways.items():
    if t.get('waterway') == 'river' and t.get('name') == 'La Loire':
        river_center.append(rnd(dp(pts_of(nd), 3)))

parks = []
for wid, (nd, t) in ways.items():
    if (t.get('leisure') in ('park', 'garden') or t.get('landuse') in ('grass', 'recreation_ground')) and nd and nd[0] == nd[-1]:
        p = pts_of(nd[:-1])
        if len(p) > 3 and area(p) > 150:
            parks.append(rnd(dp_ring(p, 1.0)))

# ---------------- routing graph (driveable streets, one-ways ignored, main roads preferred)
COST = {'trunk': 0.7, 'primary': 0.7, 'secondary': 0.75, 'primary_link': 0.8, 'secondary_link': 0.8, 'tertiary': 0.85, 'tertiary_link': 0.9,
        'unclassified': 1.0, 'residential': 1.0, 'living_street': 1.4}
adj = {}
street_nodes = {}
for wid, (nd, t) in ways.items():
    hw = t.get('highway')
    if hw not in COST:
        continue
    for a, b in zip(nd, nd[1:]):
        if a not in nodes or b not in nodes:
            continue
        pa, pb = proj(*nodes[a]), proj(*nodes[b])
        d = math.hypot(pa[0] - pb[0], pa[1] - pb[1]) * COST[hw]
        adj.setdefault(a, []).append((b, d))
        adj.setdefault(b, []).append((a, d))
    if 'name' in t:
        street_nodes.setdefault(t['name'], set()).update(i for i in nd if i in nodes)


def nearest_on(street, near):
    px = proj(*near)
    best = min(street_nodes[street], key=lambda i: math.dist(proj(*nodes[i]), px))
    return best


def dijkstra(s, g):
    dist = {s: 0}
    prev = {}
    pq = [(0, s)]
    while pq:
        d, u = heapq.heappop(pq)
        if u == g:
            break
        if d > dist.get(u, 1e18):
            continue
        for v, w in adj.get(u, []):
            nd_ = d + w
            if nd_ < dist.get(v, 1e18):
                dist[v] = nd_
                prev[v] = u
                heapq.heappush(pq, (nd_, v))
    path = [g]
    while path[-1] != s:
        path.append(prev[path[-1]])
    return path[::-1]


s = nearest_on(START_STREET, START_NEAR)
h = nearest_on(HOME_STREET, HOME_NEAR)
o = nearest_on(OFFICE_STREET, OFFICE_NEAR)
leg1 = dijkstra(s, h)
leg2 = dijkstra(h, o)
route = [proj(*nodes[i]) for i in leg1] + [proj(*nodes[i]) for i in leg2[1:]]
route_len = sum(math.dist(route[i], route[i + 1]) for i in range(len(route) - 1))
home_len = sum(math.dist(route[i], route[i + 1]) for i in range(len(leg1) - 1))
print(f'route {route_len:.0f} m (home at {home_len:.0f} m)')

# street names along the route (for the report)
wnames = {}
for wid, (nd, t) in ways.items():
    if 'name' in t and t.get('highway') in COST:
        for i in nd:
            wnames.setdefault(i, t['name'])
seq = []
for i in leg1 + leg2:
    n = wnames.get(i)
    if n and (not seq or seq[-1] != n):
        seq.append(n)
print('via:', ' → '.join(seq))

# ---------------- labels: longest segment of selected streets
LABEL_STREETS = ['Rue Royale', 'Rue de la République', 'Rue Bannier', 'Boulevard Alexandre Martin', 'Avenue Dauphine', 'Rue de la Bretonnerie',
                 'Quai du Châtelet', "Rue Jeanne d'Arc", 'Rue de Bourgogne', 'Quai Cypierre', 'Boulevard Rocheplatte', 'Rue du Faubourg Bannier',
                 'Quai de Prague', 'Rue Saint-Marceau', 'Pont George V', "Rue d'Illiers", 'Rue des Carmes', 'Rue Sainte-Catherine']
labels = []
for name in LABEL_STREETS:
    best = None
    for r in roads:
        if r['n'] != name:
            continue
        for a, b in zip(r['p'], r['p'][1:]):
            L = math.dist(a, b)
            if best is None or L > best[0]:
                best = (L, a, b)
    if best and best[0] > 40:
        L, a, b = best
        labels.append({'n': name, 'x': round((a[0] + b[0]) / 2, 1), 'y': round((a[1] + b[1]) / 2, 1), 'dx': round((b[0] - a[0]) / L, 3), 'dy': round((b[1] - a[1]) / L, 3)})
places = [{'n': 'Place du Martroi', 'x': 0, 'y': 0}]
mart = [r for r in roads if r['n'] == 'Place du Martroi']
if mart:
    pts = [q for r in mart for q in r['p']]
    places[0] = {'n': 'Place du Martroi', 'x': round(sum(q[0] for q in pts) / len(pts), 1), 'y': round(sum(q[1] for q in pts) / len(pts), 1)}
if river_center:
    rc = max(river_center, key=len)
    mid = rc[len(rc) // 2]
    places.append({'n': 'La Loire', 'x': mid[0], 'y': mid[1]})

out = {
    'attribution': '© OpenStreetMap contributors (ODbL)',
    'origin': ORIGIN,
    'roads': roads,
    'buildings': buildings,
    'water': water,
    'riverCenter': river_center,
    'parks': parks,
    'route': rnd(dp(route, 0.5)),
    'routeLen': round(route_len, 1),
    'homeLen': round(home_len, 1),
    'start': rnd([proj(*nodes[s])])[0],
    'home': rnd([proj(*nodes[h])])[0],
    'office': rnd([proj(*nodes[o])])[0],
    'homeStreet': HOME_STREET,
    'officeStreet': OFFICE_STREET,
    'labels': labels,
    'places': places,
    'landmarks': landmarks,
}
os.makedirs(os.path.join(ROOT, 'src', 'data'), exist_ok=True)
p = os.path.join(ROOT, 'src', 'data', 'orleans.json')
json.dump(out, open(p, 'w'), separators=(',', ':'), ensure_ascii=False)
print(f'wrote {p} ({os.path.getsize(p) / 1e6:.2f} MB): {len(roads)} roads, {len(buildings)} buildings, {len(water)} water, {len(parks)} parks, {len(labels)} labels, landmarks {landmarks}')
