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

// Load expenses from local storage
function loadExpenses() {
    const expenses = JSON.parse(localStorage.getItem('expenses')) || [];
    expenses.forEach(expense => {
        addExpenseToList(expense.name, expense.amountEuros, expense.amountSats);
    });
}

// Save expenses to local storage
function saveExpense(expense) {
    const expenses = JSON.parse(localStorage.getItem('expenses')) || [];
    expenses.push(expense);
    localStorage.setItem('expenses', JSON.stringify(expenses));
}

// Function to add expense to the list in the DOM
function addExpenseToList(name, amountEuros, amountSats) {
    const listItem = document.createElement('li');
    listItem.textContent = `${name}: €${amountEuros.toFixed(2)} (${amountSats.toFixed(0)} sats)`;
    expensesList.appendChild(listItem);
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

    // Add the expense to the list in the DOM
    addExpenseToList(expenseName, expenseAmountEuros, expenseAmountSats);

    // Save the expense to local storage
    saveExpense({ name: expenseName, amountEuros: expenseAmountEuros, amountSats: expenseAmountSats });

    // Clear the form inputs
    form.reset();
});

// Load expenses when the page loads
loadExpenses();
