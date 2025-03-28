import { checkSchema, ParamSchema } from 'express-validator'
import { JsonWebTokenError } from 'jsonwebtoken'
import { capitalize } from 'lodash'
import HTTP_STATUS_CODE from '~/constants/httpStatusCode'
import { USER_MESSAGE } from '~/constants/messages'
import { ErrorsWithStatus } from '~/models/Errors'
import { NextFunction, Request, Response } from 'express'
import databaseService from '~/services/database.services'
import userService from '~/services/users.services'
import { hashPassword } from '~/utils/crypto'
import { verifyToken } from '~/utils/jwt'
import { validate } from '~/utils/validation'
import { ObjectId } from 'mongodb'
import { TokenPayLoad } from '~/models/requests/User.requests'
import { UserVerifyStatus } from '~/constants/enums'
import { REGEX_USERNAME } from '~/constants/regex'

/* Schema Rule */
const emailSchema: ParamSchema = {
  notEmpty: {
    errorMessage: USER_MESSAGE.EMAIL_IS_REQUIRED
  },
  isEmail: {
    errorMessage: USER_MESSAGE.EMAIL_INVALID
  },
  trim: true,
  isLength: {
    options: {
      min: 6,
      max: 100
    },
    errorMessage: USER_MESSAGE.EMAIL_MUST_BE_FROM_6_TO_100
  }
}

const passwordSchema: ParamSchema = {
  notEmpty: {
    errorMessage: USER_MESSAGE.PASSWORD_IS_REQUIRED
  },
  trim: true,
  isLength: {
    options: {
      min: 6,
      max: 50
    },
    errorMessage: USER_MESSAGE.PASSWORD_MUST_BE_FROM_6_TO_100
  },
  isStrongPassword: {
    options: {
      minLength: 6,
      minLowercase: 1,
      minUppercase: 1,
      minNumbers: 1,
      minSymbols: 1
    },
    errorMessage: USER_MESSAGE.PASSWORD_IS_NOT_STRONG
  }
}

const nameSchema: ParamSchema = {
  notEmpty: {
    errorMessage: USER_MESSAGE.NAME_IS_REQUIRED
  },
  trim: true,
  isLength: {
    options: {
      min: 6,
      max: 100
    },
    errorMessage: USER_MESSAGE.NAME_MUST_BE_FROM_6_TO_100
  }
}

const dateOfBirthSchema: ParamSchema = {
  isISO8601: {
    options: {
      strict: true,
      strictSeparator: true
    },
    errorMessage: USER_MESSAGE.DATE_OF_BIRTH_ISO8601
  }
}

const otherInfoUserStrSchema: ParamSchema = {
  trim: true,
  optional: true,
  isLength: {
    options: {
      min: 1,
      max: 50
    },
    errorMessage: USER_MESSAGE.USERNAME_LENGTH
  }
}

const imageSchema: ParamSchema = {
  isString: {
    errorMessage: USER_MESSAGE.IMAGE_URL_MUST_BE_STRING
  },
  trim: true,
  optional: true,
  isLength: {
    options: {
      min: 1,
      max: 200
    },
    errorMessage: USER_MESSAGE.IMAGE_URL_LENGTH
  }
}

const userIdSchema: ParamSchema = {
  custom: {
    options: async (value: string, { req }) => {
      if (!ObjectId.isValid(value)) {
        throw new ErrorsWithStatus({
          message: USER_MESSAGE.USER_ID_INVALID,
          status: HTTP_STATUS_CODE.BAD_REQUEST
        })
      }
      const followed_user = await databaseService.users.findOne({
        _id: new ObjectId(value)
      })
      if (followed_user === null) {
        throw new ErrorsWithStatus({
          message: USER_MESSAGE.USER_NOT_FOUND,
          status: HTTP_STATUS_CODE.NOT_FOUND
        })
      }
      return true
    }
  }
}

const forgotPasswordTokenSchema: ParamSchema = {
  trim: true,
  custom: {
    options: async (value, { req }) => {
      if (!value) {
        throw new ErrorsWithStatus({
          message: USER_MESSAGE.FORGOT_PASSWORD_IS_REQUIRED,
          status: HTTP_STATUS_CODE.UNAUTHORIZED
        })
      }
      try {
        const decode_forgot_password_token = await verifyToken({
          token: value,
          secretOrPublicKey: process.env.FORGOT_PASSWORD_TOKEN_SECRET as string
        })
        const { user_id } = decode_forgot_password_token
        const user = await databaseService.users.findOne({ _id: new ObjectId(user_id) })
        if (user === null) {
          throw new ErrorsWithStatus({
            message: USER_MESSAGE.USER_NOT_FOUND,
            status: HTTP_STATUS_CODE.UNAUTHORIZED
          })
        }
        if (user.forgot_password_token !== value) {
          throw new ErrorsWithStatus({
            message: USER_MESSAGE.FORGOT_PASSWORD_TOKEN_INVALID,
            status: HTTP_STATUS_CODE.UNAUTHORIZED
          })
        }
        ;(req as Request).decode_forgot_password_token = decode_forgot_password_token
      } catch (error) {
        if (error instanceof JsonWebTokenError) {
          throw new ErrorsWithStatus({
            message: capitalize(error.message),
            status: HTTP_STATUS_CODE.UNAUTHORIZED
          })
        }
        throw error
      }
      return true
    }
  }
}

export const registerValidator = validate(
  checkSchema(
    {
      email: {
        ...emailSchema,
        custom: {
          options: async (value) => {
            const result = await userService.checkEmailExist(value)
            if (result) {
              throw new ErrorsWithStatus({
                message: USER_MESSAGE.EMAIL_ALREADY_EXISTS,
                status: HTTP_STATUS_CODE.CONFLICT
              })
            }
            return true
          }
        }
      },
      password: passwordSchema,
      confirm_password: {
        ...passwordSchema,
        custom: {
          options: (value, { req }) => {
            if (value !== req.body.password) {
              throw new Error(USER_MESSAGE.CONFIRM_PASSWORD_NOT_MATCH)
            }
            return true
          }
        }
      },
      name: nameSchema,
      date_of_birth: dateOfBirthSchema
    },
    ['body']
  )
)

export const loginValidator = validate(
  checkSchema(
    {
      email: {
        ...emailSchema,
        custom: {
          options: async (value, { req }) => {
            const user = await databaseService.users.findOne({
              email: value,
              password: hashPassword(req.body.password)
            })
            if (user === null) {
              throw new Error(USER_MESSAGE.EMAIL_OR_PASSWORD_INCORRECT)
            }
            req.user = user
            return true
          }
        }
      },
      password: passwordSchema
    },
    ['body']
  )
)

export const accessTokenValidator = validate(
  checkSchema(
    {
      Authorization: {
        trim: true,
        custom: {
          options: async (value: string, { req }) => {
            try {
              const access_token = (value || '').split(' ')[1]
              if (!access_token) {
                throw new ErrorsWithStatus({
                  message: USER_MESSAGE.ACCESS_TOKEN_IS_REQUIRED,
                  status: HTTP_STATUS_CODE.UNAUTHORIZED
                })
              }
              const decode_authorization = await verifyToken({
                token: access_token,
                secretOrPublicKey: process.env.ACCESS_TOKEN_SECRET as string
              })
              ;(req as Request).decode_authorization = decode_authorization
            } catch (error) {
              if (error instanceof JsonWebTokenError) {
                throw new ErrorsWithStatus({
                  message: capitalize(error.message),
                  status: HTTP_STATUS_CODE.UNAUTHORIZED
                })
              }
              throw error
            }
            return true
          }
        }
      }
    },
    ['headers']
  )
)

export const refreshTokenValidator = validate(
  checkSchema(
    {
      refresh_token: {
        trim: true,
        custom: {
          options: async (value: string, { req }) => {
            if (!value) {
              throw new ErrorsWithStatus({
                message: USER_MESSAGE.REFRESH_TOKEN_IS_REQUIRED,
                status: HTTP_STATUS_CODE.UNAUTHORIZED
              })
            }
            try {
              const [decode_refresh_token, refresh_token] = await Promise.all([
                verifyToken({ token: value, secretOrPublicKey: process.env.REFRESH_TOKEN_SECRET as string }),
                databaseService.refreshTokens.findOne({ token: value })
              ])
              if (refresh_token === null) {
                throw new ErrorsWithStatus({
                  message: USER_MESSAGE.REFRESH_TOKEN_IS_NOT_EXISTS,
                  status: HTTP_STATUS_CODE.UNAUTHORIZED
                })
              }
              ;(req as Request).decode_refresh_token = decode_refresh_token
            } catch (error) {
              if (error instanceof JsonWebTokenError) {
                throw new ErrorsWithStatus({
                  message: capitalize(error.message),
                  status: HTTP_STATUS_CODE.UNAUTHORIZED
                })
              }
              throw error
            }
            return true
          }
        }
      }
    },
    ['body']
  )
)

export const verifyEmailTokenValidator = validate(
  checkSchema(
    {
      email_verify_token: {
        trim: true,
        custom: {
          options: async (value: string, { req }) => {
            if (!value) {
              throw new ErrorsWithStatus({
                message: USER_MESSAGE.EMAIL_VERIFY_TOKEN_IS_REQUIRED,
                status: HTTP_STATUS_CODE.UNAUTHORIZED
              })
            }
            try {
              const decode_email_verify_token = await verifyToken({
                token: value,
                secretOrPublicKey: process.env.EMAIL_VERIFY_TOKEN_SECRET as string
              })
              const { user_id } = decode_email_verify_token
              const user = await databaseService.users.findOne({ _id: new ObjectId(user_id) })
              if (user === null) {
                throw new ErrorsWithStatus({
                  message: USER_MESSAGE.USER_NOT_FOUND,
                  status: HTTP_STATUS_CODE.UNAUTHORIZED
                })
              }
              if (user.email_verify_token !== value) {
                throw new ErrorsWithStatus({
                  message: USER_MESSAGE.EMAIL_VERIFY_TOKEN_INVALID,
                  status: HTTP_STATUS_CODE.UNAUTHORIZED
                })
              }
              if (user.email_verify_token === '') {
                throw new ErrorsWithStatus({
                  message: USER_MESSAGE.EMAIL_IS_VERIFIED,
                  status: HTTP_STATUS_CODE.UNAUTHORIZED
                })
              }
              ;(req as Request).decode_email_verify_token = decode_email_verify_token
            } catch (error) {
              throw new ErrorsWithStatus({
                message: capitalize((error as JsonWebTokenError).message),
                status: HTTP_STATUS_CODE.UNAUTHORIZED
              })
            }
            return true
          }
        }
      }
    },
    ['body']
  )
)

export const forgotPasswordValidator = validate(
  checkSchema(
    {
      email: {
        ...emailSchema,
        custom: {
          options: async (value, { req }) => {
            const user = await databaseService.users.findOne({
              email: value
            })
            if (user === null) {
              throw new Error(USER_MESSAGE.USER_NOT_FOUND)
            }
            req.user = user
            return true
          }
        }
      }
    },
    ['body']
  )
)

export const verifyForgotPasswordValidator = validate(
  checkSchema(
    {
      forgot_password_token: forgotPasswordTokenSchema
    },
    ['body']
  )
)

export const resetPasswordValidator = validate(
  checkSchema(
    {
      forgot_password_token: forgotPasswordTokenSchema,
      password: passwordSchema,
      confirm_password: {
        ...passwordSchema,
        custom: {
          options: (value, { req }) => {
            if (value !== req.body.password) {
              throw new Error(USER_MESSAGE.CONFIRM_PASSWORD_NOT_MATCH)
            }
            return true
          }
        }
      }
    },
    ['body']
  )
)

export const resendVerifyEmailValidator = async (req: Request, res: Response, next: NextFunction) => {
  const { user_id } = req.decode_authorization as TokenPayLoad
  const user = await databaseService.users.findOne({ _id: new ObjectId(user_id) })
  if (!user) {
    return next(
      new ErrorsWithStatus({
        message: USER_MESSAGE.USER_NOT_FOUND,
        status: HTTP_STATUS_CODE.NOT_FOUND
      })
    )
  }
  if (user.verify === UserVerifyStatus.Verified) {
    return next(
      new ErrorsWithStatus({
        message: USER_MESSAGE.USER_IS_VERIFIED,
        status: HTTP_STATUS_CODE.OK
      })
    )
  }
  ;(req as Request).user = user
  next()
}

export const verifiedUserValidator = (req: Request, res: Response, next: NextFunction) => {
  const { verify } = req.decode_authorization as TokenPayLoad
  if (verify !== UserVerifyStatus.Verified) {
    return next(
      new ErrorsWithStatus({
        message: USER_MESSAGE.VERIFY_USER_INVALID,
        status: HTTP_STATUS_CODE.FORBIDDEN
      })
    )
  }
  next()
}

export const updateMeValidator = validate(
  checkSchema(
    {
      name: {
        ...nameSchema,
        optional: true,
        notEmpty: undefined
      },
      date_of_birth: {
        ...dateOfBirthSchema,
        optional: true
      },
      bio: {
        isString: {
          errorMessage: USER_MESSAGE.BIO_MUST_BE_A_STRING
        },
        ...otherInfoUserStrSchema
      },
      location: {
        isString: {
          errorMessage: USER_MESSAGE.LOCATION_MUST_BE_STRING
        },
        ...otherInfoUserStrSchema
      },
      username: {
        optional: true,
        isString: {
          errorMessage: USER_MESSAGE.USERNAME_MUST_BE_STRING
        },
        trim: true,
        custom: {
          options: async (value: string, { req }) => {
            if (!REGEX_USERNAME.test(value)) {
              throw Error(USER_MESSAGE.USERNAME_INVALID)
            }
            const user = await databaseService.users.findOne({
              username: value
            })
            if (user) {
              throw new ErrorsWithStatus({
                message: USER_MESSAGE.USERNAME_EXISTED,
                status: HTTP_STATUS_CODE.CONFLICT
              })
            }
          }
        }
      },
      website: {
        isString: {
          errorMessage: USER_MESSAGE.WEBSITE_MUST_BE_STRING
        },
        ...otherInfoUserStrSchema
      },
      avatar: imageSchema,
      cover_photo: imageSchema
    },
    ['body']
  )
)

export const followValidator = validate(
  checkSchema(
    {
      followed_user_id: userIdSchema
    },
    ['body']
  )
)

export const unfollowValidator = validate(
  checkSchema(
    {
      user_id: userIdSchema
    },
    ['params']
  )
)

export const changePasswordValidator = validate(
  checkSchema(
    {
      old_password: {
        ...passwordSchema,
        custom: {
          options: async (value: string, { req }) => {
            const { user_id } = (req as Request).decode_authorization as TokenPayLoad
            const user = await databaseService.users.findOne({
              _id: new ObjectId(user_id)
            })
            if (user === null) {
              throw new ErrorsWithStatus({
                message: USER_MESSAGE.USER_NOT_FOUND,
                status: HTTP_STATUS_CODE.NOT_FOUND
              })
            }
            const { password } = user
            if (hashPassword(value) !== password) {
              throw new Error(USER_MESSAGE.OLD_PASSWORD_NOT_MATCH)
            }
          }
        }
      },
      password: passwordSchema,
      confirm_password: {
        ...passwordSchema,
        custom: {
          options: (value, { req }) => {
            if (value !== req.body.password) {
              throw new Error(USER_MESSAGE.CONFIRM_PASSWORD_NOT_MATCH)
            }
            return true
          }
        }
      }
    },
    ['body']
  )
)

export const isUserLoggedInValidator = (middleware: (req: Request, res: Response, next: NextFunction) => void) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (req.params.authorization) {
      middleware(req, res, next)
      return
    }
    next()
  }
}
