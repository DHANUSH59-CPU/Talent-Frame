const mongoose = require("mongoose");

const { Schema } = mongoose;

const AvatarSchema = new Schema({
  directorId: {
    type: Schema.Types.ObjectId,
    ref: "user",
    required: true,
  },
  AvatarURL: {
    type: String,
    required: true,
  },
});

const Avatar = mongoose.model("Avatar", AvatarSchema);
module.exports = Avatar;
