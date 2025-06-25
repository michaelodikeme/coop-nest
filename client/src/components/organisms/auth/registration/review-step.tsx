import { Card, CardContent, CardHeader, CardTitle } from "@/components/atoms/ui/card"
import { Badge } from "@/components/atoms/ui/badge"
import { User, Briefcase, Phone, Users } from "lucide-react"

interface FormData {
  firstName: string
  middleName: string
  lastName: string
  dateOfBirth: string
  maritalStatus: string
  profilePhoto: File | null
  erpId: string
  ippisId: string
  staffNo: string
  department: string
  dateOfEmployment: string
  emailAddress: string
  phoneNumber: string
  residentialAddress: string
  nextOfKin: string
  relationshipOfNextOfKin: string
  nextOfKinPhoneNumber: string
  nextOfKinEmailAddress: string
}

interface ReviewStepProps {
  formData: FormData
  errors: Record<string, string>
}

export default function ReviewStep({ formData, errors }: ReviewStepProps) {
  const fullName =
    `${formData.firstName} ${formData.middleName ? formData.middleName + " " : ""}${formData.lastName}`.trim()

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Review Your Application</h3>
        <p className="text-gray-600">Please review all information before submitting</p>
      </div>

      {/* Personal Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <User className="w-5 h-5" />
            Personal Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-gray-500">Full Name</p>
              <p className="text-gray-900">{fullName}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Date of Birth</p>
              <p className="text-gray-900">{formData.dateOfBirth || "Not provided"}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Marital Status</p>
              <p className="text-gray-900">{formData.maritalStatus || "Not provided"}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Profile Photo</p>
              <p className="text-gray-900">{formData.profilePhoto ? "Uploaded" : "Not uploaded"}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Employment Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Briefcase className="w-5 h-5" />
            Employment Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-gray-500">ERP ID</p>
              <p className="text-gray-900">{formData.erpId}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">IPPIS ID</p>
              <p className="text-gray-900">{formData.ippisId}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Staff Number</p>
              <p className="text-gray-900">{formData.staffNo}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Department</p>
              <p className="text-gray-900">{formData.department}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Date of Employment</p>
              <p className="text-gray-900">{formData.dateOfEmployment}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Contact Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Phone className="w-5 h-5" />
            Contact Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-gray-500">Email Address</p>
              <p className="text-gray-900">{formData.emailAddress}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Phone Number</p>
              <p className="text-gray-900">{formData.phoneNumber}</p>
            </div>
            <div className="md:col-span-2">
              <p className="text-sm font-medium text-gray-500">Residential Address</p>
              <p className="text-gray-900">{formData.residentialAddress}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Next of Kin Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Users className="w-5 h-5" />
            Next of Kin Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-gray-500">Full Name</p>
              <p className="text-gray-900">{formData.nextOfKin}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Relationship</p>
              <p className="text-gray-900">{formData.relationshipOfNextOfKin}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Phone Number</p>
              <p className="text-gray-900">{formData.nextOfKinPhoneNumber}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Email Address</p>
              <p className="text-gray-900">{formData.nextOfKinEmailAddress}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Application Status Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-medium text-blue-900 mb-2">What happens next?</h4>
        <div className="space-y-2 text-blue-700 text-sm">
          <p>
            • Your application will be submitted with a <Badge variant="secondary">PENDING</Badge> status
          </p>
          <p>• A treasurer (Level 2 approver) will review your application</p>
          <p>• You'll receive notifications about your application status</p>
          <p>
            • Once approved, your membership status will become{" "}
            <Badge className="bg-green-100 text-green-800">ACTIVE</Badge>
          </p>
        </div>
      </div>
    </div>
  )
}
