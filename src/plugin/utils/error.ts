import { ErrorType } from './errorType';

interface notifyErrorProps {
  type: ErrorType;
  message: string;
}

export default function notifyError({ type, message }: notifyErrorProps) {
  throw new Error(`${type}: ${message}`);
}
