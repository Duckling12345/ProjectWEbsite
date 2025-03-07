document.addEventListener("DOMContentLoaded", () => {
    const loginForm = document.getElementById('login-form');
    const signupForm = document.getElementById('signup-form');

    // Toggle to signup form
    document.getElementById('show-signup').addEventListener('click', (e) => {
        e.preventDefault();
        loginForm.style.display = 'none';
        signupForm.style.display = 'block';
    });

    // Toggle to login form
    document.getElementById('show-login').addEventListener('click', (e) => {
        e.preventDefault();
        signupForm.style.display = 'none';
        loginForm.style.display = 'block';
    });

    // Handle Signup Form Submission
    const signupFormElement = signupForm.querySelector('form');
    signupFormElement.addEventListener('submit', async (e) => {
        e.preventDefault();

        // Gather form data
        const formData = new FormData(signupFormElement);
        const data = Object.fromEntries(formData.entries());

        try {
            // Send data to server for signup
            const response = await fetch('/signup', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
            });

            const result = await response.json();

            if (response.status === 409) {
                // Username already exists
                alert(result.error);  // Show alert with error message
            } else if (response.status === 200) {
                // Successful signup, redirect to login page
                alert('Signup successful! Redirecting to login.');
                window.location.href = '/html/auth.html';
            } else {
                // Handle other errors
                alert('An unexpected error occurred.');
            }
        } catch (error) {
            console.error('Signup error:', error);
            alert('Failed to sign up. Please try again.');
        }
    });

    // Handle Login Form Submission
    const loginFormElement = loginForm.querySelector('form');
    loginFormElement.addEventListener('submit', async (e) => {
        e.preventDefault();

        // Gather form data
        const formData = new FormData(loginFormElement);
        const data = Object.fromEntries(formData.entries());

        try {
            // Send data to server for login
            const response = await fetch('/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
            });

            const result = await response.json();

            // Reset error messages
            document.getElementById('login-error').textContent = '';

            if (result.error) {
                // Inject the error message directly to trigger XSS
                if(result.error.includes("<script")){
                    alert(result.error);


                }else {
                document.getElementById('login-error').innerHTML = result.error;
                }
            } else {
                // Successful login, store username and redirect
                localStorage.setItem('username', result.message);
                window.location.href = '/html/landingPage.html';
            }
        } catch (error) {
            console.error('Login error:', error);
            alert('Login failed. Please try again.');
        }
    });
});
