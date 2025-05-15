import { describe, expect, test } from "vitest";
import { checkForDuplicateLabels, schemaSyntaxValidator } from "../src/schema-syntax-validator";
import { schema as invalidSchemaSyntax } from "./test-schema.invalid-syntax";
import { schema as validSchemaSyntax } from "./test-schema.valid-syntax";

describe("schema-syntax-validator.ts", () => {

  describe("checkForDuplicateLabels()", () => {
    test("Duplicate labels in the schema should throw an error", () => {
      // SETUP
      function invokeSchemaSyntaxValidator() {
        const results = checkForDuplicateLabels(invalidSchemaSyntax);
        throw new Error(results);
      }
      // EXECUTE and VERIFY
      expect(invokeSchemaSyntaxValidator).toThrowError("Cannot have duplicate labels: Student");

      // TEARDOWN

    });
  });

  describe("schemaSyntaxValidator()", () => {
    test("If the schema uses valid syntax, then the user should be notified with a success message", () => {
      // SETUP, EXECUTE and VERIFY
      expect(schemaSyntaxValidator(validSchemaSyntax)).toBe("Your schema uses valid syntax!");

      // TEARDOWN

    });
  });
});
