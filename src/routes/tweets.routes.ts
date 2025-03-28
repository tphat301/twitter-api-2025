import { Router } from 'express'
import { PATH } from '~/constants/path'
import {
  createTweetController,
  getNewFeedsChildrenController,
  getTweetChildrenController,
  getTweetController
} from '~/controllers/tweets.controllers'
import {
  audienceValidator,
  createTweetValidator,
  getTweetChildrenValidator,
  paginationValidator,
  tweetIdValidator
} from '~/middlewares/tweets.middlewares'
import { accessTokenValidator, isUserLoggedInValidator, verifiedUserValidator } from '~/middlewares/users.middlewares'
import { wrapRequestHandler } from '~/utils/handlers'

const tweetsRouter = Router()

/**
 * Description route: Create tweet
 * Path: /
 * Method: POST
 * Request header: { Authorization: Bearer <access_token> }
 * Request body: { type: TweetType, audience: TweetAudience, content: string, parent_id: null | string, hashtags: string[], mentions: string[], medias: Media[] }
 * */
tweetsRouter.post(
  '/',
  accessTokenValidator,
  verifiedUserValidator,
  createTweetValidator,
  wrapRequestHandler(createTweetController)
)

/**
 * Description route: Get tweet detail
 * Path: /:tweet_id
 * Method: GET
 * Request header: { Authorization?: Bearer <access_token> }
 * Request params: { tweet_id: string }
 * */
tweetsRouter.get(
  PATH.TWEET_DETAIL,
  tweetIdValidator,
  isUserLoggedInValidator(accessTokenValidator),
  isUserLoggedInValidator(verifiedUserValidator),
  audienceValidator,
  wrapRequestHandler(getTweetController)
)

/*
 * Description route: Get tweet children
 * Path: /:tweet_id/children
 * Method: GET
 * Request header: { Authorization?: Bearer <access_token> }
 * Request query: { limit: string, page: string, tweet_type: string }
 */
tweetsRouter.get(
  PATH.TWEET_CHILDREN,
  tweetIdValidator,
  getTweetChildrenValidator,
  paginationValidator,
  isUserLoggedInValidator(accessTokenValidator),
  isUserLoggedInValidator(verifiedUserValidator),
  audienceValidator,
  wrapRequestHandler(getTweetChildrenController)
)

/*
 * Description route: Get new feeds
 * Path: /
 * Method: GET
 * Request header: { Authorization: Bearer <access_token> }
 * Request query: { limit: string, page: string }
 */
tweetsRouter.get(
  '/',
  paginationValidator,
  accessTokenValidator,
  verifiedUserValidator,
  wrapRequestHandler(getNewFeedsChildrenController)
)

export default tweetsRouter
