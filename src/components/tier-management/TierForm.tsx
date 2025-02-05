'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';

const tierSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  wrvuThreshold: z.number().min(0, 'Threshold must be a positive number'),
  conversionFactor: z.number().min(0, 'Conversion factor must be a positive number'),
});

type TierFormData = z.infer<typeof tierSchema>;

interface TierFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: TierFormData) => Promise<void>;
  initialData?: TierFormData;
  title: string;
}

export function TierForm({ open, onClose, onSubmit, initialData, title }: TierFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<TierFormData>({
    resolver: zodResolver(tierSchema),
    defaultValues: {
      name: '',
      wrvuThreshold: 0,
      conversionFactor: 0,
    },
  });

  useEffect(() => {
    if (initialData) {
      form.reset(initialData);
    } else {
      form.reset({
        name: '',
        wrvuThreshold: 0,
        conversionFactor: 0,
      });
    }
  }, [initialData, form, open]);

  const handleSubmit = async (data: TierFormData) => {
    try {
      setIsSubmitting(true);
      await onSubmit(data);
      form.reset();
      onClose();
    } catch (error) {
      console.error('Error submitting tier:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold text-gray-900">{title}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium text-gray-700">Name</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Enter tier name" 
                      className="h-9"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="wrvuThreshold"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium text-gray-700">wRVU Threshold</FormLabel>
                  <FormControl>
                    <Input 
                      type="number"
                      step="1"
                      min="0"
                      placeholder="Enter threshold"
                      className="h-9"
                      {...field}
                      value={field.value}
                      onChange={(e) => {
                        const value = e.target.value === '' ? 0 : Number(e.target.value);
                        field.onChange(value);
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="conversionFactor"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium text-gray-700">Conversion Factor</FormLabel>
                  <FormControl>
                    <Input 
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="Enter conversion factor"
                      className="h-9"
                      {...field}
                      value={field.value}
                      onChange={(e) => {
                        const value = e.target.value === '' ? 0 : Number(e.target.value);
                        field.onChange(value);
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="h-9 px-4 bg-white"
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="h-9 px-4 bg-[#4F46E5] hover:bg-[#4338CA] text-white"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Saving...' : 'Save'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
} 