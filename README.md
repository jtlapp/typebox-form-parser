# TypeBox Form Parser

Parses form and query parameter data based on TypeBox schemas

[API Reference](https://jtlapp.github.io/typebox-form-parser/)

## Introduction

This library interprets HTTP form data and query parameters as objects defined by [TypeBox](https://github.com/sinclairzx81/typebox) schemas. Given a TypeBox schema and either an instance of [FormData](https://developer.mozilla.org/en-US/docs/Web/API/FormData) or [URLSearchParams](https://developer.mozilla.org/en-US/docs/Web/API/URLSearchParams), the library parses the data as an instance of the schema to the degree that it is able, without also validating the data. To validate the resulting parsed data, call TypeBox's [check function](https://github.com/sinclairzx81/typebox#values-check) or [errors function](https://github.com/sinclairzx81/typebox#errors), or use a [TypeBox validator](https://github.com/jtlapp/typebox-validators).

## Installation

Install with your preferred dependency manager:

```
npm install typebox typebox-form-parser

yarn add typebox typebox-form-parser

pnpm add typebox typebox-form-parser
```

## Usage

The library is documented in the [API reference](https://jtlapp.github.io/typebox-form-parser/). Here is an example of usage:

```ts
import { Type, type TObject } from "@sinclair/typebox";
import { getSchemaInfo, parseFormFields } from "typebox-form-parser";

const schema = Type.Object({
  name: Type.String({ minLength: 2 }),
  nickname: Type.Optional(Type.String({ minLength: 2 })),
  age: Type.Number({ minimum: 13 }),
  siblings: Type.Optional(Type.Integer({ minimum: 0, default: 0 })),
  email: Type.Union([
    Type.String({
      pattern: "^[a-z]+@[a-z]+[.][a-z]+$",
      minLength: 10,
      default: "you@example.com",
    }),
    Type.Null(),
  ]),
  agree: Type.Boolean(),
});

function handleGet(url: URL) {
  const schemaInfo = getSchemaInfo(schema);
  const parsedParams = parseFormFields(url.searchParams, schemaInfo);
  // validate parsedParams against the schema
  // ...
}

function handlePost(request: Request) {
  const schemaInfo = getSchemaInfo(schema);
  const parsedFormData = parseFormFields(request.formData(), schemaInfo);
  // validate parsedFormData against the schema
  // ...
}
```

You can also attach application-specific information to the cached schema information:

```ts
const appSchemaInfo = getSchemaInfo(schema, (schemaInfo) => {
  // derive `extra` from schemaInfo.schema
  return {
    ...schemaInfo,
    extra,
  };
});
```

You can add any number of properties to the schema, with names of your choosing.

## Schema Constraints

From data and query parameters have limited ability to express data. This library employs the following constraints:

- The overall schema must define an object.
- The only allowed types are unions, arrays, strings, numbers, bigints, booleans, dates, and nulls (except as array members). Symbol types are not allowed because they can't equal other symbols. Nested objects are not allowed.
- Unions may nest within arrays and both unions and arrays may nest within unions, but arrays may not nest within arrays.
- The values of unions and the members of arrays must all map to the same JavaScript type, except that unions may also be made nullable by including a `null` value.
- No form value can be both optional and nullable.
- Optional values default to undefined and cannot have explicit defaults.
- Nullable values default to null and cannot have explicit defaults.
- Nullable string values are never empty strings.
- Arrays can't have nullable or optional members.
- Empty arrays are not expressible; arrays are either received having at least one member, or no array is received at all. To support an empty array, make the array optional.
- The boolean form values `"false"`, `"off"`, and empty string are interpreted as `false`; all other non-empty string values are interpreted as `true`.
- Numeric, date, and string values only have defaults when the schema provides them.
- Default dates must be represented as strings, because TypeBox conforms to JSON schema. Use ISO strings for preserve accuracy.

## License

MIT License. Copyright &copy; 2023 Joseph T. Lapp

```

```
