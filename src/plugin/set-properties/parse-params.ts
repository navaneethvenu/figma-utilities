export interface ParsedParameter {
  param: string;
  value: string;
}

export default function parseParameters(parameters: { [key: string]: string }): ParsedParameter[] {
  const parsedParams: ParsedParameter[] = [];
  const regex = /([A-Za-z]+)([0-9]*\.*[0-9]*)\b/g;

  for (const key in parameters) {
    const values = parameters[key].split(' ');

    for (const value of values) {
      const match = value.match(regex);
      if (match) {
        const subgroups = regex.exec(value);
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
