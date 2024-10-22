// app.js

// Get form and expense list elements
const form = document.getElementById('expense-form');
const expensesList = document.getElementById('expenses');

// Current Bitcoin price in euros (for example purposes; we'll make this dynamic later)
const bitcoinPriceInEuros = 30000; // This is just a placeholder

// Listen for form submission
form.addEventListener('submit', function (e) {
    e.preventDefault();

    // Get expense details from form inputs
    const expenseName = document.getElementById('expense-name').value;
    const expenseAmountEuros = parseFloat(document.getElementById('expense-amount').value);

    // Calculate equivalent amount in satoshis
    const expenseAmountSats = (expenseAmountEuros / bitcoinPriceInEuros) * 100000000;

    // Create a new list item to display the expense
    const listItem = document.createElement('li');
    listItem.textContent = `${expenseName}: €${expenseAmountEuros.toFixed(2)} (${expenseAmountSats.toFixed(0)} sats)`;

    // Add the list item to the expense list
    expensesList.appendChild(listItem);

    // Clear the form inputs
    form.reset();
});
