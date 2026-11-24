import { tokenizeParameterInput } from './tokenize-input';
import { isValueValidForCommand } from './value-validation';
import { flattenCommands, propList } from './prop-list';
import parseModifiedToken from './modifiers/parse-modified-token';
import parseScopedScaleToken from './modifiers/parse-scoped-scale-token';
import { parseOriginToken, splitOriginPrefixedToken } from './origin';

export interface ParsedParameter {
  param: string;
  value: string;
  raw?: string;
  modified?: boolean;
  scopedScaleModifier?: boolean;
  originModifier?: boolean;
}

const commandCatalog = flattenCommands(propList, {});
const sortedCommands = Object.values(commandCatalog).sort((a, b) => b.shortcut.length - a.shortcut.length);

const OP_PREFIX_RE = /^(\+\+|--|\*\*|\/\/|\+|-|\*|\/)?/;

function parseToken(token: string): ParsedParameter | null {
  const commands = sortedCommands;

  for (const command of commands) {
    if (!token.startsWith(command.shortcut)) continue;

    const value = token.slice(command.shortcut.length);

    if (command.hasValue === false) {
      if (value === '' && command.action) return { param: command.shortcut, value: '' };
      continue;
    }

    if (isValueValidForCommand(command, value)) {
      return { param: command.shortcut, value };
    }
  }

  return null;
}

function isModifierEnabledCommand(command: string) {
  const flattened = commandCatalog;
  const prop = flattened[command];
  return Boolean(prop?.supportsModifiers);
}

function isInvalidValueForKnownCommand(token: string): boolean {
  const commands = sortedCommands;

  const prefixMatch = token.match(OP_PREFIX_RE);
  const prefix = prefixMatch?.[0] ?? '';
  const rest = token.slice(prefix.length);

  for (const command of commands) {
    if (!rest.startsWith(command.shortcut)) continue;
    if (command.hasValue === false) return false;

    const value = rest.slice(command.shortcut.length);
    if (value === '' && command.action) return false;
    if (isValueValidForCommand(command, value)) return false;
    if (value.includes('..')) return true;
    if (value.startsWith('.') || value.endsWith('.')) return true;
    return true;
  }

  return false;
}

export default function parseParameters(parameters: { [key: string]: string }): ParsedParameter[] {
  const parsedParams: ParsedParameter[] = [];

  for (const key in parameters) {
    const values = tokenizeParameterInput(parameters[key])
      .flatMap((value) => splitOriginPrefixedToken(value))
      .filter((value) => value.trim() !== '');

    for (const value of values) {
      const parsedOrigin = parseOriginToken(value);
      if (parsedOrigin) {
        parsedParams.push({ param: value, value: '', raw: value, originModifier: true });
        continue;
      }

      const mayBeModified =
        value.includes('..') ||
        value.startsWith('sc:') ||
        value.startsWith('++') ||
        value.startsWith('--') ||
        value.startsWith('**') ||
        value.startsWith('//') ||
        value.startsWith('+') ||
        value.startsWith('-') ||
        value.startsWith('*') ||
        value.startsWith('/');

      if (mayBeModified) {
        const parsedScopedScale = parseScopedScaleToken(value);
        if (parsedScopedScale) {
          parsedParams.push({ param: value, value: '', raw: value, scopedScaleModifier: true });
          continue;
        }

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
