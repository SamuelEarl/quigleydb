import { describe, expect, test } from "vitest";
import { findQueryObjSchema } from "../src/query-validator";
import { schema as validSchemaSyntax } from "./test-schema.valid-syntax";

describe("query-validator.ts", () => {

  describe("findQueryObjSchema()", () => {
    test("A call to findQueryObjSchema with a 'Student' node query object should return the schema for a 'Student' node.", () => {
      // SETUP
      const nodeQueryObj = {
        type: "node",
        label: "Student",
        alias: "s",
        props: {
          id: "1234",
          firstName: "John",
          lastName: "Doe",
          email: "john@example.com",
          age: 20,
          address: {
            street: "123 Main",
            city: "Somewhere",
            state: "AZ",
            zip: "12345"
          },
          roles: ["student"],
          classYear: "junior",
          misc: '{"accomodations":{"tests":"extra time"},"studentHousing":{"location":"none"}}',
        },
      };

      // EXECUTE
      const results = findQueryObjSchema(validSchemaSyntax, "label", nodeQueryObj.label);

      // VERIFY
      expect(results).toEqual(validSchemaSyntax.Student);

      // TEARDOWN

    });

    test("A call to findQueryObjSchema with a 'Movie' node query object should return null because a 'Movie' node is not defined in the schema.", () => {
      // SETUP
      const nodeQueryObj = {
        type: "node",
        label: "Movie",
        alias: "m",
        props: {},
      };

      // EXECUTE
      const results = findQueryObjSchema(validSchemaSyntax, "label", nodeQueryObj.label);

      // VERIFY
      expect(results).toEqual(null);

      // TEARDOWN

    });

    test("validateQueryObjAgainstSchema should...", () => {
      // SETUP
      

      // EXECUTE
      

      // VERIFY
      expect(results).toEqual(null);

      // TEARDOWN

    });
  });
});
