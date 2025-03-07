// Save the username to localStorage
function saveUsername(username) {
    localStorage.setItem("username", username);
}

// Retrieve the username from localStorage
function getUsername() {
    return localStorage.getItem("username");
}

// Clear the username from localStorage
function clearUsername() {
    localStorage.removeItem("username");
}

// Check if a user is logged in
function isLoggedIn() {
    return !!getUsername();
}
