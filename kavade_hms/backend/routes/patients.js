import express from 'express'
import Patient from '../models/Patient.js'
import Doctor  from '../models/Doctor.js'
import { protect, authorize } from '../middleware/auth.js'

const router = express.Router()

function escapeRegex(input = '') {
  return input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function todayStart() {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d
}

function getDateRange(filter) {
  const now = new Date(), start = new Date(), end = new Date()
  if (filter === 'today') {
    start.setHours(0, 0, 0, 0)
    end.setHours(23, 59, 59, 999)
    return { $gte: start, $lte: end }
  } else if (filter === 'week')  { start.setDate(now.getDate() - 7) }
  else if   (filter === 'month') { start.setMonth(now.getMonth() - 1) }
  else if   (filter === 'year')  { start.setFullYear(now.getFullYear() - 1) }
  else                           { start.setHours(0, 0, 0, 0) }
  return { $gte: start, $lte: now }
}

// ── GET all patients ──────────────────────────────────────────────────────────
router.get('/', protect, async (req, res) => {
  try {
    const { filter, search } = req.query
    const today = todayStart()
    let query = {}

    if (req.user.role === 'reception' || req.user.role === 'billing') {
      // Today only
      query.registrationTime = { $gte: today }

    } else if (req.user.role === 'doctor') {
      // Doctor sees:
      //   - When filter param sent (week/month): all their assigned patients in that range
      //   - Default (today / no filter): today's unassigned Registered + their assigned patients
      const ref = req.user.doctorRef
      if (filter && filter !== 'today') {
        // Date-filtered view — show ONLY patients explicitly assigned to this doctor
        const range = getDateRange(filter)
        if (ref) {
          query = {
            registrationTime: range,
            assignedDoctor: ref,
          }
        } else {
          query = { registrationTime: range }
        }
      } else {
        // Default: today only
        if (ref) {
          query = {
            registrationTime: { $gte: today },
            $or: [
              { assignedDoctor: null, status: 'Registered' },
              { assignedDoctor: ref },
            ],
          }
        } else {
          query = { registrationTime: { $gte: today }, status: 'Registered' }
        }
      }

    } else {
      // Admin — use filter param
      // Admin path in patients.js
if (filter) query.registrationTime = getDateRange(filter)
    }

    // Search overlay
    if (search && search.trim()) {
      const safeSearch = escapeRegex(search.trim().slice(0, 60))
      const searchOr = { $or: [
        { name:      { $regex: safeSearch, $options: 'i' } },
        { patientId: { $regex: safeSearch, $options: 'i' } },
      ]}
      query = Object.keys(query).length
        ? { $and: [query, searchOr] }
        : searchOr
    }

    const patients = await Patient.find(query)
      .populate('assignedDoctor', 'name specialty')
      .sort({ registrationTime: -1 })
      .lean()

    res.json({ success: true, data: patients })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
})

// ── POST register patient ─────────────────────────────────────────────────────
router.post('/', protect, authorize('reception', 'admin'), async (req, res) => {
  try {
    const { name, age, gender, phone, address } = req.body
    const patient = await Patient.create({
      name, age, gender, phone, address,
      status: 'Registered',
      registrationTime: new Date(),
    })
    res.status(201).json({ success: true, data: patient })
  } catch (err) {
    res.status(400).json({ success: false, message: err.message })
  }
})

// ── PUT pickup ────────────────────────────────────────────────────────────────
// Doctor opens ConsultModal → auto-assigned to logged-in doctor immediately
router.put('/:id/pickup', protect, authorize('doctor', 'admin'), async (req, res) => {
  try {
    // Use doctorId from body, or fall back to logged-in doctor's own ref
    const doctorId = req.body.doctorId || req.user.doctorRef
    if (!doctorId) {
      return res.status(400).json({
        success: false,
        message: 'No doctor profile linked to this account. Ask admin to link your account to a doctor profile.',
      })
    }

    const patient = await Patient.findByIdAndUpdate(
      req.params.id,
      { assignedDoctor: doctorId, status: 'Doctor Pending' },
      { new: true, runValidators: true }
    ).populate('assignedDoctor', 'name specialty')

    res.json({ success: true, data: patient })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
})

// ── PUT assign / reassign ─────────────────────────────────────────────────────
// Used for explicit doctor-to-doctor reassignment from ConsultModal
router.put('/:id/assign', protect, authorize('doctor', 'admin'), async (req, res) => {
  try {
    const { doctorId } = req.body
    if (!doctorId) return res.status(400).json({ success: false, message: 'doctorId required.' })

    const [current, toDoctor] = await Promise.all([
      Patient.findById(req.params.id).populate('assignedDoctor', 'name'),
      Doctor.findById(doctorId).select('name specialty'),
    ])
    if (!toDoctor) return res.status(404).json({ success: false, message: 'Doctor not found.' })

    const patient = await Patient.findByIdAndUpdate(
      req.params.id,
      {
        assignedDoctor: doctorId,
        status: 'Doctor Pending',
        $push: {
          reassignmentHistory: {
            fromDoctorName: current?.assignedDoctor?.name || 'Unassigned',
            toDoctorName:   toDoctor.name,
            at:             new Date(),
          },
        },
      },
      { new: true, runValidators: true }
    ).populate('assignedDoctor', 'name specialty')

    res.json({ success: true, data: patient })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
})

// ── PUT timer start ───────────────────────────────────────────────────────────
router.put('/:id/timer-start', protect, authorize('doctor', 'admin'), async (req, res) => {
  try {
    const patient = await Patient.findByIdAndUpdate(
      req.params.id,
      { consultationStart: new Date(), status: 'Doctor Pending' },
      { new: true, runValidators: true }
    ).populate('assignedDoctor', 'name specialty')
    res.json({ success: true, data: patient })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
})

// ── PUT consult complete ──────────────────────────────────────────────────────
router.put('/:id/consult', protect, authorize('doctor', 'admin'), async (req, res) => {
  try {
    const {
      name, diagnosis, consultationFee,
      medicines, dispensedMedicines, investigations,
      doctorCodes, consultationStart, consultationEnd, consultationMinutes,
    } = req.body

    const update = {
      status:          'Doctor Completed',
      consultationEnd: consultationEnd || new Date(),
    }
    if (name                !== undefined) update.name                 = name
    if (diagnosis           !== undefined) update.diagnosis            = diagnosis
    if (consultationFee     !== undefined) update.consultationFee      = parseFloat(consultationFee) || 0
    if (medicines           !== undefined) update.medicines            = medicines
    if (dispensedMedicines  !== undefined) update.dispensedMedicines   = dispensedMedicines
    if (investigations      !== undefined) update.investigations        = investigations
    if (doctorCodes         !== undefined) update.doctorCodes          = doctorCodes
    if (consultationStart   !== undefined) update.consultationStart    = consultationStart
    if (consultationMinutes !== undefined) update.consultationMinutes  = consultationMinutes

    const patient = await Patient.findByIdAndUpdate(
      req.params.id, update, { new: true, runValidators: true }
    ).populate('assignedDoctor', 'name specialty')

    res.json({ success: true, data: patient })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
})

// ── PUT billing ───────────────────────────────────────────────────────────────
router.put('/:id/billing', protect, authorize('billing', 'admin'), async (req, res) => {
  try {
    const { paymentMethod, totalAmount } = req.body
    const patient = await Patient.findByIdAndUpdate(
      req.params.id,
      { status: 'Billed', paymentMethod, totalAmount, billingTime: new Date() },
      { new: true, runValidators: true }
    ).populate('assignedDoctor', 'name specialty')
    res.json({ success: true, data: patient })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
})

// ── GET single patient ────────────────────────────────────────────────────────
router.get('/:id', protect, async (req, res) => {
  try {
    const patient = await Patient.findById(req.params.id)
      .populate('assignedDoctor', 'name specialty')
      .lean()
    if (!patient) return res.status(404).json({ success: false, message: 'Not found.' })
    res.json({ success: true, data: patient })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
})

export default router