import { rm, mkdir, stat } from 'node:fs/promises';
import { build } from 'esbuild';

/**
 * Bundle the Fastify Lambda entrypoint into one ESM file for the `nodejs22.x`
 * runtime. Terraform zips `dist-lambda/` and ships it as the function code.
 *
 *   - `@aws-sdk/*` is external: the Node 22 Lambda runtime already bundles SDK v3.
 *   - `@fastify/swagger*` is external: it's dev-only (see `server.ts`, the
 *     `!isProduction` branch), so it never loads on Lambda and would only bloat
 *     the cold start.
 */
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
  // A few transitive deps still reach for CJS globals under ESM output.
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
