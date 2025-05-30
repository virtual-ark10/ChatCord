import express from "express"
import {fileURLToPath} from 'url'
import { dirname, join } from "path";
import http from "http";
import {Server} from "socket.io";
import formatMessage from "./public/js/messages.js";
import {userJoin, getCurrentUser, getRoomUsers, userLeave} from "./utils/users.js"

const app = express();
const server = http.createServer(app)
const io = new Server(server)

const __filename = fileURLToPath(import.meta.url); 
const __dirname = dirname(__filename);

app.use(express.static(join(__dirname, 'public')))

const botName = 'ChatCord Bot';

//Run when client connects
io.on("connection", socket => {

    socket.on('joinRoom', ({username, room}) => {

        const user = userJoin(socket.id, username, room)

        socket.join(user.room)

        //Welcome current user
        socket.emit('message', formatMessage(botName, 'Welcome to ChatCord!'))

        //Broadcast to users when a client connects
        socket.broadcast.to(user.room).emit('message', formatMessage(botName, `${user.username} has joined the chat!`));

        //Send users and room info
        io.to(user.room).emit('roomUsers',{
            room: user.room, 
            users: getRoomUsers(user.room)
        });
    
        //Listen for chatMessage
        socket.on('chatMessage', msg => {
            const user = getCurrentUser(socket.id)

            io.to(user.room).emit('message', formatMessage(user.username, msg));
        })
        
        //Runs when a user disconnects
        socket.on('disconnect', () => {
            const user = userLeave(socket.id);

            if(user) {
                io.to(user.room).emit('message', formatMessage(botName, `${user.username} has left the chat`));
            }
        })
          
    })

})



server.listen(3000, () => {
    console.log("listening on port 3000...")
})