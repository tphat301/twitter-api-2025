import { Request, Response, NextFunction } from 'express'
import { ParamsDictionary } from 'express-serve-static-core'
import { LIKE_MESSAGE } from '~/constants/messages'
import { LikeTweetReqBody, LikeTweetReqParams } from '~/models/requests/Like.requests'
import { TokenPayLoad } from '~/models/requests/User.requests'
import likesService from '~/services/likes.services'

export const likeTweetController = async (
  req: Request<ParamsDictionary, any, LikeTweetReqBody>,
  res: Response,
  next: NextFunction
) => {
  const { user_id } = req.decode_authorization as TokenPayLoad
  const { tweet_id } = req.body
  const response = await likesService.likeTweet(user_id, tweet_id)
  res.json({
    message: LIKE_MESSAGE.LIKE_TWEET_SUCCESS,
    data: response
  })
  return
}

export const unlikeTweetController = async (req: Request<LikeTweetReqParams>, res: Response, next: NextFunction) => {
  const { user_id } = req.decode_authorization as TokenPayLoad
  const { tweet_id } = req.params
  const response = await likesService.unlikeTweet(user_id, tweet_id)
  res.json({
    message: LIKE_MESSAGE.UNLIKE_TWEET_SUCCESS,
    data: response
  })
  return
}
