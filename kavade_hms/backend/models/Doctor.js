import mongoose from 'mongoose'

const doctorSchema = new mongoose.Schema({
  name:      { type: String, required: true, trim: true },
  specialty: { type: String, required: true, trim: true },
  phone:     { type: String, trim: true },
  email:     { type: String, trim: true },
  isActive:  { type: Boolean, default: true },
}, { timestamps: true })

export default mongoose.model('Doctor', doctorSchema)
