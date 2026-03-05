import * as path from 'path';
import * as fs from 'fs';
import { Scenario } from './scenario.types';

/**
 * Auto-discover and load all *.scenario.{ts,js} files in the scenarios directory.
 * Each file must default-export a `Scenario` object.
 */
export function loadScenarios(): Scenario[] {
  const scenariosDir = __dirname; // compiled: dist/scenarios/
  const files = fs.readdirSync(scenariosDir).filter((f) => {
    // Match *.scenario.ts or *.scenario.js (compiled output)
    return /\.scenario\.(ts|js)$/.test(f);
  });

  const scenarios: Scenario[] = [];

  for (const file of files) {
    const fullPath = path.join(scenariosDir, file);
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mod = require(fullPath);
    const scenario: Scenario = mod.default ?? mod;

    if (!scenario.name || !scenario.run) {
      console.warn(`⚠ Skipping ${file}: missing 'name' or 'run' export`);
      continue;
    }

    scenarios.push(scenario);
  }

  // Sort alphabetically for deterministic CI ordering
  scenarios.sort((a, b) => a.name.localeCompare(b.name));

  return scenarios;
}

/**
 * Filter scenarios by tags (OR-based: scenario is included if it has
 * at least one matching tag). If no tags specified, returns all scenarios.
 */
export function filterScenarios(
  scenarios: Scenario[],
  tags: string[],
): Scenario[] {
  if (tags.length === 0) return scenarios;
  const tagSet = new Set(tags.map((t) => t.toLowerCase()));
  return scenarios.filter((s) =>
    s.tags.some((t) => tagSet.has(t.toLowerCase())),
  );
}
