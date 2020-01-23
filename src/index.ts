import { Point, generatePoints } from './terrain';

console.log('hey');
console.log('you');
let x = new Point(1, 2, 3);
let y = Point.new(x);
let z = Point.new(3, 2);
console.log(generatePoints({ width: 60, height: 60 }));
console.log('done');
