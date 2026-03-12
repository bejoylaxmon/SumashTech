import React from 'react';

interface TextMessageProps {
  data: {
    message: string;
  };
}

export default function TextMessage({ data }: TextMessageProps) {
  return (
    <div className="text-sm">
      {data.message}
    </div>
  );
}