const mongoose = require('mongoose');
const dotenv = require('dotenv');
const FoodCourt = require('./models/FoodCourt');
const CrowdStatus = require('./models/CrowdStatus');
const Department = require('./models/Department');
const Lab = require('./models/Lab');
const BusRoute = require('./models/BusRoute');
const User = require('./models/User');

dotenv.config();

const seedData = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected for Seeding');

        // ── Clear old data ──
        await FoodCourt.deleteMany();
        await CrowdStatus.deleteMany();
        await Department.deleteMany();
        await Lab.deleteMany();
        await BusRoute.deleteMany();

        // ── Departments (ADTU) ──
        const departments = await Department.insertMany([
            { name: 'Computer Science & Engineering', code: 'CSE', faculty: 'Faculty of Engineering & Technology', building: 'Academic Block A', floor: '2nd Floor', hodName: 'Dr. Dulumani Das', hodEmail: 'hod.cse@adtu.in', hodAvailable: true },
            { name: 'Computer Technology', code: 'CT', faculty: 'Faculty of Computer Technology', building: 'Academic Block A', floor: '3rd Floor', hodName: 'Dr. S. Kumar', hodEmail: 'hod.ct@adtu.in', hodAvailable: false },
            { name: 'Mechanical Engineering', code: 'ME', faculty: 'Faculty of Engineering & Technology', building: 'Academic Block B', floor: '1st Floor', hodName: 'Dr. R. Kalita', hodEmail: 'hod.me@adtu.in', hodAvailable: true },
            { name: 'Civil Engineering', code: 'CE', faculty: 'Faculty of Engineering & Technology', building: 'Academic Block B', floor: '2nd Floor', hodName: 'Dr. P. Bora', hodEmail: 'hod.ce@adtu.in', hodAvailable: false },
            { name: 'Pharmacy', code: 'PHARMA', faculty: 'Faculty of Pharmaceutical Science', building: 'Pharmacy Block', floor: 'Ground Floor', hodName: 'Dr. A. Goswami', hodEmail: 'hod.pharma@adtu.in', hodAvailable: true },
            { name: 'Nursing', code: 'NUR', faculty: 'Faculty of Nursing', building: 'Nursing Block', floor: '1st Floor', hodName: 'Dr. L. Devi', hodEmail: 'hod.nursing@adtu.in', hodAvailable: false },
            { name: 'Commerce & Management', code: 'COM', faculty: 'Faculty of Commerce & Management', building: 'Admin Block', floor: '3rd Floor', hodName: 'Dr. M. Sharma', hodEmail: 'hod.commerce@adtu.in', hodAvailable: true },
            { name: 'Allied Health Sciences', code: 'AHS', faculty: 'Faculty of Allied Health Sciences', building: 'Medical Block', floor: '1st Floor', hodName: 'Dr. T. Das', hodEmail: 'hod.ahs@adtu.in', hodAvailable: true },
            { name: 'Humanities & Social Sciences', code: 'HSS', faculty: 'Faculty of Humanities & Social Sciences', building: 'Academic Block A', floor: '1st Floor', hodName: 'Dr. N. Barua', hodEmail: 'hod.hss@adtu.in', hodAvailable: false },
            { name: 'Agricultural Sciences', code: 'AGRI', faculty: 'Faculty of Agricultural Sciences', building: 'Agricultural Block', floor: 'Ground Floor', hodName: 'Dr. B. Choudhury', hodEmail: 'hod.agri@adtu.in', hodAvailable: true },
        ]);
        console.log('✅ Departments SEEDED');

        // ── Labs ──
        const cse = departments.find(d => d.code === 'CSE');
        const me = departments.find(d => d.code === 'ME');
        const pharma = departments.find(d => d.code === 'PHARMA');
        const nur = departments.find(d => d.code === 'NUR');
        const ahs = departments.find(d => d.code === 'AHS');

        await Lab.insertMany([
            { name: 'Computer Lab 1', building: 'Academic Block A', floor: '2nd Floor', roomNumber: 'A-201', capacity: 60, department: cse._id, equipment: ['Desktop PCs', 'Projector', 'Whiteboard'] },
            { name: 'Computer Lab 2', building: 'Academic Block A', floor: '2nd Floor', roomNumber: 'A-202', capacity: 40, department: cse._id, equipment: ['Desktop PCs', 'Smart Board'] },
            { name: 'Physics Lab', building: 'Academic Block B', floor: '1st Floor', roomNumber: 'B-101', capacity: 30, department: me._id, equipment: ['Oscilloscope', 'Spectrometer', 'Optical Bench'] },
            { name: 'Engineering Workshop', building: 'Academic Block B', floor: 'Ground Floor', roomNumber: 'B-001', capacity: 50, department: me._id, equipment: ['Lathe', 'Welding Station', 'Drilling Machine'] },
            { name: 'Pharmacy Lab', building: 'Pharmacy Block', floor: 'Ground Floor', roomNumber: 'P-001', capacity: 30, department: pharma._id, equipment: ['Microscopes', 'Distillation Setup', 'Chemical Reagents'] },
            { name: 'Nursing Simulation Lab', building: 'Nursing Block', floor: '1st Floor', roomNumber: 'N-101', capacity: 25, department: nur._id, equipment: ['Patient Simulators', 'IV Trainers', 'CPR Mannequins'] },
            { name: 'Anatomy Lab', building: 'Medical Block', floor: '1st Floor', roomNumber: 'M-101', capacity: 35, department: ahs._id, equipment: ['Anatomical Models', 'Dissection Kits', 'Microscopes'] },
            { name: 'Radiology & Imaging Lab', building: 'Medical Block', floor: '2nd Floor', roomNumber: 'M-201', capacity: 20, department: ahs._id, equipment: ['X-Ray Viewer', 'Ultrasound Machine', 'PACS System'] },
        ]);
        console.log('✅ Labs SEEDED');

        // ── Campus Areas / Food Courts ──
        const courts = await FoodCourt.insertMany([
            { name: 'A Block - Hall 1 (Ground Floor)', location: 'Academic Block A', capacity: 150 },
            { name: 'A Block - Hall 2 (Ground Floor)', location: 'Academic Block A', capacity: 150 },
            { name: 'A Block - Reception (Ground Floor)', location: 'Academic Block A', capacity: 50 },
            { name: 'A Block - Food Court (1st Floor)', location: 'Academic Block A', capacity: 200 },
            { name: 'B Block - Main Corridor', location: 'Academic Block B', capacity: 300 },
            { name: 'C Block - Student Lounge', location: 'Academic Block C', capacity: 80 },
            { name: 'D Block - Open Area', location: 'Academic Block D', capacity: 250 },
            { name: 'E Block - Mini Cafe', location: 'Academic Block E', capacity: 60 },
            { name: 'F Block - Central Hub', location: 'Academic Block F', capacity: 400 },
            { name: 'G Block - Reading Zone', location: 'Academic Block G', capacity: 100 },
            { name: 'H Block - Indoor Sports', location: 'Academic Block H', capacity: 200 },
            { name: 'I Block - Discussion Rooms', location: 'Academic Block I', capacity: 50 },
            { name: 'J Block - Main Library', location: 'Academic Block J', capacity: 500 },
            { name: 'K Block - Tech Labs', location: 'Academic Block K', capacity: 150 },
            { name: 'L Block - Innovation Center', location: 'Academic Block L', capacity: 120 },
            { name: 'HE Block - Activity Center', location: 'Academic Block HE', capacity: 180 },
            { name: 'Warden Office', location: 'Hostel Block, Ground Floor', capacity: 15 },
        ]);
        await CrowdStatus.insertMany(courts.map(c => ({
            foodCourtId: c._id, peopleCount: 0, crowdLevel: 'LOW'
        })));
        console.log('✅ Campus Areas SEEDED');

        // ── Bus Routes ──
        await BusRoute.insertMany([
            {
                routeName: 'Guwahati Railway Station → Campus',
                busNumber: 'ADTU-01',
                driverName: 'Rajesh Kumar',
                driverContact: '+91 98765 43210',
                departureTime: '07:00',
                arrivalTimeCampus: '08:00',
                returnDepartureTime: '17:00',
                stops: [
                    { name: 'Guwahati Railway Station', arrivalTime: '07:00', order: 1 },
                    { name: 'Paltan Bazar', arrivalTime: '07:10', order: 2 },
                    { name: 'Chandmari', arrivalTime: '07:25', order: 3 },
                    { name: 'Zoo Road', arrivalTime: '07:35', order: 4 },
                    { name: 'Panikhaiti (ADTU)', arrivalTime: '08:00', order: 5 },
                ]
            },
            {
                routeName: 'Fancy Bazar → Campus',
                busNumber: 'ADTU-02',
                driverName: 'Mohan Das',
                driverContact: '+91 98765 43211',
                departureTime: '07:15',
                arrivalTimeCampus: '08:00',
                returnDepartureTime: '17:00',
                stops: [
                    { name: 'Fancy Bazar', arrivalTime: '07:15', order: 1 },
                    { name: 'Pan Bazar', arrivalTime: '07:25', order: 2 },
                    { name: 'Ulubari', arrivalTime: '07:35', order: 3 },
                    { name: 'Narengi', arrivalTime: '07:45', order: 4 },
                    { name: 'Panikhaiti (ADTU)', arrivalTime: '08:00', order: 5 },
                ]
            },
            {
                routeName: 'Maligaon → Campus',
                busNumber: 'ADTU-03',
                driverName: 'Bimal Nath',
                driverContact: '+91 98765 43212',
                departureTime: '07:30',
                arrivalTimeCampus: '08:10',
                returnDepartureTime: '17:15',
                stops: [
                    { name: 'Maligaon', arrivalTime: '07:30', order: 1 },
                    { name: 'Adabari', arrivalTime: '07:40', order: 2 },
                    { name: 'Basistha', arrivalTime: '07:55', order: 3 },
                    { name: 'Panikhaiti (ADTU)', arrivalTime: '08:10', order: 4 },
                ]
            },
        ]);
        console.log('✅ Bus Routes SEEDED');

        // ── Promote superuser (only if not already superadmin) ──
        const superuserEmail = 'ashutoshpratap107@gmail.com';
        const existing = await User.findOne({ email: superuserEmail });
        if (existing && existing.role === 'superadmin') {
            console.log(`✅ ${superuserEmail} is already superadmin — skipped`);
        } else if (existing) {
            await User.updateOne({ email: superuserEmail }, { $set: { role: 'superadmin' } });
            console.log(`✅ ${superuserEmail} promoted to superadmin`);
        } else {
            console.log(`ℹ️  ${superuserEmail} not found — sign up first, then re-run seed`);
        }

        console.log('\n🎉 All ADTU data seeded successfully!');
        process.exit();
    } catch (error) {
        console.error('Seed Error:', error);
        process.exit(1);
    }
};

seedData();
