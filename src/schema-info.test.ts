import { Type, type TObject } from "@sinclair/typebox";
import { describe, expect, test } from "vitest";

import { getSchemaInfo } from "./schema-info.js";

const badUnionOfArraysSchema = Type.Object({
  list: Type.Union([Type.Array(Type.String()), Type.Array(Type.Number())]),
});

interface InvalidTestEntry {
  description: string;
  schema: TObject;
  error?: string;
}

const invalidTestEntries: InvalidTestEntry[] = [
  {
    description: "handling an invalid unions of arrays",
    schema: badUnionOfArraysSchema,
    error: "JavaScript type",
  },
];

describe("disallowed schemas", () => {
  for (const entry of invalidTestEntries) {
    test(entry.description, () => {
      expect(() => getSchemaInfo(entry.schema)).toThrow(entry.error);
    });
  }
});
