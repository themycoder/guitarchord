// app.ts (hoặc server.ts)
import "dotenv/config";
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
import informationRoutes from "./routes/information.routes";
import quizzRoutes from "./routes/quizz.routes";
import quizRoutes from "./routes/quiz.routes";
import theoryRoutes from "./routes/theory.route";
import profileRoutes from "./routes/profile.route";
import recoRoutes from "./routes/reco.routes";
import learnRoutes from "./routes/learn.routes";
import lessonRoutes from "./routes/lesson.routes";
// 🧠 AI recommender init
import { initReco } from "./recommender/reco";
import mlRoutes from "./routes/ml.routes";

mongoose.set("strictQuery", true);

const app = express();

// ===== Middleware =====
app.use(cors());
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(passport.initialize());
initialOAuthService();

// ===== Health check nhanh =====
app.get("/healthz", (_req, res) => {
  res.json({ ok: true });
});

// ===== Mount routes tĩnh (không cần DB) =====
app.use("/api/chords", chordRoutes);
app.use("/api/scales", scaleRoutes);
app.use("/api/strings", stringRoutes);
app.use("/api/notes", noteRoutes);
app.use("/api/chord-shapes", chordShapeRoutes);

app.use("/api/progressions", progressionRoutes);
app.use("/api/variants", variantRoutes);
app.use("/api/matrix", matrixRoutes);
app.use("/api/information", informationRoutes);
app.use("/api/theory", theoryRoutes);
app.use("/api/quizz", quizzRoutes);
app.use("/api/quiz", quizRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/lesson", lessonRoutes); // tạm mount lessons ở đây
app.use("/", authRoutes);

// ===== Bootstrap async: connect Mongo + init AI, rồi mount các route phụ thuộc AI =====
async function bootstrap() {
  const PORT = Number(process.env.PORT) || 3000;
  const mongoUri =
    process.env.MONGO_URI ||
    databaseConfig.mongoURI ||
    "mongodb://127.0.0.1:27017/mydb";

  try {
    await mongoose.connect(mongoUri);
    console.log("✅ MongoDB connected");

    // Quan trọng: khởi tạo recommender sau khi Mongo sẵn sàng
    await initReco();
    console.log("✅ Recommender initialized");

    // Các route phụ thuộc AI/DB (đặt sau initReco để chắc meta đã load)
    app.use("/api/reco", recoRoutes);
    app.use("/api", learnRoutes);
    app.use("/api/ml", mlRoutes);


    // 404 & error handler
    app.use((_req, res) => {
      res.status(404).json({ success: false, message: "Route not found" });
    });

    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
     
    });
  } catch (err) {
    console.error("❌ Bootstrap error:", err);
    process.exit(1);
  }
}

// giữ server sống nếu có lỗi không bắt
process.on("unhandledRejection", (reason) => {
  console.error("UNHANDLED REJECTION:", reason);
});
process.on("uncaughtException", (err) => {
  console.error("UNCAUGHT EXCEPTION:", err);
});

bootstrap();

export default app;