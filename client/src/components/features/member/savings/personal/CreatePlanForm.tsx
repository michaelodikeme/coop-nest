import { z } from 'zod';
import { useForm, Controller, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useCreatePersonalSavingsPlan, usePersonalSavingsPlanTypes } from '@/lib/hooks/member/usePersonalSavings';
import { useAuth } from '@/lib/api/contexts/AuthContext';
import { useState, useEffect } from 'react';
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

const createPlanSchema = z.object({
  planTypeId: z.string().min(1, 'Please select a plan type'),
  planName: z.string().min(3, 'Plan name must be at least 3 characters').max(50, 'Plan name cannot exceed 50 characters'),
  targetAmount: z.number().positive('Target amount must be positive').optional(),
  notes: z.string().optional()
});

type CreatePlanFormValues = z.infer<typeof createPlanSchema>;

export function CreatePlanForm() {
  const router = useRouter();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const createMutation = useCreatePersonalSavingsPlan();
  const [selectedPlanDescription, setSelectedPlanDescription] = useState<string | null>(null);
  const [selectedPlanName, setSelectedPlanName] = useState<string | null>(null);
  
  const { data: planTypes = [], isLoading: planTypesLoading, error: planTypesError } = usePersonalSavingsPlanTypes();
  
  const form = useForm<CreatePlanFormValues>({
    resolver: zodResolver(createPlanSchema),
    defaultValues: {
      planTypeId: '',
      planName: '',
      targetAmount: undefined,
      notes: ''
    }
  });
  
  // Watch the plan type selection to update the plan name field
  const selectedPlanTypeId = useWatch({
    control: form.control,
    name: 'planTypeId',
  });
  
  // Update plan name and description when plan type changes
  useEffect(() => {
    if (selectedPlanTypeId && planTypes?.length) {
      const selectedPlan = planTypes.find(plan => plan.id === selectedPlanTypeId);
      if (selectedPlan) {
        // Update the plan name field with the selected plan type name
        form.setValue('planName', selectedPlan.name, { 
          shouldValidate: true,
          shouldDirty: true 
        });
        
        // Set the description for display
        setSelectedPlanDescription(selectedPlan.description || null);
        // Store the plan name for display
        setSelectedPlanName(selectedPlan.name);
      }
    }
  }, [selectedPlanTypeId, planTypes, form]);
  
  const handleCreatePlan = (data: CreatePlanFormValues) => {
    if (!user?.biodata?.erpId) return;
    
    setIsLoading(true);
    createMutation.mutate({
      erpId: user.biodata?.erpId,
      ...data
    }, {
      onSuccess: () => {
        router.push('/member/savings/personal');
      },
      onSettled: () => {
        setIsLoading(false);
      }
    });
  };
  
  return (
    <Card>
      <CardHeader title="Request New Savings Plan" />
      <CardContent>
        <form onSubmit={form.handleSubmit(handleCreatePlan)}>
          <Box sx={{ mb: 3 }}>
            <Controller
              name="planTypeId"
              control={form.control}
              render={({ field, fieldState }) => (
                <TextField
                  select
                  label="Plan Type"
                  fullWidth
                  required
                  {...field}
                  error={!!fieldState.error}
                  helperText={fieldState.error?.message}
                  disabled={planTypesLoading}
                  onChange={(e) => {
                    field.onChange(e);
                  }}
                >
                  {planTypesLoading ? (
                    <MenuItem disabled>Loading plan types...</MenuItem>
                  ) : planTypesError ? (
                    <MenuItem disabled>Error loading plan types</MenuItem>
                  ) : planTypes?.length ? (
                    planTypes.map(type => (
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
            {planTypesError && (
              <FormHelperText error>
                Failed to load plan types. Please try again later.
              </FormHelperText>
            )}
          </Box>
          
          {/* Display selected plan description and name if available */}
          {selectedPlanDescription && selectedPlanName && (
            <Paper 
              elevation={0} 
              sx={{ 
                p: 2, 
                mb: 3, 
                backgroundColor: 'rgba(25, 118, 210, 0.08)',
                borderLeft: '4px solid #1976d2',
                display: 'flex',
                alignItems: 'flex-start'
              }}
            >
              <InfoIcon color="primary" sx={{ mr: 1, mt: 0.5 }} />
              <Box>
                <Typography variant="subtitle2" color="primary" fontWeight="bold" gutterBottom>
                  {selectedPlanName}
                </Typography>
                <Typography variant="body2">
                  {selectedPlanDescription}
                </Typography>
              </Box>
            </Paper>
          )}
          
          {/* Hidden field for plan name - it will still be submitted with the form */}
          <input type="hidden" {...form.register('planName')} />
          
          <Box sx={{ mb: 3 }}>
            <TextField
              label="Target Amount"
              type="number"
              fullWidth
              required
              placeholder="Target savings amount"
              {...form.register('targetAmount', { valueAsNumber: true })}
              error={!!form.formState.errors.targetAmount}
              helperText={form.formState.errors.targetAmount?.message}
              InputProps={{
                startAdornment: <Box component="span" sx={{ mr: 1 }}>₦</Box>,
              }}
            />
          </Box>
          
          <Box sx={{ mb: 4 }}>
            <TextField
              label="Notes (Optional)"
              fullWidth
              multiline
              rows={4}
              placeholder="Any additional notes about this savings plan"
              {...form.register('notes')}
              error={!!form.formState.errors.notes}
              helperText={form.formState.errors.notes?.message}
            />
          </Box>
          
          {form.formState.errors.root && (
            <Alert severity="error" sx={{ mb: 3 }}>
              <AlertTitle>Error</AlertTitle>
              {form.formState.errors.root.message}
            </Alert>
          )}
          
          {/* Display error if planName is invalid (shouldn't happen with auto-setting) */}
          {form.formState.errors.planName && (
            <Alert severity="error" sx={{ mb: 3 }}>
              <AlertTitle>Error</AlertTitle>
              {form.formState.errors.planName.message}
            </Alert>
          )}
          
          <Box display="flex" justifyContent="space-between">
            <Button 
              variant="outlined"
              onClick={() => router.push('/member/savings/personal')}
            >
              Cancel
            </Button>
            
            <Button 
              type="submit" 
              variant="contained"
              disabled={isLoading || planTypesLoading}
              startIcon={isLoading ? <CircularProgress size={20} /> : null}
            >
              {isLoading ? 'Submitting...' : 'Request Savings Plan'}
            </Button>
          </Box>
        </form>
      </CardContent>
    </Card>
  );
}