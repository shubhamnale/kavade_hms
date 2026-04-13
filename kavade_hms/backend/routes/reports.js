import express from 'express'
import Patient from '../models/Patient.js'
import Doctor  from '../models/Doctor.js'
import { protect, authorize } from '../middleware/auth.js'

const router = express.Router()

function getDateRange(filter) {
  const now = new Date(), start = new Date()
  if      (filter === 'today') { start.setHours(0,0,0,0) }
  else if (filter === 'week')  { start.setDate(now.getDate() - 7) }
  else if (filter === 'month') { start.setMonth(now.getMonth() - 1) }
  else if (filter === 'year')  { start.setFullYear(now.getFullYear() - 1) }
  else                         { start.setHours(0,0,0,0) }
  return { $gte: start, $lte: now }
}

router.get('/summary', protect, authorize('admin'), async (req, res) => {
  try {
    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)
    const todayEnd = new Date()
    todayEnd.setHours(23, 59, 59, 999)
    const todayRange = { $gte: todayStart, $lte: todayEnd }

    const [todayPatients, waitingCount, billedCount, revenueResult] = await Promise.all([
      Patient.countDocuments({ registrationTime: todayRange }),

      // Waiting = today's patients waiting to see a doctor
      Patient.countDocuments({
        registrationTime: todayRange,
        status: 'Registered'
      }),
      Patient.countDocuments({ status: 'Billed', billingTime: todayRange }),

      Patient.aggregate([
        { $match: { status: 'Billed', billingTime: todayRange } },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } },
      ]),
    ])

    res.json({ success: true, data: {
      todayPatients,
      waitingCount,
      billedCount,
      todayRevenue: revenueResult[0]?.total || 0,
    }})
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
})

router.get('/timing', protect, authorize('admin'), async (req, res) => {
  try {
    const { filter = 'today' } = req.query
    const patients = await Patient.find({ registrationTime: getDateRange(filter) })
      .select('patientId name assignedDoctor status registrationTime consultationStart consultationEnd consultationMinutes billingTime paymentMethod totalAmount')
      .populate('assignedDoctor', 'name specialty')
      .sort({ registrationTime: -1 })
      .lean()
    const data = patients.map(p => ({
      patientId:           p.patientId,
      name:                p.name,
      doctor:              p.assignedDoctor?.name || '—',
      status:              p.status,
      registrationTime:    p.registrationTime,
      consultationStart:   p.consultationStart,
      consultationEnd:     p.consultationEnd,
      consultationMinutes: p.consultationMinutes,
      billingTime:         p.billingTime,
      paymentMethod:       p.paymentMethod,
      totalAmount:         p.totalAmount,
    }))
    res.json({ success: true, data })
  } catch (err) { res.status(500).json({ success: false, message: err.message }) }
})

router.get('/doctor-performance', protect, authorize('admin'), async (req, res) => {
  try {
    const perf = await Patient.aggregate([
      { $match: { status: 'Billed', assignedDoctor: { $ne: null } } },
      {
        $group: {
          _id: '$assignedDoctor',
          totalPatients: { $sum: 1 },
          revenue: { $sum: { $ifNull: ['$totalAmount', 0] } },
          totalConsultMin: { $sum: { $ifNull: ['$consultationMinutes', 0] } },
        },
      },
      {
        $lookup: {
          from: 'doctors',
          localField: '_id',
          foreignField: '_id',
          as: 'doctor',
        },
      },
      { $unwind: '$doctor' },
      { $match: { 'doctor.isActive': true } },
      {
        $project: {
          _id: 0,
          doctor: '$doctor.name',
          specialty: '$doctor.specialty',
          totalPatients: 1,
          revenue: 1,
          avgConsultMin: {
            $round: [
              { $cond: [{ $gt: ['$totalPatients', 0] }, { $divide: ['$totalConsultMin', '$totalPatients'] }, 0] },
              0,
            ],
          },
        },
      },
      { $sort: { totalPatients: -1, doctor: 1 } },
    ])

    const activeDoctors = await Doctor.find({ isActive: true }).select('name specialty').lean()
    const existingDoctors = new Set(perf.map(p => p.doctor))
    const zeroRows = activeDoctors
      .filter(d => !existingDoctors.has(d.name))
      .map(d => ({ doctor: d.name, specialty: d.specialty, totalPatients: 0, revenue: 0, avgConsultMin: 0 }))

    if (zeroRows.length > 0) {
      return res.json({ success: true, data: [...perf, ...zeroRows].sort((a, b) => b.totalPatients - a.totalPatients || a.doctor.localeCompare(b.doctor)) })
    }
    return res.json({ success: true, data: perf })
  } catch (err) { res.status(500).json({ success: false, message: err.message }) }
})

// Daily Patient Report — grouped by doctor
router.get('/daily-patient-report', protect, authorize('admin'), async (req, res) => {
  try {
    const { date } = req.query  // expected: YYYY-MM-DD

    let dayStart, dayEnd
    if (date) {
      dayStart = new Date(date)
      dayStart.setHours(0, 0, 0, 0)
      dayEnd = new Date(date)
      dayEnd.setHours(23, 59, 59, 999)
    } else {
      dayStart = new Date()
      dayStart.setHours(0, 0, 0, 0)
      dayEnd = new Date()
      dayEnd.setHours(23, 59, 59, 999)
    }

    const patients = await Patient.find({
      registrationTime: { $gte: dayStart, $lte: dayEnd },
    })
      .select('name phone registrationTime totalAmount status assignedDoctor')
      .populate('assignedDoctor', 'name specialty')
      .sort({ assignedDoctor: 1, registrationTime: 1 })
      .lean()

    // Group by doctor
    const grouped = {}
    for (const p of patients) {
      const docName = p.assignedDoctor?.name || 'Unassigned'
      if (!grouped[docName]) grouped[docName] = { doctor: docName, patients: [] }
      grouped[docName].patients.push({
        name:             p.name,
        phone:            p.phone || '—',
        registrationTime: p.registrationTime,
        totalAmount:      p.totalAmount || 0,
        status:           p.status,
      })
    }

    const groups = Object.values(grouped)
    const totalPatients  = patients.length
    const totalCollection = patients.reduce((s, p) => s + (p.totalAmount || 0), 0)

    res.json({ success: true, data: { date: dayStart, groups, totalPatients, totalCollection } })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
})

export default router