import * as fs from "fs";
import * as path from "path";
import { ScenarioResult } from ".";

/* ---------------------------------------------------------------- */
/* Console reporter (colored)                                       */
/* ---------------------------------------------------------------- */

// ANSI color codes — works in all CI terminals, no chalk dependency
const RESET = "\x1b[0m";
const GREEN = "\x1b[32m";
const RED = "\x1b[31m";
const DIM = "\x1b[2m";
const BOLD = "\x1b[1m";

export interface ScenarioReport {
  name: string;
  result: ScenarioResult;
  logs: string[];
}

export interface ReportOptions {
  /** Suppress per-scenario details, only print the summary and errors */
  quiet?: boolean;
}

export function printConsoleReport(
  reports: ScenarioReport[],
  options: ReportOptions = {},
): void {
  const { quiet = false } = options;

  console.log();
  if (!quiet) {
    console.log(`${BOLD}──── Scenario Results ────${RESET}`);
    console.log();
  }

  let passed = 0;
  let failed = 0;
  let totalDuration = 0;

  for (const { name, result, logs } of reports) {
    totalDuration += result.durationMs;

    if (result.passed) {
      passed++;
      if (!quiet) {
        console.log(
          `  ${GREEN}✔${RESET} ${name} ${DIM}(${result.durationMs}ms)${RESET}`,
        );
      }
    } else {
      failed++;
      // Always print failures, even in quiet mode
      console.log(
        `  ${RED}✘${RESET} ${name} ${DIM}(${result.durationMs}ms)${RESET}`,
      );
      for (const err of result.errors) {
        console.log(`    ${RED}→ ${err}${RESET}`);
      }
    }

    // Print scenario logs if any (skip in quiet mode)
    if (!quiet && logs.length > 0) {
      for (const log of logs) {
        console.log(`    ${DIM}${log}${RESET}`);
      }
    }
  }

  console.log();
  const summary = [
    passed > 0 ? `${GREEN}${passed} passed${RESET}` : null,
    failed > 0 ? `${RED}${failed} failed${RESET}` : null,
    `${reports.length} total`,
    `${DIM}(${totalDuration}ms)${RESET}`,
  ]
    .filter(Boolean)
    .join(", ");

  console.log(`  ${BOLD}Summary:${RESET} ${summary}`);
  console.log();
}

/* ---------------------------------------------------------------- */
/* JUnit XML reporter                                               */
/* ---------------------------------------------------------------- */

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export function writeJUnitReport(
  reports: ScenarioReport[],
  filePath: string,
): void {
  const totalTime =
    reports.reduce((sum, r) => sum + r.result.durationMs, 0) / 1000;
  const failures = reports.filter((r) => !r.result.passed).length;

  const testcases = reports
    .map((r) => {
      const time = (r.result.durationMs / 1000).toFixed(3);
      if (r.result.passed) {
        return `    <testcase name="${escapeXml(r.name)}" classname="scenarios" time="${time}" />`;
      }
      const failureMsg = r.result.errors.map(escapeXml).join("\n");
      return [
        `    <testcase name="${escapeXml(r.name)}" classname="scenarios" time="${time}">`,
        `      <failure message="${escapeXml(r.result.errors[0] ?? "Failed")}">${failureMsg}</failure>`,
        `    </testcase>`,
      ].join("\n");
    })
    .join("\n");

  const xml = [
    `<?xml version="1.0" encoding="UTF-8"?>`,
    `<testsuites>`,
    `  <testsuite name="agent-tester" tests="${reports.length}" failures="${failures}" time="${totalTime.toFixed(3)}">`,
    testcases,
    `  </testsuite>`,
    `</testsuites>`,
  ].join("\n");

  // Ensure output directory exists
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  fs.writeFileSync(filePath, xml, "utf-8");
}
