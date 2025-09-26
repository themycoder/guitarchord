import dotenv from "dotenv";

dotenv.config();

export const databaseConfig = {
  mongoURI: process.env.MONGO_URI || "mongodb://localhost:27017/chorddb",
};
