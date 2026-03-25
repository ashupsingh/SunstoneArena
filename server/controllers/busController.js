const BusRoute = require('../models/BusRoute');

const getAllRoutes = async (req, res) => {
    try {
        const routes = await BusRoute.find({ isActive: true }).sort({ routeName: 1 });
        res.json(routes);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const createRoute = async (req, res) => {
    try {
        const route = await BusRoute.create(req.body);
        res.status(201).json(route);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

const updateRoute = async (req, res) => {
    try {
        const route = await BusRoute.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!route) return res.status(404).json({ message: 'Route not found' });
        res.json(route);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

const deleteRoute = async (req, res) => {
    try {
        await BusRoute.findByIdAndDelete(req.params.id);
        res.json({ message: 'Route deleted' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { getAllRoutes, createRoute, updateRoute, deleteRoute };
