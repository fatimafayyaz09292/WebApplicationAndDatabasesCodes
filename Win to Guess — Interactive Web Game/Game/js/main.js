// Function to show user messages instead of alerts
function showMessage(text, type = "info") {
  const box = document.getElementById("messageBox");
  box.textContent = text;
  box.style.borderColor = type === "error" ? "#ff0066" : "#00ff99";
  box.style.color = type === "error" ? "#ff0066" : "#00ff99";
  box.classList.remove("hidden");
  // Auto-hide after 3s
  setTimeout(() => {
    box.classList.add("hidden");
  }, 3000);
}

// Check login status
document.addEventListener("DOMContentLoaded", () => {
  const loginBtn = document.getElementById("loginBtn");
  const registerBtn = document.getElementById("registerBtn");
  const startBtn = document.getElementById("startGameBtn");
  const guestBtn = document.getElementById("guestBtn");

const localUser = JSON.parse(localStorage.getItem("currentUser"));  // Registered user
const sessionUser = JSON.parse(sessionStorage.getItem("currentUser")); // Guest user

if (localUser) {
  // Registered user
  showMessage(`Welcome back, ${localUser.name}!`, "info");

  loginBtn?.classList.add("hidden");
  registerBtn?.classList.add("hidden");
  guestBtn?.classList.add("hidden");

  // ONLY registered users see this
  startBtn?.classList.remove("hidden");

} else if (sessionUser) {
  // Guest user
  showMessage(`Welcome, ${sessionUser.name}!`, "info");

  // Guest should still see Play as Guest button
  loginBtn?.classList.remove("hidden");
  registerBtn?.classList.remove("hidden");
  guestBtn?.classList.remove("hidden");

  // Guest should NOT see Start Mission
  startBtn?.classList.add("hidden");

} else {
  // No user
  loginBtn?.classList.remove("hidden");
  registerBtn?.classList.remove("hidden");
  guestBtn?.classList.remove("hidden");

  startBtn?.classList.add("hidden");
}

  if (startBtn) {
    startBtn.addEventListener("click", () => {
      window.location.href = "game/number.html";
    });
  }

  if (guestBtn) {
    guestBtn.addEventListener("click", () => {
      const guestUser = { name: "Guest", email: "guest@example.com", score: 0 };
      sessionStorage.setItem("currentUser", JSON.stringify(guestUser));
      window.location.href = "game/number.html";
    });
  }
});

// LOGIN FUNCTIONALITY
document.addEventListener("DOMContentLoaded", () => {
  const loginForm = document.getElementById("loginForm");
  const loginMessage = document.getElementById("loginMessage");
  const guestBtn = document.getElementById("guestBtn");
  const rememberMe = document.getElementById("rememberMe");

  if (loginForm) { // Only run if login page exists
    // Login form submit
    loginForm.addEventListener("submit", function(e) {
      e.preventDefault();
      const email = document.getElementById("email").value.trim();
      const password = document.getElementById("password").value.trim();

      if (!email || !password) {
        showLoginMessage("Please fill in all fields", "9b2226");
        return;
      }

      // Get users from localStorage
      let users = JSON.parse(localStorage.getItem("users")) || [];
      const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());

      if (!user) {
        showLoginMessage("User not found. Please register first.", "9b2226");
        return;
      }

      if (user.password !== password) {
        showLoginMessage("Incorrect password. Try again.", "9b2226");
        return;
      }

      // Successful login
      showLoginMessage("Login successful! Redirecting...", "ee9b00");

      // Store current user based on "Remember Me"
      if (rememberMe.checked) {
        localStorage.setItem("currentUser", JSON.stringify(user)); // stays logged in
      } else {
        sessionStorage.setItem("currentUser", JSON.stringify(user)); // session only
      }

      // Redirect after 1s
      setTimeout(() => {
        window.location.href = "../index.html"; // or game page
      }, 1000);
    });

    // Play as Guest
    guestBtn.addEventListener("click", () => {
      const guestUser = { name: "Guest", email: "guest@example.com", score: 0 };
      sessionStorage.setItem("currentUser", JSON.stringify(guestUser)); // session only
      window.location.href = "../index.html"; // or game page
    });

    function showLoginMessage(msg, colorCode) {
      loginMessage.textContent = msg;
      loginMessage.style.borderColor = "#" + colorCode;
      loginMessage.style.color = "#" + colorCode;
      loginMessage.classList.remove("hidden");
    }
  }
});

// REGISTRATION FUNCTIONALITY
document.addEventListener("DOMContentLoaded", () => {
  const registerForm = document.getElementById("registerForm");
  const registerMessage = document.getElementById("registerMessage");

  // ===== SHOW/HIDE PASSWORD FUNCTIONALITY =====
  const passwordInput = document.getElementById("password");
  const confirmPasswordInput = document.getElementById("confirmPassword");

  // Create toggle checkbox
  const passwordToggle = document.createElement("input");
  passwordToggle.type = "checkbox";
  passwordToggle.id = "showPassword";
  const passwordLabel = document.createElement("label");
  passwordLabel.textContent = " Show Password";
  passwordLabel.htmlFor = "showPassword";

  // Wrap toggle in div for proper styling
  const toggleWrapper = document.createElement("div");
  toggleWrapper.classList.add("password-toggle");
  toggleWrapper.appendChild(passwordToggle);
  toggleWrapper.appendChild(passwordLabel);

  // Append after confirm password input
  confirmPasswordInput.parentNode.appendChild(toggleWrapper);

  // Toggle password visibility
  passwordToggle.addEventListener("change", function () {
    const type = this.checked ? "text" : "password";
    passwordInput.type = type;
    confirmPasswordInput.type = type;
  });

  if (registerForm) { // Only runs if we are on the register page
    registerForm.addEventListener("submit", function (e) {
      e.preventDefault();
      const name = document.getElementById("name").value.trim();
      const nickname = document.getElementById("nickname").value.trim();
      const city = document.getElementById("city").value.trim();
      const country = document.getElementById("country").value.trim();
      const phone = document.getElementById("phone").value.trim();
      const role = document.getElementById("role").value.trim();
      const email = document.getElementById("email").value.trim();
      const password = document.getElementById("password").value.trim();
      const confirmPassword = document.getElementById("confirmPassword").value.trim();

      if (!name || !nickname || !city || !country || !phone || !role || !email || !password || !confirmPassword) {
        showRegisterMessage("Please fill in all fields.", "9b2226");
        return;
      }

      // Email format validation
      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailPattern.test(email)) {
        showRegisterMessage("Enter a valid email address.", "9b2226");
        return;
      }
      
      // Password strength check
      const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&])[A-Za-z\d!@#$%^&]{8,}$/;
      if (!passwordPattern.test(password)) {
          showRegisterMessage("Password must be at least 8 characters, include uppercase, lowercase, number, and special character.", "9b2226");
          return;
      }
 
      // Role validation
      const validRoles = ["Beginner", "Intermediate", "Expert"];
        if (!validRoles.includes(role)) {
            showRegisterMessage("Select a valid role.", "9b2226");
            return;
        }

        // Name & nickname validation: letters, spaces only, min 2 characters
        const namePattern = /^[A-Za-z\s]{2,}$/;
        if (!namePattern.test(name)) {
            showRegisterMessage("Name can only contain letters and spaces (min 2 chars).", "9b2226");
            return;
        }
        if (!namePattern.test(nickname)) {
            showRegisterMessage("Nickname can only contain letters and spaces (min 2 chars).", "9b2226");
            return;
        }

      if (password !== confirmPassword) {
        showRegisterMessage("Passwords do not match.", "9b2226");
        return;
      }

      // Get existing users
      let users = JSON.parse(localStorage.getItem("users")) || [];

      // Check if email already exists
      const existingUser = users.find(u => u.email.toLowerCase() === email.toLowerCase());
      if (existingUser) {
        showRegisterMessage("Email already registered. Please login.", "9b2226");
        return;
      }
      
      //Phone Validation
      const phonePattern = /^\+?[0-9]{7,15}$/;
      if (!phonePattern.test(phone)) {
        showRegisterMessage("Enter a valid phone number.", "9b2226");
        return;
      }

      // Save new user
      const newUser = { name, nickname,city,country,phone,role, email, password, score:0 };
      users.push(newUser);
      localStorage.setItem("users", JSON.stringify(users));
      
      // Automatically log in the user
      localStorage.setItem("currentUser", JSON.stringify(newUser));

      showRegisterMessage("Registration successful! Redirecting to home...", "00b300");

      // Redirect after success
      setTimeout(() => {
        window.location.href = "../index.html";
      }, 1500);
    });

    function showRegisterMessage(msg, colorCode) {
      const box = document.getElementById("messageBox"); // use the single message box
      box.textContent = msg;
      box.style.borderColor = "#" + colorCode;
      box.style.color = "#" + colorCode;
      box.classList.remove("hidden");

      // Optional: auto-hide after 3s
      setTimeout(() => {
      box.classList.add("hidden");
      }, 3000);
    }
  }
});

// LEADERBOARD FUNCTIONALITY
// =========================
// DYNAMIC LEADERBOARD.JS
// =========================
document.addEventListener("DOMContentLoaded", () => {
  const leaderboardTableBody = document.querySelector("#leaderboardTable tbody");
  const personalScoreBox = document.getElementById("personalScoreBox");

  // Get current session user (guest or logged-in)
  const currentUser = JSON.parse(localStorage.getItem("currentUser")) 
                    || JSON.parse(sessionStorage.getItem("currentUser"));

  // Load registered users
  let users = JSON.parse(localStorage.getItem("users")) || [];

  // Merge current guest dynamically (only if guest)
  if (currentUser && currentUser.name === "Guest") {
    users.push(currentUser);
  }

  // Sort users by score descending
  users.sort((a, b) => (b.score || 0) - (a.score || 0));

  // Show personal score if user exists
  if (currentUser) {
    personalScoreBox.innerHTML = `
      <p><strong>Name:</strong> ${currentUser.name}</p>
      <p><strong>Email:</strong> ${currentUser.email}</p>
      <p><strong>Score:</strong> ${currentUser.score || 0}</p>
    `;
  } else {
    personalScoreBox.textContent = "No user selected. Play as guest or login to see your score.";
  }

  // Populate leaderboard table
  leaderboardTableBody.innerHTML = "";
  users.forEach((user, index) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${index + 1}</td>
      <td>${user.name}</td>
      <td>${user.email}</td>
      <td>${user.score || 0}</td>
    `;
    // Highlight current user
    if (currentUser && user.email === currentUser.email) {
      row.style.backgroundColor = "#ee9b00";
      row.style.color = "#001219";
      row.style.fontWeight = "bold";
    }
    leaderboardTableBody.appendChild(row);
  });

  // ===== Optional: CLEAR LEADERBOARD (guest only) =====
  const clearLeaderboardBtn = document.getElementById("clearLeaderboardBtn");
  if (clearLeaderboardBtn) {
    clearLeaderboardBtn.addEventListener("click", () => {
      // Remove guest only
      if (currentUser && currentUser.name === "Guest") {
        sessionStorage.removeItem("currentUser");
      }

      // Clear table visually
      leaderboardTableBody.innerHTML = "";
      personalScoreBox.textContent = "Leaderboard cleared. Play as guest or login to see scores.";
    });
  }
});

//SETTINGS LOGIC
document.addEventListener("DOMContentLoaded", () => {
  const currentUser =
    JSON.parse(localStorage.getItem("currentUser")) ||
    JSON.parse(sessionStorage.getItem("currentUser"));

  const profileSection = document.querySelector(".profile-section");
  const passwordSection = document.querySelector(".password-section");
  const usernameInput = document.getElementById("username");
  const emailInput = document.getElementById("email");
  const nicknameInput = document.getElementById("nickname");
  const cityInput = document.getElementById("city");
  const countryInput = document.getElementById("country");
  const phoneInput = document.getElementById("phone");
  const roleInput = document.getElementById("role");
  const updateUsernameBtn = document.getElementById("updateUsernameBtn");

  const oldPasswordInput = document.getElementById("oldPassword");
  const newPasswordInput = document.getElementById("newPassword");
  const confirmNewPasswordInput = document.getElementById("confirmNewPassword");
  const changePasswordBtn = document.getElementById("changePasswordBtn");

  const difficultySelect = document.getElementById("difficulty");
  const livesSelect = document.getElementById("lives");
  livesSelect.disabled = true;
  const timerInput = document.getElementById("timer");
  timerInput.disabled = true;
  const saveSettingsBtn = document.getElementById("saveSettingsBtn");

  const logoutBtn = document.getElementById("logoutBtn");
  const messageBox = document.getElementById("messageBox");

  // HELPER FUNCTION
  function showMessage(text, type = "info") {
    messageBox.textContent = text;
    messageBox.style.borderColor = type === "error" ? "#ff0066" : "#00ff99";
    messageBox.style.color = type === "error" ? "#ff0066" : "#00ff99";
    messageBox.classList.remove("hidden");
    setTimeout(() => messageBox.classList.add("hidden"), 3000);
  }

  // LEVEL SETTINGS
  const levelSettings = {
    easy: { lives: 5, timer: 95 },
    medium: { lives: 3, timer: 60 },
    hard: { lives: 1, timer: 35 }
  };

  // DYNAMIC DISPLAY 
  if (!currentUser) {
    // No user stored
    profileSection.style.display = "none";
    passwordSection.style.display = "none";
    difficultySelect.value = "easy";
    livesSelect.value = levelSettings["easy"].lives;
    timerInput.value = levelSettings["easy"].timer;
    showMessage("You are not logged in. Default game settings will apply.", "info");
  } else if (currentUser.name === "Guest") {
    // Guest user
    profileSection.style.display = "none";
    passwordSection.style.display = "none";

    const guestSettings = JSON.parse(sessionStorage.getItem("gameSettings")) || {};
    difficultySelect.value = guestSettings.difficulty || "easy";
    livesSelect.value = levelSettings[difficultySelect.value].lives;
    timerInput.value = guestSettings.timer || levelSettings[difficultySelect.value].timer;
  } else {
    // Logged-in / Registered user
    profileSection.style.display = "block";
    usernameInput.value = currentUser.name;
    emailInput.value = currentUser.email || "";
    nicknameInput.value = currentUser.nickname || "";
    cityInput.value = currentUser.city || "";
    countryInput.value = currentUser.country || "";
    phoneInput.value = currentUser.phone || "";
    roleInput.value = currentUser.role || "";

    // Only email is disabled; all other fields editable
    emailInput.disabled = true;
    nicknameInput.disabled = false;
    cityInput.disabled = false;
    countryInput.disabled = false;
    phoneInput.disabled = false;
    roleInput.disabled = false;

    // Load saved game settings
    const savedSettings = JSON.parse(localStorage.getItem("gameSettings_" + currentUser.email)) || {};
    const level = savedSettings.difficulty || "easy";
    difficultySelect.value = level;
    livesSelect.value = levelSettings[level].lives;
    timerInput.value = savedSettings.timer || levelSettings[level].timer;
  }

  // UPDATE USERNAME
  if (updateUsernameBtn) {
    updateUsernameBtn.addEventListener("click", () => {
      if (!currentUser || currentUser.name === "Guest") return;

      const newName = usernameInput.value.trim();
      if (!newName || newName.length < 2) {
        showMessage("Username must be at least 2 characters.", "error");
        return;
      }
        
      // Update all editable profile fields
      currentUser.name = newName;
      currentUser.nickname = nicknameInput.value.trim();
      currentUser.city = cityInput.value.trim();
      currentUser.country = countryInput.value.trim();
      currentUser.phone = phoneInput.value.trim();
      currentUser.role = roleInput.value;

      // Update storage
      if (localStorage.getItem("currentUser")) {
        localStorage.setItem("currentUser", JSON.stringify(currentUser));
      } else {
        sessionStorage.setItem("currentUser", JSON.stringify(currentUser));
      }

      // Update in users array if registered
      const users = JSON.parse(localStorage.getItem("users")) || [];
      const userIndex = users.findIndex(u => u.email === currentUser.email);
      if (userIndex !== -1) {
        users[userIndex] = currentUser;
        localStorage.setItem("users", JSON.stringify(users));
      }

      showMessage("Username updated successfully!");
    });
  }

  // CHANGE PASSWORD 
  if (changePasswordBtn) {
    changePasswordBtn.addEventListener("click", () => {
      if (!currentUser || currentUser.name === "Guest") return;

      const oldPass = oldPasswordInput.value.trim();
      const newPass = newPasswordInput.value.trim();
      const confirmPass = confirmNewPasswordInput.value.trim();

      if (!oldPass || !newPass || !confirmPass) {
        showMessage("Please fill all password fields.", "error");
        return;
      }

      if (currentUser.password !== oldPass) {
        showMessage("Old password incorrect.", "error");
        return;
      }

      if (newPass !== confirmPass) {
        showMessage("New passwords do not match.", "error");
        return;
      }

      if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&])[A-Za-z\d!@#$%^&]{8,}$/.test(newPass)) {
        showMessage("Password must include uppercase, lowercase, number, and special character.", "error");
        return;
      }

      currentUser.password = newPass;

      // Update storage
      if (localStorage.getItem("currentUser")) {
        localStorage.setItem("currentUser", JSON.stringify(currentUser));
      } else {
        sessionStorage.setItem("currentUser", JSON.stringify(currentUser));
      }

      // Update in users array if registered
      const users = JSON.parse(localStorage.getItem("users")) || [];
      const userIndex = users.findIndex(u => u.email === currentUser.email);
      if (userIndex !== -1) {
        users[userIndex].password = newPass;
        localStorage.setItem("users", JSON.stringify(users));
      }

      showMessage("Password changed successfully!");
      oldPasswordInput.value = newPasswordInput.value = confirmNewPasswordInput.value = "";
    });
  }

  // SAVE GAME SETTINGS 
  saveSettingsBtn.addEventListener("click", () => {
    const selectedLevel = difficultySelect.value;

    // Auto-adjust lives & timer
    livesSelect.value = levelSettings[selectedLevel].lives;
    timerInput.value = levelSettings[selectedLevel].timer;

    const settings = {
      difficulty: selectedLevel,
      lives: livesSelect.value,
      timer: timerInput.value
    };

    if (currentUser && currentUser.name === "Guest") {
      sessionStorage.setItem("gameSettings", JSON.stringify(settings));
    } else if (currentUser) {
      localStorage.setItem("gameSettings_" + currentUser.email, JSON.stringify(settings));
    } else {
      sessionStorage.setItem("gameSettings", JSON.stringify(settings));
    }

    showMessage("Game settings saved!");
  });

  // LOGOUT
  logoutBtn.addEventListener("click", () => {
    localStorage.removeItem("currentUser");
    sessionStorage.removeItem("currentUser");
    showMessage("Logged out successfully!", "info");
    setTimeout(() => window.location.href = "../index.html", 1000);
  });

  // ADJUST LIVES ON DIFFICULTY CHANGE 
 difficultySelect.addEventListener("change", () => {
    const level = difficultySelect.value;
    livesSelect.value = levelSettings[level].lives;
    timerInput.value = levelSettings[level].timer; // always update timer dynamically
});
});

// NUMBER GUESSING GAME LOGIC
document.addEventListener("DOMContentLoaded", () => {
  // Only run if we are on number.html
  if (!document.getElementById("guess-btn")) return;

  const difficultySelect = document.getElementById("difficulty");
  const numberRangeDisplay = document.getElementById("number-range");
  const livesDisplay = document.getElementById("lives");
  const guessInput = document.getElementById("guess-input");
  const guessBtn = document.getElementById("guess-btn");

  // Load current difficulty and lives
  const currentUser =
    JSON.parse(localStorage.getItem("currentUser")) ||
    JSON.parse(sessionStorage.getItem("currentUser"));

  const savedSettings =
    (currentUser && currentUser.name !== "Guest"
      ? JSON.parse(localStorage.getItem("gameSettings_" + currentUser.email))
      : JSON.parse(sessionStorage.getItem("gameSettings"))) || {};

  const difficulty = savedSettings.difficulty || "easy";

  // Number range & lives per difficulty
  const difficultySettings = {
    easy: { min: 1, max: 50, lives: 5 },
    medium: { min: 1, max: 100, lives: 3 },
    hard: { min: 1, max: 200, lives: 1 }
  };

  let min = difficultySettings[difficulty].min;
  let max = difficultySettings[difficulty].max;
  let lives = difficultySettings[difficulty].lives;

  // Display initial values
  difficultySelect.textContent = difficulty.charAt(0).toUpperCase() + difficulty.slice(1);
  numberRangeDisplay.textContent = `${min} - ${max}`;
  livesDisplay.textContent = lives;

  // Generate secret number
  const secretNumber = Math.floor(Math.random() * (max - min + 1)) + min;

  // TIMER LOGIC
  let timeLeft = savedSettings.timer || difficultySettings[difficulty].timer;
  const timerDisplay = document.getElementById("timer-display");
  timerDisplay.textContent = timeLeft;

  const countdown = setInterval(() => {
    timeLeft--;
    timerDisplay.textContent = timeLeft;

    if (timeLeft <= 0) {
      clearInterval(countdown);
      showMessage("Time's up! Firewall locked!", "error");
      setTimeout(() => {
        window.location.href = "fail.html";
      }, 1500);
    }
  }, 1000);

  // Listen for guess button click
  guessBtn.addEventListener("click", () => {
    const guessValue = parseInt(guessInput.value.trim());

    // Validate input
    if (!guessValue || isNaN(guessValue)) {
      showMessage("Please enter a valid number.", "error");
      return;
    }

    if (guessValue < min || guessValue > max) {
      showMessage(`Enter a number within range ${min}-${max}.`, "error");
      return;
    }

    // Check guess
    if (guessValue === secretNumber) {
      clearInterval(countdown); // STOP THE TIMER
      // Update user score
      let currentUser = JSON.parse(localStorage.getItem("currentUser")) 
                          || JSON.parse(sessionStorage.getItem("currentUser"));

      if (currentUser) {
        currentUser.score = (currentUser.score || 0) + 20; // 20 points for number game

      if (currentUser.name !== "Guest") {
        localStorage.setItem("currentUser", JSON.stringify(currentUser));

          let users = JSON.parse(localStorage.getItem("users")) || [];
          const idx = users.findIndex(u => u.email === currentUser.email);
          if (idx !== -1) {
            users[idx].score = currentUser.score;
            localStorage.setItem("users", JSON.stringify(users));
          }
        } else {
          sessionStorage.setItem("currentUser", JSON.stringify(currentUser));
        }
      }

      showMessage("Correct! Firewall unlocked!", "info");
      setTimeout(() => {
        window.location.href = "word.html";
      }, 1500);
    } else {
      // Wrong guess
      lives--;
      livesDisplay.textContent = lives;

      if (guessValue > secretNumber) {
        showMessage("Too high! Try again.", "error");
      } else {
        showMessage("Too low! Try again.", "error");
      }

      // HINTS
      let hint = "";
      const diff = Math.abs(guessValue - secretNumber);

      
      // 🔥 Distance-based adaptive hints
      if (diff === 0) {
        hint = "🎯 Correct!"; // player guessed it
      } else if (diff <= 2) {
        hint += "🔥 Super hot! You're extremely close. ";
      } else if (diff <= 5) {
        hint += "🔥 Very hot! Almost there. ";

        // ✅ Add numeric range hint
        const lowerBound = Math.max(secretNumber - 2, min);
        const upperBound = Math.min(secretNumber + 2, max);
        hint += `🔹 The number is between ${lowerBound} and ${upperBound}. `;
      } else if (diff <= 10) {
        hint += "🌡️ Hot! Getting closer. ";
      } else if (diff <= 20) {
        hint += "🌡️ Warm! Keep trying. ";
      } else {
        hint += "❄️ Cold! Far from the number. ";
     }

      // Even / Odd
        hint += secretNumber % 2 === 0 ? "🔹 It's an even number. " : "🔹 It's an odd number. ";

      // Higher / Lower
        hint += guessValue < secretNumber ? "⬆️ Try a higher number." : "⬇️ Try a lower number.";

      showMessage(hint, "error");


      // Check for game over
      if (lives <= 0) {
        clearInterval(countdown); // STOP TIMER if game over
        showMessage("Firewall detected intrusion! System locked!", "error");
        setTimeout(() => {
          window.location.href = "fail.html";
        }, 2000);
      }
    }

    // Clear input after each guess
    guessInput.value = "";
    guessInput.focus();
  });
});

// WORD GAME (PHASE 2) 

function initWordGame() {
  const user = JSON.parse(localStorage.getItem("currentUser")) 
             || JSON.parse(sessionStorage.getItem("currentUser"));
  const settings = JSON.parse(localStorage.getItem("gameSettings")) 
               || JSON.parse(sessionStorage.getItem("gameSettings")) 
               || { difficulty: "easy", lives: 5, timer: 95 };

  let lives = settings.lives;
  let timer = settings.timer;
  let timerInterval;

  const categories = {
    cybersecurity: ["CODE","VIRUS","HACK","LOGIN","ENCRYPT","DECRYPT","FIREWALL","MALWARE","PHISHING"],
    tech: ["SERVER","ROUTER","SYSTEM","NETWORK","BROWSER","FIRMWARE","HARDWARE","SOFTWARE","CLOUD"],
    programming: ["JAVASCRIPT","PYTHON","JAVA","CPLUSPLUS","HTML","CSS","RUBY","PHP","TYPESCRIPT"],
    gadgets: ["SMARTPHONE","TABLET","LAPTOP","SMARTWATCH","DRONE","CAMERA","HEADPHONES","PRINTER","PROJECTOR"],
    internet: ["EMAIL","WEBSITE","DOMAIN","URL","BROWSER","SEO","BLOG","SOCIALMEDIA","WEBHOSTING"]
  };

  const puzzles = [
    { clue: "I keep your secrets, but can be broken.", answer: "PASSWORD" },
    { clue: "I see everything but have no eyes.", answer: "CCTV" },
    { clue: "Protects a computer from threats.", answer: "ANTIVIRUS" },
    { clue: "I connect devices together and forward packets.", answer: "ROUTER" },
    { clue: "I watch traffic and can block intrusions.", answer: "FIREWALL" },
    { clue: "I am a program that spreads from computer to computer.", answer: "MALWARE" },
    { clue: "I hide information so only authorized users can see.", answer: "ENCRYPTION" },
    { clue: "I store all your files and data securely.", answer: "SERVER" }
  ];

  let word = "";
  let clue = "";
  let category = "";
  
  const msgBox = document.getElementById("messageBox");
  const gameArea = document.getElementById("gameArea");
  const modeBox = document.getElementById("modeSelection");
  
  document.getElementById("livesDisplay").textContent = lives;
  document.getElementById("timerDisplay").textContent = timer;

  function showMessage(text, type = "info") {
    msgBox.textContent = text;
    msgBox.className = `message-box ${type}`;
  }

  function startTimer() {
    timerInterval = setInterval(() => {
      timer--;
      document.getElementById("timerDisplay").textContent = timer;
      if (timer <= 0) gameFail();
    }, 1000);
  }

  function setupWordMode() {
    const categoryKeys = Object.keys(categories);
    category = categoryKeys[Math.floor(Math.random() * categoryKeys.length)];

    const list = categories[category];
    word = list[Math.floor(Math.random() * list.length)];

    document.getElementById("categoryDisplay").textContent = category;
    document.getElementById("clueDisplay").textContent = "None (Word Guess Mode)";
    document.getElementById("wordLength").textContent = word.length;
  }

  function setupPuzzleMode() {
    const pick = puzzles[Math.floor(Math.random() * puzzles.length)];
    word = pick.answer;
    clue = pick.clue;

    document.getElementById("categoryDisplay").textContent = "Puzzle";
    document.getElementById("clueDisplay").textContent = clue;
    document.getElementById("wordLength").textContent = word.length;
  }

  function startGame(mode) {
    modeBox.classList.add("hidden");
    gameArea.classList.remove("hidden");

    if (mode === "word") setupWordMode();
    else setupPuzzleMode();

    startTimer();
  }

  function gameSuccess() {
    clearInterval(timerInterval);
    let currentUser = JSON.parse(localStorage.getItem("currentUser")) 
                    || JSON.parse(sessionStorage.getItem("currentUser"));

    const totalScore = JSON.parse(sessionStorage.getItem("tempScore")) || 0;
    const points = 50; // word game points
    const finalScore = totalScore + points;

    if (currentUser) {
      currentUser.score = (currentUser.score || 0) + finalScore;

      if (currentUser.name !== "Guest") {
        localStorage.setItem("currentUser", JSON.stringify(currentUser));
        let users = JSON.parse(localStorage.getItem("users")) || [];
        const idx = users.findIndex(u => u.email === currentUser.email);
        if (idx !== -1) {
          users[idx].score = currentUser.score;
          localStorage.setItem("users", JSON.stringify(users));
       }
     } else {
      sessionStorage.setItem("currentUser", JSON.stringify(currentUser));
     }
   }

    sessionStorage.setItem("finalScore", finalScore);
    window.location.href = "success.html";
  }

  function gameFail() {
    clearInterval(timerInterval);
    window.location.href = "fail.html";
  }

  document.getElementById("wordModeBtn").onclick = () => startGame("word");
  document.getElementById("puzzleModeBtn").onclick = () => startGame("puzzle");

  document.getElementById("submitGuessBtn").onclick = () => {
    const guess = document.getElementById("guessInput").value.trim().toUpperCase();

    if (!guess) return showMessage("Enter a guess!", "error");

    if (guess === word) return gameSuccess();

    lives--;
    document.getElementById("livesDisplay").textContent = lives;

    if (lives <= 0) return gameFail();

    showMessage("Wrong guess! Try again.", "error");
  };
}

document.addEventListener('DOMContentLoaded', () => {

  // FAIL PAGE LOGIC
  if (document.body.classList.contains('fail-page')) {
    const retryBtn = document.getElementById('retryBtn');
    const homeBtn = document.getElementById('homeBtn');

    if (retryBtn) {
      retryBtn.addEventListener('click', () => {
        const lastGamePage = localStorage.getItem('lastGamePage') || 'number.html';
        window.location.href = `../game/${lastGamePage}`;
      });
    }

    if (homeBtn) {
      homeBtn.addEventListener('click', () => {
        window.location.href = '../index.html';
      });
    }
  }

  // SUCCESS PAGE LOGIC
  if (document.body.classList.contains('success-page')) {
    const playAgainBtn = document.getElementById('playAgainBtn');
    const homeBtn = document.getElementById('homeBtn');
    const leaderboardBtn = document.getElementById('leaderboardBtn');

    if (playAgainBtn) {
      playAgainBtn.addEventListener('click', () => {
        const lastGamePage = localStorage.getItem('lastGamePage') || 'number.html';
        window.location.href = `../game/${lastGamePage}`;
      });
    }

    if (homeBtn) {
      homeBtn.addEventListener('click', () => {
        window.location.href = '../index.html';
      });
    }

    if (leaderboardBtn) {
      leaderboardBtn.addEventListener('click', () => {
        window.location.href = '../leaderboard/leaderboard.html';
      });
    }
  }

});
