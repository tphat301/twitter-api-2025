import { Router } from 'express'
import { PATH } from '~/constants/path'
import {
  verifyEmailController,
  loginController,
  logoutController,
  registerController,
  resendVerifyEmailController,
  forgotPasswordController,
  verifyForgotPasswordController,
  resetPasswordController,
  getMeController,
  updateMeController,
  getProfileController,
  followController,
  refreshTokenController,
  unfollowController,
  changePasswordController,
  oauthLoginController
} from '~/controllers/users.controllers'
import { filterMiddleware } from '~/middlewares/common.middlewares'
import {
  accessTokenValidator,
  verifyEmailTokenValidator,
  loginValidator,
  refreshTokenValidator,
  registerValidator,
  forgotPasswordValidator,
  verifyForgotPasswordValidator,
  resetPasswordValidator,
  verifiedUserValidator,
  resendVerifyEmailValidator,
  updateMeValidator,
  followValidator,
  unfollowValidator,
  changePasswordValidator
} from '~/middlewares/users.middlewares'
import { UpdateMeReqBody } from '~/models/requests/User.requests'
import { wrapRequestHandler } from '~/utils/handlers'
const usersRouter = Router()

/**
 * Description route: Register user
 * Path: /register
 * Method: POST
 * Request body: { name:string, email:string, password:string, confirm_password:string, date_of_birth: ISOString }
 * */
usersRouter.post(PATH.REGISTER, registerValidator, wrapRequestHandler(registerController))

/**
 * Description route: Login user
 * Path: /login
 * Method: POST
 * Request body: { email:string, password:string }
 * */
usersRouter.post(PATH.LOGIN, loginValidator, wrapRequestHandler(loginController))

/**
 * Description route: Login user with Google OAuth
 * Path: /oauth/google
 * Method: GET
 * Request query: { code:string }
 * */
usersRouter.get(PATH.GOOGLE_OAUTH, wrapRequestHandler(oauthLoginController))

/**
 * Description route: Refresh token
 * Path: /refresh-token
 * Method: POST
 * Request body: { refresh_token:string }
 * */
usersRouter.post(PATH.REFRESH_TOKEN, refreshTokenValidator, wrapRequestHandler(refreshTokenController))

/**
 * Description route: Logout user
 * Path: /logout
 * Method: POST
 * Request header: { Authorization: Bearer <access_token> }
 * Request body: { refresh_token: string }
 * */
usersRouter.post(PATH.LOGOUT, accessTokenValidator, refreshTokenValidator, wrapRequestHandler(logoutController))

/**
 * Description route: Change password user
 * Path: /change-password
 * Method: PUT
 * Request header: { Authorization: Bearer <access_token> }
 * Request body: { old_password: string, password:string, confirm_password:string }
 * */
usersRouter.put(
  PATH.CHANGE_PASSWORD,
  accessTokenValidator,
  verifiedUserValidator,
  changePasswordValidator,
  wrapRequestHandler(changePasswordController)
)

/**
 * Description route: Verify email when user click on the link in email
 * Path: /verify-email
 * Method: POST
 * Request body: { email_verify_token: string }
 * */
usersRouter.post(PATH.VERIFY_EMAIL, verifyEmailTokenValidator, wrapRequestHandler(verifyEmailController))

/**
 * Description route: Resend email when user has not received email
 * Path: /resend-verify-email
 * Method: POST
 * Request header: { Authorization: Bearer <access_token> }
 * */
usersRouter.post(
  PATH.RESEND_VERIFY_EMAIL,
  accessTokenValidator,
  resendVerifyEmailValidator,
  wrapRequestHandler(resendVerifyEmailController)
)

/**
 * Description route: Submit email to reset password, send email to user
 * Path: /forgot-password
 * Method: POST
 * Request body: { email: string }
 * */
usersRouter.post(PATH.FORGOT_PASSWORD, forgotPasswordValidator, wrapRequestHandler(forgotPasswordController))

/**
 * Description route: Verify link in email to reset password
 * Path: /verify-forgot-password
 * Method: POST
 * Request body: { forgot_password_token: string }
 * */
usersRouter.post(
  PATH.VERIFY_FORGOT_PASSWORD,
  verifyForgotPasswordValidator,
  wrapRequestHandler(verifyForgotPasswordController)
)

/**
 * Description route: Reset password when user subform forgot password
 * Path: /reset-password
 * Method: POST
 * Request body: { forgot_password_token: string, password: string, confirm_password: string }
 * */
usersRouter.post(PATH.RESET_PASSWORD, resetPasswordValidator, wrapRequestHandler(resetPasswordController))

/**
 * Description route: Get profile user account
 * Path: /me
 * Method: GET
 * Request header: { Authorization: Bearer <access_token> }
 * */
usersRouter.get(PATH.ME, accessTokenValidator, wrapRequestHandler(getMeController))

/**
 * Description route: Update profile
 * Path: /me
 * Method: PATCH
 * Request body: { name:string, date_of_birth:string, bio:string, location:string, website:string, username:string, avatar:string, cover_photo:string }
 * */
usersRouter.patch(
  PATH.ME,
  accessTokenValidator,
  verifiedUserValidator,
  updateMeValidator,
  filterMiddleware<UpdateMeReqBody>([
    'avatar',
    'bio',
    'cover_photo',
    'location',
    'date_of_birth',
    'name',
    'username',
    'website'
  ]),
  wrapRequestHandler(updateMeController)
)

/**
 * Description route: Get user profile
 * Path: /:username
 * Method: GET
 * Request params: { username:string }
 * */
usersRouter.get(PATH.PROFILE, accessTokenValidator, verifiedUserValidator, wrapRequestHandler(getProfileController))

/**
 * Description route: Follow someone
 * Path: /follow
 * Method: POST
 * Request header: { Authorization: Bearer <access_token> }
 * Request body: { followed_user_id:string }
 * */
usersRouter.post(
  PATH.FOLLOW,
  accessTokenValidator,
  verifiedUserValidator,
  followValidator,
  wrapRequestHandler(followController)
)

/**
 * Description route: Unfollow someone
 * Path: /follow/:user_id
 * Method: DELETE
 * Request header: { Authorization: Bearer <access_token> }
 * Request params: { user_id:string }
 * */
usersRouter.delete(
  PATH.UNFOLLOW,
  accessTokenValidator,
  verifiedUserValidator,
  unfollowValidator,
  wrapRequestHandler(unfollowController)
)

export default usersRouter
