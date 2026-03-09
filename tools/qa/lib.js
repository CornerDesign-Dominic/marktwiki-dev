#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");

function readJsonFile(filePath) {
  const raw = fs.readFileSync(filePath, "utf8");
  const clean = raw.charCodeAt(0) === 0xfeff ? raw.slice(1) : raw;
  return JSON.parse(clean);
}

function walkFiles(dir, filterFn) {
  const result = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      result.push(...walkFiles(fullPath, filterFn));
      continue;
    }
    if (!filterFn || filterFn(fullPath)) {
      result.push(fullPath);
    }
  }

  return result;
}

function toPosixPath(value) {
  return value.split(path.sep).join("/");
}

function relativeFromRoot(rootDir, fullPath) {
  return toPosixPath(path.relative(rootDir, fullPath));
}

function isExternalUrl(url) {
  return /^(?:[a-z]+:|\/\/)/i.test(url);
}

function stripQueryAndHash(url) {
  const withoutHash = url.split("#")[0] || "";
  return withoutHash.split("?")[0] || "";
}

function resolveInternalTarget(rootDir, sourceFile, rawUrl) {
  const url = String(rawUrl || "").trim();
  if (!url || url.startsWith("#")) {
    return null;
  }

  if (isExternalUrl(url)) {
    return null;
  }

  const clean = stripQueryAndHash(url);
  if (!clean) {
    return sourceFile;
  }

  if (clean.startsWith("/")) {
    return path.join(rootDir, clean.replace(/^\/+/, ""));
  }

  return path.resolve(path.dirname(sourceFile), clean);
}

function targetExists(targetPath) {
  if (!targetPath) {
    return true;
  }

  if (fs.existsSync(targetPath) && fs.statSync(targetPath).isFile()) {
    return true;
  }

  if (fs.existsSync(targetPath) && fs.statSync(targetPath).isDirectory()) {
    const indexPath = path.join(targetPath, "index.html");
    return fs.existsSync(indexPath);
  }

  return false;
}

module.exports = {
  readJsonFile,
  walkFiles,
  toPosixPath,
  relativeFromRoot,
  resolveInternalTarget,
  targetExists
};