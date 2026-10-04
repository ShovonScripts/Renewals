/**
 * Test environment that runs its file in Australia/Sydney, a timezone that observes DST.
 * Used by src/domain/dates.dst.test.ts and src/domain/dates.sydney.test.ts via a
 * @jest-environment docblock.
 *
 * Two things make this a custom environment rather than a line inside the test file:
 *
 * 1. jest-environment-node gives the test sandbox a COPY of process.env, so assigning
 *    process.env.TZ inside a test file never reaches V8's date code — measured: the offset
 *    stayed at UTC and a 23-hour day measured as 24.
 * 2. Node caches required modules per worker process, so a module-level `process.env.TZ = ...`
 *    would only run for the FIRST file in that worker to load an environment. Every later file
 *    would silently inherit whatever timezone was already set. Setting it in the constructor
 *    makes it run per file, which is what the two-timezone setup depends on.
 *
 * It also keeps `npm test` free of POSIX-only `TZ=... jest` syntax, so it runs on Windows.
 */

const { TestEnvironment } = require('jest-environment-node');

const TZ_FOR_TESTS = 'Australia/Sydney';

class SydneyTestEnvironment extends TestEnvironment {
  constructor(config, context) {
    super(config, context);
    this.previousTz = process.env.TZ;
    // The real worker process — this is what V8's Date actually reads.
    process.env.TZ = TZ_FOR_TESTS;
    // The sandbox copy, so test code reading process.env.TZ sees the same thing.
    this.global.process.env.TZ = TZ_FOR_TESTS;
  }

  async teardown() {
    // Jest reuses a worker process across test files, so put the timezone back.
    if (this.previousTz === undefined) {
      delete process.env.TZ;
    } else {
      process.env.TZ = this.previousTz;
    }
    await super.teardown();
  }
}

module.exports = SydneyTestEnvironment;
