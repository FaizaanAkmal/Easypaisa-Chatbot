import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: true,
      //minlength: 6,
    },
    role: {
      type: String,
      enum: ["admin", "user"],
      default: "user",
      required:true,
    },
  },
  { timestamps: true }
);

export default mongoose.model("User", userSchema);
