import { Request, Response, NextFunction } from 'express'
import { ParamsDictionary } from 'express-serve-static-core'
import { TWEET_MESSAGE } from '~/constants/messages'
import { SearchReqQuery } from '~/models/requests/Search.requests'
import searchService from '~/services/search.services'

export const searchController = async (
  req: Request<ParamsDictionary, any, any, SearchReqQuery>,
  res: Response,
  next: NextFunction
) => {
  const { content, limit, page, media_type, people_follow } = req.query
  const user_id = req.decode_authorization?.user_id as string
  const { tweets, total } = await searchService.search({ content, limit, page, user_id, media_type, people_follow })
  res.json({
    message: TWEET_MESSAGE.GET_TWEETS_SUCCESS,
    data: {
      data: tweets,
      page,
      limit,
      total_page: Math.ceil(total / Number(limit))
    }
  })
  return
}
