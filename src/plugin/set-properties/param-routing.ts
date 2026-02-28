import { flattenCommands, propList } from './prop-list';
import regexShorthand from './regex';
import { TransformOrigin } from './origin';

export interface parameterRoutingProps {
  param: string;
  value: string;
  nodes: readonly SceneNode[];
  origin?: TransformOrigin;
}

export default async function parameterRouting(
  { param, value, nodes: node }: parameterRoutingProps,
  propItems = propList
): Promise<boolean> {
  let match = false;
  const flattenedCommands = flattenCommands(propItems, {});

  for (const prop of Object.values(flattenedCommands)) {
    const regex = regexShorthand({
      prop: prop.shortcut,
      hasValue: prop.hasValue,
      continueEnd: prop.subcommands !== undefined,
    });

    if (regex.test(param)) {
      regex.lastIndex = 0; // Reset regex lastIndex in case of global flag usage

      if (prop.action && param === prop.shortcut) {
        await prop.action({ param, value, nodes: node });
        match = true; // Action executed
        break; // Stop processing as action is executed
      }
    }
  }

  return match; // Return if a match was found for possible recursive calls
}
