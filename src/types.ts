export interface IAnyObject {
  [key: string]: any;
}

// The data type of variable is either a primitive data type, a Date, or an array of primitive data types or an array of Dates.
export type PrimitiveTypesPlus = string | string[] | number | number[] | boolean | boolean[] | null | null[] | undefined | undefined[] | symbol | symbol[] | bigint | bigint[] | Date | Date[];

// This type defines objects without any nested objects. In other words, the object's properties are either primitive data types, Dates, or arrays of primitive data types or arrays of Dates.
export type PlainObjectType = {
  [key: string]: PrimitiveTypesPlus;
};

export type PrimitiveConstructorTypesPlus = StringConstructor | StringConstructor[] | NumberConstructor | NumberConstructor[] | BooleanConstructor | BooleanConstructor[] | SymbolConstructor | SymbolConstructor[] | BigIntConstructor | BigIntConstructor[] | DateConstructor | DateConstructor[] | JSON;

interface IPropsSchema {
  // TODOS: Look at https://mongoosejs.com/docs/schematypes.html.
  // Scenarios when a JSON property in a database might make sense: Not all users may have access to the same features and sections of your application. Similarly, each user might configure your application based on their preferences. These are two common scenarios and involve data that changes a lot over time. This is because your application is likely to evolve, involving new configurations, views, features, and sections. As a result, you have to continuously update your relational schema to match the new data structure. This takes time and energy. Instead, you can store permissions and configurations in a JSON column directly connected to your user table. Also, JSON is a good data format for your permissions and configuration. In fact, your application is likely to treat this data in JSON format. See https://dev.to/writech/when-to-use-json-data-in-a-relational-database-4i0b
  type: PrimitiveConstructorTypesPlus;
  required?: boolean;
  // If the prop value is a single value, then it must equal only one of the values from the `onlyOneValue` array. 
  onlyOneValue?: any;
  // If the prop value is an array of values, then it must contain at least one value from the `atLeastOneValue` array, but it can also contain multiple values from the `atLeastOneValue` array.
  atLeastOneValue?: any[];
  // If the prop value is an array of values, then it must contain all the values from the `allValues` array.
  allValues?: any[];
  default?: any;
}

// Props schema: In order to allow infinitely nested objects (for props) in the user's schema but still require each prop in the schema to follow the required structure, we can simply reference the type recursively. See https://stackoverflow.com/a/73767780.
export type NestedObject = {
  [key: string]: IPropsSchema | NestedObject;
};

export interface INodeSchema {
  type: "node";
  label: string;
  alias?: string;
  props: NestedObject;
}

export interface IRelationshipSchema {
  type: "relationship";
  label: string;
  alias?: string;
  from: INodeSchema;
  to: INodeSchema;
  direction: "bidirectional" | "directed";
  props?: NestedObject;
}

export type QueryObjType = "node" | "relationship";

export interface INodeQueryObj {
  type: QueryObjType;
  label: string;
  alias?: string;
  props?: IAnyObject;
}

export interface IRelationshipQueryObj {
  type: QueryObjType;
  label: string;
  alias?: string;
  from: INodeQueryObj | null;
  to: INodeQueryObj | null;
  direction: "bidirectional" | "directed";
  props?: IAnyObject;
}

export interface IQueryClauseObj {
  clause: string;
  queryString: string;
  queryObjs: (INodeQueryObj|IRelationshipQueryObj)[];
}

export interface IQueryParams {
  params: PlainObjectType;
}

// The "SchemaType" is defined for an object with an unknown mix of nested object types (i.e. an unknown mix of nested INodeSchema and/or IRelationshipSchema types).
export type SchemaType = {
  [key: string]: INodeSchema | IRelationshipSchema;
}


// ---------------------
// Type Guard Functions
// ---------------------
export function isINodeQueryObj(obj: any): obj is INodeQueryObj  {
  let aliasIsString = true;
  if (obj.alias) {
    aliasIsString = typeof obj.alias === "string";
  }

  let hasProps = true;
  if (obj.props) {
    // Check is props is an object. Props cannot be an array, a function, or null.
    hasProps = typeof obj.props === "object" && !Array.isArray(obj.props) && obj.props !== null;
  }

  return (
    typeof obj === "object" &&
    obj !== null &&
    obj.type === "node" &&
    typeof obj.label === "string" &&
    aliasIsString &&
    hasProps
  );
}

// export interface IRelationshipQueryObj {
//   type: QueryObjType;
//   label: string;
//   alias?: string;
//   from: INodeQueryObj | null;
//   to: INodeQueryObj | null;
//   direction: "bidirectional" | "directed";
//   props?: IAnyObject;
// }
export function isIRelationshipQueryObj(obj: any): obj is IRelationshipQueryObj {
  let aliasIsString = true;
  if (obj.alias) {
    aliasIsString = typeof obj.alias === "string";
  }

  let hasProps = true;
  if (obj.props) {
    // Check is props is an object. Props cannot be an array, a function, or null.
    hasProps = typeof obj.props === "object" && !Array.isArray(obj.props) && obj.props !== null;
  }

  return (
    typeof obj === "object" &&
    obj !== null &&
    obj.type === "relationship" &&
    typeof obj.label === "string" &&
    aliasIsString &&
    (isINodeQueryObj(obj.from) || typeof obj.from === null) &&
    (isINodeQueryObj(obj.to) || typeof obj.to === null) &&
    (obj.direction === "bidirectional" || obj.direction === "directed") &&
    hasProps
  );
}
