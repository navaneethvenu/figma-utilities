import { addHistory } from './history';
import parameterRouting from './param-routing';
import parseParameters from './parse-params';
import { ErrorType } from '../utils/errorType';
import { applyModifiedCommand } from './modifiers/apply-modified-token';

export default async function setProperties(parameters: { [key: string]: string }) {
  try {
    if (figma.currentPage.selection && figma.currentPage.selection.length > 0) {
      const parsedParams = parseParameters(parameters);

      for (const { param, value, raw, modified } of parsedParams) {
        const currentSelection = figma.currentPage.selection;
        if (!currentSelection || currentSelection.length === 0) {
          figma.notify('Selection became empty while applying commands.');
          return;
        }

        if (modified) {
          await applyModifiedCommand(raw ?? param, currentSelection);
          continue;
        }

        const matched = await parameterRouting({ param, value, nodes: currentSelection });
        if (!matched) {
          throw new Error(`${ErrorType.INVALID_CMD}: ${param}${value}`);
        }
      }

      await addHistory(parsedParams);

      figma.notify('Properties set successfully.');
    } else {
      figma.notify('No nodes selected.');
    }
  } catch (e: any) {
    console.log(e);
    figma.notify(e.message);
  }
}
