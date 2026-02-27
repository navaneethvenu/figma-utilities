import setProperties from './set-properties/set-properties';
import getSuggestions, { getDefaultSuggestions } from './set-properties/suggestions';

figma.parameters.on('input', async ({ key, query, result }) => {
  let suggestions: { name: string; data: any }[] = [];

  switch (key) {
    case 'property':
      suggestions = [];

      suggestions.push(...(await getDefaultSuggestions()));

      //filter duplicates
      suggestions = suggestions.filter(
        (item1, index, array) => array.findIndex((item2) => item1.data === item2.data) === index
      );

      if (query !== '' && query !== undefined) {
        const querySuggestions = getSuggestions({ query }) ?? [];
        suggestions.unshift(...querySuggestions);
      }

      if (suggestions === null || suggestions === undefined) suggestions = [];
      result.setSuggestions(suggestions);
      break;
    default:
      return;
  }
});

figma.on('run', async ({ parameters }: RunEvent) => {
  if (parameters !== null && parameters !== undefined) {
    await setProperties(parameters);
  }
  figma.closePlugin();
});
