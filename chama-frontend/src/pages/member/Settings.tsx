import { useState, useEffect } from 'react'
import { User, Lock, Bell, Save } from 'lucide-react'
import { Card, CardHeader, CardContent } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Badge } from '../../components/ui/Badge'
import { useAuthStore } from '../../store/authStore'
import api from '../../lib/api'

export function MemberSettings() {
  const { user } = useAuthStore()
  const [name, setName] = useState(user?.fullName || '')
  const [phone, setPhone] = useState(user?.phone || '')
  const [email, setEmail] = useState(user?.email || '')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [dueReminders, setDueReminders] = useState(localStorage.getItem('dueReminders') === 'true')
  const [mpesaUpdates, setMpesaUpdates] = useState(localStorage.getItem('mpesaUpdates') === 'true')
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const handleSaveProfile = async () => {
    setSaving(true)
    setMessage(null)

    // TODO: Replace with actual API call
    // await updateProfile({ name, phone, email })
    try {
      await new Promise(resolve => setTimeout(resolve, 1000))
      setMessage({ type: 'success', text: 'Profile updated successfully!' })
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to update profile. Please try again.' })
    } finally {
      setSaving(false)
    }
  }

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: 'Passwords do not match' })
      return
    }

    if (newPassword.length < 6) {
      setMessage({ type: 'error', text: 'Password must be at least 6 characters' })
      return
    }

    if (!currentPassword.trim()) {
      setMessage({ type: 'error', text: 'Enter your current password' })
      return
    }

    setSaving(true)
    setMessage(null)

    try {
      await api.post('/auth/change-password', {
        currentPassword,
        newPassword,
      })
      setMessage({ type: 'success', text: 'Password changed successfully!' })
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to change password. Please check your current password.'
      setMessage({ type: 'error', text: msg })
    } finally {
      setSaving(false)
    }
  }

  const handleToggleNotification = (key: string, value: boolean) => {
    localStorage.setItem(key, value.toString())
    if (key === 'dueReminders') {
      setDueReminders(value)
    } else {
      setMpesaUpdates(value)
    }
    setMessage({ type: 'success', text: 'Preferences saved!' })
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-800">Settings</h1>
        <p className="text-sm text-slate-500">Manage your account settings and preferences</p>
      </div>

      {message && (
        <Card className={message.type === 'success' ? 'border-emerald-200 bg-emerald-50' : 'border-red-200 bg-red-50'}>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Badge variant={message.type === 'success' ? 'success' : 'danger'}>
                {message.type === 'success' ? 'Success' : 'Error'}
              </Badge>
              <span className="text-sm">{message.text}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Profile Information */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <User className="text-blue-600" size={20} />
            <h2 className="font-semibold text-slate-800">Profile Information</h2>
          </div>
          <p className="text-sm text-slate-500">Update your personal information</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            label="Full Name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            icon={<User size={18} />}
          />
          <Input
            label="Phone Number"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
          <Input
            label="Email Address"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <Button onClick={handleSaveProfile} disabled={saving} className="w-full sm:w-auto">
            <Save size={18} />
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </CardContent>
      </Card>

      {/* Security */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Lock className="text-blue-600" size={20} />
            <h2 className="font-semibold text-slate-800">Security</h2>
          </div>
          <p className="text-sm text-slate-500">Change your password</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            label="Current Password"
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            placeholder="••••••••"
          />
          <Input
            label="New Password"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="••••••••"
          />
          <Input
            label="Confirm New Password"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="••••••••"
          />
          <Button onClick={handleChangePassword} disabled={saving} className="w-full sm:w-auto">
            <Lock size={18} />
            {saving ? 'Changing...' : 'Change Password'}
          </Button>
          <p className="text-xs text-slate-500">
            Note: Password change endpoint not yet implemented. This is a UI placeholder.
          </p>
        </CardContent>
      </Card>

      {/* Preferences */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Bell className="text-blue-600" size={20} />
            <h2 className="font-semibold text-slate-800">Notifications</h2>
          </div>
          <p className="text-sm text-slate-500">Manage your notification preferences</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-slate-800">Due Date Reminders</p>
              <p className="text-sm text-slate-500">Get notified before contribution due dates</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={dueReminders}
                onChange={(e) => handleToggleNotification('dueReminders', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-slate-800">Mpesa Payment Updates</p>
              <p className="text-sm text-slate-500">Receive notifications for payment status changes</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={mpesaUpdates}
                onChange={(e) => handleToggleNotification('mpesaUpdates', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
