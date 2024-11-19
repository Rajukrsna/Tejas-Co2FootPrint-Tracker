const mongoose = require('mongoose');


const emissionFactors = {
    car_petrol: 2.4, // kg CO₂ per km
    car_diesel: 2.6,
    public_transport: 0.3,
    bicycle: 0,
    walk: 0,
    electric_vehicle: 0.5,
    renewable: 0,
    nonrenewable: 0.7, // kg CO₂ per kWh
    non_vegetarian: 4.7, // kg CO₂ per meal
    balanced: 2.5,
    vegetarian: 1.5,
    vegan: 1.0,
    flights: 90 // kg CO₂ per flight hour
};

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
