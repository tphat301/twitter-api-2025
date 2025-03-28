import { Router } from 'express'
import { searchController } from '~/controllers/search.controllers'
import { searchValidator } from '~/middlewares/search.middlewares'
import { paginationValidator } from '~/middlewares/tweets.middlewares'
import { accessTokenValidator, verifiedUserValidator } from '~/middlewares/users.middlewares'
import { wrapRequestHandler } from '~/utils/handlers'

const searchRouter = Router()

/**
 * Description route: Search route
 * Path: /
 * Method: GET
 * Request header: { Authorization: Bearer <access_token> }
 * Request query: { content: string, page: string, limit: string, media_type?: MediaTypeQuery, people_follow?: PeopleFollow }
 * */
searchRouter.get(
  '/',
  accessTokenValidator,
  verifiedUserValidator,
  paginationValidator,
  searchValidator,
  wrapRequestHandler(searchController)
)

export default searchRouter
