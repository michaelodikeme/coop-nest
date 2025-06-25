import { Card, CardContent, CardHeader, CardTitle } from "@/components/atoms/ui/card"
import { Button } from "@/components/atoms/ui/button"
import { CheckCircle, Clock, Bell, Home } from "lucide-react"
import Link from "next/link"

export default function SuccessStep() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <Card className="shadow-lg">
          <CardHeader className="text-center pb-6">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <CardTitle className="text-2xl text-green-800">Application Submitted Successfully!</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center">
              <p className="text-gray-600 mb-4">
                Thank you for applying to join our cooperative. Your membership application has been received and is now
                under review.
              </p>
            </div>

            {/* Status Timeline */}
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900 mb-3">Application Status</h3>

              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <CheckCircle className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Application Submitted</p>
                  <p className="text-sm text-gray-600">Your application has been successfully submitted</p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-yellow-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Clock className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Pending Review</p>
                  <p className="text-sm text-gray-600">Awaiting approval from treasurer (Level 2 approver)</p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-gray-300 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Bell className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="font-medium text-gray-500">Approval Notification</p>
                  <p className="text-sm text-gray-500">You'll be notified once your application is approved</p>
                </div>
              </div>
            </div>

            {/* Next Steps */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-medium text-blue-900 mb-2">What's Next?</h4>
              <ul className="space-y-1 text-blue-700 text-sm">
                <li>• Check your email for confirmation and updates</li>
                <li>• Your application will be reviewed within 3-5 business days</li>
                <li>• You'll receive notifications about any status changes</li>
                <li>• Once approved, you can access all member benefits</li>
              </ul>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <Button asChild className="flex-1">
                <Link href="/" className="flex items-center justify-center gap-2">
                  <Home className="w-4 h-4" />
                  Return to Home
                </Link>
              </Button>
              <Button variant="outline" asChild className="flex-1">
                <Link href="/contact" className="flex items-center justify-center gap-2">
                  <Bell className="w-4 h-4" />
                  Contact Support
                </Link>
              </Button>
            </div>

            {/* Reference Information */}
            <div className="text-center pt-4 border-t">
              <p className="text-sm text-gray-500">
                Application Reference:{" "}
                <span className="font-mono font-medium">APP-{Date.now().toString().slice(-8)}</span>
              </p>
              <p className="text-xs text-gray-400 mt-1">Keep this reference number for your records</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
