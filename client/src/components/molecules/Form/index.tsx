import React from 'react';
import { 
  TextField, 
  Select, 
  MenuItem, 
  FormControl, 
  InputLabel, 
  FormHelperText,
  TextareaAutosize,
  Checkbox,
  FormControlLabel,
  Switch,
  RadioGroup,
  Radio,
  Stack,
  Typography,
  FormLabel,
  FormGroup,
  InputAdornment,
  IconButton,
  SelectChangeEvent,
  Autocomplete,
  Chip
} from '@mui/material';
import { Controller, Control, Path, FieldValues, FieldError, RegisterOptions } from 'react-hook-form';
import { Visibility, VisibilityOff } from '@mui/icons-material';

// Generic type parameter for strong typing
interface FormFieldProps<TFieldValues extends FieldValues> {
  name: Path<TFieldValues>;
  control: Control<TFieldValues>;
  label: string;
  helperText?: string;
  error?: FieldError;
  fullWidth?: boolean;
  required?: boolean;
  disabled?: boolean;
  rules?: RegisterOptions;
}

/**
 * Text input field using React Hook Form and MUI
 */
export function FormTextField<TFieldValues extends FieldValues>({
  name,
  control,
  label,
  helperText,
  error,
  fullWidth = true,
  required = false,
  disabled = false,
  type = 'text',
  ...rest
}: FormFieldProps<TFieldValues> & { type?: string }) {
  const [showPassword, setShowPassword] = React.useState(false);

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  // Handle password fields with toggle visibility
  const isPassword = type === 'password';
  const inputType = isPassword ? (showPassword ? 'text' : 'password') : type;

  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => (
        <TextField
          {...field}
          id={`field-${name}`}
          label={label}
          type={inputType}
          variant="outlined"
          fullWidth={fullWidth}
          required={required}
          disabled={disabled}
          error={!!fieldState.error}
          helperText={fieldState.error ? fieldState.error.message : helperText}
          InputProps={isPassword ? {
            endAdornment: (
              <InputAdornment position="end">
                <IconButton
                  aria-label="toggle password visibility"
                  onClick={togglePasswordVisibility}
                  edge="end"
                >
                  {showPassword ? <VisibilityOff /> : <Visibility />}
                </IconButton>
              </InputAdornment>
            ),
          } : undefined}
          {...rest}
        />
      )}
    />
  );
}

/**
 * Select dropdown field using React Hook Form and MUI
 */
export function SelectField<TFieldValues extends FieldValues>({
  name,
  control,
  label,
  helperText,
  error,
  fullWidth = true,
  required = false,
  disabled = false,
  options = [],
  ...rest
}: FormFieldProps<TFieldValues> & { 
  options: { value: string | number; label: string }[]; 
  multiple?: boolean;
}) {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => (
        <FormControl 
          fullWidth={fullWidth} 
          error={!!fieldState.error} 
          required={required}
          disabled={disabled}
        >
          <InputLabel id={`select-label-${name}`}>{label}</InputLabel>
          <Select
            {...field}
            labelId={`select-label-${name}`}
            id={`select-${name}`}
            label={label}
            multiple={rest.multiple}
            MenuProps={{
              PaperProps: {
                style: {
                  maxHeight: 300
                }
              }
            }}
            {...rest}
          >
            {options.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </Select>
          <FormHelperText>
            {fieldState.error ? fieldState.error.message : helperText}
          </FormHelperText>
        </FormControl>
      )}
    />
  );
}

/**
 * Textarea field using React Hook Form and MUI
 */
export function TextareaField<TFieldValues extends FieldValues>({
  name,
  control,
  label,
  helperText,
  error,
  fullWidth = true,
  required = false,
  disabled = false,
  minRows = 3,
  maxRows = 6,
  ...rest
}: FormFieldProps<TFieldValues> & { minRows?: number; maxRows?: number }) {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => (
        <TextField
          {...field}
          id={`textarea-${name}`}
          label={label}
          multiline
          minRows={minRows}
          maxRows={maxRows}
          variant="outlined"
          fullWidth={fullWidth}
          required={required}
          disabled={disabled}
          error={!!fieldState.error}
          helperText={fieldState.error ? fieldState.error.message : helperText}
          {...rest}
        />
      )}
    />
  );
}

/**
 * Checkbox field using React Hook Form and MUI
 */
export function CheckboxField<TFieldValues extends FieldValues>({
  name,
  control,
  label,
  helperText,
  error,
  required = false,
  disabled = false,
  ...rest
}: Omit<FormFieldProps<TFieldValues>, 'fullWidth'>) {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => (
        <FormControl 
          required={required} 
          error={!!fieldState.error}
          component="fieldset"
          disabled={disabled}
        >
          <FormControlLabel
            control={
              <Checkbox
                {...field}
                id={`checkbox-${name}`}
                checked={field.value}
                {...rest}
              />
            }
            label={label}
          />
          {(fieldState.error || helperText) && (
            <FormHelperText>
              {fieldState.error ? fieldState.error.message : helperText}
            </FormHelperText>
          )}
        </FormControl>
      )}
    />
  );
}

/**
 * Switch field using React Hook Form and MUI
 */
export function SwitchField<TFieldValues extends FieldValues>({
  name,
  control,
  label,
  helperText,
  error,
  required = false,
  disabled = false,
  ...rest
}: Omit<FormFieldProps<TFieldValues>, 'fullWidth'>) {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => (
        <FormControl 
          required={required} 
          error={!!fieldState.error}
          component="fieldset"
          disabled={disabled}
        >
          <FormControlLabel
            control={
              <Switch
                {...field}
                id={`switch-${name}`}
                checked={field.value}
                {...rest}
              />
            }
            label={label}
          />
          {(fieldState.error || helperText) && (
            <FormHelperText>
              {fieldState.error ? fieldState.error.message : helperText}
            </FormHelperText>
          )}
        </FormControl>
      )}
    />
  );
}

/**
 * Radio group field using React Hook Form and MUI
 */
export function RadioGroupField<TFieldValues extends FieldValues>({
  name,
  control,
  label,
  helperText,
  error,
  options = [],
  required = false,
  disabled = false,
  row = true,
  ...rest
}: FormFieldProps<TFieldValues> & { 
  options: { value: string; label: string }[];
  row?: boolean;
}) {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => (
        <FormControl 
          required={required} 
          error={!!fieldState.error}
          component="fieldset"
          disabled={disabled}
          fullWidth
        >
          <FormLabel id={`radio-group-label-${name}`}>{label}</FormLabel>
          <RadioGroup
            {...field}
            aria-labelledby={`radio-group-label-${name}`}
            row={row}
            {...rest}
          >
            {options.map((option) => (
              <FormControlLabel
                key={option.value}
                value={option.value}
                control={<Radio />}
                label={option.label}
              />
            ))}
          </RadioGroup>
          {(fieldState.error || helperText) && (
            <FormHelperText>
              {fieldState.error ? fieldState.error.message : helperText}
            </FormHelperText>
          )}
        </FormControl>
      )}
    />
  );
}

/**
 * Autocomplete field using React Hook Form and MUI
 */
export function AutocompleteField<TFieldValues extends FieldValues>({
  name,
  control,
  label,
  helperText,
  error,
  fullWidth = true,
  required = false,
  disabled = false,
  options = [],
  getOptionLabel = (option: any) => option.label || option,
  isOptionEqualToValue,
  ...rest
}: FormFieldProps<TFieldValues> & {
  options: any[];
  getOptionLabel?: (option: any) => string;
  isOptionEqualToValue?: (option: any, value: any) => boolean;
  multiple?: boolean;
}) {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => {
        const { onChange, value, ref, ...fieldProps } = field;
        
        return (
          <Autocomplete
            id={`autocomplete-${name}`}
            options={options}
            value={value}
            onChange={(_, newValue) => {
              onChange(newValue);
            }}
            getOptionLabel={getOptionLabel}
            isOptionEqualToValue={isOptionEqualToValue}
            fullWidth={fullWidth}
            disabled={disabled}
            renderInput={(params) => (
              <TextField
                {...params}
                label={label}
                inputRef={ref}
                error={!!fieldState.error}
                helperText={fieldState.error ? fieldState.error.message : helperText}
                required={required}
              />
            )}
            {...rest}
          />
        );
      }}
    />
  );
}

/**
 * Date picker field using React Hook Form and MUI
 */
export function DateField<TFieldValues extends FieldValues>({
  name,
  control,
  label,
  helperText,
  error,
  fullWidth = true,
  required = false,
  disabled = false,
  ...rest
}: FormFieldProps<TFieldValues>) {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => (
        <TextField
          {...field}
          id={`date-${name}`}
          label={label}
          type="date"
          variant="outlined"
          fullWidth={fullWidth}
          required={required}
          disabled={disabled}
          error={!!fieldState.error}
          helperText={fieldState.error ? fieldState.error.message : helperText}
          InputLabelProps={{
            shrink: true,
          }}
          {...rest}
        />
      )}
    />
  );
}
