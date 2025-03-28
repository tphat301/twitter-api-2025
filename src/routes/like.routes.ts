import { Router } from 'express'
import { PATH } from '~/constants/path'
import { likeTweetController, unlikeTweetController } from '~/controllers/likes.controllers'
import { tweetIdValidator } from '~/middlewares/tweets.middlewares'
import { accessTokenValidator, verifiedUserValidator } from '~/middlewares/users.middlewares'
import { wrapRequestHandler } from '~/utils/handlers'

const likesRouter = Router()

/**
 * Description route: Like Tweet
 * Path: /
 * Method: POST
 * Request header: { Authorization: Bearer <access_token> }
 * Request body: { tweet_id: string }
 * */
likesRouter.post(
  '/',
  accessTokenValidator,
  verifiedUserValidator,
  tweetIdValidator,
  wrapRequestHandler(likeTweetController)
)

/**
 * Description route: Unlike Tweet
 * Path: /:tweet_id
 * Method: Delete
 * Request header: { Authorization: Bearer <access_token> }
 * Request params: { tweet_id: string }
 * */
likesRouter.delete(
  PATH.UNLIKE,
  accessTokenValidator,
  verifiedUserValidator,
  tweetIdValidator,
  wrapRequestHandler(unlikeTweetController)
)

export default likesRouter
