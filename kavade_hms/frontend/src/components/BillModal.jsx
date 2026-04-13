import React, { useState } from 'react'
import { patientsAPI } from '../api'
import { Modal, Alert, BtnSpinner, Btn } from './UI'
import { theme } from '../theme'
import './billmodal.css'

export default function BillModal({ patient, mode = 'billing', currentUser, onClose, onSave }) {
  const doctorName      = patient.assignedDoctor?.name     || currentUser?.name || '—'
  const doctorSpecialty = patient.assignedDoctor?.specialty || ''
  const [paymentMethod, setPaymentMethod] = useState(patient.paymentMethod || '')
  const [loading,       setLoading]       = useState(false)
  const [printing,      setPrinting]      = useState(false)
  const [error,         setError]         = useState('')

  const alreadyBilled  = patient.status === 'Billed'
  const consultFee     = Number(patient.consultationFee) || 0
  const grandTotal     = consultFee
  const dispensed      = patient.dispensedMedicines || []
  const investigations = patient.investigations     || []
  const codes          = patient.doctorCodes        || []

  /* ── Billing ─────────────────────────────────────────────── */
  const handleBill = async () => {
    if (!paymentMethod) return setError('Please select payment method.')
    setLoading(true); setError('')
    try {
      const { data } = await patientsAPI.billing(patient._id, { paymentMethod, totalAmount: grandTotal })
      onSave(data.data)
      onClose()
    } catch (e) {
      setError(e.response?.data?.message || 'Billing failed.')
      setLoading(false)
    }
  }

  /* ── Print ───────────────────────────────────────────────────
     FIX: Do NOT toggle display on #billprint before calling
     window.print(). The CSS @media print rule already handles
     showing/hiding — manually setting display:block then back
     to display:none races against the print renderer on mobile
     Chrome/Safari and produces a blank page.
  ─────────────────────────────────────────────────────────── */
  const handlePrint = () => {
    if (printing) return
    setPrinting(true)

    const pw = window.open('', '_blank', 'width=900,height=1100')
    if (!pw) {
      setError('Unable to open print window. Please allow popups and try again.')
      setPrinting(false)
      return
    }

    const testsHtml = investigations.length > 0
      ? `<div class="section"><h4>Suggested Tests</h4>${investigations.map(test => `<div class="item">${test.name || test}</div>`).join('')}</div>`
      : ''

    const medsHtml = dispensed.length > 0
      ? `<div class="section"><h4>Dispensed Medicines</h4>${dispensed.map(med => `<div class="item">${med.name || med}</div>`).join('')}</div>`
      : ''

    const codesHtml = codes.length > 0
      ? `<div class="codes-wrap"><div class="codes-label">Doctor Codes</div><div class="codes">${['A', 'B', 'C', 'D'].map(l => `<span class="code${codes.includes(l) ? ' strike' : ''}">${l}</span>`).join('')}</div></div>`
      : ''

    const printDate = new Date(patient.registrationTime || patient.visitDate).toLocaleDateString('en-IN')
    const generatedAt = new Date().toLocaleString('en-IN')

    pw.document.open()
    pw.document.write(`
      <html>
      <head>
        <title>Bill - ${patient.patientId}</title>
        <style>
          @page { size: A4; margin: 14mm; }
          * { box-sizing: border-box; }
          body { font-family: Arial, sans-serif; color: #111; margin: 0; font-size: 12px; line-height: 1.5; }
          .invoice { width: 100%; }
          .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 1px solid #ddd; padding-bottom: 10px; margin-bottom: 12px; }
          .header h2 { margin: 0; font-size: 22px; }
          .muted { color: #666; font-size: 11px; }
          .codes-label { text-align: right; font-size: 10px; color: #777; margin-bottom: 4px; }
          .codes { display: flex; gap: 4px; }
          .code { width: 22px; height: 22px; border: 1px solid #999; display: inline-flex; align-items: center; justify-content: center; font-weight: 700; }
          .strike { color: #bbb; text-decoration: line-through; }
          .row { display: flex; margin-bottom: 4px; }
          .label { width: 110px; flex-shrink: 0; font-weight: 700; }
          .value { flex: 1; color: #333; word-break: break-word; }
          .section { margin-top: 12px; }
          .section h4 { margin: 0 0 6px; font-size: 13px; }
          .item { margin-bottom: 3px; padding-left: 12px; position: relative; }
          .item::before { content: '\\2022'; position: absolute; left: 0; }
          .divider { margin: 12px 0; border-top: 1px solid #ddd; }
          .total { display: flex; justify-content: space-between; background: #f7f7f7; border: 1px solid #e2e2e2; padding: 10px; font-weight: 700; margin-top: 8px; }
          .pay { margin-top: 10px; padding: 8px; background: #f7f7f7; border: 1px solid #ececec; text-align: center; font-weight: 700; }
          .footer { margin-top: 14px; border-top: 1px solid #ddd; padding-top: 8px; text-align: center; color: #666; font-size: 10px; }
        </style>
      </head>
      <body>
        <div class="invoice">
          <div class="header">
            <div>
              <h2>Kavade Nursing Home</h2>
              <div class="muted">Official Invoice</div>
            </div>
            ${codesHtml}
          </div>

          <div class="row"><div class="label">Patient:</div><div class="value">${patient.name} (${patient.patientId})</div></div>
          <div class="row"><div class="label">Doctor:</div><div class="value">${doctorName}${doctorSpecialty ? ' - ' + doctorSpecialty : ''}</div></div>
          <div class="row"><div class="label">Date:</div><div class="value">${printDate}</div></div>
          ${patient.consultationMinutes > 0 ? `<div class="row"><div class="label">Consult Time:</div><div class="value">${patient.consultationMinutes} min</div></div>` : ''}
          <div class="row"><div class="label">Diagnosis:</div><div class="value">${patient.diagnosis || '—'}</div></div>

          ${testsHtml}
          ${medsHtml}

          <div class="divider"></div>
          <div class="row"><div class="label">Consultation Fee:</div><div class="value">Rs ${consultFee.toLocaleString('en-IN')}</div></div>
          <div class="total"><span>TOTAL AMOUNT</span><span>Rs ${grandTotal.toLocaleString('en-IN')}</span></div>
          ${patient.paymentMethod ? `<div class="pay">Payment received via ${patient.paymentMethod}</div>` : ''}

          <div class="footer">
            <div>Thank you for visiting Kavade Nursing Home</div>
            <div>Generated on ${generatedAt}</div>
          </div>
        </div>
      </body>
      </html>
    `)
    pw.document.close()

    pw.onload = () => {
      pw.focus()
      pw.print()
      setPrinting(false)
    }
  }

  /* ── Inline summary row ──────────────────────────────────── */
  const Row = ({ label, value }) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 13 }}>
      <span style={{ color: theme.muted }}>{label}</span>
      <span>{value}</span>
    </div>
  )

  return (
    <Modal title={mode === 'print' ? 'Print Bill' : 'Collect Payment'} onClose={onClose} width={520}>
      <Alert type="err" msg={error} />

      {/* ── PRINT-ONLY INVOICE (hidden on screen via CSS) ─── */}
      <div id="billprint">

        {/* Header */}
        <div id="billprint-header">
          <div>
            <h3>🏥 Kavade Nursing Home</h3>
            <p>Official Invoice</p>
          </div>
          {codes.length > 0 && (
            <div id="billprint-codes">
              <div id="billprint-codes-label">Doctor Codes</div>
              <div id="billprint-codes-display">
                {['A', 'B', 'C', 'D'].map(l => (
                  <div key={l} className={`billprint-code${codes.includes(l) ? ' strikethrough' : ''}`}>
                    {l}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Patient details */}
        <div id="billprint-patient">
          <div className="billprint-row">
            <span className="billprint-row-label">Patient:</span>
            <span className="billprint-row-value">{patient.name} ({patient.patientId})</span>
          </div>
          <div className="billprint-row">
            <span className="billprint-row-label">Doctor:</span>
            <span className="billprint-row-value">{doctorName}{doctorSpecialty ? ' · ' + doctorSpecialty : ''}</span>
          </div>
          <div className="billprint-row">
            <span className="billprint-row-label">Date:</span>
            <span className="billprint-row-value">
              {new Date(patient.registrationTime || patient.visitDate).toLocaleDateString('en-IN')}
            </span>
          </div>
          {patient.consultationMinutes > 0 && (
            <div className="billprint-row">
              <span className="billprint-row-label">Consult Time:</span>
              <span className="billprint-row-value">{patient.consultationMinutes} min</span>
            </div>
          )}
          <div className="billprint-row">
            <span className="billprint-row-label">Diagnosis:</span>
            <span className="billprint-row-value billprint-diagnosis">{patient.diagnosis || '—'}</span>
          </div>
        </div>

        <div className="billprint-divider" />

        {/* Suggested Tests */}
        {investigations.length > 0 && (
          <div id="billprint-tests">
            <div id="billprint-tests-title">Suggested Tests</div>
            {investigations.map((test, i) => (
              <div key={i} className="billprint-test-item">{test.name || test}</div>
            ))}
          </div>
        )}

        {/* Dispensed Medicines */}
        {dispensed.length > 0 && (
          <div id="billprint-medicines">
            <div id="billprint-medicines-title">Dispensed Medicines</div>
            {dispensed.map((med, i) => (
              <div key={i} className="billprint-medicine-item">{med.name || med}</div>
            ))}
          </div>
        )}

        <div className="billprint-divider" />

        {/* Billing */}
        <div id="billprint-billing">
          <div className="billprint-billing-row">
            <span className="billprint-billing-label">Consultation Fee:</span>
            <span className="billprint-billing-amount">₹{consultFee.toLocaleString('en-IN')}</span>
          </div>
          <div id="billprint-total">
            <span id="billprint-total-label">TOTAL AMOUNT</span>
            <span id="billprint-total-amount">₹{grandTotal.toLocaleString('en-IN')}</span>
          </div>
        </div>

        {/* Payment confirmation */}
        {patient.paymentMethod && (
          <div id="billprint-payment">
            ✓ Payment received via {patient.paymentMethod}
          </div>
        )}

        {/* Footer */}
        <div id="billprint-footer">
          <p id="billprint-footer-note">Thank you for visiting Kavade Nursing Home</p>
          <p id="billprint-footer-time">Generated on {new Date().toLocaleString('en-IN')}</p>
        </div>
      </div>

      {/* ── WEB UI: bill summary ──────────────────────────── */}
      <div className="billmodal-summary" style={{ background: '#F8FAFC', borderRadius: 12, padding: 20, marginBottom: 16 }}>
        <Row label="Patient"   value={`${patient.name} (${patient.patientId})`} />
        <Row label="Doctor"    value={doctorName} />
        <Row label="Diagnosis" value={patient.diagnosis || '—'} />
        {patient.consultationMinutes > 0 && (
          <Row label="Consult Time" value={`${patient.consultationMinutes} min`} />
        )}
        {investigations.length > 0 && (
          <Row label="Suggested Tests" value={investigations.map(i => i.name || i).join(', ')} />
        )}
        <div style={{ height: 1, background: theme.border, margin: '12px 0' }} />
        <Row label="Consultation Fee" value={`₹${consultFee}`} />
        <div style={{ height: 1, background: theme.border, margin: '12px 0' }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 20, fontWeight: 700 }}>
          <span style={{ color: theme.primary }}>Total</span>
          <span style={{ color: theme.success }}>₹{grandTotal.toLocaleString('en-IN')}</span>
        </div>
      </div>

      {/* Doctor Codes */}
      {codes.length > 0 && (
        <div className="billmodal-codes" style={{ marginBottom: 16 }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: theme.muted, textTransform: 'uppercase', marginBottom: 8 }}>
            Doctor Codes
          </p>
          <div className="billmodal-codes-grid" style={{ display: 'flex', gap: 8 }}>
            {['A', 'B', 'C', 'D'].map(l => (
              <div key={l} style={{
                width: 36, height: 36,
                border: `2px solid ${codes.includes(l) ? '#ccc' : theme.accent}`,
                borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 700, fontSize: 16,
                textDecoration: codes.includes(l) ? 'line-through' : 'none',
                color: codes.includes(l) ? '#bbb' : theme.accent,
              }}>
                {l}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Payment method selector */}
      {mode === 'billing' && !alreadyBilled && (
        <div className="billmodal-payment" style={{ marginBottom: 16 }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: theme.muted, textTransform: 'uppercase', marginBottom: 10 }}>
            Payment Method
          </p>
          <div className="billmodal-payment-grid" style={{ display: 'flex', gap: 12 }}>
            {['Online', 'Offline'].map(m => (
              <div key={m} onClick={() => setPaymentMethod(m)} style={{
                flex: 1, padding: '14px 20px', borderRadius: 10, cursor: 'pointer', textAlign: 'center',
                border: `2px solid ${paymentMethod === m ? theme.accent : theme.border}`,
                background: paymentMethod === m ? '#E3F2FD' : '#FAFAFA',
                fontWeight: 600, fontSize: 14,
              }}>
                {m === 'Online' ? '📱 Online' : '💵 Offline'}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Already billed banner */}
      {alreadyBilled && (
        <div style={{ background: '#E8F5E9', padding: '10px 14px', borderRadius: 8, marginBottom: 16, fontSize: 13, color: '#1B5E20', fontWeight: 600 }}>
          ✅ Payment collected via {patient.paymentMethod}
        </div>
      )}

      {/* Footer buttons */}
      <div className="billmodal-footer" style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
        <Btn outline onClick={onClose}>Close</Btn>
        <Btn outline onClick={handlePrint} disabled={printing}>{printing ? 'Printing…' : '🖨 Print Bill'}</Btn>
        {mode === 'billing' && !alreadyBilled && (
          <Btn color={theme.success} onClick={handleBill} disabled={loading}>
            {loading && <BtnSpinner />} ✓ Confirm Payment
          </Btn>
        )}
      </div>
    </Modal>
  )
}