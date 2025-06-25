"use client"

import { Input } from "@/components/atoms/ui/input"
import { Label } from "@/components/atoms/ui/label"
import { Textarea } from "@/components/atoms/ui/textarea"

interface FormData {
  emailAddress: string
  phoneNumber: string
  residentialAddress: string
}

interface ContactInfoStepProps {
  formData: FormData
  updateFormData: (data: Partial<FormData>) => void
  errors: Record<string, string>
}

export default function ContactInfoStep({ formData, updateFormData, errors }: ContactInfoStepProps) {
  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Contact Information</h3>
        <p className="text-gray-600">How can we reach you?</p>
      </div>

      {/* Email and Phone */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="emailAddress">Email Address *</Label>
          <Input
            id="emailAddress"
            type="email"
            value={formData.emailAddress}
            onChange={(e) => updateFormData({ emailAddress: e.target.value })}
            placeholder="Enter your email address"
            className={errors.emailAddress ? "border-red-500" : ""}
          />
          {errors.emailAddress && <p className="text-red-500 text-sm">{errors.emailAddress}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="phoneNumber">Phone Number *</Label>
          <Input
            id="phoneNumber"
            type="tel"
            value={formData.phoneNumber}
            onChange={(e) => updateFormData({ phoneNumber: e.target.value })}
            placeholder="Enter your phone number"
            className={errors.phoneNumber ? "border-red-500" : ""}
          />
          {errors.phoneNumber && <p className="text-red-500 text-sm">{errors.phoneNumber}</p>}
        </div>
      </div>

      {/* Residential Address */}
      <div className="space-y-2">
        <Label htmlFor="residentialAddress">Residential Address *</Label>
        <Textarea
          id="residentialAddress"
          value={formData.residentialAddress}
          onChange={(e) => updateFormData({ residentialAddress: e.target.value })}
          placeholder="Enter your full residential address"
          rows={4}
          className={errors.residentialAddress ? "border-red-500" : ""}
        />
        {errors.residentialAddress && <p className="text-red-500 text-sm">{errors.residentialAddress}</p>}
      </div>

      {/* Info Box */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <h4 className="font-medium text-green-900 mb-2">Contact Verification</h4>
        <p className="text-green-700 text-sm">
          We'll use this information to contact you about your membership application and important cooperative updates.
          Please ensure your contact details are current and accurate.
        </p>
      </div>
    </div>
  )
}
