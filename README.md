# Quigley - GQL Middleware for FalkorDB

Quigley is a middleware for GQL that provides two things:

1. Schema validation. It will validate your GQL query against a schema that you define. After your GQL query is validated, then your query will be sent to the database.
2. Hierarchically formatted query results. Your query results will be formatted in a data structure that is GraphQL-like and that shows the relationships between the records that are returned.

There will also be a CLI that helps to automate schema migrations.

---

## Motivations

* I like how SurrealDB has an optional schema, which makes it easier when prototyping apps and testing ideas. But when you are ready to create production-level apps, you want a clearly-defined schema that everyone has to adhere to otherwise you could run into data integrity and/or data corruption issues. So I want to provide a similar "optional schema" feature for graph databases that use GQL.
* I want the schema to be validated during development and even in production. It might not be necessary to validate the schema in production if you have already been validating it during development, but the option is there if you need it.
* I want to have hierarchical data structures from my queries. Graph databases are great for showing the relationships between records (called nodes), but if the queries return results as a flat list of records with no relationships, then it feels like we are missing a huge part of what makes graph databases so awesome!
* If you have a schema, then you will have to deal with schema migrations. I want to create a Quigley CLI (qgly) that also helps to automate schema migrations.

---

## Resources

* [Effortlessly Build Your Own ORM in JavaScript — This Guide Makes it a Breeze to Use Node.js with Oracle!](https://medium.com/@dikibhuyan/how-to-make-your-own-oracle-orm-in-javascript-node-42f97751b10)
* How to [Publish a npm package locally for testing](https://medium.com/@debshish.pal/publish-a-npm-package-locally-for-testing-9a00015eb9fd)

---

## Testing the Code

### How to run the unit tests

This project uses Vitest as the test runner because it can be configured with type checking enabled, which will include a "Type Errors" line in the output.

### Run all the unit tests

```
bun run test
```

```
NOTE:

If you are using Bun as your package manager, make sure to use "bun run test" command instead of "bun test", otherwise Bun will run its own test runner.

See https://vitest.dev/guide/#writing-tests
```

### Filter tests

You can filter tests by adding the filename to the end of the test script in the `package.json` file. For example, `"vitest run --typecheck query-validator"`. Then run `bun run test`.

See [Test Filtering](https://vitest.dev/guide/filtering)

If any suites/tests are marked with `describe.only()`/`test.only()`, then only those suites/tests will run.

If any suites/tests are marked with `describe.skip()`/`test.skip()`, then those suites/tests will be excluded when you run `bun run test`.

See [Vitest API](https://vitest.dev/api/).


### How to run individual functions or the code in the `demo-project` directory

Look at the Makefile for some commands that can be used to run code in this project.

This project was created using the Bun runtime. You can follow the instruction on Bun's website to [install Bun on your computer](https://bun.sh/docs/installation).

Using npm scripts: You can run the entire Quigley library with `bun` by running `bun run demo-project` from the project root directory.

---

## Why the name Quigley

The name Quigley looks like the letters GQL rearranged and turned into a word (QuiGLey).

---

## Language Support in VSCode

The syntax of a `.gqls` file is very similar to a GraphQL file (`gql`, `graphql`). You can even get syntax highlighting and some language support by associating `.gqls` files with `.gql` file types (at least until there is a official language support created for VSCode).

Open your `settings.json` file (`Shift+Ctrl+P` (Linux/Windows), `Shift+Command+P` (Mac)) and create an entry for file associations:

```json
"files.associations": {
  "*.gqls": "gql"
}
```

You might need to rename your `schema.gqls` file to `schema.gql` (drop the "s" at the end) (remember to press enter so the file actually gets renamed) and then rename it back to `schema.gqls` for the file association to take affect in VSCode.
