const jwt = require('jsonwebtoken')

module.exports = function(req,res,next){
    const authHeader = req.header('Authorization');

    if(!authHeader) return res.status(401).json({message : 'No token , auth denied'});

    const token = authHeader.replace('Bearer ', '');

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded.user
        next()
    } catch (err) {
        res.status(401).json({message : 'Token not valid'})
    }
};