import { describe, expect, test } from "vitest";
import {
  parseProps,
  parseQueryObj,
  convertQueryObjStrToJSObj, 
  convertQueryStringToArrayOfClauseObjs, 
  queryParser 
} from "../src/query-parser";
import { IRelationshipQueryObj } from "../src/types";


describe("query-parser.ts", () => {

  describe("parseProps()", () => {
    test("Props query strings that have a dangling comma after the last property should throw an error", () => {
      // SETUP
      const query = `{
        firstName: $firstName,
        lastName: $lastName,
        email: $email,
      }`;

      const params = {
        firstName: "John",
        lastName: "Doe",
        email: "john@example.com",
      };

      function invokeParseProps() {
        const results = parseProps(query, params);
        throw new Error(results);
      }

      // EXECUTE and VERIFY
      expect(invokeParseProps).toThrowError("No dangling commas allowed in queries. Remove the comma after the last property in the node or relationship.");

      // TEARDOWN

    });

    test("Props query strings that are formatted correctly should return a plain JavaScript object", () => {
      // SETUP
      const query = `{
        firstName: $firstName,
        lastName: $lastName,
        email: $email
      }`;

      const params = {
        firstName: "John",
        lastName: "Doe",
        email: "john@example.com",
      };

      const expectedResults = {
        firstName: "John",
        lastName: "Doe",
        email: "john@example.com",
      };

      // EXECUTE
      const results = parseProps(query, params);
      
      // VERIFY
      expect(results).toEqual(expectedResults);

      // TEARDOWN

    });
  });

  describe("convertQueryObjStrToJSObj()", () => {
    test("The query object string for a node (with props) should be converted to a JavaScript object with properties matching the INodeQueryObj TypeScript type", () => {
      // SETUP
      const query = `(u:User {
        userId: $userId,
        sessionId: $sessionId,
        firstName: $firstName,
        lastName: $lastName,
        email: $email,
        password: $password,
        isVerified: $isVerified,
        roles: $roles
      })`;

      const params = {
        userId: "1234",
        sessionId: "9876",
        firstName: "John",
        lastName: "Doe",
        email: "john@example.com",
        password: "pa$$word",
        isVerified: true,
        roles: ["user", "priviledged"],
      };

      const expectedResults = {
        endIndex: 241,
        nodeQueryObj: {
          type: "node",
          label: "User",
          alias: "u",
          props: {
            userId: "1234",
            sessionId: "9876",
            firstName: "John",
            lastName: "Doe",
            email: "john@example.com",
            password: "pa$$word",
            isVerified: true,
            roles: ["user", "priviledged"],
          },
        },
      };

      // EXECUTE
      const results = convertQueryObjStrToJSObj("node", 0, query, params);

      // VERIFY
      expect(results).toEqual(expectedResults);

      // TEARDOWN

    });

    test("The query object string for a node (WITHOUT props) should be converted to a JavaScript object matching the INodeQueryObj TypeScript type and the `props` property should be an empty object", () => {
      // SETUP
      const query = `(u:User)`;

      // const params = {};

      const expectedResults = {
        endIndex: 8,
        nodeQueryObj: {
          type: "node",
          label: "User",
          alias: "u",
          props: {},
        },
      };

      // EXECUTE
      const results = convertQueryObjStrToJSObj("node", 0, query);

      // VERIFY
      expect(results).toEqual(expectedResults);

      // TEARDOWN

    });

    test("The query object string for a relationship (with props) should be converted to a JavaScript object with properties matching the IRelationshipQueryObj TypeScript type", () => {
      // SETUP
      const query = `()<-[a:ACTED_IN {
        role: $role,
        awards: $awards,
        salary: $salary,
        createdAt: $timestamp
      }]-()`;

      const params = {
        role: "Jack Sparrow",
        awards: ["best actor"],
        salary: 2000000000,
        timestamp: "2025-03-28T12:59:06.658Z",
      };

      const expectedResults = {
        endIndex: 128,
        relationshipQueryObj: {
          type: "relationship",
          label: "ACTED_IN",
          alias: "a",
          from: null,
          to: null,
          direction: "directed",
          props: {
            role: "Jack Sparrow",
            awards: ["best actor"],
            salary: 2000000000,
            createdAt: "2025-03-28T12:59:06.658Z",
          },
        },
      };

      // EXECUTE
      const results = convertQueryObjStrToJSObj("relationship", 2, query, params);

      // VERIFY
      expect(results).toEqual(expectedResults);

      // TEARDOWN

    });

    test("The query object string for a relationship (WITHOUT props) should be converted to a JavaScript object matching the IRelationshipQueryObj TypeScript type and the `props` property should be an empty object", () => {
      // SETUP
      const query = `()<-[a:ACTED_IN]-()`;

      const expectedResults = {
        endIndex: 17,
        relationshipQueryObj: {
          type: "relationship",
          label: "ACTED_IN",
          alias: "a",
          from: null,
          to: null,
          direction: "directed",
          props: {},
        },
      };

      // EXECUTE
      const results = convertQueryObjStrToJSObj("relationship", 2, query);

      // VERIFY
      expect(results).toEqual(expectedResults);

      // TEARDOWN

    });
  });

  describe("convertQueryStringToArrayOfClauseObjs()", () => {
    test("The query should return an array of clause objects where each clause object's `queryObjs` arrays is empty", () => {
      // SETUP
      const query = `
        CREATE (s:Student {
          email: $email
        })
        RETURN s
      `;

      const params = {
        params: {
          email: "john@example.com",
        }
      };

      const expectedResults = [
        {
          type: "CREATE",
          queryString: `CREATE (s:Student {
          email: $email
        })`,
          queryObjs: [],
        },
        {
          type: "RETURN",
          queryString: "RETURN s",
          queryObjs: [],
        },
      ];

      // EXECUTE
      const results = convertQueryStringToArrayOfClauseObjs(query, params);

      // VERIFY
      expect(results).toEqual(expectedResults);

      // TEARDOWN

    });
  });

  describe("queryParser()", () => {
    test("The query should return an array of complete clause objects", () => {
      // SETUP
      const query = `
        CREATE (s:Student {
          email: $email
        })
        RETURN s
      `;

      const params = {
        email: "john@example.com",
      };

      const expectedResults = [
        {
          type: "CREATE",
          queryString: `CREATE (s:Student {
          email: $email
        })`,
          queryObjs: [
            {
              type: "node",
              label: "Student",
              alias: "s",
              props: {
                email: "john@example.com",
              }
            },
          ],
        },
        {
          type: "RETURN",
          queryString: "RETURN s",
          queryObjs: [],
        },
      ];

      // EXECUTE
      const results = queryParser(query, params);

      // VERIFY
      expect(results).toEqual(expectedResults);

      // TEARDOWN

    });
  });

});
