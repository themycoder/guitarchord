// app.ts (hoặc server.ts tuỳ anh đặt)
import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import passport from "passport";

import chordRoutes from "./routes/chord.routes";
import scaleRoutes from "./routes/scale.routes";
import noteRoutes from "./routes/note.routes";
import stringRoutes from "./routes/strings.routes";
import chordShapeRoutes from "./routes/chordShape.routes";
import authRoutes from "./routes/auth.routes";
import { initialOAuthService } from "./services/auth.service";
import { databaseConfig } from "./config/data.config";

import progressionRoutes from "./routes/progression.routes";
import variantRoutes from "./routes/variant.routes";
import matrixRoutes from "./routes/matrix.routes";
import theoryRoutes from "./routes/theory.routes";
const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(passport.initialize());
initialOAuthService();

mongoose
  .connect(databaseConfig.mongoURI)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("MongoDB connection error:", err));

app.use("/api/chords", chordRoutes);
app.use("/api/scales", scaleRoutes);
app.use("/api/strings", stringRoutes);
app.use("/api/notes", noteRoutes);
app.use("/api/chord-shapes", chordShapeRoutes);


// import progressRoutes from "./routes/ChordProgression.routes";
// app.use("/api/progressions", progressRoutes)

app.use("/api/progressions", progressionRoutes);
app.use("/api/variants", variantRoutes);
app.use("/api/matrix", matrixRoutes);
app.use("/api/theory", theoryRoutes);

app.use("/", authRoutes);

// (khuyến nghị) 404 & error handler
app.use((_req, res) => {
  res.status(404).json({ success: false, message: "Route not found" });
});

app.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
});
