const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');

dotenv.config();

const promoteAdmin = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected');

        const email = 'ashutoshpratap107@gmail.com';
        const user = await User.findOne({ email });

        if (user) {
            user.role = 'admin';
            await User.updateOne({ email }, { $set: { role: 'admin' } });
            console.log(`✅ ${email} promoted to admin successfully!`);
        } else {
            console.log(`❌ User ${email} not found. Please sign up first.`);
        }

        process.exit();
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};

promoteAdmin();
