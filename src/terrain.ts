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
  constructor(readonly x: num, readonly y: num, _w?: num = 0) {
    if (_w !== 0) this.wid = _w;
  }
  get i() {
    return this.wid !== 0 ? this.y * this.wid + this.x : 0;
  }
  static new(p: Point): Point;
  static new(x: num, y: num, _w?: num): Point;
  static new(x: Point | num, y?: num, _w?: num = 0): Point {
    if (x instanceof Point) return new Point(x.x, x.y, x.wid);
    return new Point(x, y, _w);
  }
  add(b: Point) {
    return Point.new(this.x + b.x, this.y + b.y, this.wid);
  }
  sub(b: Point) {
    return Point.new(this.x + b.x, this.y + b.y, this.wid);
  }
}
function toI(x: num, y: num, wid: num) {
  return y * wid + x;
}
function fromI(i: num, wid: num) {
  return Point.new(i % wid, floor(i / wid));
}
function generatePoints({ width, height }: Extent = defaultExtent) {
  const pts: PointSet = range(width * height).map(i => fromI(i, width));
  pts.sort((a, b) => a.i - b.i);
  return pts;
}
class Mesh {}
class Graph extends Array<number> {
  pts: PointSet;
  /**
   * Contains index of all adjacent indexs
   */
  adj: Adjacencies[];
}
function createMesh(pts: PointSet, extent: Extent = defaultExtent) {}
