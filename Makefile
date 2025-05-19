# Run the Quigley code in the `src` directory.
quigley:
	cd src && bun run index.ts quigley ""

# Run individual functions in the Quigley code.
read-schema:
	cd src && bun run schema-syntax-validator.ts

# Run the demo project code.
demo-project:
	cd demo-project/src && bun run index.ts
