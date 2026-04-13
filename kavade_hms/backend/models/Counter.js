import mongoose from 'mongoose'

// Atomic sequence counter — used to generate collision-free patientId values
// even under concurrent inserts.
const counterSchema = new mongoose.Schema({
  _id: { type: String, required: true },   // counter name, e.g. 'patient'
  seq: { type: Number, default: 0 },
})

export default mongoose.model('Counter', counterSchema)
