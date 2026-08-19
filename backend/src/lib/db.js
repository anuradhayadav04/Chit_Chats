import mongoose from "mongoose";

export const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB connected: ${conn.connection.host}`);
  } catch (error) {
    console.log("Primary MongoDB connection error:", error.message);
    try {
      console.log("Attempting fallback connection to local MongoDB (mongodb://127.0.0.1:27017/chitchat)...");
      const localConn = await mongoose.connect("mongodb://127.0.0.1:27017/chitchat");
      console.log(`MongoDB connected locally: ${localConn.connection.host}`);
    } catch (localErr) {
      console.error("❌ Could not connect to MongoDB Atlas or local MongoDB instance.");
      console.error("Please update MONGO_URI in backend/.env with valid database credentials or start local MongoDB service.");
    }
  }
};

