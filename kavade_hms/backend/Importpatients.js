import mongoose from 'mongoose'
import dotenv   from 'dotenv'
import fs       from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import Patient  from './models/Patient.js'

dotenv.config()

const __dirname = dirname(fileURLToPath(import.meta.url))

const importPatients = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI)
    console.log('✅ Connected to MongoDB')

    // Safety check — don't overwrite real data
    const existing = await Patient.countDocuments()
    if (existing > 0) {
      console.log(`⚠️  Database already has ${existing} patients.`)
      console.log('   If you want to reimport, drop the patients collection first:')
      console.log('   mongosh kavade_hms --eval "db.patients.drop()"')
      process.exit(0)
    }

    // Load JSON
    const filePath = join(__dirname, 'patients.json')
    if (!fs.existsSync(filePath)) {
      console.error('❌ patients.json not found in backend/ folder')
      process.exit(1)
    }

    const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'))
    console.log(`📂 Loaded ${data.length} patients from patients.json`)

    // Insert in batches of 50
    const BATCH = 50
    let inserted = 0
    for (let i = 0; i < data.length; i += BATCH) {
      const batch = data.slice(i, i + BATCH)
      await Patient.insertMany(batch, { ordered: false })
      inserted += batch.length
      process.stdout.write(`\r⏳ Inserting... ${inserted}/${data.length}`)
    }

    console.log(`\n✅ Successfully imported ${inserted} patients`)
    console.log('─'.repeat(40))

    // Summary
    const summary = await Patient.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
      { $sort:  { _id: 1 } }
    ])
    console.log('Status breakdown:')
    summary.forEach(s => console.log(`  ${s._id.padEnd(20)} : ${s.count}`))
    console.log('─'.repeat(40))

    process.exit(0)
  } catch (err) {
    console.error('❌ Import failed:', err.message)
    process.exit(1)
  }
}

importPatients()