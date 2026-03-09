#!/usr/bin/env node
"use strict";

const path = require("path");
const { spawnSync } = require("child_process");

const scripts = [
  path.join(__dirname, "validate-data.js"),
  path.join(__dirname, "check-links.js")
];

let hasFailure = false;

for (const script of scripts) {
  console.log(`\n== Starte ${path.basename(script)} ==`);
  const result = spawnSync(process.execPath, [script], { stdio: "inherit" });
  if (result.status !== 0) {
    hasFailure = true;
  }
}

if (hasFailure) {
  process.exitCode = 1;
} else {
  console.log("\nAlle QA-Checks erfolgreich.");
}