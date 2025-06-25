"use client"

import type React from "react"

import { Input } from "@/components/atoms/ui/input"
import { Label } from "@/components/atoms/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/atoms/ui/select"
import { Button } from "@/components/atoms/ui/button"
import { Upload, X } from "lucide-react"
import { useState, useRef } from "react"

interface FormData {
  firstName: string
  middleName: string
  lastName: string
  dateOfBirth: string
  maritalStatus: string
  profilePhoto: File | null
}

interface PersonalInfoStepProps {
  formData: FormData
  updateFormData: (data: Partial<FormData>) => void
  errors: Record<string, string>
}

export default function PersonalInfoStep({ formData, updateFormData, errors }: PersonalInfoStepProps) {
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      updateFormData({ profilePhoto: file })
      const reader = new FileReader()
      reader.onload = (e) => {
        setPhotoPreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const removePhoto = () => {
    updateFormData({ profilePhoto: null })
    setPhotoPreview(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Personal Information</h3>
        <p className="text-gray-600">Let's start with your basic personal details</p>
      </div>

      {/* Profile Photo Upload */}
      <div className="flex flex-col items-center space-y-4">
        <div className="relative">
          {photoPreview ? (
            <div className="relative">
              <img
                src={photoPreview || "/placeholder.svg"}
                alt="Profile preview"
                className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-lg"
              />
              <button
                type="button"
                onClick={removePhoto}
                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center border-4 border-white shadow-lg">
              <Upload className="w-8 h-8 text-gray-400" />
            </div>
          )}
        </div>
        <div className="text-center">
          <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()} className="mb-2">
            {photoPreview ? "Change Photo" : "Upload Photo"}
          </Button>
          <p className="text-xs text-gray-500">Optional - JPG, PNG up to 5MB</p>
        </div>
        <input ref={fileInputRef} type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
      </div>

      {/* Name Fields */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="firstName">First Name *</Label>
          <Input
            id="firstName"
            value={formData.firstName}
            onChange={(e) => updateFormData({ firstName: e.target.value })}
            placeholder="Enter your first name"
            className={errors.firstName ? "border-red-500" : ""}
          />
          {errors.firstName && <p className="text-red-500 text-sm">{errors.firstName}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="middleName">Middle Name</Label>
          <Input
            id="middleName"
            value={formData.middleName}
            onChange={(e) => updateFormData({ middleName: e.target.value })}
            placeholder="Enter your middle name"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="lastName">Last Name *</Label>
          <Input
            id="lastName"
            value={formData.lastName}
            onChange={(e) => updateFormData({ lastName: e.target.value })}
            placeholder="Enter your last name"
            className={errors.lastName ? "border-red-500" : ""}
          />
          {errors.lastName && <p className="text-red-500 text-sm">{errors.lastName}</p>}
        </div>
      </div>

      {/* Date of Birth and Marital Status */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="dateOfBirth">Date of Birth *</Label>
          <Input
            id="dateOfBirth"
            type="date"
            value={formData.dateOfBirth}
            onChange={(e) => updateFormData({ dateOfBirth: e.target.value })}
            className={errors.dateOfBirth ? "border-red-500" : ""}
          />
          {errors.dateOfBirth && <p className="text-red-500 text-sm">{errors.dateOfBirth}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="maritalStatus">Marital Status</Label>
          <Select value={formData.maritalStatus} onValueChange={(value: any) => updateFormData({ maritalStatus: value })}>
            <SelectTrigger>
              <SelectValue placeholder="Select marital status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="single">Single</SelectItem>
              <SelectItem value="married">Married</SelectItem>
              <SelectItem value="divorced">Divorced</SelectItem>
              <SelectItem value="widowed">Widowed</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  )
}
