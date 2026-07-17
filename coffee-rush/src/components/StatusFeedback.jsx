import { useEffect, useRef } from 'react';
import {
  DEFAULT_TOAST_DURATION_MS,
  getUniqueStatusMessages,
} from '../utils/statusFeedback';

export function StatusAlert({ messages = [] }) {
  const uniqueMessages = getUniqueStatusMessages(messages);
  if (uniqueMessages.length === 0) return null;

  return (
    <div className="error-banner status-alert" role="alert">
      {uniqueMessages.map((message) => (
        <span className="status-alert-message" key={message}>
          {message}
        </span>
      ))}
    </div>
  );
}

export function StatusToast({
  message = '',
  duration = DEFAULT_TOAST_DURATION_MS,
  onDismiss,
}) {
  const onDismissRef = useRef(onDismiss);

  useEffect(() => {
    onDismissRef.current = onDismiss;
  }, [onDismiss]);

  useEffect(() => {
    if (!message) return undefined;

    const timeoutId = window.setTimeout(() => {
      onDismissRef.current?.();
    }, duration);

    return () => window.clearTimeout(timeoutId);
  }, [duration, message]);

  if (!message) return null;

  return (
    <div className="status-toast" role="status" aria-live="polite">
      {message}
    </div>
  );
}
