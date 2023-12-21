    // app.js

    document.addEventListener('DOMContentLoaded', () => {
        const addWebsiteBtn = document.getElementById('addWebsiteBtn');
        const addWebsiteForm = document.getElementById('addWebsiteForm');
        const monitorForm = document.getElementById('monitorForm');
        const websitesTableBody = document.getElementById('websitesTableBody');

        // Event listener for the "Add New Website" button
        addWebsiteBtn.addEventListener('click', () => {
            addWebsiteForm.classList.toggle('hidden');
        });

        // Event listener for the form submission
        monitorForm.addEventListener('submit', async (event) => {
            event.preventDefault();

            const urlInput = document.getElementById('url');
            const nameInput = document.getElementById('name');
            const emailInput = document.getElementById('email');

            const url = urlInput.value;
            const name = nameInput.value;
            const email = emailInput.value;

            // Reset the form
            monitorForm.reset();
            addWebsiteForm.classList.add('hidden');

            try {
                // Send data to the backend API
                const response = await fetch('http://localhost:3000/addWebsite', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ url, name, email }),
                });

                if (!response.ok) {
                    throw new Error('Failed to add website');
                }

                const data = await response.json();
                console.log('Website added:', data);

                // Fetch and display monitored websites after adding a new one
                fetchMonitoredWebsites();
            } catch (error) {
                console.error('Error adding website:', error);
            }
        });

        // Function to fetch and display monitored websites
        const fetchMonitoredWebsites = async () => {
            try {
                const response = await fetch('http://localhost:3000/status');

                if (!response.ok) {
                    throw new Error('Failed to fetch monitored websites');
                }

                const data = await response.json();

                // Clear the existing table rows
                websitesTableBody.innerHTML = '';

                // Loop through the monitored websites and append rows to the table
                data.forEach(website => {
                    const row = document.createElement('tr');
                    row.innerHTML = `
                        <td>${website.name}</td>
                        <td>${website.url}</td>
                        <td>${website.status}</td>
                        <td>${website.lastChecked || 'N/A'}</td>
                    `;
                    websitesTableBody.appendChild(row);
                });
            } catch (error) {
                console.error('Error fetching monitored websites:', error);
            }
        };

        // Fetch and display monitored websites when the page loads
        fetchMonitoredWebsites();

        // Periodically fetch and display monitored websites every 30 seconds
        setInterval(fetchMonitoredWebsites, 30000);
    });
        