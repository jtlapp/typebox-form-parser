import { Type, type TObject } from "@sinclair/typebox";
import { describe, expect, test } from "vitest";

import { parseFormData } from "./parse-form-data.js";
import { getSchemaInfo } from "./schema-info.js";

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

const arraySchema = Type.Object({
  strings: Type.Array(Type.String()),
  ints: Type.Array(Type.Integer()),
  bools: Type.Optional(Type.Array(Type.Boolean())),
  bigints: Type.Union([Type.Array(Type.BigInt()), Type.Null()]),
});

const defaultArraySchema = Type.Object({
  strings: Type.Array(Type.String(), { default: ["abc", "def"] }),
});

// const normalSchemaWithDefaults = Type.Object({
//   name: Type.String({ minLength: 2, default: "Jane" }),
//   nickname: Type.Optional(Type.String({ minLength: 2, default: "Janey" })),
//   age: Type.Number({
//     minimum: 13,
//     default: 50
//   }),
//   siblings: Type.Optional(Type.Integer({ minimum: 0, default: 0 })),
//   email: Type.String({
//     pattern: "^[a-z]+@[a-z]+[.][a-z]+$",
//     minLength: 10,
//     default: "username@example.com",
//   }),
//   agree: Type.Boolean({ default: true }),
// });

interface TestEntry {
  description: string;
  schema: TObject;
  submitted: object;
  parsed: object | null;
}

const testEntries: TestEntry[] = [
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
    description: "booleans/nullables default to false/null",
    schema: normalSchema,
    submitted: {
      name: "Jane",
      age: 50,
    },
    parsed: {
      name: "Jane",
      age: 50,
      email: null,
      agree: false,
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
      agree: false,
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
      strings: [],
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
];

describe("parseFormData", () => {
  for (const entry of testEntries) {
    test(entry.description, () => {
      testFormData(entry);
    });
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
    } = parseFormData({} as FormData, schemaInfo);
    return result; // suppress unused variable warning
  });
});

function testFormData(entry: TestEntry): void {
  // Construct FormData for the provided data.

  const formData = new FormData();
  for (const [key, value] of Object.entries(entry.submitted)) {
    if (Array.isArray(value)) {
      for (const item of value) {
        formData.append(key, item);
      }
    } else if (value !== null && value !== undefined) {
      formData.append(key, value);
    }
  }

  // Parse the FormData.

  const schemaInfo = getSchemaInfo(entry.schema);
  const parsedData = parseFormData(formData, schemaInfo);

  // Verify the parsed data.

  expect(parsedData).toEqual(entry.parsed ?? entry.submitted);
}

export function ignore(_description: string, _: () => void) {}
