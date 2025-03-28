import { TokenType, UserVerifyStatus } from '~/constants/enums'
import { RegisterReqBody, UpdateMeReqBody } from '~/models/requests/User.requests'
import { User } from '~/models/schemas/Users.schemas'
import databaseService from '~/services/database.services'
import { hashPassword } from '~/utils/crypto'
import { signToken, verifyToken } from '~/utils/jwt'
import type { StringValue } from 'ms'
import 'dotenv/config'
import axios from 'axios'
import { ObjectId } from 'mongodb'
import { USER_MESSAGE } from '~/constants/messages'
import { ErrorsWithStatus } from '~/models/Errors'
import HTTP_STATUS_CODE from '~/constants/httpStatusCode'
import RefreshToken from '~/models/schemas/RefreshToken.schemas'
import Follower from '~/models/schemas/Follower.schemas'
import { verifySendMail } from '~/utils/sendmail'

class UserService {
  async checkEmailExist(email: string) {
    const user = await databaseService.users.findOne({ email })
    return Boolean(user)
  }

  private signAccessToken({ user_id, verify }: { user_id: string; verify: UserVerifyStatus }) {
    return signToken({
      payload: {
        user_id,
        token_type: TokenType.AccessToken,
        verify
      },
      privateKey: process.env.ACCESS_TOKEN_SECRET as string,
      options: {
        expiresIn: process.env.ACCESS_TOKEN_EXPIRES_IN as StringValue
      }
    })
  }

  private signRefreshToken({ user_id, verify, exp }: { user_id: string; verify: UserVerifyStatus; exp?: number }) {
    if (exp) {
      return signToken({
        payload: {
          user_id,
          token_type: TokenType.RefreshToken,
          verify,
          exp
        },
        privateKey: process.env.REFRESH_TOKEN_SECRET as string
      })
    }
    return signToken({
      payload: {
        user_id,
        token_type: TokenType.RefreshToken,
        verify
      },
      privateKey: process.env.REFRESH_TOKEN_SECRET as string,
      options: {
        expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN as StringValue
      }
    })
  }

  private signEmailVerifyToken({ user_id, verify }: { user_id: string; verify: UserVerifyStatus }) {
    return signToken({
      payload: {
        user_id,
        token_type: TokenType.EmailVerifyToken,
        verify
      },
      privateKey: process.env.EMAIL_VERIFY_TOKEN_SECRET as string,
      options: {
        expiresIn: process.env.EMAIL_VERIFY_TOKEN_EXPIRES_IN as StringValue
      }
    })
  }

  private signForgotPasswordToken({ user_id, verify }: { user_id: string; verify: UserVerifyStatus }) {
    return signToken({
      payload: {
        user_id,
        token_type: TokenType.ForgotPasswordToken,
        verify
      },
      privateKey: process.env.FORGOT_PASSWORD_TOKEN_SECRET as string,
      options: {
        expiresIn: process.env.FORGOT_PASSWORD_TOKEN_EXPIRES_IN as StringValue
      }
    })
  }

  private decodeRefreshToken(refresh_token: string) {
    return verifyToken({ token: refresh_token, secretOrPublicKey: process.env.REFRESH_TOKEN_SECRET as string })
  }

  private signAccessTokenRefreshToken({ user_id, verify }: { user_id: string; verify: UserVerifyStatus }) {
    return Promise.all([this.signAccessToken({ user_id, verify }), this.signRefreshToken({ user_id, verify })])
  }

  async register(payload: RegisterReqBody) {
    const user_id = new ObjectId()
    const [tokens, email_verify_token] = await Promise.all([
      this.signAccessTokenRefreshToken({ user_id: user_id.toString(), verify: UserVerifyStatus.Unverified }),
      this.signEmailVerifyToken({ user_id: user_id.toString(), verify: UserVerifyStatus.Unverified })
    ])
    const [access_token, refresh_token] = tokens
    const { iat, exp } = await this.decodeRefreshToken(refresh_token)

    await Promise.all([
      databaseService.users.insertOne(
        new User({
          ...payload,
          _id: user_id,
          email_verify_token,
          username: `username${user_id.toString()}`,
          password: hashPassword(payload.password),
          date_of_birth: new Date(payload.date_of_birth)
        })
      ),
      databaseService.refreshTokens.insertOne(
        new RefreshToken({
          user_id,
          token: refresh_token,
          iat,
          exp
        })
      )
    ])
    await verifySendMail({ email: payload.email, subject: `Verify your email`, token: email_verify_token })
    return {
      access_token,
      refresh_token
    }
  }

  private async getOauthGoogleToken(code: string) {
    const body = {
      code,
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      redirect_uri: process.env.GOOGLE_REDIRECT_URI,
      grant_type: 'authorization_code'
    }
    const { data } = await axios.post('https://oauth2.googleapis.com/token', body, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    })
    return data as {
      access_token: string
      id_token: string
    }
  }

  private async getOauthGoogleInfo({ access_token, id_token }: { access_token: string; id_token: string }) {
    const { data } = await axios.get('https://www.googleapis.com/oauth2/v1/userinfo', {
      params: {
        access_token,
        alt: 'json'
      },
      headers: {
        Authorization: `Bearer ${id_token}`
      }
    })

    return data as {
      id: string
      email: string
      verified_email: boolean
      name: string
      given_name: string
      family_name: string
      picture: string
      locale: string
    }
  }

  async oauth(code: string) {
    const { access_token, id_token } = await this.getOauthGoogleToken(code)
    const userInfoFromGoogleOauth = await this.getOauthGoogleInfo({ access_token, id_token })
    if (!userInfoFromGoogleOauth.verified_email) {
      throw new ErrorsWithStatus({
        message: USER_MESSAGE.GMAIL_NOT_VERIFY,
        status: HTTP_STATUS_CODE.FORBIDDEN
      })
    }
    const user = await databaseService.users.findOne({
      email: userInfoFromGoogleOauth.email
    })
    if (user) {
      const [access_token, refresh_token] = await this.signAccessTokenRefreshToken({
        user_id: user._id.toString(),
        verify: userInfoFromGoogleOauth.verified_email ? UserVerifyStatus.Verified : UserVerifyStatus.Unverified
      })
      const { iat, exp } = await this.decodeRefreshToken(refresh_token)
      await databaseService.refreshTokens.insertOne(
        new RefreshToken({
          user_id: user._id,
          token: refresh_token,
          iat,
          exp
        })
      )
      return {
        access_token,
        refresh_token,
        newUser: 0,
        verify: user.verify
      }
    } else {
      const password = Math.random().toString(36).slice(2, 15)
      const data = await this.register({
        email: userInfoFromGoogleOauth.email,
        date_of_birth: new Date().toISOString(),
        name: userInfoFromGoogleOauth.name,
        password,
        confirm_password: password
      })
      return {
        ...data,
        newUser: 1,
        verify: UserVerifyStatus.Unverified
      }
    }
  }

  async login({ user_id, verify }: { user_id: string; verify: UserVerifyStatus }) {
    const [access_token, refresh_token] = await this.signAccessTokenRefreshToken({ user_id, verify })
    const { iat, exp } = await this.decodeRefreshToken(refresh_token)
    await databaseService.refreshTokens.insertOne(
      new RefreshToken({
        user_id: new ObjectId(user_id),
        token: refresh_token,
        iat,
        exp
      })
    )
    return {
      access_token,
      refresh_token
    }
  }

  async logout(refresh_token: string) {
    await databaseService.refreshTokens.deleteOne({
      token: refresh_token
    })
    return {
      message: USER_MESSAGE.LOGOUT_SUCCESS
    }
  }

  async verifyEmail(user_id: string) {
    const [tokens] = await Promise.all([
      this.signAccessTokenRefreshToken({ user_id, verify: UserVerifyStatus.Verified }),
      databaseService.users.updateOne(
        {
          _id: new ObjectId(user_id)
        },
        {
          $set: {
            email_verify_token: '',
            verify: UserVerifyStatus.Verified
          },
          $currentDate: {
            updated_at: true
          }
        }
      )
    ])
    const [access_token, refresh_token] = tokens
    const { iat, exp } = await this.decodeRefreshToken(refresh_token)
    await databaseService.refreshTokens.insertOne(
      new RefreshToken({
        user_id: new ObjectId(user_id),
        token: refresh_token,
        iat,
        exp
      })
    )
    return {
      message: USER_MESSAGE.EMAIL_VERIFY_SUCCESS,
      data: {
        access_token,
        refresh_token
      }
    }
  }

  async resendVerifyEmail(user_id: string, email: string) {
    const email_verify_token = await this.signEmailVerifyToken({ user_id, verify: UserVerifyStatus.Unverified })

    await databaseService.users.updateOne(
      {
        _id: new ObjectId(user_id)
      },
      [
        {
          $set: {
            email_verify_token,
            updated_at: '$$NOW'
          }
        }
      ]
    )
    await verifySendMail({ email, subject: `Resend verify your email`, token: email_verify_token })
    return {
      message: USER_MESSAGE.RESEND_VERIFY_EMAIL_SUCCESS
    }
  }

  async forgotPassword({ user_id, verify, email }: { user_id: string; verify: UserVerifyStatus; email: string }) {
    const forgot_password_token = await this.signForgotPasswordToken({ user_id, verify })
    await databaseService.users.updateOne(
      {
        _id: new ObjectId(user_id)
      },
      {
        $set: {
          forgot_password_token
        },
        $currentDate: {
          updated_at: true
        }
      }
    )
    await verifySendMail({ email, subject: `Forgot password token email`, token: forgot_password_token })
    return {
      message: USER_MESSAGE.CHECK_EMAIL_TO_RESET_PASSWORD
    }
  }

  async resetPassword({ user_id, password }: { user_id: string; password: string }) {
    await databaseService.users.updateOne(
      {
        _id: new ObjectId(user_id)
      },
      [
        {
          $set: {
            forgot_password_token: '',
            password: hashPassword(password),
            updated_at: '$$NOW'
          }
        }
      ]
    )
    return {
      message: USER_MESSAGE.RESET_PASSWORD_SUCCESS
    }
  }

  async getMe(user_id: string) {
    const user = await databaseService.users.findOne(
      { _id: new ObjectId(user_id) },
      {
        projection: {
          email_verify_token: 0,
          forgot_password_token: 0,
          password: 0,
          verify: 0
        }
      }
    )
    return {
      message: USER_MESSAGE.GET_ME_SUCCESS,
      data: user
    }
  }

  async updateMe({ user_id, payload }: { user_id: string; payload: UpdateMeReqBody }) {
    const _paload = payload.date_of_birth ? { ...payload, date_of_birth: new Date(payload.date_of_birth) } : payload
    const data = await databaseService.users.findOneAndUpdate(
      {
        _id: new ObjectId(user_id)
      },
      {
        $set: {
          ...(_paload as UpdateMeReqBody & { date_of_birth?: Date })
        },
        $currentDate: {
          updated_at: true
        }
      },
      {
        projection: {
          password: 0,
          email_verify_token: 0,
          forgot_password_token: 0,
          verify: 0
        },
        returnDocument: 'after'
      }
    )
    return {
      message: USER_MESSAGE.UPDATE_ME_SUCCESS,
      data
    }
  }

  async getProfile(username: string) {
    const user = await databaseService.users.findOne(
      {
        username
      },
      {
        projection: {
          password: 0,
          email_verify_token: 0,
          forgot_password_token: 0,
          verify: 0
        }
      }
    )
    if (user === null) {
      throw new ErrorsWithStatus({
        message: USER_MESSAGE.USER_NOT_FOUND,
        status: HTTP_STATUS_CODE.NOT_FOUND
      })
    }
    return {
      message: USER_MESSAGE.GET_PROFILE_SUCCESS,
      data: user
    }
  }

  async refreshToken({
    user_id,
    verify,
    refresh_token,
    exp
  }: {
    user_id: string
    verify: UserVerifyStatus
    refresh_token: string
    exp: number
  }) {
    const [new_access_token, new_refresh_token] = await Promise.all([
      this.signAccessToken({ user_id, verify }),
      this.signRefreshToken({ user_id, verify, exp }),
      databaseService.refreshTokens.deleteOne({ token: refresh_token })
    ])
    const decode_refresh_token = await this.decodeRefreshToken(new_refresh_token)
    await databaseService.refreshTokens.insertOne(
      new RefreshToken({
        user_id: new ObjectId(user_id),
        token: new_refresh_token,
        iat: decode_refresh_token.iat,
        exp: decode_refresh_token.exp
      })
    )

    return {
      message: USER_MESSAGE.REFRESH_TOKEN_SUCCESS,
      data: {
        new_access_token,
        new_refresh_token
      }
    }
  }

  async follow({ user_id, followed_user_id }: { user_id: string; followed_user_id: string }) {
    const follower = await databaseService.followers.findOne({
      user_id: new ObjectId(user_id),
      followed_user_id: new ObjectId(followed_user_id)
    })
    if (follower !== null) {
      throw new ErrorsWithStatus({
        message: USER_MESSAGE.USER_IS_FOLLOWERED,
        status: HTTP_STATUS_CODE.CONFLICT
      })
    }
    await databaseService.followers.insertOne(
      new Follower({
        user_id: new ObjectId(user_id),
        followed_user_id: new ObjectId(followed_user_id)
      })
    )

    return {
      message: USER_MESSAGE.USER_FOLLOWERED_SUCCESS
    }
  }

  async unfollow({ user_id, followed_user_id }: { user_id: string; followed_user_id: string }) {
    const follow = await databaseService.followers.findOne({
      user_id: new ObjectId(user_id),
      followed_user_id: new ObjectId(followed_user_id)
    })
    console.log(follow)
    if (follow === null) {
      throw new ErrorsWithStatus({
        message: USER_MESSAGE.ALREADY_UNFOLLOWED,
        status: HTTP_STATUS_CODE.CONFLICT
      })
    }
    await databaseService.followers.deleteOne({
      user_id: new ObjectId(user_id),
      followed_user_id: new ObjectId(followed_user_id)
    })
    return {
      message: USER_MESSAGE.UNFOLLOW_SUCCESS
    }
  }

  async changePassword({ user_id, password }: { user_id: string; password: string }) {
    await databaseService.users.updateOne(
      {
        _id: new ObjectId(user_id)
      },
      {
        $set: {
          password: hashPassword(password)
        },
        $currentDate: {
          updated_at: true
        }
      }
    )

    return {
      message: USER_MESSAGE.CHANGE_PASSWORD_SUCCESS
    }
  }
}

const userService = new UserService()
export default userService
