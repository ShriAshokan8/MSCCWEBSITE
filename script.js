document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('registration-form');

    form.addEventListener('submit', (event) => {
        event.preventDefault(); // Prevent default form submission

        const formData = new FormData(form);

        fetch('https://formspree.io/f/mdkoadld', {
            method: 'POST',
            body: formData,
            headers: {
                Accept: 'application/json'
            }
        })
        .then(response => {
            if (response.ok) {
                alert('Registration successful!');
                form.reset(); // Reset form after submission
            } else {
                alert('There was a problem with your registration.');
            }
        })
        .catch(error => {
            alert('There was a problem with your registration.');
            console.error('Error:', error);
        });
    });
});
