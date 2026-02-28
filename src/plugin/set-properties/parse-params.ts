import { flattenCommands, propList } from './prop-list';
import parseModifiedToken from './modifiers/parse-modified-token';
import { parseOriginToken } from './origin';

export interface ParsedParameter {
  param: string;
  value: string;
  raw?: string;
  modified?: boolean;
  originModifier?: boolean;
}

const OP_PREFIX_RE = /^(\+\+|--|\*\*|\/\/|\+|-|\*|\/)?/;

function isValidValue(value: string) {
  return /^#?-?(?:[0-9]*\.?[0-9]+(?:px|%)?|[0-9a-fA-F]+)*$/.test(value);
}

function parseToken(token: string): ParsedParameter | null {
  const commands = Object.values(flattenCommands(propList, {})).sort(
    (a, b) => b.shortcut.length - a.shortcut.length
  );

  for (const command of commands) {
    if (!token.startsWith(command.shortcut)) continue;

    const value = token.slice(command.shortcut.length);

    if (command.hasValue === false) {
      if (value === '') return { param: command.shortcut, value: '' };
      continue;
    }

    if (isValidValue(value)) {
      return { param: command.shortcut, value };
    }
  }

  return null;
}

function isModifierEnabledCommand(command: string) {
  const flattened = flattenCommands(propList, {});
  const prop = flattened[command];
  return Boolean(prop?.supportsModifiers);
}

function isInvalidValueForKnownCommand(token: string): boolean {
  const flattened = flattenCommands(propList, {});
  const commands = Object.values(flattened).sort((a, b) => b.shortcut.length - a.shortcut.length);

  const prefixMatch = token.match(OP_PREFIX_RE);
  const prefix = prefixMatch?.[0] ?? '';
  const rest = token.slice(prefix.length);

  for (const command of commands) {
    if (!rest.startsWith(command.shortcut)) continue;
    if (command.hasValue === false) return false;

    const value = rest.slice(command.shortcut.length);
    if (value === '') return false;
    if (isValidValue(value)) return false;
    if (value.includes('..')) return true;
    if (value.startsWith('.') || value.endsWith('.')) return true;
    return true;
  }

  return false;
}

export default function parseParameters(parameters: { [key: string]: string }): ParsedParameter[] {
  const parsedParams: ParsedParameter[] = [];

  for (const key in parameters) {
    const values = parameters[key].split(' ');

    for (const value of values) {
      const parsedOrigin = parseOriginToken(value);
      if (parsedOrigin) {
        parsedParams.push({ param: value, value: '', raw: value, originModifier: true });
        continue;
      }

      const mayBeModified =
        value.includes('..') ||
        value.startsWith('++') ||
        value.startsWith('--') ||
        value.startsWith('**') ||
        value.startsWith('//') ||
        value.startsWith('+') ||
        value.startsWith('-') ||
        value.startsWith('*') ||
        value.startsWith('/');

      if (mayBeModified) {
        const parsedModified = parseModifiedToken(value);
        if (parsedModified && isModifierEnabledCommand(parsedModified.command)) {
          parsedParams.push({ param: value, value: '', raw: value, modified: true });
          continue;
        }
      }

      const parsed = parseToken(value);
      if (!parsed) {
        if (isInvalidValueForKnownCommand(value)) {
          throw new Error(`Invalid Value: ${value}`);
        }
        throw new Error(`Invalid Command: ${value}`);
      }
      parsedParams.push(parsed);
    }
  }

  return parsedParams;
}
