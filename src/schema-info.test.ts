import { Type, type TObject } from "@sinclair/typebox";
import { describe, expect, test } from "vitest";

import { getSchemaInfo } from "./schema-info.js";

const badNullableWithDefaultSchema = Type.Object({
  str: Type.Union([Type.String(), Type.Null()], { default: "foo" }),
});

const badOptionalWithDefaultSchema = Type.Object({
  str: Type.Optional(Type.String({ default: "foo" })),
});

const badOptionalAndNullableSchema = Type.Object({
  str: Type.Optional(Type.Union([Type.String(), Type.Null()])),
});

// const badEmptyUnionSchema = Type.Object({
//   str: Type.Union([Type.Null()]),
// });

const badNonEmptyUnionSchema = Type.Object({
  str: Type.Union([Type.String(), Type.Number()]),
});

const badUnionOfArraysSchema = Type.Object({
  list: Type.Union([Type.Array(Type.String()), Type.Array(Type.Number())]),
});

const badArrayOfArraysSchema = Type.Object({
  list: Type.Array(Type.Array(Type.String())),
});

const badArrayWithNullableMembersSchema = Type.Object({
  list: Type.Array(Type.Union([Type.String(), Type.Null()])),
});

const badArrayWithOptionalMembersSchema = Type.Object({
  list: Type.Array(Type.Optional(Type.String())),
});

interface InvalidTestEntry {
  description: string;
  schema: TObject;
  error?: string;
  only?: boolean;
}

const invalidTestEntries: InvalidTestEntry[] = [
  {
    description: "handling an invalid nullable with default",
    schema: badNullableWithDefaultSchema,
    error: "Optional and nullable form types can't have default values",
  },
  {
    description: "handling an invalid optional with default",
    schema: badOptionalWithDefaultSchema,
    error: "Optional and nullable form types can't have default values",
  },
  {
    description: "handling an invalid optional and nullable",
    schema: badOptionalAndNullableSchema,
    error: "Form types can't be both optional and nullable",
  },
  // {
  //   // not possible with TypeBox, which won't allow single-member unions
  //   description: "handling an invalid empty union",
  //   schema: badEmptyUnionSchema,
  //   error: "Union type must have at least one non-null member",
  // },
  {
    description: "handling an invalid non-empty union",
    schema: badNonEmptyUnionSchema,
    error:
      "All non-null members of a union type must have the same JavaScript type",
  },
  {
    description: "handling an invalid unions of arrays",
    schema: badUnionOfArraysSchema,
    error: "All members of arrays in unions must have the same JavaScript type",
  },
  {
    description: "handling an invalid array of arrays",
    schema: badArrayOfArraysSchema,
    error: "Form arrays can't themselves contain arrays",
  },
  {
    description: "handling an invalid array with nullable members",
    schema: badArrayWithNullableMembersSchema,
    error: "Form arrays can't contain nullable or optional members",
  },
  {
    description: "handling an invalid array with optional members",
    schema: badArrayWithOptionalMembersSchema,
    error: "Form arrays can't contain nullable or optional members",
  },
];

describe("disallowed schemas", () => {
  for (const entry of invalidTestEntries) {
    const trial = () => getSchemaInfo(entry.schema);
    if (entry.only) {
      test.only(entry.description, () => {
        expect(trial).toThrow(entry.error);
      });
    } else {
      test(entry.description, () => {
        expect(trial).toThrow(entry.error);
      });
    }
  }
});
