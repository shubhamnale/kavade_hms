import React, { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { usersAPI } from '../api'
import { Card, Field, Alert, BtnSpinner, inputStyle, Btn, PageHeader } from '../components/UI'
import { theme, ROLE_COLORS } from '../theme'

export default function ProfilePage() {
  const { user, updateUser } = useAuth()
  const [name,            setName]            = useState(user.name)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword,     setNewPassword]     = useState('')
  const [saving,          setSaving]          = useState(false)
  const [error,           setError]           = useState('')
  const [success,         setSuccess]         = useState('')

  const handleSave = async () => {
    setSaving(true); setError(''); setSuccess('')
    try {
      const payload = { name }
      if (currentPassword && newPassword) {
        payload.currentPassword = currentPassword
        payload.newPassword     = newPassword
      }
      await usersAPI.updateProfile(payload)
      updateUser({ name })
      setSuccess('Profile updated successfully.')
      setCurrentPassword(''); setNewPassword('')
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to update profile.')
    } finally { setSaving(false) }
  }

  return (
    <div className="page-content" style={{ padding:28, maxWidth:520 }}>
      <PageHeader title="My Profile" subtitle="Update your name or password" />

      <Card>
        <div style={{ display:'flex', alignItems:'center', gap:16, marginBottom:24, padding:'14px 16px', background:'#F8FAFC', borderRadius:10 }}>
          <div style={{ width:52, height:52, borderRadius:'50%', background:ROLE_COLORS[user.role], display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontWeight:700, fontSize:22 }}>
            {user.name[0]}
          </div>
          <div>
            <p style={{ fontWeight:700, fontSize:15, color:theme.primary }}>{user.name}</p>
            <p style={{ fontSize:12, color:theme.muted }}>{user.username} · <span style={{ textTransform:'capitalize' }}>{user.role}</span></p>
          </div>
        </div>

        <Alert type="err" msg={error} />
        <Alert type="ok"  msg={success} />

        <Field label="Display Name">
          <input style={inputStyle} value={name} onChange={e => setName(e.target.value)} />
        </Field>

        <p style={{ fontSize:12, fontWeight:700, color:theme.muted, textTransform:'uppercase', letterSpacing:'.5px', margin:'8px 0 14px' }}>Change Password (optional)</p>

        <Field label="Current Password">
          <input style={inputStyle} type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} placeholder="Leave blank to keep current" />
        </Field>
        <Field label="New Password">
          <input style={inputStyle} type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="Min 6 characters" />
        </Field>

        <div style={{ display:'flex', justifyContent:'flex-end', marginTop:8 }}>
          <Btn onClick={handleSave} disabled={saving}>{saving && <BtnSpinner />} Save Changes</Btn>
        </div>
      </Card>
    </div>
  )
}
