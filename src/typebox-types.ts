/**
 * TypeBox types, stored in a schema's `Kind` symbol property.
 */
export enum TypeBoxType {
  Array = "Array",
  BigInt = "BigInt",
  Boolean = "Boolean",
  Date = "Date",
  Integer = "Integer",
  Literal = "Literal",
  Null = "Null",
  Number = "Number",
  Object = "Object",
  Record = "Record",
  String = "String",
  Symbol = "Symbol",
  Tuple = "Tuple",
  Undefined = "Undefined",
  Union = "Union",
}

/**
 * JavaScript types to which TypeBox types correspond.
 */
export enum JavaScriptType {
  Array = "array",
  BigInt = "bigint",
  Boolean = "boolean",
  Date = "Date",
  Integer = "integer",
  Null = "null",
  Number = "number",
  Object = "object",
  String = "string",
  Symbol = "symbol",
  Undefined = "undefined",
}
