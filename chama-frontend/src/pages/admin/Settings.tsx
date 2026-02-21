import { useState, useEffect } from 'react'
import { Settings as SettingsIcon, DollarSign, Calendar, Percent, Users, Lock, Save } from 'lucide-react'
import { Card, CardHeader, CardContent } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Badge } from '../../components/ui/Badge'
import { formatKES } from '../../lib/format'
import { useChamaId } from '../../hooks/useChamaId'
import api, { chamaRoute } from '../../lib/api'

type PasswordMessage = { type: 'success' | 'error'; text: string }

export function AdminSettings() {
  const chamaId = useChamaId()
  const [contributionAmount, setContributionAmount] = useState('')
  const [cycleStartDay, setCycleStartDay] = useState('1')
  const [penaltyRate, setPenaltyRate] = useState('')
  const [loanInterestRate, setLoanInterestRate] = useState('')
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordMessage, setPasswordMessage] = useState<PasswordMessage | null>(null)
  const [changingPassword, setChangingPassword] = useState(false)

  useEffect(() => {
    if (chamaId) {
      api
        .get(chamaRoute(chamaId, '/context'))
        .then((res) => {
          const chama = res.data.data
          if (chama) {
            setContributionAmount(String(chama.contributionAmount ?? ''))
            setCycleStartDay(String(chama.cycleDay ?? 1))
            setPenaltyRate(String(chama.penaltyRate ?? ''))
            setLoanInterestRate(String(chama.loanInterestRate ?? ''))
          }
        })
        .catch(() => setMessage({ type: 'error', text: 'Failed to load settings' }))
        .finally(() => setLoading(false))
    }
  }, [chamaId])

  const handleSaveChamaSettings = async () => {
    if (!chamaId) return
    const amount = parseInt(contributionAmount, 10)
    const cycle = parseInt(cycleStartDay, 10)
    const penalty = parseFloat(penaltyRate)
    const interest = parseFloat(loanInterestRate)
    if (isNaN(amount) || amount < 1) {
      setMessage({ type: 'error', text: 'Contribution amount must be a positive number' })
      return
    }
    if (isNaN(cycle) || cycle < 1 || cycle > 31) {
      setMessage({ type: 'error', text: 'Cycle day must be between 1 and 31' })
      return
    }
    setSaving(true)
    setMessage(null)
    try {
      await api.patch(chamaRoute(chamaId, '/settings'), {
        contributionAmount: amount,
        cycleDay: cycle,
        loanInterestRate: isNaN(interest) ? undefined : interest,
        penaltyRate: isNaN(penalty) ? undefined : penalty,
      })
      setMessage({ type: 'success', text: 'Chama settings updated successfully!' })
    } catch (err: any) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to update settings' })
    } finally {
      setSaving(false)
    }
  }

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      setPasswordMessage({ type: 'error', text: 'Passwords do not match' })
      return
    }
    if (newPassword.length < 6) {
      setPasswordMessage({ type: 'error', text: 'Password must be at least 6 characters' })
      return
    }
    if (!currentPassword.trim()) {
      setPasswordMessage({ type: 'error', text: 'Enter your current password' })
      return
    }
    setChangingPassword(true)
    setPasswordMessage(null)
    try {
      await api.post('/auth/change-password', { currentPassword, newPassword })
      setPasswordMessage({ type: 'success', text: 'Password changed successfully!' })
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (err: any) {
      setPasswordMessage({
        type: 'error',
        text: err.response?.data?.message || 'Failed to change password. Check your current password.',
      })
    } finally {
      setChangingPassword(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-800">Settings</h1>
        <p className="text-sm text-slate-500">Manage chama settings and configurations</p>
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

      {/* Chama Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <SettingsIcon className="text-blue-600" size={20} />
            <h2 className="font-semibold text-slate-800">Chama Settings</h2>
          </div>
          <p className="text-sm text-slate-500">Configure contribution and loan rules</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Monthly Contribution Amount"
              type="number"
              value={contributionAmount}
              onChange={(e) => setContributionAmount(e.target.value)}
              icon={<DollarSign size={18} />}
            />
            <Input
              label="Cycle Start Day (1-31)"
              type="number"
              min="1"
              max="31"
              value={cycleStartDay}
              onChange={(e) => setCycleStartDay(e.target.value)}
              icon={<Calendar size={18} />}
            />
            <Input
              label="Penalty Rate (%)"
              type="number"
              step="0.1"
              value={penaltyRate}
              onChange={(e) => setPenaltyRate(e.target.value)}
              icon={<Percent size={18} />}
            />
            <Input
              label="Loan Interest Rate (%)"
              type="number"
              step="0.1"
              value={loanInterestRate}
              onChange={(e) => setLoanInterestRate(e.target.value)}
              icon={<Percent size={18} />}
            />
          </div>
          <div className="rounded-lg bg-blue-50 p-4">
            <p className="text-sm font-medium text-blue-900 mb-2">Preview:</p>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Monthly contribution: {formatKES(parseInt(contributionAmount) || 0)}</li>
              <li>• Cycle starts on day {cycleStartDay} of each month</li>
              <li>• Penalty rate: {penaltyRate || '0'}%</li>
              <li>• Loan interest rate: {loanInterestRate}% per month</li>
            </ul>
          </div>
          <Button onClick={handleSaveChamaSettings} disabled={saving || loading} loading={saving} className="w-full sm:w-auto">
            <Save size={18} />
            {saving ? 'Saving...' : 'Save Settings'}
          </Button>
        </CardContent>
      </Card>

      {/* Roles & Permissions */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Users className="text-blue-600" size={20} />
            <h2 className="font-semibold text-slate-800">Roles & Permissions</h2>
          </div>
          <p className="text-sm text-slate-500">View role permissions matrix</p>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-3 px-4 font-semibold text-slate-800">Permission</th>
                  <th className="text-center py-3 px-4 font-semibold text-slate-800">Member</th>
                  <th className="text-center py-3 px-4 font-semibold text-slate-800">Admin</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {[
                  { permission: 'View Dashboard', member: true, admin: true },
                  { permission: 'Make Contributions', member: true, admin: true },
                  { permission: 'Request Loans', member: true, admin: true },
                  { permission: 'Manage Members', member: false, admin: true },
                  { permission: 'Approve Loans', member: false, admin: true },
                  { permission: 'View Reports', member: false, admin: true },
                  { permission: 'Manage Settings', member: false, admin: true },
                ].map((row, idx) => (
                  <tr key={idx}>
                    <td className="py-3 px-4 text-slate-700">{row.permission}</td>
                    <td className="py-3 px-4 text-center">
                      {row.member ? (
                        <Badge variant="success">Yes</Badge>
                      ) : (
                        <Badge variant="neutral">No</Badge>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {row.admin ? (
                        <Badge variant="success">Yes</Badge>
                      ) : (
                        <Badge variant="neutral">No</Badge>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-4 text-xs text-slate-500">
            Note: Role management endpoint not yet implemented. This is a UI preview.
          </p>
        </CardContent>
      </Card>

      {/* Security - Change password */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Lock className="text-blue-600" size={20} />
            <h2 className="font-semibold text-slate-800">Security</h2>
          </div>
          <p className="text-sm text-slate-500">Change your account password</p>
        </CardHeader>
        <CardContent className="space-y-4">
          {passwordMessage && (
            <div
              className={`rounded-lg p-3 text-sm ${
                passwordMessage.type === 'success' ? 'bg-emerald-50 text-emerald-800' : 'bg-red-50 text-red-800'
              }`}
            >
              {passwordMessage.text}
            </div>
          )}
          <Input
            label="Current password"
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            placeholder="Enter current password"
            icon={<Lock size={18} />}
          />
          <Input
            label="New password"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="At least 6 characters"
            icon={<Lock size={18} />}
          />
          <Input
            label="Confirm new password"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Confirm new password"
            icon={<Lock size={18} />}
          />
          <Button
            variant="secondary"
            onClick={handleChangePassword}
            disabled={changingPassword}
            loading={changingPassword}
          >
            <Lock size={18} />
            {changingPassword ? 'Changing...' : 'Change Password'}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
