import express from 'express'
import usersRouter from '~/routes/users.routes'
import databaseService from '~/services/database.services'
import 'dotenv/config'
import { defaultErrorHandle } from '~/middlewares/errors.middlewares'
import { PATH } from './constants/path'
import mediasRouter from './routes/medias.routes'
import { initFolder } from './utils/file'
import staticRouter from './routes/static.routes'
import cors from 'cors'
import tweetsRouter from './routes/tweets.routes'
import bookmarksRouter from './routes/bookmark.routes'
import likesRouter from './routes/like.routes'
import searchRouter from '~/routes/search.routes'
import { createServer } from 'http'
import { Server } from 'socket.io'
import { Conversation } from './models/schemas/Conversation.schemas'
import { ObjectId } from 'mongodb'
// import './utils/fake'

databaseService.connect().then(() => {
  databaseService.indexUsers()
  databaseService.indexRefreshTokens()
  databaseService.indexVideoStatus()
  databaseService.indexFollowers()
  databaseService.indexHashtags()
  databaseService.indexBookmarks()
  databaseService.indexLikes()
  databaseService.indexTweet()
})
initFolder()
const app = express()
const httpServer = createServer(app)
app.use(cors())
app.use(express.json())
app.use(PATH.USER, usersRouter)
app.use(PATH.MEDIAS, mediasRouter)
app.use(PATH.TWEETS, tweetsRouter)
app.use(PATH.BOOKMARKS, bookmarksRouter)
app.use(PATH.LIKES, likesRouter)
app.use(PATH.SEARCH, searchRouter)
app.use(PATH.STATIC, staticRouter)
app.use(defaultErrorHandle)

const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL
  }
})

const users: { [key: string]: { socket_id: string } } = {}

io.on('connection', (socket) => {
  console.log(`User ${socket.id} is connected`)
  const user_id = socket.handshake.auth._id
  if (user_id) {
    users[user_id] = {
      socket_id: socket.id
    }
  }

  console.log('users', users)

  socket.on('chat', async (data) => {
    const receiverSocketId = users[data.to]?.socket_id
    if (!receiverSocketId) return
    await databaseService.conversations.insertOne(
      new Conversation({
        sender_id: new ObjectId(data.from),
        receiver_id: new ObjectId(data.to),
        content: data.content
      })
    )
    socket.to(receiverSocketId).emit('chat receiver', {
      content: data.content,
      from: user_id
    })
  })
  socket.on('disconnect', () => {
    delete users[user_id]
    console.log(`User ${socket.id} is disconnected`)
  })
})

httpServer.listen(process.env.APP_PORT, () => {
  console.log(`Server starting with: ${process.env.APP_URL}:${process.env.APP_PORT}`)
})
