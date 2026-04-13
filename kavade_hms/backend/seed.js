import mongoose from 'mongoose'
import dotenv   from 'dotenv'
import User     from './models/User.js'

dotenv.config()

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI)
    console.log('✅ Connected to MongoDB')

    const existing = await User.findOne({ role: 'admin' })
    if (existing) {
      console.log('⚠️  Admin already exists — skipping seed')
      console.log('   If you want to reset, manually drop the database first.')
      process.exit(0)
    }

    await new User({
      username: 'admin',
      password: 'admin123',
      name:     'Administrator',
      role:     'admin',
    }).save()

    console.log('👤  Admin account created')
    console.log('─'.repeat(40))
    console.log('Login Credentials:')
    console.log('  username : admin')
    console.log('  password : admin123')
    console.log('─'.repeat(40))
    console.log('⚠️  Change the password after first login!')
    console.log('   Create doctors and staff via the HMS.')
    process.exit(0)

  } catch (err) {
    console.error('❌ Seed failed:', err.message)
    process.exit(1)
  }
}

seed()


/**
 * seed2000.js — Generate 2000 realistic test patients
 *
 * Usage:
 *   cd backend
 *   node seed2000.js
 *
 * Keeps all existing users and doctors.
 * Deletes and re-creates Patient records only.
 */

// import mongoose from 'mongoose'
// import dotenv   from 'dotenv'
// import Patient  from './models/Patient.js'
// import Doctor   from './models/Doctor.js'

// dotenv.config()

// // ── Data pools ────────────────────────────────────────────────────────────────

// const FIRST_NAMES = [
//   'Aarav','Aditya','Akash','Amit','Anand','Anil','Arjun','Ashok','Deepak','Dhruv',
//   'Gaurav','Girish','Gopal','Harsh','Hemant','Ishaan','Karan','Kunal','Lokesh','Manoj',
//   'Mohan','Neeraj','Nikhil','Pankaj','Pradeep','Prakash','Pranav','Rahul','Rajesh','Rakesh',
//   'Ramesh','Rohit','Sachin','Sanjay','Saurabh','Shubham','Suresh','Tarun','Umesh','Vikas',
//   'Aarti','Ankita','Anuja','Archana','Asmita','Deepa','Divya','Gayatri','Geeta','Hemlata',
//   'Jyoti','Kavita','Komal','Lata','Madhuri','Manisha','Meena','Meera','Minal','Nandini',
//   'Neha','Pallavi','Pooja','Priya','Ranjana','Rekha','Ritu','Savita','Seema','Shital',
//   'Shreya','Sneha','Sonal','Sunita','Swati','Usha','Vaishali','Varsha','Vidya','Vrinda',
// ]

// const LAST_NAMES = [
//   'Patil','Sharma','Joshi','Kulkarni','Desai','Mehta','Shah','Patel','Verma','Gupta',
//   'Singh','Kumar','Yadav','Tiwari','Shukla','Mishra','Pandey','Dubey','Rao','Nair',
//   'Iyer','Pillai','Menon','Reddy','Naidu','Krishnan','Hegde','Kamath','Bhat','More',
//   'Jadhav','Bhosale','Gaikwad','Shinde','Pawar','Sawant','Mane','Kale','Wagh','Deshpande',
// ]

// const ADDRESSES = [
//   'Shivaji Nagar, Pune','Kothrud, Pune','Baner, Pune','Wakad, Pune','Hinjewadi, Pune',
//   'Aundh, Pune','Bavdhan, Pune','Karve Nagar, Pune','Deccan, Pune','FC Road, Pune',
//   'Camp, Pune','Koregaon Park, Pune','Viman Nagar, Pune','Magarpatta, Pune','Hadapsar, Pune',
//   'Pimpri, Pimpri-Chinchwad','Chinchwad, Pimpri-Chinchwad','Akurdi, Pimpri-Chinchwad',
//   'Nigdi, Pimpri-Chinchwad','Bhosari, Pimpri-Chinchwad','Sangvi, Pimpri-Chinchwad',
//   'Kasarwadi, Pimpri-Chinchwad','Dapodi, Pimpri-Chinchwad','Kalewadi, Pimpri-Chinchwad',
//   'Ravet, Pimpri-Chinchwad','Tathawade, Pimpri-Chinchwad','Moshi, Pimpri-Chinchwad',
//   'Chakan, Pune District','Dehu Road, Pune District','Talegaon, Pune District',
// ]

// const DIAGNOSES = [
//   'Viral fever with mild cough and cold',
//   'Hypertension — BP 150/95 mmHg, medication adjusted',
//   'Type 2 Diabetes Mellitus — routine follow-up, HbA1c review',
//   'Acute gastroenteritis — vomiting and loose stools for 2 days',
//   'Upper respiratory tract infection',
//   'Lower back pain — lumbar strain, physiotherapy advised',
//   'Migraine headache — moderate severity, photophobia present',
//   'Bronchial asthma — mild intermittent, inhaler prescribed',
//   'Urinary tract infection — urine culture sent',
//   'Anemia — Hb 9.2 g/dL, iron supplementation started',
//   'Hypothyroidism — TSH elevated, levothyroxine dose adjusted',
//   'Knee pain — bilateral osteoarthritis, analgesics prescribed',
//   'Allergic rhinitis — dust mite allergy, antihistamines given',
//   'Skin rash — contact dermatitis, topical steroid prescribed',
//   'Chest pain — costochondritis, ECG normal',
//   'Dizziness and vertigo — benign paroxysmal positional vertigo',
//   'Dengue fever — platelet count monitoring advised',
//   'Vitamin D deficiency — supplement 60,000 IU weekly x 8 weeks',
//   'Anxiety disorder — mild, counselling and low-dose SSRI started',
//   'Acute pharyngitis — throat swab sent, amoxicillin prescribed',
//   'Constipation — dietary modification and lactulose advised',
//   'Muscle cramps — electrolyte imbalance, ORS advised',
//   'Conjunctivitis — antibiotic eye drops prescribed for 5 days',
//   'Otitis media — ear pain, amoxicillin-clavulanate prescribed',
//   'Shoulder pain — rotator cuff tendinitis, physiotherapy advised',
//   'Fatty liver grade 1 — lifestyle modification counselled',
//   'Psoriasis plaque type — topical corticosteroid prescribed',
//   'Tension headache — analgesics and stress management advised',
//   'Rheumatoid arthritis follow-up — DMARD continued',
//   'Irritable bowel syndrome — dietary and lifestyle advice given',
//   'Sinusitis — nasal decongestant and steam inhalation advised',
//   'Acidity and GERD — pantoprazole prescribed, diet counselled',
//   'Plantar fasciitis — heel pain, rest and footwear advice given',
//   'Hyperlipidemia — atorvastatin started, diet modification',
//   'Chicken pox — symptomatic treatment, isolation advised',
//   'Typhoid fever — Widal positive, cefixime prescribed',
//   'Piles — grade 2 hemorrhoids, sitz bath and diet advice',
//   'Eczema — atopic dermatitis, moisturizer and steroid cream',
//   'Insomnia — sleep hygiene counselled, melatonin prescribed',
//   'Obesity — BMI 32, diet and exercise plan given',
// ]

// const MEDICINES_POOL = [
//   'Tab. Paracetamol 500mg','Tab. Ibuprofen 400mg','Tab. Amoxicillin 500mg',
//   'Tab. Azithromycin 500mg','Tab. Metformin 500mg','Tab. Amlodipine 5mg',
//   'Tab. Atorvastatin 10mg','Tab. Pantoprazole 40mg','Tab. Cetirizine 10mg',
//   'Tab. Levothyroxine 50mcg','Tab. Losartan 50mg','Tab. Metoprolol 25mg',
//   'Syr. Amoxicillin 125mg/5ml','Syr. Paracetamol 250mg/5ml',
//   'Cap. Omeprazole 20mg','Cap. Vitamin D3 60000 IU','Tab. Diclofenac 50mg',
//   'Tab. Cefixime 200mg','Tab. Domperidone 10mg','Tab. Loperamide 2mg',
//   'Tab. Ondansetron 4mg','Tab. Montelukast 10mg','Tab. Folic Acid 5mg',
//   'Tab. Ferrous Sulfate 200mg','Tab. Vitamin B12 1500mcg','Tab. Doxycycline 100mg',
//   'Tab. Metronidazole 400mg','Tab. Ranitidine 150mg','Tab. Multivitamin',
//   'Tab. Calcium + Vitamin D3',
// ]

// const FEES    = [100, 150, 200, 250, 300, 350, 400, 500]
// const CODES   = [[],[],'A','B','C',['A','B'],['A','C'],['B','C'],['A','B','C']]
// const GENDERS = ['Male','Female']

// // ── Helpers ───────────────────────────────────────────────────────────────────

// const pick    = arr => arr[Math.floor(Math.random() * arr.length)]
// const randInt = (a, b) => Math.floor(Math.random() * (b - a + 1)) + a

// function pickN(arr, n) {
//   return [...arr].sort(() => Math.random() - 0.5).slice(0, n)
// }

// function randPhone() {
//   const pre = ['98','97','96','95','94','93','91','90','89','88','87','86','85','84','83','82','81','80','79','78','77','76','75','74','70']
//   return pick(pre) + String(randInt(10000000, 99999999))
// }

// // Random date within last `daysBack` days, clinic hours 8am–7pm
// function randDate(daysBack) {
//   const now  = Date.now()
//   const past = now - daysBack * 86400000
//   const ts   = past + Math.random() * (now - past)
//   const d    = new Date(ts)
//   d.setHours(randInt(8, 18), randInt(0, 59), 0, 0)
//   return d
// }

// function pickStatus() {
//   const r = Math.random() * 100
//   if (r < 60) return 'Billed'
//   if (r < 80) return 'Doctor Completed'
//   if (r < 90) return 'Doctor Pending'
//   return 'Registered'
// }

// // ── Main ──────────────────────────────────────────────────────────────────────

// async function seed() {
//   try {
//     await mongoose.connect(process.env.MONGO_URI)
//     console.log('✅ MongoDB connected to:', process.env.MONGO_URI)

//     const doctors = await Doctor.find({ isActive: true })
//     if (!doctors.length) {
//       console.error('❌ No doctors found. Run "node seed.js" first to create doctors and users.')
//       process.exit(1)
//     }
//     console.log(`👨‍⚕️  Using ${doctors.length} doctors`)

//     await Patient.deleteMany({})
//     console.log('🗑  Cleared existing patients\n')

//     const TOTAL   = 2000
//     const BATCH   = 200
//     const records = []

//     for (let i = 0; i < TOTAL; i++) {
//       const firstName = pick(FIRST_NAMES)
//       const lastName  = pick(LAST_NAMES)
//       const gender    = pick(GENDERS)
//       const status    = pickStatus()

//       // Spread randomly over last 365 days; 15% chance of being today
//       const daysBack         = Math.random() < 0.15 ? 0 : randInt(1, 365)
//       const registrationTime = randDate(daysBack)

//       // Assign doctor (Registered patients: 30% chance of no doctor)
//       const noDoctor = status === 'Registered' && Math.random() < 0.3
//       const doctor   = noDoctor ? null : pick(doctors)

//       // Consultation timing
//       let consultationStart   = null
//       let consultationEnd     = null
//       let consultationMinutes = 0

//       if (status !== 'Registered') {
//         const startOffset   = randInt(5, 60)
//         consultationStart   = new Date(registrationTime.getTime() + startOffset * 60000)
//         consultationMinutes = randInt(3, 25)
//         consultationEnd     = new Date(consultationStart.getTime() + consultationMinutes * 60000)
//       }

//       // Fee, medicines, diagnosis for seen patients
//       let consultationFee  = 0
//       let diagnosis        = ''
//       let medicines        = []
//       let dispensedMeds    = []
//       let doctorCodes      = []

//       if (status !== 'Registered') {
//         consultationFee = pick(FEES)
//         diagnosis       = pick(DIAGNOSES)
//         const medCount  = randInt(1, 4)
//         medicines       = pickN(MEDICINES_POOL, medCount).map(name => ({ name }))
//         dispensedMeds   = Math.random() > 0.4
//           ? pickN(medicines.map(m => m.name), randInt(1, Math.min(2, medicines.length))).map(name => ({ name }))
//           : []
//         doctorCodes     = pick(CODES) || []
//         if (!Array.isArray(doctorCodes)) doctorCodes = [doctorCodes]
//       }

//       // Billing
//       let billingTime   = null
//       let paymentMethod = ''
//       let totalAmount   = 0

//       if (status === 'Billed') {
//         totalAmount   = consultationFee
//         billingTime   = new Date(consultationEnd.getTime() + randInt(5, 30) * 60000)
//         paymentMethod = pick(['Online', 'Offline'])
//       }

//       // Reassignment history (8% of Billed patients)
//       const reassignmentHistory = []
//       if (status === 'Billed' && Math.random() < 0.08 && doctors.length > 1) {
//         const fromDoc = pick(doctors.filter(d => d._id.toString() !== doctor?._id?.toString()))
//         if (fromDoc) {
//           reassignmentHistory.push({
//             fromDoctorName: fromDoc.name,
//             toDoctorName:   doctor?.name || '—',
//             at: new Date(registrationTime.getTime() + randInt(2, 15) * 60000),
//           })
//         }
//       }

//       records.push({
//         patientId:           'P' + String(i + 1).padStart(4, '0'),
//         name:                `${firstName} ${lastName}`,
//         age:                 randInt(2, 82),
//         gender,
//         phone:               randPhone(),
//         address:             pick(ADDRESSES),
//         status,
//         assignedDoctor:      doctor?._id || null,
//         diagnosis,
//         consultationFee,
//         medicines,
//         dispensedMedicines:  dispensedMeds,
//         doctorCodes,
//         paymentMethod,
//         totalAmount,
//         registrationTime,
//         visitDate:           registrationTime,
//         consultationStart,
//         consultationEnd,
//         consultationMinutes,
//         billingTime,
//         reassignmentHistory,
//       })
//     }

//     // Insert in batches
//     for (let i = 0; i < records.length; i += BATCH) {
//       await Patient.insertMany(records.slice(i, i + BATCH), { ordered: false })
//       process.stdout.write(`\r📋 Inserted ${Math.min(i + BATCH, TOTAL)} / ${TOTAL} patients…`)
//     }

//     console.log('\n')

//     // Final summary
//     const counts  = await Patient.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }, { $sort: { _id: 1 } }])
//     const revenue = await Patient.aggregate([{ $match: { status: 'Billed' } }, { $group: { _id: null, total: { $sum: '$totalAmount' } } }])
//     const today   = new Date(); today.setHours(0,0,0,0)
//     const todayCount = await Patient.countDocuments({ registrationTime: { $gte: today } })

//     console.log('─'.repeat(45))
//     console.log('📊 Results:')
//     counts.forEach(c => console.log(`   ${c._id.padEnd(20)} ${String(c.count).padStart(4)}`))
//     console.log('   ' + '─'.repeat(30))
//     console.log(`   Total               ${TOTAL}`)
//     console.log(`   Today's patients    ${todayCount}`)
//     console.log(`   Total revenue       ₹${(revenue[0]?.total || 0).toLocaleString('en-IN')}`)
//     console.log('─'.repeat(45))
//     console.log('✅ 2000 patients seeded successfully!\n')
//     process.exit(0)

//   } catch (err) {
//     console.error('\n❌ Error:', err.message)
//     process.exit(1)
//   }
// }

// seed()