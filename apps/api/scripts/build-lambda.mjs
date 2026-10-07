import { rm, mkdir, stat } from 'node:fs/promises';
import { build } from 'esbuild';

/** Bundles the Lambda entrypoint into one file. The AWS SDK and swagger are left out since Lambda has the SDK and swagger is dev only. */
const OUT_DIR = 'dist-lambda';
const OUT_FILE = `${OUT_DIR}/index.mjs`;

await rm(OUT_DIR, { recursive: true, force: true });
await mkdir(OUT_DIR, { recursive: true });

await build({
  entryPoints: ['src/lambda.ts'],
  outfile: OUT_FILE,
  bundle: true,
  platform: 'node',
  target: 'node22',
  format: 'esm',
  minify: true,
  sourcemap: false,
  external: ['@aws-sdk/*', '@fastify/swagger', '@fastify/swagger-ui'],
  // Some dependencies still expect CommonJS globals.
  banner: {
    js: [
      "import { createRequire as __createRequire } from 'node:module';",
      "import { fileURLToPath as __fileURLToPath } from 'node:url';",
      "import { dirname as __dirname_ } from 'node:path';",
      'const require = __createRequire(import.meta.url);',
      'const __filename = __fileURLToPath(import.meta.url);',
      'const __dirname = __dirname_(__filename);',
    ].join('\n'),
  },
  logLevel: 'info',
});

const { size } = await stat(OUT_FILE);
console.log(`bundled -> ${OUT_FILE} (${(size / 1024).toFixed(0)} kB, handler: index.handler)`);
