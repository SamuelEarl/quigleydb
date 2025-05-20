# TODOS

* Make the code more modular and based around the clauses. There are many clauses that I am not familiar with but that I would like to add into the schema validations (and other parts of the middleware) later. Maybe one way to make it easy to add code for different clauses would be to make the code more modular depending on the clause. For example, when parsing a query string, I am extracting clauses and converting them to `queryClauseObj`s. After the `queryClauseObj`s have been created, maybe the next step is to check the type of each `queryClauseObj` and run it through the necessary stages that apply to that `queryClauseObj`. When I want to add schema validations for a new `queryClauseObj`, then most of the code will probably already exist to validate the new clause against the schema and I will only need to add checks and validations for anything that is unique to the new clause.
* Required and Default Values: I could allow for required and default values and I would reconstruct the query string and add any default values, as opposed to trying to inject default values into the existing query string. See my notes in the SCHEMA_DEFINITION_RULES.md file.
* I need to work through some tutorials from Neo4j, Memgraph, etc. that use demo datasets (e.g. the movie dataset) to test multiple queries of varying complexity to make sure that my schema validations and hierarchical query results work properly. I could also work through Neo4j's [Cypher Manual](https://neo4j.com/docs/cypher-manual/current/introduction/) and test my code and ideas against the queries that are presented in there.
  * I can look at this page https://neo4j.com/docs/getting-started/appendix/example-data/ and maybe even work through all of the pages starting here https://neo4j.com/docs/getting-started/
* Improve error messages.
* Once I package this up into an NPM package, get the package to read the config file in the project root.
  * [How do node_modules packages read config files in the project root?](https://stackoverflow.com/questions/56729491/how-do-node-modules-packages-read-config-files-in-the-project-root)
  * Look at [drizzle.config.ts](https://orm.drizzle.team/docs/drizzle-config-file) for config file ideas.
  * Possible packages that could help with this:
    * https://www.npmjs.com/package/lilconfig
    * https://www.npmjs.com/package/cosmiconfig
