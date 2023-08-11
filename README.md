# typebox-form-data

Parses form and query parameter data based on TypeBox schemas

**UNDER CONSTRUCTION**

## Notes

- The overall schema must define an object.
- The only allowed types are unions, arrays, strings, numbers, bigints, booleans, dates, and nulls (except as array members). Symbol types are not allowed because they can't equal other symbols. Nested objects are not allowed.
- Unions may nest within arrays and both unions and arrays may nest within unions, but arrays may not nest within arrays.
- The values of unions and the members of arrays must all map to the same JavaScript type, except that unions may also be made nullable by including a `null` value.
- No form value can be both optional and nullable.
- Optional values default to undefined, unless the schema defines a default value.
- Nullable values default to null, unless the schema defines a default value.
- Arrays can't have nullable or optional members.
- Empty strings are interpreted as not being provided and therefore must map to `undefined` (optional) to pass validation, unless the schema provides a default. This is because there is no way to distinguish empty strings from optional strings.
- Booleans cannot be optional or nullable; they always evaluate to either `true` or `false`.
- The boolean form values `"false"`, `"off"`, and empty string are interpreted as `false`; all other values are interpreted as `true`. The absence of a form value for a boolean is interpreted as `false`, unless the schema overrides with a default value.
- Numeric, date, and string values only have defaults when the schema provides them.
