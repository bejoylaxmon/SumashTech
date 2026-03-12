import React from 'react';
import { ComponentMessage } from './types';
import { componentRegistry } from './MessageComponents';

interface MessageRendererProps {
  message: ComponentMessage;
  onAction?: (action: string, payload?: any) => void;
}

export default function MessageRenderer({ message, onAction }: MessageRendererProps) {
  const Component = componentRegistry[message.type];

  if (!Component) {
    // Fallback for unknown message types
    return (
      <div className="text-xs p-2 bg-red-50 text-red-500 rounded border border-red-100 italic">
        Unsupported message type: {message.type}
      </div>
    );
  }

  // Pass down the onOptionClick hook specifically for buttons or actionable components if needed
  return <Component data={message.data} onOptionClick={(option: string) => onAction && onAction('button_click', option)} />;
}