import express from "express";
import cors from "cors";
import userRouter from "./routes/user.js";
const app = express();
app.use(cors());
app.use("/api/user", userRouter);

app.listen(3000, () => {
  console.log("you are running on port 3000");
});
