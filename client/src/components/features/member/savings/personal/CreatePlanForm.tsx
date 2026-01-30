// import { z } from 'zod';
// import { useForm, Controller, useWatch } from 'react-hook-form';
// import { zodResolver } from '@hookform/resolvers/zod';
// import { useCreatePersonalSavingsPlan, usePersonalSavingsPlanTypes } from '@/lib/hooks/member/usePersonalSavings';
// import { useAuth } from '@/lib/api/contexts/AuthContext';
// import { useState, useEffect } from 'react';
// import { useRouter } from 'next/navigation';
// import { 
//   Box,
//   Card, 
//   CardContent, 
//   CardHeader, 
//   Typography,
//   TextField,
//   Button,
//   MenuItem,
//   CircularProgress,
//   FormHelperText,
//   Paper,
//   Alert,
//   AlertTitle,
//   SelectChangeEvent, // Import SelectChangeEvent
// } from '@mui/material';
// import InfoIcon from '@mui/icons-material/Info';
// import { CreatePersonalSavingsRequest } from '@/lib/api/services/personalSavingsService';

// const createPlanSchema = z.object({
//   planTypeId: z.string().min(1, 'Please select a plan type'),
//   planName: z.string().min(3, 'Plan name must be at least 3 characters').max(50, 'Plan name cannot exceed 50 characters'),
//   targetAmount: z.number().positive('Target amount must be positive'),
//   notes: z.string().optional()
// });

// type CreatePlanFormValues = z.infer<typeof createPlanSchema>;

// export function CreatePlanForm() {
//   const router = useRouter();
//   const { user } = useAuth();
//   const [isLoading, setIsLoading] = useState(false);
//   const createMutation = useCreatePersonalSavingsPlan();
//   const [selectedPlanDescription, setSelectedPlanDescription] = useState<string | null>(null);
//   const [selectedPlanName, setSelectedPlanName] = useState<string | null>(null);
  
//   const { data: planTypes = [], isLoading: planTypesLoading, error: planTypesError } = usePersonalSavingsPlanTypes();
  
//   const form = useForm<CreatePlanFormValues>({
//     resolver: zodResolver(createPlanSchema),
//     defaultValues: {
//       planTypeId: '',
//       planName: '',
//       targetAmount: undefined,
//       notes: ''
//     }
//   });
  
//   // Watch the plan type selection to update the plan name field
//   const selectedPlanTypeId = useWatch({
//     control: form.control,
//     name: 'planTypeId',
//   });
  
//   // Log planTypes to see if data is fetched correctly
//   useEffect(() => {
//     console.log('CreatePlanForm: planTypes data:', planTypes);
//     console.log('CreatePlanForm: planTypesLoading:', planTypesLoading);
//     console.log('CreatePlanForm: planTypesError:', planTypesError);
//   }, [planTypes, planTypesLoading, planTypesError]);

//   // Log selectedPlanTypeId and form.planTypeId to track updates
//   useEffect(() => {
//     console.log('CreatePlanForm: selectedPlanTypeId (from useWatch):', selectedPlanTypeId);
//     console.log('CreatePlanForm: form.watch("planTypeId"):', form.watch('planTypeId'));
//     console.log('CreatePlanForm: selectedPlanName:', selectedPlanName);
//     console.log('CreatePlanForm: selectedPlanDescription:', selectedPlanDescription);

//     if (selectedPlanTypeId && planTypes?.length) {
//       console.log('CreatePlanForm: Entering useEffect for plan type selection...');
//       const selectedPlan = planTypes.find(plan => plan.id === selectedPlanTypeId);
//       if (selectedPlan) {
//         console.log('CreatePlanForm: Found selectedPlan:', selectedPlan);
//         // Update the plan name field with the selected plan type name
//         form.setValue('planName', selectedPlan.name, { 
//           shouldValidate: true,
//           shouldDirty: true 
//         });
        
//         // Set the description for display
//         setSelectedPlanDescription(selectedPlan.description || null);
//         // Store the plan name for display
//         setSelectedPlanName(selectedPlan.name);
//         console.log('CreatePlanForm: Updated form.planName, selectedPlanName, selectedPlanDescription.');
//       } else {
//         console.log('CreatePlanForm: selectedPlan not found for id:', selectedPlanTypeId);
//         // If somehow selectedPlanTypeId is present but no matching plan is found, clear the name/description
//         form.setValue('planName', '', { shouldDirty: true }); // Clear plan name if plan type is invalid/not found
//         setSelectedPlanName(null);
//         setSelectedPlanDescription(null);
//       }
//     } else {
//       // If selectedPlanTypeId is empty or planTypes is not yet loaded/empty
//       if (!selectedPlanTypeId) {
//         console.log('CreatePlanForm: selectedPlanTypeId is empty, clearing plan details.');
//         // Ensure plan name is cleared if no plan type is selected
//         form.setValue('planName', '', { shouldDirty: true }); 
//       }
//       setSelectedPlanName(null);
//       setSelectedPlanDescription(null);
//     }
//   }, [selectedPlanTypeId, planTypes, form]);
  
//   const handleCreatePlan = (data: CreatePlanFormValues) => {
//     // Ensure user and erpId are present.
//     if (!user?.biodata?.erpId) {
//       console.error("User or ERP ID is missing. Cannot create savings plan.");
//       form.setError('root', { message: 'User data is incomplete. Cannot create plan.' });
//       return;
//     }
    
//     // Zod validation ensures planTypeId is a string with min(1).
//     // This check provides runtime safety and aids TypeScript inference.
//     if (!data.planTypeId) { 
//       console.error("Submission failed: Plan Type ID is missing.");
//       form.setError('planTypeId', { type: 'manual', message: 'Please select a plan type.' });
//       return;
//     }
    
//     setIsLoading(true);
    
//     // Explicitly deconstruct and assign properties to construct the payload.
//     // This helps TypeScript infer the correct types, especially for required fields.
//     const { planTypeId, planName, targetAmount, notes } = data;

//     const payload: CreatePersonalSavingsRequest = {
//       erpId: user.biodata.erpId, // Known string due to the check above.
//       planTypeId: planTypeId,    // Known string due to Zod validation (.min(1)) and the check above.
//       planName: planName,        // Known string due to Zod validation (.min(3)).
//       targetAmount: targetAmount, // Optional, can be undefined.
//       notes: notes,              // Optional, can be undefined.
//     };

//     console.log("CreatePlanForm: Submitting payload:", payload);

//     createMutation.mutate(payload, {
//       onSuccess: () => {
//         console.log("CreatePlanForm: Plan created successfully.");
//         router.push('/member/savings/personal');
//       },
//       onError: (error) => {
//         console.error("CreatePlanForm: Error creating plan:", error);
//         // Attempt to set a general form error if no specific field error is provided
//         if (!form.formState.errors.root && !form.formState.errors.planTypeId && !form.formState.errors.planName) {
//           form.setError('root', { message: 'Failed to create savings plan. Please try again.' });
//         }
//       },
//       onSettled: () => {
//         setIsLoading(false);
//       }
//     });
//   };
  
//   return (
//     <Card>
//       <CardHeader title="Request New Savings Plan" />
//       <CardContent>
//         <form onSubmit={form.handleSubmit(handleCreatePlan)}>
//           <Box sx={{ mb: 3 }}>
//             <Controller
//               name="planTypeId"
//               control={form.control}
//               render={({ field, fieldState }) => (
//                 <TextField
//                   select
//                   label="Plan Type"
//                   fullWidth
//                   required
//                   {...field}
//                   error={!!fieldState.error}
//                   helperText={fieldState.error?.message}
//                   disabled={planTypesLoading}
//                   onChange={(event: SelectChangeEvent<string>) => { // Explicitly type event as SelectChangeEvent<string>
//                     const selectedValue = event.target.value as string;
//                     console.log('CreatePlanForm: Dropdown onChange fired. Selected value:', selectedValue);
//                     field.onChange(selectedValue); // Pass the string value
//                   }}
//                 >
//                   {planTypesLoading ? (
//                     <MenuItem disabled>Loading plan types...</MenuItem>
//                   ) : planTypesError ? (
//                     <MenuItem disabled>Error loading plan types</MenuItem>
//                   ) : planTypes?.length ? (
//                     planTypes.map(type => (
//                       <MenuItem key={type.id} value={type.id}>
//                         {type.name}
//                       </MenuItem>
//                     ))
//                   ) : (
//                     <MenuItem disabled>No plan types available</MenuItem>
//                   )}
//                 </TextField>
//               )}
//             />
//             {planTypesError && (
//               <FormHelperText error>
//                 Failed to load plan types. Please try again later.
//               </FormHelperText>
//             )}
//           </Box>
          
//           {/* Display selected plan description and name if available */}
//           {selectedPlanDescription && selectedPlanName && (
//             <Paper 
//               elevation={0} 
//               sx={{ 
//                 p: 2, 
//                 mb: 3, 
//                 backgroundColor: 'rgba(25, 118, 210, 0.08)',
//                 borderLeft: '4px solid #1976d2',
//                 display: 'flex',
//                 alignItems: 'flex-start'
//               }}
//             >
//               <InfoIcon color="primary" sx={{ mr: 1, mt: 0.5 }} />
//               <Box>
//                 <Typography variant="subtitle2" color="primary" fontWeight="bold" gutterBottom>
//                   {selectedPlanName}
//                 </Typography>
//                 <Typography variant="body2">
//                   {selectedPlanDescription}
//                 </Typography>
//               </Box>
//             </Paper>
//           )}
          
//           {/* Hidden field for plan name - it will still be submitted with the form */ }
//           {/* This hidden input is actually problematic if planName is meant to be auto-populated from selection.
//               It might be overwriting the setValue from useEffect or causing issues if not handled carefully.
//               Let's consider if this is necessary or if it should be removed/managed differently.
//               For now, it's kept as is but noted as a potential area for concern. */}

//           <Box sx={{ mb: 3 }}>
//             <TextField
//               label="Target Amount"
//               type="number"
//               fullWidth
//               required
//               placeholder="Target savings amount"
//               {...form.register('targetAmount', { valueAsNumber: true })}
//               error={!!form.formState.errors.targetAmount}
//               helperText={form.formState.errors.targetAmount?.message}
//               InputProps={{
//                 startAdornment: <Box component="span" sx={{ mr: 1 }}>₦</Box>,
//               }}
//             />
//           </Box>
          
//           <Box sx={{ mb: 4 }}>
//             <TextField
//               label="Notes (Optional)"
//               fullWidth
//               multiline
//               rows={4}
//               placeholder="Any additional notes about this savings plan"
//               {...form.register('notes')}
//               error={!!form.formState.errors.notes}
//               helperText={form.formState.errors.notes?.message}
//             />
//           </Box>
          
//           {form.formState.errors.root && (
//             <Alert severity="error" sx={{ mb: 3 }}>
//               <AlertTitle>Error</AlertTitle>
//               {form.formState.errors.root.message}
//             </Alert>
//           )}
          
//           {/* Display error if planName is invalid (shouldn't happen with auto-setting if useEffect works) */}
//           {/* This might also indicate an issue if planName is not being set by useEffect */}
//           {form.formState.errors.planName && (
//             <Alert severity="error" sx={{ mb: 3 }}>
//               <AlertTitle>Error</AlertTitle>
//               {form.formState.errors.planName.message}
//             </Alert>
//           )}
          
//           <Box display="flex" justifyContent="space-between">
//             <Button 
//               variant="outlined"
//               onClick={() => router.push('/member/savings/personal')}
//             >
//               Cancel
//             </Button>
            
//             <Button 
//               type="submit" 
//               variant="contained"
//               disabled={isLoading || planTypesLoading}
//               startIcon={isLoading ? <CircularProgress size={20} /> : null}
//             >
//               {isLoading ? 'Submitting...' : 'Request Savings Plan'}
//             </Button>
//           </Box>
//         </form>
//       </CardContent>
//     </Card>
//   );
// }

import { z } from 'zod';
import { useForm, Controller, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useCreatePersonalSavingsPlan, usePersonalSavingsPlanTypes } from '@/lib/hooks/member/usePersonalSavings';
import { useAuth } from '@/lib/api/contexts/AuthContext';
import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Box,
  Card, 
  CardContent, 
  CardHeader, 
  Typography,
  TextField,
  Button,
  MenuItem,
  CircularProgress,
  FormHelperText,
  Paper,
  Alert,
  AlertTitle,
} from '@mui/material';
import InfoIcon from '@mui/icons-material/Info';
import { CreatePersonalSavingsRequest } from '@/lib/api/services/personalSavingsService';

// --- Types & Schema ---

const createPlanSchema = z.object({
  planTypeId: z.string().min(1, 'Please select a plan type'),
  planName: z.string().min(3, 'Plan name must be at least 3 characters').max(50, 'Plan name cannot exceed 50 characters'),
  targetAmount: z.number({ invalid_type_error: 'Target amount is required' }).positive('Target amount must be positive'),
  notes: z.string().optional()
});

type CreatePlanFormValues = z.infer<typeof createPlanSchema>;

export function CreatePlanForm() {
  const router = useRouter();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const createMutation = useCreatePersonalSavingsPlan();
  
  // Fetch Plan Types
  const { data: planTypesResponse, isLoading: planTypesLoading, error: planTypesError } = usePersonalSavingsPlanTypes();

  // Safely extract the array from the response object
  // Based on your JSON, the array is inside .data
  const planTypes = useMemo(() => {
    if (Array.isArray(planTypesResponse)) return planTypesResponse;
    if (planTypesResponse && typeof planTypesResponse === 'object' && 'data' in planTypesResponse) {
      return (planTypesResponse as any).data;
    }
    return [];
  }, [planTypesResponse]);

  const form = useForm<CreatePlanFormValues>({
    resolver: zodResolver(createPlanSchema),
    defaultValues: {
      planTypeId: '',
      planName: '',
      targetAmount: undefined,
      notes: ''
    }
  });

  const selectedPlanTypeId = useWatch({ control: form.control, name: 'planTypeId' });

  // Find the selected plan object to show description/auto-fill name
  const selectedPlanMetadata = useMemo(() => {
    return planTypes.find((p: any) => p.id === selectedPlanTypeId);
  }, [planTypes, selectedPlanTypeId]);

  // Update Plan Name and Description when Type changes
  useEffect(() => {
    if (selectedPlanMetadata) {
      form.setValue('planName', selectedPlanMetadata.name, { shouldValidate: true });
    } else {
      form.setValue('planName', '');
    }
  }, [selectedPlanMetadata, form]);

  const handleCreatePlan = (values: CreatePlanFormValues) => {
    if (!user?.biodata?.erpId) {
      form.setError('root', { message: 'User data is incomplete (Missing ERP ID).' });
      return;
    }

    setIsLoading(true);
    
    const payload: CreatePersonalSavingsRequest = {
      erpId: user.biodata.erpId,
      planTypeId: values.planTypeId,
      planName: values.planName,
      targetAmount: values.targetAmount,
      notes: values.notes,
    };

    createMutation.mutate(payload, {
      onSuccess: () => router.push('/member/savings/personal'),
      onError: () => form.setError('root', { message: 'Failed to create savings plan. Please try again.' }),
      onSettled: () => setIsLoading(false)
    });
  };

  return (
    <Card>
      <CardHeader title="Request New Savings Plan" />
      <CardContent>
        <form onSubmit={form.handleSubmit(handleCreatePlan)}>
          
          {/* Plan Type Selection */}
          <Box sx={{ mb: 3 }}>
            <Controller
              name="planTypeId"
              control={form.control}
              render={({ field, fieldState }) => (
                <TextField
                  {...field}
                  select
                  label="Plan Type"
                  fullWidth
                  required
                  error={!!fieldState.error}
                  helperText={fieldState.error?.message}
                  disabled={planTypesLoading}
                >
                  {planTypesLoading ? (
                    <MenuItem disabled><CircularProgress size={20} sx={{ mr: 1 }} /> Loading...</MenuItem>
                  ) : planTypes.length > 0 ? (
                    planTypes.map((type: any) => (
                      <MenuItem key={type.id} value={type.id}>
                        {type.name}
                      </MenuItem>
                    ))
                  ) : (
                    <MenuItem disabled>No plan types available</MenuItem>
                  )}
                </TextField>
              )}
            />
          </Box>

          {/* Plan Info Callout */}
          {selectedPlanMetadata && (
            <Paper 
              elevation={0} 
              sx={{ p: 2, mb: 3, bgcolor: 'action.hover', borderLeft: '4px solid', borderColor: 'primary.main', display: 'flex' }}
            >
              <InfoIcon color="primary" sx={{ mr: 1.5 }} />
              <Box>
                <Typography variant="subtitle2" fontWeight="bold">
                  {selectedPlanMetadata.name}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {selectedPlanMetadata.description}
                </Typography>
              </Box>
            </Paper>
          )}

          {/* Hidden Name Field (Managed by useEffect) */}
          <input type="hidden" {...form.register('planName')} />

          <Box sx={{ mb: 3 }}>
            <TextField
              label="Target Amount"
              type="number"
              fullWidth
              required
              {...form.register('targetAmount', { valueAsNumber: true })}
              error={!!form.formState.errors.targetAmount}
              helperText={form.formState.errors.targetAmount?.message}
              InputProps={{ startAdornment: <Box component="span" sx={{ mr: 1 }}>₦</Box> }}
            />
          </Box>
          
          <Box sx={{ mb: 4 }}>
            <TextField
              label="Notes (Optional)"
              fullWidth
              multiline
              rows={3}
              {...form.register('notes')}
            />
          </Box>
          
          {form.formState.errors.root && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {form.formState.errors.root.message}
            </Alert>
          )}
          
          <Box display="flex" justifyContent="space-between">
            <Button variant="outlined" onClick={() => router.push('/member/savings/personal')}>
              Cancel
            </Button>
            
            <Button 
              type="submit" 
              variant="contained"
              disabled={isLoading || planTypesLoading}
              startIcon={isLoading && <CircularProgress size={20} />}
            >
              {isLoading ? 'Submitting...' : 'Request Savings Plan'}
            </Button>
          </Box>
        </form>
      </CardContent>
    </Card>
  );
}