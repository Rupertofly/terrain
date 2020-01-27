import {
  range,
  ascending,
  quantile as d3quantile,
  extent,
  mean,
} from 'd3';

//#region Types
interface Extent {
  width: number;
  height: number;
}
interface vec {
  x: number;
  y: number;
}
type num = number;
type Pts = vec[];
type PointSet = Vector[];
type ValueSet = num[];
type direction = 'N' | 'E' | 'S' | 'W';
type Adjacencies = Map<direction, num>;
const { PI, floor } = Math;
const TAU = PI * 2;
//#endregion
//#region Defaults
const defaultExtent: Extent = {
  width: 100,
  height: 100,
};
//#endregion
/**
 * Point Class for mesh
 */
export class Vector implements vec {
  readonly wid?: num;
  /**
   * create a new point
   * @param x x coord
   * @param y y coord
   * @param _w graph width
   */
  constructor(
    readonly x: num,
    readonly y: num,
    _w: num = 0
  ) {
    this.wid = _w;
    this[Symbol.iterator] = () => {};
  }
  /**
   * Gets index for point
   */
  get i() {
    return this.wid !== 0 ? this.y * this.wid + this.x : 0;
  }
  /**
   * create a copy of a point
   * @param p point to copy
   */
  static new(p: Vector): Vector;
  /**
   * create a point from x and y coords
   * @param x x coord
   * @param y y coord
   * @param _w width for point
   */
  static new(x: num, y: num, _w?: num): Vector;
  static new(
    x: Vector | num,
    y?: num,
    _w: num = 0
  ): Vector {
    if (x instanceof Vector)
      return new Vector(x.x, x.y, x.wid);
    return new Vector(x, y, _w);
  }
  /**
   * add two points component wise and return a new point
   * @param b Point to add
   */
  add(b: Vector) {
    return Vector.new(this.x + b.x, this.y + b.y, this.wid);
  }
  valid(h: number) {
    return (
      this.x >= 0 &&
      this.x < this.wid &&
      this.y >= 0 &&
      this.y < h
    );
  }
  /**
   * subtract a point from this point and return the new point
   * @param b point to subtract from this point
   */
  sub(b: Vector) {
    return Vector.new(this.x - b.x, this.y - b.y, this.wid);
  }
  get magnitude() {
    return Math.sqrt(this.x ** 2 + this.y ** 2);
  }
  get normalized() {
    let m = this.magnitude;
    return new Vector(this.x / m, this.y / m, this.wid);
  }
  get angle() {
    let a = Math.atan2(this.y, this.x);
    return a > 0 ? a : TAU + a;
  }
  centre(ext: Extent) {
    const { width: wid, height: hei } = ext;
    return this.sub(Vector.new(wid / 2, hei / 2, this.wid));
  }
}
/**
 * get index for coords
 * @param x x coord
 * @param y y coord
 * @param wid graph wid
 */
function toI(x: num, y: num, wid: num) {
  return y * wid + x;
}
/**
 * get point from index3
 * @param i index
 * @param wid graph wid
 */
function fromI(i: num, wid: num) {
  return Vector.new(i % wid, floor(i / wid), wid);
}
/**
 * create a point set for extent
 * @param param0 Extent
 */
export function generatePoints({
  width,
  height,
}: Extent = defaultExtent) {
  const pts: PointSet = range(width * height).map(i =>
    fromI(i, width)
  );
  pts.sort((a, b) => a.i - b.i);
  return pts;
}
type meshFunction = (
  p: Vector,
  h: num,
  i: num,
  n: Adjacencies
) => number;

class Graph extends Array<number> {
  pts: PointSet;
  extent: Extent;
  downhill?: number[];
  /**
   * Contains index of all adjacent indexs
   */
  adj: Adjacencies[];
  constructor(pts: PointSet, ext: Extent);
  constructor(g: Graph);
  constructor(a: PointSet | Graph, ext?: Extent) {
    ext = ext ?? (a as Graph).extent;
    super(ext.height * ext.width);
    if (a instanceof Graph) {
      a.map((v, i) => (this[i] = v));
      this.pts = a.pts;
      this.adj = a.adj;
      return this;
    }
    this.fill(0);
    this.pts = a;
    this.extent = ext;
    this.adj = this.map((v, i) => {
      let adj: Adjacencies = new Map();
      let N = this.pts[i].add(Vector.new(0, -1));
      N.valid(ext.height) && adj.set('N', N.i);
      let E = this.pts[i].add(Vector.new(1, 0));
      E.valid(ext.height) && adj.set('E', E.i);
      let S = this.pts[i].add(Vector.new(0, 1));
      S.valid(ext.height) && adj.set('S', S.i);
      let W = this.pts[i].add(Vector.new(-1, 0));
      W.valid(ext.height) && adj.set('W', W.i);
      return adj;
    });
  }
  clone() {
    return new Graph(this);
  }
  meshMap(e: meshFunction) {
    let out = this.clone();
    for (let i = 0; i < this.length; i++) {
      const h = this[i];
      const p = this.pts[i];
      const n = this.adj[i];
      out[i] = e(p, h, i, n);
    }
    return out;
  }
}
function createMesh(
  pts: PointSet,
  extent: Extent = defaultExtent
) {
  return new Graph(pts, extent);
}
function isEdge(mesh: Graph, i: number) {
  return mesh.adj[i].size < 4;
}
function isNearEdge(mesh: Graph, i: number) {
  const { x, y } = mesh.pts[i];
  const { width: w, height: h } = mesh.extent;
  return (
    x < 0.2 * w || x > 0.8 * w || y < 0.2 * h || y > 0.8 * h
  );
}
function getNeighbours(mesh: Graph, i: number) {
  var nbs: number[] = [];
  mesh.adj[i].forEach(v => nbs.push(i));
  return nbs;
}
function distance(mesh: Graph, i: num, j: num) {
  let p = mesh.pts[i];
  let q = mesh.pts[j];
  return Math.sqrt((p.x - q.x) ** 2 + (p.y - q.y) ** 2);
}
function quantile(h: number[], q: number) {
  let sortedHeights: number[] = h.map(v => v);
  sortedHeights.sort(ascending);
  return d3quantile(sortedHeights, q);
}
function zero(gr: Graph) {
  let x = gr.clone();
  x.forEach((v, i) => (x[i] = 0));
  return x;
}
function slope(m: Graph, direction: Vector) {
  return m.meshMap(
    p =>
      (p.x - m.extent.width / 2) * direction.x +
      (p.y - m.extent.height / 2) * direction.y
  );
}
function cone(m: Graph, slope: num) {
  m.meshMap(pt => {
    let c = pt.centre(m.extent);
    return Math.pow(c.x ** 2 + c.y ** 2, 0.5) * slope;
  });
}
function map(h: Graph, f: (n: number) => number) {
  return h.meshMap((p, hei) => f(hei));
}
function normalize(h: Graph) {
  const [lo, hi] = extent(h);
  return h.meshMap((p, h) => (h - lo) / (hi - lo));
}
function peaky(h: Graph) {
  return map(normalize(h), Math.sqrt);
}
function add(...meshes: Graph[]) {
  const n = meshes[0].length;
  const out = zero(arguments[0]);
  for (let [i, mesh] of meshes.entries()) {
    for (let [j, h] of mesh.entries()) {
      out[j] += mesh[j];
    }
  }
  return out;
}
function mountains(
  g: Graph,
  mounts: PointSet,
  r: number = 0.05
) {
  return g.meshMap((pt, hei, i) => {
    let out = 0;
    const c = pt.centre(g.extent);
    for (let m of mounts) {
      out += Math.pow(
        Math.exp(
          -(
            (c.x - m.x) * (c.x - m.x) +
            (c.y - m.y) * (c.y - m.y)
          ) /
            (2 * r ** 2)
        ),
        2
      );
      return out;
    }
  });
}
function relax(h: Graph) {
  return h.meshMap((p, v, i, n) => {
    if (n.size < 4) return 0;
    return mean([...n].map(d => d[1]));
  });
}
function getDownhill(graph: Graph) {
  if (graph.downhill) return graph.downhill;
  function downFrom(index: number) {
    if (isEdge(graph, index)) return -2;
    let bestIndex = -1;
    let bestHeight = graph[index];
    let siteNbs = getNeighbours(graph, index);
    for (let nb of siteNbs) {
      if (graph[nb] < bestHeight) {
        bestHeight = graph[nb];
        bestIndex = nb;
      }
    }
    return bestIndex;
  }
  let downhill: number[] = [];
  graph.meshMap((p, h, i) => (downhill[i] = downFrom(i)));
  graph.downhill = downhill;
  return downhill;
}
function findSinks(graph: Graph) {
  let downhill = getDownhill(graph);
  let sinkIndexes: number[] = [];
  for (let index of range(downhill.length)) {
    let currentNode = index;
    while (true) {
      if (isEdge(graph, currentNode)) {
        sinkIndexes[index] = -2;
        break;
      }
      if (downhill[currentNode] === -1) {
        sinkIndexes[index] = currentNode;
        break;
      }
      currentNode = downhill[currentNode];
    }
  }
  return sinkIndexes;
}
function fillSinks(graph: Graph, epsilon: number = 1e-5) {
  const infin = 9e6;
  let newGraph = zero(graph);
  newGraph.meshMap((p, h, i) =>
    isNearEdge(graph, i) ? graph[i] : infin
  );
  while (true) {
    let changed = false;
    for (let index of range(graph.length)) {
      if (newGraph[index] === graph[index]) continue;
      let neighbours = getNeighbours(graph, index);
      for (let nb of neighbours) {
        if (graph[index] >= newGraph[nb] + epsilon) {
          newGraph[index] = graph[index];
          changed = true;
          break;
        }
        let oh = newGraph[nb] + epsilon;
        if (newGraph[index] > oh && oh > graph[index]) {
          newGraph[index] = oh;
          changed = true;
        }
      }
    }
    if (!changed) return newGraph;
  }
}
