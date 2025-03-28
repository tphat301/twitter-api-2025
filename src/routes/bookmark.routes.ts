import { Router } from 'express'
import { PATH } from '~/constants/path'
import { bookmarkTweetController, unbookmarkTweetController } from '~/controllers/bookmarks.controllers'
import { tweetIdValidator } from '~/middlewares/tweets.middlewares'
import { accessTokenValidator, verifiedUserValidator } from '~/middlewares/users.middlewares'
import { wrapRequestHandler } from '~/utils/handlers'

const bookmarksRouter = Router()

/**
 * Description route: Bookmark Tweet
 * Path: /
 * Method: POST
 * Request header: { Authorization: Bearer <access_token> }
 * Request body: { tweet_id: string }
 * */
bookmarksRouter.post(
  '/',
  accessTokenValidator,
  verifiedUserValidator,
  tweetIdValidator,
  wrapRequestHandler(bookmarkTweetController)
)

/**
 * Description route: Unbookmark Tweet
 * Path: /:tweet_id
 * Method: Delete
 * Request header: { Authorization: Bearer <access_token> }
 * Request params: { tweet_id: string }
 * */
bookmarksRouter.delete(
  PATH.UNBOOKMARK,
  accessTokenValidator,
  verifiedUserValidator,
  tweetIdValidator,
  wrapRequestHandler(unbookmarkTweetController)
)

export default bookmarksRouter
