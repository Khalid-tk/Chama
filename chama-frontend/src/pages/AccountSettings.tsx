import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Lock, Bell, ArrowLeft } from 'lucide-react'
import { Card, CardHeader, CardContent } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Badge } from '../components/ui/Badge'
import { useChamaStore } from '../store/chamaStore'
import api from '../lib/api'

export function AccountSettings() {
  const navigate = useNavigate()
  const { activeChama } = useChamaStore()
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [dueReminders, setDueReminders] = useState(localStorage.getItem('dueReminders') === 'true')
  const [mpesaUpdates, setMpesaUpdates] = useState(localStorage.getItem('mpesaUpdates') === 'true')
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

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
      await api.post('/api/auth/change-password', { currentPassword, newPassword })
      setMessage({ type: 'success', text: 'Password changed successfully!' })
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (err: any) {
      setMessage({
        type: 'error',
        text: err.response?.data?.message || 'Failed to change password.',
      })
    } finally {
      setSaving(false)
    }
  }

  const handleToggleNotification = (key: string, value: boolean) => {
    localStorage.setItem(key, value.toString())
    if (key === 'dueReminders') setDueReminders(value)
    else setMpesaUpdates(value)
    setMessage({ type: 'success', text: 'Preferences saved!' })
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
          <h1 className="text-2xl font-semibold text-slate-800">Settings</h1>
          <p className="text-sm text-slate-500">Account settings and preferences</p>
        </div>
        <Button variant="secondary" size="sm" onClick={goToDashboard} className="gap-2">
          <ArrowLeft size={18} />
          Back to dashboard
        </Button>
      </div>

      {message && (
        <Card className={message.type === 'success' ? 'border-emerald-200 bg-emerald-50' : 'border-red-200 bg-red-50'}>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Badge variant={message.type === 'success' ? 'success' : 'danger'}>{message.type === 'success' ? 'Success' : 'Error'}</Badge>
              <span className="text-sm">{message.text}</span>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Lock className="text-blue-600" size={20} />
            <h2 className="font-semibold text-slate-800">Change password</h2>
          </div>
          <p className="text-sm text-slate-500">Update your password.</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input label="Current password" type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} placeholder="••••••••" />
          <Input label="New password" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="••••••••" />
          <Input label="Confirm new password" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="••••••••" />
          <Button onClick={handleChangePassword} disabled={saving} className="gap-2">
            <Lock size={18} />
            {saving ? 'Changing...' : 'Change password'}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Bell className="text-blue-600" size={20} />
            <h2 className="font-semibold text-slate-800">Notifications</h2>
          </div>
          <p className="text-sm text-slate-500">Notification preferences</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="font-medium text-slate-800">Due date reminders</p>
              <p className="text-sm text-slate-500">Notify before contribution due dates</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer shrink-0">
              <input type="checkbox" checked={dueReminders} onChange={(e) => handleToggleNotification('dueReminders', e.target.checked)} className="sr-only peer" />
              <div className="w-11 h-6 bg-slate-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600" />
            </label>
          </div>
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="font-medium text-slate-800">M-Pesa payment updates</p>
              <p className="text-sm text-slate-500">Payment status notifications</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer shrink-0">
              <input type="checkbox" checked={mpesaUpdates} onChange={(e) => handleToggleNotification('mpesaUpdates', e.target.checked)} className="sr-only peer" />
              <div className="w-11 h-6 bg-slate-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600" />
            </label>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
