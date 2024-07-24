export default function getCount(nested: boolean) {
  let count = 0;
  const selection = figma.currentPage.selection;

  if (selection != null && selection != undefined) {
    if (!nested) {
      count = selection.length;
      figma.notify(`Count: ${count} top-level elements`);
    } else {
      count = countNested(selection);
      figma.notify(`Count: ${count} nested elements`);
    }
  }
}

// Helper function to recursively count all nested elements
function countNested(nodes: readonly SceneNode[]): number {
  let count = 0;
  for (const node of nodes) {
    count++;
    if ("children" in node) {
      count += countNested(node.children);
    }
  }
  return count;
}