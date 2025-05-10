import { isEqual, sortBy } from "lodash";
import { configs } from "../../../qgly.config";
import { handleError } from "./utils";
import type {
  IAnyObject,
  PrimitiveTypesPlus,
  PrimitiveConstructorTypesPlus,
  IQueryParams,
  QueryObjType,
  INodeQueryObj,
  IRelationshipQueryObj,
  IQueryClauseObj,
  NestedObject,
  SchemaType,
} from "./types";

function getTypeOf(obj: PrimitiveTypesPlus) {
  return Object.getPrototypeOf(obj).constructor;
}

function getInstanceOf(obj: PrimitiveTypesPlus, type: any) {
  var objType = getTypeOf(obj)
  return (
      // Allow native instanceof in case of Symbol.hasInstance.
      obj instanceof type ||
      // Handle the case where the obj type is the same as the type that is passed to this function.
      getTypeOf(obj) === type ||
      // Handle general case.
      type.isPrototypeOf(objType) || 
      // Handle special case where type.prototype acts as a prototype of the object but its type isn't in the prototype chain of the obj's type.
      // OPTIONALLY remove this case if you don't want primitives to be considered instances of Object.
      type.prototype.isPrototypeOf(objType.prototype)
  );
}


/**
 * For CREATE and MERGE clauses, make sure that the prop exists in the query and throw an error if it does not.
 * @param queryObjProps 
 * @param prop 
 */
function checkForRequiredProps(queryObjProps: IAnyObject, prop: string) {
  // The following `if` statement checks for this: If no props object exists or the props object is empty or the prop from the current iteration of the `for` loop does not exist, then throw an error.
  if (!queryObjProps || Object.keys(queryObjProps).length === 0 || !queryObjProps[prop]) {
    throw new Error(
      `All node and relationship properties are required in CREATE and MERGE clauses. The "${prop}" property is missing from the query.`
    );

    // // TODO: Maybe this will be a version 2 feature: If a user does not pass a property and corresponding param in a CREATE or MERGE clause, then Quigly will throw an error, unless the user provides a default value for that prop in the schema. If the user does not pass a property and param but does provide a default value in the schema, then the default value will be inserted into the database.
    // if (schemaProps[prop]["default"]) {
    //   // Set the default value in the query string and in the params object. Is this too complex and unnecessary? Maybe I should just require users to specify all values in the query string and the params object instead of allowing users to define default values in the schema. Or I could require users to specify all values in the query string and I could populate the params object with the default value if they don't specify a param value. Since Cypher does not have a schema there is no way to define default values in Cypher, but I might want to change that with Quigley.
    // }
    // else {
    //   throw new Error(`All node and relationship properties are required in CREATE and MERGE clauses. ${prop} is missing from the query.`);
    // }
  }
}

/**
 * This function recursively searches the object and its nested objects for the specified key-value pair. It returns the first object found with the matching property or null if not found.
 * 
 * More specifically, this function takes an object (the database schema), and a key/value pair (i.e. the key will be "label" and the value will be the label that is defined for the node or relationship that is being searched for - e.g. "Student" or "ENROLLED_IN) and recursively searches the database schema and its nested objects for a property that matches the key/value pair. This function then returns the first nested object that is found in the schema that matches the key/value pair (i.e. the property) or if no match is found, then `null` is returned.
 * 
 * @param dbSchema - The type needs to be IAnyObject (instead of SchemaType) because when the function gets called recursively, then a nested object will get passed to it instead of the entire database schema.
 * @param key 
 * @param value 
 * @returns 
 * 
 * @example
    const data = {
      a: {
        b: {
          c: 1,
        },
      },
      d: {
        e: 2,
        f: {
          g: 3,
        },
      },
    };
    const result = findQueryObjSchema(data, "g", 3);
    console.log(result); // Output: { g: 3 }
    const result2 = findQueryObjSchema(data, "c", 5);
    console.log(result2); // Output: null
 */
export function findQueryObjSchema(dbSchema: IAnyObject, key: string, value: string): IAnyObject | null {
  // console.log("SCHEMA:", dbSchema);
  // console.log("KEY:", key, "VALUE:", value);
  if (typeof dbSchema !== "object" || dbSchema === null) {
    console.log("Schema is not an object");
    return null;
  }

  if (Object.hasOwn(dbSchema, key) && dbSchema[key] === value) {
    return dbSchema;
  }

  for (const prop in dbSchema) {
    if (Object.hasOwn(dbSchema, prop)) {
      const foundQueryObjSchema = findQueryObjSchema(dbSchema[prop], key, value);
      if (foundQueryObjSchema) {
        return foundQueryObjSchema;
      }
    }
  }

  return null;
}

/**
 * This function will validate the query objects (nodes and relationships), from the `queryClauseObj.queryObjs` array,
 * against the schema to ensure that the query aligns with the schema that has been defined (and the schema that should exist in the database).
 * For ideas on query validations, read about the validations that Mongoose performs: https://mongoosejs.com/docs/validation.html.
 * @param queryClauseObjs 
 */
export function queryValidator(queryClauseObjs: IQueryClauseObj[]) {
  try {
    console.log("queryClauseObjs:", queryClauseObjs);

    queryClauseObjs.forEach((queryClauseObj: IQueryClauseObj) => {
      queryClauseObj.queryObjs.forEach((queryObj) => {
        // console.log("DATABASE SCHEMA:", configs.schema);
        console.log("QUERY OBJECT:", queryObj);
        // Check if the query object (either a node or a relationship) exists in the schema by searching for a label property in the schema that matches the query object's label property. Labels have to be unique among nodes and also among relationships.
        // Get the schema for the query object, if it exists.
        const schemaForQueryObj = findQueryObjSchema(configs.schema, "label", queryObj.label)
        console.log("SCHEMA FOR QUERY OBJ:", schemaForQueryObj);
        if (schemaForQueryObj) {
          // Loop over the properties in the schemaForQueryObj and validate each one against the query object.
          for (const property in schemaForQueryObj) {
            // Check if the "type" and "label" match between the schema for the query object and the query object. If they do not match, then throw an error.
            if (property === "type" && schemaForQueryObj.type !== queryObj.type) {
              // If there is not a type with the specified label in the schema, then throw an error.
              throw new Error(`There is no ${queryObj.type} with the label "${queryObj.label}" in the schema. Check your query.`); 
            }
            if (property === "label" && schemaForQueryObj.label !== queryObj.label) {
              // If there is not a type with the specified label in the schema, then throw an error.
              throw new Error(`There is no ${queryObj.type} with the label "${queryObj.label}" in the schema. Check your query.`);
            }
            // Loop over the `props` in the schema and validate each prop from the query object against the schema.
            if (property === "props") {
              const schemaProps = schemaForQueryObj.props;
              // console.log("SCHEMA PROPS:", schemaProps);
              for (const prop in schemaProps) {
                console.log("PROP:", prop);
                // TODO: If the schema prop has nested props (e.g. the prop is an address with nested properties for city, state, street, zip), then I need to recursively loop over that nested object.
                if (!("type" in schemaProps[prop])) {
                  console.log("IMPLEMENT NESTED OBJECT INSPECTION!!!");
                }
                else {
                  if (queryObj.props) {
                    // TODO: Not every prop is required in every query. For example, a MATCH query might have only one prop or no props. So I need to figure out how to validate the queries based on the type of query. I guess it's only CREATE and MERGE queries that need to check for required properties because the data that gets entered into the database needs to include all required data. All other CRUD operations can just be validated for data types. So that might not be too difficult.
                    // Check if the query object is part of a "CREATE" or "MERGE" clause. If a prop is defined in the schema, then it is considered to be required. So make sure that every prop has been defined in the query object along with a corresponding param. See my "Schema Definition Rules" in the README.md file.
                    if (queryClauseObj.clause.toUpperCase() === "CREATE" || queryClauseObj.clause.toUpperCase() === "MERGE") {
                      checkForRequiredProps(queryObj.props, prop);
                    }
                  
                    // TODO: Each of these prop checks needs to be in their own function so I can create unit tests for them.

                    // Check if the prop's type from the schema matches the type that was passed as a param.
                    // The following `if` statement checks for this: If the props object exists and the prop from the current iteration of the `for` loop exists and the prop is *not* an `instanceof` the "type" from the schema, then throw an error.
                    // TODO: This `if` statement won't work, but I think this post has a solution that will work: https://stackoverflow.com/a/40227447. I want to name my equivalent functions getTypeOf() and getInstanceOf().
                    // See also https://stackoverflow.com/questions/899574/what-is-the-difference-between-typeof-and-instanceof-and-when-should-one-be-used.
                    if (queryObj.props[prop] && getInstanceOf(queryObj.props[prop], schemaProps[prop]["type"])) {
                      throw new Error(`The "${prop}" param's data type does not match the data type that is defined in the schema.`);
                    }

                    // Check the prop's `onlyOneValue` value.
                    if (schemaProps[prop]["onlyOneValue"]) {
                      // Check if the prop value is a single value (as opposed to an array of values) from the `onlyOneValue` array. If the prop value is not one of the values from the `onlyOneValue` array, then throw an error.
                      if (!schemaProps[prop]["onlyOneValue"].includes(queryObj.props[prop])) {
                        throw new Error(`The "${prop}" param is not one of the values that is defined in the "onlyOneValue" array property in the schema.`);
                      }
                    }

                    // Check the prop's `atLeastOneValue` value.
                    if (schemaProps[prop]["atLeastOneValue"]) {
                      // If the query obj's prop is *not* an array, then throw an error.
                      if (!Array.isArray(queryObj.props[prop])) {
                        throw new Error(`The value of the "${prop}" param should be an array that contains only values that are defined in the "atLeastOneValue" property in the schema.`);
                      }
                      // Check if each value in the query obj's prop array is defined in the schema's `atLeastOneValue` array. If the prop values are not all defined in the `atLeastOneValue` array, then throw an error.
                      const schemaPropArray = schemaProps[prop]["atLeastOneValue"];
                      const queryPropArray = queryObj.props[prop];
                      if (!schemaPropArray.every((value: any) => queryPropArray.includes(value))) {
                        throw new Error(`The "${prop}" param contains values that are not defined in the "atLeastOneValue" array property in the schema.`);
                      }
                    }

                    // Check the prop's `allValues` value.
                    if (schemaProps[prop]["allValues"]) {
                      // If the query obj's prop is *not* an array, then throw an error.
                      if (!Array.isArray(queryObj.props[prop])) {
                        throw new Error(`The value of the "${prop}" param should be an array that contains all the values that are defined in the "allValues" property in the schema.`);
                      }
                      // Check if all the values in the query obj's prop array are defined in the schema's `allValues` array. If the prop values are not all defined in the `allValues` array, then throw an error.
                      const schemaPropArray = schemaProps[prop]["allValues"];
                      const queryPropArray = queryObj.props[prop];
                      if (!isEqual(sortBy(schemaPropArray), sortBy(queryPropArray))) {
                        throw new Error(`The "${prop}" param does not contain the same values that are defined in the "allValues" array property in the schema.`);
                      }
                    }

                  }
                }
              }
            }
          }
        }
      });
    });
  }
  catch(err: any) {
    handleError("queryValidator", err);
    throw new Error(err.message);
  }
}
