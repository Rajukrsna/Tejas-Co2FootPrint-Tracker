const mongoose = require('mongoose');




const dailySchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    transportation: {
        type: String,
        required: true
    },
    energy: {
        type: String,
        required: true
    },
    diet: {
        type: String,
        required: true
    },
    recycling: {
        type: String,
        required: true
    },
    travel: {
        type: Number,
        required: true
    },
    co2_transportation: {
        type: Number,
        required: true
    },
    co2_energy: {
        type: Number,
        required: true
    },
    co2_diet: {
        type: Number,
        required: true
    },
    co2_recycling: {
        type: Number,
        required: true
    },
    co2_travel: {
        type: Number,
        required: true
    },
    date: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Daily', dailySchema);
