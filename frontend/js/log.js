document.addEventListener("DOMContentLoaded", () => {
  const loginForm = document.getElementById("login-form");
  const registerForm = document.getElementById("register-form");
  const showRegisterBtn = document.getElementById("show-register-btn");
  const backToLoginBtn = document.getElementById("back-to-login-btn");
  const formTitle = document.getElementById("form-title");

  // Hole Nutzer aus localStorage oder erstelle leeres Array
  let users = JSON.parse(localStorage.getItem("users")) || [];

  // 🔐 LOGIN
  loginForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const inputs = loginForm.querySelectorAll(".searchInput");
    const username = inputs[0].value.trim();
    const password = inputs[1].value.trim();

    const user = users.find(u => u.username === username && u.password === password);
    if (user) {
      alert(`Willkommen ${user.username}!\nDeine Hobbys: ${user.hobbies.join(", ")}`);
      loginForm.reset();
    } else {
      alert("❌ Falscher Benutzername oder Passwort!");
    }
  });

  // 🔁 ZU REGISTRIERUNG
  showRegisterBtn.addEventListener("click", () => {
    loginForm.style.display = "none";
    showRegisterBtn.style.display = "none";
    registerForm.style.display = "block";
    formTitle.textContent = "Register";
  });

  // 🔁 ZURÜCK ZU LOGIN
  backToLoginBtn.addEventListener("click", () => {
    registerForm.style.display = "none";
    loginForm.style.display = "block";
    showRegisterBtn.style.display = "inline-block";
    formTitle.textContent = "Login";
  });

  // 📝 REGISTRIERUNG
  registerForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const username = document.getElementById("new-username").value.trim();
    const password = document.getElementById("new-password").value.trim();
    const hobbies = Array.from(registerForm.querySelectorAll('input[name="hobby"]:checked')).map(cb => cb.value);

    if (!username || !password) {
      alert("Bitte Benutzername und Passwort eingeben.");
      return;
    }

    if (users.some(u => u.username === username)) {
      alert("⚠️ Benutzername existiert bereits!");
      return;
    }

    const newUser = { username, password, hobbies };
    users.push(newUser);
    localStorage.setItem("users", JSON.stringify(users));

    alert("✅ Registrierung erfolgreich! Du kannst dich jetzt einloggen.");
    registerForm.reset();
    registerForm.style.display = "none";
    loginForm.style.display = "block";
    showRegisterBtn.style.display = "inline-block";
    formTitle.textContent = "Login";
  });
});
