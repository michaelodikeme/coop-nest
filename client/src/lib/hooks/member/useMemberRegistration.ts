import { useMutation } from "@tanstack/react-query"
import {
  type MemberRegistrationData,
  type MemberRegistrationResponse,
} from "@/types/member.types"
import { memberService } from "@/lib/api"
import { useToast } from '@/components/molecules/Toast';

interface UseMemberRegistrationOptions {
  onSuccess?: (data: MemberRegistrationResponse) => void
  onError?: (error: any) => void
}

export function useMemberRegistration(options?: UseMemberRegistrationOptions) {
  const toast = useToast();

  return useMutation({
    mutationFn: (data: MemberRegistrationData) => memberService.registerMember(data),
    onSuccess: (data) => {
      toast.success("Registration submitted successfully! Your application is now under review. You will be notified of the status.")
      options?.onSuccess?.(data)
    },
    onError: (error: any) => {
      console.error("Registration error:", error)

      // Extract error message from API response
      const errorMessage = error?.response?.data?.message || error?.message || "Registration failed. Please try again."
      toast.error(error?.message || 'Registration Failed.');


      options?.onError?.(error)
    },
  })
}

// Export the types for use in components
export type { MemberRegistrationData, MemberRegistrationResponse }
