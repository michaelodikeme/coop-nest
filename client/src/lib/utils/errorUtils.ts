interface ValidationError {
  code: string
  message: string
  path: string[]
  type?: string
  minimum?: number
  maximum?: number
  exact?: boolean
  inclusive?: boolean
}

interface ServerErrorResponse {
  success: boolean
  status: string
  message: string
  code: number
  validationErrors?: ValidationError[]
  errors?: any[]
}

interface FormattedError {
  message: string
  fieldErrors: Record<string, string>
  hasFieldErrors: boolean
}

export function extractErrorFromResponse(error: any): FormattedError {
  const result: FormattedError = {
    message: "An error occurred. Please try again.",
    fieldErrors: {},
    hasFieldErrors: false,
  }

  // Check if it's an Axios error with response data
  if (error?.response?.data) {
    const serverResponse: ServerErrorResponse = error.response.data

    // Set the main message
    result.message = serverResponse.message || "An error occurred. Please try again."

    // Handle validation errors (Zod validation errors from your server)
    if (serverResponse.validationErrors && Array.isArray(serverResponse.validationErrors)) {
      serverResponse.validationErrors.forEach((validationError: ValidationError) => {
        if (validationError.path && validationError.path.length > 0) {
          const fieldName = validationError.path[0] // Get the first path element (field name)
          result.fieldErrors[fieldName] = validationError.message
          result.hasFieldErrors = true
        }
      })

      // If we have field errors, update the main message to be more helpful
      if (result.hasFieldErrors) {
        const fieldCount = Object.keys(result.fieldErrors).length
        result.message = `Please fix ${fieldCount} validation error${fieldCount > 1 ? "s" : ""} below.`
      }
    }

    // Handle other error formats (like your original simple errors)
    if (serverResponse.errors && Array.isArray(serverResponse.errors)) {
      serverResponse.errors.forEach((err: any) => {
        if (err.field && err.messages) {
          result.fieldErrors[err.field] = Array.isArray(err.messages) ? err.messages[0] : err.messages
          result.hasFieldErrors = true
        }
      })
    }
  }
  // Handle cases where error.response.data doesn't exist
  else if (error?.message) {
    result.message = error.message
  }

  return result
}

// Helper function to get user-friendly field names
export function getFieldDisplayName(fieldName: string): string {
  const fieldNameMap: Record<string, string> = {
    firstName: "First Name",
    middleName: "Middle Name",
    lastName: "Last Name",
    dateOfBirth: "Date of Birth",
    maritalStatus: "Marital Status",
    erpId: "ERP ID",
    ippisId: "IPPIS ID",
    staffNo: "Staff Number",
    department: "Department",
    dateOfEmployment: "Date of Employment",
    emailAddress: "Email Address",
    phoneNumber: "Phone Number",
    residentialAddress: "Residential Address",
    nextOfKin: "Next of Kin",
    relationshipOfNextOfKin: "Relationship",
    nextOfKinPhoneNumber: "Next of Kin Phone",
    nextOfKinEmailAddress: "Next of Kin Email",
  }

  return fieldNameMap[fieldName] || fieldName
}
