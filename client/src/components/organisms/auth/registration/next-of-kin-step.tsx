"use client"

import { Input } from "@/components/atoms/ui/input"
import { Label } from "@/components/atoms/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/atoms/ui/select"

interface FormData {
  nextOfKin: string
  relationshipOfNextOfKin: string
  nextOfKinPhoneNumber: string
  nextOfKinEmailAddress: string
}

interface NextOfKinStepProps {
  formData: FormData
  updateFormData: (data: Partial<FormData>) => void
  errors: Record<string, string>
}

const relationships = [
  "Spouse",
  "Parent",
  "Child",
  "Sibling",
  "Grandparent",
  "Grandchild",
  "Uncle/Aunt",
  "Nephew/Niece",
  "Cousin",
  "Friend",
  "Other",
]

export default function NextOfKinStep({ formData, updateFormData, errors }: NextOfKinStepProps) {
  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Next of Kin Information</h3>
        <p className="text-gray-600">Emergency contact person details</p>
      </div>

      {/* Next of Kin Name and Relationship */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="nextOfKin">Next of Kin Full Name *</Label>
          <Input
            id="nextOfKin"
            value={formData.nextOfKin}
            onChange={(e) => updateFormData({ nextOfKin: e.target.value })}
            placeholder="Enter full name"
            className={errors.nextOfKin ? "border-red-500" : ""}
          />
          {errors.nextOfKin && <p className="text-red-500 text-sm">{errors.nextOfKin}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="relationshipOfNextOfKin">Relationship *</Label>
          <Select
            value={formData.relationshipOfNextOfKin}
            onValueChange={(value: any) => updateFormData({ relationshipOfNextOfKin: value })}
          >
            <SelectTrigger className={errors.relationshipOfNextOfKin ? "border-red-500" : ""}>
              <SelectValue placeholder="Select relationship" />
            </SelectTrigger>
            <SelectContent>
              {relationships.map((relationship) => (
                <SelectItem key={relationship} value={relationship}>
                  {relationship}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.relationshipOfNextOfKin && <p className="text-red-500 text-sm">{errors.relationshipOfNextOfKin}</p>}
        </div>
      </div>

      {/* Contact Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="nextOfKinPhoneNumber">Phone Number *</Label>
          <Input
            id="nextOfKinPhoneNumber"
            type="tel"
            value={formData.nextOfKinPhoneNumber}
            onChange={(e) => updateFormData({ nextOfKinPhoneNumber: e.target.value })}
            placeholder="Enter phone number"
            className={errors.nextOfKinPhoneNumber ? "border-red-500" : ""}
          />
          {errors.nextOfKinPhoneNumber && <p className="text-red-500 text-sm">{errors.nextOfKinPhoneNumber}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="nextOfKinEmailAddress">Email Address *</Label>
          <Input
            id="nextOfKinEmailAddress"
            type="email"
            value={formData.nextOfKinEmailAddress}
            onChange={(e) => updateFormData({ nextOfKinEmailAddress: e.target.value })}
            placeholder="Enter email address"
            className={errors.nextOfKinEmailAddress ? "border-red-500" : ""}
          />
          {errors.nextOfKinEmailAddress && <p className="text-red-500 text-sm">{errors.nextOfKinEmailAddress}</p>}
        </div>
      </div>

      {/* Info Box */}
      <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
        <h4 className="font-medium text-orange-900 mb-2">Next of Kin Information</h4>
        <p className="text-orange-700 text-sm">
          Your next of kin will be contacted in case of emergencies or if we're unable to reach you directly. Please
          ensure they are aware of your cooperative membership application.
        </p>
      </div>
    </div>
  )
}
