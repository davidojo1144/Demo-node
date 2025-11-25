const express = require("express");
const app = express();
const port = 3000;

app.use(express.json());

// 📦 DATA STORAGE FORMAT (In-memory)
const users = {};

// 🧪 MOCK TELEGRAM LUNA BOT INTEGRATION
// Simulates revoking access from the Telegram community
const TelegramLunaBot = {
  revokeAccess: (userId) => {
    console.log(`[TelegramLunaBot] Access revoked for user: ${userId}`);
    // In a real scenario, this would make an API call to Telegram
    return true;
  },
};

// Helper to calculate date differences in days
const getDaysDifference = (date1, date2) => {
  const oneDay = 24 * 60 * 60 * 1000; // hours*minutes*seconds*milliseconds
  return Math.round(Math.abs((date1 - date2) / oneDay));
};

// 1. Join community
app.post("/community/join/:userId", (req, res) => {
  const userId = req.params.userId;
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // +30 days

  // Initialize user if not exists or reset if re-joining (simplification)
  users[userId] = {
    id: userId,
    fastingType: "default",
    healthScore: 0,
    community: {
      joinedAt: now.toISOString(),
      expiresAt: expiresAt.toISOString(),
    },
    fastingSession: {},
  };

  console.log(`User ${userId} joined. Expires at: ${expiresAt.toISOString()}`);

  res.json({ link: "https://community.example.com/main" });
});

// 2. Get community access state & 4. Auto-expiry simulation
app.get("/community/status/:userId", (req, res) => {
  const userId = req.params.userId;
  const user = users[userId];

  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  const now = new Date();
  const expiresAt = new Date(user.community.expiresAt);

  // 4. Auto-expiry simulation
  if (now > expiresAt) {
    // Logic to handle expiry
    TelegramLunaBot.revokeAccess(userId);

    return res.json({
      isActive: false,
      daysLeft: 0,
      expiresAt: user.community.expiresAt,
      renewalRequired: true,
      link: "https://community.example.com/expired", // returnLockedLink
    });
  }

  const daysLeft = Math.ceil((expiresAt - now) / (1000 * 60 * 60 * 24));

  res.json({
    isActive: true,
    daysLeft: daysLeft,
    expiresAt: user.community.expiresAt,
    renewalRequired: false,
  });
});

// 3. Simulate renewal
app.post("/community/renew/:userId", (req, res) => {
  const userId = req.params.userId;
  const user = users[userId];

  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  const currentExpiresAt = new Date(user.community.expiresAt);
  // Extend access by 14 days
  const newExpiresAt = new Date(
    currentExpiresAt.getTime() + 14 * 24 * 60 * 60 * 1000
  );

  user.community.expiresAt = newExpiresAt.toISOString();

  console.log(
    `User ${userId} renewed. New expiry: ${newExpiresAt.toISOString()}`
  );

  res.json({ newLink: "https://community.example.com/main?token=random123" });
});

// Debug endpoint to check all users (optional, for testing)
app.get("/debug/users", (req, res) => {
  res.json(users);
});

// Debug endpoint to time travel (simulate time passing)
// This is strictly for testing purposes as requested "Use mock data and timeframes"
// In a real app we wouldn't change system time, but we might mock Date.now()
// Here, we'll just allow manually setting a user's expiry to the past to test expiry logic
app.post("/debug/expire/:userId", (req, res) => {
  const userId = req.params.userId;
  if (users[userId]) {
    users[userId].community.expiresAt = new Date(
      Date.now() - 10000
    ).toISOString(); // Expired 10 seconds ago
    res.json({ message: `User ${userId} manually expired for testing` });
  } else {
    res.status(404).json({ error: "User not found" });
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
