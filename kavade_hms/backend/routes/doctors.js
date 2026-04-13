import express from 'express'
import Doctor  from '../models/Doctor.js'
import User    from '../models/User.js'
import Patient from '../models/Patient.js'
import { protect, authorize } from '../middleware/auth.js'

const router = express.Router()

router.get('/', protect, async (req, res) => {
  try {
    const doctors = await Doctor.find({ isActive: true }).sort({ name: 1 })
    res.json({ success: true, data: doctors })
  } catch (err) { res.status(500).json({ success: false, message: err.message }) }
})

router.post('/', protect, authorize('admin'), async (req, res) => {
  try {
    const { name, specialty, phone, email } = req.body
    const doctor = await Doctor.create({ name, specialty, phone, email })
    res.status(201).json({ success: true, data: doctor })
  } catch (err) { res.status(400).json({ success: false, message: err.message }) }
})

router.put('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const doctor = await Doctor.findByIdAndUpdate(req.params.id, req.body, { new: true })
    res.json({ success: true, data: doctor })
  } catch (err) { res.status(400).json({ success: false, message: err.message }) }
})

router.delete('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const active = await Patient.find({
      assignedDoctor: req.params.id,
      status: { $in: ['Registered', 'Doctor Pending', 'Doctor Completed'] },
    })
    if (active.length > 0)
      return res.status(400).json({ success: false, message: `Cannot delete. Doctor has ${active.length} active patient(s).` })
    await Doctor.findByIdAndDelete(req.params.id)
    await User.findOneAndUpdate({ doctorRef: req.params.id }, { isActive: false })
    res.json({ success: true, message: 'Doctor removed.' })
  } catch (err) { res.status(500).json({ success: false, message: err.message }) }
})

export default router
