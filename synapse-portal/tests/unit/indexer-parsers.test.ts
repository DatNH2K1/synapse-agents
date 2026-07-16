import { describe, it, expect } from "vitest";
import { execSync } from "child_process";
import * as fs from "fs";
import * as path from "path";

describe("Repo Indexer Parser Adapters", () => {
  let indexerScript = path.resolve(
    __dirname,
    "../../../../synapse/.agent/skills/synapse-repo-indexer/scripts/index_repo.py",
  );
  if (!fs.existsSync(indexerScript)) {
    indexerScript = path.resolve(
      __dirname,
      "../../../.agent/skills/synapse-repo-indexer/scripts/index_repo.py",
    );
  }
  if (!fs.existsSync(indexerScript)) {
    indexerScript = path.resolve(
      __dirname,
      "../../../synapse-mcp/tools/repo_indexer/index_repo.py",
    );
  }

  it("should parse JS/TS files correctly using Babel adapter", () => {
    const testFile = path.resolve(__dirname, "temp-test.ts");
    const code = `
      import { foo } from "./other";
      export function hello() { return "world"; }
      export default class Greet {}
    `;
    fs.writeFileSync(testFile, code, "utf-8");

    try {
      const stdout = execSync(
        `python3 "${indexerScript}" --parse "${testFile}"`,
      ).toString();
      const result = JSON.parse(stdout);

      expect(result.exports).toContainEqual(
        expect.objectContaining({ name: "hello", kind: "function" }),
      );
      expect(result.exports).toContainEqual(
        expect.objectContaining({ name: "Greet", kind: "class" }),
      );
      expect(result.imports).toContainEqual(
        expect.objectContaining({ name: "foo", from: "./other" }),
      );
    } finally {
      if (fs.existsSync(testFile)) {
        fs.unlinkSync(testFile);
      }
    }
  });

  it("should parse Python files correctly using python adapter", () => {
    const testFile = path.resolve(__dirname, "temp-test.py");
    const code = `
from math import sqrt
def calc_hypot(a, b):
    return sqrt(a**2 + b**2)
class Calculator:
    pass
`;
    fs.writeFileSync(testFile, code, "utf-8");

    try {
      const stdout = execSync(
        `python3 "${indexerScript}" --parse "${testFile}"`,
      ).toString();
      const result = JSON.parse(stdout);

      expect(result.exports).toContainEqual(
        expect.objectContaining({ name: "calc_hypot", kind: "function" }),
      );
      expect(result.exports).toContainEqual(
        expect.objectContaining({ name: "Calculator", kind: "class" }),
      );
      expect(result.imports).toContainEqual(
        expect.objectContaining({ name: "sqrt", from: "math" }),
      );
    } finally {
      if (fs.existsSync(testFile)) {
        fs.unlinkSync(testFile);
      }
    }
  });

  it("should parse PHP files correctly using php adapter", () => {
    const testFile = path.resolve(__dirname, "temp-test.php");
    const code = `<?php
      namespace App\\Tests;
      use App\\Services\\AuthService;
      use App\\Models\\User;
      
      class TestController {
          public function index() {
              return "hello";
          }
      }
      
      function helper_func() {}
    `;
    fs.writeFileSync(testFile, code, "utf-8");

    try {
      let phpAvailable = false;
      try {
        execSync("php -v", { stdio: "ignore" });
        phpAvailable = true;
      } catch (_err) {}

      if (phpAvailable) {
        const stdout = execSync(
          `python3 "${indexerScript}" --parse "${testFile}"`,
        ).toString();
        const result = JSON.parse(stdout);

        expect(result.exports).toContainEqual(
          expect.objectContaining({
            name: "App\\Tests\\TestController",
            kind: "class",
          }),
        );
        expect(result.exports).toContainEqual(
          expect.objectContaining({
            name: "App\\Tests\\helper_func",
            kind: "function",
          }),
        );
        expect(result.imports).toContainEqual(
          expect.objectContaining({
            name: "AuthService",
            from: "App\\Services\\AuthService",
          }),
        );
        expect(result.imports).toContainEqual(
          expect.objectContaining({ name: "User", from: "App\\Models\\User" }),
        );
      }
    } finally {
      if (fs.existsSync(testFile)) {
        fs.unlinkSync(testFile);
      }
    }
  });
});
