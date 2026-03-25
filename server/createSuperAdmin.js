const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');
const Department = require('./models/Department');

dotenv.config();

const createSuperAdmin = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected');

        const email = 'ashutoshpratap107@gmail.com';

        // Delete if exists
        const deleted = await User.deleteOne({ email });
        if (deleted.deletedCount > 0) console.log('Old account removed.');

        // Find CSE department
        const dept = await Department.findOne({ code: 'CSE' });

        const superadmin = new User({
            name: 'Ashutosh Pratap',
            email,
            password: '987654321',
            role: 'superadmin',
            departmentName: 'Computer Science & Engineering',
            department: dept ? dept._id : undefined,
        });

        await superadmin.save();

        console.log('\n✅ SuperAdmin created successfully!');
        console.log('─────────────────────────────');
        console.log(`   Email:    ${email}`);
        console.log(`   Password: 987654321`);
        console.log(`   Role:     superadmin`);
        console.log(`   ID:       ${superadmin._id}`);
        console.log('─────────────────────────────\n');

        process.exit();
    } catch (error) {
        console.error('Error creating superadmin:', error.message);
        if (error.errors) {
            Object.keys(error.errors).forEach(key => {
                console.error(`  - ${key}: ${error.errors[key].message}`);
            });
        }
        process.exit(1);
    }
};

createSuperAdmin();
