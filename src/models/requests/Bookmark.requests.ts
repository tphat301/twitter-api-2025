import { ParamsDictionary } from 'express-serve-static-core'
export interface BookmarkTweetReqBody {
  tweet_id: string
}

export interface BookmarkTweetReqParams extends ParamsDictionary {
  tweet_id: string
}
