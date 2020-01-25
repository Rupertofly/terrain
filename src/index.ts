import { Vector, generatePoints } from './terrain';

console.log('hey');
console.log('you');
let x = new Vector(1, 2, 3);
let y = Vector.new(x);
let z = Vector.new(3, 2);
console.log(generatePoints({ width: 60, height: 60 }));
console.log('done');
