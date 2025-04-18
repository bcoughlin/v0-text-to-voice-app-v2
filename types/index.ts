export interface Message {
  id: string
  body: string
  to_number: string
  status: string
  created_at: string
  error?: string
  sid?: string
  user_id?: string
  voice_setting_id?: string
}

export interface VoiceSetting {
  id: string
  user_id: string
  voice_name: string
  voice_model: string
  created_at: string
  updated_at: string
}

export interface User {
  id: string
  email: string
  created_at: string
  updated_at: string
}

export type OpenAIVoice = "alloy" | "echo" | "fable" | "onyx" | "nova" | "shimmer"
export type OpenAIModel = "tts-1" | "tts-1-hd"

export type ElevenLabsVoice = "Adam" | "Antoni" | "Arnold" | "Bella" | "Domi" | "Elli" | "Josh" | "Rachel" | "Sam"

export type VoiceProvider = "openai" | "elevenlabs"

export interface VoiceOption {
  id: string
  name: string
  provider: VoiceProvider
}
