import * as core from '@actions/core';

export type InputType = 'string' | 'boolean' | 'number' | 'list' | 'json';

export interface InputField<T = unknown> {
  type?: InputType;
  required?: boolean;
  secret?: boolean;
  default?: T;
  parse?: (raw: string) => T;
}

export type InputSchema = Record<string, InputField<any>>;

type InferFieldType<F extends InputField<any>> = F extends { parse: (raw: string) => infer R }
  ? R
  : F['type'] extends 'boolean'
    ? boolean
    : F['type'] extends 'number'
      ? number
      : F['type'] extends 'list'
        ? string[]
        : string;

export type InferInputs<S extends InputSchema> = {
  [K in keyof S]: InferFieldType<S[K]>;
};

export function parseListInput(raw: string): string[] {
  return raw
    .split(/[\r\n,]+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

export function getInputs<S extends InputSchema>(schema: S): InferInputs<S> {
  const result = {} as Record<string, unknown>;

  for (const [key, field] of Object.entries(schema)) {
    const raw = core.getInput(key, { required: field.required ?? false });

    if (field.secret && raw) {
      core.setSecret(raw);
    }

    if (!raw && field.default !== undefined) {
      result[key] = field.default;
      continue;
    }

    if (field.parse) {
      result[key] = field.parse(raw);
      continue;
    }

    switch (field.type) {
      case 'boolean':
        result[key] = raw ? core.getBooleanInput(key) : Boolean(field.default ?? false);
        break;

      case 'number': {
        const parsed = Number(raw);
        if (Number.isNaN(parsed)) {
          throw new Error(`Input "${key}" must be a valid number, received "${raw}"`);
        }
        result[key] = parsed;
        break;
      }

      case 'list':
        result[key] = raw ? parseListInput(raw) : [];
        break;

      case 'json':
        result[key] = raw ? JSON.parse(raw) : field.default;
        break;

      default:
        result[key] = raw;
        break;
    }
  }

  return result as InferInputs<S>;
}

export function setOutputs(outputs: Record<string, unknown>): void {
  for (const [key, value] of Object.entries(outputs)) {
    if (value === undefined || value === null) continue;

    const serialized =
      typeof value === 'object' ? JSON.stringify(value) : String(value);

    core.setOutput(key, serialized);
  }
}
