const mongoose = require('mongoose');
const UserSchema = new mongoose.Schema({
    name: {
        type:String,
        required : true
    },
    email : {
        type:String,
        required:true,
        unique:true
    },
    password:{
        type:String,
        required:true
    },
    collage:{
        type:String,
        default:''
    },
    branch:{
        type:String,
        default:''
    },
    year:{
        type:Number,
        default:1
    },
    createdAt:{
        type:Date,
        default:Date.now()
    },
})

module.exports = mongoose.model('User',UserSchema);
