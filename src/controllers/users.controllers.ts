import { NextFunction, Request, Response } from 'express'
import { ParamsDictionary } from 'express-serve-static-core'
import userService from '~/services/users.services'
import {
  VerifyEmailTokenReqBody,
  LoginReqBody,
  LogoutReqBody,
  RegisterReqBody,
  TokenPayLoad,
  ForgotPasswordReqBody,
  VerifyForgotPasswordReqBody,
  ResetPasswordReqBody,
  UpdateMeReqBody,
  GetProfileReqParams,
  FollowReqBody,
  RefreshTokenReqBody,
  UnFollowReqParams,
  ChangePasswordReqBody
} from '~/models/requests/User.requests'
import { USER_MESSAGE } from '~/constants/messages'
import { ObjectId } from 'mongodb'
import { User } from '~/models/schemas/Users.schemas'
import 'dotenv/config'

export const registerController = async (req: Request<ParamsDictionary, any, RegisterReqBody>, res: Response) => {
  const response = await userService.register(req.body)
  res.json({
    message: USER_MESSAGE.REGISTER_SUCCESS,
    data: response
  })
  return
}

export const loginController = async (req: Request<ParamsDictionary, any, LoginReqBody>, res: Response) => {
  const user = req.user as User
  const verify = user.verify
  const user_id = user._id as ObjectId
  const response = await userService.login({ user_id: user_id.toString(), verify })
  res.json({
    message: USER_MESSAGE.LOGIN_SUCCESS,
    data: response
  })
  return
}

export const oauthLoginController = async (req: Request, res: Response) => {
  const { code } = req.query
  const response = await userService.oauth(code as string)
  const urlRediect = `${process.env.CLIENT_REDIRECT_CALLBACK}?access_token=${response.access_token}&refresh_token=${response.refresh_token}&newUser=${response.newUser}`
  res.redirect(urlRediect)
  return
}

export const logoutController = async (req: Request<ParamsDictionary, any, LogoutReqBody>, res: Response) => {
  const { refresh_token } = req.body
  const response = await userService.logout(refresh_token)
  res.json(response)
  return
}

export const verifyEmailController = async (
  req: Request<ParamsDictionary, any, VerifyEmailTokenReqBody>,
  res: Response
) => {
  const { user_id } = req.decode_email_verify_token as TokenPayLoad
  const response = await userService.verifyEmail(user_id)
  res.json(response)
  return
}

export const resendVerifyEmailController = async (req: Request, res: Response) => {
  const { user_id } = req.decode_authorization as TokenPayLoad
  const user = req.user
  const response = await userService.resendVerifyEmail(user_id, (user as User).email)
  res.json(response)
  return
}

export const forgotPasswordController = async (
  req: Request<ParamsDictionary, any, ForgotPasswordReqBody>,
  res: Response
) => {
  const { _id, verify, email } = req.user as User
  const response = await userService.forgotPassword({ user_id: (_id as ObjectId).toString(), verify, email })
  res.json(response)
  return
}

export const verifyForgotPasswordController = async (
  req: Request<ParamsDictionary, any, VerifyForgotPasswordReqBody>,
  res: Response
) => {
  res.json({
    message: USER_MESSAGE.VERIFY_FORGOT_PASSWORD_SUCCESS
  })
  return
}

export const resetPasswordController = async (
  req: Request<ParamsDictionary, any, ResetPasswordReqBody>,
  res: Response,
  next: NextFunction
) => {
  const { user_id } = req.decode_forgot_password_token as TokenPayLoad
  const { password } = req.body
  const response = await userService.resetPassword({ user_id, password })
  res.json(response)
  return
}

export const getMeController = async (req: Request, res: Response, next: NextFunction) => {
  const { user_id } = req.decode_authorization as TokenPayLoad
  const response = await userService.getMe(user_id)
  res.json(response)
  return
}

export const updateMeController = async (
  req: Request<ParamsDictionary, any, UpdateMeReqBody>,
  res: Response,
  next: NextFunction
) => {
  const { user_id } = req.decode_authorization as TokenPayLoad
  const payload = req.body
  const response = await userService.updateMe({ user_id, payload })
  res.json(response)
  return
}

export const getProfileController = async (req: Request<GetProfileReqParams>, res: Response, next: NextFunction) => {
  const { username } = req.params
  const response = await userService.getProfile(username)
  res.json(response)
  return
}

export const followController = async (
  req: Request<ParamsDictionary, any, FollowReqBody>,
  res: Response,
  next: NextFunction
) => {
  const { user_id } = req.decode_authorization as TokenPayLoad
  const { followed_user_id } = req.body
  const response = await userService.follow({ user_id, followed_user_id })
  res.json(response)
  return
}

export const unfollowController = async (req: Request<UnFollowReqParams>, res: Response) => {
  const { user_id } = req.decode_authorization as TokenPayLoad
  const { user_id: followed_user_id } = req.params
  const response = await userService.unfollow({ user_id, followed_user_id })
  res.json(response)
  return
}

export const refreshTokenController = async (
  req: Request<ParamsDictionary, any, RefreshTokenReqBody>,
  res: Response,
  next: NextFunction
) => {
  const { user_id, verify, exp } = req.decode_refresh_token as TokenPayLoad
  const { refresh_token } = req.body
  const response = await userService.refreshToken({ user_id, verify, refresh_token, exp })
  res.json(response)
  return
}

export const changePasswordController = async (
  req: Request<ParamsDictionary, any, ChangePasswordReqBody>,
  res: Response,
  next: NextFunction
) => {
  const { user_id } = req.decode_authorization as TokenPayLoad
  const { password } = req.body
  const response = await userService.changePassword({ user_id, password })
  res.json(response)
  return
}
