const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
    username: { type: String, required: true },
    pointsAwarded: { type: Number, required: true },
    timestamp: { type: Date, default: Date.now }, // Time of the transaction
});

const Transaction = mongoose.model('Transaction', transactionSchema);
module.exports = Transaction;
