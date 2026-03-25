const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

// Password regex: min 8 chars, at least 1 uppercase, 1 lowercase, 1 number, 1 special char
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#^()_\-+=])[A-Za-z\d@$!%*?&#^()_\-+=]{8,}$/;

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['student', 'teacher', 'superadmin'], default: 'student' },

    // Student-specific
    rollNumber: { type: String },
    courseName: { type: String },

    // Teacher-specific
    employeeId: { type: String },
    designation: { type: String },
    specialization: { type: String },

    // Common
    departmentName: { type: String, required: true },
    branchName: { type: String },
    department: { type: mongoose.Schema.Types.ObjectId, ref: 'Department' },
}, {
    timestamps: true
});

userSchema.pre('save', async function () {
    if (!this.isModified('password')) return;
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

userSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

// Export regex so controllers can use it too
userSchema.statics.PASSWORD_REGEX = PASSWORD_REGEX;

const User = mongoose.model('User', userSchema);
module.exports = User;
