const socketIo = require('socket.io');

let io;

const initSocket = (server) => {
    io = socketIo(server, {
        cors: {
            origin: process.env.NODE_ENV === "production"
                ? ["https://engine-board-frontend.vercel.app"]
                : ["http://localhost:3000"],
            methods: ["GET", "POST", "PUT", "DELETE"],
            credentials: true
        }
    });

    io.on('connection', (socket) => {
        console.log('New client connected:', socket.id);

        socket.on('join-plan', (planId) => {
            socket.join(planId);
            console.log(`Socket ${socket.id} joined plan ${planId}`);
        });

        socket.on('leave-plan', (planId) => {
            socket.leave(planId);
            console.log(`Socket ${socket.id} left plan ${planId}`);
        });

        socket.on('update-plan', ({ planId, data }) => {
            // Broadcast update to everyone else in the room
            socket.to(planId).emit('plan-updated', data);
        });

        socket.on('cursor-move', ({ planId, user, position }) => {
            // Broadcast cursor position
            socket.to(planId).emit('cursor-moved', { user, position });
        });

        socket.on('disconnect', () => {
            console.log('Client disconnected:', socket.id);
        });
    });

    return io;
};

const getIo = () => {
    if (!io) {
        throw new Error("Socket.io not initialized!");
    }
    return io;
};

module.exports = { initSocket, getIo };
