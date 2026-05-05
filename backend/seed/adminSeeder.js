const mongoose = require("mongoose");
const User = require("../models/User.model");
require("dotenv").config();

const seedAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    const adminExists = await User.findOne({ role: "admin" });

    if (adminExists) {
      console.log("Admin already exists");
      process.exit();
    }

    await User.create({
      name: "Admin",
      email: "admin@demo.com",
      password: "demo123", // will be hashed by your pre-save hook
      role: "admin",
    });

    console.log("Admin created successfully");
    process.exit();
  } catch (error) {
    console.log("Error seeding admin:", error);
    process.exit(1);
  }
};

seedAdmin();