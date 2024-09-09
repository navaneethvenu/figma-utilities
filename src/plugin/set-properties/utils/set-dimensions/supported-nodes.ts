import { figjamNodes, FigjamNodes } from '../figjam-nodes';
import { sceneNode } from '../scene-node';

type UnsupportedNodes = SliceNode | BooleanOperationNode | SectionNode | FigjamNodes;

const unsupportedNodes: NodeType[] = ['SLICE', 'BOOLEAN_OPERATION', 'SECTION', ...figjamNodes];

export type SupportedNodes = Exclude<SceneNode, UnsupportedNodes>;

export const supportedNodes = sceneNode.filter((nodeType) => !unsupportedNodes.includes(nodeType));
