import * as React from "react"
import { cn } from "@/lib/utils"

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, children, className }) => {
  const [position, setPosition] = React.useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = React.useState(false);
  const [dragStart, setDragStart] = React.useState({ x: 0, y: 0 });
  const modalRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (isOpen && modalRef.current) {
      setPosition({
        x: window.innerWidth / 2 - modalRef.current.offsetWidth / 2,
        y: window.innerHeight / 2 - modalRef.current.offsetHeight / 2
      });
    }
  }, [isOpen]);

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      setIsDragging(true);
      setDragStart({
        x: e.clientX - position.x,
        y: e.clientY - position.y
      });
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isDragging) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  if (!isOpen) return null;

  return (
    <>
      <div 
        className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50"
        onClick={onClose}
      />
      
      <div className="fixed inset-0 z-50 pointer-events-none overflow-hidden">
        <div 
          ref={modalRef}
          className={cn(
            "absolute bg-white rounded-xl shadow-2xl pointer-events-auto",
            "w-full max-w-lg border border-gray-100",
            isDragging ? "cursor-grabbing" : "cursor-default",
            className
          )}
          style={{
            transform: `translate(${position.x}px, ${position.y}px)`,
            maxHeight: '90vh',
            overflow: 'auto'
          }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onClick={(e) => e.stopPropagation()}
        >
          <div 
            className="flex items-center justify-center h-8 bg-gray-50 border-b border-gray-100 cursor-grab hover:bg-gray-100 transition-colors" 
            onMouseDown={handleMouseDown}
          >
            <div className="flex gap-1">
              <div className="w-1 h-1 rounded-full bg-gray-300" />
              <div className="w-1 h-1 rounded-full bg-gray-300" />
              <div className="w-1 h-1 rounded-full bg-gray-300" />
            </div>
          </div>
          <div className="p-6">
            {children}
          </div>
        </div>
      </div>
    </>
  );
};

export default Modal; 