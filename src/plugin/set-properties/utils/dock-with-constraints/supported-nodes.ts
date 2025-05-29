import { figjamNodes, FigjamNodes } from '../figjam-nodes';
import { sceneNode } from '../scene-node';

type UnsupportedNodes =
  | SliceNode
  | GroupNode
  | BooleanOperationNode
  | SectionNode
  | TableNode
  | TransformGroupNode
  | SlideRowNode
  | SlideGridNode
  | InteractiveSlideElementNode
  | FigjamNodes;

const unsupportedNodes: NodeType[] = [
  'SLICE',
  'GROUP',
  'BOOLEAN_OPERATION',
  'SECTION',
  'TABLE',
  'TRANSFORM_GROUP',
  'SLIDE_ROW',
  'SLIDE_GRID',
  'INTERACTIVE_SLIDE_ELEMENT',
  ...figjamNodes,
];

export type SupportedNodes = Exclude<SceneNode, UnsupportedNodes>;

export const supportedNodes = sceneNode.filter((nodeType) => !unsupportedNodes.includes(nodeType));
