import { Request, Response, NextFunction } from 'express'
import { ParamsDictionary } from 'express-serve-static-core'
import { BOOKMARK_MESSAGE } from '~/constants/messages'
import { BookmarkTweetReqBody, BookmarkTweetReqParams } from '~/models/requests/Bookmark.requests'
import { TokenPayLoad } from '~/models/requests/User.requests'
import bookmarksService from '~/services/bookmarks.services'

export const bookmarkTweetController = async (
  req: Request<ParamsDictionary, any, BookmarkTweetReqBody>,
  res: Response,
  next: NextFunction
) => {
  const { user_id } = req.decode_authorization as TokenPayLoad
  const { tweet_id } = req.body
  const response = await bookmarksService.bookmarkTweet(user_id, tweet_id)
  res.json({
    message: BOOKMARK_MESSAGE.BOOKMARK_TWEET_SUCCESS,
    data: response
  })
  return
}

export const unbookmarkTweetController = async (
  req: Request<BookmarkTweetReqParams>,
  res: Response,
  next: NextFunction
) => {
  const { user_id } = req.decode_authorization as TokenPayLoad
  const { tweet_id } = req.params
  const response = await bookmarksService.unbookmarkTweet(user_id, tweet_id)
  res.json({
    message: BOOKMARK_MESSAGE.UNBOOKMARK_TWEET_SUCCESS,
    data: response
  })
  return
}
