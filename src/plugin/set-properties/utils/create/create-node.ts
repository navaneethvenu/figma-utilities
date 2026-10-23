const DEFAULT_SPACING = 48;

type CreateMethod =
  | 'createRectangle'
  | 'createLine'
  | 'createEllipse'
  | 'createPolygon'
  | 'createStar'
  | 'createVector'
  | 'createText'
  | 'createFrame'
  | 'createSection'
  | 'createSticky'
  | 'createConnector'
  | 'createShapeWithText'
  | 'createCodeBlock'
  | 'createTable'
  | 'createSlide'
  | 'createSlideRow'
  | 'createPage'
  | 'createPageDivider';

function asNodeWithPosition(node: BaseNode) {
  if (!('x' in node) || !('y' in node)) return null;
  return node as BaseNode & { x: number; y: number };
}

function asSceneNode(node: BaseNode): SceneNode | null {
  if ('parent' in node && 'removed' in node) return node as SceneNode;
  return null;
}

type ParentContainer = BaseNode & ChildrenMixin;

function asParentContainer(node: SceneNode): ParentContainer | null {
  if ('appendChild' in node && 'children' in node) return node as ParentContainer;
  return null;
}

function getTargetParent(selection: readonly SceneNode[]): ParentContainer | null {
  for (let i = selection.length - 1; i >= 0; i--) {
    const candidate = asParentContainer(selection[i]);
    if (!candidate) continue;
    if (candidate.type === 'INSTANCE') continue;
    return candidate;
  }

  return null;
}

function centerNodeOnViewport(node: BaseNode, index: number) {
  const positionNode = asNodeWithPosition(node);
  if (!positionNode) return;

  const { x, y } = figma.viewport.center;
  const width = 'width' in node ? Number((node as any).width) || 0 : 0;
  const height = 'height' in node ? Number((node as any).height) || 0 : 0;
  const offset = index * DEFAULT_SPACING;

  positionNode.x = x - width / 2 + offset;
  positionNode.y = y - height / 2 + offset;
}

function centerNodeInParent(node: SceneNode, parent: ParentContainer, index: number) {
  if (!('x' in node) || !('y' in node)) return;
  if (!('width' in parent) || !('height' in parent)) return;

  const nodeWidth = 'width' in node ? Number((node as any).width) || 0 : 0;
  const nodeHeight = 'height' in node ? Number((node as any).height) || 0 : 0;
  const offset = index * DEFAULT_SPACING;
  const parentWidth = Number((parent as any).width) || 0;
  const parentHeight = Number((parent as any).height) || 0;

  (node as any).x = parentWidth / 2 - nodeWidth / 2 + offset;
  (node as any).y = parentHeight / 2 - nodeHeight / 2 + offset;
}

function createPageFromMethod(method: 'createPage' | 'createPageDivider') {
  const creator = (figma as any)[method];
  if (typeof creator !== 'function') throw new Error(`${method} is not available in this editor.`);

  const page = creator.call(figma) as PageNode;
  figma.currentPage = page;
  return [];
}

export function createByMethod(method: CreateMethod, count = 1): SceneNode[] {
  if (method === 'createPage' || method === 'createPageDivider') {
    createPageFromMethod(method);
    return [];
  }

  const selectionBeforeCreate = figma.currentPage.selection ?? [];
  const targetParent = getTargetParent(selectionBeforeCreate);
  const creator = (figma as any)[method];
  if (typeof creator !== 'function') throw new Error(`${method} is not available in this editor.`);

  const safeCount = Math.max(1, Math.floor(count));
  const createdNodes: SceneNode[] = [];

  for (let i = 0; i < safeCount; i++) {
    let created: BaseNode;

    if (method === 'createTable') {
      created = creator.call(figma, 2, 2);
    } else if (method === 'createSlide') {
      created = creator.call(figma);
    } else if (method === 'createSlideRow') {
      created = creator.call(figma);
    } else {
      created = creator.call(figma);
    }

    const sceneNode = asSceneNode(created);
    if (!sceneNode) continue;

    if (targetParent && sceneNode.parent !== targetParent) {
      targetParent.appendChild(sceneNode);
      centerNodeInParent(sceneNode, targetParent, i);
    } else {
      centerNodeOnViewport(sceneNode, i);
    }

    createdNodes.push(sceneNode);
  }

  if (createdNodes.length > 0) {
    figma.currentPage.selection = createdNodes;
    figma.viewport.scrollAndZoomIntoView(createdNodes);
  }

  return createdNodes;
}
