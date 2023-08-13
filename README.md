# TypeBox Form Parser

Parses form and query parameter data based on TypeBox schemas

**UNDER CONSTRUCTION**

## Notes

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
