import { flattenCommands, propList } from './prop-list';
import parseModifiedToken from './modifiers/parse-modified-token';
import parseScopedScaleToken from './modifiers/parse-scoped-scale-token';
import { parseOriginToken, splitOriginPrefixedToken } from './origin';
import { isFillAddValue, isFillDeleteValue, isFillInsertValue, isFillReplaceValue } from './utils/color/replace-fill';

export interface ParsedParameter {
  param: string;
  value: string;
  raw?: string;
  modified?: boolean;
  scopedScaleModifier?: boolean;
  originModifier?: boolean;
}

const OP_PREFIX_RE = /^(\+\+|--|\*\*|\/\/|\+|-|\*|\/)?/;

function isNumericValue(value: string, allowedUnits: readonly string[] = []) {
  const match = value.trim().match(/^(-?\d*\.?\d+)([a-z%]+)?$/i);
  if (!match) return false;

  const unit = (match[2] ?? '').toLowerCase();
  if (!unit) return true;
  return allowedUnits.map((entry) => entry.toLowerCase()).includes(unit);
}

function isPairNumericValue(value: string, allowedUnits: readonly string[] = []) {
  const [left, right] = value.split(',');
  if (right === undefined) return false;
  return isNumericValue(left, allowedUnits) && isNumericValue(right, allowedUnits);
}

function isAxisValue(value: string) {
  const normalized = value.trim().toLowerCase();
  return normalized === '' || normalized === 'w' || normalized === 'h';
}

function isValueValidForCommand(shortcut: string, value: string) {
  if (shortcut === 'f') return isFillReplaceValue(value);
  if (shortcut === 'fa') return isFillAddValue(value);
  if (shortcut === 'fi') return isFillInsertValue(value);
  if (shortcut === 'fd') return isFillDeleteValue(value);
  if (shortcut === 'dup') return /^\d+$/.test(value.trim());
  if (shortcut === 'op') return isNumericValue(value, ['%']);
  if (shortcut === 'rot') return isNumericValue(value, ['deg']);
  if (shortcut === 'ls' || shortcut === 'lh') return isNumericValue(value, ['px', '%']);
  if (shortcut === 'w' || shortcut === 'h') return isNumericValue(value, ['px', '%']);
  if (shortcut === 'wh') return isNumericValue(value, ['px', '%']) || isPairNumericValue(value, ['px', '%']);
  if (shortcut === 'fit' || shortcut === 'fill' || shortcut === 'hug') return isAxisValue(value);
  if (shortcut.startsWith('sc:')) return isNumericValue(value, ['px']);

  return isNumericValue(value, ['px']);
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

    if (isValueValidForCommand(command.shortcut, value)) {
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
    if (isValueValidForCommand(command.shortcut, value)) return false;
    if (value.includes('..')) return true;
    if (value.startsWith('.') || value.endsWith('.')) return true;
    return true;
  }

  return false;
}

export default function parseParameters(parameters: { [key: string]: string }): ParsedParameter[] {
  const parsedParams: ParsedParameter[] = [];

  for (const key in parameters) {
    const values = parameters[key]
      .split(' ')
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
