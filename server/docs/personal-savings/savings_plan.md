# Adding PersonalSavingsPlan Feature to Personal Savings Module

Based on your request, you need to add functionality to fetch available PersonalSavingsPlan options that members can select when applying for personal savings. Let me implement this feature with all necessary components.

## 1. Service Implementation

First, let's add a method to fetch available plan types in the PersonalSavingsService class:

```typescript
/**
 * Get all available personal savings plan types
 * Returns active plan types that members can use when creating new savings plans
 */
async getPersonalSavingsPlans(): Promise<{
    id: string;
    name: string;
    description: string | null;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}[]> {
    try {
        // Fetch only active plan types
        const planTypes = await this.prisma.personalSavingsPlan.findMany({
            where: {
                isActive: true
            },
            orderBy: {
                name: 'asc'
            }
        });
        
        return planTypes;
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        logger.error(`Error fetching personal savings plan types: ${errorMessage}`, { error });
        throw new ApiError('Failed to fetch personal savings plan types', 500);
    }
}
```

## 2. Controller Implementation

Now, let's add a controller method to expose this functionality:

```typescript
/**
 * Get all available personal savings plan types
 */
getPersonalSavingsPlans = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const planTypes = await this.service.getPersonalSavingsPlans();
        
        return res.status(200).json({
            success: true,
            message: 'Personal savings plan types retrieved successfully',
            data: planTypes
        });
    } catch (error) {
        logger.error('Controller error getting personal savings plan types:', error);
        if (error instanceof ApiError) {
            return res.status(error.statusCode).json({
                success: false,
                message: error.message
            });
        }
        next(error);
        return res.status(500).json({
            success: false,
            message: 'Failed to retrieve personal savings plan types'
        });
    }
}
```

## 3. Route Implementation

Let's add the route to make this endpoint accessible:

```typescript
// Get all available personal savings plan types
router.get(
    '/plans',
    checkPermission('VIEW_PERSONAL_SAVINGS'),
    personalSavingsController.getPersonalSavingsPlans.bind(personalSavingsController) as unknown as RouteHandler
);
```

## 4. Frontend API Integration

Now, let's create a hook and API function to integrate this into the frontend:

```typescript
// Add this to your existing API functions

/**
 * Get all available personal savings plan types
 * @returns List of personal savings plan types
 */
export const getPersonalSavingsPlans = async (): Promise<PersonalSavingsPlan[]> => {
  const response = await apiClient.get('/personal-savings/plans');
  return response.data.data;
};
```

## 5. Frontend Type Definition

Add the necessary type definition:

```typescript
// Add this to your existing types

export interface PersonalSavingsPlan {
  id: string;
  name: string;
  description: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}
```

## 6. React Hook

Create a custom hook to use in the frontend components:

```typescript
// Add this to your existing hooks

/**
 * Hook to fetch personal savings plan types
 */
export function usePersonalSavingsPlans() {
  return useQuery({
    queryKey: ['personalSavingsPlans'],
    queryFn: personalSavingsApi.getPersonalSavingsPlans,
  });
}
```

## 7. Frontend Implementation Example

Here's how to use the hook in a form component:

```tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { usePersonalSavingsPlans, useCreatePersonalSavingsPlan } from '@/lib/hooks/usePersonalSavings';
import { useUser } from '@/lib/hooks/useUser';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useRouter } from 'next/navigation';

const createPlanSchema = z.object({
  planTypeId: z.string().uuid('Please select a plan type'),
  planName: z.string().optional(),
  targetAmount: z.number().optional(),
  notes: z.string().optional()
});

export function CreatePersonalSavingsForm() {
  const router = useRouter();
  const { user } = useUser();
  const { data: planTypes, isLoading: loadingPlanTypes } = usePersonalSavingsPlans();
  const createMutation = useCreatePersonalSavingsPlan();
  
  const form = useForm({
    resolver: zodResolver(createPlanSchema),
    defaultValues: {
      planTypeId: '',
      planName: '',
      targetAmount: undefined,
      notes: ''
    }
  });
  
  const handleCreatePlan = (data) => {
    if (!user?.erpId) return;
    
    createMutation.mutate({
      erpId: user.erpId,
      ...data
    }, {
      onSuccess: () => {
        router.push('/dashboard/personal-savings');
      }
    });
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Request New Personal Savings Plan</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleCreatePlan)} className="space-y-4">
            <FormField
              control={form.control}
              name="planTypeId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Plan Type</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a plan type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {loadingPlanTypes ? (
                        <SelectItem value="" disabled>Loading...</SelectItem>
                      ) : (
                        planTypes?.map(type => (
                          <SelectItem key={type.id} value={type.id}>
                            {type.name}
                            {type.description && ` - ${type.description}`}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="planName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Plan Name (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="My Savings Plan" {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="targetAmount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Target Amount (Optional)</FormLabel>
                  <FormControl>
                    <Input 
                      type="number"
                      placeholder="Target amount" 
                      {...field}
                      onChange={e => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes (Optional)</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Additional notes" {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
            
            <Button 
              type="submit" 
              className="w-full"
              disabled={createMutation.isPending || loadingPlanTypes}
            >
              {createMutation.isPending ? 'Submitting...' : 'Request Savings Plan'}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
```

## 8. Integration into Create Plan Page

```tsx
"use client";

import { CreatePersonalSavingsForm } from '@/components/personal-savings/member/CreatePersonalSavingsForm';

export default function CreatePersonalSavingsPage() {
  return (
    <div className="container mx-auto py-6 max-w-md">
      <h1 className="text-2xl font-bold mb-6">Request New Savings Plan</h1>
      <CreatePersonalSavingsForm />
    </div>
  );
}
```

## Summary

I've implemented the following components to add the PersonalSavingsPlan feature:

1. **Backend Service Method**: Added `getPersonalSavingsPlans()` to fetch active plan types
2. **Controller Method**: Added corresponding controller method to expose the API endpoint
3. **Route Definition**: Added a new route at `/personal-savings/plans` to access plan types
4. **Frontend API Integration**: Created a function to call this endpoint from the frontend
5. **TypeScript Types**: Added type definitions for the plan type data
6. **React Hook**: Created a custom hook (`usePersonalSavingsPlans`) for easy data fetching
7. **UI Component**: Demonstrated how to use the hook in a form component for plan creation

This implementation provides a complete solution for fetching and displaying plan types that members can choose from when creating personal savings plans. The UI component includes proper loading states and error handling to ensure a smooth user experience.

Similar code found with 1 license type