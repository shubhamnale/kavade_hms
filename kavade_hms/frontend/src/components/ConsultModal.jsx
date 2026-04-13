import React, { useState, useEffect, useRef, useCallback } from 'react'
import { patientsAPI } from '../api'
import { Modal, Field, Alert, BtnSpinner, inputStyle, Btn } from './UI'
import { theme } from '../theme'

// ── Beep engine ───────────────────────────────────────────────────────────────
class BeepEngine {
  constructor() { this._ctx = null; this._interval = null; this._running = false }
  _getCtx() {
    if (!this._ctx || this._ctx.state === 'closed') {
      const AC = window.AudioContext || window.webkitAudioContext
      if (!AC) return null
      this._ctx = new AC()
    }
    if (this._ctx.state === 'suspended') this._ctx.resume()
    return this._ctx
  }
  _tone() {
    const ctx = this._getCtx(); if (!ctx) return
    try {
      const osc = ctx.createOscillator(), gain = ctx.createGain()
      osc.connect(gain); gain.connect(ctx.destination)
      osc.type = 'sine'; osc.frequency.value = 880
      gain.gain.setValueAtTime(0.5, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.55)
      osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.6)
    } catch {}
  }
  start() { if (this._running) return; this._running = true; this._tone(); this._interval = setInterval(() => this._tone(), 1500) }
  stop()  { if (!this._running) return; this._running = false; clearInterval(this._interval); this._interval = null; try { this._ctx?.suspend() } catch {} }
  get isRunning() { return this._running }
  destroy() { this.stop(); try { this._ctx?.close() } catch {}; this._ctx = null }
}

// ── Timer ─────────────────────────────────────────────────────────────────────
const ALERT_SECS = 600;

function TimerDisplay({ startTime, active, onTurnIn, onTurnOut }) {
  const [elapsed,    setElapsed]    = useState(active && startTime ? Math.floor((Date.now() - new Date(startTime)) / 1000) : 0)
  const [beepActive, setBeepActive] = useState(false)
  
  const beepRef  = useRef(null)
  const firedRef = useRef(false)
  const timerRef = useRef(null)

  useEffect(() => { beepRef.current = new BeepEngine(); return () => beepRef.current?.destroy() }, [])

  const stopBeep = useCallback(() => { beepRef.current?.stop(); setBeepActive(false) }, [])

  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current)
    if (!active || !startTime) return
    const tick = () => {
      const s = Math.floor((Date.now() - new Date(startTime)) / 1000)
      setElapsed(s)
      if (s >= ALERT_SECS && !firedRef.current) { firedRef.current = true; beepRef.current?.start(); setBeepActive(true) }
    }
    tick()
    timerRef.current = setInterval(tick, 1000)
    return () => clearInterval(timerRef.current)
  }, [active, startTime])

  const mins = Math.floor(elapsed / 60), secs = elapsed % 60, over = elapsed >= ALERT_SECS
// 🔴 ONLY CHANGE IS INSIDE handleSave (marked below)

const handleSave = async () => {
  setLoading(true); setError('')
  try {
    const consultEnd  = new Date()
    const consultMins = timerStart ? Math.round((consultEnd - new Date(timerStart)) / 60000) : 0

    const parseMeds = t =>
      t.split('\n')
       .map(s => s.trim())
       .filter(Boolean)
       .map(name => ({ name }))

    const { data } = await patientsAPI.consult(patient._id, {
      name: patientName,
      diagnosis,

      consultationFee: parseFloat(consultationFee) || 0,
      dispensedMedicines: parseMeds(dispensedMeds),

      // ✅ FIX START 🔥🔥🔥
      investigations: parseMeds(investigations),
      suggestedTests: investigations,   // ✅ ADD THIS LINE
      // ✅ FIX END 🔥🔥🔥

      doctorCodes,
      consultationStart: timerStart,
      consultationEnd: consultEnd,
      consultationMinutes: consultMins,
    })

    onSave(data.data)
    onClose()
  } catch (e) {
    setError(e.response?.data?.message || 'Failed to save.')
    setLoading(false)
  }
}
  return (
    <div style={{ marginBottom:16 }}>
      <div style={{ display:'flex', alignItems:'center', gap:12, padding:'12px 16px', borderRadius: beepActive ? '10px 10px 0 0' : 10, background: active ? (over ? '#FFF3E0' : '#E3F2FD') : '#F5F5F5', border:`1.5px solid ${active ? (over ? '#FFB300' : theme.accent) : theme.border}` }}>
        <span style={{ fontSize:22 }}>⏱</span>
        <div style={{ flex:1 }}>
          <p style={{ fontSize:10, color:theme.muted, fontWeight:700, textTransform:'uppercase' }}>Consultation Timer</p>
          <p style={{ fontSize:24, fontWeight:700, fontFamily:'monospace', color: over ? '#E65100' : theme.primary }}>
            {String(mins).padStart(2,'0')}:{String(secs).padStart(2,'0')}
            {over && <span style={{ fontSize:11, marginLeft:8, color:'#E65100' }}>⚠ 10 min exceeded</span>}
          </p>
        </div>
        {!active
          ? <Btn onClick={onTurnIn}  color={theme.success}>▶ Turn In</Btn>
          : <Btn onClick={onTurnOut} color={theme.danger}>⏹ Turn Out</Btn>}
      </div>
      {beepActive && (
        <div style={{ display:'flex', alignItems:'center', gap:12, padding:'10px 16px', background:'#B71C1C', borderRadius:'0 0 10px 10px' }}>
          <span>🔔</span>
          <p style={{ flex:1, fontSize:12, fontWeight:700, color:'#fff' }}>10-minute alert — please wrap up</p>
          <button onClick={stopBeep} style={{ padding:'6px 16px', border:'2px solid #fff', borderRadius:8, background:'transparent', color:'#fff', fontSize:12, fontWeight:700, cursor:'pointer' }}>Stop</button>
        </div>
      )}
    </div>
  )
}

// ── ABCD Codes ─────────────────────────────────────────────────────────────────
function AbcdCodes({ codes, setCodes }) {
  const toggle = l => setCodes(p => p.includes(l) ? p.filter(x => x !== l) : [...p, l])
  return (
    <div style={{ display:'flex', gap:8, alignItems:'center', flexWrap:'wrap' }}>
      {['A','B','C','D'].map(l => (
        <button key={l} onClick={() => toggle(l)} style={{ width:38, height:38, borderRadius:8, fontWeight:700, fontSize:15, cursor:'pointer', border:`2px solid ${codes.includes(l) ? '#ccc' : theme.accent}`, background: codes.includes(l) ? '#F5F5F5' : '#E3F2FD', color: codes.includes(l) ? '#bbb' : theme.accent, textDecoration: codes.includes(l) ? 'line-through' : 'none' }}>{l}</button>
      ))}
      <span style={{ fontSize:12, color:theme.muted }}>Click to strikethrough on bill</span>
    </div>
  )
}

// ── ConsultModal ──────────────────────────────────────────────────────────────
export default function ConsultModal({ patient: init, doctors = [], currentUser, onClose, onSave }) {
  const [patient,           setPatient]          = useState(init)
  const [patientName,       setPatientName]       = useState(init.name)
  const [diagnosis,         setDiagnosis]         = useState(init.diagnosis || '')
  const [consultationFee,   setConsultationFee]   = useState(init.consultationFee ?? 0)
  const [dispensedMeds,     setDispensedMeds]     = useState(init.dispensedMedicines?.map(m => m.name || m).join('\n') || '')
  const [investigations,    setInvestigations]    = useState(init.investigations?.map(i => i.name || i).join('\n') || '')
  const [doctorCodes,       setDoctorCodes]       = useState(init.doctorCodes || [])

  const [timerActive,       setTimerActive]       = useState(!!init.consultationStart)
  const [timerStart,        setTimerStart]        = useState(init.consultationStart || null)
  const [loading,           setLoading]           = useState(false)
  const [error,             setError]             = useState('')

  // ── Auto-pickup: assign logged-in doctor if patient has none ───────────────
  useEffect(() => {
    if (!init.assignedDoctor && currentUser?.role === 'doctor' && currentUser?.doctorRef) {
      patientsAPI.pickup(init._id, { doctorId: currentUser.doctorRef })
        .then(({ data }) => setPatient(data.data))
        .catch(e => console.warn('pickup:', e.response?.data?.message || e.message))
    }
  }, []) // eslint-disable-line

  const doctorName = patient.assignedDoctor?.name || currentUser?.name || '—'

  const handleTurnIn = async () => {
    const now = new Date()
    setTimerStart(now); setTimerActive(true)
    try { await patientsAPI.timerStart(patient._id) } catch {}
  }

  const handleTurnOut = async () => {
    setTimerActive(false)
    // Persist end time immediately so Timing Log is never left with a
    // dangling consultationStart and no consultationEnd if the modal is
    // closed without completing the consultation.
    try {
      const consultEnd  = new Date()
      const consultMins = timerStart ? Math.round((consultEnd - new Date(timerStart)) / 60000) : 0
      await patientsAPI.consult(patient._id, {
        consultationEnd:     consultEnd,
        consultationMinutes: consultMins,
      })
    } catch (e) {
      console.warn('handleTurnOut persist:', e.message)
    }
  }

 const handleSave = async () => {
  setLoading(true); setError('')
  try {
    const consultEnd  = new Date()
    const consultMins = timerStart ? Math.round((consultEnd - new Date(timerStart)) / 60000) : 0
const handleSave = (updatedPatient) => {
  setPatients(prev =>
    prev.map(p => p._id === updatedPatient._id ? updatedPatient : p)
  );
};
    const parseMeds = t =>
      t.split('\n')
       .map(s => s.trim())
       .filter(Boolean)
       .map(name => ({ name }))

    const { data } = await patientsAPI.consult(patient._id, {
      name: patientName,
      diagnosis,

      consultationFee: parseFloat(consultationFee) || 0,
      dispensedMedicines: parseMeds(dispensedMeds),

      // ✅ FIX HERE ONLY
      investigations: parseMeds(investigations),
      suggestedTests: investigations,

      doctorCodes,
      consultationStart: timerStart,
      consultationEnd: consultEnd,
      consultationMinutes: consultMins,
    })

    onSave(data.data)
    onClose()
  } catch (e) {
    setError(e.response?.data?.message || 'Failed to save.')
    setLoading(false)
  }
}

  return (
    <Modal title="Doctor Consultation" onClose={onClose} width={680}>
      <Alert type="err" msg={error} />

      {/* Patient info strip */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:10, marginBottom:20 }}>
        {[
          ['ID',     patient.patientId],
          ['Age',    `${patient.age}y · ${patient.gender}`],
          ['Phone',  patient.phone || '—'],
          ['Doctor', doctorName],
        ].map(([k, v]) => (
          <div key={k} style={{ background: k === 'Doctor' ? '#E8F5E9' : '#F8FAFC', border: k === 'Doctor' ? '1px solid #A5D6A7' : 'none', borderRadius:8, padding:'8px 12px' }}>
            <p style={{ fontSize:10, color:theme.muted, fontWeight:700, textTransform:'uppercase' }}>{k}</p>
            <p style={{ fontSize:12, fontWeight:600, marginTop:2, color: k === 'Doctor' ? theme.success : theme.text }}>{v}</p>
          </div>
        ))}
      </div>

      {/* Reassignment history */}
      {patient.reassignmentHistory?.length > 0 && (
        <div style={{ background:'#F8FAFC', border:`1px solid ${theme.border}`, borderRadius:8, padding:'10px 14px', marginBottom:16 }}>
          <p style={{ fontSize:10, fontWeight:700, color:theme.muted, textTransform:'uppercase', marginBottom:8 }}>Reassignment History</p>
          {patient.reassignmentHistory.map((h, i) => (
            <div key={i} style={{ display:'flex', alignItems:'center', gap:8, fontSize:12, marginBottom:4 }}>
              <span style={{ fontWeight:600, color:theme.danger }}>{h.fromDoctorName}</span>
              <span style={{ color:theme.muted, fontSize:16 }}>→</span>
              <span style={{ fontWeight:600, color:theme.success }}>{h.toDoctorName}</span>
              <span style={{ color:theme.muted, marginLeft:'auto', fontSize:11 }}>
                {new Date(h.at).toLocaleTimeString('en-IN', { hour:'2-digit', minute:'2-digit', hour12:true })}
              </span>
            </div>
          ))}
        </div>
      )}

      <Field label="Patient Name (edit if wrong)">
        <input style={inputStyle} value={patientName} onChange={e => setPatientName(e.target.value)} />
      </Field>

      <TimerDisplay startTime={timerStart} active={timerActive} onTurnIn={handleTurnIn} onTurnOut={handleTurnOut} />

      <Field label="Diagnosis">
        <textarea style={{ ...inputStyle, resize:'vertical' }} rows={3} value={diagnosis} onChange={e => setDiagnosis(e.target.value)} placeholder="Enter diagnosis…" />
      </Field>

      <Field label="Consultation Fee (₹)">
        <input style={{ ...inputStyle, maxWidth:200 }} type="number" min="0" value={consultationFee} onChange={e => setConsultationFee(e.target.value)} placeholder="Enter fee" />
      </Field>

      <Field label="Doctor Codes">
        <AbcdCodes codes={doctorCodes} setCodes={setDoctorCodes} />
      </Field>

 <Field label="Dispensed Medicines (one per line)">
        <textarea style={{ ...inputStyle, resize:'vertical', fontFamily:'monospace', fontSize:15 }} rows={3}
          value={dispensedMeds} onChange={e => setDispensedMeds(e.target.value)}
          placeholder={'Tab. Paracetamol 500mg'} />
      </Field>

      <Field label="Investigations (one per line)">
        <div style={{ background:'#F9F9F9', border:`1px solid ${theme.border}`, borderRadius:8, padding:12, marginBottom:8 }}>
          <p style={{ fontSize:12, color:theme.muted, marginBottom:10, fontWeight:600 }}>Suggested tests:</p>
          <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
            {['X-Ray', 'Sonography', 'Blood Test', 'MRI', 'CT Scan'].map(test => (
              <button
                key={test}
                onClick={() => {
                  if (!investigations.includes(test)) {
                    setInvestigations(investigations ? investigations + '\n' + test : test)
                  }
                }}
                style={{
                  padding:'6px 12px',
                  border:`1px solid ${theme.accent}`,
                  background:'#fff',
                  color:theme.accent,
                  borderRadius:6,
                  fontSize:13,
                  fontWeight:600,
                  cursor:'pointer',
                  transition:'all .2s',
                }}
                onMouseOver={(e) => {
                  e.target.style.background = theme.accent;
                  e.target.style.color = '#fff';
                }}
                onMouseOut={(e) => {
                  e.target.style.background = '#fff';
                  e.target.style.color = theme.accent;
                }}
              >
                + {test}
              </button>
            ))}
          </div>
        </div>
        <textarea style={{ ...inputStyle, resize:'vertical', fontFamily:'monospace', fontSize:15 }} rows={4}
          value={investigations} onChange={e => setInvestigations(e.target.value)}
          placeholder={'X-Ray Chest\nBlood Test - Complete Blood Count'} />
      </Field>

      <div style={{ display:'flex', gap:10, justifyContent:'flex-end', marginTop:8 }}>
        <Btn outline onClick={onClose}>Cancel</Btn>
        <Btn color={theme.success} onClick={handleSave} disabled={loading}>
          {loading && <BtnSpinner />} ✓ Complete Consultation
        </Btn>
      </div>
    </Modal>
  )
}