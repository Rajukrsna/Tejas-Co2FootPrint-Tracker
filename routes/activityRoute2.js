const express = require('express');
const router = express.Router();
const Activity = require('../models/Activity');
const authenticateToken = require('../middlewares/auth');
const dotenv = require('dotenv');
const axios = require('axios');
const mongoose = require('mongoose');
const Daily = require('../models/daily');
const User = require('../models/User');

dotenv.config();
const LAMBDA_API_URL =process.env.URILAMA;

router.get('/',authenticateToken ,(req,res)=>
{
    res.render('logactivity2');

})

router.post('/log',authenticateToken, async (req, res) => {
  const userInput = req.body; // Collect input from the user
    let suggestions = '';
    const userId = req.user.userId;
    const { transportation, energy, diet, recycling, travel } = req.body;
    const emissionFactors2 = {
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
   // Calculate CO₂ emissions for each category
   let co2_transportation = emissionFactors2[transportation]* 20 || 0;
   let co2_energy = emissionFactors2[energy]*30 || 0;
   let co2_diet = emissionFactors2[diet] *60 || 0;
   let co2_recycling = emissionFactors2[recycling] === 'always' ? 0.1 : (emissionFactors2[recycling] === 'sometimes' ? 0.2 : 0.3);  // Example values
   let co2_travel = emissionFactors2.flights * travel; // Assume average flight hours per trip

   const user = await User.findById(req.user.userId);

   const dailyact = new Daily({
    userId:user._id,
    transportation,
    energy,
    diet,
    recycling,
    travel,
    co2_transportation,
    co2_energy,
    co2_diet,
    co2_recycling,
    co2_travel
});
    await dailyact.save()
    try {
      //call the AI model for the response
      const response = await axios.post(
        LAMBDA_API_URL,
        { prompt: `Given the following user data: ${userInput}, suggest activities to reduce carbon footprint.`
      
         },
          
         // Send input as a JSON object
        {
            headers: {
                'Content-Type': 'text/plain', // Set Content-Type to application/json
                'Accept': 'application/json'
            }
        }
    );

    // Parse Lambda response
    if (response.data && response.data.body) {
        const lambdaBody = JSON.parse(response.data.body);  // Parse JSON string in `body`
        suggestions = lambdaBody.reply || 'Unexpected response format from Lambda.';
    } else {
        suggestions = 'Unexpected response format from Lambda.';
    }

    const emissionFactors = {
      car: 2.4, // kg CO₂ per km
      public_transport: 0.3,
      bicycle: 0,
      walking: 0,
      electric_vehicle: 0.5,
      diet: {
          non_vegetarian: 4.7, // kg CO₂ per meal
          balanced: 2.5,
          vegetarian: 1.5,
          vegan: 1.0
      },
      flights: 90 // kg CO₂ per flight hour
  };

  // Calculate CO₂ emissions
  let co2Emitted = 0;
  if (transportation === 'car_petrol') co2Emitted += emissionFactors.car * 20; // Assume 20 km/day
  if (transportation === 'public_transport') co2Emitted += emissionFactors.public_transport * 20;
  if (transportation === 'electric_vehicle') co2Emitted += emissionFactors.electric_vehicle * 20;

  co2Emitted += emissionFactors.diet[diet] * 90; // Assume 90 meals/month
  co2Emitted += travel * emissionFactors.flights;

  // Reduction examples
  let co2Reduced = 0;
  if (transportation === 'bicycle' || transportation === 'walking') {
      co2Reduced += 2; // Assume 2 kg reduction/day
  }

    
        // Save activity to database
        const newActivity = new Activity({
          userId:user._id,
          suggestions:suggestions,
          co2: co2Emitted - co2Reduced, // Positive for net emission
          reduction:0,
          date: new Date()
      });

    await newActivity.save();

     
    
  res.redirect('/dashboard');
      
    } catch (err) {
        res.status(500).send('Error generating suggestions');
    }
});



router.get('/category-breakdown', authenticateToken, async (req, res) => {
    const userId = req.user.userId;

    try {
        const breakdown = await Activity.aggregate([
            { $match: { userId: new mongoose.Types.ObjectId(userId) } }, // Filter by user
            {
                $group: {
                    _id: null, // No need to group by type, but keep both values
                    totalEmission: { $sum: '$co2' }, // Sum total CO2 emissions
                    totalReduction: { $sum: '$reduction' } // Sum total CO2 reductions
                }
            }
        ]);

        // Prepare data in the format required for the chart
        const response = [
            { _id: 'Emission', totalCo2: breakdown[0]?.totalEmission || 0 },
            { _id: 'Reduction', totalCo2: breakdown[0]?.totalReduction || 0 }
        ];

        res.json(response);

    } catch (err) {
        console.error(err);
        res.status(500).send('Error fetching category breakdown');
    }
});

router.get('/activity-breakdown', authenticateToken, async (req, res) => {
    const userId = req.user.userId;

    try {
        // Fetch CO₂ breakdown data by category for the user
        const breakdown = await Daily.aggregate([
            { $match: { userId: new mongoose.Types.ObjectId(userId) } },
            {
                $project: {
                    _id: 0,
                    co2_transportation: 1,
                    co2_energy: 1,
                    co2_diet: 1,
                    co2_recycling: 1,
                    co2_travel: 1
                }
            }
        ]);

        // If data exists, return it; else return empty
        const activity = breakdown[0] || {};

        res.status(200).json({
            categories: [
                { label: 'Transportation', value: activity.co2_transportation || 0 },
                { label: 'Energy', value: activity.co2_energy || 0 },
                { label: 'Diet', value: activity.co2_diet || 0 },
                { label: 'Recycling', value: activity.co2_recycling || 0 },
                { label: 'Travel', value: activity.co2_travel || 0 }
            ]
        });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching data.', error });
    }
});





module.exports = router;
