import mongoose from 'mongoose'
import Counter  from './Counter.js'

const patientSchema = new mongoose.Schema({
  patientId: { type: String, unique: true },
  name:      { type: String, required: true, trim: true },
  age:       { type: Number, required: true },
  gender:    { type: String, enum: ['Male','Female','Other'], default: 'Male' },
  phone:     { type: String, trim: true },
  address:   { type: String, trim: true },

  // Status flow:
  // Registered       🔴 — patient just registered by reception
  // Doctor Pending   🔵 — doctor opened/picked up patient
  // Doctor Completed 🟡 — doctor finished consultation
  // Billed           🟢 — billing collected payment
  status: {
    type:    String,
    enum:    ['Registered', 'Doctor Pending', 'Doctor Completed', 'Billed'],
    default: 'Registered',
  },

  assignedDoctor: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor', default: null },

  // Audit trail — plain strings only, no ObjectId refs needed
  reassignmentHistory: [{
    fromDoctorName: { type: String, default: 'Unassigned' },
    toDoctorName:   { type: String },
    at:             { type: Date,   default: Date.now },
    _id: false,
  }],

  diagnosis:       { type: String, default: '' },
  consultationFee: { type: Number, default: 0 },  // set by doctor during consultation

  medicines:          [{ name: String }],
  dispensedMedicines: [{ name: String }],
  investigations:     [{ name: String }],
  doctorCodes:        { type: [String], default: [] },

  paymentMethod: { type: String, enum: ['Online','Offline',''], default: '' },
  totalAmount:   { type: Number, default: 0 },

  registrationTime:    { type: Date, default: Date.now },
  visitDate:           { type: Date, default: Date.now },
  consultationStart:   { type: Date },
  consultationEnd:     { type: Date },
  consultationMinutes: { type: Number, default: 0 },
  billingTime:         { type: Date },

}, { timestamps: true })

patientSchema.index({ registrationTime: -1 })
patientSchema.index({ status: 1, registrationTime: -1 })
patientSchema.index({ assignedDoctor: 1, registrationTime: -1 })
patientSchema.index({ billingTime: -1 })

patientSchema.pre('save', async function (next) {
  if (!this.patientId) {
    const counter = await Counter.findByIdAndUpdate(
      'patient',
      { $inc: { seq: 1 } },
      { new: true, upsert: true }
    )
    this.patientId = 'P' + String(counter.seq).padStart(4, '0')
  }
  next()
})

export default mongoose.model('Patient', patientSchema)