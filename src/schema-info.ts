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
        schema.properties[fieldName],
        false
      );
    }

    const defaultObject: Record<string, unknown> = {};
    for (const fieldName of fieldNames) {
      const fieldInfo = fields[fieldName];
      defaultObject[fieldName] = getDefaultValue(fieldInfo);
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

export function getDefaultValue(fieldInfo: FieldInfo): unknown {
  return fieldInfo.hasDefault
    ? fieldInfo.defaultValue
    : fieldInfo.isNullable
    ? null
    : fieldInfo.fieldType == JavaScriptType.Boolean
    ? false
    : undefined;
}

function createFieldInfo(
  fieldName: string | null,
  schema: TSchema,
  withinArray: boolean
): FieldInfo {
  const typeBoxType = schema[Kind] as TypeBoxType;
  let fieldType = schema.type as JavaScriptType;
  let memberType: JavaScriptType | null = null;
  let isNullable = false;
  const isOptional = schema[Optional] !== undefined;
  let defaultValue = schema.default;
  const hasDefault = defaultValue !== undefined;

  if (typeBoxType === TypeBoxType.Union) {
    [fieldType, isNullable, memberType] = getUnionInfo(
      schema as TUnion,
      withinArray
    );
  } else if (typeBoxType === TypeBoxType.Null) {
    isNullable = true;
  } else if (typeBoxType === TypeBoxType.Literal) {
    fieldType = (schema as TLiteral).type as JavaScriptType;
  } else if (typeBoxType === TypeBoxType.Date) {
    if (hasDefault) {
      defaultValue = new Date(schema.default as string);
    }
  } else if (typeBoxType === TypeBoxType.Array) {
    if (withinArray) {
      throw Error("Form arrays can't themselves contain arrays");
    }
    memberType = getArrayMemberType(schema as TArray);
  }

  if (isNullable || isOptional) {
    if (fieldType == JavaScriptType.Boolean) {
      throw Error("Form booleans (checkboxes) can't be nullable or optional");
    }
    if (hasDefault) {
      throw Error("Optional and nullable form types can't have default values");
    }
    if (isOptional && isNullable) {
      throw Error("Form types can't be both optional and nullable");
    }
  }

  return {
    fieldName,
    fieldType,
    memberType,
    isNullable,
    isOptional,
    hasDefault,
    defaultValue,
  };
}

function getArrayMemberType(schema: TArray) {
  const memberInfo = createFieldInfo(null, schema.items, true);
  if (memberInfo.isNullable || memberInfo.isOptional) {
    throw Error("Form arrays can't contain nullable or optional members");
  }
  return memberInfo.fieldType;
}

function getUnionInfo(
  schema: TUnion,
  withinArray: boolean
): [JavaScriptType, boolean, JavaScriptType | null] {
  let fieldType: JavaScriptType | undefined = undefined;
  let isNullable = false;
  let memberType: JavaScriptType | null = null;

  for (const memberSchema of schema.anyOf) {
    // allows nested unions
    const fieldInfo = createFieldInfo(null, memberSchema, withinArray);
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
      if (fieldType === JavaScriptType.Array) {
        const nextMemberType = getArrayMemberType(memberSchema as TArray);
        if (memberType === null) {
          memberType = nextMemberType;
        } else if (memberType !== nextMemberType) {
          throw Error(
            "All members of arrays in unions must have the same JavaScript type"
          );
        }
      }
    }
  }

  if (fieldType === undefined) {
    throw Error("Union type must have at least one non-null member");
  }
  return [fieldType, isNullable, memberType];
}
