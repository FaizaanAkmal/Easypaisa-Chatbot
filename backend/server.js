import express from "express"
import cors from "cors"

const app = express()

const corsOptions = {
    origin: ["http://localhost:5173"],
}

app.use(cors(corsOptions))
app.use(express.json());

// In-memory user storage (replace with DB later)
let users = [
  { role: "admin", email: "admin@site.com", password: "admin123" },
  { role: "user", email: "user@site.com", password: "user123" },
];

// Add new user (Admin only)
app.post("/api/users", (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Email and password required" });
  }

  // Check if user already exists
  const exists = users.find((u) => u.email === email);
  if (exists) {
    return res.status(400).json({ message: "User already exists" });
  }

  users.push({ role: "user", email, password });
  res.status(201).json({ message: "User added successfully", users });
});

// Login route
app.post("/api/login", (req, res) => {
  const { role, email, password } = req.body;
  const user = users.find(
    (u) => u.role === role && u.email === email && u.password === password
  );

  if (user) {
    res.json({ success: true, role: user.role, email: user.email });
  } else {
    res.status(401).json({ success: false, message: "Invalid credentials" });
  }
});

app.listen(8000, () => {
    console.log("Server started on port 8000")
})