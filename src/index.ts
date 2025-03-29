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
import conversationsRouter from './routes/conversations.routes'
import initSocket from './utils/socket'
import swaggerUi from 'swagger-ui-express'
import fs from 'fs'
import YAML from 'yaml'
import path from 'path'
// import './utils/fake'

const file = fs.readFileSync(path.resolve('twitter-swagger.yaml'), 'utf8')
const swaggerDocument = YAML.parse(file)

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
app.use(PATH.API_DOCS, swaggerUi.serve, swaggerUi.setup(swaggerDocument))
app.use(defaultErrorHandle)
initSocket(httpServer)
httpServer.listen(process.env.APP_PORT, () => {
  console.log(`Server starting with: ${process.env.APP_URL}:${process.env.APP_PORT}`)
})
