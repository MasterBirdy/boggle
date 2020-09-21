const express = require("express");
const socket = require("socket.io");
require("dotenv").config();

const app = express();
const server = app.listen(process.env.PORT || 4000, () => {
    console.log(`Listening to requests on port ${process.env.PORT || 4000}`);
});

const io = socket(server);

// current players
const players = {};
const activePlayers = [];
const playingPlayers = [];

// boggle game
let number = 0;
const playStatuses = {
    PLAYING: "PLAYING",
    WAITING: "WAITING",
    COUNTING: "COUNTING",
};
let playStatus = playStatuses.WAITING;
let seconds = 180;
let boggleString = "AAAAAAAAAAAAAAAA";

app.get("/api/info/", function (req, res) {
    return res.status(200).json({
        playStatus,
        seconds,
        boggleString,
    });
});

io.on("connection", (socket) => {
    socket.on("register", (name) => {
        if (players[name]) {
            if (!activePlayers.includes(name)) {
                players[name] = { ...players[name], id: socket.id };
                activePlayers.push(name);
                io.sockets.emit("playerChange", players);
                io.sockets.connected[socket.id].emit("changeStatus", playStatus);
            } else {
                io.sockets.connected[socket.id].emit("error", "Name already registered");
            }
        } else {
            if (playStatus === playStatuses.WAITING) {
                if (!players[name]) {
                    players[name] = { id: socket.id, words: [] };
                    io.sockets.emit("playerChange", players);
                }
            }
        }
    });

    socket.on("startgame", () => {
        playStatus = playStatues.PLAYING;
        playingPlayers = [...activePlayers];
    });

    socket.on("disconnect", () => {
        if (playStatus === playStatuses.WAITING) {
            Object.keys(players).forEach((player) => {
                if (players[player].id === socket.id) {
                    delete players[player];
                    activePlayers.filter((name) => name !== player);
                    io.sockets.emit("playerChange", players);
                }
            });
        }
    });
});
