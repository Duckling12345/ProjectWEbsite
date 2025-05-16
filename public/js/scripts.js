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
    
    const signupFormElement = signupForm.querySelector('form');

    // Handle Signup Form Submission
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

            const result = await response.json(); // Ensure the response is parsed as JSON

            if (response.status === 409) {
                // Username already exists
                alert(result.error);  // Show alert with error message
            } else if (response.status === 200) {
                // Successful signup, redirect to login page
                alert(result.message);  // Show the success message
                window.location.href = '/html/auth.html'; // Redirect to login page
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

                const loginButton = loginFormElement.querySelector('button[type="submit"]');

                if (response.status === 429) {
                    document.getElementById('login-error').innerText = result.error;
                
                    // Disable button for 5 minutes
                    loginButton.disabled = true;
                    loginButton.innerText = 'Locked (5:00)';
                    
                    let secondsLeft = 300; // 5 minutes
                
                    const interval = setInterval(() => {
                        secondsLeft--;
                        const min = Math.floor(secondsLeft / 60);
                        const sec = secondsLeft % 60;
                        loginButton.innerText = `Locked (${min}:${sec.toString().padStart(2, '0')})`;
                
                        if (secondsLeft <= 0) {
                            clearInterval(interval);
                            loginButton.disabled = false;
                            loginButton.innerText = 'Login';
                        }
                    }, 1000);
                }
                else if (result.error) {
                    document.getElementById('login-error').innerText = result.error;
                } else {
                    localStorage.setItem('username', result.message);
                    window.location.href = '/html/landingPage.html';
                }
                
            } catch (error) {
                console.error('Login error:', error);
                alert('Login failed. Please try again.');
            }
        });
    });
