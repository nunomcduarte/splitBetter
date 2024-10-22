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
        addExpenseToList(expense);
    });
}

// Save expenses to local storage
function saveExpenses(expenses) {
    localStorage.setItem('expenses', JSON.stringify(expenses));
}

// Function to add expense to the list in the DOM
function addExpenseToList(expense) {
    const listItem = document.createElement('li');

    listItem.innerHTML = `
        <input type="text" class="expense-name" value="${expense.name}" disabled>
        <input type="number" class="expense-amount" value="${expense.amountEuros.toFixed(2)}" disabled>
        <select class="expense-category" disabled>
            <option value="Food" ${expense.category === 'Food' ? 'selected' : ''}>Food</option>
            <option value="Travel" ${expense.category === 'Travel' ? 'selected' : ''}>Travel</option>
            <option value="Rent" ${expense.category === 'Rent' ? 'selected' : ''}>Rent</option>
            <option value="Entertainment" ${expense.category === 'Entertainment' ? 'selected' : ''}>Entertainment</option>
            <option value="Miscellaneous" ${expense.category === 'Miscellaneous' ? 'selected' : ''}>Miscellaneous</option>
        </select>
        <span>(${expense.amountSats.toFixed(0)} sats)</span>
        <button class="edit-btn">Edit</button>
        <button class="save-btn" style="display: none;">Save</button>
        <button class="delete-btn">Delete</button>
    `;

    // Add event listeners for edit, save, and delete buttons
    listItem.querySelector('.edit-btn').addEventListener('click', () => enterEditMode(listItem));
    listItem.querySelector('.save-btn').addEventListener('click', () => saveEdit(expense, listItem));
    listItem.querySelector('.delete-btn').addEventListener('click', () => deleteExpense(expense, listItem));

    expensesList.appendChild(listItem);
}

// Function to enter edit mode for an expense
function enterEditMode(listItem) {
    // Enable the input fields
    listItem.querySelector('.expense-name').disabled = false;
    listItem.querySelector('.expense-amount').disabled = false;
    listItem.querySelector('.expense-category').disabled = false;

    // Hide the edit button and show the save button
    listItem.querySelector('.edit-btn').style.display = 'none';
    listItem.querySelector('.save-btn').style.display = 'inline';
}

// Function to save edits for an expense
function saveEdit(expense, listItem) {
    // Get updated values from input fields
    const updatedName = listItem.querySelector('.expense-name').value;
    const updatedAmountEuros = parseFloat(listItem.querySelector('.expense-amount').value);
    const updatedCategory = listItem.querySelector('.expense-category').value;

    // Update expense object
    expense.name = updatedName;
    expense.amountEuros = updatedAmountEuros;
    expense.category = updatedCategory;

    // Recalculate the amount in satoshis
    fetchBitcoinPrice().then((bitcoinPriceInEuros) => {
        if (bitcoinPriceInEuros !== null) {
            expense.amountSats = (updatedAmountEuros / bitcoinPriceInEuros) * 100000000;

            // Update local storage with new values
            const expenses = JSON.parse(localStorage.getItem('expenses')) || [];
            const updatedExpenses = expenses.map(exp => {
                if (exp.name === expense.name && exp.amountEuros === expense.amountEuros && exp.category === expense.category) {
                    return expense;
                }
                return exp;
            });
            saveExpenses(updatedExpenses);

            // Disable input fields again
            listItem.querySelector('.expense-name').disabled = true;
            listItem.querySelector('.expense-amount').disabled = true;
            listItem.querySelector('.expense-category').disabled = true;

            // Hide the save button and show the edit button
            listItem.querySelector('.edit-btn').style.display = 'inline';
            listItem.querySelector('.save-btn').style.display = 'none';
        } else {
            alert('Could not fetch Bitcoin price. Please try again later.');
        }
    });
}

// Delete an expense
function deleteExpense(expense, listItem) {
    // Remove the list item from the DOM
    expensesList.removeChild(listItem);

    // Remove the expense from local storage
    const expenses = JSON.parse(localStorage.getItem('expenses')) || [];
    const updatedExpenses = expenses.filter(exp => !(exp.name === expense.name && exp.amountEuros === expense.amountEuros && exp.category === expense.category));
    saveExpenses(updatedExpenses);
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
    const expenseCategory = document.getElementById('expense-category').value;

    // Calculate equivalent amount in satoshis
    const expenseAmountSats = (expenseAmountEuros / bitcoinPriceInEuros) * 100000000;

    // Create expense object
    const expense = {
        name: expenseName,
        amountEuros: expenseAmountEuros,
        amountSats: expenseAmountSats,
        category: expenseCategory
    };

    // Add the expense to the list in the DOM
    addExpenseToList(expense);

    // Save the expense to local storage
    const expenses = JSON.parse(localStorage.getItem('expenses')) || [];
    expenses.push(expense);
    saveExpenses(expenses);

    // Clear the form inputs
    form.reset();
});

// Load expenses when the page loads
loadExpenses();
