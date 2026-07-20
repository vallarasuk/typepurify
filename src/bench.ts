import { clean } from './index';
import { cleanParse } from './parse';
import { performance } from 'perf_hooks';

// Generate a large payload
const generatePayload = (depth: number, breadth: number): any => {
  if (depth === 0) return { a: 1, b: null, c: 'test', d: '', e: undefined };

  const obj: any = {};
  for (let i = 0; i < breadth; i++) {
    obj[`key_${i}`] = generatePayload(depth - 1, breadth);
  }
  // add some arrays with nulls
  obj.arr = [1, null, 2, undefined, 3, '', [], {}];
  return obj;
};

console.log('Generating massive payload for benchmark...');
const payload = generatePayload(6, 4); // quite large
const jsonString = JSON.stringify(payload);

console.log(`Payload size: ${(jsonString.length / 1024 / 1024).toFixed(2)} MB`);
console.log('--- Benchmarking ---');

const ITERATIONS = 10;

// Benchmark 1: JSON.parse + clean
let start = performance.now();
for (let i = 0; i < ITERATIONS; i++) {
  const parsed = JSON.parse(jsonString);
  clean(parsed, { stripEmptyStrings: true, stripEmptyArrays: true, stripEmptyObjects: true });
}
let end = performance.now();
const timeNative = end - start;
console.log(`JSON.parse() + clean(): ${(timeNative / ITERATIONS).toFixed(2)} ms / iteration`);

// Benchmark 2: cleanParse
start = performance.now();
for (let i = 0; i < ITERATIONS; i++) {
  cleanParse(jsonString, {
    stripEmptyStrings: true,
    stripEmptyArrays: true,
    stripEmptyObjects: true,
  });
}
end = performance.now();
const timeParse = end - start;
console.log(`cleanParse(): ${(timeParse / ITERATIONS).toFixed(2)} ms / iteration`);

console.log('--- Results ---');
if (timeParse < timeNative) {
  console.log(
    `🚀 cleanParse is ${(((timeNative - timeParse) / timeNative) * 100).toFixed(2)}% faster!`,
  );
} else {
  console.log(
    `cleanParse is slower by ${(((timeParse - timeNative) / timeNative) * 100).toFixed(2)}% (Expected for pure TS JSON parser compared to C++ V8 JSON.parse, but saves memory allocations)`,
  );
}
