import { isEqual, sortBy } from "lodash";
import { config } from "../qgly.config";
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
  NestedObjectType,
  SchemaType,
  INodeSchema,
  IRelationshipSchema,
  PlainObjectType,
  QueryClauseType,
} from "./types";
import { isINodeQueryObj, isIRelationshipQueryObj } from "./types";

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
export function checkForRequiredProp(prop: string, queryObjProps: PlainObjectType) {
  try {
    // The following `if` statement checks for this: If the queryObjProps object does not exist or the queryObjProps object is empty or the queryObjProps property (i.e. query parameter) that corresponds to the prop that was passed to this function (which is a required prop) does not exist, then throw an error.
    if (!queryObjProps || Object.keys(queryObjProps).length === 0 || !queryObjProps[prop]) {
      throw new Error(
        `All node properties are required in CREATE clauses. All relationship properties are required in MERGE clauses. The "${prop}" param is missing from the query.`
      );

      // // TODO: Maybe this will be a version 2 feature: If a user does not pass a property and corresponding param in a CREATE or MERGE clause, then Quigly will throw an error, unless the user provides a default value for that prop in the schema. If the user does not pass a property and param but does provide a default value in the schema, then the default value will be inserted into the database.
      // if (schemaForProps[prop]["default"]) {
      //   // Set the default value in the query string and in the params object. Is this too complex and unnecessary? Maybe I should just require users to specify all values in the query string and the params object instead of allowing users to define default values in the schema. Or I could require users to specify all values in the query string and I could populate the params object with the default value if they don't specify a param value. Since Cypher does not have a schema there is no way to define default values in Cypher, but I might want to change that with Quigley.
      // }
      // else {
      //   throw new Error(`All node and relationship properties are required in CREATE and MERGE clauses. ${prop} is missing from the query.`);
      // }
    }
  }
  catch(err: any) {
    handleError("checkForRequiredProp", err);
    throw err;
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
export function findQueryObjSchema(dbSchema: IAnyObject, key: string, value: string): IAnyObject | INodeSchema | IRelationshipSchema | null {
  // console.log("SCHEMA:", dbSchema);
  // console.log("KEY:", key, "VALUE:", value);
  if (typeof dbSchema !== "object" || dbSchema === null) {
    // console.log("Schema is not an object");
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

// TODO: Create tests for this function.
/**
 * This function takes a schema object for props and the props object from a query object. It then loops over the schema object and validates the corresponding props from the query object to ensure that the props from the query object match what is defined in the props schema (e.g. type definitions, values, object nesting).
 * @param schemaForProps 
 * @param queryObjProps 
 */
export function validateQueryObjPropsAgainstQueryObjPropsSchema(queryClauseType: QueryClauseType, parentKey: string, schemaForProps: NestedObjectType, queryObjProps: PlainObjectType) {
  try {
    for (const prop in schemaForProps) {
      console.log("PROP:", prop);
      // TODO: If the schema prop has nested props (e.g. the prop is an address with nested properties for city, state, street, zip), then I need to recursively loop over that nested object.
      // If the prop does _not_ have a "type" property, then call `validateQueryObjPropsAgainstQueryObjPropsSchema` recursivley.
      if (!Object.hasOwn(schemaForProps[prop], "type")) {
        console.log("IMPLEMENT RECURSIVE INVOCATION OF validateQueryObjPropsAgainstQueryObjPropsSchema");
        // If the prop is an address with nested properties for city, state, street, zip (e.g. "address.city", "address.state"), then `parentKeyOfSchemaObjForNestedProps` would be "address".
        const parentKeyOfSchemaObjForNestedProps = prop;
        // Get the nested object. For example, if the prop is an address with nested properties for city, state, street, zip, then the nested object would be something like `{ street: { type: String, }, city: { type: String, }, state: { type: String, }, zip: { type: String, } }`.
        const schemaObjForNestedProps = schemaForProps[prop];
        // Create an object of nested query props that will be passed to `validateQueryObjPropsAgainstQueryObjPropsSchema` in a recursive call.
        const nestedQueryObjProps = {};
        let updatedParentKey = "";
        // Loop over the queryObjProps that are passed into this function and pull out the nested props, which are any props that use dot notation in the key name (e.g. "address.street", "address.city").
        for (const nestedQueryObjProp in queryObjProps) {
          // If the nestedQueryObjProp is nested more than one level deep (e.g. "company.location.address.street"), then make sure to look for the prop by the correct key, which will be a concatenated string of all the previous parent keys.
          if (parentKey && nestedQueryObjProp.startsWith(parentKey)) {
            updatedParentKey = `${parentKey}.${nestedQueryObjProp}`;
            nestedQueryObjProps[updatedParentKey] = queryObjProps[nestedQueryObjProp];
          }
          // If this is the first level of nested props (e.g. "address.street"), then look for the nestedQueryObjProp that startsWith `parentKeyOfSchemaObjForNestedProps` (e.g. "address") and add that to the `nestedQueryObjProps` object.
          // For example, if `parentKeyOfSchemaObjForNestedProps` is "address" and the current prop in the loop is this:
          // "address.street": "123 Main"
          // ...then that prop would get added to `nestedQueryObjProps`.
          else if (!parentKey && nestedQueryObjProp.startsWith(parentKeyOfSchemaObjForNestedProps)) {
            updatedParentKey = nestedQueryObjProp;
            nestedQueryObjProps[updatedParentKey] = queryObjProps[nestedQueryObjProp];
          }
          // else: If neither of the previous conditional statements match, then the prop won't be added to the `nestedQueryObjProps` object.
        }
        validateQueryObjPropsAgainstQueryObjPropsSchema(queryClauseType, updatedParentKey, schemaObjForNestedProps, nestedQueryObjProps);
      }
      else {
        if (queryObjProps) {
          // TODO: Not every prop is required in every query. For example, a MATCH query might have only one prop or no props. So I need to figure out how to validate the queries based on the type of query. I guess it's only CREATE and MERGE queries that need to check for required properties because the data that gets entered into the database needs to include all required data. All other CRUD operations can just be validated for data types. So that might not be too difficult.
          // Check if the query object is part of a "CREATE" or "MERGE" clause. If a prop is defined in the schema, then it is considered to be required. So make sure that every prop has been defined in the query object and check if a corresponding param has been included in the query. See my "Schema Definition Rules" in the README.md file.
          if (queryClauseType.toUpperCase() === "CREATE" || queryClauseType.toUpperCase() === "MERGE") {
            checkForRequiredProp(prop, queryObjProps);
          }
        
          // TODO: Continue here...
          // TODO: Each of these prop checks needs to be in their own function so I can create unit tests for them.

          // Check if the prop's type from the schema matches the type that was passed as a param.
          // The following `if` statement checks for this: If the props object exists and the prop from the current iteration of the `for` loop exists and the prop is *not* an `instanceof` the "type" from the schema, then throw an error.
          // TODO: This `if` statement won't work, but I think this post has a solution that will work: https://stackoverflow.com/a/40227447. I want to name my equivalent functions getTypeOf() and getInstanceOf().
          // See also https://stackoverflow.com/questions/899574/what-is-the-difference-between-typeof-and-instanceof-and-when-should-one-be-used.
          if (queryObjProps[prop] && getInstanceOf(queryObjProps[prop], schemaForProps[prop]["type"])) {
            throw new Error(`The "${prop}" param's data type does not match the data type that is defined in the schema.`);
          }

          // Check the prop's `onlyOneValue` value.
          if (schemaForProps[prop]["onlyOneValue"]) {
            // Check if the prop value is a single value (as opposed to an array of values) from the `onlyOneValue` array. If the prop value is not one of the values from the `onlyOneValue` array, then throw an error.
            if (!schemaForProps[prop]["onlyOneValue"].includes(queryObjProps[prop])) {
              throw new Error(`The "${prop}" param is not one of the values that is defined in the "onlyOneValue" array property in the schema.`);
            }
          }

          // Check the prop's `atLeastOneValue` value.
          if (schemaForProps[prop]["atLeastOneValue"]) {
            // If the query obj's prop is *not* an array, then throw an error.
            if (!Array.isArray(queryObjProps[prop])) {
              throw new Error(`The value of the "${prop}" param should be an array that contains only values that are defined in the "atLeastOneValue" property in the schema.`);
            }
            // Check if each value in the query obj's prop array is defined in the schema's `atLeastOneValue` array. If the prop values are not all defined in the `atLeastOneValue` array, then throw an error.
            const schemaPropArray = schemaForProps[prop]["atLeastOneValue"];
            const queryPropArray = queryObjProps[prop];
            if (!schemaPropArray.every((value: any) => queryPropArray.includes(value))) {
              throw new Error(`The "${prop}" param contains values that are not defined in the "atLeastOneValue" array property in the schema.`);
            }
          }

          // Check the prop's `allValues` value.
          if (schemaForProps[prop]["allValues"]) {
            // If the query obj's prop is *not* an array, then throw an error.
            if (!Array.isArray(queryObjProps[prop])) {
              throw new Error(`The value of the "${prop}" param should be an array that contains all the values that are defined in the "allValues" property in the schema.`);
            }
            // Check if all the values in the query obj's prop array are defined in the schema's `allValues` array. If the prop values are not all defined in the `allValues` array, then throw an error.
            const schemaPropArray = schemaForProps[prop]["allValues"];
            const queryPropArray = queryObjProps[prop];
            if (!isEqual(sortBy(schemaPropArray), sortBy(queryPropArray))) {
              throw new Error(`The "${prop}" param does not contain the same values that are defined in the "allValues" array property in the schema.`);
            }
          }
        }
      }
    }
  }
  catch(err: any) {
    handleError("validateQueryObjPropsAgainstQueryObjPropsSchema", err);
    throw err;
  }
}

/**
 * Validate the query object against the schema for the query object.
 * @param schemaForQueryObj 
 * @param queryObj 
 */
export function validateQueryObjAgainstQueryObjSchema(queryClauseType: QueryClauseType, schemaForQueryObj: INodeSchema | IRelationshipSchema, queryObj: INodeQueryObj | IRelationshipQueryObj) {
  try {
    // Loop over the properties in the schemaForQueryObj and validate each one against the query object.
    for (const property in schemaForQueryObj) {
      // Check if the "type" matches between the schema for the query object and the query object. If they do not match, then throw an error.
      if (property === "type" && schemaForQueryObj.type !== queryObj.type) {
        // If there is not a type with the specified label in the schema, then throw an error.
        throw new Error(`There does not exist a "${queryObj.type}" in the schema with the label "${queryObj.label}". Check your query.`);
      }
      // Check if the "label" matches between the schema for the query object and the query object. If they do not match, then throw an error.
      if (property === "label" && schemaForQueryObj.label !== queryObj.label) {
        // If there is not a type with the specified label in the schema, then throw an error.
        throw new Error(`There does not exist a "${queryObj.type}" in the schema with the label "${queryObj.label}". Check your query.`);
      }
      // TODO: Do I need to add tests to check the "props" property? Would that make sense or be valuable?
      // Check if the schemaForQueryObj has a "props" property and if props were passed with the queryObj.
      if (property === "props" && queryObj.props && typeof queryObj.props === "object" && queryObj.props !== null) {
        const schemaForProps = schemaForQueryObj.props;
        // console.log("SCHEMA PROPS:", schemaForProps);
        // Loop over the `props` in the schema and validate each prop from the query object against the schema.
        validateQueryObjPropsAgainstQueryObjPropsSchema(queryClauseType, "", schemaForProps!, queryObj.props);
      }
    }
  }
  catch(err: any) {
    handleError("validateQueryObjAgainstQueryObjSchema", err);
    throw err;
  }
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
        // console.log("DATABASE SCHEMA:", config.schema);
        console.log("QUERY OBJECT:", queryObj);
        // Check if the query object (either a node or a relationship) exists in the schema by searching for a label property in the schema that matches the query object's label property. Labels have to be unique among nodes and also among relationships.
        // Get the schema for the query object, if it exists.
        const schemaForQueryObj = findQueryObjSchema(config.schema, "label", queryObj.label)
        console.log("SCHEMA FOR QUERY OBJ:", schemaForQueryObj);
        if (schemaForQueryObj && (isINodeQueryObj(schemaForQueryObj) || isIRelationshipQueryObj(schemaForQueryObj))) {
          // Validate the query object against the schema for the query object.
          validateQueryObjAgainstQueryObjSchema(queryClauseObj.type, schemaForQueryObj, queryObj);
        }
      });
    });
  }
  catch(err: any) {
    handleError("queryValidator", err);
    throw new Error(err.message);
  }
}
