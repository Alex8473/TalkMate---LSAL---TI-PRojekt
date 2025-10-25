import fs from "fs";
import path from "path";

const usersFile = path.join("data","users.json");

// Hilfsfunktionen
const loadUsers = () => {
  if (!fs.existsSync(usersFile)) return [];
  return JSON.parse(fs.readFileSync(usersFile, "utf-8"));
};

const saveUsers = (users) => {
  fs.writeFileSync(usersFile, JSON.stringify(users, null, 2));
};

// Registrierung
export const registerUser = (req, res) => {
  const { username, password, hobbies } = req.body;
  if (!username || !password) {
    return res.status(400).json({ success: false, message: "Benutzername und Passwort erforderlich" });
  }

  const users = loadUsers();
  if (users.some(u => u.username === username)) {
    return res.status(400).json({ success: false, message: "Benutzername existiert bereits" });
  }

  const newUser = { username, password, hobbies: hobbies || [] };
  users.push(newUser);
  saveUsers(users);

  res.json({ success: true, message: "Registrierung erfolgreich" });
};

// Login
export const loginUser = (req, res) => {
  const { username, password } = req.body;
  const users = loadUsers();
  const user = users.find(u => u.username === username && u.password === password);

  if (user) {
    res.json({ success: true, username: user.username, hobbies: user.hobbies });
  } else {
    res.status(401).json({ success: false, message: "Falscher Benutzername oder Passwort" });
  }
};
