import { propList } from './prop-list';
import regexShorthand from './regex';

export interface parameterRoutingProps {
  param: string;
  value: string;
  nodes: readonly SceneNode[];
}

export default function parameterRouting(
  { param, value, nodes: node }: parameterRoutingProps,
  propItems = propList
): boolean {
  let match = false;

  for (const prop of Object.values(propItems)) {
    const regex = regexShorthand({
      prop: prop.shortcut,
      hasValue: prop.hasValue,
      continueEnd: prop.subcommands !== undefined,
    });

    if (regex.test(param)) {
      regex.lastIndex = 0; // Reset regex lastIndex in case of global flag usage

      // Check for subcommand matches
      if (prop.subcommands) {
        const subcommandMatch = parameterRouting({ param, value, nodes: node }, prop.subcommands);
        if (subcommandMatch) {
          match = true; // Subcommand executed
          break; // Stop processing further as a subcommand is executed
        }
      }

      // If no subcommand matches, and the parent itself matches, execute the parent's action
      if (prop.action && param === prop.shortcut) {
        prop.action({ param, value, nodes: node });
        match = true; // Action executed
        break; // Stop processing as action is executed
      }
    }
  }

  return match; // Return if a match was found for possible recursive calls
}
