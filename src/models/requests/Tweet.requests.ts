import { TweetAudience, TweetType } from '~/constants/enums'
import { ParamsDictionary, Query } from 'express-serve-static-core'
import { Media } from '../Other'
export interface TweetReqBody {
  type: TweetType
  audience: TweetAudience
  content: string
  parent_id: null | string
  hashtags: string[]
  mentions: string[]
  medias: Media[]
}

export interface TweetReqParams extends ParamsDictionary {
  tweet_id: string
}
export interface GetTweetChildrenReqParams extends ParamsDictionary {
  tweet_id: string
}

export interface Pagination {
  page: string
  limit: string
}

export interface GetTweetChildrenReqQuery extends Query, Pagination {
  tweet_type: string
}
