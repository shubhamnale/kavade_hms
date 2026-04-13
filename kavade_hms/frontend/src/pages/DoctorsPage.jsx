import React, { useState, useEffect } from 'react'
import { doctorsAPI } from '../api'
import { Card, Spinner, PageHeader, Modal, Field, Alert, BtnSpinner, inputStyle, Btn } from '../components/UI'
import { theme } from '../theme'

export default function DoctorsPage({ doctors, loading, onDoctorAdded }) {
  const [list,   setList]   = useState(doctors)
  const [modal,  setModal]  = useState(false)
  const [form,   setForm]   = useState({ name:'', specialty:'', phone:'', email:'' })
  const [saving, setSaving] = useState(false)
  const [error,  setError]  = useState('')

  useEffect(() => { setList(doctors) }, [doctors])

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const handleAdd = async () => {
    if (!form.name || !form.specialty) return setError('Name and specialty are required.')
    setSaving(true); setError('')
    try {
      const { data } = await doctorsAPI.create({ ...form })
      setList(prev => [data.data, ...prev])
      if (onDoctorAdded) onDoctorAdded(data.data)
      setModal(false)
      setForm({ name:'', specialty:'', phone:'', email:'' })
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to add doctor.')
    } finally { setSaving(false) }
  }

  return (
    <div className="page-content" style={{ padding:28, animation:'fadeIn .35s ease' }}>
      <PageHeader title="Doctors" subtitle={`${list.length} registered doctors`}>
        <Btn onClick={() => setModal(true)}>＋ Add Doctor</Btn>
      </PageHeader>

      {loading ? <Spinner /> : (
        <div className="doctors-grid" style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
          {list.map(d => (
            <Card key={d._id} style={{ display:'flex', alignItems:'center', gap:16 }}>
              <div style={{ width:52, height:52, borderRadius:'50%', flexShrink:0, background:`linear-gradient(135deg,${theme.accent},${theme.primary})`, color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', fontSize:22, fontWeight:700 }}>
                {d.name[0].toUpperCase()}
              </div>
              <div style={{ flex:1 }}>
                <h3 style={{ fontSize:15, fontWeight:700, color:theme.primary }}>{d.name}</h3>
                <p style={{ fontSize:12, color:theme.muted }}>{d.specialty}</p>
                {d.phone && <p style={{ fontSize:11, color:theme.muted, marginTop:2 }}>📞 {d.phone}</p>}
              </div>
            </Card>
          ))}
          {list.length === 0 && <p style={{ color:theme.muted, gridColumn:'1/-1', textAlign:'center', padding:40 }}>No doctors registered yet</p>}
        </div>
      )}

      {modal && (
        <Modal title="Add New Doctor" onClose={() => setModal(false)} width={500}>
          <Alert type="err" msg={error} />
          <div className="doctors-grid" style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
            <Field label="Full Name *">
              <input style={inputStyle} value={form.name} onChange={e => set('name', e.target.value)} placeholder="Dr. Full Name" autoFocus />
            </Field>
            <Field label="Specialty *">
              <input style={inputStyle} value={form.specialty} onChange={e => set('specialty', e.target.value)} placeholder="e.g. Cardiologist" />
            </Field>
            <Field label="Phone">
              <input style={inputStyle} value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="Mobile number" />
            </Field>
            <Field label="Email">
              <input style={inputStyle} value={form.email} onChange={e => set('email', e.target.value)} placeholder="doctor@hospital.com" />
            </Field>
          </div>
          <p style={{ fontSize:11, color:theme.muted, marginBottom:16 }}>
            💡 Consultation fee is entered by the doctor during each patient consultation.
          </p>
          <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
            <Btn outline onClick={() => setModal(false)}>Cancel</Btn>
            <Btn onClick={handleAdd} disabled={saving}>{saving && <BtnSpinner />} Add Doctor</Btn>
          </div>
        </Modal>
      )}
    </div>
  )
}
