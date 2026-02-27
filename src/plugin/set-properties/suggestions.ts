import { baseRegex } from './base-regex';
import { getHistory } from './history';
import { flattenCommands, PropItem, propList } from './prop-list';

interface getSuggestionsProps {
  query: string;
}

interface BindedCommand {
  command: PropItem;
  value: string;
}

interface Suggestion {
  name: string;
  data: string;
}

export default function getSuggestions({ query }: getSuggestionsProps) {
  const flattenedCommands = flattenCommands(propList, {});

  if (!query) return [];

  const values = query.split(' ');

  let suggestions: Suggestion[] = [];
  let suggestionRow: BindedCommand[] = [];

  for (const value of values) {
    const isLast = value === values[values.length - 1];
    const match = value.match(baseRegex);
    if (match !== null) {
      baseRegex.lastIndex = 0;
      const parsedValue = baseRegex.exec(value);
      if (!parsedValue) continue;

      const [, param, paramVal] = parsedValue;
      if (isLast) {
        const closestCommand = getClosestSuggestion(param, flattenedCommands);
        if (!closestCommand) continue;

        suggestionRow.push({
          command: closestCommand,
          value: paramVal,
        });
      } else {
        if (param in flattenedCommands) {
          const propItem = flattenedCommands[param];
          suggestionRow.push({
            command: propItem,
            value: paramVal,
          });
        }
      }
    }
  }

  suggestions = generateSuggestions(suggestionRow, flattenedCommands);

  return suggestions;
}

function getClosestSuggestion(param: string, flattenedCommands: Record<string, PropItem>): PropItem | undefined {
  for (const command in flattenedCommands) {
    if (command.startsWith(param)) {
      return flattenedCommands[command];
    }
  }
}

function generateSuggestions(
  suggestionRow: BindedCommand[],
  flattenedCommands: Record<string, PropItem>
): Suggestion[] {
  let suggestions: Suggestion[] = [];
  const suggestionCommands: BindedCommand[][] = [];

  if (suggestionRow.length === 0) return [];

  const lastItem: BindedCommand = suggestionRow[suggestionRow.length - 1];
  const commandVariants: BindedCommand[] = getSuggestedCommands(lastItem, flattenedCommands);

  for (const commandVariant of commandVariants) {
    suggestionCommands.push([...suggestionRow.slice(0, suggestionRow.length - 1), commandVariant]);
  }

  for (const suggestionCommandList of suggestionCommands) {
    let suggestionData: { name: string; data: string } = { name: '', data: '' };
    suggestionData.name = suggestionCommandList
      .map((command) =>
        command.command.hasValue ? command.command.shortcut + command.value : command.command.shortcut
      )
      .slice(0, suggestionCommandList.length - 1)
      .join(', ');

    const lastCommand = suggestionCommandList[suggestionCommandList.length - 1];

    let lastMessage = '';
    const { value, command } = lastCommand;

    if (command.hasValue) {
      if (lastCommand.value !== '') {
        const isFillCommand = command.shortcut.toLowerCase() === 'f';

        const isValidValue = isFillCommand
          ? /^#?[0-9a-fA-F]+$/.test(value) // hex color validation, accepts optional leading #
          : !isNaN(parseFloat(value)) && (parseFloat(value) >= 0 || command.allowsNegative === true);

        if (isValidValue) {
          const unit = command.unit === undefined ? 'px' : command.unit;
          if (command.message) lastMessage = `${command.message} ${value}${unit}`;
          else lastMessage = `Set ${command.name} to ${value}${unit}`;
        } else {
          lastMessage = `Error: ${command.name} cannot have invalid or negative values`;
        }
      } else lastMessage = `Set ${command.name} to (Enter Value)`;
    } else {
      if (command.message) lastMessage = command.message;
      else lastMessage = command.name;
    }

    const newName = `${command.shortcut}${command.hasValue ? value : ''} - ${lastMessage}`;
    suggestionData.name = suggestionData.name ? `${suggestionData.name}, ${newName}` : newName;

    suggestionData.data = suggestionCommandList.map((command) => command.command.shortcut + command.value).join(' ');
    if (command.action) {
      suggestions.push(suggestionData);
    }
  }

  return suggestions;
}

function getSuggestedCommands(item: BindedCommand, flattenedCommands: Record<string, PropItem>) {
  const commands: BindedCommand[] = [];
  for (const command in flattenedCommands) {
    if (command.startsWith(item.command.shortcut)) {
      commands.push({ command: flattenedCommands[command], value: item.value });
    }
  }
  return commands;
}

export async function getDefaultSuggestions() {
  const history = await getHistory();
  const suggestions: { name: string; data: string }[] = [];

  for (const historySuggestion of history) {
    const suggestionText = historySuggestion.map((item) => item.param + item.value).join(' ');
    suggestions.push({
      name: suggestionText,
      data: suggestionText,
    });
  }

  return suggestions;
}
