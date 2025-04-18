"use client"

import type React from "react"

import { Textarea } from "@/components/ui/textarea"
import { useState, useEffect } from "react"

interface CharacterCounterProps {
  value: string
  onChange: (value: string) => void
  maxLength: number
}

export function CharacterCounter({ value, onChange, maxLength }: CharacterCounterProps) {
  const [inputValue, setInputValue] = useState(value)
  const [charCount, setCharCount] = useState(0)

  useEffect(() => {
    setInputValue(value)
    setCharCount(value.length)
  }, [value])

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value
    if (newValue.length <= maxLength) {
      setInputValue(newValue)
      setCharCount(newValue.length)
      onChange(newValue)
    }
  }

  return (
    <div className="relative">
      <Textarea
        placeholder="Enter your message (max 300 characters)"
        value={inputValue}
        onChange={handleChange}
        className="resize-none min-h-[120px]"
      />
      <div
        className={`absolute bottom-2 right-2 text-xs ${charCount > maxLength * 0.9 ? "text-red-500" : "text-gray-500"}`}
      >
        {charCount}/{maxLength}
      </div>
    </div>
  )
}
