import { baseRegex } from './base-regex';

export interface ParsedParameter {
  param: string;
  value: string;
}

export default function parseParameters(parameters: { [key: string]: string }): ParsedParameter[] {
  const parsedParams: ParsedParameter[] = [];

  for (const key in parameters) {
    const values = parameters[key].split(' ');

    for (const value of values) {
      const match = value.match(baseRegex);
      if (match) {
        const subgroups = baseRegex.exec(value);
        if (subgroups && subgroups.length === 3) {
          parsedParams.push({ param: subgroups[1], value: subgroups[2] });
        } else {
          throw new Error(`Invalid Command: ${value}`);
        }
      } else {
        throw new Error(`Invalid Command: ${value}`);
      }
    }
  }

  return parsedParams;
}
