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

const DualRangeSlider = React.forwardRef<
  React.ElementRef<typeof SliderPrimitive.Root>,
  DualRangeSliderProps
>(({ className, min = 0, max = 100, step = 1, value = [min, max], onValueChange, ...props }, ref) => (
  <SliderPrimitive.Root
    ref={ref}
    className={cn(
      "relative flex w-full touch-none select-none items-center",
      className
    )}
    min={min}
    max={max}
    step={step}
    value={value}
    onValueChange={onValueChange}
    defaultValue={[min, max]}
    {...props}
  >
    <SliderPrimitive.Track className="relative h-2 w-full grow overflow-hidden rounded-full bg-secondary">
      <SliderPrimitive.Range className="absolute h-full bg-primary" />
    </SliderPrimitive.Track>
    <SliderPrimitive.Thumb 
      className="absolute block h-5 w-5 rounded-full border-2 border-primary bg-background shadow-md ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:cursor-grab active:cursor-grabbing" 
    />
    <SliderPrimitive.Thumb 
      className="absolute block h-5 w-5 rounded-full border-2 border-primary bg-background shadow-md ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:cursor-grab active:cursor-grabbing" 
    />
  </SliderPrimitive.Root>
))
DualRangeSlider.displayName = "DualRangeSlider"

export { DualRangeSlider } 