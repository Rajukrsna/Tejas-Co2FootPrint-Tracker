const mongoose = require('mongoose');




const dailySchema = new mongoose.Schema({
    userId: {
        type: String,
        ref: 'User',
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
    date: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Daily', dailySchema);
