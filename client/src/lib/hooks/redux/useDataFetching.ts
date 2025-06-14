import { 
  useQuery, 
  useMutation, 
  UseQueryOptions, 
  UseMutationOptions,
  QueryKey,
  QueryFunction,
  QueryFunctionContext
} from '@tanstack/react-query';
import { useUI } from './useUI';
import { useRef, useEffect } from 'react';
import { AxiosError } from 'axios';
import { ApiErrorResponse } from '@/types/auth.types';

/**
 * Enhanced useQuery hook with error handling and UI notifications
 * Adapted for React Query v5 which removed onSuccess/onError callbacks
 */
export function useQueryWithToast<
  TQueryFnData = unknown,
  TError = Error,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey
>(
  queryKey: TQueryKey,
  queryFn: QueryFunction<TQueryFnData, TQueryKey>,
  options?: Omit<UseQueryOptions<TQueryFnData, TError, TData, TQueryKey>, 'queryKey' | 'queryFn'> & { 
    successMessage?: string; 
    errorMessage?: string;
    onSuccess?: (data: TData) => void;
    onError?: (error: TError) => void;
    unwrapResponse?: boolean; // New option
  }
) {
  const { addToast } = useUI();
  const { 
    successMessage, 
    errorMessage, 
    onSuccess: userOnSuccess, 
    onError: userOnError, 
    unwrapResponse = false, // Default to false for backward compatibility
    ...validOptions 
  } = options || {};

  // Create refs to track previous state
  const prevDataRef = useRef<TData | undefined>(undefined);
  const prevErrorRef = useRef<TError | null>(null);
  
  // Create a wrapper query function that unwraps the response if requested
  const wrappedQueryFn = async (context: QueryFunctionContext<TQueryKey>): Promise<TQueryFnData> => {
    const result = await queryFn(context);
    
    if (unwrapResponse) {
      console.log(`Unwrapping API response for ${String(queryKey[0])}:`, result);
      
      // Return the data property if it exists and has a status property
      if (result && 
          typeof result === 'object' && 
          'data' in result && 
          'status' in result && 
          (result.status === 'success' || ('success' in result && result.success === true))) {
        console.log(`Unwrapped data:`, result.data);
        return result.data as TQueryFnData;
      }
    }
    
    return result as TQueryFnData;
  };
  
  // Use the query with modified query function if unwrap is requested
  const queryResult = useQuery<TQueryFnData, TError, TData, TQueryKey>({
    queryKey,
    queryFn: unwrapResponse ? wrappedQueryFn : queryFn,
    ...validOptions
  });
  
  const { data, error } = queryResult;
  
  // Handle success via effect
  useEffect(() => {
    // Only trigger when data changes and is not undefined
    if (data !== undefined && data !== prevDataRef.current) {
      prevDataRef.current = data;
      
      if (successMessage) {
        addToast({
          message: successMessage,
          type: 'success',
        });
      }
      
      // Call user's onSuccess if provided
      if (userOnSuccess) {
        userOnSuccess(data);
      }
    }
  }, [data]);
  
  // Handle error via effect
  useEffect(() => {
    // Only trigger when error changes and is not null
    if (error && error !== prevErrorRef.current) {
      prevErrorRef.current = error;
      
      if (errorMessage) {
        addToast({
          message: errorMessage,
          type: 'error',
        });
      } else {
        // Enhanced error handling with better type checking
        const axiosError = error as unknown as AxiosError<ApiErrorResponse>;
        const errorMsg = axiosError.response?.data?.message || 
                        axiosError.message || 
                        'An error occurred';
        addToast({
          message: errorMsg,
          type: 'error',
        });
      }
      
      // Call user's onError if provided
      if (userOnError) {
        userOnError(error);
      }
    }
  }, [error]);
  
  return queryResult;
}

/**
 * Enhanced useMutation hook with error handling and UI notifications
 * Adapted for React Query v5 which removed onSuccess/onError callbacks
 */
export function useMutationWithToast<
  TData = unknown,
  TError = Error,
  TVariables = void,
  TContext = unknown
>(
  mutationFn: (variables: TVariables) => Promise<TData>,
  options?: Omit<UseMutationOptions<TData, TError, TVariables, TContext>, 'mutationFn'> & { 
    successMessage?: string | ((data: TData) => string); 
    errorMessage?: string | ((error: TError) => string);
    onSuccess?: (data: TData) => void;
    onError?: (error: TError) => void;
  }
) {
  const { addToast } = useUI();
  const { successMessage, errorMessage, ...restOptions } = options || {};
  
  return useMutation<TData, TError, TVariables, TContext>({
    mutationFn,
    ...restOptions,
    onSuccess: (data, variables, context) => {
      if (successMessage) {
        const message = typeof successMessage === 'function'
          ? successMessage(data) 
          : successMessage;
        
        addToast({
          message,
          type: 'success',
        });
      }
      
      // If there was an onSuccess in the original options, call it
      if (options?.onSuccess) {
        options.onSuccess(data, variables, context);
      }
    },
    onError: (error, variables, context) => {
      if (errorMessage) {
        const message = typeof errorMessage === 'function' 
          ? errorMessage(error) 
          : errorMessage;
        
        addToast({
          message,
          type: 'error',
        });
      } else {
        // Enhanced error handling with better type checking
        const axiosError = error as AxiosError<ApiErrorResponse>;
        const errorMsg = axiosError.response?.data?.message || 
                        axiosError.message || 
                        'An error occurred';
        addToast({
          message: errorMsg, // Fixed: use errorMsg instead of message
          type: 'error',
        });
      }
      
      // If there was an onError in the original options, call it
      if (options?.onError) {
        options.onError(error, variables, context);
      }
    }
  });
}
