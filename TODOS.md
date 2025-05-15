# TODOS

* I need to work through some tutorials from Neo4j, Memgraph, etc. that use demo datasets (e.g. the movie dataset) to test multiple queries of varying complexity to make sure that my schema validations and hierarchical query results work properly. 
  * I can look at this page https://neo4j.com/docs/getting-started/appendix/example-data/ and maybe even work through all of the pages starting here https://neo4j.com/docs/getting-started/
* Improve error messages.
* Once I package this up into an NPM package, get the package to read the config file in the project root.
  * [How do node_modules packages read config files in the project root?](https://stackoverflow.com/questions/56729491/how-do-node-modules-packages-read-config-files-in-the-project-root)
  * Look at [drizzle.config.ts](https://orm.drizzle.team/docs/drizzle-config-file) for config file ideas.
  * Possible packages that could help with this:
    * https://www.npmjs.com/package/lilconfig
    * https://www.npmjs.com/package/cosmiconfig
