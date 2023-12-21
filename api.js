const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const path = require('path');
const fs = require('fs');
const { createReadStream, createWriteStream } = require('fs');
const { pipeline } = require('stream');
const { promisify } = require('util');

const app = express();
const port = 3000;
const monitoredWebsitesFilePath = path.join(__dirname, 'monitored-websites.json');

const pipelineAsync = promisify(pipeline);

app.use(bodyParser.json());

app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
});

app.post('/addWebsite', async (req, res) => {
    const { url, name, email } = req.body;

    const website = {
        url,
        name,
        email,
        status: 'Pending',
        lastChecked: null,
    };

    let monitoredWebsites = await loadMonitoredWebsites();

    monitoredWebsites.push(website);

    await saveMonitoredWebsites(monitoredWebsites);

    res.status(201).json({ message: 'Website added for monitoring', website });
});

app.get('/status', async (req, res) => {
    const monitoredWebsites = await loadMonitoredWebsites();

    const statusInfo = await Promise.all(
        monitoredWebsites.map(async (website) => {
            try {
                const response = await axios.get(website.url);
                website.status = response.status === 200 ? 'Up' : 'Down';
                website.lastChecked = new Date().toISOString();
            } catch (error) {
                website.status = 'Down';
                website.lastChecked = new Date().toISOString();
            }
            return website;
        })
    );

    res.json(statusInfo);
});

setInterval(async () => {
    let monitoredWebsites = await loadMonitoredWebsites();

    await Promise.all(
        monitoredWebsites.map(async (website) => {
            try {
                const response = await axios.get(website.url);
                website.status = response.status === 200 ? 'Up' : 'Down';
                website.lastChecked = new Date().toISOString();
            } catch (error) {
                website.status = 'Down';
                website.lastChecked = new Date().toISOString();
            }
        })
    );

    await saveMonitoredWebsites(monitoredWebsites);

    console.log('Websites status updated:', monitoredWebsites);
}, 30000);

app.use("/", express.static(path.join(__dirname, "public")));

app.listen(port, async () => {
    try {
        const fileExists = await fs.promises.access(monitoredWebsitesFilePath);
        if (!fileExists) {
            await fs.promises.writeFile(monitoredWebsitesFilePath, '[]');
        }
    } catch (error) {
        await fs.promises.writeFile(monitoredWebsitesFilePath, '[]');
    }

    console.log(`API server is running at http://localhost:${port}`);
});

async function loadMonitoredWebsites() {
    return new Promise((resolve, reject) => {
        const readStream = createReadStream(monitoredWebsitesFilePath, { encoding: 'utf-8' });
        let data = '';

        readStream.on('data', (chunk) => {
            data += chunk;
        });

        readStream.on('end', () => {
            try {
                resolve(JSON.parse(data));
            } catch (error) {
                reject(error);
            }
        });

        readStream.on('error', (error) => {
            reject(error);
        });
    });
}

async function saveMonitoredWebsites(data) {
    const writeStream = createWriteStream(monitoredWebsitesFilePath, { encoding: 'utf-8' });
    await pipelineAsync(JSON.stringify(data, null, 2), writeStream);
}
