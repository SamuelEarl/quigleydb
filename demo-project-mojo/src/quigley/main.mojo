# TODO: I need to figure out how to read the configs from a TOML file and use those configs in the quigley function.
from ... qgly_config import config
# from ./schema-syntax-validator import schema_syntax_validator
# from ./query-parser import query_parser
# from ./query-validator import query_validator
# from ./query-results-formatter import query_results_formatter
# from ./utils import handle_error
# from "./types" import QueryClauseObj, QueryParams

# var MOJO_ENV = process.env
# print("MOJO_ENV:", MOJO_ENV)

async fn quigley(
  query_string: String, 
  query_params: Dict[String, String], 
  format_query_results_hierarchically: Bool = config.format_query_results_hierarchically
) raises:
    """
    This function will take a GQLr query string, validate it against the schema that is set in the `qgly.config.toml` file, and return the results in a hierarchical (GraphQL-like) data structure.

    Users can set the default formatting for query results by setting `format_query_results_hierarchically` to `true` or `false` in the `qgly.config.toml` file. Or users can set the formatting for their queries on a case by case basis by passing `true` or `false` as the third parameter to the quigley function.
    """
    try:
        # TODO: I think I can remove the call to the schemaSyntaxValidator() function.
        # UPDATE: I don't think it makes sense to run the schema syntax validator before each query. But it does make sense to run the schema file through a CLI to verify that the syntax is correct. Read my notes in the `schema-styntax-validator.ts` file.
        # Validate the schema to make sure that it contains the correct schema definitions for Nodes (INodeSchema types) and Relationships (IRelationshipSchema types) and that each property within each schema definition is formatted correctly.
        # if (config.validate_schema_in_envs.includes(MOJO_ENV!)):
        #     schemaSyntaxValidator(config.schema)

        var queryClauseObjs: QueryClauseObj[] = []

        # Parse the query string and params into JavaScript objects that will be used in the following steps.
        # If the user either wants to validate the query in the current environment or they want to format the query results hierarchically, then the query needs to be parsed. So the following if statement checks if the user want to validate the query or if they want to format the query results hierarchically.
        if (config.validate_query_in_envs.includes(MOJO_ENV!) || format_query_results_hierarchically):
            if (query_params):
                const params = query_params.params
                queryClauseObjs = query_parser(query_string, params)
            else:
                queryClauseObjs = query_parser(query_string)
            # console.log("queryClauseObjs:", queryClauseObjs)

        if (config.validate_query_in_envs.includes(MOJO_ENV!)):
            # TODO: 
            # Validate the query objects (nodes and relationships), from the `queryObjs` array, against the schema.
            # Read about the validations that Mongoose performs: https:#mongoosejs.com/docs/validation.html.
            query_validator(queryClauseObjs)

        if (format_query_results_hierarchically):
            # TODO: 
            # Format the query results into a hierarchical (GraphQL-like) data structure.
            return query_results_formatter(queryClauseObjs)
        else:
            # Return query results with default formatting.
            # return await graph.query(query_string, query_params)
    except e:
        # handle_error("quigley", err)
        raise Error("quigley", e)
