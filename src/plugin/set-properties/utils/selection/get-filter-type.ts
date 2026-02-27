export function getFilterType(type: string): NodeType | undefined {
  let filterType: NodeType;
  switch (type) {
    //containers
    case 'f':
      filterType = 'FRAME';
      break;
    case 'g':
      filterType = 'GROUP';
      break;
    case 't':
      filterType = 'TEXT';
      break;
    case 'c':
      filterType = 'COMPONENT';
      break;
    case 'cs':
      filterType = 'COMPONENT_SET';
      break;
    case 'i':
      filterType = 'INSTANCE';
      break;

    //items
    case 'l':
      filterType = 'LINE';
      break;
    case 'v':
      filterType = 'VECTOR';
      break;
    case 'e':
      filterType = 'ELLIPSE';
      break;
    case 'p':
      filterType = 'POLYGON';
      break;
    case 'r':
      filterType = 'RECTANGLE';
      break;
    case 'b':
      filterType = 'BOOLEAN_OPERATION';
      break;
  }

  return filterType;
}
