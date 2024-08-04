import { propList } from './prop-list';

interface getSuggestionsProps {
  query: string;
}

export default function getSuggestions({ query }: getSuggestionsProps) {
  if (query !== undefined) {
    const values = query.split(' ');
    const regex = /([A-Za-z]+)([0-9]*\.*[0-9]*)\b/g;
    let suggestionsText = [];
    let suggestionsCommands = [];

    for (const value of values) {
      const match = value.match(regex);
      if (match !== null) {
        const subgroups = regex.exec(value);
        console.log(subgroups);
        if (subgroups.length === 3) {
          const param = subgroups[1];
          const paramVal = subgroups[2];
          console.log(query, values, param);
          if (param in propList) {
            const propItem = propList[param];
            if (propItem.hasValue) {
              if (paramVal !== '') suggestionsText.push(`Set ${propItem.name} to ${paramVal}px`);
              else suggestionsText.push(`Set ${propItem.name} to (Enter Value)`);
              suggestionsCommands.push(value);
            } else {
              suggestionsText.push(propItem.name);
              suggestionsCommands.push(value);
            }
          } else {
            console.log('missed all suggestions');
          }
        }
      }
    }

    if (suggestionsCommands.length > 0 && suggestionsText.length > 0) {
      const suggestionCommand = suggestionsCommands.join(' ');
      suggestionsCommands.splice(
        -1,
        1,
        suggestionsCommands[suggestionsCommands.length - 1] + ' - ' + suggestionsText[suggestionsText.length - 1]
      );
      const suggestionText = suggestionsCommands.join(', ');

      return { name: suggestionText, data: suggestionCommand };
    }
  }
}
