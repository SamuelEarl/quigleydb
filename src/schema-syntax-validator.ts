import * as readline from "node:readline/promises";
import * as fs from "fs";
import { EOL } from "os";
import * as path from "path";
import { config } from "../qgly.config";
import { handleError } from "./utils";
import { SchemaType } from "./types";

const fileExtension = ".js";

/**
 * This function will create a string of a JavaScript object, which will be written to a `.ts` file.
 * That `.ts` file will be the schema that will be used to validate the GQL queries.
 * @param schemaObjType 
 * @param schemaObjString 
 * @returns 
 */
export function createSchemaObj(schemaObjType: string, schemaObjString: string) {
  try {
    let labelIndex = 5;
    if (schemaObjType === "relation") labelIndex = 9;

    let schemaObj = "";
    
    schemaObj += "const ";
    const label = schemaObjString.substring(labelIndex, schemaObjString.indexOf("{")).trim();
    schemaObj += `${label} = {${EOL}`;
    schemaObj += `  type: "${schemaObjType}",${EOL}`;
    schemaObj += `  label: "${label}",${EOL}`;
    const body = schemaObjString.substring(schemaObjString.indexOf("{") + 1).trim();
    schemaObj += `  ${body}${EOL}${EOL}`;

    return { label, obj: schemaObj };
  }
  catch(err: any) {
    handleError("createSchemaObj", err);
    // This `throw err` statement is necessary to prevent TypeScript errors.
    throw err;
  }
}

/**
 * This function will remove all comments from the `schema.gqls` file (i.e. everything after a # sign), convert the `schema.gqls` node and relation schema objects to JavaScript objects, and write those JavaScript objects to a new `schema.gqls.ts` file. That `schema.gqls.ts` file will be used to validate the GQL queries.
 * @param schemaFilepath 
 */
export async function convertGQLSchemaToTypeScriptSchema(schemaFilepath: string) {
  try {
    console.log("schemaFilepath:", schemaFilepath);
    const filename = schemaFilepath + fileExtension;
    const input = fs.createReadStream(path.resolve(schemaFilepath));
    const output = fs.createWriteStream(filename, { encoding: "utf8" });
    // Create a readable stream from a file. The readline module reads the file line by line, but from a readable stream only.
    const rl = readline.createInterface({
      input,
      crlfDelay: Infinity, // To handle both Windows and Unix line endings. This treats `\r\n` as a single newline on Windows machines.
    });

    let schemaObjString = "";
    const labels: string[] = [];

    // Listen for the "line" event, which will be triggered whenever a new line is read from the stream.
    // When each line is read, print the line to the console.
    rl.on("line", (line) => {
      const commentStart = line.indexOf("#");
      let schemaCode = "";
      let comment = "";
      let writeLine = "";
      // If there is a comment on the line, then remove it and write the schema code to the output file.
      if (commentStart !== -1) {
        schemaCode = line.substring(0, commentStart);
        comment = line.substring(commentStart);
        // If the line contains schema code, then set writeLine to equal the schemaCode line so it can be written to the output file.
        // Otherwise, the line will be skipped and it won't be written to the output file (e.g. if the line is only a comment).
        if (schemaCode.trim().length) {
          writeLine = schemaCode;
        }
      }
      // If there is NO comment on the line, then set writeLine to equal the line so it can be written to the output file.
      else {
        writeLine = line;
      }
      // Remove beginning and ending whitespace from the line.
      writeLine.trim();
      // After removing whitespace, if the line is an empty string, then don NOT include it in the output file. This will remove blank lines from the output file.
      if (writeLine.length) {
        // If the line is the end of a schema object, then write that schema object to a `.ts` schema file.
        if (writeLine.startsWith("};")) {
          schemaObjString += `${writeLine}${EOL}`;
          if (schemaObjString.startsWith("node")) {
            const { label, obj } = createSchemaObj("node", schemaObjString);
            labels.push(label);
            output.write(obj);
            schemaObjString = "";
          }
          else if (schemaObjString.startsWith("relation")) {
            const { label, obj } = createSchemaObj("relation", schemaObjString);
            labels.push(label);
            output.write(obj);
            schemaObjString = "";
          }
        }
        // Concatenate each schema object to a string representation.
        else {
          // Replace "Int" and "Float", which are not JavaScript types, with "Number", which is a JavaScript type.
          writeLine = writeLine.replace("Int", "Number");
          writeLine = writeLine.replace("Float", "Number");
          schemaObjString += `${writeLine}${EOL}`;
        }
      }
    });

    rl.on("close", () => {
      // Write the schema export at the end of the file.
      let schemaExport = `export const schema = {${EOL}`;
      labels.forEach(label => {
        schemaExport += `  ${label},${EOL}`;
      });
      schemaExport += `};${EOL}`;
      output.write(schemaExport);


      // output.write(`export const schema = {${EOL}`);
      // labels.forEach(label => {
      //   output.write(`  ${label},${EOL}`);
      // });
      // output.write(`};${EOL}`);
      output.end();
      console.log("Finished writing to file.");

    });

    // The following Promise will allow the execution of this `convertGQLSchemaToTypeScriptSchema()` function to be awaited before execution is returned to the calling function.
    await new Promise<void>((resolve) => {
      output.on("finish", () => {
        console.log("Finished processing and writing.");
        resolve();
      });
    });

    rl.on("error", (err) => {
      console.error("An error occurred:", err);
      output.end(); // Ensure the output stream is closed in case of error.
    });
  }
  catch(err: any) {
    handleError("convertGQLSchemaToTypeScriptSchema", err);
    // This `throw err` statement is necessary to prevent TypeScript errors.
    throw err;
  }
}


export function checkForDuplicateLabels(schema: SchemaType) {
  try {
    console.log("schema:", schema);
    const labels: string[] = [];
    // Loop through the schema object.
    for (const schemaKey in schema) {
      // NOTE: I was able to fix the TypeScript error "Element implicitly has an 'any' type because expression of type 'X' can't be used to index type 'Y'." with this link: https://www.totaltypescript.com/concepts/type-string-cannot-be-used-to-index-type#solution-3-cast-the-index
      const queryObj = schema[schemaKey as keyof typeof schema];
      const label = queryObj.label;
      // This will validate that labels are unique among all nodes and relationships.
      // Check for duplicate labels.
      if (labels.includes(label)) {
        throw new Error(`Cannot have duplicate labels: ${label}`);
      }
      // If the label does not already exist in the `labels` array, then add it.
      else {
        labels.push(label);
      }
    }
  }
  catch(err: any) {
    handleError("checkForDuplicateLabels", err);
    // This `throw err` statement is necessary to prevent TypeScript errors.
    throw err;
  }
}


// TODO: Figure out how to run this file and the `schemaSyntaxValidator()` function through a CLI. I want users to run the schema file through the CLI (`qgly validate schema`), which will run the `schemaSyntaxValidator()` function, convert the file to a TypeScript file, and validate the schema syntax (i.e. verify that the user is using the correct syntax for their schema).
// TODO: I want this function to read from the config file when they run `qgly validate schema`, so I will need to figure out how to do that after this projected is turned into a package.

/**
 * This function will validate the schema to make sure that it contains the correct schema definitions for Nodes (INodeSchema types) and Relationships (IRelationshipSchema types) and that each property within each schema definition is formatted correctly. 
 * This function is only intended to check the schema file and validate that it uses correct syntax. This function is *not* intended to validate that queries follow the schema that has been defined. That is handled in the query-validator.ts file.
 * @param schemaFile 
 * @returns 
 */
export async function schemaSyntaxValidator(schemasDir: string = config.schemasDir, schemaFile: string = config.schema) {
  try {
    // console.log("schemasDir:", schemasDir);
    // console.log("schemaFile:", schemaFile);
    const absoluteSchemaFilepath = `${schemasDir}/${schemaFile}`;
    console.log("absoluteSchemaFilepath:", absoluteSchemaFilepath);

    // Convert the gqls.schema file to a TypeScript schema file, which will be used to validate the queries.
    await convertGQLSchemaToTypeScriptSchema(absoluteSchemaFilepath);

    console.log("filepath:", `${absoluteSchemaFilepath}${fileExtension}`);
    let module;
    try {
      module = await import(`${absoluteSchemaFilepath}${fileExtension}`);
    }
    catch(err: any) {
      throw new Error(`Schema objects must be unique. A schema object named ${err.message}.`);
    }

    // TODO: Since the labels will be auto-generated based on the schema.gqls file, I need to update this function. Do I still need to check for duplicates? Should I throw an error that would make more sense to users who are working with the schema.gqls files? Maybe throwing the error above addresses this issue now and the `checkForDuplicateLabels()` function is no longer needed.
    checkForDuplicateLabels(module.schema);

    // Check if nodes have all of the properties from the types.ts file.

    // Check if relations have all of the properties from the types.ts file.

    // TODO: Add more schema syntax validations. 
    
    return "Your schema uses valid syntax!";
  }
  catch(err: any) {
    handleError("schemaSyntaxValidator", err);
    // This `throw err` statement is necessary to prevent TypeScript errors.
    throw err;
  }
}


// TODO: Remove this code when I am done testing it. This is called from the Makefile, so I may need to remove that code too.
// Accessing command line arguments
const args = process.argv.slice(2);
console.log("ARGS:", args);

// Calling the function with the argument
if (args.length === 2) {
  eval(`${args[0]}("${args[1]}")`);
}
else if (args.length === 1) {
  eval(`${args[0]}()`);
}
else if (args.length === 0) {
  console.log('Please provide a function name and a filepath as arguments (e.g. "./schema.v1.gqls")');
}
