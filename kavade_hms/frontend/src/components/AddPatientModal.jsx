import React, { useState } from 'react'
import { patientsAPI } from '../api'
import { Modal, Field, Alert, BtnSpinner, inputStyle, Btn } from './UI'
import './AddPatientModal.css'

export default function AddPatientModal({ onClose, onSave }) {
  const [form,    setForm]    = useState({ name: '', age: '', gender: 'Male', phone: '', address: '' })
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')
  const [errors,  setErrors]  = useState({})

  /* ── Field setters with live validation ─────────────────── */
  const set = (k, v) => {
    if (k === 'name'  && v && !/^[a-zA-Z\s]*$/.test(v)) return
    if (k === 'phone' && v && !/^\d*$/.test(v))          return
    if (k === 'phone' && v.length > 10)                  return
    if (k === 'age'   && v && !/^\d*$/.test(v))          return
    if (k === 'age'   && v.length > 3)                   return

    setForm(p => ({ ...p, [k]: v }))
    if (errors[k]) setErrors(p => ({ ...p, [k]: '' }))
  }

  /* ── Validation ─────────────────────────────────────────── */
  const validate = () => {
    const e = {}
    if (!form.name.trim())                e.name  = 'Name is required.'
    else if (form.name.trim().length < 2) e.name  = 'Name must be at least 2 characters.'

    if (!form.age)                              e.age = 'Age is required.'
    else if (parseInt(form.age) < 1 || parseInt(form.age) > 120)
                                                e.age = 'Age must be between 1 and 120.'

    if (form.phone && form.phone.length !== 10) e.phone = 'Phone must be exactly 10 digits.'
    return e
  }

  /* ── Submit ──────────────────────────────────────────────── */
  const handleSave = async () => {
    const e = validate()
    if (Object.keys(e).length > 0) { setErrors(e); return }
    setLoading(true)
    setError('')
    try {
      const { data } = await patientsAPI.create({ ...form, age: parseInt(form.age) })
      onSave(data.data)
      onClose()
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to register patient.')
      setLoading(false)
    }
  }

  /* ── Error class helper ──────────────────────────────────── */
  const inputClass = k => errors[k] ? 'add-patient-input--error' : ''

  return (
    <Modal title="Register New Patient" onClose={onClose} width={480}>
      <Alert type="err" msg={error} />

      {/* Two-column grid: Name + Age, Gender + Phone */}
      <div className="add-patient-grid">

        <Field label="Full Name *">
          <input
            style={inputStyle}
            className={inputClass('name')}
            value={form.name}
            onChange={e => set('name', e.target.value)}
            placeholder="Patient name"
            autoFocus
          />
          {errors.name && <p className="add-patient-field-error">{errors.name}</p>}
        </Field>

        <Field label="Age *">
          <input
            style={inputStyle}
            className={inputClass('age')}
            value={form.age}
            onChange={e => set('age', e.target.value)}
            placeholder="Years"
            inputMode="numeric"
          />
          {errors.age && <p className="add-patient-field-error">{errors.age}</p>}
        </Field>

        <Field label="Gender">
          <select style={inputStyle} value={form.gender} onChange={e => set('gender', e.target.value)}>
            <option>Male</option>
            <option>Female</option>
            <option>Other</option>
          </select>
        </Field>

        <Field label="Phone">
          <input
            style={inputStyle}
            className={inputClass('phone')}
            value={form.phone}
            onChange={e => set('phone', e.target.value)}
            placeholder="10-digit number"
            inputMode="numeric"
            maxLength={10}
          />
          {errors.phone && <p className="add-patient-field-error">{errors.phone}</p>}
        </Field>

      </div>

      {/* Full-width address field */}
      <Field label="Address">
        <input
          style={inputStyle}
          value={form.address}
          onChange={e => set('address', e.target.value)}
          placeholder="Patient address"
        />
      </Field>

      {/* Footer actions */}
      <div className="add-patient-footer">
        <Btn outline onClick={onClose}>Cancel</Btn>
        <Btn onClick={handleSave} disabled={loading}>
          {loading && <BtnSpinner />} Register Patient
        </Btn>
      </div>
    </Modal>
  )
}