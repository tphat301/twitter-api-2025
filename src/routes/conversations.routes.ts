import { Router } from 'express'
import { PATH } from '~/constants/path'
import { getConversationsController } from '~/controllers/conversations.controllers'
import { paginationValidator } from '~/middlewares/tweets.middlewares'
import { accessTokenValidator, getConversationValidator, verifiedUserValidator } from '~/middlewares/users.middlewares'
import { wrapRequestHandler } from '~/utils/handlers'

const conversationsRouter = Router()

/**
 * Description route: Get coversation from user
 * Path: /receiver/:receiver_id
 * Method: GET
 * Request header: { Authorization: Bearer <access_token> }
 * Request params: { receiver_id: string }
 * Request query: { page: string, limit:string }
 * */
conversationsRouter.get(
  PATH.CONVERSATIONS_RECEIVER,
  accessTokenValidator,
  verifiedUserValidator,
  paginationValidator,
  getConversationValidator,
  wrapRequestHandler(getConversationsController)
)

export default conversationsRouter
