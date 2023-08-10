# typebox-form-data

Parses form and query parameter data based on TypeBox schemas

**UNDER CONSTRUCTION**

## Notes

- Boolean form values cannot have optional or nullable schemas.
- The absence of a boolean is interpreted as false, unless the schema overrides with a default value.
- No form value can be both optional and nullable.
- Optional values default to undefined.
- Nullable values default to null.
- Numeric, date, and string values only have defaults when the schema provides them/
- Empty strings are interpreted as not being provided and therefore must map to `undefined` to pass validation, unless the schema provides a default. This is because there is no way to distinguish empty strings from optional strings.
