import { range } from 'd3';

//#region Types
interface Extent {
  width: number;
  height: number;
}
interface Vector {
  x: number;
  y: number;
}
type num = number;
type Pts = Vector[];
type PointSet = Point[];
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
export class Point implements Vector {
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
  static new(p: Point): Point;
  /**
   * create a point from x and y coords
   * @param x x coord
   * @param y y coord
   * @param _w width for point
   */
  static new(x: num, y: num, _w?: num): Point;
  static new(x: Point | num, y?: num, _w: num = 0): Point {
    if (x instanceof Point)
      return new Point(x.x, x.y, x.wid);
    return new Point(x, y, _w);
  }
  /**
   * add two points component wise and return a new point
   * @param b Point to add
   */
  add(b: Point) {
    return Point.new(this.x + b.x, this.y + b.y, this.wid);
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
  sub(b: Point) {
    return Point.new(this.x - b.x, this.y - b.y, this.wid);
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
  return Point.new(i % wid, floor(i / wid), wid);
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
class Mesh {}
class Graph extends Array<number> {
  pts: PointSet;
  extent: Extent;
  /**
   * Contains index of all adjacent indexs
   */
  adj: Adjacencies[];
  constructor(pts: PointSet, ext: Extent) {
    super(ext.height * ext.width);
    this.fill(0);
    this.pts = pts;
    this.extent = ext;
    this.adj = this.map((v, i) => {
      let adj: Adjacencies = new Map();
      let N = this.pts[i].add(Point.new(0, -1));
      N.valid(ext.height) && adj.set('N', N.i);
      let E = this.pts[i].add(Point.new(1, 0));
      E.valid(ext.height) && adj.set('E', E.i);
      let S = this.pts[i].add(Point.new(0, 1));
      S.valid(ext.height) && adj.set('S', S.i);
      let W = this.pts[i].add(Point.new(-1, 0));
      W.valid(ext.height) && adj.set('W', W.i);
      return adj;
    });
  }
}
function createMesh(
  pts: PointSet,
  extent: Extent = defaultExtent
) {}
