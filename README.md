# Quigley - GQL Middleware for FalkorDB

Quigley is a middleware for GQL that provides two things:

1. Schema validation. It will validate your GQL query against a schema that you define. After your GQL query is validated, then your query will be sent to the database.
2. Hierarchically formatted query results. Your query results will be formatted in a data structure that is GraphQL-like and that shows the relationships between the records that are returned.

There is also a CLI that helps to automate schema migrations.

---

## Motivations

* I like how SurrealDB has an optional schema, which makes it easier when prototyping apps and testing ideas. But when you are ready to create production-level apps, you want a clearly-defined schema that everyone has to adhere to otherwise you are going to run into data integrity and corruption issues. So I wanted to provide a similar "optional schema" feature for graph databases that use GQL. 
* I want the schema to be validated during development and even in production, if it is also necessary to validate the schema in production.
* I want to have hierarchical data structures from my queries. Graph database are great for showing the relationships between records (called nodes), but if the queries return results as a flat list of records with no relationships, then it feels like we are missing a huge part of what makes graph databases so awesome!
* If you have a schema, then you will have to deal with schema migrations. I want to create a CLI that also helps to automate schema migrations.

---

## Resources

* [Effortlessly Build Your Own ORM in JavaScript — This Guide Makes it a Breeze to Use Node.js with Oracle!](https://medium.com/@dikibhuyan/how-to-make-your-own-oracle-orm-in-javascript-node-42f97751b10)
* How to [Publish a npm package locally for testing](https://medium.com/@debshish.pal/publish-a-npm-package-locally-for-testing-9a00015eb9fd)

---

# Testing the Code

## How to run the unit tests

* `bun test` This will run all the unit tests.
or
* `bun test --only` This will only run tests that are marked with "test.only()".


## How to exclude unit tests from a test run

Tests that are marked with "test.skip()" will be excluded when you run `bun test` and those skipped tests will be marked as `skip` in the terminal output.

See [Skip tests with the Bun test runner](https://bun.sh/guides/test/skip-tests).


## How to run the code in the `quigley/` directory

After running the unit tests, I need to run the entire Quigley library with ts-node to make sure that all of the TypeScript code is accurate.

* Install TypeScript globally with ts-node: `npm install -g ts-node`
* Run the TypeScript file:
    * Run `npm run qgly` from the project root directory.
    * Or navigate to the `src/db/` directory and run `NODE_ENV="development" ts-node quigley-demo.ts`

---

## GQL Middleware Ideas

I want to create a GQL middleware for FalkorDB that uses these ideas:

1. Implement schema validation. See Mongoose.js (https://mongoosejs.com/docs/validation.html).
  1. Maybe TigerGraph's schema definition has some ideas: [Defining a Graph Schema](https://docs.tigergraph.com/gsql-ref/4.1/ddl-and-loading/defining-a-graph-schema)
2. Automate schema migrations. I want to be able to apply changes to a database's schema and data as my web app evolves. So I am wondering how to do things like adding or removing nodes, edges, properties, or indexes, and modifying data types or constraints in the schema and in the data across the entire database. I want to know how to apply those changes while avoiding data loss or compatibility issues.
  1. Search for "how do database schema migrations work".
  2. For ideas on schema migrations, see:
    1. [Database Schema Migration (Schema Change)](https://www.liquibase.com/resources/guides/database-schema-migration)
    2. [Neo4j Schema Migrations?](https://stackoverflow.com/questions/53083183/neo4j-schema-migrations)
    3. [Updating all nodes in a graph](https://stackoverflow.com/questions/35864406/updating-all-nodes-in-a-graph)
    4. [Neo4j-Migrations](https://neo4j.com/labs/neo4j-migrations/) is inspired largely by [Redgate Flyway](https://www.red-gate.com/products/flyway/community/).
  3. Could migrations be automated with a CLI?
    1. Maybe I could have a command like `qgly generate migration schema.v1.ts schema.v2.ts` that creates a diff of the two (versioned) schema files along with default values that should be inserted for new properties that are introduced into the schema. This could create a migration file with a name like this: `migration.to.schema.v2.ts`.
    2. Then I could have a command like `qgly apply migration migration.to.schema.v2.ts staging` that executes the migration against the specified database (which is "staging" in the previous example). Then I can run unit/integration/e2e tests in that environment.
    3. In the Quigley configs (qgly.config.ts) the user would then have to update the schema that is referenced so that queries do not throw validation errors. Or, better yet, that should be automated by the CLI with an alert to the user that the schema that is referenced in the config file will be updated to the newly migrated schema.
3. Uses EdgeDB's EdgeQL as inspiration (e.g. schema declaration, query syntax, and hierarchical format of query results). See https://docs.edgedb.com/get-started/edgeql.
4. (Maybe) Borrows ideas from Memgraph's GQLAlchemy library. See https://memgraph.com/memgraph-for-python-developers and https://github.com/memgraph/gqlalchemy/tree/main.
5. Borrow ideas from Drizzle ORM (e.g. type safety).

---

## Why the name Quigley

The name Quigley looks like the letters GQL rearranged and turned into a word (QuiGLey).
