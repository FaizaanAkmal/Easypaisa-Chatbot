import express from "express"
import cors from "cors"
import dotenv from "dotenv"
import mongoose from "mongoose"
import userRoute from "./routes/userRoute.js";

dotenv.config();
const app = express()

const corsOptions = {
    origin: [process.env.FRONTEND_URL],
    credentials: true,
    //methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE'],
}

app.use(cors(corsOptions))
app.use(express.json());

app.use("/api/user", userRoute);

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    app.listen(process.env.PORT, () => {
      console.log(`Listening on port ${process.env.PORT}`);
      console.log("Connected to database");
    });
  })
  .catch((error) => {
    console.error(error);
  });

//app.listen(process.env.PORT, () => {
  //  console.log("Server started on port", process.env.PORT)
//})