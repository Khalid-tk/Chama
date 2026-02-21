import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { User, Camera, Trash2, ArrowLeft } from 'lucide-react'
import { Card, CardHeader, CardContent } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { useAuthStore } from '../store/authStore'
import { useChamaStore } from '../store/chamaStore'
import api from '../lib/api'

function getInitials(name: string): string {
  return name?.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2) || 'U'
}

export function Profile() {
  const navigate = useNavigate()
  const { user, updateUser } = useAuthStore()
  const { activeChama } = useChamaStore()
  const [uploading, setUploading] = useState(false)
  const [removing, setRemoving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const avatarUrl = user?.avatarUrl ?? preview

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    setError(null)
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setError('Please select an image (JPEG, PNG or WebP).')
      return
    }
    if (file.size > 2 * 1024 * 1024) {
      setError('Image must be under 2MB.')
      return
    }
    const reader = new FileReader()
    reader.onload = () => setPreview(reader.result as string)
    reader.readAsDataURL(file)
  }

  const handleUpload = async () => {
    const file = fileInputRef.current?.files?.[0]
    if (!file) {
      setError('Select an image first.')
      return
    }
    setUploading(true)
    setError(null)
    try {
      const formData = new FormData()
      formData.append('avatar', file)
      const res = await api.post('/api/users/me/avatar', formData, {
        headers: { 'Content-Type': undefined } as any,
      })
      const url = res.data?.data?.avatarUrl
      if (url) {
        updateUser({ avatarUrl: url })
        setPreview(null)
        if (fileInputRef.current) fileInputRef.current.value = ''
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Upload failed.')
    } finally {
      setUploading(false)
    }
  }

  const handleRemove = async () => {
    setRemoving(true)
    setError(null)
    try {
      await api.delete('/api/users/me/avatar')
      updateUser({ avatarUrl: null })
      setPreview(null)
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to remove picture.')
    } finally {
      setRemoving(false)
    }
  }

  const goToDashboard = () => {
    if (activeChama) {
      const base = ['ADMIN', 'TREASURER', 'CHAIR', 'AUDITOR'].includes(activeChama.role) ? 'admin' : 'member'
      navigate(`/${base}/${activeChama.chamaId}/dashboard`)
    } else {
      navigate('/select-chama')
    }
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-semibold text-slate-800">Profile</h1>
          <p className="text-sm text-slate-500">Your account and profile picture</p>
        </div>
        <Button variant="secondary" size="sm" onClick={goToDashboard} className="gap-2">
          <ArrowLeft size={18} />
          Back to dashboard
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <User className="text-blue-600" size={20} />
            <h2 className="font-semibold text-slate-800">Profile picture</h2>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row items-start gap-6">
            <div className="shrink-0">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt=""
                  className="h-24 w-24 rounded-full object-cover border-4 border-slate-100"
                />
              ) : (
                <div className="flex h-24 w-24 items-center justify-center rounded-full bg-blue-600 text-2xl font-semibold text-white">
                  {getInitials(user?.fullName ?? '')}
                </div>
              )}
            </div>
            <div className="flex-1 space-y-3 min-w-0">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleFileChange}
                className="hidden"
              />
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  className="gap-2"
                >
                  <Camera size={18} />
                  Choose image
                </Button>
                {preview && (
                  <Button size="sm" onClick={handleUpload} loading={uploading} className="gap-2">
                    Upload
                  </Button>
                )}
                {(user?.avatarUrl || preview) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleRemove}
                    loading={removing}
                    className="gap-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 size={18} />
                    Remove picture
                  </Button>
                )}
              </div>
              <p className="text-xs text-slate-500">JPEG, PNG or WebP. Max 2MB.</p>
            </div>
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <h2 className="font-semibold text-slate-800">Account info</h2>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="text-sm"><span className="text-slate-500">Name:</span> {user?.fullName}</p>
          <p className="text-sm"><span className="text-slate-500">Email:</span> {user?.email}</p>
          <p className="text-sm"><span className="text-slate-500">Phone:</span> {user?.phone || '—'}</p>
        </CardContent>
      </Card>
    </div>
  )
}
