# Chipy

Chipy is an NBA career simulator. Build a prospect: position, a position-locked
archetype, jersey number, birth country, then play out a full career one
decision at a time. Pick a college program and play an interactive freshman
year, get drafted, choose your landing spot, then make one call every
offseason from a library of scenarios, each with clear stat and money effects
shown up front.

Along the way you manage a career economy (salary, market value, a bank), run
into injuries and mid-season forks, sign shoe deals, chase MVPs and rings, and
represent your country at the Olympics. If the NBA stops calling, you can
rebuild your career in the EuroLeague and earn your way back. It all ends on a
legacy screen: trophy case, career totals, and a Hall of Fame verdict.

Try it at [chipy.cesargarciar.dev](https://chipy.cesargarciar.dev).

## Stack

| Layer           | Choice                                                                                            |
| --------------- | ------------------------------------------------------------------------------------------------- |
| Language / repo | TypeScript (strict, ESM), pnpm + Turborepo monorepo                                               |
| Simulation      | `@chipy/engine`, pure, deterministic, zero runtime deps beyond `zod`; Vitest + fast-check         |
| Contract        | `@chipy/shared`, one set of zod schemas for the HTTP API, used by both apps                       |
| Web             | Vite + React 19, Tailwind v4, Zustand, TanStack Query, React Router                               |
| API             | Fastify 5, `fastify-type-provider-zod`, pino; Lambda-ready (`@fastify/aws-lambda`)                |
| Data            | DynamoDB (on-demand) single-table via `@aws-sdk/lib-dynamodb`; DynamoDB Local for dev             |
| Infra           | Terraform, S3 + CloudFront, Lambda (Function URL, no API Gateway), DynamoDB, CloudWatch; ~$0 idle |
| CI              | GitHub Actions: typecheck, lint, test, build, Playwright                                          |

## License

MIT. Not affiliated with or endorsed by the NBA.
