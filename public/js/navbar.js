// Assuming this is part of your login success logic
document.addEventListener("DOMContentLoaded", () => {
    const authButton = document.querySelector('.login-button');
    const username = localStorage.getItem('username');

    if (username) {
        // Replace login button with username and dropdown
        authButton.innerHTML = `
            <a href="#" class="username-dropdown">${username}</a>
            <div class="dropdown-menu-login">
                <a href="#" id="logout-button">Logout</a>
            </div>
        `;

        // Add a class to indicate the user is logged in
        document.querySelector('.nav').classList.add('logged-in');

        // Logout functionality
        document.getElementById('logout-button').addEventListener('click', (e) => {
            e.preventDefault();
            localStorage.removeItem('username');
            window.location.reload(); // Reload to show the login button again
        });
    }
});
