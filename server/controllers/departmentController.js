const Department = require('../models/Department');

const getAllDepartments = async (req, res) => {
    try {
        const departments = await Department.find().sort({ name: 1 });
        res.json(departments);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const createDepartment = async (req, res) => {
    try {
        const dept = await Department.create(req.body);
        res.status(201).json(dept);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

const updateDepartment = async (req, res) => {
    try {
        const dept = await Department.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!dept) return res.status(404).json({ message: 'Department not found' });
        res.json(dept);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

const toggleHodAvailability = async (req, res) => {
    try {
        const dept = await Department.findById(req.params.id);
        if (!dept) return res.status(404).json({ message: 'Department not found' });
        dept.hodAvailable = !dept.hodAvailable;
        if (req.body.note) dept.hodAvailableNote = req.body.note;
        await dept.save();
        res.json(dept);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const deleteDepartment = async (req, res) => {
    try {
        await Department.findByIdAndDelete(req.params.id);
        res.json({ message: 'Department deleted' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { getAllDepartments, createDepartment, updateDepartment, toggleHodAvailability, deleteDepartment };
