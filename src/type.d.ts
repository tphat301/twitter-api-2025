import { Request } from 'express'
import { User } from './models/schemas/Users.schemas'
import { TokenPayLoad } from './models/requests/User.requests'
import { Tweet } from '~/models/schemas/Tweet.schemas'

declare module 'express' {
  interface Request {
    user?: User
    decode_authorization?: TokenPayLoad
    decode_refresh_token?: TokenPayLoad
    decode_email_verify_token?: TokenPayLoad
    decode_forgot_password_token?: TokenPayLoad
    tweet?: Tweet
  }
}
