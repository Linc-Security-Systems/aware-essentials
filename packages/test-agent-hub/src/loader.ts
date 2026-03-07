import * as path from 'path';
import * as fs from 'fs';
import { Scenario } from './scenario.types';

/**
 * Recursively collect all files under `dir` that match `pattern`.
 */
function findFilesRecursive(dir: string, pattern: RegExp): string[] {
  const results: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...findFilesRecursive(fullPath, pattern));
    } else if (pattern.test(entry.name)) {
      results.push(fullPath);
    }
  }
  return results;
}

/**
 * Auto-discover and load all *.scenario.{ts,js} files in the scenarios directory
 * and its sub-folders. Each file must default-export a `Scenario` object.
 */
export function loadScenarios(): Scenario[] {
  const scenariosDir = path.join(__dirname, 'scenarios'); // compiled: dist/scenarios/
  const files = findFilesRecursive(scenariosDir, /\.scenario\.(ts|js)$/);

  const scenarios: Scenario[] = [];

  for (const fullPath of files) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mod = require(fullPath);
    const scenario: Scenario = mod.default ?? mod;

    if (!scenario.name || !scenario.run) {
      const relPath = path.relative(scenariosDir, fullPath);
      console.warn(`⚠ Skipping ${relPath}: missing 'name' or 'run' export`);
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
