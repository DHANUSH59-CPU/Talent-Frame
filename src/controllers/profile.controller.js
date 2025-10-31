const User = require("../models/User.model");

const getProfile = async (req, res) => {
  try {
    res.status(200).json({
      success: true,
      message: "Profile fetched successfully",
      profile: req.result,
    });
  } catch (err) {
    return res
      .status(500)
      .json({ message: err.message || "Internal Server Error" });
  }
};

const EditProfile = async (req, res) => {
  try {
    // Logic to edit the profile based on req.body and req.user

    console.log("Request Body:", req.body);

    var updatedProfile = req.body;
    updatedProfile._id = req.result._id;

    const user = await User.findById(updatedProfile._id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const updateUser = await User.findByIdAndUpdate(
      updatedProfile._id,
      updatedProfile,
      { new: true }
    );

    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      profile: updateUser, // Assume updatedProfile is obtained after update
    });
    
  } catch (err) {
    return res
      .status(500)
      .json({ message: err.message || "Internal Server Error" });
  }
};

module.exports = { getProfile, EditProfile };
