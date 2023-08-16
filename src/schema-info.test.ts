import { type TObject, Type } from "@sinclair/typebox";
import { describe, expect, test } from "vitest";

import {
  type SchemaInfo,
  getSchemaInfo,
  clearSchemaInfoCache,
} from "./schema-info.js";

const goodSchema1 = Type.Object({
  name: Type.String({ minLength: 2 }),
  nickname: Type.Optional(Type.String({ minLength: 2 })),
  age: Type.Number({ minimum: 13 }),
  siblings: Type.Optional(Type.Integer({ minimum: 0 })),
  email: Type.Union([
    Type.String({
      pattern: "^[a-z]+@[a-z]+[.][a-z]+$",
      minLength: 10,
    }),
    Type.Null(),
  ]),
  agree: Type.Boolean(),
  strings: Type.Array(Type.String()),
  ints: Type.Array(Type.Integer()),
  bools: Type.Optional(Type.Array(Type.Boolean())),
  bigints: Type.Union([Type.Array(Type.BigInt()), Type.Null()]),
});

const goodSchema2 = Type.Object({
  name: Type.String({ minLength: 2 }),
});

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

describe("allowed schemas", () => {
  test("caching a good schema", () => {
    const info = getSchemaInfo(goodSchema1);
    expect(info).toEqual({
      schema: goodSchema1,
      fieldNames: [
        "name",
        "nickname",
        "age",
        "siblings",
        "email",
        "agree",
        "strings",
        "ints",
        "bools",
        "bigints",
      ],
      fields: {
        age: {
          defaultValue: undefined,
          fieldName: "age",
          fieldType: "number",
          hasDefault: false,
          isNullable: false,
          isOptional: false,
          memberType: null,
        },
        agree: {
          defaultValue: undefined,
          fieldName: "agree",
          fieldType: "boolean",
          hasDefault: false,
          isNullable: false,
          isOptional: false,
          memberType: null,
        },
        bigints: {
          defaultValue: undefined,
          fieldName: "bigints",
          fieldType: "array",
          hasDefault: false,
          isNullable: true,
          isOptional: false,
          memberType: "bigint",
        },
        bools: {
          defaultValue: undefined,
          fieldName: "bools",
          fieldType: "array",
          hasDefault: false,
          isNullable: false,
          isOptional: true,
          memberType: "boolean",
        },
        email: {
          defaultValue: undefined,
          fieldName: "email",
          fieldType: "string",
          hasDefault: false,
          isNullable: true,
          isOptional: false,
          memberType: null,
        },
        ints: {
          defaultValue: undefined,
          fieldName: "ints",
          fieldType: "array",
          hasDefault: false,
          isNullable: false,
          isOptional: false,
          memberType: "integer",
        },
        name: {
          defaultValue: undefined,
          fieldName: "name",
          fieldType: "string",
          hasDefault: false,
          isNullable: false,
          isOptional: false,
          memberType: null,
        },
        nickname: {
          defaultValue: undefined,
          fieldName: "nickname",
          fieldType: "string",
          hasDefault: false,
          isNullable: false,
          isOptional: true,
          memberType: null,
        },
        siblings: {
          defaultValue: undefined,
          fieldName: "siblings",
          fieldType: "integer",
          hasDefault: false,
          isNullable: false,
          isOptional: true,
          memberType: null,
        },
        strings: {
          defaultValue: undefined,
          fieldName: "strings",
          fieldType: "array",
          hasDefault: false,
          isNullable: false,
          isOptional: false,
          memberType: "string",
        },
      },
      defaultObject: {
        age: undefined,
        agree: undefined,
        bigints: null,
        bools: undefined,
        email: null,
        ints: undefined,
        name: undefined,
        nickname: undefined,
        siblings: undefined,
        strings: undefined,
      },
    });
  });

  test("extending a good schema and clearing schemas", () => {
    // verify that we can extend the schema information

    let info1: SchemaInfo<TObject> & { extra: string } = getSchemaInfo(
      goodSchema2,
      (schemaInfo) => ({
        ...schemaInfo,
        extra: "extra",
      })
    );
    expect(info1.schema).toEqual(goodSchema2);
    expect(info1.extra).toEqual("extra");

    // verify that we can clear the schema information cache

    clearSchemaInfoCache();
    const info2 = getSchemaInfo(goodSchema2);
    expect((info2 as any).extra).toBeUndefined();

    // verify that we're indeed pulling the schema info from cache

    info1 = getSchemaInfo(goodSchema2, (schemaInfo) => ({
      ...schemaInfo,
      extra: "extra",
    }));
    expect(info1.schema).toEqual(goodSchema2);
    expect(info1.extra).toBeUndefined();
  });
});

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
