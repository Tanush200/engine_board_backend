const User = require('../models/User');

const checkPayment = async (req, res, next) => {
    try {
        const user = await User.findById(req.user.id);

        if (!user) {
            return res.status(404).json({
                message: 'User not found'
            });
        }

        if (user.isPaid) {
            req.user.isPaid = user.isPaid;
            return next();
        }

        return res.status(403).json({
            message: 'Payment required',
            requiresPayment: true
        });
    } catch (error) {
        console.error('Error in checkPayment middleware:', error);
        return res.status(500).json({
            message: 'Server error checking payment status'
        });
    }
};

module.exports = checkPayment;
