/**
 * See the README.md file for instruction on how to run this file.
 */
import { cloneDeep } from "lodash";
import { handleError } from "./utils";
import type {
  IAnyObject,
  PlainObjectType,
  IQueryParams,
  QueryObjType,
  INodeQueryObj,
  IRelationshipQueryObj,
  IQueryClauseObj,
} from "./types";


/**
 * This function will take the props (in string form) and convert the props to a JavaScript object version of the props.
 * @param {*} propsString 
 * @param {*} params 
 */
export function parseProps(propsString: string, params?: PlainObjectType) {
  try {
    // console.log("PROPS STRING:", propsString);
    // console.log("PARAMS:", params);
    // Remove the opening curly brace.
    propsString = propsString.substring(1);
    // Remove the closing curly brace.
    propsString = propsString.substring(0, propsString.indexOf("}")).trim();
    // Dangling commas are not allowed in query strings, so alert the user that they need to remove any dangling commas in the node or relationship part of the query.
    if (propsString[propsString.length - 1] === ",") {
      throw new Error(
        "No dangling commas allowed in queries. Remove the comma after the last property in the node or relationship."
      );
    }
    // Split the remaining string by the commas.
    const propsArray = propsString.split(",").map(prop => prop.trim());
    // console.log("propsArray:", propsArray);

    const props: IAnyObject = {};
    propsArray.forEach(prop => {
      // For each property in the `propsArray`, split the key and value by the colon. Then map over the key and value, trim the whitespace, and remove the dollar sign at the beginning of the value string. 
      const [key, value] = prop.split(":").map(entry => entry.trim().replace(/^\$/, ""));
      // console.log("KEY:", key, "VALUE:", value);
      // console.log("KEY LENGTH:", key.length);
      // console.log("VALUE LENGTH:", value.length);
      // If the user passed a params object along with the query, then process the params.
      if (params) { 
        if (!params[value]) {
          throw new Error(`Param "${value}" is undefined. Check the spelling in your query and in your params object.`);
        }
        // Insert the property into the `props` object using the key that is specified in the query (which key should also be defined in the schema) and the value that is passed in the params object.
        props[key] = params[value];
        // console.log("PROPS:", props);
      }
    });

    return props;
  }
  catch(err: any) {
    handleError("parseProps", err);
    // This `throw err` statement is necessary to prevent TypeScript errors.
    throw err;
  }
}


/**
 * This function will take a string representing a node or a relationship in GQL and parse out the type, alias, label, and properties of that node/relationship into a JavaScript object that can be used to validate the schema and return a hierarchical data structure.
 * @param {*} type
 * @param {*} queryObjString 
 * @param {*} params 
 */
export function parseQueryObj(type: QueryObjType, queryObjString: string, params?: PlainObjectType) {
  try {
    // console.log("queryObjString:", queryObjString);

    // Convert the node or relationship properties to an object.
    const propsString = queryObjString.substring(queryObjString.indexOf("{"), queryObjString.indexOf("}") + 1).trim();
    // console.log("PROPS STRING:", `"${propsString}"`);
    
    let aliasAndLabel;
    // Extract the alias and label for a node query object.
    if (type === "node") {
      // If props were passed in the node query, then get the substring up to, but not including the beginning of the props object.
      if (propsString) {
        // Get the alias and label from the node query object.
        aliasAndLabel = queryObjString.substring(1, queryObjString.indexOf("{")).trim();
      }
      // If no props are passed, then the node `queryObjString` will be something like this:
      // (a:Actor)
      // So remove the first and last characters from the string, which will leave only the alias and label.
      else {
        aliasAndLabel = queryObjString.substring(1, queryObjString.length - 1).trim();
      }
    }
    // Extract the alias and label for a relationship query object.
    else if (type === "relationship") {
      // If props were passed in the relationship query, then get the substring after the "[" character (the opening relationship character) and before the "{" (the opening props character).
      if (propsString) {
        // Get the alias and label from the relationship query object.
        aliasAndLabel = queryObjString.substring(queryObjString.indexOf("[") + 1, queryObjString.indexOf("{")).trim();
      }
      else {
        // If no props are passed, then the relationship `queryObjString` will be something like this:
        // -[r:ACTED_IN]- or <-[r:ACTED_IN]- or -[r:ACTED_IN]->
        // So get the substring after the "[" character (the opening relationship character) and before the "]" (the closing relationship character).
        aliasAndLabel = queryObjString.substring(queryObjString.indexOf("[") + 1, queryObjString.indexOf("]")).trim();
      }
    }
    // console.log("ALIAS & LABEL:", aliasAndLabel);

    // Split the alias and label and trim whitespace from the ends.
    const [alias, label] = aliasAndLabel!.split(":").map(part => part.trim());
    // console.log("alias, label:", alias, alias.length, label, label.length);

    let props = {};
    if (propsString) {
      props = parseProps(propsString, params);
    }

    if (type === "node") {
      const nodeObj: INodeQueryObj = {
        type,
        alias,
        label,
        props,
      };
      return nodeObj;
    }
    else {
      const relationshipObj: IRelationshipQueryObj = {
        type,
        alias,
        label,
        from: null,
        to: null,
        // If the `queryObjString` includes either a `<` or a `>` character, then the relationship's "direction" propery is "directed". Else, it is "bidirectional".
        direction: (queryObjString.includes("<") || queryObjString.includes(">")) ? "directed" : "bidirectional",
        props,
      };
      return relationshipObj;
    }
  }
  catch(err: any) {
    handleError("parseQueryObj", err);
    // This `throw err` statement is necessary to prevent TypeScript errors.
    throw err;
  }
}


export function convertQueryObjStrToJSObj(type: QueryObjType, startIndex: number, queryString: string, params?: PlainObjectType) {
  try {
    let endIndex = startIndex + 1;
    
    // If this is a node, then starting at the startIndex, get the index of the next occurrence of the closing node character ")".
    if (type === "node") {
      endIndex = queryString.indexOf(")", startIndex) + 1;
      // console.log("startIndex:", startIndex, "endIndex:", endIndex);
    }

    // If this is a relationship, then starting at the startIndex, get the index up-to-but-not-including the next occurrence of the opening node character "(". This will ensure that the arrows and their direction (e.g. "<", ">"), if the direction is present, are included in the relationship subquery.
    if (type === "relationship") {
      endIndex = queryString.indexOf("(", startIndex);
    }

    const queryObjString = queryString.substring(startIndex, endIndex).trim();
    // console.log("QUERY OBJ STRING:", queryObjString);

    // Convert the queryObjString into a JavaScript object.
    const queryObj = parseQueryObj(type, queryObjString, params);
    // console.log("QUERY OBJ:", queryObj);

    if (type === "node") {
      return { nodeQueryObj: queryObj, endIndex };
    }
    else {
      return { relationshipQueryObj: queryObj, endIndex };
    }
  }
  catch(err: any) {
    handleError("convertQueryObjStrToJSObj", err);
    // This `throw err` statement is necessary to prevent TypeScript errors.
    throw err;
  }
}


/**
 * This function takes the query string and converts it to an array of clause objects with this form:
 * [
 *   {
 *     clause: string;
 *     queryString: string;
 *     queryObjs: []
 *   }
 * ]
 * @param queryString 
 * @returns 
 */
export function convertQueryStringToArrayOfClauseObjs(queryString: string,) {
  const queryClauseObjs: IQueryClauseObj[] = [];
  const queryClauseObjTemplate: IQueryClauseObj = {
    clause: "",
    queryString: "",
    queryObjs: [],
  };
  // If you need to find multiple matches and their indices, you can use a loop with the exec() method of the regular expression object.
  const clausesRegex = /(MATCH|OPTIONAL MATCH|WHERE|RETURN|ORDER BY|SKIP|LIMIT|CREATE|MERGE|DELETE|REMOVE|SET|WITH|UNION|UNWIND|FOREACH|CALL)/g; // The "g" flag is important for finding all matches
  let match;
  const indexes = [];
  // Use the RegExp.exec() method to loop over the query string and get the starting indexes of each clause in the query string. Note that this `while` loop both sets the match variable to the return value of the RegExp.exec() method and checks if that return value is null.
  while ((match = clausesRegex.exec(queryString)) !== null) {
    console.log(`Found "${match[0]}" at index ${match.index}.`);
    indexes.push(match.index);
    // Create a copy of the `queryClauseObjTemplate`, set the `clause` property and push the `queryClauseObjTemplate` to the `queryClauseObjs` array.
    const queryClauseObj = cloneDeep(queryClauseObjTemplate);
    queryClauseObj.clause = match[0];
    queryClauseObjs.push(queryClauseObj);
  }
  // console.log("INDEXES:", indexes);
  // Output:
  // Found "CREATE" at index 3.
  // Found "CREATE" at index 218.
  // Found "MERGE" at index 288.
  // Found "RETURN" at index 367.

  // Loop over the indexes array and extract each clause into its own substring.
  for (let i = 0; i < indexes.length; i++) {
    const startIndex = indexes[i];
    // If startIndex is any element before the last one in the indexes array, then endIndex will be `i + 1` (i.e. the next element in the `indexes` array after the current startIndex). If startIndex is the last element in the indexes array, then endIndex will be the index of the last character in the queryString.
    const endIndex = i < indexes.length - 1 ? indexes[i + 1] : queryString.length - 1;
    queryClauseObjs[i].queryString = queryString.substring(startIndex, endIndex).trim();
  }
  return queryClauseObjs;
}


const CLAUSES = [
  "MATCH",
  "OPTIONAL MATCH",
  "WHERE",
  "RETURN",
  "ORDER BY",
  "SKIP",
  "LIMIT",
  "CREATE",
  "MERGE",
  "DELETE",
  "REMOVE",
  "SET",
  "WITH",
  "UNION",
  "UNWIND",
  "FOREACH",
  "CALL",
];

/**
 * This function will take a GQL query string and parse each query object in the query string (i.e. nodes and relationships) into JavaScript objects and return those objects as an array.
 */
export function queryParser(queryString: string, params?: PlainObjectType) {
  try {
    const queryClauseObjs = convertQueryStringToArrayOfClauseObjs(queryString);
    console.log("queryClauseObjs:", queryClauseObjs);

    queryClauseObjs.forEach((clauseObj: IQueryClauseObj) => {
      if (clauseObj.clause === "CREATE" || clauseObj.clause === "MATCH") {
        const queryString = clauseObj.queryString;
        let prevNodeClosingCharIndex = 0;
        for (let i = 0; i < queryString.length; i++) {
          // Parse nodes.
          if (queryString[i] === "(") {
            const { nodeQueryObj, endIndex } = convertQueryObjStrToJSObj("node", i, queryString, params);
            // Get the index of the previous `queryObj` in the `clauseObj.queryObjs` array.
            const prevQueryObjIndex = clauseObj.queryObjs.length - 1;
            // The first relationship that could appear in a query would be at index 1. So `prevQueryObjIndex` needs to be greater than 0.
            // If the query object that appears previous to this node (in the query) is a relationship, then set the relationshipQueryObj's `to` property to be this node.
            if (prevQueryObjIndex > 0 && clauseObj.queryObjs[prevQueryObjIndex].type === "relationship") {
              // NOTE: To ensure that the code conforms to the TypeScript interfaces, a type guard (`in` operator) is used to check which interface the query object belongs to (INodeQueryObj or IRelationshipQueryObj) before accessing its specific properties.
              if ("to" in clauseObj.queryObjs[prevQueryObjIndex]) {
                clauseObj.queryObjs[prevQueryObjIndex].to = nodeQueryObj!;
              }
            }
            clauseObj.queryObjs.push(nodeQueryObj!);
            // Update the counter variable to be the endIndex so the loop skips over the `nodeQueryObj` (i.e. the node string) that was just extracted and continues the iteration after that. The i++ in the for loop will increment the counter variable by one at the end of the loop, so 1 is subtracted from the endIndex to account for that.
            i = endIndex - 1;
            // Set the index of the node's closing character because if a relationship object follows this node in the query, then the previous node's closing character index will serve as the beginning of the relationship object's query string.
            prevNodeClosingCharIndex = i;
          }
          // Parse relationships.
          else if (queryString[i] === "[") {
            // For relationships, use the `prevNodeClosingCharIndex + 1` as the start index for the relationship query substring.
            const { relationshipQueryObj, endIndex } = convertQueryObjStrToJSObj("relationship", prevNodeClosingCharIndex + 1, queryString, params);
            // Get the index of the previous `nodeObj` in the `clauseObj.queryObjs` array.
            const prevNodeObjIndex = clauseObj.queryObjs.length - 1;
            // Set the relationship's `from` property to be the previous node in the `clauseObj.queryObjs` array.
            if (relationshipQueryObj && "from" in relationshipQueryObj) {
              relationshipQueryObj.from = clauseObj.queryObjs[prevNodeObjIndex];
            }
            clauseObj.queryObjs.push(relationshipQueryObj!);
            i = endIndex - 1;
          }
        }
      }
    });

    return queryClauseObjs;
  }
  catch(err: any) {
    handleError("queryParser", err);
    // This `throw err` statement is necessary to prevent TypeScript errors.
    throw err;
  }
}
