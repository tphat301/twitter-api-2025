import { Request, Response, NextFunction } from 'express'
import { checkSchema } from 'express-validator'
import { isEmpty } from 'lodash'
import { ObjectId } from 'mongodb'
import { MediaType, TweetAudience, TweetType, UserVerifyStatus } from '~/constants/enums'
import HTTP_STATUS_CODE from '~/constants/httpStatusCode'
import { TWEET_MESSAGE, USER_MESSAGE } from '~/constants/messages'
import { ErrorsWithStatus } from '~/models/Errors'
import { Tweet } from '~/models/schemas/Tweet.schemas'
import databaseService from '~/services/database.services'
import { numberEnumToArray } from '~/utils/common'
import { wrapRequestHandler } from '~/utils/handlers'
import { validate } from '~/utils/validation'

const tweetTypes = numberEnumToArray(TweetType)
const tweetAudience = numberEnumToArray(TweetAudience)
const mediaType = numberEnumToArray(MediaType)
export const createTweetValidator = validate(
  checkSchema(
    {
      type: {
        isIn: {
          options: [tweetTypes],
          errorMessage: TWEET_MESSAGE.INVALID_TYPE
        }
      },
      audience: {
        isIn: {
          options: [tweetAudience],
          errorMessage: TWEET_MESSAGE.INVALID_AUDIENCE
        }
      },
      content: {
        isString: true,
        custom: {
          options: (value, { req }) => {
            const type = req.body.type as TweetType
            const hashtags = req.body.hashtags as string[]
            const mentions = req.body.mentions as string[]

            // Nếu type là comment, quotetweet, tweet và không có mentions và không có hashtags thì content phải là string và không được rỗng
            if (
              [TweetType.Comment, TweetType.QuoteTweet, TweetType.Tweet].includes(type) &&
              isEmpty(hashtags) &&
              isEmpty(mentions) &&
              value === ''
            ) {
              throw new Error(TWEET_MESSAGE.CONTENT_MUST_BE_A_NON_EMPTY_STRING)
            }

            // Nếu type là retweet thì content phải là chuỗi rỗng
            if (type === TweetType.Retweet && value !== '') {
              throw new Error(TWEET_MESSAGE.CONTENT_MUST_BE_A_EMPTY_STRING)
            }
            return true
          }
        }
      },
      parent_id: {
        custom: {
          options: (value, { req }) => {
            const type = req.body.type as TweetType
            // Nếu type là Comment hoặc QuoteTweet hoặc Retweet thì parent_id phải là tweet_id
            if (
              [TweetType.Comment, TweetType.QuoteTweet, TweetType.Retweet].includes(type) &&
              !ObjectId.isValid(value)
            ) {
              throw new Error(TWEET_MESSAGE.PARENT_ID_MUST_BE_A_VALID_TWEET_ID)
            }

            // Nếu type là Tweet thì parent_id phải là null
            if (type === TweetType.Tweet && value !== null) {
              throw new Error(TWEET_MESSAGE.PARENT_ID_MUST_BE_NULL)
            }
            return true
          }
        }
      },
      hashtags: {
        isArray: true,
        custom: {
          options: (value, { req }) => {
            // Mỗi phần tử trong array phải là string
            if (!value.every((item: any) => typeof item === 'string')) {
              throw new Error(TWEET_MESSAGE.HASHTAGS_MUST_BE_ARRAY_STRING)
            }
            return true
          }
        }
      },
      mentions: {
        isArray: true,
        custom: {
          options: (value, { req }) => {
            // Mỗi phần tử trong array phải là user_id
            if (!value.every((item: any) => ObjectId.isValid(item))) {
              throw new Error(TWEET_MESSAGE.MENTIONS_MUST_BE_ARRAY_USER_ID)
            }
            return true
          }
        }
      },
      medias: {
        isArray: true,
        custom: {
          options: (value, { req }) => {
            // Mỗi phần tử trong array phải là Media Object
            if (
              !value.every((item: any) => {
                return typeof item.url === 'string' || mediaType.includes(item.type)
              })
            ) {
              throw new Error(TWEET_MESSAGE.MEDIA_MUST_BE_ARRAY_OF_OBJECT_MEDIA)
            }
            return true
          }
        }
      }
    },
    ['body']
  )
)

export const tweetIdValidator = validate(
  checkSchema(
    {
      tweet_id: {
        custom: {
          options: async (value, { req }) => {
            if (!ObjectId.isValid(value)) {
              throw new ErrorsWithStatus({
                message: TWEET_MESSAGE.INVALID_TWEET_ID,
                status: HTTP_STATUS_CODE.BAD_REQUEST
              })
            }
            const [tweet] = await databaseService.tweets
              .aggregate<Tweet>([
                {
                  $match: {
                    _id: new ObjectId(value)
                  }
                },
                {
                  $lookup: {
                    from: 'hashtags',
                    localField: 'hashtags',
                    foreignField: '_id',
                    as: 'hashtags'
                  }
                },
                {
                  $lookup: {
                    from: 'users',
                    localField: 'mentions',
                    foreignField: '_id',
                    as: 'mentions'
                  }
                },
                {
                  $addFields: {
                    mentions: {
                      $map: {
                        input: '$mentions',
                        as: 'mention',
                        in: {
                          _id: '$$mention._id',
                          name: '$$mention.name',
                          username: '$$mention.username',
                          email: '$$mention.email'
                        }
                      }
                    }
                  }
                },
                {
                  $lookup: {
                    from: 'bookmarks',
                    localField: '_id',
                    foreignField: 'tweet_id',
                    as: 'bookmarks'
                  }
                },
                {
                  $lookup: {
                    from: 'likes',
                    localField: '_id',
                    foreignField: 'tweet_id',
                    as: 'likes'
                  }
                },
                {
                  $lookup: {
                    from: 'tweets',
                    localField: '_id',
                    foreignField: 'parent_id',
                    as: 'tweet_children'
                  }
                },
                {
                  $addFields: {
                    bookmarks: {
                      $size: '$bookmarks'
                    },
                    likes: {
                      $size: '$likes'
                    },
                    retweet_count: {
                      $size: {
                        $filter: {
                          input: '$tweet_children',
                          as: 'item',
                          cond: {
                            $eq: ['$$item.type', TweetType.Retweet]
                          }
                        }
                      }
                    },
                    comment_count: {
                      $size: {
                        $filter: {
                          input: '$tweet_children',
                          as: 'item',
                          cond: {
                            $eq: ['$$item.type', TweetType.Comment]
                          }
                        }
                      }
                    },
                    quotetweet_count: {
                      $size: {
                        $filter: {
                          input: '$tweet_children',
                          as: 'item',
                          cond: {
                            $eq: ['$$item.type', TweetType.QuoteTweet]
                          }
                        }
                      }
                    },
                    views: {
                      $add: ['$user_views', '$guest_views']
                    }
                  }
                },
                {
                  $project: {
                    tweet_children: 0
                  }
                }
              ])
              .toArray()
            if (!tweet) {
              throw new ErrorsWithStatus({
                message: TWEET_MESSAGE.TWEET_NOT_FOUND,
                status: HTTP_STATUS_CODE.NOT_FOUND
              })
            }
            ;(req as Request).tweet = tweet
            return true
          }
        }
      }
    },
    ['params', 'body']
  )
)

export const audienceValidator = wrapRequestHandler(async (req: Request, res: Response, next: NextFunction) => {
  const tweet = req.tweet as Tweet
  // Nếu bài tweet này là twitter circle thì sẽ tiến hành kiểm tra các điều kiện phía dưới còn ngược lại thì next()
  if (tweet.audience === TweetAudience.TwitterCircle) {
    // Kiểm tra người đang muốn xem bài tweet này đã đăng nhập hay chưa
    if (!req.decode_authorization) {
      throw new ErrorsWithStatus({
        message: USER_MESSAGE.ACCESS_TOKEN_IS_REQUIRED,
        status: HTTP_STATUS_CODE.FORBIDDEN
      })
    }
    // Kiểm tra trạng thái tài khoản của người đăng bài tweet này như nào (có tồn tại hay bị banned hay không)
    const author = await databaseService.users.findOne({ _id: new ObjectId(tweet.user_id) })
    if (!author || author.verify === UserVerifyStatus.Banned) {
      throw new ErrorsWithStatus({
        message: USER_MESSAGE.USER_NOT_FOUND,
        status: HTTP_STATUS_CODE.NOT_FOUND
      })
    }
    // Kiểm tra người xem tweet này có trong tweet circle của tác giả hay không và người xem tweet này không phải là tác giả
    const { user_id } = req.decode_authorization
    const isInTweetCircle = author.twitter_circle.some((userCircleId) => userCircleId.equals(user_id))
    if (!author._id.equals(user_id) && !isInTweetCircle) {
      throw new ErrorsWithStatus({
        message: TWEET_MESSAGE.TWEET_IS_NOT_PUBLIC,
        status: HTTP_STATUS_CODE.FORBIDDEN
      })
    }
  }
  next()
})

export const getTweetChildrenValidator = validate(
  checkSchema(
    {
      tweet_type: {
        isIn: {
          options: [tweetTypes],
          errorMessage: TWEET_MESSAGE.TWEET_TYPE_INVALID
        }
      }
    },
    ['query']
  )
)

export const paginationValidator = validate(
  checkSchema(
    {
      limit: {
        isNumeric: true,
        custom: {
          options: (value) => {
            const number = Number(value)
            if (number < 1 || number > 100) {
              throw new Error('Limit from 1 to 100')
            }
            return true
          }
        }
      },
      page: {
        isNumeric: true,
        custom: {
          options: (value) => {
            const number = Number(value)
            if (number < 1) {
              throw new Error('Page > 0')
            }
            return true
          }
        }
      }
    },
    ['query']
  )
)
