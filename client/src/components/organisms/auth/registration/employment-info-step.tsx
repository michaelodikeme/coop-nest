"use client"

import { Input } from "@/components/atoms/ui/input"
import { Label } from "@/components/atoms/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/atoms/ui/select"

interface FormData {
  erpId: string
  ippisId: string
  staffNo: string
  department: string
  dateOfEmployment: string
}

interface EmploymentInfoStepProps {
  formData: FormData
  updateFormData: (data: Partial<FormData>) => void
  errors: Record<string, string>
}

const departments = [
  "Administration",
  "Finance",
  "Human Resources",
  "Information Technology",
  "Operations",
  "Marketing",
  "Legal",
  "Procurement",
  "Audit",
  "Planning & Research",
]

export default function EmploymentInfoStep({ formData, updateFormData, errors }: EmploymentInfoStepProps) {
  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Employment Details</h3>
        <p className="text-gray-600">Provide your work-related information</p>
      </div>

      {/* Employee IDs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="erpId">ERP ID *</Label>
          <Input
            id="erpId"
            value={formData.erpId}
            onChange={(e) => updateFormData({ erpId: e.target.value })}
            placeholder="Enter your ERP ID"
            className={errors.erpId ? "border-red-500" : ""}
          />
          {errors.erpId && <p className="text-red-500 text-sm">{errors.erpId}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="ippisId">IPPIS ID *</Label>
          <Input
            id="ippisId"
            value={formData.ippisId}
            onChange={(e) => updateFormData({ ippisId: e.target.value })}
            placeholder="Enter your IPPIS ID"
            className={errors.ippisId ? "border-red-500" : ""}
          />
          {errors.ippisId && <p className="text-red-500 text-sm">{errors.ippisId}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="staffNo">Staff Number *</Label>
          <Input
            id="staffNo"
            value={formData.staffNo}
            onChange={(e) => updateFormData({ staffNo: e.target.value })}
            placeholder="Enter your staff number"
            className={errors.staffNo ? "border-red-500" : ""}
          />
          {errors.staffNo && <p className="text-red-500 text-sm">{errors.staffNo}</p>}
        </div>
      </div>

      {/* Department and Employment Date */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="department">Department *</Label>
          <Select value={formData.department} onValueChange={(value: any) => updateFormData({ department: value })}>
            <SelectTrigger className={errors.department ? "border-red-500" : ""}>
              <SelectValue placeholder="Select your department" />
            </SelectTrigger>
            <SelectContent>
              {departments.map((dept) => (
                <SelectItem key={dept} value={dept}>
                  {dept}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.department && <p className="text-red-500 text-sm">{errors.department}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="dateOfEmployment">Date of Employment *</Label>
          <Input
            id="dateOfEmployment"
            type="date"
            value={formData.dateOfEmployment}
            onChange={(e) => updateFormData({ dateOfEmployment: e.target.value })}
            className={errors.dateOfEmployment ? "border-red-500" : ""}
          />
          {errors.dateOfEmployment && <p className="text-red-500 text-sm">{errors.dateOfEmployment}</p>}
        </div>
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-medium text-blue-900 mb-2">Employment Information</h4>
        <p className="text-blue-700 text-sm">
          Please ensure all employment details are accurate as they will be verified against official records. Your ERP
          ID and IPPIS ID are particularly important for membership processing.
        </p>
      </div>
    </div>
  )
}
