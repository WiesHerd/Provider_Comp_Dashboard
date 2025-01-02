import React, { useState } from 'react';
import { Transition } from '@headlessui/react';

interface TooltipProps {
  content: React.ReactNode;
  children: React.ReactElement;
}


export const Tooltip: React.FC<TooltipProps> = ({ content, children }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });

  const handleMouseEnter = (e: React.MouseEvent) => {
    const rect = (e.target as HTMLElement).getBoundingClientRect();
    setPosition({
      x: rect.left + window.scrollX,
      y: rect.bottom + window.scrollY
    });
    setIsVisible(true);
  };

  return (
    <div className="relative inline-block">
      {React.cloneElement(children, {
        onMouseEnter: handleMouseEnter,
        onMouseLeave: () => setIsVisible(false),
      })}
      <Transition
        show={isVisible}
        enter="transition ease-out duration-200"
        enterFrom="opacity-0 translate-y-1"
        enterTo="opacity-100 translate-y-0"
        leave="transition ease-in duration-150"
        leaveFrom="opacity-100 translate-y-0"
        leaveTo="opacity-0 translate-y-1"
        className="absolute z-50 px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg shadow-lg -mt-1 transform -translate-x-1/2 left-1/2"
      >
        {content}
      </Transition>
    </div>
  );
}; 