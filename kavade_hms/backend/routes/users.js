import express  from 'express'
import mongoose from 'mongoose'
import User     from '../models/User.js'
import { protect, authorize } from '../middleware/auth.js'

const router = express.Router()

// ✅ Profile routes FIRST — before /:id routes
router.get('/profile', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password').populate('doctorRef')
    res.json({ success: true, data: user })
  } catch (err) { res.status(500).json({ success: false, message: err.message }) }
})

router.put('/profile', protect, async (req, res) => {
  try {
    const { name, currentPassword, newPassword } = req.body
    const user = await User.findById(req.user._id).select('+password')
    if (name) user.name = name
    if (name && user.role === 'doctor' && user.doctorRef) {
      await mongoose.model('Doctor').findByIdAndUpdate(user.doctorRef, { name })
    }
    if (currentPassword && newPassword) {
      const match = await user.matchPassword(currentPassword)
      if (!match) return res.status(400).json({ success: false, message: 'Current password incorrect.' })
      user.password = newPassword
    }
    await user.save()
    const updated = await User.findById(user._id).select('-password').populate('doctorRef')
    res.json({ success: true, data: updated })
  } catch (err) { res.status(500).json({ success: false, message: err.message }) }
})

// /:id routes AFTER — so "profile" is never mistaken for an ObjectId
router.get('/', protect, authorize('admin'), async (req, res) => {
  try {
    const users = await User.find().populate('doctorRef').sort({ createdAt: -1 })
    res.json({ success: true, data: users })
  } catch (err) { res.status(500).json({ success: false, message: err.message }) }
})

router.post('/', protect, authorize('admin'), async (req, res) => {
  try {
    const body = { ...req.body }
    if (!body.doctorRef || body.doctorRef === '') body.doctorRef = null
    const user = new User(body)
    await user.save()
    const populated = await User.findById(user._id).populate('doctorRef')
    res.status(201).json({ success: true, data: populated })
  } catch (err) { res.status(400).json({ success: false, message: err.message }) }
})

router.put('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const body = { ...req.body }
    if (!body.doctorRef || body.doctorRef === '') body.doctorRef = null
    // Never allow password to be updated via this admin route —
    // findByIdAndUpdate bypasses the pre('save') hashing hook.
    // Password changes must go through PUT /users/profile instead.
    delete body.password
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { $set: body },
      { new: true, runValidators: true }
    ).populate('doctorRef')
    res.json({ success: true, data: user })
  } catch (err) { res.status(400).json({ success: false, message: err.message }) }
})

router.delete('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id)
    res.json({ success: true, message: 'User deleted.' })
  } catch (err) { res.status(500).json({ success: false, message: err.message }) }
})

export default router