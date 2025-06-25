"use client"

import React from "react"

import { useState } from "react"
import { Button } from "@/components/atoms/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/atoms/ui/card"
import { Progress } from "@/components/atoms/ui/progress"
import { CheckCircle, ArrowLeft, ArrowRight, User, Briefcase, Phone, Users, FileCheck } from "lucide-react"
import PersonalInfoStep from "@/components/organisms/auth/registration/personal-info-step"
import EmploymentInfoStep from "@/components/organisms/auth/registration/employment-info-step"
import ContactInfoStep from "@/components/organisms/auth/registration/contact-info-step" 
import NextOfKinStep from "@/components/organisms/auth/registration/next-of-kin-step"
import ReviewStep from "@/components/organisms/auth/registration/review-step"
import SuccessStep from "@/components/organisms/auth/registration/success-step"

interface FormData {
  // Personal Information
  firstName: string
  middleName: string
  lastName: string
  dateOfBirth: string
  maritalStatus: string
  profilePhoto: File | null

  // Employment Information
  erpId: string
  ippisId: string
  staffNo: string
  department: string
  dateOfEmployment: string

  // Contact Information
  emailAddress: string
  phoneNumber: string
  residentialAddress: string

  // Next of Kin Information
  nextOfKin: string
  relationshipOfNextOfKin: string
  nextOfKinPhoneNumber: string
  nextOfKinEmailAddress: string
}

const initialFormData: FormData = {
  firstName: "",
  middleName: "",
  lastName: "",
  dateOfBirth: "",
  maritalStatus: "",
  profilePhoto: null,
  erpId: "",
  ippisId: "",
  staffNo: "",
  department: "",
  dateOfEmployment: "",
  emailAddress: "",
  phoneNumber: "",
  residentialAddress: "",
  nextOfKin: "",
  relationshipOfNextOfKin: "",
  nextOfKinPhoneNumber: "",
  nextOfKinEmailAddress: "",
}

const steps = [
  { id: 1, title: "Personal Information", icon: User, description: "Basic personal details" },
  { id: 2, title: "Employment Details", icon: Briefcase, description: "Work-related information" },
  { id: 3, title: "Contact Information", icon: Phone, description: "Contact details" },
  { id: 4, title: "Next of Kin", icon: Users, description: "Emergency contact" },
  { id: 5, title: "Review & Submit", icon: FileCheck, description: "Confirm your details" },
]

export default function RegisterPage() {
  const [currentStep, setCurrentStep] = useState(1)
  const [formData, setFormData] = useState<FormData>(initialFormData)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const updateFormData = (data: Partial<FormData>) => {
    setFormData((prev) => ({ ...prev, ...data }))
    // Clear errors for updated fields
    const updatedFields = Object.keys(data)
    setErrors((prev) => {
      const newErrors = { ...prev }
      updatedFields.forEach((field) => delete newErrors[field])
      return newErrors
    })
  }

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {}

    switch (step) {
      case 1:
        if (!formData.firstName.trim()) newErrors.firstName = "First name is required"
        if (!formData.lastName.trim()) newErrors.lastName = "Last name is required"
        if (!formData.dateOfBirth) newErrors.dateOfBirth = "Date of birth is required"
        break
      case 2:
        if (!formData.erpId.trim()) newErrors.erpId = "ERP ID is required"
        if (!formData.ippisId.trim()) newErrors.ippisId = "IPPIS ID is required"
        if (!formData.staffNo.trim()) newErrors.staffNo = "Staff number is required"
        if (!formData.department.trim()) newErrors.department = "Department is required"
        if (!formData.dateOfEmployment) newErrors.dateOfEmployment = "Date of employment is required"
        break
      case 3:
        if (!formData.emailAddress.trim()) newErrors.emailAddress = "Email address is required"
        if (!formData.phoneNumber.trim()) newErrors.phoneNumber = "Phone number is required"
        if (!formData.residentialAddress.trim()) newErrors.residentialAddress = "Residential address is required"
        if (formData.emailAddress && !/\S+@\S+\.\S+/.test(formData.emailAddress)) {
          newErrors.emailAddress = "Please enter a valid email address"
        }
        break
      case 4:
        if (!formData.nextOfKin.trim()) newErrors.nextOfKin = "Next of kin name is required"
        if (!formData.relationshipOfNextOfKin.trim()) newErrors.relationshipOfNextOfKin = "Relationship is required"
        if (!formData.nextOfKinPhoneNumber.trim())
          newErrors.nextOfKinPhoneNumber = "Next of kin phone number is required"
        if (!formData.nextOfKinEmailAddress.trim()) newErrors.nextOfKinEmailAddress = "Next of kin email is required"
        if (formData.nextOfKinEmailAddress && !/\S+@\S+\.\S+/.test(formData.nextOfKinEmailAddress)) {
          newErrors.nextOfKinEmailAddress = "Please enter a valid email address"
        }
        break
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(prev + 1, steps.length))
    }
  }

  const handlePrevious = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1))
  }

  const handleSubmit = async () => {
    if (!validateStep(4)) return

    setIsSubmitting(true)
    try {
      // Prepare form data for submission
      const submissionData = {
        firstName: formData.firstName,
        middleName: formData.middleName || undefined,
        lastName: formData.lastName,
        dateOfEmployment: new Date(formData.dateOfEmployment),
        erpId: formData.erpId,
        ippisId: formData.ippisId,
        staffNo: formData.staffNo,
        department: formData.department,
        residentialAddress: formData.residentialAddress,
        emailAddress: formData.emailAddress,
        phoneNumber: formData.phoneNumber,
        nextOfKin: formData.nextOfKin,
        relationshipOfNextOfKin: formData.relationshipOfNextOfKin,
        nextOfKinPhoneNumber: formData.nextOfKinPhoneNumber,
        nextOfKinEmailAddress: formData.nextOfKinEmailAddress,
        profilePhoto: formData.profilePhoto ? "uploaded-photo-path" : undefined,
      }

      // Simulate API call - replace with actual API endpoint
      const response = await fetch("/api/members/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(submissionData),
      })

      if (response.ok) {
        setIsSubmitted(true)
      } else {
        const errorData = await response.json()
        setErrors({ submit: errorData.message || "Registration failed. Please try again." })
      }
    } catch (error) {
      setErrors({ submit: "Network error. Please check your connection and try again." })
    } finally {
      setIsSubmitting(false)
    }
  }

  const progress = (currentStep / steps.length) * 100

  if (isSubmitted) {
    return <SuccessStep />
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Join Our Cooperative</h1>
          <p className="text-gray-600">Complete your membership application in a few simple steps</p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            {steps.map((step, index) => {
              const StepIcon = step.icon
              const isActive = currentStep === step.id
              const isCompleted = currentStep > step.id

              return (
                <div key={step.id} className="flex flex-col items-center">
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center mb-2 transition-colors ${
                      isCompleted
                        ? "bg-green-500 text-white"
                        : isActive
                          ? "bg-blue-500 text-white"
                          : "bg-gray-200 text-gray-500"
                    }`}
                  >
                    {isCompleted ? <CheckCircle className="w-6 h-6" /> : <StepIcon className="w-6 h-6" />}
                  </div>
                  <div className="text-center">
                    <p className={`text-sm font-medium ${isActive ? "text-blue-600" : "text-gray-500"}`}>
                      {step.title}
                    </p>
                    <p className="text-xs text-gray-400 hidden sm:block">{step.description}</p>
                  </div>
                </div>
              )
            })}
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Form Card */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {React.createElement(steps[currentStep - 1].icon, { className: "w-5 h-5" })}
              {steps[currentStep - 1].title}
            </CardTitle>
            <CardDescription>{steps[currentStep - 1].description}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Step Content */}
            {currentStep === 1 && (
              <PersonalInfoStep formData={formData} updateFormData={updateFormData} errors={errors} />
            )}
            {currentStep === 2 && (
              <EmploymentInfoStep formData={formData} updateFormData={updateFormData} errors={errors} />
            )}
            {currentStep === 3 && (
              <ContactInfoStep formData={formData} updateFormData={updateFormData} errors={errors} />
            )}
            {currentStep === 4 && <NextOfKinStep formData={formData} updateFormData={updateFormData} errors={errors} />}
            {currentStep === 5 && <ReviewStep formData={formData} errors={errors} />}

            {/* Navigation Buttons */}
            <div className="flex justify-between pt-6 border-t">
              <Button
                variant="outline"
                onClick={handlePrevious}
                disabled={currentStep === 1}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Previous
              </Button>

              {currentStep < 5 ? (
                <Button onClick={handleNext} className="flex items-center gap-2">
                  Next
                  <ArrowRight className="w-4 h-4" />
                </Button>
              ) : (
                <Button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
                >
                  {isSubmitting ? "Submitting..." : "Submit Application"}
                  <CheckCircle className="w-4 h-4" />
                </Button>
              )}
            </div>

            {errors.submit && <div className="text-red-600 text-sm mt-2 p-3 bg-red-50 rounded-md">{errors.submit}</div>}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
