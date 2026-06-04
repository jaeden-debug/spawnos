'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface FishPhotoUploaderProps {
  fishId: string
  currentUrl?: string | null
  onUpload: (url: string) => void
}

export default function FishPhotoUploader({ fishId, currentUrl, onUpload }: FishPhotoUploaderProps) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 5 * 1024 * 1024) {
      setError('File must be under 5MB')
      return
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    if (!allowedTypes.includes(file.type)) {
      setError('Only JPEG, PNG, WebP, or GIF allowed')
      return
    }

    setError(null)
    setUploading(true)

    try {
      const supabase = createClient()
      const ext = file.name.split('.').pop()
      const path = `fish-photos/${fishId}/${Date.now()}.${ext}`

      const { error: uploadError } = await supabase.storage
        .from('fish-photos')
        .upload(path, file, { upsert: true })

      if (uploadError) throw uploadError

      const { data } = supabase.storage.from('fish-photos').getPublicUrl(path)
      onUpload(data.publicUrl)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="space-y-3">
      <label className="block text-xs font-medium text-spawn-muted-text uppercase tracking-wider">
        Fish Photo
      </label>
      <div className="flex items-center gap-3">
        <label className="cursor-pointer px-4 py-2.5 rounded-xl border border-spawn-border bg-spawn-surface text-sm text-spawn-muted-text hover:border-spawn-cyan/40 hover:text-spawn-text transition-colors">
          {uploading ? 'Uploading...' : 'Upload Photo'}
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
            disabled={uploading}
          />
        </label>
        {currentUrl && (
          <span className="text-xs text-emerald-400">Photo saved</span>
        )}
      </div>
      {error && <p className="text-xs text-rose-400">{error}</p>}
      <p className="text-xs text-spawn-muted">
        Or use the Photo URL field below. Supabase Storage bucket &quot;fish-photos&quot; must be created first.
      </p>
    </div>
  )
}
