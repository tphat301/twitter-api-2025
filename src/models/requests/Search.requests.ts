import { Query } from 'express-serve-static-core'
import { MediaTypeQuery, PeopleFollow } from '~/constants/enums'
import { Pagination } from '~/models/requests/Tweet.requests'

export interface SearchReqQuery extends Query, Pagination {
  content: string
  media_type?: MediaTypeQuery
  people_follow?: PeopleFollow
}
