// app.js

// Get form and expense list elements
const form = document.getElementById('expense-form');
const expensesList = document.getElementById('expenses');

// Function to fetch current Bitcoin price in euros
async function fetchBitcoinPrice() {
    try {
        const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=eur');
        const data = await response.json();
        return data.bitcoin.eur;
    } catch (error) {
        console.error('Error fetching Bitcoin price:', error);
        return null;
    }
}

// Listen for form submission
form.addEventListener('submit', async function (e) {
    e.preventDefault();

    // Get the current Bitcoin price in euros
    const bitcoinPriceInEuros = await fetchBitcoinPrice();

    if (bitcoinPriceInEuros === null) {
        alert('Could not fetch Bitcoin price. Please try again later.');
        return;
    }

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

