// app.js

// Get form and expense list elements
const form = document.getElementById('expense-form');
const expensesList = document.getElementById('expenses');
let editingExpense = null; // Variable to track which expense is being edited

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

    // Update the summary and debt changes once expenses are loaded
    updateSummary();
    updateDebtChanges();
}

// Save expenses to local storage
function saveExpenses(expenses) {
    localStorage.setItem('expenses', JSON.stringify(expenses));
}

// Function to add expense to the list in the DOM
function addExpenseToList(expense) {
    const listItem = document.createElement('li');

    listItem.innerHTML = `
        <input type="text" class="expense-user" value="${expense.user}" disabled>
        <input type="text" class="expense-name" value="${expense.name}" disabled>
        <input type="number" class="expense-amount" value="${expense.amountEuros.toFixed(2)}" disabled>
        <select class="expense-category" disabled>
            <option value="Food" ${expense.category === 'Food' ? 'selected' : ''}>Food</option>
            <option value="Travel" ${expense.category === 'Travel' ? 'selected' : ''}>Travel</option>
            <option value="Rent" ${expense.category === 'Rent' ? 'selected' : ''}>Rent</option>
            <option value="Entertainment" ${expense.category === 'Entertainment' ? 'selected' : ''}>Entertainment</option>
            <option value="Miscellaneous" ${expense.category === 'Miscellaneous' ? 'selected' : ''}>Miscellaneous</option>
        </select>
        <input type="date" class="expense-date" value="${new Date(expense.date).toISOString().split('T')[0]}" disabled>
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
    listItem.querySelector('.expense-user').disabled = false;
    listItem.querySelector('.expense-name').disabled = false;
    listItem.querySelector('.expense-amount').disabled = false;
    listItem.querySelector('.expense-category').disabled = false;
    listItem.querySelector('.expense-date').disabled = false;

    // Hide the edit button and show the save button
    listItem.querySelector('.edit-btn').style.display = 'none';
    listItem.querySelector('.save-btn').style.display = 'inline';
}

// Function to save edits for an expense
function saveEdit(expense, listItem) {
    // Get updated values from input fields
    const updatedUser = listItem.querySelector('.expense-user').value;
    const updatedName = listItem.querySelector('.expense-name').value;
    const updatedAmountEuros = parseFloat(listItem.querySelector('.expense-amount').value);
    const updatedCategory = listItem.querySelector('.expense-category').value;
    const updatedDate = listItem.querySelector('.expense-date').value;

    // Update expense object
    expense.user = updatedUser;
    expense.name = updatedName;
    expense.amountEuros = updatedAmountEuros;
    expense.category = updatedCategory;
    expense.date = updatedDate;

    // Recalculate the amount in satoshis
    fetchBitcoinPrice().then((bitcoinPriceInEuros) => {
        if (bitcoinPriceInEuros !== null) {
            expense.amountSats = (updatedAmountEuros / bitcoinPriceInEuros) * 100000000;

            // Update local storage with new values
            const expenses = JSON.parse(localStorage.getItem('expenses')) || [];
            const updatedExpenses = expenses.map(exp => {
                if (exp.date === expense.date && exp.name === expense.name) {
                    return expense;
                }
                return exp;
            });
            saveExpenses(updatedExpenses);

            // Disable input fields again
            listItem.querySelector('.expense-user').disabled = true;
            listItem.querySelector('.expense-name').disabled = true;
            listItem.querySelector('.expense-amount').disabled = true;
            listItem.querySelector('.expense-category').disabled = true;
            listItem.querySelector('.expense-date').disabled = true;

            // Hide the save button and show the edit button
            listItem.querySelector('.edit-btn').style.display = 'inline';
            listItem.querySelector('.save-btn').style.display = 'none';

            // Update the summary and debt changes after saving changes
            updateSummary();
            updateDebtChanges();
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
    const updatedExpenses = expenses.filter(exp => !(exp.date === expense.date && exp.name === expense.name));
    saveExpenses(updatedExpenses);

    // Update the summary and debt changes after deleting an expense
    updateSummary();
    updateDebtChanges();
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
    const expenseUser = document.getElementById('expense-user').value;
    const expenseName = document.getElementById('expense-name').value;
    const expenseAmountEuros = parseFloat(document.getElementById('expense-amount').value);
    const expenseCategory = document.getElementById('expense-category').value;

    // Calculate equivalent amount in satoshis
    const expenseAmountSats = (expenseAmountEuros / bitcoinPriceInEuros) * 100000000;

    // Create expense object with a date stamp
    const expense = {
        user: expenseUser,
        name: expenseName,
        amountEuros: expenseAmountEuros,
        amountSats: expenseAmountSats,
        category: expenseCategory,
        date: new Date().toISOString().split('T')[0] // Date stamp in ISO format (YYYY-MM-DD)
    };

    // Add the expense to the list in the DOM
    addExpenseToList(expense);

    // Save the expense to local storage
    const expenses = JSON.parse(localStorage.getItem('expenses')) || [];
    expenses.push(expense);
    saveExpenses(expenses);

    // Clear the form inputs
    form.reset();

    // Update the summary and debt changes after adding an expense
    updateSummary();
    updateDebtChanges();
});

// Load expenses when the page loads
loadExpenses();

// Update the summary of who owes whom
async function updateSummary() {
    const expenses = JSON.parse(localStorage.getItem('expenses')) || [];
    let nunoPaidEuros = 0;
    let claudiaPaidEuros = 0;
    let nunoPaidSats = 0;
    let claudiaPaidSats = 0;

    expenses.forEach(expense => {
        if (expense.user === 'Nuno') {
            nunoPaidEuros += expense.amountEuros;
            nunoPaidSats += expense.amountSats;
        } else if (expense.user === 'Claudia') {
            claudiaPaidEuros += expense.amountEuros;
            claudiaPaidSats += expense.amountSats;
        }
    });

    const nunoOwesClaudiaEuros = Math.max(0, claudiaPaidEuros - nunoPaidEuros);
    const claudiaOwesNunoEuros = Math.max(0, nunoPaidEuros - claudiaPaidEuros);

    const nunoOwesClaudiaSats = Math.max(0, claudiaPaidSats - nunoPaidSats);
    const claudiaOwesNunoSats = Math.max(0, nunoPaidSats - claudiaPaidSats);

    // Display the summary
    const summaryElement = document.getElementById('summary');
    summaryElement.innerHTML = `
        <h2>Summary</h2>
        <p>Nuno owes Claudia: €${nunoOwesClaudiaEuros.toFixed(2)} (${nunoOwesClaudiaSats.toFixed(0)} sats)</p>
        <p>Claudia owes Nuno: €${claudiaOwesNunoEuros.toFixed(2)} (${claudiaOwesNunoSats.toFixed(0)} sats)</p>
    `;
}

// Function to calculate if debts are getting cheaper or more expensive in satoshis
async function updateDebtChanges() {
    const expenses = JSON.parse(localStorage.getItem('expenses')) || [];
    const currentBitcoinPriceInEuros = await fetchBitcoinPrice();

    if (currentBitcoinPriceInEuros === null) {
        console.error('Could not fetch current Bitcoin price.');
        return;
    }

    let changesHTML = `<h2>Debt Changes Over Time</h2>`;

    expenses.forEach(expense => {
        const initialSats = expense.amountSats;
        const currentSats = (expense.amountEuros / currentBitcoinPriceInEuros) * 100000000;

        const change = currentSats - initialSats;
        const changeText = change > 0 ? `more expensive` : `cheaper`;

        changesHTML += `
            <p>${expense.user} paid for ${expense.name} on ${new Date(expense.date).toLocaleDateString()}: 
            Initial value: ${initialSats.toFixed(0)} sats, Current value: ${currentSats.toFixed(0)} sats 
            (${Math.abs(change.toFixed(0))} sats ${changeText})</p>
        `;
    });

    const changesElement = document.getElementById('debt-changes');
    changesElement.innerHTML = changesHTML;
}
