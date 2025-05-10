import type {
  IAnyObject, 
  IQueryParams,
  QueryObjType,
  INodeQueryObj,
  IRelationshipQueryObj,
  IQueryClauseObj,
} from "./types";

// TODO: Decide how I want the results to be formatted. I like GraphQL's formatting, but it does not provide any data about the relationships. So I need to modify GraphQL formatting a bit to provide data about relationships. See https://graphql.org/learn/queries/
// * Results will be formatted in an object with each top-level result being a top-level key in the object.

// This is an example of how I think query results should be formatted. It is very similar to GraphQL syntax, but this formatting provides data about relationships.
const formattedResults = {
  "m": {
    "title": "Pirates of the Carribean",
    "releaseYear": 2003,
    "genres": ["action", "adventure", "comedy"],
    "ACTED_IN": [ // Provide properties about each relationship. NOTE: GraphQL syntax does *not* provide data about relationships.
      {
        "role": "Jack Sparrow",
        "awards": ["best actor"],
        "salary": 2000000000, // Expressed in cents.
        "a": { // In a graph query, each entry node can have multiple relationships pointing "from" the node, so it is necessary to show the relationships that are pointing "from" a node in an array. However, each of those relationships will have only one node that it is pointing "to", so it is necessary to show the node that a relationship is pointing to as a property of the relationship and the properties of the "to" node are displayed as a nested object.
          "firstName": "Johnny",
          "lastName": "Depp",
          "ACTED_UNDER": [
            {
              "d": {
                "firstName": "Gore",
                "lastName": "Verbinski"
              }
            }
          ]
        }
      },
      {
        "role": "Hector Barbossa",
        "awards": ["best supporting actor"],
        "salary": 2000000000,
        "a": {
          "firstName": "Geoffrey",
          "lastName": "Rush",
          "ACTED_UNDER": [
            {
              "d": {
                "firstName": "Gore",
                "lastName": "Verbinski"
              }
            }
          ]
        }
      }
    ]
  }
};
console.log("JOHNNY DEPP:", formattedResults.m.ACTED_IN[0].a.firstName)
console.log("GORE VERBINSKI:", formattedResults.m.ACTED_IN[0].a.ACTED_UNDER[0].d.firstName)
// ------------------------------------------
// // Return only the actors.
// const query = `
//   MATCH (m:Movie {
//     title: $title
//   })<-[:ACTED_IN]-(a:Actor)
//   RETURN a.firstName, a.lastName
// `;

// const results = qgly(query,
//   {
//     params: {
//       title: "Pirates of the Carribean",
//     }
//   }
// );

// // This is an example that shows how multiple top-level results will be formatted.
// const formattedResults = {
//   "a": [
//     {
//       "firstName": "Johnny",
//       "lastName": "Depp"
//     },
//     {
//       "firstName": "Geoffrey",
//       "lastName": "Rush"
//     }
//   ]
// }


export function queryResultsFormatter(queryClauseObjs: IQueryClauseObj[]) {
  console.log("Implement query results formatting");

  // TODO: Make a regular Cypher query, but use the queryObjs to format the results into a hierarchical data structure.
}
