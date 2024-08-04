import { ParsedParameter } from './parse-params';

export async function addHistory(parsedParams: ParsedParameter[]) {
  console.log('adding history');
  try {
    // Read the existing history
    let history: ParsedParameter[][] = await getHistory();
    console.log('Current history before update:', history);

    // Add new parsedParams to the history
    history.unshift(parsedParams);
    console.log('Updated history to be saved:', history);

    //Remove Duplicates
    history = history.filter(
      (item1, index, array) => array.findIndex((item2) => JSON.stringify(item1) === JSON.stringify(item2)) === index
    );

    //keep only top 8 history
    history = history.splice(0, 7);

    // Save the updated history back to client storage
    await figma.clientStorage.setAsync('figmautilshistory', history);
    console.log('History successfully updated');
  } catch (error) {
    console.error('Error adding history:', error);
  }
  console.log('addingend history');
}

export async function getHistory(): Promise<ParsedParameter[][]> {
  console.log('getting history');
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

    console.log('history:', history);
    return history;
  } catch (error) {
    console.error('Error getting history:', error);
    return [];
  }
}
