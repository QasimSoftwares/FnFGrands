'use client'

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { useAuth } from "@/contexts/auth-context";
import { useGrants } from '@/contexts/grant-context';
import { Loader2, Save, Trash2 } from 'lucide-react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
// Using native date input instead of Calendar/Popover to avoid additional dependencies
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { Grant } from '@/types';

// Define grant types and categories as const tuples
const GRANT_TYPES = ['New', 'Renewal', 'Extension'] as const;
const GRANT_CATEGORIES = ['Education', 'Health Care', 'Food Security', 'Disaster Management'] as const;

// Define status values that match the GrantStatus type from the database
export const GRANT_STATUS_VALUES = [
  'Draft',
  'Review',
  'Approved',
  'Rejected'
] as const;

type GrantType = typeof GRANT_TYPES[number];
type GrantCategory = typeof GRANT_CATEGORIES[number];
type GrantStatus = typeof GRANT_STATUS_VALUES[number];

// Use the status values in the component
const GRANT_STATUSES: readonly GrantStatus[] = GRANT_STATUS_VALUES;

// Form validation schema
const grantFormSchema = z.object({
  // Required fields
  name: z.string().min(1, 'Grant name is required'),
  donor: z.string().min(1, 'Donor/Organization is required'),
  type: z.string().min(1, 'Type is required'),
  category: z.string().min(1, 'Category is required'),
  amount: z.union([
    z.number().positive('Amount must be a positive number'),
    z.string()
      .transform((val) => parseFloat(val))
      .refine((val) => !isNaN(val), { message: 'Must be a valid number' })
      .refine((val) => val > 0, { message: 'Amount must be positive' })
  ]).transform(val => Number(val)),
  status: z.string().min(1, 'Status is required'),
  applied_date: z.date({ message: 'Applied date is required' }),
  deadline: z.date({ message: 'Deadline is required' }),
  last_follow_up: z.date({ message: 'Last follow-up date is required' }),
  next_follow_up: z.date({ message: 'Next follow-up date is required' }),
  responsible_person: z.string().min(1, 'Responsible person is required'),
  
  // Optional fields
  amount_awarded: z.union([
    z.number().min(0, 'Amount must be a non-negative number'),
    z.string()
      .transform((val) => val === '' ? null : parseFloat(val))
      .pipe(
        z.number()
          .min(0, 'Amount must be a non-negative number')
          .nullable()
      ),
    z.null(),
    z.undefined()
  ]).optional().transform(val => val === null ? undefined : val),
  attachment_count: z.number().int().min(0, 'Must be a non-negative number').optional(),
  outcome_summary: z.string().optional(),
  progress_notes: z.string().optional(),
  // Removed 'notes' field as it doesn't exist in the database
  updated_by: z.string().optional(),
  deleted_at: z.string().optional(),
});

type FormData = z.infer<typeof grantFormSchema>;

interface GrantEntryFormProps {
  grant?: Grant;
  onSuccess?: () => void;
  onCancel?: () => void;
  isEditing?: boolean;
}

export const GrantEntryForm = ({ grant, onSuccess, onCancel }: GrantEntryFormProps) => {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEditing = !!grant;

  // Initialize form with react-hook-form
  const {
    register,
    handleSubmit,
    formState: { errors },
    control,
    setValue,
    reset,
  } = useForm<FormData>({
    resolver: zodResolver(grantFormSchema) as any,
    defaultValues: {
      name: grant?.name ?? '',
      donor: grant?.donor ?? '',
      type: (grant?.type as GrantType) ?? 'New',
      category: (grant?.category as GrantCategory) ?? 'Education',
      amount: grant?.amount ?? '',
      amount_awarded: grant?.amount_awarded ?? '',
      status: (grant?.status as GrantStatus) ?? 'Draft',
      applied_date: grant?.applied_date ? new Date(grant.applied_date) : '',
      deadline: grant?.deadline ? new Date(grant.deadline) : '',
      last_follow_up: grant?.last_follow_up ? new Date(grant.last_follow_up) : '',
      next_follow_up: grant?.next_follow_up ? new Date(grant.next_follow_up) : '',
      attachment_count: grant?.attachment_count ?? '',
      outcome_summary: grant?.outcome_summary || '',
      responsible_person: grant?.responsible_person || '',
      progress_notes: grant?.progress_notes || '',
      notes: grant?.notes || '',
    },
  });

  const { addGrant, updateGrant } = useGrants();
  const { user } = useAuth();

  // Helper function to convert form data to Grant type
  const formDataToGrant = (data: FormData, userId: string): Omit<Grant, 'id' | 'created_at' | 'updated_at'> => {
    if (!user) {
      throw new Error('User must be authenticated to create or update grants');
    }

    // Skip organization check for admin users
    const organizationId = user.organization_id || 'default-org';
    
    if (!organizationId && user.role !== 'admin') {
      throw new Error('User is not associated with an organization. Please contact your administrator.');
    }

    return {
      name: data.name,
      donor: data.donor,
      type: data.type as GrantType,
      category: data.category as GrantCategory,
      amount: data.amount,
      amount_awarded: data.amount_awarded || null,
      status: data.status as GrantStatus,
      applied_date: data.applied_date.toISOString(),
      deadline: data.deadline.toISOString(),
      last_follow_up: data.last_follow_up?.toISOString() || null,
      next_follow_up: data.next_follow_up?.toISOString() || null,
      attachment_count: data.attachment_count || 0,
      outcome_summary: data.outcome_summary || '',
      responsible_person: data.responsible_person || '',
      progress_notes: data.progress_notes || '',
      notes: data.notes || '',
      user_id: userId,
      organization_id: organizationId,
      created_by: userId,
      updated_by: userId,
    };
  };

  // Handle form submission with proper type assertion
  const onSubmit = async (data: unknown) => {
    if (!user) {
      toast.error('You must be logged in to create or update grants');
      router.push('/login');
      return;
    }

    try {
      // Validate the data matches our schema
      const validatedData = grantFormSchema.parse(data);
      setIsSubmitting(true);
      
      console.log('Form submitted:', validatedData);
      
      if (isEditing && grant?.id) {
        // Update existing grant
        const updates = formDataToGrant(validatedData, user.id);
        await updateGrant(grant.id, updates);
        toast.success('Grant updated successfully');
      } else {
        // Create new grant
        const newGrant = formDataToGrant(validatedData, user.id);
        await addGrant(newGrant);
        toast.success('Grant created successfully');
      }
      
      // Reset form after successful submission
      reset();
      
      // If onSuccess callback is provided, call it, otherwise redirect
      if (onSuccess) {
        onSuccess();
      } else {
        router.push('/grants');
        // Force a reload to ensure fresh data
        router.refresh();
      }
    } catch (error) {
      console.error('Error saving grant:', error);
      toast.error(
        error instanceof Error 
          ? `Error: ${error.message}`
          : 'There was an error saving the grant. Please try again.'
      );
      // Re-throw the error to be caught by react-hook-form
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Handle form submission with proper typing
  const handleFormSubmit = handleSubmit(onSubmit);
  
  // Handle cancel
  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    } else {
      router.push('/grants');
    }
  };

  const handleClearForm = () => {
    reset();
  };

  return (
    <div className="flex justify-center w-full px-4 py-6">
      <Card className="w-full max-w-4xl border-gray-300 relative">
        <CardHeader className="px-8 pt-8 pb-6">
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-2xl font-bold">Family and Fellows Foundation</CardTitle>
              <CardDescription>Grant Tracker</CardDescription>
              <div className="text-sm text-muted-foreground">
                {isEditing ? 'Edit Grant Application' : 'New Grant Application'}
              </div>
            </div>
            <div className="absolute right-8 top-8 w-24">
              <img 
                src="/images/logo.png" 
                alt="Logo" 
                className="w-full h-auto"
                onLoad={() => console.log('Logo loaded successfully')}
                onError={(e) => {
                  console.error('Failed to load logo:', e.currentTarget.src);
                }}
              />
            </div>
          </div>
        </CardHeader>
        <div className="px-8 pt-6">
          <div className="bg-[#004aad] text-white p-4 rounded">
            <p className="text-blue-50 text-sm">
              Please fill in all required fields (marked with *) to add a new grant record
            </p>
          </div>
        </div>
        <CardContent className="px-8 pt-0 pb-8">
          <form onSubmit={handleFormSubmit} className="space-y-8 relative" style={{ zIndex: 10 }}>
            {/* Row 1: Grant Name | Donor Name */}
            <div className="grid grid-cols-2 gap-6 mt-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="font-semibold">
                  Grant Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="name"
                  {...register('name')}
                  placeholder="Enter grant name"
                  className={cn('border-gray-300 focus:border-[#004aad] focus:ring-1 focus:ring-[#004aad]', errors.name ? 'border-red-500' : '')}
                />
                {errors.name && (
                  <p className="text-sm text-red-500">{errors.name.message}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="donor" className="font-semibold">
                  Donor/Organization <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="donor"
                  {...register('donor')}
                  placeholder="Enter donor/organization name"
                  className={cn('border-gray-300 focus:border-blue-400 focus:ring-1 focus:ring-blue-300', errors.donor ? 'border-red-500' : '')}
                />
                {errors.donor && (
                  <p className="text-sm text-red-500">{errors.donor.message}</p>
                )}
              </div>
              </div>

              {/* Row 2: Applied Date | Deadline Date */}
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="font-semibold">
                    Applied Date <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    type="date"
                    className={cn('w-full border-gray-300 focus:border-blue-400 focus:ring-1 focus:ring-blue-300', errors.applied_date ? 'border-red-500' : '')}
                    {...register('applied_date', {
                      valueAsDate: true,
                      required: 'Applied date is required'
                    })}
                  />
                  {errors.applied_date && (
                    <p className="text-sm text-red-500">{errors.applied_date.message}</p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label className="font-semibold">
                    Deadline Date <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    type="date"
                    className={cn('w-full border-gray-300 focus:border-blue-400 focus:ring-1 focus:ring-blue-300', errors.deadline ? 'border-red-500' : '')}
                    {...register('deadline', {
                      valueAsDate: true,
                      required: 'Deadline is required'
                    })}
                    required
                  />
                  {errors.deadline && (
                    <p className="text-sm text-red-500">{errors.deadline.message}</p>
                  )}
                </div>
              </div>

              {/* Row 3: Type | Category */}
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-3">
                  <Label htmlFor="type" className="font-semibold">
                    Type <span className="text-red-500">*</span>
                  </Label>
                  <Controller
                    name="type"
                    control={control}
                    render={({ field }) => (
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <SelectTrigger className="border-gray-300 focus:ring-1 focus:ring-blue-300 focus:border-blue-400">
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          {GRANT_TYPES.map((type) => (
                            <SelectItem key={type} value={type}>
                              {type}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {errors.type && (
                    <p className="text-sm text-red-500">{errors.type.message}</p>
                  )}
                </div>
                
                <div className="space-y-3">
                  <Label htmlFor="category" className="font-semibold">
                    Category <span className="text-red-500">*</span>
                  </Label>
                  <Controller
                    name="category"
                    control={control}
                    render={({ field }) => (
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <SelectTrigger className="border-gray-300 focus:ring-1 focus:ring-blue-300 focus:border-blue-400">
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          {GRANT_CATEGORIES.map((category) => (
                            <SelectItem key={category} value={category}>
                              {category}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {errors.category && (
                    <p className="text-sm text-red-500">{errors.category.message}</p>
                  )}
                </div>
              </div>

              {/* Row 4: Amount Requested | Amount Awarded */}
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-3">
                  <Label className="font-semibold">
                    Amount Requested <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    type="number"
                    {...register('amount', {
                      valueAsNumber: true,
                    })}
                    placeholder="$"
                    className={cn('w-full border-gray-300 focus:border-blue-400 focus:ring-1 focus:ring-blue-300', errors.amount ? 'border-red-500' : '')}
                  />
                  {errors.amount && (
                    <p className="text-sm text-red-500">{errors.amount.message}</p>
                  )}
                </div>
                
                <div className="space-y-3">
                  <Label className="font-bold">Amount Awarded</Label>
                  <Input
                    type="number"
                    {...register('amount_awarded', {
                      setValueAs: (value) => value === '' ? undefined : Number(value)
                    })}
                    placeholder="$"
                    min="0"
                    step="0.01"
                    className="w-full border-gray-300 focus:border-blue-400 focus:ring-1 focus:ring-blue-300"
                  />
                </div>
              </div>

              {/* Row 5: Number of Attachments | Status */}
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-3">
                  <Label className="font-semibold">Attachment Count</Label>
                  <Input
                    type="number"
                    {...register('attachment_count', {
                      valueAsNumber: true,
                      min: 0
                    })}
                    className="w-full border-gray-300 focus:border-blue-400 focus:ring-1 focus:ring-blue-300"
                  />
                </div>
                
                <div className="space-y-3">
                  <Label className="font-semibold">
                    Status <span className="text-red-500">*</span>
                  </Label>
                  <Controller
                    name="status"
                    control={control}
                    render={({ field }) => (
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <SelectTrigger className="border-gray-300 focus:ring-1 focus:ring-blue-300 focus:border-blue-400">
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                          {GRANT_STATUSES.map((status) => (
                            <SelectItem key={status} value={status}>
                              {status}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {errors.status && (
                    <p className="text-sm text-red-500">{errors.status.message}</p>
                  )}
                </div>
              </div>

              {/* Row 6: Outcome Summary */}
              <div className="space-y-3">
                <Label className="font-bold">Outcome Summary</Label>
                <Input
                  className="w-full border-gray-300 focus:border-blue-400 focus:ring-1 focus:ring-blue-300"
                  {...register('outcome_summary')}
                  placeholder="Enter outcome summary"
                />
              </div>

              {/* Row 7: Last Follow-up | Next Follow-up */}
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-3">
                  <Label className="font-semibold">
                    Last Follow-up <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    type="date"
                    className="w-full border-gray-300 focus:border-blue-400 focus:ring-1 focus:ring-blue-300"
                    {...register('last_follow_up', {
                      valueAsDate: true,
                    })}
                  />
                </div>
                
                <div className="space-y-3">
                  <Label className="font-semibold">
                    Next Follow-up <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    type="date"
                    className="w-full border-gray-300 focus:border-blue-400 focus:ring-1 focus:ring-blue-300"
                    {...register('next_follow_up', {
                      valueAsDate: true,
                    })}
                  />
                </div>
              </div>

              {/* Row 8: Responsible Person | Progress Notes */}
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="font-semibold">
                    Responsible Person <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    className="w-full border-gray-300 focus:border-blue-400 focus:ring-1 focus:ring-blue-300"
                    {...register('responsible_person')}
                    placeholder="Enter name"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label className="font-bold">Progress Notes</Label>
                  <Textarea
                    className="w-full min-h-[100px] border-gray-300 focus:border-blue-400 focus:ring-1 focus:ring-blue-300"
                    {...register('progress_notes')}
                    placeholder="Enter progress notes"
                  />
                </div>
              </div>

              <div className="flex justify-between mt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClearForm}
                  disabled={isSubmitting}
                  className="bg-white hover:bg-gray-50 text-gray-700 border-gray-300"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Clear Form
                </Button>
                <div className="flex space-x-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleCancel}
                    disabled={isSubmitting}
                    className="bg-white hover:bg-gray-50 text-gray-700 border-gray-300"
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={isSubmitting}
                    className="bg-[#004aad] hover:bg-[#003d8f] text-white"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {isEditing ? 'Updating...' : 'Creating...'}
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        {isEditing ? 'Update Grant' : 'Create Grant'}
                      </>
                    )}
                  </Button>
                </div>
              </div>
          </form>
        </CardContent>
        <div className="py-4">
          <p className="text-center text-[#004aad] font-medium italic">
            Together We Can Make A Difference
          </p>
        </div>
      </Card>
    </div>
  );
};
