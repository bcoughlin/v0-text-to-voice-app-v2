"use client"

import type React from "react"

import { Input } from "@/components/ui/input"
import { useState, useEffect } from "react"

interface PhoneInputProps {
  value: string
  onChange: (value: string) => void
}

export function PhoneInput({ value, onChange }: PhoneInputProps) {
  const [inputValue, setInputValue] = useState(value)

  useEffect(() => {
    setInputValue(value)
  }, [value])

  const formatPhoneNumber = (input: string) => {
    // Remove all non-numeric characters
    const cleaned = input.replace(/\D/g, "")

    // Format as (XXX) XXX-XXXX
    if (cleaned.length <= 3) {
      return cleaned
    } else if (cleaned.length <= 6) {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3)}`
    } else {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6, 10)}`
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value
    const formattedValue = formatPhoneNumber(rawValue)
    setInputValue(formattedValue)
    onChange(formattedValue)
  }

  return (
    <Input type="tel" placeholder="(555) 123-4567" value={inputValue} onChange={handleChange} className="font-mono" />
  )
}
