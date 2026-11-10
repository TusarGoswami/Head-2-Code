const express = require('express');
const path = require('path');
const http = require('http');
const { Server } = require('socket.io');
const fs = require('fs');
const app = express();

const envPaths = [
    path.resolve(__dirname, '../.env'),
    path.resolve(__dirname, './.env'),
    path.resolve(__dirname, '../../.env')
];
for (const envPath of envPaths) {
    if (fs.existsSync(envPath)) {
        require('dotenv').config({ path: envPath });
        break;
    }
}

const main = require('./config/db');
const cookieParser = require('cookie-parser');
const redisClient = require('./config/redis');
const cors = require('cors');

const authRouter = require("./routes/userAuth");
const problemRouter = require("./routes/problemCreator");
const submitRouter = require("./routes/submit");
const aiRouter = require("./routes/aiChatting");
const videoRouter = require("./routes/videoCreator");
const contestRouter = require("./routes/contest");
const dailyChallengeRouter = require("./routes/dailyChallenge");
const friendArenaRouter = require("./routes/friendArena");
const profileRouter = require("./routes/profile");
const achievementsRouter = require("./routes/achievements");
const complexityRouter = require("./routes/complexityAnalyzer");

// Create HTTP server
const server = http.createServer(app);

const allowedOrigins = [
    'http://localhost',
    'http://127.0.0.1',
    'http://localhost:80',
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'http://localhost:5175',
    'http://127.0.0.1:5175',
    'http://head2code.duckdns.org',
    'https://head2code.duckdns.org',
    process.env.CLIENT_URL
].filter(Boolean);

// Setup Socket.io
const io = new Server(server, {
    cors: {
        origin: allowedOrigins,
        credentials: true,
        methods: ['GET', 'POST']
    }
});

// Trust reverse proxy (Render, AWS ALB, Nginx)
app.set('trust proxy', 1);

app.use(cors({
    origin: allowedOrigins,
    credentials: true
}));

app.use(express.json());
app.use(cookieParser());

app.use('/user', authRouter);
app.use('/problem', problemRouter);
app.use('/submission', submitRouter);
app.use('/ai', aiRouter);
app.use('/video', videoRouter);
app.use('/contest', contestRouter);
app.use('/daily-challenge', dailyChallengeRouter);
app.use('/friend-arena', friendArenaRouter);
app.use('/profile', profileRouter);
app.use('/achievements', achievementsRouter);
app.use('/complexity', complexityRouter);

// Socket.io connection handling
const jwt = require('jsonwebtoken');
const User = require('./models/user');
const Contest = require('./models/contest');
const FriendArena = require('./models/friendArena');

io.use(async (socket, next) => {
    try {
        const token = socket.handshake.auth.token || socket.handshake.headers.cookie?.split('token=')[1]?.split(';')[0];
        if (!token) {
            return next(new Error('Authentication error'));
        }

        const payload = jwt.verify(token, process.env.JWT_KEY || 'default_jwt_key');
        const user = await User.findById(payload._id);
        if (!user) {
            return next(new Error('User not found'));
        }

        socket.userId = user._id.toString();
        socket.user = user;
        next();
    } catch (err) {
        next(new Error('Authentication error'));
    }
});

// Store active contest rooms
const activeContests = new Map();

io.on('connection', (socket) => {
    console.log(`User connected: ${socket.userId}`);

    // Join contest room
    socket.on('join-contest', async (contestId) => {
        try {
            const contest = await Contest.findById(contestId)
                .populate('leaderboard.userId', 'firstName lastName')
                .populate('participants.userId', 'firstName lastName');

            if (!contest) {
                socket.emit('error', { message: 'Contest not found' });
                return;
            }

            socket.join(`contest-${contestId}`);

            // Send contest details
            socket.emit('contest-data', {
                contest: contest,
                timestamp: Date.now()
            });

            // Send current leaderboard
            const sortedLeaderboard = contest.leaderboard.sort((a, b) => {
                if (b.problemsSolved !== a.problemsSolved) {
                    return b.problemsSolved - a.problemsSolved;
                }
                return b.totalScore - a.totalScore;
            });

            socket.emit('leaderboard-update', sortedLeaderboard);

            // Calculate and send timer
            const participant = contest.participants.find(
                p => p.userId.toString() === socket.userId
            );

            if (participant && participant.startTime) {
                const now = new Date();
                const endTime = new Date(participant.endTime);
                const remaining = Math.max(0, endTime - now);

                socket.emit('timer-update', {
                    remaining: remaining,
                    endTime: endTime
                });

                // Start timer interval for this user
                if (!activeContests.has(`${contestId}-${socket.userId}`)) {
                    const intervalId = setInterval(() => {
                        const now = new Date();
                        const remaining = Math.max(0, endTime - now);

                        socket.emit('timer-update', {
                            remaining: remaining,
                            endTime: endTime
                        });

                        if (remaining <= 0) {
                            clearInterval(intervalId);
                            activeContests.delete(`${contestId}-${socket.userId}`);
                            socket.emit('contest-ended', { message: 'Your contest time has ended' });
                        }
                    }, 1000); // Update every second

                    activeContests.set(`${contestId}-${socket.userId}`, intervalId);
                }
            }

            // Check if contest has started/ended
            const now = new Date();
            if (now < contest.startTime) {
                socket.emit('contest-status', { status: 'upcoming', startTime: contest.startTime });
            } else if (now > contest.endTime) {
                socket.emit('contest-status', { status: 'ended', endTime: contest.endTime });
            } else {
                socket.emit('contest-status', { status: 'active' });
            }
        } catch (err) {
            console.error('Error joining contest:', err);
            socket.emit('error', { message: 'Error joining contest' });
        }
    });

    // Leave contest room
    socket.on('leave-contest', (contestId) => {
        socket.leave(`contest-${contestId}`);
        const intervalKey = `${contestId}-${socket.userId}`;
        if (activeContests.has(intervalKey)) {
            clearInterval(activeContests.get(intervalKey));
            activeContests.delete(intervalKey);
        }
    });

    // Join Friend Arena room
    socket.on('join-friend-arena', async (roomCode) => {
        try {
            const arena = await FriendArena.findOne({ roomCode: roomCode.toUpperCase() })
                .populate('leaderboard.userId', 'firstName lastName')
                .populate('participants.userId', 'firstName lastName')
                .populate('problems');

            if (!arena) {
                socket.emit('error', { message: 'Friend Arena room not found' });
                return;
            }

            socket.join(`friend-arena-${roomCode}`);

            // Send arena details
            socket.emit('friend-arena-data', {
                arena: arena,
                timestamp: Date.now()
            });

            // Send current leaderboard
            const sortedLeaderboard = arena.leaderboard.sort((a, b) => {
                if (b.problemsSolved !== a.problemsSolved) {
                    return b.problemsSolved - a.problemsSolved;
                }
                return b.totalTestCasesPassed - a.totalTestCasesPassed;
            });

            socket.emit('friend-arena-leaderboard-update', sortedLeaderboard);
        } catch (err) {
            console.error('Error joining Friend Arena:', err);
            socket.emit('error', { message: 'Error joining Friend Arena' });
        }
    });

    // Leave Friend Arena room
    socket.on('leave-friend-arena', (roomCode) => {
        socket.leave(`friend-arena-${roomCode}`);
    });

    socket.on('disconnect', () => {
        console.log(`User disconnected: ${socket.userId}`);
        // Clean up intervals
        for (const [key, intervalId] of activeContests.entries()) {
            if (key.includes(socket.userId)) {
                clearInterval(intervalId);
                activeContests.delete(key);
            }
        }
    });
});

// Helper function to broadcast leaderboard updates
const broadcastLeaderboardUpdate = async (contestId) => {
    try {
        const contest = await Contest.findById(contestId)
            .populate('leaderboard.userId', 'firstName lastName');

        if (!contest) return;

        const sortedLeaderboard = contest.leaderboard.sort((a, b) => {
            if (b.problemsSolved !== a.problemsSolved) {
                return b.problemsSolved - a.problemsSolved;
            }
            return b.totalScore - a.totalScore;
        });

        io.to(`contest-${contestId}`).emit('leaderboard-update', sortedLeaderboard);
    } catch (err) {
        console.error('Error broadcasting leaderboard:', err);
    }
};

// Helper function to broadcast Friend Arena leaderboard updates
const broadcastFriendArenaLeaderboardUpdate = async (roomCode) => {
    try {
        const arena = await FriendArena.findOne({ roomCode: roomCode.toUpperCase() })
            .populate('leaderboard.userId', 'firstName lastName');

        if (!arena) return;

        const sortedLeaderboard = arena.leaderboard.sort((a, b) => {
            if (b.problemsSolved !== a.problemsSolved) {
                return b.problemsSolved - a.problemsSolved;
            }
            return b.totalTestCasesPassed - a.totalTestCasesPassed;
        });

        io.to(`friend-arena-${roomCode}`).emit('friend-arena-leaderboard-update', sortedLeaderboard);
    } catch (err) {
        console.error('Error broadcasting Friend Arena leaderboard:', err);
    }
};

// Export io instance for use in controllers
app.set('io', io);
app.set('broadcastLeaderboard', broadcastLeaderboardUpdate);
app.set('broadcastFriendArenaLeaderboard', broadcastFriendArenaLeaderboardUpdate);

const InitalizeConnection = async () => {
    try {
        await main();
        console.log("✅ MongoDB Connected");

        try {
            await redisClient.connect();
            console.log("✅ Redis Connected");
        } catch (redisErr) {
            console.warn("⚠️ Redis Connection Warning:", redisErr.message);
            console.warn("   (Server will continue, but Redis features require Redis service running)");
        }

        server.listen(process.env.PORT || 5000, () => {
            console.log("🚀 Server listening at port:", process.env.PORT || 5000);
            console.log("🔌 Socket.io server ready");
        });

    } catch (err) {
        console.error("❌ Startup Error:", err.message);
        process.exit(1);
    }
};

InitalizeConnection();