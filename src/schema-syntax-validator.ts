import * as readline from "node:readline";
import * as fs from "fs";
import { EOL } from "os";
import { handleError } from "./utils";
import { SchemaType } from "./types";

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
 * This function will remove all comments from the .gqls file, convert the .gqls node and relation schema objects to JavaScript objects, and write those JavaScript objects to a new `.ts` schema file. That `.ts` schema file will be used to validate the GQL queries.
 * @param schemaFilepath 
 */
export function convertGQLSchemaToTypeScriptSchema(schemaFilepath: string) {
  try {
    const input = fs.createReadStream(schemaFilepath);
    const output = fs.createWriteStream("schema.gqls.ts", { encoding: "utf8" });
    // Create a readable stream from a file. The readline module reads the file line by line, but from a readable stream only.
    const rl = readline.createInterface({ input });

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
      output.write(`export const schema = {${EOL}`);
      labels.forEach(label => {
        output.write(`  ${label},${EOL}`);
      });
      output.write(`};${EOL}`);
      output.end();
      console.log("Finished writing to file.");
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

convertGQLSchemaToTypeScriptSchema("./schema.gqls");


export function checkForDuplicateLabels(schema: SchemaType) {
  try {
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

/**
 * This function will validate the schema to make sure that it contains the correct schema definitions for Nodes (INodeSchema types) and Relationships (IRelationshipSchema types) and that each property within each schema definition is formatted correctly. 
 * This function is only intended to check the schema file and validate that it uses correct syntax. This function is *not* intended to validate that queries follow the schema that has been defined. That is handled in the query-validator.ts file.
 * @param schema 
 * @returns 
 */
// export function schemaSyntaxValidator(schema: SchemaType) {
export async function schemaSyntaxValidator(schemaFilepath: string) {
  try {
    // Read schema file line-by-line and remove all comments (i.e. everything after a # sign).
    const tsSchema = convertGQLSchemaToTypeScriptSchema(schemaFilepath);

    const schema = await import(schemaFilepath + ".ts")
    checkForDuplicateLabels(schema);

    // Check if nodes have all of the properties from the types.ts file.

    // Check if relations have all of the properties from the types.ts file.

    // TODO: Add more schema syntax validations. 
    
    return "Your schema uses valid syntax!";
  }
  catch(err: any) {
    handleError("schemaValidator", err);
    // This `throw err` statement is necessary to prevent TypeScript errors.
    throw err;
  }
}
