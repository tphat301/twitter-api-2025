import { ParamsDictionary } from 'express-serve-static-core'
export interface LikeTweetReqBody {
  tweet_id: string
}

export interface LikeTweetReqParams extends ParamsDictionary {
  tweet_id: string
}
