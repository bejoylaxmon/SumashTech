import React from 'react';

interface ButtonsMessageProps {
  data: {
    options: string[];
  };
  onOptionClick?: (option: string) => void;
}

export default function ButtonsMessage({ data, onOptionClick }: ButtonsMessageProps) {
  return (
    <div className="flex flex-col gap-2 mt-2">
      {data.options.map((option, index) => (
        <button
          key={index}
          className="text-sm bg-white border border-blue-200 text-blue-600 hover:bg-blue-50 py-2 px-3 rounded-lg transition-colors text-left"
          onClick={() => onOptionClick && onOptionClick(option)}
        >
          {option}
        </button>
      ))}
    </div>
  );
}
