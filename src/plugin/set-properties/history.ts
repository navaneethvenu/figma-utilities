import { ParsedParameter } from './parse-params';

export async function addHistory(parsedParams: ParsedParameter[]) {
  try {
    // Read the existing history
    let history: ParsedParameter[][] = await getHistory();

    // Add new parsedParams to the history
    history.unshift(parsedParams);

    //Remove Duplicates
    history = history.filter(
      (item1, index, array) => array.findIndex((item2) => JSON.stringify(item1) === JSON.stringify(item2)) === index
    );

    // Keep only top 8 history entries
    history = history.slice(0, 8);

    // Save the updated history back to client storage
    await figma.clientStorage.setAsync('figmautilshistory', history);
    console.log('History successfully updated');
  } catch (error) {
    console.error('Error adding history:', error);
  }
}

export async function getHistory(): Promise<ParsedParameter[][]> {
  try {
    // Retrieve the history from client storage
    let history: ParsedParameter[][] | null = await figma.clientStorage.getAsync('figmautilshistory');

    // If history is null or undefined, initialize it as an empty array
    if (history === null || history === undefined) {
      history = [];
    }

    history = history.filter(
      (item1, index, array) => array.findIndex((item2) => JSON.stringify(item1) === JSON.stringify(item2)) === index
    );

    return history;
  } catch (error) {
    console.error('Error getting history:', error);
    return [];
  }
}
