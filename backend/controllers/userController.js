import User from "../models/user.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt"

// Generate JWT token
const generateToken = (user) => {
  return jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "1d" }
  );
};

// @desc Register user
export const registerUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    const userExists = await User.findOne({ email });
    if (userExists) return res.status(400).json({ message: "User already exists" });
    
    //Hashing and Bycrypting the password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const user = new User({ email, password:hashedPassword });
    
    await user.save()

    res.status(201).json({
      _id: user._id,
      email: user.email,
      role: user.role,
      token: generateToken(user),
    });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// @desc Login user
/*export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    res.json({
      _id: user._id,
      email: user.email,
      role: user.role,
      token: generateToken(user),
    });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};*/

export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res
        .status(200)
        .json({ success: false, message: "Invalid email or password." });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res
        .status(200)
        .json({ success: false, message: "Invalid email or password." });
    }

    //const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      //expiresIn: "1h",
    //});

    res.status(200).json({
      success: true,
      email: user.email,
      role: user.role,
      userId: user._id,
      token: generateToken(user),
      //user: { userId: user._id, token: token },
    });
  } catch (error) {
    console.error("Error logging in user:", error);
    res.status(500).json({ success: false, message: "Internal server error." });
  }
}