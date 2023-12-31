import { Type, type TObject } from "@sinclair/typebox";
import { describe, expect, test } from "vitest";

import { parseFormFields } from "./parse-fields.js";
import { getSchemaInfo } from "./schema-info.js";

const DATE1 = new Date();
const DATE2 = new Date(DATE1.getTime() + 1000);

const normalSchema = Type.Object({
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
});

const booleanSchema = Type.Object({
  agree: Type.Boolean(),
});

const nullableBooleanSchema = Type.Object({
  flag: Type.Union([Type.Boolean(), Type.Null()]),
});

const optionalBooleanSchema = Type.Object({
  flag: Type.Optional(Type.Boolean()),
});

const arraySchema = Type.Object({
  strings: Type.Array(Type.String()),
  ints: Type.Array(Type.Integer()),
  bools: Type.Optional(Type.Array(Type.Boolean())),
  bigints: Type.Union([Type.Array(Type.BigInt()), Type.Null()]),
});

const defaultArraySchema = Type.Object({
  strings: Type.Array(Type.String(), { default: ["abc", "def"] }),
});

const unionOfArraysSchema = Type.Object({
  requiredList: Type.Union([
    Type.Array(Type.Union([Type.Literal("foo"), Type.Literal("bar")])),
    Type.Array(Type.Union([Type.Literal("boo"), Type.Literal("baz")])),
  ]),
  nullableList: Type.Union([
    Type.Array(Type.Union([Type.Literal("foo"), Type.Literal("bar")])),
    Type.Array(Type.Union([Type.Literal("boo"), Type.Literal("baz")])),
    Type.Null(),
  ]),
  optionalList: Type.Optional(
    Type.Union([
      Type.Array(Type.Union([Type.Literal("foo"), Type.Literal("bar")])),
      Type.Array(Type.Union([Type.Literal("boo"), Type.Literal("baz")])),
    ])
  ),
});

const unionOfUnionsSchema = Type.Object({
  required: Type.Union([
    Type.Union([Type.Literal("foo"), Type.Literal("bar")]),
    Type.Union([Type.Literal("boo"), Type.Literal("baz")]),
  ]),
  nullable1: Type.Union([
    Type.Union([Type.Literal("foo"), Type.Literal("bar")]),
    Type.Union([Type.Literal("boo"), Type.Literal("baz")]),
    Type.Null(),
  ]),
  nullable2: Type.Union([
    Type.Union([Type.Literal("foo"), Type.Literal("bar"), Type.Null()]),
    Type.Union([Type.Literal("boo"), Type.Literal("baz")]),
  ]),
});

const dateSchema = Type.Object({
  required: Type.Date(),
  nullable: Type.Union([Type.Date(), Type.Null()]),
  optional: Type.Optional(Type.Date()),
  list: Type.Array(Type.Date()),
});

const schemaWithDefaults = Type.Object({
  name: Type.String({ minLength: 2, default: "Jane" }),
  age: Type.Number({ minimum: 13, default: 50 }),
  agree: Type.Boolean({ default: true }),
  union: Type.Union([Type.Literal("abc"), Type.Literal("def")], {
    default: "def",
  }),
  list: Type.Array(Type.String(), { default: ["abc", "def"] }),
  date: Type.Date({ default: DATE1.toISOString() }),
});

const unsupportedSchema = Type.Object({
  name: Type.String({ minLength: 2 }),
  obj: Type.Object({ str: Type.String() }),
});

interface ValidTestEntry {
  only?: boolean;
  description: string;
  schema: TObject;
  submitted: object;
  parsed: object | null;
  error?: string;
}

const validTestEntries: ValidTestEntry[] = [
  {
    description: "providing all values",
    schema: normalSchema,
    submitted: {
      name: "Jane",
      nickname: "Janey",
      age: 50,
      siblings: 0,
      email: "jane@example.com",
      agree: true,
    },
    parsed: null,
  },
  {
    description: "providing only required values",
    schema: normalSchema,
    submitted: {
      name: "Jane",
      age: 50,
      email: "jane@example.com",
      agree: true,
    },
    parsed: null,
  },
  {
    description: "nullables default to null",
    schema: normalSchema,
    submitted: {
      name: "Jane",
      age: 50,
    },
    parsed: {
      name: "Jane",
      age: 50,
      email: null,
    },
  },
  {
    description: "providing only invalid types",
    schema: normalSchema,
    submitted: {
      name: 123,
      nickname: null,
      age: "foo",
      siblings: "bar",
      email: 456,
      agree: null,
    },
    parsed: {
      name: "123",
      age: NaN,
      siblings: NaN,
      email: "456",
    },
  },
  {
    description: "detect a boolean with a value",
    schema: booleanSchema,
    submitted: {
      agree: "neither-false-nor-off",
    },
    parsed: {
      agree: true,
    },
  },
  {
    description: "detect a 'false' boolean",
    schema: booleanSchema,
    submitted: {
      agree: "false",
    },
    parsed: {
      agree: false,
    },
  },
  {
    description: "detect an 'off' boolean",
    schema: booleanSchema,
    submitted: {
      agree: "off",
    },
    parsed: {
      agree: false,
    },
  },
  {
    description: "detect 'false' for a nullable boolean",
    schema: nullableBooleanSchema,
    submitted: {
      flag: "false",
    },
    parsed: {
      flag: false,
    },
  },
  {
    description: "detect null for a nullable boolean",
    schema: nullableBooleanSchema,
    submitted: {},
    parsed: {
      flag: null,
    },
  },
  {
    description: "detect 'off' for an optional boolean",
    schema: optionalBooleanSchema,
    submitted: {
      flag: "off",
    },
    parsed: {
      flag: false,
    },
  },
  {
    description: "receive nothing for a optional boolean",
    schema: optionalBooleanSchema,
    submitted: {},
    parsed: {},
  },
  {
    description: "duplicate field handling (arrays)",
    schema: arraySchema,
    submitted: {
      strings: ["foo", "bar"],
      ints: [123, 456, 789],
      bools: [true, false, true],
      bigints: [BigInt(123), BigInt(456)],
    },
    parsed: null,
  },
  {
    description: "handling empty, singular, nullable, and optional arrays",
    schema: arraySchema,
    submitted: {
      strings: [],
      ints: [123],
      bigints: null,
    },
    parsed: {
      ints: [123],
      bigints: null,
    },
  },
  {
    description: "handling arrays with default value",
    schema: defaultArraySchema,
    submitted: {},
    parsed: {
      strings: ["abc", "def"],
    },
  },
  {
    description: "handling a unions of arrays, all lists provided",
    schema: unionOfArraysSchema,
    submitted: {
      requiredList: ["boo", "baz"],
      nullableList: ["foo", "bar"],
      optionalList: ["boo", "baz"],
    },
    parsed: {
      requiredList: ["boo", "baz"],
      nullableList: ["foo", "bar"],
      optionalList: ["boo", "baz"],
    },
  },
  {
    description: "handling a unions of arrays, all edge cases",
    schema: unionOfArraysSchema,
    submitted: {
      requiredList: [],
      nullableList: null,
    },
    parsed: {
      nullableList: null,
    },
  },
  {
    description: "handling unions of unions, no nulls",
    schema: unionOfUnionsSchema,
    submitted: {
      required: "foo",
      nullable1: "foo",
      nullable2: "foo",
    },
    parsed: null,
  },
  {
    description: "handling unions of unions, with nulls",
    schema: unionOfUnionsSchema,
    submitted: {
      required: "foo",
      nullable1: null,
      nullable2: null,
    },
    parsed: null,
  },
  {
    description: "handling dates, all values provides",
    schema: dateSchema,
    submitted: {
      required: DATE1,
      nullable: DATE2,
      optional: DATE1,
      list: [DATE1, DATE2],
    },
    parsed: null,
  },
  {
    description: "handling dates, edge cases",
    schema: dateSchema,
    submitted: {
      required: DATE1,
      nullable: null,
      list: [],
    },
    parsed: {
      required: DATE1,
      nullable: null,
    },
  },
  {
    description: "explicit assignment of defaults",
    schema: schemaWithDefaults,
    submitted: {},
    parsed: {
      name: "Jane",
      age: 50,
      agree: true,
      union: "def",
      list: ["abc", "def"],
      date: DATE1,
    },
  },
  {
    description: "not using defaults",
    schema: schemaWithDefaults,
    submitted: {
      name: "Fred",
      age: 60,
      agree: false,
      union: "abc",
      list: ["def"],
      date: DATE2,
    },
    parsed: null,
  },
  {
    description: "non-array empty string handling",
    schema: normalSchema,
    submitted: {
      name: "",
      nickname: "",
      age: "",
      siblings: "",
      email: "",
      agree: "",
    },
    parsed: {
      name: "",
      nickname: "",
      age: NaN,
      siblings: NaN,
      email: null,
      agree: false,
    },
  },
  {
    description: "arrays of one empty string handling",
    schema: arraySchema,
    submitted: {
      strings: [""],
      ints: [""],
      bools: [""],
      bigints: [""],
    },
    parsed: {
      strings: [""],
      ints: [NaN],
      bools: [false],
      bigints: [null],
    },
  },
  {
    description: "arrays of multiple empty strings handling",
    schema: arraySchema,
    submitted: {
      strings: ["", ""],
      ints: ["", "", 1],
      bools: ["", "", true],
      bigints: ["", ""],
    },
    parsed: {
      strings: ["", ""],
      ints: [NaN, NaN, 1],
      bools: [false, false, true],
      bigints: [null, null],
    },
  },
  {
    description: "arrays receive as arrays regardless of schema type",
    schema: normalSchema,
    submitted: {
      name: ["Jane", "Fred"],
      nickname: ["Janey", "Freddy"],
      age: [50, 60],
      siblings: [1, 2],
      email: ["abc@def.hij", "klm@nop.qrs"],
      agree: [true, false],
    },
    parsed: null,
  },
  {
    description: "errors on unsupported types",
    schema: unsupportedSchema,
    submitted: {
      name: "Jane",
      obj: {
        str: "foo",
      },
    },
    parsed: null,
    error: "object",
  },
];

describe("parse form data", () => {
  for (const entry of validTestEntries) {
    if (entry.only) {
      test.only(entry.description, () => testFormData(entry));
    } else {
      test(entry.description, () => testFormData(entry));
    }
  }

  ignore("verify result type", () => {
    const schemaInfo = getSchemaInfo(normalSchema);
    const result: {
      name: string;
      nickname?: string;
      age: number;
      siblings?: number;
      email: string | null;
      agree: boolean;
    } = parseFormFields({} as FormData, schemaInfo);
    return result; // suppress unused variable warning
  });
});

// TODO: uncomment

// describe("parse query params", () => {
//   for (const entry of validTestEntries) {
//     if (entry.only) {
//       test.only(entry.description, () => testQueryParams(entry));
//     } else {
//       test(entry.description, () => testQueryParams(entry));
//     }
//   }
// });

function testFormData(entry: ValidTestEntry): void {
  const formData = new FormData();
  for (const [key, value] of Object.entries(entry.submitted)) {
    if (Array.isArray(value)) {
      for (const item of value) {
        formData.append(key, toFormValue(item));
      }
    } else if (value !== null && value !== undefined) {
      formData.append(key, toFormValue(value));
    }
  }

  const schemaInfo = getSchemaInfo(entry.schema);
  if (entry.error) {
    expect(() => parseFormFields(formData, schemaInfo)).toThrow(entry.error);
  } else {
    const parsedData = parseFormFields(formData, schemaInfo);
    expect(parsedData).toEqual(entry.parsed ?? entry.submitted);
  }
}

// function testQueryParams(entry: ValidTestEntry): void {
//   const queryParams = new URLSearchParams();
//   for (const [key, value] of Object.entries(entry.submitted)) {
//     if (Array.isArray(value)) {
//       for (const item of value) {
//         queryParams.append(key, toFormValue(item));
//       }
//     } else if (value !== null && value !== undefined) {
//       queryParams.append(key, toFormValue(value));
//     }
//   }

//   const schemaInfo = getSchemaInfo(entry.schema);
//   if (entry.error) {
//     expect(() => parseFormFields(queryParams, schemaInfo)).toThrow(entry.error);
//   } else {
//     const parsedData = parseFormFields(queryParams, schemaInfo);
//     expect(parsedData).toEqual(entry.parsed ?? entry.submitted);
//   }
// }

function toFormValue(value: unknown): string {
  return value instanceof Date ? value.toISOString() : String(value);
}

export function ignore(_description: string, _: () => void) {}
