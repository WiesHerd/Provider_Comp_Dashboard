'use client';

import * as React from "react"
import * as SliderPrimitive from "@radix-ui/react-slider"
import { cn } from "@/lib/utils"

interface DualRangeSliderProps extends React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root> {
  min?: number
  max?: number
  step?: number
  value: [number, number]
  onValueChange: (value: [number, number]) => void
}

function debounce<T extends (...args: any[]) => void>(func: T, wait: number) {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

const DualRangeSlider = React.forwardRef<
  React.ElementRef<typeof SliderPrimitive.Root>,
  DualRangeSliderProps
>(({ className, min = 0, max = 100, step = 1, value = [min, max], onValueChange, ...props }, ref) => {
  const [localValue, setLocalValue] = React.useState(value);

  const debouncedOnChange = React.useMemo(
    () => debounce((newValue: [number, number]) => {
      onValueChange(newValue);
    }, 16),
    [onValueChange]
  );

  const handleValueChange = React.useCallback((newValue: number[]) => {
    const typedValue = newValue as [number, number];
    setLocalValue(typedValue);
    debouncedOnChange(typedValue);
  }, [debouncedOnChange]);

  React.useEffect(() => {
    setLocalValue(value);
  }, [value]);

  return (
    <SliderPrimitive.Root
      ref={ref}
      className={cn(
        "relative flex w-full touch-none select-none items-center",
        className
      )}
      min={min}
      max={max}
      step={step}
      value={localValue}
      onValueChange={handleValueChange}
      defaultValue={[min, max]}
      {...props}
    >
      <SliderPrimitive.Track className="relative h-[2px] w-full grow rounded-full bg-gray-200">
        <SliderPrimitive.Range className="absolute h-full bg-blue-600" />
      </SliderPrimitive.Track>
      <SliderPrimitive.Thumb 
        className="absolute block h-3 w-3 -translate-x-1/2 -translate-y-1/2 top-1/2 rounded-full border border-blue-600 bg-white ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:cursor-grab active:cursor-grabbing" 
      />
      <SliderPrimitive.Thumb 
        className="absolute block h-3 w-3 -translate-x-1/2 -translate-y-1/2 top-1/2 rounded-full border border-blue-600 bg-white ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:cursor-grab active:cursor-grabbing" 
      />
    </SliderPrimitive.Root>
  )
})
DualRangeSlider.displayName = "DualRangeSlider"

export { DualRangeSlider } 