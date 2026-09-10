import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";
import { parseSourceFile } from "@/mcp/repo_indexer/parser";

describe("Repo Indexer Parser Adapters", () => {
  it("should parse JS/TS files correctly using TypeScript parser", () => {
    const testFile = path.resolve(__dirname, "temp-test.ts");
    const code = `
      import { foo } from "./other";
      export function hello() { return "world"; }
      export default class Greet {}
    `;
    fs.writeFileSync(testFile, code, "utf-8");

    try {
      const result = parseSourceFile(testFile);

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

  it("should parse Python files correctly using Python parser", () => {
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
      const result = parseSourceFile(testFile);

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

  it("should parse PHP files correctly using PHP parser", () => {
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
      const result = parseSourceFile(testFile);

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
    } finally {
      if (fs.existsSync(testFile)) {
        fs.unlinkSync(testFile);
      }
    }
  });
});
