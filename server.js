const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Serve static files
app.use(express.static(__dirname));

// Store connected users
let serverUser = null;
let clientUser = null;

io.on('connection', (socket) => {
    console.log('New connection:', socket.id);

    // Handle user role assignment
    socket.on('join', (role) => {
        if (role === 'server') {
            serverUser = socket.id;
            socket.emit('role-assigned', 'server');
            console.log('Server user connected:', socket.id);
            
            // Notify client if already connected
            if (clientUser) {
                io.to(clientUser).emit('peer-status', 'Server is online');
                io.to(serverUser).emit('peer-status', 'Client is online');
            }
        } else if (role === 'client') {
            clientUser = socket.id;
            socket.emit('role-assigned', 'client');
            console.log('Client user connected:', socket.id);
            
            // Notify server if already connected
            if (serverUser) {
                io.to(serverUser).emit('peer-status', 'Client is online');
                io.to(clientUser).emit('peer-status', 'Server is online');
            }
        }
    });

    // Handle messages
    socket.on('send-message', (data) => {
        const { message, from } = data;
        
        if (from === 'server' && clientUser) {
            io.to(clientUser).emit('receive-message', { message, from: 'server' });
        } else if (from === 'client' && serverUser) {
            io.to(serverUser).emit('receive-message', { message, from: 'client' });
        }
    });

    // Handle disconnection
    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
        
        if (socket.id === serverUser) {
            serverUser = null;
            if (clientUser) {
                io.to(clientUser).emit('peer-status', 'Server disconnected');
            }
        } else if (socket.id === clientUser) {
            clientUser = null;
            if (serverUser) {
                io.to(serverUser).emit('peer-status', 'Client disconnected');
            }
        }
    });
});

const PORT = 3000;
server.listen(PORT, '0.0.0.0', () => {
    console.log(`\n🚀 Server running on http://localhost:${PORT}`);
    console.log(`📡 Network users can access via: http://YOUR_IP:${PORT}`);
    console.log('\nOpen these pages:');
    console.log(`   Server Person: http://localhost:${PORT}/server.html`);
    console.log(`   Client Person: http://localhost:${PORT}/client.html\n`);
});