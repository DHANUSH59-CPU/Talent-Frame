const mongoose = require("mongoose");

const { Schema } = mongoose;

const ProfileSchema = new Schema({
    Name:{
        type: String,
        required:true
    }

  
});

const Profile = mongoose.model("Profile", ProfileSchema);
module.exports = Profile;
