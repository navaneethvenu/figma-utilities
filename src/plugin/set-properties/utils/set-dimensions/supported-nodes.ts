import { figjamNodes, FigjamNodes } from '../figjam-nodes';
import { sceneNode } from '../scene-node';

type UnsupportedNodes =
  | SliceNode
  | TableNode
  | SlideRowNode
  | SlideGridNode
  | BooleanOperationNode
  | SectionNode
  | InteractiveSlideElementNode
  | FigjamNodes;

const unsupportedNodes: NodeType[] = [
  'SLICE',
  'TABLE',
  'SLIDE_ROW',
  'SLIDE_GRID',
  'BOOLEAN_OPERATION',
  'SECTION',
  'INTERACTIVE_SLIDE_ELEMENT',
  ...figjamNodes,
];

export type SupportedNodes = Exclude<SceneNode, UnsupportedNodes>;

export const supportedNodes = sceneNode.filter((nodeType) => !unsupportedNodes.includes(nodeType));
