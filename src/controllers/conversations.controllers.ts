import { Request, Response, NextFunction } from 'express'
import { ConversationReqParams } from '~/models/requests/Conversation.requests'
import { Pagination } from '~/models/requests/Tweet.requests'
import conversationsService from '~/services/conversations.services'

export const getConversationsController = async (
  req: Request<ConversationReqParams, any, any, Pagination>,
  res: Response,
  next: NextFunction
) => {
  const page = Number(req.query.page)
  const limit = Number(req.query.limit)
  const { receiver_id } = req.params
  const sender_id = req.decode_authorization?.user_id as string
  const { conversations, total } = await conversationsService.getConversations({ sender_id, receiver_id, limit, page })

  res.json({
    message: 'Get conversations success',
    data: {
      data: conversations,
      limit,
      page,
      total_page: Math.ceil(total / limit)
    }
  })
}
