const categoryOptions = [
  "food",
  "transportation",
  "entertainment",
  "shopping",
  "bills",
  "health",
  "education",
  "travel",
  "other",
];

// Populate category dropdown
const categorySelect = document.getElementById("category");
categoryOptions.forEach((cat) => {
  const opt = document.createElement("option");
  opt.value = cat;
  opt.textContent = cat.charAt(0).toUpperCase() + cat.slice(1);
  categorySelect.appendChild(opt);
});

function getUserIdFromPath() {
  const match = window.location.pathname.match(/\/test\/(.+)$/);
  return match ? match[1] : null;
}

const userIdFromPath = getUserIdFromPath();
const isAdmin = userIdFromPath === "admin";

const userDropdown = document.getElementById("user");
const userDropdownLabel = document.querySelector('label[for="user"]');
const dateInput = document.getElementById("date");
const dateInputLabel = document.querySelector('label[for="date"]');

if (!isAdmin) {
  // Hide user dropdown and date input for non-admins
  userDropdown.style.display = "none";
  if (userDropdownLabel) userDropdownLabel.style.display = "none";
  dateInput.style.display = "none";
  if (dateInputLabel) dateInputLabel.style.display = "none";
} else {
  // Populate user dropdown from API for admin
  fetch("/users")
    .then((res) => res.json())
    .then((users) => {
      users.forEach((u) => {
        const opt = document.createElement("option");
        opt.value = u.id;
        opt.textContent = u.name;
        userDropdown.appendChild(opt);
      });
    });
}

// Handle form submit
document
  .getElementById("transactionForm")
  .addEventListener("submit", async function (e) {
    e.preventDefault();
    const messageDiv = document.getElementById("message");
    messageDiv.textContent = "";
    let userId;
    if (isAdmin) {
      userId = document.getElementById("user").value;
    } else {
      userId = userIdFromPath;
    }
    const amount = parseFloat(document.getElementById("amount").value);
    const category = document.getElementById("category").value;
    const type = document.getElementById("type").value;
    const storeName = document.getElementById("storeName").value;
    const date = document.getElementById("date").value;

    // Send as this user, using a custom endpoint (simulate login as user)
    const res = await fetch("/transactions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "user-id": userId,
      },
      body: JSON.stringify({ amount, category, type, storeName, date }),
    });
    const data = await res.json();
    if (res.ok) {
      messageDiv.style.color = "green";
      messageDiv.textContent = data.message || "Transaction sent!";
      this.reset();
    } else {
      messageDiv.style.color = "red";
      messageDiv.textContent = data.error || "Failed to send transaction.";
    }
  });
