// Polyfill for Node.js versions (v22+) where the deprecated `SlowBuffer`
// global/buffer export was removed. `buffer-equal-constant-time` (a transitive
// dependency of `jsonwebtoken`) still reads `require('buffer').SlowBuffer` at
// load time and crashes without it.
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const b = require("buffer");

if (!b.SlowBuffer) {
  b.SlowBuffer = b.Buffer;
}