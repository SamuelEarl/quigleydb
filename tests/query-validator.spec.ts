import { describe, expect, test } from "bun:test";
import { findQueryObjSchema } from "../query-validator";
import { schema as validSchemaSyntax } from "./test-schema.valid-syntax";

describe("query-validator.ts", () => {

  describe("findQueryObjSchema()", () => {
    test("The schema for a 'Student' node query object should be returned.", () => {
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
      const results = findQueryObjSchema(validSchemaSyntax, "label", nodeQueryObj.label)

      // VERIFY
      expect(results).toEqual(validSchemaSyntax.Student);

      // TEARDOWN

    });
  });
});
