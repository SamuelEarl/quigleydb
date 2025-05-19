import { schema } from "../demo-project/src/db/schemas/school-schema.v1";

export const configs = {
  schema: "./schema.gqls",
  validateSchemaInEnvs: ["development"],
  validateQueryInEnvs: ["development", "test", "staging"], // Define the environments where queries should be validated against the schema. Queries are set during development and don't change after that. So if the queries are validated during development, then I don't think they need to be validated in production. This will make the queries faster in production because the query validation step can be skipped.
  formatQueryResultsHierarchically: true, // Users can set the default formatting for query results by setting `formatQueryResultsHierarchically` to `true` or `false`. Users can also set the formatting for their queries on a case by case basis by passing `true` or `false` as the third parameter to the quigley function.
  connect: {
    username: "myUsername",
    password: "myPassword",
    socket: {
      host: "localhost",
      port: 6379,
    },
  },
  graph: "myGraph",
};
