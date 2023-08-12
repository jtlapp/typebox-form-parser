// inspired by https://github.com/ciscoheat/sveltekit-superforms/blob/main/src/lib/superValidate.ts

import type { Static, TObject } from "@sinclair/typebox";

import {
  defaultValueForType,
  type FieldInfo,
  type SchemaInfo,
} from "./schema-info.js";
import { JavaScriptType } from "./typebox-types.js";

export type FieldData = {
  getAll: (FormData | URLSearchParams)["getAll"];
};

export function parseFormFields<T extends TObject>(
  fieldData: FieldData,
  schemaInfo: SchemaInfo<T>
): Static<T> {
  const output: Record<string, unknown> = {};

  for (const fieldName of schemaInfo.fieldNames) {
    const fieldInfo = schemaInfo.fields[fieldName];
    const entries = fieldData.getAll(fieldName);
    let value: unknown;

    if (fieldInfo.fieldType == JavaScriptType.Array) {
      if (entries.length !== 0) {
        value = entries.map((entry) =>
          parseField(entry, fieldInfo.memberType!, fieldInfo)
        );
      } else if (
        !fieldInfo.isOptional &&
        !fieldInfo.isNullable &&
        !fieldInfo.hasDefault
      ) {
        // TODO: Is it even possible for a form to specify this?
        //  Shouldn't missing arrays actually only validate as optional?
        value = [];
      }
    } else {
      // TODO: provided arrays need to be parsed as arrays
      const entry = entries[0];
      if (entry !== "" && entry !== undefined) {
        value = parseField(entry, fieldInfo.fieldType, fieldInfo);
      }
    }
    if (value === undefined) {
      value = fieldInfo.hasDefault
        ? fieldInfo.defaultValue
        : defaultValueForType(fieldInfo);
    }
    if (value !== undefined) {
      output[fieldName] = value;
    }
  }

  return output;
}

function parseField(
  entry: FormDataEntryValue,
  fieldType: JavaScriptType,
  fieldInfo: FieldInfo
) {
  return typeof entry === "string"
    ? parseStringValue(entry, fieldType, fieldInfo)
    : undefined; // file objects are not supported
}

function parseStringValue(
  value: string,
  fieldType: JavaScriptType,
  fieldInfo: FieldInfo
): unknown {
  if (fieldType == JavaScriptType.String) {
    return value;
  } else if (fieldType == JavaScriptType.Integer) {
    return parseInt(value);
  } else if (fieldType == JavaScriptType.Number) {
    return parseFloat(value);
  } else if (fieldType == JavaScriptType.Boolean) {
    // Boolean fields normally only appear in a form when true, but handle
    // case where the client is explicitly setting a "false" or "off" value.
    return value !== "false" && value !== "off";
  } else if (fieldType == JavaScriptType.Date) {
    return new Date(value);
  } else if (fieldType == JavaScriptType.Array) {
    return parseStringValue(value, fieldInfo.memberType!, fieldInfo);
  } else if (fieldType == JavaScriptType.BigInt) {
    try {
      return BigInt(value);
    } catch {
      return NaN;
    }
  } else {
    throw Error(`Unsupported field type: ${fieldType}`);
  }
}
