document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('registration-form');

    form.addEventListener('submit', (event) => {
        event.preventDefault(); // Prevent default form submission

        const formData = new FormData(form); // Create a FormData object from the form

        fetch('https://formspree.io/f/mdkoadld', {
            method: 'POST', // Set request method to POST
            body: formData, // Attach the form data
            headers: {
                Accept: 'application/json' // Specify that we accept JSON response
            }
        })
        .then(response => {
            if (response.ok) {
                alert('Registration successful!'); // Alert on successful registration
                form.reset(); // Reset form after submission
            } else {
                alert('There was a problem with your registration.'); // Alert on error
            }
        })
        .catch(error => {
            alert('There was a problem with your registration.'); // Alert on catch error
            console.error('Error:', error); // Log error details to console
        });
    });
});
