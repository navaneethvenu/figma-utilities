import { figjamNodes, FigjamNodes } from '../set-constraints/figjam-nodes';
import { sceneNode } from '../set-constraints/scene-node';

type UnsupportedNodes = SliceNode | BooleanOperationNode | SectionNode | FigjamNodes;

const unsupportedNodes: NodeType[] = ['SLICE', 'BOOLEAN_OPERATION', 'SECTION', ...figjamNodes];

export type SupportedNodes = Exclude<SceneNode, UnsupportedNodes>;

export const supportedNodes = sceneNode.filter((nodeType) => !unsupportedNodes.includes(nodeType));
