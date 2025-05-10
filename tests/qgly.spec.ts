import { describe, expect, test } from "bun:test";
import { quigley as qgly } from "..";


// TODO: Make sure to write tests for all `throw new Error()` statements in the Quigley code.


describe("index.ts (qgly end-to-end tests)", () => {

  describe("qgly()", () => {
    test.skip("The query should return a hierarchical data structure", () => {
      // SETUP
      const query = `
        MATCH (s:Student {
          email: $email
        })-[:ENROLLED_IN]-(c:Course)-[:COURSE_INSTRUCTOR]-(i:Instructor)
        RETURN s, ENROLLED_IN, c.subject, c.title, i.firstName, i.lastName
      `;

      const params = {
        params: {
          email: "john@example.com",
        }
      };

      const expectedResults = {
        "s": {
          "firstName": "John",
          "lastName": "Doe",
          "email": "john@example.com",
          // TODO: Add the rest of the props.
          "ENROLLED_IN": [ // Provide properties about each relationship. NOTE: GraphQL syntax does *not* provide data about relationships.
            {
              "enrollmentDate": "2011-10-05T14:48:00.000Z",
              "c": { // In a graph query, each entry node can have multiple relationships pointing "from" the node, so it is necessary to show the relationships that are pointing "from" a node in an array. However, each of those relationships will have only one node that it is pointing "to", so it is necessary to show the node that a relationship is pointing to as a property of the relationship and the properties of the "to" node are displayed as a nested object.
                "title": "Physics 101",
                "subject": "Science",
                "COURSE_INSTRUCTOR": [
                  {
                    "instructingCourseSince": "2008-05-05T10:15:00.000Z",
                    "i": {
                      "firstName": "Gary",
                      "lastName": "Johnson"
                    }
                  }
                ]
              }
            },
            {
              "enrollmentDate": "2011-10-06T12:31:00.000Z",
              "c": {
                "title": "English 101",
                "subject": "English",
                "COURSE_INSTRUCTOR": [
                  {
                    "instructingCourseSince": "2009-05-05T12:23:00.000Z",
                    "i": {
                      "firstName": "Mary",
                      "lastName": "Smith"
                    }
                  }
                ]
              }
            },
          ]
        }
      };

      // EXECUTE
      const results = qgly(query, params);

      // VERIFY
      expect(results).toEqual(expectedResults);

      // TEARDOWN

    });
  });

});
