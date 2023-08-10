// inspired by https://github.com/ciscoheat/sveltekit-superforms/blob/main/src/lib/superValidate.ts

import type { Static, TObject } from "@sinclair/typebox";

import {
  defaultValueForType,
  type FieldInfo,
  type SchemaInfo,
} from "./schema-info.js";
import { JavaScriptType } from "./typebox-types.js";

export function parseFormData<T extends TObject>(
  formData: FormData,
  schemaInfo: SchemaInfo<T>
): Static<T> {
  const output: Record<string, unknown> = {};

  for (const fieldName of schemaInfo.fieldNames) {
    const fieldInfo = schemaInfo.fields[fieldName];
    const entries = formData.getAll(fieldName);

    if (fieldInfo.fieldType == JavaScriptType.Array) {
      output[fieldName] = entries.map((entry) =>
        parseFormEntry(entry, fieldInfo.memberType!, fieldInfo)
      );
    } else {
      const entry = entries[0];
      if (entry === "" || entry === undefined) {
        output[fieldName] = fieldInfo.hasDefault
          ? fieldInfo.defaultValue
          : defaultValueForType(fieldInfo);
      } else {
        output[fieldName] = parseFormEntry(
          entry,
          fieldInfo.fieldType,
          fieldInfo
        );
      }
    }
  }

  return output;
}

function parseFormEntry(
  entry: FormDataEntryValue,
  fieldType: JavaScriptType,
  fieldInfo: FieldInfo
) {
  if (typeof entry !== "string") {
    return undefined; // File object, not supported
  }
  return parseFormValue(entry, fieldType, fieldInfo);
}

function parseFormValue(
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
    return Boolean(value == "false" ? "" : value).valueOf();
  } else if (fieldType == JavaScriptType.Date) {
    return new Date(value);
  } else if (fieldType == JavaScriptType.Array) {
    return parseFormValue(value, fieldInfo.memberType!, fieldInfo);
  } else if (fieldType == JavaScriptType.BigInt) {
    try {
      return BigInt(value);
    } catch {
      return NaN;
    }
  } else if (fieldType == JavaScriptType.Symbol) {
    return Symbol(String(value));
  } else {
    throw Error(
      `Type '${fieldType}' in '${
        fieldInfo.fieldName ? "field " + fieldInfo.fieldName : "[array member]"
      } not supported`
    );
  }
}
