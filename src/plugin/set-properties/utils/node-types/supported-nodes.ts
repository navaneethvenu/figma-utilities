import { figjamNodes, FigjamNodes } from './figjam-nodes';
import { sceneNode } from './scene-node';

type UnsupportedNodes = SliceNode | GroupNode | BooleanOperationNode | SectionNode | FigjamNodes;

const unsupportedNodes: NodeType[] = ['SLICE', 'GROUP', 'BOOLEAN_OPERATION', 'SECTION', ...figjamNodes];

export type SupportedNodes = Exclude<SceneNode, UnsupportedNodes>;

export const supportedNodes = sceneNode.filter((nodeType) => !unsupportedNodes.includes(nodeType));
