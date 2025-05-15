import { configs } from "./qgly.config";
import { schemaSyntaxValidator } from "./schema-syntax-validator";
import { queryParser } from "./query-parser";
import { queryValidator } from "./query-validator";
import { queryResultsFormatter } from "./query-results-formatter";
import { handleError } from "./utils";
import type { IQueryClauseObj, IQueryParams } from "./types";

const { NODE_ENV } = process.env;
console.log("NODE_ENV:", NODE_ENV);

/**
 * This function will take a GQL query string, validate it against the schema that is set in the `qgly.config.ts` file, and return the results in a hierarchical (GraphQL-like) data structure.
 * 
 * Users can set the default formatting for query results by setting `formatQueryResultsHierarchically` to `true` or `false` in the `qgly.config.ts` file. Or users can set the formatting for their queries on a case by case basis by passing `true` or `false` as the third parameter to the quigley function.
 * 
 * @param queryString 
 * @param queryParams 
 * @param formatQueryResultsHierarchically
 */
export async function quigley(
  queryString: string, 
  queryParams?: IQueryParams, 
  formatQueryResultsHierarchically = configs.formatQueryResultsHierarchically
) {
  try {
    // Validate the schema to make sure that it contains the correct schema definitions for Nodes (INodeSchema types) and Relationships (IRelationshipSchema types) and that each property within each schema definition is formatted correctly.
    if (configs.validateSchemaInEnvs.includes(NODE_ENV!)) {
      schemaSyntaxValidator(configs.schema);
    }

    let queryClauseObjs: IQueryClauseObj[] = [];

    // Parse the query string and params into JavaScript objects that will be used in the following steps.
    // If the user either wants to validate the query in the current environment or they want to format the query results hierarchically, then the query needs to be parsed. So the following if statement checks if the user want to validate the query or if they want to format the query results hierarchically.
    if (configs.validateQueryInEnvs.includes(NODE_ENV!) || formatQueryResultsHierarchically) {
      if (queryParams) {
        const params = queryParams.params;
        queryClauseObjs = queryParser(queryString, params);
      }
      else {
        queryClauseObjs = queryParser(queryString);
      }
      // console.log("queryClauseObjs:", queryClauseObjs);
    }

    if (configs.validateQueryInEnvs.includes(NODE_ENV!)) {
      // TODO: 
      // Validate the query objects (nodes and relationships), from the `queryObjs` array, against the schema.
      // Read about the validations that Mongoose performs: https://mongoosejs.com/docs/validation.html.
      queryValidator(queryClauseObjs);
    }

    if (formatQueryResultsHierarchically) {
      // TODO: 
      // Format the query results into a hierarchical (GraphQL-like) data structure.
      return queryResultsFormatter(queryClauseObjs);
    }
    else {
      // Return query results with default formatting.
      // return await graph.query(queryString, queryParams);
    }
  }
  catch(err: any) {
    handleError("quigley", err);
    throw err;
  }
}
