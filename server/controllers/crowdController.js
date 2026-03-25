const CrowdStatus = require('../models/CrowdStatus');
const FoodCourt = require('../models/FoodCourt');

const updateCrowdStatus = async (req, res) => {
    try {
        const { foodCourtId, peopleCount, crowdLevel } = req.body;

        let status = await CrowdStatus.findOne({ foodCourtId });

        if (status) {
            status.peopleCount = peopleCount;
            status.crowdLevel = crowdLevel;
            await status.save();
        } else {
            status = await CrowdStatus.create({ foodCourtId, peopleCount, crowdLevel });
        }

        res.json(status);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getCrowdStatus = async (req, res) => {
    try {
        const status = await CrowdStatus.find().populate('foodCourtId', 'name location capacity');
        res.json(status);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getSuggestion = async (req, res) => {
    try {
        // Find food courts that are LOW or MEDIUM
        const altStatus = await CrowdStatus.find({ crowdLevel: { $in: ['LOW', 'MEDIUM'] } })
            .populate('foodCourtId', 'name location')
            .sort({ peopleCount: 1 }); // Less people first

        if (altStatus.length > 0) {
            res.json(altStatus[0]);
        } else {
            res.status(404).json({ message: 'No uncrowded food courts alternative found right now.' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { updateCrowdStatus, getCrowdStatus, getSuggestion };
