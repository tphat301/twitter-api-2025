import { Request, Response, NextFunction } from 'express'
import { ParamsDictionary } from 'express-serve-static-core'
import { TweetType } from '~/constants/enums'
import { TWEET_MESSAGE } from '~/constants/messages'
import {
  GetTweetChildrenReqParams,
  GetTweetChildrenReqQuery,
  Pagination,
  TweetReqBody,
  TweetReqParams
} from '~/models/requests/Tweet.requests'
import { TokenPayLoad } from '~/models/requests/User.requests'
import tweetsService from '~/services/tweets.services'

export const createTweetController = async (
  req: Request<ParamsDictionary, any, TweetReqBody>,
  res: Response,
  next: NextFunction
) => {
  const { user_id } = req.decode_authorization as TokenPayLoad
  const { body } = req
  const response = await tweetsService.createTweet(user_id, body)
  res.json({
    message: TWEET_MESSAGE.CREATE_TWEET_SUCCESS,
    data: response
  })
  return
}

export const getTweetController = async (req: Request<TweetReqParams>, res: Response, next: NextFunction) => {
  // Tăng view khi user get tweet
  const resultIncView = await tweetsService.increaseView(req.params.tweet_id, req.decode_authorization?.user_id)
  const data = {
    ...req.tweet,
    guest_views: resultIncView.guest_views,
    user_views: resultIncView.user_views,
    updated_at: resultIncView.updated_at
  }
  res.json({
    message: TWEET_MESSAGE.GET_TWEET_DETAIL_SUCCESS,
    data
  })
  return
}

export const getTweetChildrenController = async (
  req: Request<GetTweetChildrenReqParams, any, any, GetTweetChildrenReqQuery>,
  res: Response,
  next: NextFunction
) => {
  const { tweet_type, limit, page } = req.query
  const { tweet_id } = req.params
  const { tweets, total } = await tweetsService.getTweetChildren({
    tweet_id,
    tweet_type: Number(tweet_type) as TweetType,
    limit: Number(limit),
    page: Number(page)
  })
  res.json({
    message: TWEET_MESSAGE.GET_TWEET_DETAIL_SUCCESS,
    data: {
      data: tweets,
      tweet_type,
      limit,
      page,
      total_page: Math.ceil(total / Number(limit))
    }
  })
  return
}

export const getNewFeedsChildrenController = async (
  req: Request<ParamsDictionary, any, any, Pagination>,
  res: Response,
  next: NextFunction
) => {
  const { limit, page } = req.query
  const user_id = req.decode_authorization?.user_id as string
  const { tweets, total } = await tweetsService.getNewFeeds({ user_id, page: Number(page), limit: Number(limit) })
  res.json({
    message: TWEET_MESSAGE.GET_NEW_FEED_SUCCESS,
    data: {
      data: tweets,
      limit,
      page,
      total_page: Math.ceil(total / Number(limit))
    }
  })
  return
}
