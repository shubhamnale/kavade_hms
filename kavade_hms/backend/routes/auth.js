import express from 'express'
import jwt     from 'jsonwebtoken'
import User    from '../models/User.js'
import { protect } from '../middleware/auth.js'

const router = express.Router()

router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body
    if (!username || !password)
      return res.status(400).json({ success: false, message: 'Username and password required.' })

    const user = await User.findOne({ username: username.toLowerCase() }).select('+password')
    if (!user || !user.isActive)
      return res.status(401).json({ success: false, message: 'Invalid credentials.' })

    const match = await user.matchPassword(password)
    if (!match)
      return res.status(401).json({ success: false, message: 'Invalid credentials.' })

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '24h' })

    res.json({
      success: true,
      token,
      user: {
        _id:       user._id,
        username:  user.username,
        name:      user.name,
        role:      user.role,
        doctorRef: user.doctorRef,   // ObjectId — used for pickup auto-assign
      },
    })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
})

router.get('/me', protect, async (req, res) => {
  res.json({ success: true, data: req.user })
})

export default router


