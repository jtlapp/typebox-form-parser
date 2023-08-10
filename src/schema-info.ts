// inspired by https://github.com/ciscoheat/sveltekit-superforms/blob/main/src/lib/schemaEntity.ts

import type { TArray, TLiteral, TSchema, TUnion } from "@sinclair/typebox";
import { Kind, Optional } from "@sinclair/typebox";

import { JavaScriptType, TypeBoxType } from "./typebox-types.js";

export interface SchemaInfo<T extends TSchema> {
  schema: T;
  fieldNames: string[];
  fields: Record<string, FieldInfo>;
  defaultObject: Record<string, unknown>;
}

export interface FieldInfo {
  fieldName: string | null; // null for array and union members
  fieldType: JavaScriptType;
  memberType: JavaScriptType | null;
  isNullable: boolean;
  isOptional: boolean;
  hasDefault: boolean;
  defaultValue: unknown;
}

let schemaToInfoMap = new WeakMap<TSchema, SchemaInfo<TSchema>>();

export function resetSchemaInfoCache() {
  // useful for testing
  schemaToInfoMap = new WeakMap<TSchema, SchemaInfo<TSchema>>();
}

export function getSchemaInfo<T extends TSchema>(schema: T): SchemaInfo<T> {
  let schemaInfo = schemaToInfoMap.get(schema) as SchemaInfo<T> | undefined;
  if (schemaInfo === undefined) {
    const fieldNames = Object.keys(schema.properties);
    const fields: Record<string, FieldInfo> = {};

    for (const fieldName of fieldNames) {
      fields[fieldName] = createFieldInfo(
        fieldName,
        schema.properties[fieldName]
      );
    }

    const defaultObject: Record<string, unknown> = {};
    for (const fieldName of fieldNames) {
      const fieldInfo = fields[fieldName];
      defaultObject[fieldName] = fieldInfo.hasDefault
        ? fieldInfo.defaultValue
        : defaultValueForType(fieldInfo);
    }

    schemaInfo = {
      schema,
      fieldNames,
      fields,
      defaultObject,
    };
    schemaToInfoMap.set(schema, schemaInfo);
  }
  return schemaInfo;
}

export function defaultValueForType(fieldInfo: FieldInfo): unknown {
  return fieldInfo.isNullable
    ? null
    : fieldInfo.fieldType == JavaScriptType.Boolean
    ? false
    : undefined;
}

function createFieldInfo(fieldName: string | null, schema: TSchema): FieldInfo {
  const typeBoxType = schema[Kind] as TypeBoxType;
  let fieldType = schema.type as JavaScriptType;
  let memberType: JavaScriptType | null = null;
  let isNullable = false;
  const isOptional = schema[Optional] !== undefined;
  const hasDefault = schema.default !== undefined;

  if (typeBoxType === TypeBoxType.Union) {
    [fieldType, isNullable] = getUnionInfo(schema as TUnion);
  } else if (typeBoxType === TypeBoxType.Null) {
    isNullable = true;
  } else if (typeBoxType === TypeBoxType.Literal) {
    fieldType = (schema as TLiteral).type as JavaScriptType;
  } else if (typeBoxType === TypeBoxType.Array) {
    memberType = (schema as TArray).items.type as JavaScriptType;
  }

  if (typeBoxType === TypeBoxType.Boolean && (isNullable || isOptional)) {
    throw Error("Form booleans (checkboxes) can't be nullable or optional");
  }
  if (isNullable && isOptional) {
    throw Error("Form types can't be both optional and nullable");
  }

  return {
    fieldName,
    fieldType,
    memberType,
    isNullable,
    isOptional,
    hasDefault,
    defaultValue: schema.default,
  };
}

function getUnionInfo(schema: TUnion): [JavaScriptType, boolean] {
  let fieldType: JavaScriptType | undefined = undefined;
  let isNullable = false;

  for (const memberSchema of schema.anyOf) {
    const fieldInfo = createFieldInfo(null, memberSchema); // allows nested unions
    if (fieldInfo.isNullable) {
      isNullable = true;
    } else {
      if (fieldType === undefined) {
        fieldType = fieldInfo.fieldType;
      } else if (fieldType !== fieldInfo.fieldType) {
        throw Error(
          "All non-null members of a union type must have the same JavaScript type"
        );
      }
    }
  }

  if (fieldType === undefined) {
    throw Error("Union type must have at least one non-null member");
  }
  return [fieldType, isNullable];
}
