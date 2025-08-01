const categoryOptions = [
  "food", "transportation", "entertainment", "shopping", "bills", "health", "education", "travel", "other"
];

// Populate category dropdown
const categorySelect = document.getElementById('category');
categoryOptions.forEach(cat => {
  const opt = document.createElement('option');
  opt.value = cat;
  opt.textContent = cat.charAt(0).toUpperCase() + cat.slice(1);
  categorySelect.appendChild(opt);
});

// Populate user dropdown from API
fetch('/users')
  .then(res => res.json())
  .then(users => {
    const userSelect = document.getElementById('user');
    users.forEach(u => {
      const opt = document.createElement('option');
      opt.value = u.id;
      opt.textContent = u.name;
      userSelect.appendChild(opt);
    });
  });

// Handle form submit
document.getElementById('transactionForm').addEventListener('submit', async function(e) {
  e.preventDefault();
  const messageDiv = document.getElementById('message');
  messageDiv.textContent = '';
  const userId = document.getElementById('user').value;
  const amount = parseFloat(document.getElementById('amount').value);
  const category = document.getElementById('category').value;
  const type = document.getElementById('type').value;
  const storeName = document.getElementById('storeName').value;
  const date = document.getElementById('date').value;
  
  // Send as this user, using a custom endpoint (simulate login as user)
  const res = await fetch('/transactions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'user-id': userId
    },
    body: JSON.stringify({ amount, category, type, storeName, date })
  });
  const data = await res.json();
  if (res.ok) {
    messageDiv.style.color = 'green';
    messageDiv.textContent = data.message || 'Transaction sent!';
    this.reset();
  } else {
    messageDiv.style.color = 'red';
    messageDiv.textContent = data.error || 'Failed to send transaction.';
  }
});
