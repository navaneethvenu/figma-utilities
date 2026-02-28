import { addHistory } from './history';
import parameterRouting from './param-routing';
import parseParameters from './parse-params';
import { ErrorType } from '../utils/errorType';
import { applyModifiedCommand } from './modifiers/apply-modified-token';
import { parseOriginToken, TransformOrigin } from './origin';

export default async function setProperties(parameters: { [key: string]: string }) {
  try {
    if (figma.currentPage.selection && figma.currentPage.selection.length > 0) {
      const parsedParams = parseParameters(parameters);
      let currentOrigin: TransformOrigin | undefined;
      let executableCount = 0;

      for (const { param, value, raw, modified, originModifier } of parsedParams) {
        const currentSelection = figma.currentPage.selection;
        if (!currentSelection || currentSelection.length === 0) {
          figma.notify('Selection became empty while applying commands.');
          return;
        }

        if (originModifier) {
          const parsedOrigin = parseOriginToken(raw ?? param);
          if (!parsedOrigin) {
            throw new Error(`${ErrorType.INVALID_VAL}: ${raw ?? param}`);
          }
          currentOrigin = parsedOrigin;
          continue;
        }

        if (modified) {
          await applyModifiedCommand(raw ?? param, currentSelection, currentOrigin);
          executableCount++;
          continue;
        }

        const matched = await parameterRouting({ param, value, nodes: currentSelection, origin: currentOrigin });
        if (!matched) {
          throw new Error(`${ErrorType.INVALID_CMD}: ${param}${value}`);
        }
        executableCount++;
      }

      if (executableCount === 0) {
        throw new Error(`${ErrorType.INVALID_CMD}: origin modifier requires a following command`);
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
