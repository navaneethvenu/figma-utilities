import { flattenCommands, propList } from './prop-list';

export interface ParsedParameter {
  param: string;
  value: string;
}

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

export default function parseParameters(parameters: { [key: string]: string }): ParsedParameter[] {
  const parsedParams: ParsedParameter[] = [];

  for (const key in parameters) {
    const values = parameters[key].split(' ');

    for (const value of values) {
      const parsed = parseToken(value);
      if (!parsed) {
        throw new Error(`Invalid Command: ${value}`);
      }
      parsedParams.push(parsed);
    }
  }

  return parsedParams;
}
