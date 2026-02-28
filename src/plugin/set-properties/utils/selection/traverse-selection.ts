import notifyError from '../../../utils/error';
import { ErrorType } from '../../../utils/errorType';

interface TraverseSelectionProps {
  param: string;
  nodes: readonly SceneNode[];
}

function isContainer(node: SceneNode): node is SceneNode & ChildrenMixin {
  return 'children' in node;
}

function dedupeStable(nodes: SceneNode[]): SceneNode[] {
  const seen = new Set<string>();
  const ordered: SceneNode[] = [];

  for (const node of nodes) {
    if (seen.has(node.id)) continue;
    seen.add(node.id);
    ordered.push(node);
  }

  return ordered;
}

function selectRootStrict(nodes: readonly SceneNode[]): SceneNode[] {
  const result: SceneNode[] = [];

  for (const node of nodes) {
    let cursor = node.parent;
    if (!cursor || cursor === figma.currentPage) continue;

    while (cursor.parent && cursor.parent !== figma.currentPage) {
      cursor = cursor.parent;
    }

    if ('id' in cursor) {
      result.push(cursor as SceneNode);
    }
  }

  return dedupeStable(result);
}

function collectLeafDescendants(node: SceneNode, sink: SceneNode[]) {
  if (!isContainer(node)) return;

  for (const child of node.children) {
    if (isContainer(child) && child.children.length > 0) {
      collectLeafDescendants(child, sink);
    } else {
      sink.push(child);
    }
  }
}

function selectLeafStrict(nodes: readonly SceneNode[]): SceneNode[] {
  const result: SceneNode[] = [];

  for (const node of nodes) {
    collectLeafDescendants(node, result);
  }

  return dedupeStable(result);
}

function selectDirectParents(nodes: readonly SceneNode[]): SceneNode[] {
  const result: SceneNode[] = [];

  for (const node of nodes) {
    const parent = node.parent;
    if (!parent || parent === figma.currentPage) continue;
    if ('id' in parent) result.push(parent as SceneNode);
  }

  return dedupeStable(result);
}

function selectDirectChildren(nodes: readonly SceneNode[]): SceneNode[] {
  const result: SceneNode[] = [];

  for (const node of nodes) {
    if (!isContainer(node)) continue;
    for (const child of node.children) result.push(child);
  }

  return dedupeStable(result);
}

function getSelectionByParent(nodes: readonly SceneNode[]) {
  const byParent = new Map<string, { parent: BaseNode & ChildrenMixin; first: SceneNode; count: number }>();

  for (const node of nodes) {
    const parent = node.parent;
    if (!parent || !('children' in parent)) continue;
    const nodeIndex = parent.children.indexOf(node);
    if (nodeIndex < 0) continue;

    if (!byParent.has(parent.id)) {
      byParent.set(parent.id, { parent, first: node, count: 1 });
    } else {
      const current = byParent.get(parent.id)!;
      current.count += 1;

      const currentFirstIndex = parent.children.indexOf(current.first);
      if (currentFirstIndex < 0 || nodeIndex < currentFirstIndex) {
        current.first = node;
      }
    }
  }

  return byParent;
}

function selectNextSiblings(nodes: readonly SceneNode[]): SceneNode[] {
  const result: SceneNode[] = [];
  const byParent = getSelectionByParent(nodes);

  for (const { parent, first, count } of byParent.values()) {
    // First run from a multi-selection per parent collapses to the anchor itself.
    if (count > 1) {
      result.push(first);
      continue;
    }

    const index = parent.children.indexOf(first);
    if (index < 0 || parent.children.length === 0) continue;
    const nextIndex = (index + 1) % parent.children.length;
    result.push(parent.children[nextIndex]);
  }

  return dedupeStable(result);
}

function selectPrevSiblings(nodes: readonly SceneNode[]): SceneNode[] {
  const result: SceneNode[] = [];
  const byParent = getSelectionByParent(nodes);

  for (const { parent, first, count } of byParent.values()) {
    // First run from a multi-selection per parent collapses to the anchor itself.
    if (count > 1) {
      result.push(first);
      continue;
    }

    const index = parent.children.indexOf(first);
    if (index < 0 || parent.children.length === 0) continue;
    const prevIndex = (index - 1 + parent.children.length) % parent.children.length;
    result.push(parent.children[prevIndex]);
  }

  return dedupeStable(result);
}

function selectInverseWithinParent(nodes: readonly SceneNode[]): SceneNode[] {
  const result: SceneNode[] = [];
  const selectedByParent = new Map<string, Set<string>>();
  const parentById = new Map<string, BaseNode & ChildrenMixin>();

  for (const node of nodes) {
    const parent = node.parent;
    if (!parent || !('children' in parent)) continue;

    const parentId = parent.id;
    if (!selectedByParent.has(parentId)) {
      selectedByParent.set(parentId, new Set<string>());
      parentById.set(parentId, parent);
    }
    selectedByParent.get(parentId)!.add(node.id);
  }

  for (const [parentId, selectedIds] of selectedByParent) {
    const parent = parentById.get(parentId);
    if (!parent) continue;

    for (const child of parent.children) {
      if (!selectedIds.has(child.id)) result.push(child);
    }
  }

  return dedupeStable(result);
}

export default function traverseSelection({ param, nodes }: TraverseSelectionProps) {
  let selection: SceneNode[] = [];

  switch (param) {
    case 'root':
      selection = selectRootStrict(nodes);
      break;
    case 'leaf':
      selection = selectLeafStrict(nodes);
      break;
    case 'selp':
      selection = selectDirectParents(nodes);
      break;
    case 'selc':
      selection = selectDirectChildren(nodes);
      break;
    case 'selns':
      selection = selectNextSiblings(nodes);
      break;
    case 'selps':
      selection = selectPrevSiblings(nodes);
      break;
    case 'seli':
      selection = selectInverseWithinParent(nodes);
      break;
    default:
      notifyError({
        type: ErrorType.INVALID_CMD,
        message: param,
      });
      return;
  }

  figma.currentPage.selection = selection;

  if (selection.length === 0) {
    figma.notify(`No results for "${param}". Selection cleared.`);
  }
}
