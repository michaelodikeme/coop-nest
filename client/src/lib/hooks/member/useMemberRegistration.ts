"use client"

import { useMutation } from "@tanstack/react-query"
import type { MemberRegistrationData, MemberRegistrationResponse } from "@/types/member.types"
import { memberService } from "@/lib/api"
import { extractErrorFromResponse } from "@/lib/utils/errorUtils"

interface UseMemberRegistrationOptions {
  onSuccess?: (data: MemberRegistrationResponse) => void
  onError?: (
    error: any,
    formattedError: { message: string; fieldErrors: Record<string, string>; hasFieldErrors: boolean },
  ) => void
}

export function useMemberRegistration(options?: UseMemberRegistrationOptions) {
  return useMutation({
    mutationFn: (data: MemberRegistrationData) => memberService.registerMember(data),
    onSuccess: (data) => {
      console.log("Registration successful:", data)
      options?.onSuccess?.(data)
    },
    onError: (error: any) => {
      console.error("Registration error:", error)
      console.error("Error response:", error?.response)
      console.error("Error data:", error?.response?.data)

      // Extract and format the error using our utility function
      const formattedError = extractErrorFromResponse(error)

      console.log("Formatted error:", formattedError)

      options?.onError?.(error, formattedError)
    },
  })
}

// Export the types for use in components
export type { MemberRegistrationData, MemberRegistrationResponse }
