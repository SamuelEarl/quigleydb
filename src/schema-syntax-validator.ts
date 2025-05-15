import { handleError } from "./utils";
import { SchemaType } from "./types";


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
export function schemaSyntaxValidator(schema: SchemaType) {
  try {
    checkForDuplicateLabels(schema);

    // TODO: Add more schema syntax validations. 
    
    return "Your schema uses valid syntax!";
  }
  catch(err: any) {
    handleError("schemaValidator", err);
    // This `throw err` statement is necessary to prevent TypeScript errors.
    throw err;
  }
}
