'use strict';
import * as d3 from 'd3';
import { xml, range } from 'd3';
type num = number;
interface vec {
  x: num;
  y: num;
}
type points = vec[];
type dir = 'N' | 'E' | 'S' | 'W';
type Primitive = number | string | boolean | Date;
interface voxelPt {
  x: num;
  y: num;
  height: num;
  neighbours: Map<dir, voxelPt>;
}
type size = { width: num; height: num };

function runif(lo: num, hi: num) {
  return lo + Math.random() * (hi - lo);
}

const rnorm = (() => {
  let z2: number | null = null;
  function rnorm() {
    if (z2 != null) {
      let tmp = z2;
      z2 = null;
      return tmp;
    }
    let x1 = 0;
    let x2 = 0;
    let w = 2.0;
    while (w >= 1) {
      x1 = runif(-1, 1);
      x2 = runif(-1, 1);
      w = x1 * x1 + x2 * x2;
    }
    w = Math.sqrt((-2 * Math.log(w)) / w);
    z2 = x2 * w;
    return x1 * w;
  }
  return rnorm;
})();

function randomVector(scale: number) {
  return { x: scale * rnorm(), y: scale * rnorm() } as vec;
}
interface extent {
  width: number;
  height: number;
}
const defaultSize = {
  /** Width */
  width: 100,
  /** Height */
  height: 100,
} as size;

function generatePoints(sz?: size) {
  const size = sz ?? defaultSize;
  var pts = new Array<voxelPt[]>(size.height).fill(
    new Array<voxelPt>(size.width)
  );
  d3.range(size.height).map(y => {
    d3.range(size.width).map(x => {
      pts[x][y] = {
        x,
        y,
        height: 0,
        neighbours: new Map(),
      };
    });
  });
  // debugger;
  return pts;
}

// function centroid(pts: vec[]) {
//   var x = 0;
//   var y = 0;
//   for (var i = 0; i < pts.length; i++) {
//     x += pts[i][0];
//     y += pts[i][1];
//   }
//   return [x / pts.length, y / pts.length];
// }

// function improvePoints(pts: points, n: number, extent: extent) {
//   n = n || 1;
//   let expPoints: points;
//   extent = extent || defaultSize;
//   for (var i = 0; i < n; i++) {
//     expPoints = terVoroni(pts, extent)
//       .polygons()
//       .map(centroid) as vec[];
//   }
//   return pts;
// }

// function generateGoodPoints(n: number, extent: extent) {
//   extent = extent || defaultSize;
//   var pts = generatePoints(n, extent);
//   pts = pts.sort(function(a, b) {
//     return a[0] - b[0];
//   });
//   return improvePoints(pts, 1, extent);
// }

// function terVoroni(pts: points, extent: extent) {
//   extent = extent || defaultSize;
//   var w = extent.width;
//   var h = extent.height;
//   return d3.voronoi().extent([
//     [0, 0],
//     [w, h],
//   ])(pts);
// }
function map2d<T>(
  matrix: T[][],
  callback: (data: T, x: num, y: num) => T | void
) {
  return matrix.map((arr, y) => arr.map((value, x) => callback(value, x, y)));
}
interface vertexID {
  [i: number]: num;
}
interface meshed extends Array<voxelPt[]> {
  mesh: Mesh;
}
interface downhillVx {
  downhillHeight:num;
  downHillPosition: vec;
  cellIsEdge: boolean;
  isSink:boolean
}
class Mesh {
  points: number[] = [];
  size: size = defaultSize;
  downhill?: downhillVx[];
  constructor(size?: size, heightMap?: number[]) {
    if (size) this.size = size;
    if (heightMap) heightMap.map((i, v) => (this.points[i] = v));
    else {
      this.points = range(this.size.width * this.size.height).map(i => 0);
    }
  }
  get length() {
    return this.points.length
  }
  map(callback: (vx: number, pos: vec, points: number[]) => number) {
    const newPoints = this.points.map((v, i) => {
      let vec = this.vecFromInt(i)
      return callback(v, vec, this.points);
    });
    return new Mesh(this.size, newPoints);
  }
  getPoint(x: num|vec, y?: num) {
    if ( x.hasOwnProperty('x') && !y) return this.points[(x as vec).y * this.size.width + (x as vec).x]; else {
    return this.points[y! * this.size.width + (x as num)];
    }
  }
  getIndex(x: num|vec, y?: num) {
    if ( x.hasOwnProperty('x') && !y) return (x as vec).y * this.size.width + (x as vec).x; else {
    return y! * this.size.width + (x as num);
    }
  }
  neighbours(x: num, y: num) {
    const neighbourIndexes = [
      { x: -1, y: 0 },
      { x: 0, y: -1 },
      { x: 1, y: 0 },
      { x: 0, y: 1 },
    ];
    const neighbours: vec[] = [];
    neighbourIndexes.map(({ x: nx, y: ny }) => {
      const px = x + nx;
      if (px < 0 || px > this.size.width) return;
      const py = y + ny;
      if (py < 0 || py > this.size.height) return;
      neighbours.push({ x: px, y: py });
    });
    return neighbours;
  }
  vecFromInt(i:num) {
    return { 
      x: i % this.size.width,
      y: Math.floor(i / this.size.width),
    } as vec;
// }
// function makeMesh(sz?: size) {
//   const size = sz ?? defaultSize;
//   let points = generatePoints(size);
//   const neighbourIndexes = [
//     [-1, 0],
//     [0, -1],
//     [1, 0],
//     [0, 1],
//   ];
//   const dirMap: dir[] = ['W', 'N', 'W', 'S'];
//   map2d(points, (d, x, y) => {
//     neighbourIndexes.map((nIX, i) => {
//       const [nx, ny] = nIX;
//       const [px, py] = [d.x + nx, d.y + ny];
//       if (px < 0 || px > size.width || py < 0 || py > size.height) return;
//       d.neighbours.set(dirMap[i], points[px][py]);
//     });
//   });
//   //   var e = vor.edges[i];
//   //   if (e == undefined) continue;
//   //   var e0 = vxids[e[0]];
//   //   var e1 = vxids[e[1]];
//   //   if (e0 == undefined) {
//   //     e0 = vxs.length;
//   //     vxids[e[0]] = e0;
//   //     vxs.push(e[0]);
//   //   }
//   //   if (e1 == undefined) {
//   //     e1 = vxs.length;
//   //     vxids[e[1]] = e1;
//   //     vxs.push(e[1]);
//   //   }
//   //   adj[e0] = adj[e0] || [];
//   //   adj[e0].push(e1);
//   //   adj[e1] = adj[e1] || [];
//   //   adj[e1].push(e0);
//   //   edges.push([e0, e1, e.left, e.right]);
//   //   tris[e0] = tris[e0] || [];
//   //   if (!tris[e0].includes(e.left)) tris[e0].push(e.left);
//   //   if (e.right && !tris[e0].includes(e.right)) tris[e0].push(e.right);
//   //   tris[e1] = tris[e1] || [];
//   //   if (!tris[e1].includes(e.left)) tris[e1].push(e.left);
//   //   if (e.right && !tris[e1].includes(e.right)) tris[e1].push(e.right);
//   // }

//   let mesh: Mesh = {
//     points,
//     size: size,
//     map: f => {
//       let mapped: any = new Array(size.width).fill(new Array(size.height));

//       mapped = points.map((arr, y) =>
//         arr.map((pt, x) => f(pt, { x, y }, points))
//       );
//       mapped.mesh = mesh;

//       return mapped as meshed;
//     },
//   };

//   return mesh;
// }

// function generateGoodMesh(n, extent) {
//   extent = extent || defaultSize;
//   var pts = generateGoodPoints(n, extent);
//   return makeMesh(pts, extent);
// }
function isedge(mesh: Mesh, pos: vec) {
  return mesh.neighbours(pos.x, pos.y).length < 4;
}

function isnearedge(mesh: Mesh, { x: px, y: py }: vec) {
  var x = px;
  var y = py;
  var w = mesh.size.width;
  var h = mesh.size.height;
  return x < -0.45 * w || x > 0.45 * w || y < -0.45 * h || y > 0.45 * h;
}

function neighbours(mesh: Mesh, { x: px, y: py }: vec) {
  var onbs = mesh.neighbours(px, py);
  var nbs: vec[] = [];
  onbs.forEach(nb => nbs.push(nb));
  return nbs;
}

function distance(mesh: Mesh, a: vec, b: vec) {
  var p = a;
  var q = b;
  return Math.sqrt((p.x - q.x) * (p.x - q.x) + (p.y - q.y) * (p.y - q.y));
}

function quantile<T extends any>(h: T[], q: number) {
  var sortedh = [];
  for (var i = 0; i < h.length; i++) {
    sortedh[i] = h[i];
  }
  sortedh.sort(d3.ascending);
  return d3.quantile(sortedh, q);
}

function zero(mesh: Mesh) {
  return mesh.map(vx => 0);
}

function slope(mesh: Mesh, direction: vec) {
  return mesh.map((n,p) => {
    return p.x * direction.x + p.y * direction.y;
  });
}

function cone(mesh:Mesh, slope:number) {
  return mesh.map((v,p)=> {
    return Math.pow(p.x * p.x + p.y * p.y, 0.5) * slope;
  });
}
type meshVxFunc = (vx:number,pos:vec,points:number[]) => number;
function map(h:Mesh, f:meshVxFunc) {
  var newh = h.map(f);
  return newh;
}

function normalize(h:Mesh) {
  var lo = d3.min(h.points)!;
  var hi = d3.max(h.points)!;
  return h.map( x => {
    return (x - lo) / (hi - lo);
  });
}

function peaky(h:Mesh) {
  return normalize(h).map( Math.sqrt);
}

function add(...args:Mesh[]) {
  var n = args[0].points.length;
  var newvals = zero(arguments[0]);
  for (var i = 0; i < n; i++) {
    for (var j = 0; j < arguments.length; j++) {
      newvals.points[i] += arguments[j].points[i];
    }
  }
  return newvals;
}

function mountains(mesh:Mesh, number:num, radius:num) {
  radius = radius || 0.05;
  var mounts = [];
  for (var i = 0; i < number; i++) {
    mounts.push({
      x:mesh.size.width * (Math.random() - 0.5),
      y:mesh.size.height * (Math.random() - 0.5),
    });
  }
  var newvals = zero(mesh);
  for (var i = 0; i < mesh.points.length; i++) {
    var p = mesh.points[i];
    const {x,y} = mesh.vecFromInt(i);
    for (var j = 0; j < number; j++) {
      var m = mounts[j];
      newvals.points[i] += Math.pow(
        Math.exp(
          -((x - m.x) * (x - m.x) + (y - m.y) * (y - m.y)) /
            (2 * radius * radius)
        ),
        2
      );
    }
  }
  return newvals;
}

function relax(h:Mesh) {
  var newh = zero(h);
  for (var i = 0; i < h.points.length; i++) {
    var nbs = neighbours(h, h.vecFromInt(i));
    if (nbs.length < 3) {
      newh.points[i] = 0;
      continue;
    }
    newh.points[i] = d3.mean(
      nbs.map(function(j) {
        return h.getPoint(j.x,j.y);
      })
    )!;
  }
  return newh;
}

function downhill(h:Mesh) {
  function downfrom(i:vec) {
    let cellIsEdge = false;
    let isSink = true;
    if (isedge(h, i)) cellIsEdge = true;
    var bestPos: vec = {x:-1,y:-1};
    var besth = h.getPoint(i.x,i.y);
    var nbs = neighbours(h, i);
    if (!cellIsEdge){
      for (var j = 0; j < nbs.length; j++) {
        if (h.getPoint(nbs[j]) < besth) {
        besth = h.getPoint(nbs[j]);
        bestPos = nbs[j];
        isSink = false;
        }
      }
    }
    
    return {cellIsEdge,downHillPosition:bestPos,downhillHeight:besth,isSink} as downhillVx;
  }
  var downs:downhillVx[] = [];
  for (var i = 0; i < h.points.length; i++) {
    downs[i] = downfrom(h.vecFromInt(i));
  }
  h.downhill = downs;
  return downs;
}

function findSinks(h:Mesh) {
  var dh = downhill(h);
  var sinks = [];
  for (var i = 0; i < dh.length; i++) {
    var node = dh[i];
    while (true) {
      if (node.cellIsEdge) {
        sinks[i] = -2;
        break;
      }
      if (node.isSink) {
        sinks[i] = node;
        break;
      }
      node = dh[h.getIndex(node.downHillPosition)];
    }
  }
}

function fillSinks(h:Mesh, epsilon?:number) {
  epsilon = epsilon || 1e-5;
  var infinity = 999999;
  var newh = zero(h);
  for (var i = 0; i < h.length; i++) {
    if (isnearedge(h, h.vecFromInt(i))) {
      newh.points[i] = h.points[i];
    } else {
      newh.points[i] = infinity;
    }
  }
  while (true) {
    var changed = false;
    for (var i = 0; i < h.length; i++) {
      if (newh.points[i] == h.points[i]) continue;
      var nbs = neighbours(h, h.vecFromInt(i));
      for (var j = 0; j < nbs.length; j++) {
        if (h.points[i] >= newh.getPoint(nbs[j]) + epsilon) {
          newh.points[i] = h.points[i];
          changed = true;
          break;
        }
        var oh = newh.getPoint(nbs[j]) + epsilon;
        if (newh.points[i] > oh && oh > h.points[i]) {
          newh.points[i] = oh;
          changed = true;
        }
      }
    }
    if (!changed) return newh;
  }
}

function getFlux(h:Mesh) {
  var dh = downhill(h);
  var idxs:number[] = [];
  var flux = zero(h);
  for (var i = 0; i < h.length; i++) {
    idxs[i] = i;
    flux.points[i] = 1 / h.length;
  }
  idxs.sort(function(a, b) {
    return h.points[b] - h.points[a];
  });
  for (var i = 0; i < h.length; i++) {
    var j = idxs[i];
    if (!dh[j].isSink && !dh[j].cellIsEdge) {
      flux.points[h.getIndex(dh[j].downHillPosition)] += flux.points[j];
    }
  }
  return flux;
}

function getSlope(h:Mesh) {
  var dh = downhill(h);
  var slope = zero(h);
  for (var i = 0; i < h.length; i++) {
    var s = trislope(h, i);
    slope[i] = Math.sqrt(s[0] * s[0] + s[1] * s[1]);
    continue;
    if (dh[i] < 0) {
      slope[i] = 0;
    } else {
      slope[i] = (h[i] - h[dh[i]]) / distance(h.mesh, i, dh[i]);
    }
  }
  return slope;
}

function erosionRate(h) {
  var flux = getFlux(h);
  var slope = getSlope(h);
  var newh = zero(h.mesh);
  for (var i = 0; i < h.length; i++) {
    var river = Math.sqrt(flux[i]) * slope[i];
    var creep = slope[i] * slope[i];
    var total = 1000 * river + creep;
    total = total > 200 ? 200 : total;
    newh[i] = total;
  }
  return newh;
}

function erode(h, amount) {
  var er = erosionRate(h);
  var newh = zero(h.mesh);
  var maxr = d3.max(er);
  for (var i = 0; i < h.length; i++) {
    newh[i] = h[i] - amount * (er[i] / maxr);
  }
  return newh;
}

function doErosion(h, amount, n) {
  n = n || 1;
  h = fillSinks(h);
  for (var i = 0; i < n; i++) {
    h = erode(h, amount);
    h = fillSinks(h);
  }
  return h;
}

function setSeaLevel(h, q) {
  var newh = zero(h.mesh);
  var delta = quantile(h, q);
  for (var i = 0; i < h.length; i++) {
    newh[i] = h[i] - delta;
  }
  return newh;
}

function cleanCoast(h, iters) {
  for (var iter = 0; iter < iters; iter++) {
    var changed = 0;
    var newh = zero(h.mesh);
    for (var i = 0; i < h.length; i++) {
      newh[i] = h[i];
      var nbs = neighbours(h.mesh, i);
      if (h[i] <= 0 || nbs.length != 3) continue;
      var count = 0;
      var best = -999999;
      for (var j = 0; j < nbs.length; j++) {
        if (h[nbs[j]] > 0) {
          count++;
        } else if (h[nbs[j]] > best) {
          best = h[nbs[j]];
        }
      }
      if (count > 1) continue;
      newh[i] = best / 2;
      changed++;
    }
    h = newh;
    newh = zero(h.mesh);
    for (var i = 0; i < h.length; i++) {
      newh[i] = h[i];
      var nbs = neighbours(h.mesh, i);
      if (h[i] > 0 || nbs.length != 3) continue;
      var count = 0;
      var best = 999999;
      for (var j = 0; j < nbs.length; j++) {
        if (h[nbs[j]] <= 0) {
          count++;
        } else if (h[nbs[j]] < best) {
          best = h[nbs[j]];
        }
      }
      if (count > 1) continue;
      newh[i] = best / 2;
      changed++;
    }
    h = newh;
  }
  return h;
}

function trislope(h:Mesh, i:num) {
  var nbs = neighbours(h, h.vecFromInt(i));
  if (nbs.length != 4) return [0, 0];
  var p0 = nbs[0];
  var p1 = nbs[1];
  var p2 = nbs[2];
  var p3 = nbs[3];

  var x1 = p1[0] - p0[0];
  var x2 = p2[0] - p0[0];
  var y1 = p1[1] - p0[1];
  var y2 = p2[1] - p0[1];

  var det = x1 * y2 - x2 * y1;
  var h1 = h[nbs[1]] - h[nbs[0]];
  var h2 = h[nbs[2]] - h[nbs[0]];

  return [(y2 * h1 - y1 * h2) / det, (-x2 * h1 + x1 * h2) / det];
}

function cityScore(h, cities) {
  var score = map(getFlux(h), Math.sqrt);
  for (var i = 0; i < h.length; i++) {
    if (h[i] <= 0 || isnearedge(h.mesh, i)) {
      score[i] = -999999;
      continue;
    }
    score[i] +=
      0.01 / (1e-9 + Math.abs(h.mesh.vxs[i][0]) - h.mesh.extent.width / 2);
    score[i] +=
      0.01 / (1e-9 + Math.abs(h.mesh.vxs[i][1]) - h.mesh.extent.height / 2);
    for (var j = 0; j < cities.length; j++) {
      score[i] -= 0.02 / (distance(h.mesh, cities[j], i) + 1e-9);
    }
  }
  return score;
}
function placeCity(render) {
  render.cities = render.cities || [];
  var score = cityScore(render.h, render.cities);
  var newcity = d3.scan(score, d3.descending);
  render.cities.push(newcity);
}

function placeCities(render) {
  var params = render.params;
  var h = render.h;
  var n = params.ncities;
  for (var i = 0; i < n; i++) {
    placeCity(render);
  }
}

function contour(h, level) {
  level = level || 0;
  var edges = [];
  for (var i = 0; i < h.mesh.edges.length; i++) {
    var e = h.mesh.edges[i];
    if (e[3] == undefined) continue;
    if (isnearedge(h.mesh, e[0]) || isnearedge(h.mesh, e[1])) continue;
    if (
      (h[e[0]] > level && h[e[1]] <= level) ||
      (h[e[1]] > level && h[e[0]] <= level)
    ) {
      edges.push([e[2], e[3]]);
    }
  }
  return mergeSegments(edges);
}

function getRivers(h, limit) {
  var dh = downhill(h);
  var flux = getFlux(h);
  var links = [];
  var above = 0;
  for (var i = 0; i < h.length; i++) {
    if (h[i] > 0) above++;
  }
  limit *= above / h.length;
  for (var i = 0; i < dh.length; i++) {
    if (isnearedge(h.mesh, i)) continue;
    if (flux[i] > limit && h[i] > 0 && dh[i] >= 0) {
      var up = h.mesh.vxs[i];
      var down = h.mesh.vxs[dh[i]];
      if (h[dh[i]] > 0) {
        links.push([up, down]);
      } else {
        links.push([up, [(up[0] + down[0]) / 2, (up[1] + down[1]) / 2]]);
      }
    }
  }
  return mergeSegments(links).map(relaxPath);
}

function getTerritories(render) {
  var h = render.h;
  var cities = render.cities;
  var n = render.params.nterrs;
  if (n > render.cities.length) n = render.cities.length;
  var flux = getFlux(h);
  var terr = [];
  var queue = new PriorityQueue({
    comparator: function(a, b) {
      return a.score - b.score;
    },
  });
  function weight(u, v) {
    var horiz = distance(h.mesh, u, v);
    var vert = h[v] - h[u];
    if (vert > 0) vert /= 10;
    var diff = 1 + 0.25 * Math.pow(vert / horiz, 2);
    diff += 100 * Math.sqrt(flux[u]);
    if (h[u] <= 0) diff = 100;
    if (h[u] > 0 != h[v] > 0) return 1000;
    return horiz * diff;
  }
  for (var i = 0; i < n; i++) {
    terr[cities[i]] = cities[i];
    var nbs = neighbours(h.mesh, cities[i]);
    for (var j = 0; j < nbs.length; j++) {
      queue.queue({
        score: weight(cities[i], nbs[j]),
        city: cities[i],
        vx: nbs[j],
      });
    }
  }
  while (queue.length) {
    var u = queue.dequeue();
    if (terr[u.vx] != undefined) continue;
    terr[u.vx] = u.city;
    var nbs = neighbours(h.mesh, u.vx);
    for (var i = 0; i < nbs.length; i++) {
      var v = nbs[i];
      if (terr[v] != undefined) continue;
      var newdist = weight(u.vx, v);
      queue.queue({
        score: u.score + newdist,
        city: u.city,
        vx: v,
      });
    }
  }
  terr.mesh = h.mesh;
  return terr;
}

function getBorders(render) {
  var terr = render.terr;
  var h = render.h;
  var edges = [];
  for (var i = 0; i < terr.mesh.edges.length; i++) {
    var e = terr.mesh.edges[i];
    if (e[3] == undefined) continue;
    if (isnearedge(terr.mesh, e[0]) || isnearedge(terr.mesh, e[1])) continue;
    if (h[e[0]] < 0 || h[e[1]] < 0) continue;
    if (terr[e[0]] != terr[e[1]]) {
      edges.push([e[2], e[3]]);
    }
  }
  return mergeSegments(edges).map(relaxPath);
}

function mergeSegments(segs) {
  var adj = {};
  for (var i = 0; i < segs.length; i++) {
    var seg = segs[i];
    var a0 = adj[seg[0]] || [];
    var a1 = adj[seg[1]] || [];
    a0.push(seg[1]);
    a1.push(seg[0]);
    adj[seg[0]] = a0;
    adj[seg[1]] = a1;
  }
  var done = [];
  var paths = [];
  var path = null;
  while (true) {
    if (path == null) {
      for (var i = 0; i < segs.length; i++) {
        if (done[i]) continue;
        done[i] = true;
        path = [segs[i][0], segs[i][1]];
        break;
      }
      if (path == null) break;
    }
    var changed = false;
    for (var i = 0; i < segs.length; i++) {
      if (done[i]) continue;
      if (adj[path[0]].length == 2 && segs[i][0] == path[0]) {
        path.unshift(segs[i][1]);
      } else if (adj[path[0]].length == 2 && segs[i][1] == path[0]) {
        path.unshift(segs[i][0]);
      } else if (
        adj[path[path.length - 1]].length == 2 &&
        segs[i][0] == path[path.length - 1]
      ) {
        path.push(segs[i][1]);
      } else if (
        adj[path[path.length - 1]].length == 2 &&
        segs[i][1] == path[path.length - 1]
      ) {
        path.push(segs[i][0]);
      } else {
        continue;
      }
      done[i] = true;
      changed = true;
      break;
    }
    if (!changed) {
      paths.push(path);
      path = null;
    }
  }
  return paths;
}

function relaxPath(path) {
  var newpath = [path[0]];
  for (var i = 1; i < path.length - 1; i++) {
    var newpt = [
      0.25 * path[i - 1][0] + 0.5 * path[i][0] + 0.25 * path[i + 1][0],
      0.25 * path[i - 1][1] + 0.5 * path[i][1] + 0.25 * path[i + 1][1],
    ];
    newpath.push(newpt);
  }
  newpath.push(path[path.length - 1]);
  return newpath;
}
function visualizePoints(svg, pts) {
  var circle = svg.selectAll('circle').data(pts);
  circle.enter().append('circle');
  circle.exit().remove();
  d3.selectAll('circle')
    .attr('cx', function(d) {
      return 1000 * d[0];
    })
    .attr('cy', function(d) {
      return 1000 * d[1];
    })
    .attr('r', 100 / Math.sqrt(pts.length));
}

// function makeD3Path(path) {
//   var p = d3.path();
//   p.moveTo(1000 * path[0][0], 1000 * path[0][1]);
//   for (var i = 1; i < path.length; i++) {
//     p.lineTo(1000 * path[i][0], 1000 * path[i][1]);
//   }
//   return p.toString();
// }

// function visualizeVoronoi(svg, field, lo, hi) {
//   if (hi == undefined) hi = d3.max(field) + 1e-9;
//   if (lo == undefined) lo = d3.min(field) - 1e-9;
//   var mappedvals = field.map(function(x) {
//     return x > hi ? 1 : x < lo ? 0 : (x - lo) / (hi - lo);
//   });
//   var tris = svg.selectAll('path.field').data(field.mesh.tris);
//   tris
//     .enter()
//     .append('path')
//     .classed('field', true);

//   tris.exit().remove();

//   svg
//     .selectAll('path.field')
//     .attr('d', makeD3Path)
//     .style('fill', function(d, i) {
//       return d3.interpolateViridis(mappedvals[i]);
//     });
// }

// function visualizeDownhill(h) {
//   var links = getRivers(h, 0.01);
//   drawPaths('river', links);
// }

// function drawPaths(svg, cls, paths) {
//   var paths = svg.selectAll('path.' + cls).data(paths);
//   paths
//     .enter()
//     .append('path')
//     .classed(cls, true);
//   paths.exit().remove();
//   svg.selectAll('path.' + cls).attr('d', makeD3Path);
// }

// function visualizeSlopes(svg, render) {
//   var h = render.h;
//   var strokes = [];
//   var r = 0.25 / Math.sqrt(h.length);
//   for (var i = 0; i < h.length; i++) {
//     if (h[i] <= 0 || isnearedge(h.mesh, i)) continue;
//     var nbs = neighbours(h.mesh, i);
//     nbs.push(i);
//     var s = 0;
//     var s2 = 0;
//     for (var j = 0; j < nbs.length; j++) {
//       var slopes = trislope(h, nbs[j]);
//       s += slopes[0] / 10;
//       s2 += slopes[1];
//     }
//     s /= nbs.length;
//     s2 /= nbs.length;
//     if (Math.abs(s) < runif(0.1, 0.4)) continue;
//     var l =
//       r *
//       runif(1, 2) *
//       (1 - 0.2 * Math.pow(Math.atan(s), 2)) *
//       Math.exp(s2 / 100);
//     var x = h.mesh.vxs[i][0];
//     var y = h.mesh.vxs[i][1];
//     if (Math.abs(l * s) > 2 * r) {
//       var n = Math.floor(Math.abs((l * s) / r));
//       l /= n;
//       if (n > 4) n = 4;
//       for (var j = 0; j < n; j++) {
//         var u = rnorm() * r;
//         var v = rnorm() * r;
//         strokes.push([
//           [x + u - l, y + v + l * s],
//           [x + u + l, y + v - l * s],
//         ]);
//       }
//     } else {
//       strokes.push([
//         [x - l, y + l * s],
//         [x + l, y - l * s],
//       ]);
//     }
//   }
//   var lines = svg.selectAll('line.slope').data(strokes);
//   lines
//     .enter()
//     .append('line')
//     .classed('slope', true);
//   lines.exit().remove();
//   svg
//     .selectAll('line.slope')
//     .attr('x1', function(d) {
//       return 1000 * d[0][0];
//     })
//     .attr('y1', function(d) {
//       return 1000 * d[0][1];
//     })
//     .attr('x2', function(d) {
//       return 1000 * d[1][0];
//     })
//     .attr('y2', function(d) {
//       return 1000 * d[1][1];
//     });
// }

// function visualizeContour(h, level) {
//   level = level || 0;
//   var links = contour(h, level);
//   drawPaths('coast', links);
// }

// function visualizeBorders(h, cities, n) {
//   var links = getBorders(h, getTerritories(h, cities, n));
//   drawPaths('border', links);
// }

// function visualizeCities(svg, render) {
//   var cities = render.cities;
//   var h = render.h;
//   var n = render.params.nterrs;

//   var circs = svg.selectAll('circle.city').data(cities);
//   circs
//     .enter()
//     .append('circle')
//     .classed('city', true);
//   circs.exit().remove();
//   svg
//     .selectAll('circle.city')
//     .attr('cx', function(d) {
//       return 1000 * h.mesh.vxs[d][0];
//     })
//     .attr('cy', function(d) {
//       return 1000 * h.mesh.vxs[d][1];
//     })
//     .attr('r', function(d, i) {
//       return i >= n ? 4 : 10;
//     })
//     .style('fill', 'white')
//     .style('stroke-width', 5)
//     .style('stroke-linecap', 'round')
//     .style('stroke', 'black')
//     .raise();
// }

// function dropEdge(h, p) {
//   p = p || 4;
//   var newh = zero(h.mesh);
//   for (var i = 0; i < h.length; i++) {
//     var v = h.mesh.vxs[i];
//     var x = (2.4 * v[0]) / h.mesh.extent.width;
//     var y = (2.4 * v[1]) / h.mesh.extent.height;
//     newh[i] =
//       h[i] -
//       Math.exp(10 * (Math.pow(Math.pow(x, p) + Math.pow(y, p), 1 / p) - 1));
//   }
//   return newh;
// }

// function generateCoast(params) {
//   var mesh = generateGoodMesh(params.npts, params.extent);
//   var h = add(
//     slope(mesh, randomVector(4)),
//     cone(mesh, runif(-1, -1)),
//     mountains(mesh, 50)
//   );
//   for (var i = 0; i < 10; i++) {
//     h = relax(h);
//   }
//   h = peaky(h);
//   //h = doErosion(h, runif(0, 0.1), 5);
//   h = setSeaLevel(h, runif(0.2, 0.6));
//   //h = fillSinks(h);
//   h = cleanCoast(h, 3);
//   return h;
// }

// function terrCenter(h, terr, city, landOnly) {
//   var x = 0;
//   var y = 0;
//   var n = 0;
//   for (var i = 0; i < terr.length; i++) {
//     if (terr[i] != city) continue;
//     if (landOnly && h[i] <= 0) continue;
//     x += terr.mesh.vxs[i][0];
//     y += terr.mesh.vxs[i][1];
//     n++;
//   }
//   return [x / n, y / n];
// }

// function drawLabels(svg, render) {
//   var params = render.params;
//   var h = render.h;
//   var terr = render.terr;
//   var cities = render.cities;
//   var nterrs = render.params.nterrs;
//   var avoids = [render.rivers, render.coasts, render.borders];
//   var lang = makeRandomLanguage();
//   var citylabels = [];
//   function penalty(label) {
//     var pen = 0;
//     if (label.x0 < -0.45 * h.mesh.extent.width) pen += 100;
//     if (label.x1 > 0.45 * h.mesh.extent.width) pen += 100;
//     if (label.y0 < -0.45 * h.mesh.extent.height) pen += 100;
//     if (label.y1 > 0.45 * h.mesh.extent.height) pen += 100;
//     for (var i = 0; i < citylabels.length; i++) {
//       var olabel = citylabels[i];
//       if (
//         label.x0 < olabel.x1 &&
//         label.x1 > olabel.x0 &&
//         label.y0 < olabel.y1 &&
//         label.y1 > olabel.y0
//       ) {
//         pen += 100;
//       }
//     }

//     for (var i = 0; i < cities.length; i++) {
//       var c = h.mesh.vxs[cities[i]];
//       if (
//         label.x0 < c[0] &&
//         label.x1 > c[0] &&
//         label.y0 < c[1] &&
//         label.y1 > c[1]
//       ) {
//         pen += 100;
//       }
//     }
//     for (var i = 0; i < avoids.length; i++) {
//       var avoid = avoids[i];
//       for (var j = 0; j < avoid.length; j++) {
//         var avpath = avoid[j];
//         for (var k = 0; k < avpath.length; k++) {
//           var pt = avpath[k];
//           if (
//             pt[0] > label.x0 &&
//             pt[0] < label.x1 &&
//             pt[1] > label.y0 &&
//             pt[1] < label.y1
//           ) {
//             pen++;
//           }
//         }
//       }
//     }
//     return pen;
//   }
//   for (var i = 0; i < cities.length; i++) {
//     var x = h.mesh.vxs[cities[i]][0];
//     var y = h.mesh.vxs[cities[i]][1];
//     var text = makeName(lang, 'city');
//     var size = i < nterrs ? params.fontsizes.city : params.fontsizes.town;
//     var sx = ((0.65 * size) / 1000) * text.length;
//     var sy = size / 1000;
//     var posslabels = [
//       {
//         x: x + 0.8 * sy,
//         y: y + 0.3 * sy,
//         align: 'start',
//         x0: x + 0.7 * sy,
//         y0: y - 0.6 * sy,
//         x1: x + 0.7 * sy + sx,
//         y1: y + 0.6 * sy,
//       },
//       {
//         x: x - 0.8 * sy,
//         y: y + 0.3 * sy,
//         align: 'end',
//         x0: x - 0.9 * sy - sx,
//         y0: y - 0.7 * sy,
//         x1: x - 0.9 * sy,
//         y1: y + 0.7 * sy,
//       },
//       {
//         x: x,
//         y: y - 0.8 * sy,
//         align: 'middle',
//         x0: x - sx / 2,
//         y0: y - 1.9 * sy,
//         x1: x + sx / 2,
//         y1: y - 0.7 * sy,
//       },
//       {
//         x: x,
//         y: y + 1.2 * sy,
//         align: 'middle',
//         x0: x - sx / 2,
//         y0: y + 0.1 * sy,
//         x1: x + sx / 2,
//         y1: y + 1.3 * sy,
//       },
//     ];
//     var label =
//       posslabels[
//         d3.scan(posslabels, function(a, b) {
//           return penalty(a) - penalty(b);
//         })
//       ];
//     label.text = text;
//     label.size = size;
//     citylabels.push(label);
//   }
//   var texts = svg.selectAll('text.city').data(citylabels);
//   texts
//     .enter()
//     .append('text')
//     .classed('city', true);
//   texts.exit().remove();
//   svg
//     .selectAll('text.city')
//     .attr('x', function(d) {
//       return 1000 * d.x;
//     })
//     .attr('y', function(d) {
//       return 1000 * d.y;
//     })
//     .style('font-size', function(d) {
//       return d.size;
//     })
//     .style('text-anchor', function(d) {
//       return d.align;
//     })
//     .text(function(d) {
//       return d.text;
//     })
//     .raise();

//   var reglabels = [];
//   for (var i = 0; i < nterrs; i++) {
//     var city = cities[i];
//     var text = makeName(lang, 'region');
//     var sy = params.fontsizes.region / 1000;
//     var sx = 0.6 * text.length * sy;
//     var lc = terrCenter(h, terr, city, true);
//     var oc = terrCenter(h, terr, city, false);
//     var best = 0;
//     var bestscore = -999999;
//     for (var j = 0; j < h.length; j++) {
//       var score = 0;
//       var v = h.mesh.vxs[j];
//       score -=
//         3000 *
//         Math.sqrt(
//           (v[0] - lc[0]) * (v[0] - lc[0]) + (v[1] - lc[1]) * (v[1] - lc[1])
//         );
//       score -=
//         1000 *
//         Math.sqrt(
//           (v[0] - oc[0]) * (v[0] - oc[0]) + (v[1] - oc[1]) * (v[1] - oc[1])
//         );
//       if (terr[j] != city) score -= 3000;
//       for (var k = 0; k < cities.length; k++) {
//         var u = h.mesh.vxs[cities[k]];
//         if (Math.abs(v[0] - u[0]) < sx && Math.abs(v[1] - sy / 2 - u[1]) < sy) {
//           score -= k < nterrs ? 4000 : 500;
//         }
//         if (
//           v[0] - sx / 2 < citylabels[k].x1 &&
//           v[0] + sx / 2 > citylabels[k].x0 &&
//           v[1] - sy < citylabels[k].y1 &&
//           v[1] > citylabels[k].y0
//         ) {
//           score -= 5000;
//         }
//       }
//       for (var k = 0; k < reglabels.length; k++) {
//         var label = reglabels[k];
//         if (
//           v[0] - sx / 2 < label.x + label.width / 2 &&
//           v[0] + sx / 2 > label.x - label.width / 2 &&
//           v[1] - sy < label.y &&
//           v[1] > label.y - label.size
//         ) {
//           score -= 20000;
//         }
//       }
//       if (h[j] <= 0) score -= 500;
//       if (v[0] + sx / 2 > 0.5 * h.mesh.extent.width) score -= 50000;
//       if (v[0] - sx / 2 < -0.5 * h.mesh.extent.width) score -= 50000;
//       if (v[1] > 0.5 * h.mesh.extent.height) score -= 50000;
//       if (v[1] - sy < -0.5 * h.mesh.extent.height) score -= 50000;
//       if (score > bestscore) {
//         bestscore = score;
//         best = j;
//       }
//     }
//     reglabels.push({
//       text: text,
//       x: h.mesh.vxs[best][0],
//       y: h.mesh.vxs[best][1],
//       size: sy,
//       width: sx,
//     });
//   }
//   texts = svg.selectAll('text.region').data(reglabels);
//   texts
//     .enter()
//     .append('text')
//     .classed('region', true);
//   texts.exit().remove();
//   svg
//     .selectAll('text.region')
//     .attr('x', function(d) {
//       return 1000 * d.x;
//     })
//     .attr('y', function(d) {
//       return 1000 * d.y;
//     })
//     .style('font-size', function(d) {
//       return 1000 * d.size;
//     })
//     .style('text-anchor', 'middle')
//     .text(function(d) {
//       return d.text;
//     })
//     .raise();
// }
// function drawMap(svg, render) {
//   render.rivers = getRivers(render.h, 0.01);
//   render.coasts = contour(render.h, 0);
//   render.terr = getTerritories(render);
//   render.borders = getBorders(render);
//   drawPaths(svg, 'river', render.rivers);
//   drawPaths(svg, 'coast', render.coasts);
//   drawPaths(svg, 'border', render.borders);
//   visualizeSlopes(svg, render);
//   visualizeCities(svg, render);
//   drawLabels(svg, render);
// }

// function doMap(svg, params) {
//   var render = {
//     params: params,
//   };
//   var width = svg.attr('width');
//   svg.attr('height', (width * params.extent.height) / params.extent.width);
//   svg.attr(
//     'viewBox',
//     (-1000 * params.extent.width) / 2 +
//       ' ' +
//       (-1000 * params.extent.height) / 2 +
//       ' ' +
//       1000 * params.extent.width +
//       ' ' +
//       1000 * params.extent.height
//   );
//   svg.selectAll().remove();
//   render.h = params.generator(params);
//   placeCities(render);
//   drawMap(svg, render);
// }

// var defaultParams = {
//   extent: defaultSize,
//   generator: generateCoast,
//   npts: 16384,
//   ncities: 15,
//   nterrs: 5,
//   fontsizes: {
//     region: 40,
//     city: 25,
//     town: 20,
//   },
// };
