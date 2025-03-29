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
import conversationsRouter from './routes/conversations.routes'
import { verifyAccessToken } from './utils/common'
import { TokenPayLoad } from './models/requests/User.requests'
import { UserVerifyStatus } from './constants/enums'
import { ErrorsWithStatus } from './models/Errors'
import { USER_MESSAGE } from './constants/messages'
import HTTP_STATUS_CODE from './constants/httpStatusCode'
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
app.use(PATH.CONVERSATIONS, conversationsRouter)
app.use(PATH.STATIC, staticRouter)
app.use(defaultErrorHandle)

const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL
  }
})

const users: { [key: string]: { socket_id: string } } = {}

// Middleware the server instance
io.use(async (socket, next) => {
  const { Authorization } = socket.handshake.auth
  const access_token = (Authorization || '').split(' ')[1]
  try {
    const decode_authorization = await verifyAccessToken(access_token)
    const { verify } = decode_authorization as TokenPayLoad
    if (verify !== UserVerifyStatus.Verified) {
      throw new ErrorsWithStatus({
        message: USER_MESSAGE.VERIFY_USER_INVALID,
        status: HTTP_STATUS_CODE.FORBIDDEN
      })
    }
    socket.handshake.auth.decode_authorization = decode_authorization
    socket.handshake.auth.access_token = access_token
    next()
  } catch (error) {
    next({
      message: 'Unauthorized',
      name: 'Unauthorized Error',
      data: error
    })
  }
})

io.on('connection', (socket) => {
  console.log(`User ${socket.id} is connected`)
  const { user_id } = socket.handshake.auth.decode_authorization as TokenPayLoad
  if (user_id) {
    users[user_id] = {
      socket_id: socket.id
    }
  }

  // Middleware the socket instance
  socket.use(async (packet, next) => {
    const { access_token } = socket.handshake.auth
    try {
      await verifyAccessToken(access_token)
      next()
    } catch (error) {
      next(new Error('Unauthorized'))
    }
  })

  socket.on('error', (error) => {
    if (error.message === 'Unauthorized') {
      socket.disconnect()
    }
  })

  socket.on('sender_message', async (data) => {
    const { receiver_id, sender_id, content } = data.payload
    const receiverSocketId = users[receiver_id]?.socket_id
    const conversation = new Conversation({
      sender_id: new ObjectId(sender_id),
      receiver_id: new ObjectId(receiver_id),
      content: content
    })
    const resultConsersation = await databaseService.conversations.insertOne(conversation)
    conversation._id = resultConsersation.insertedId
    if (receiverSocketId) {
      socket.to(receiverSocketId).emit('receiver_message', {
        payload: conversation
      })
    }
  })
  socket.on('disconnect', () => {
    delete users[user_id]
    console.log(`User ${socket.id} is disconnected`)
  })
})

httpServer.listen(process.env.APP_PORT, () => {
  console.log(`Server starting with: ${process.env.APP_URL}:${process.env.APP_PORT}`)
})
