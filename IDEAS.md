# GQL Middleware Ideas

## What is a schema migration?

A database schema migration is the process of making changes to the structure of a database schema while ensuring data integrity and minimal downtime. It involves applying a series of changes to the database schema, such as adding tables, columns, or constraints, or modifying existing elements. These changes are typically managed through version control systems and scripts, allowing for trackable and reversible transformations.

Here's a more detailed explanation:

**What is a database schema?**

A database schema defines the structure of a database, including tables, columns, data types, and relationships between them.

**Why are schema migrations needed?**

As applications and their data models evolve, the database schema needs to adapt. Schema migrations allow for these changes to be made in a controlled and managed way.

**How are schema migrations typically managed?**

* **Migration scripts:** These scripts, often written in SQL or a similar language, define the changes to be made to the database schema. 
* **Version control:** Migration scripts are often version controlled, allowing for easy tracking of changes and rollbacks if needed. 
* **Migration tools:** Tools like Liquibase or Bytebase help automate the application of migration scripts and manage the database schema.
* **Incremental changes:** Migrations typically involve applying changes incrementally, rather than making all changes at once. 
* **Reversibility:** Migrations are designed to be reversible, allowing you to roll back changes if something goes wrong. 

**Benefits of using schema migrations**

* **Controlled changes:** Schema migrations provide a structured and controlled way to make changes to the database schema. 
* **Data integrity:** Migrations help ensure that changes to the database schema do not compromise the integrity of existing data. 
* **Version control:** Migrations allow for easy tracking of changes to the database schema, making it easier to understand the history of the database. 
* **Rollbacks:** Migrations provide a mechanism for rolling back changes if something goes wrong. 
* **Automation:** Migration tools automate the application of changes, reducing the risk of errors and making the process more efficient. 

_Source: AI Overview when searching for "what is a schema migration" in Google._

Constraints are how things like required fields, optional fields, default values (for optional fields), and data types for each field are defined.

---

## Project Ideas

Maybe this project won't work as a middleware, unless that middleware lives in the database code. The following bullet points are a workflow that I might use as I develop this project. 

Maybe I need to create a Node.js middleware first and use that as a prototype to test these ideas. If the prototype works, then I can present this to the FalkorDB team as a feature request that is implemented in the database.

I imagine the user flow for developing and working with the data in their database would go something like this (and in this order):

1. Create a schema file. Along with node and relationship definitions, this file should include indexes and constraints that need to be created/updated in the database. 
    1. Decide on the syntax of the file. Maybe it should use a similar syntax that Cypher uses to create indexes and constraints, which are similar to SQL and SurrealQL schema file syntax. Or maybe it would be better to create a new syntax that is more object-based, similar to GraphQL.
        1. I have created a `schema.v1.gql` file (in the `schema-ideas` folder) that uses a similar syntax to GraphQL schema files, but also combines some ideas from Mongoose.js and SurrealDB's edge tables.
        2. Look at https://graphql.org/learn/schema/ for more schema ideas and data type ideas.
        3. I like the file extension `.gqls` for Graph Query Language Standard. I might also support something like `.gqliso`.
    2. Figure out how to ingest that schema file through a FalkorDB CLI so the schema is applied to the database. It looks like Falkor has a redis-cli.
        1. This might be a good starting point for understanding how to ingest files: https://stackoverflow.com/a/74881523
    3. Figure out a file type and create a syntax highlighter/formatter for VSCode for the file type. Look at the GraphQL extensions in VSCode to see how they handle stuff.
    4. Would it be helpful if indexes and constraints could be applied separately from the node and relationship definitions or should all schema definitions be applied at the same time so that indexes/constraints stay insync with node and relationship definitions? Maybe the latter idea would be best.
        1. I need to do some research about how other databases handle their schema definitions and migrations.
        2. How do they handle how indexes and constraints are defined and applied? For example, in a SQL database, are data definitions along with indexes/constraints all defined in the same `.sql` file? And are any updates to the schema definitions all applied at the same time during a schema migration?
2. Create a "schema validator" in the CLI.
    1. Figure out how to run the `schema-syntax-validator` file through a CLI. I want users to run the schema file through the CLI (`qgly validate schema`), which will run the `schemaSyntaxValidator()` function, convert the file to a TypeScript (or Rust) file, and validate the schema syntax (i.e. verify that the user is using the correct syntax for their schema).
    2. I want the `schemaSyntaxValidator()` function to read from the config file when the user runs `qgly validate schema`, so I will need to figure out how to do that after this project is turned into a package.
3. Automate schema migrations with a CLI.
    1. The CLI commands will reference the schema file and use the definitions that are in the schema file.
    2. Maybe I could have a command like `qgly generate migration schema.v1.gqls schema.v2.gqls` that creates a diff of the two (versioned) schema files along with default values that should be inserted for new properties that are introduced into the schema. This could create a migration file with a name like this: `migration.from.v1.to.v2.gqls`. (The syntax of the `generat migration` command is `qgly generate migration from-schema-version.gqls to-schema-version.gqls`.)
    3. Then I could have a command like `qgly apply migration migration.from.v1.to.v2.gqls staging` that executes the migration against the specified database (which is "staging" in the previous example). Then I can run unit/integration/e2e tests in that environment.
    4. The CLI will create/update/delete indexes and constraints in the database based on what has been defined (or removed) in the schema.
    5. In the Quigley config (`qgly.config.ts`) the user would then have to update the schema that is referenced so that queries do not throw validation errors. Or, better yet, that should be automated by the CLI with an alert to the user that the schema that is referenced in the config file will be updated to the newly migrated schema.
4. Each query should be validated against the schema that is stored in the database.
    1. No matter which language is used in the server-side code, each query probably gets translated into a syntax that the database understands before the query is processed by the database. So I need to figure out where the translated queries occur in the database or the language drivers and validate the query against the schema using the translated queries instead of trying to create a query validator for only one language (e.g. JavaScript or Python). UPDATE: The query strings that are used in the language drivers are the same ones that are used in the data browser, so maybe there isn't a query translation that the database uses.
5. Query results should have an option to be formatted as a hierarchical data structure.
    1. See [Using Cypher to return nested, hierarchical JSON from a tree](https://stackoverflow.com/questions/34234373/using-cypher-to-return-nested-hierarchical-json-from-a-tree)

---

## Initial Thoughts (but still relevant)

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
3. Uses GelDB's query language (formerly EdgeDB) as inspiration (e.g. schema declaration, query syntax, and hierarchical format of query results). See https://docs.geldata.com/.
4. (Maybe) Borrows ideas from Memgraph's GQLAlchemy library. See https://memgraph.com/memgraph-for-python-developers and https://github.com/memgraph/gqlalchemy/tree/main.
5. Borrow ideas from Drizzle ORM (e.g. type safety).
