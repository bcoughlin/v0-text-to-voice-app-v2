"use client"

import type React from "react"

import Link from "next/link"
import { useState, useEffect } from "react"
import { PhoneInput } from "@/components/phone-input"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { makeQuickCall } from "./actions/make-quick-call"
import { Loader2 } from "lucide-react"

export default function HomePage() {
  const [phoneNumber, setPhoneNumber] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

  // Format the initial phone number on component mount
  useEffect(() => {
    // Set the initial formatted phone number
    setPhoneNumber("(402) 477-4105")
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Basic validation
    if (!phoneNumber.trim()) {
      toast({
        title: "Phone number is required",
        description: "Please enter a valid phone number",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    try {
      const result = await makeQuickCall(phoneNumber)

      if (result.error) {
        toast({
          title: "Error",
          description: result.error,
          variant: "destructive",
        })
      } else {
        toast({
          title: "Success!",
          description: "Your call has been initiated. You should receive it shortly.",
        })
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "An unexpected error occurred",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="container mx-auto py-10 flex flex-col items-center">
      <h1 className="text-4xl font-bold text-center">Home Page</h1>
      <Link href="/text-to-voice" className="mt-4 text-blue-600 hover:text-blue-800 hover:underline text-lg">
        Text to Voice
      </Link>

      <div className="mt-8 w-full max-w-md">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="phone-input" className="block text-sm font-medium text-gray-700 mb-1">
              Phone Number
            </label>
            <PhoneInput value={phoneNumber} onChange={setPhoneNumber} />
            <p className="mt-1 text-xs text-gray-500">Format: (XXX) XXX-XXXX</p>
          </div>
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Calling...
              </>
            ) : (
              "Call me"
            )}
          </Button>
        </form>
      </div>
    </div>
  )
}
