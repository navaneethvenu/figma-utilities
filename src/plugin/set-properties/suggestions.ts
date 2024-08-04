import { getHistory } from './history';
import { flattenCommands, PropItem, propList } from './prop-list';

interface getSuggestionsProps {
  query: string;
}

interface BindedCommand {
  command: PropItem;
  value: string;
}

export default function getSuggestions({ query }: getSuggestionsProps) {
  const flattenedCommands = flattenCommands(propList, {});
  const suggestionCommands: BindedCommand[][] = [];

  if (query !== undefined) {
    const values = query.split(' ');
    const regex = /([A-Za-z]+)([0-9]*\.*[0-9]*)\b/g;

    const suggestions: { name: string; data: string }[] = [];
    let suggestionRow: BindedCommand[] = [];

    for (const value of values) {
      const match = value.match(regex);
      if (match !== null) {
        const subgroups = regex.exec(value);
        console.log(subgroups);
        if (subgroups.length === 3) {
          const param = subgroups[1];
          const paramVal = subgroups[2];
          console.log(query, values, param);
          if (param in flattenedCommands) {
            const propItem = flattenedCommands[param];
            suggestionRow.push({
              command: propItem,
              value: paramVal,
            });
          } else {
            console.log('missed all suggestions');
          }
        }
      }

      // count++;
    }

    if (suggestionRow.length > 0) {
      const lastItem: BindedCommand = suggestionRow[suggestionRow.length - 1];
      const commandVariants: BindedCommand[] = getNestedCommands(lastItem);

      for (const commandVariant of commandVariants) {
        suggestionCommands.push([...suggestionRow.slice(0, suggestionRow.length - 1), commandVariant]);
      }

      console.log('commvar', commandVariants);

      console.log('sugg', suggestionCommands);

      for (const suggestionCommandList of suggestionCommands) {
        let suggestionData: { name: string; data: string } = { name: '', data: '' };
        suggestionData.name = suggestionCommandList
          .map((command) => command.command.shortcut + command.value)
          .slice(0, suggestionCommandList.length - 1)
          .join(', ');
        const lastCommand = suggestionCommandList[suggestionCommandList.length - 1];
        let lastMessage = '';
        if (lastCommand.command.hasValue) {
          if (lastCommand.value !== '') lastMessage = `Set ${lastCommand.command.name} to ${lastCommand.value}px`;
          else lastMessage = `Set ${lastCommand.command.name} to (Enter Value)`;
        } else {
          lastMessage = lastCommand.command.name;
        }

        if (suggestionData.name === '')
          suggestionData.name = lastCommand.command.shortcut + lastCommand.value + ' - ' + lastMessage;
        else
          suggestionData.name = [
            suggestionData.name,
            lastCommand.command.shortcut + lastCommand.value + ' - ' + lastMessage,
          ].join(', ');

        suggestionData.data = suggestionCommandList
          .map((command) => command.command.shortcut + command.value)
          .join(' ');
        suggestions.push(suggestionData);
      }

      return suggestions;
    }

    function getNestedCommands(item: BindedCommand) {
      const commands: BindedCommand[] = [];
      commands.push(item);
      if (item.command.subcommands) {
        for (const subPropItem of Object.values(item.command.subcommands)) {
          const subCommandVariants = getNestedCommands({ command: subPropItem, value: item.value });
          commands.push(...subCommandVariants);
        }
      }
      console.log(commands);
      return commands;
    }
  }
}

export async function getDefaultSuggestions() {
  const history = await getHistory();
  const suggestions: { name: string; data: string }[] = [];

  console.log('default', history);

  for (const historySuggestion of history) {
    const suggestionText = historySuggestion.map((item) => item.param + item.value).join(' ');
    suggestions.push({
      name: suggestionText,
      data: suggestionText,
    });
  }

  return suggestions;
}
