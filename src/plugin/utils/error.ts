import { ErrorType } from './errorType';

interface notifyErrorProps {
  type: ErrorType;
  message: string;
}

export default function notifyError({ type, message }: notifyErrorProps) {
  console.error(`${type}: ${message}`);
  throw new Error(`${type}: ${message}`);
}
