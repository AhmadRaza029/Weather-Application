/**
 * Simple HTTP server for testing the Weather Application locally
 * 
 * This script creates a basic HTTP server to serve the application files.
 * It's useful for testing the application locally, especially for features
 * that require a secure context (HTTPS) like geolocation and notifications.
 * 
 * Usage: 
 * 1. Make sure Node.js is installed on your system
 * 2. Run this script with: node server.js
 * 3. Open http://localhost:8080 in your browser
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

// Port to use (can be changed if needed)
const PORT = 8080;

// MIME types for different file extensions
const MIME_TYPES = {
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'text/javascript',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.txt': 'text/plain'
};

// Create the HTTP server
const server = http.createServer((req, res) => {
    console.log(`Request: ${req.method} ${req.url}`);
    
    // Handle favicon requests
    if (req.url === '/favicon.ico') {
        req.url = '/favicon.svg';
    }
    
    // Parse the URL to remove query parameters
    let urlPath = req.url.split('?')[0];
    
    // Normalize URL to prevent directory traversal attacks
    let filePath = path.normalize(path.join(__dirname, urlPath));
    
    // If URL ends with '/', serve index.html
    if (urlPath === '/' || urlPath === '') {
        filePath = path.join(__dirname, 'index.html');
    }
    
    // Get file extension
    const extname = path.extname(filePath);
    
    // Set default content type to text/plain
    let contentType = 'text/plain';
    
    // Set content type based on file extension
    if (MIME_TYPES[extname]) {
        contentType = MIME_TYPES[extname];
    }
    
    // Read the file
    fs.readFile(filePath, (err, content) => {
        if (err) {
            // If file not found
            if (err.code === 'ENOENT') {
                console.error(`File not found: ${filePath}`);
                res.writeHead(404);
                res.end('404 Not Found');
            } else {
                // Server error
                console.error(`Server error: ${err.code}`);
                res.writeHead(500);
                res.end(`Server Error: ${err.code}`);
            }
        } else {
            // Success - return the file
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(content, 'utf-8');
        }
    });
});

// Start the server
server.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}/`);
    console.log(`Press Ctrl+C to stop the server`);
});