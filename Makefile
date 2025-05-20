# Run the Quigley code in the `src` directory.
quigley:
	cd src && bun run index.ts

# Run a function in the `schema-syntax-validator.ts` file.
# There is code at the bottom of that file that uses `eval()` to run the function with the argument(s) that are passed as the arguments here.
convert-schema:
	cd src && bun run schema-syntax-validator.ts convertGQLSchemaToTypeScriptSchema "./schema.v1.gqls"

# Run the demo project code.
demo-project:
	cd demo-project/src && bun run index.ts
