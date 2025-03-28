export const USER_MESSAGE = {
  NAME_IS_REQUIRED: 'Name is required',
  NAME_MUST_BE_FROM_6_TO_100: 'Name must be from 6 to 100',
  CONFIRM_PASSWORD_NOT_MATCH: 'Confirm password not match',
  EMAIL_IS_REQUIRED: 'Email is required',
  EMAIL_NOT_FOUND: 'Email not found',
  EMAIL_INVALID: 'Email invalid',
  EMAIL_MUST_BE_FROM_6_TO_100: 'Email must be from 6 to 100',
  EMAIL_ALREADY_EXISTS: 'Email already exists',
  PASSWORD_IS_REQUIRED: 'Password is required',
  PASSWORD_MUST_BE_FROM_6_TO_100: 'Password must be from 6 to 50',
  PASSWORD_IS_NOT_STRONG: 'Password is not strong',
  DATE_OF_BIRTH_ISO8601: 'Date of birth must be ISO8601',
  EMAIL_OR_PASSWORD_INCORRECT: 'Email or password is incorrect',
  REGISTER_SUCCESS: 'Register success',
  LOGIN_SUCCESS: 'Login success',
  ACCESS_TOKEN_IS_REQUIRED: 'Access token is required',
  REFRESH_TOKEN_IS_REQUIRED: 'Refresh token is required',
  REFRESH_TOKEN_IS_NOT_EXISTS: 'Refresh token is not exists',
  LOGOUT_SUCCESS: 'Logout success',
  EMAIL_VERIFY_TOKEN_IS_REQUIRED: 'Email verify token is required',
  EMAIL_VERIFY_TOKEN_NOT_FOUND: 'Email verify token not found',
  EMAIL_IS_VERIFIED: 'Email is verified',
  EMAIL_VERIFY_SUCCESS: 'Email verify success',
  USER_NOT_FOUND: 'User not found',
  USER_IS_VERIFIED: 'User is verified',
  RESEND_VERIFY_EMAIL_SUCCESS: 'Resend verify email success',
  CHECK_EMAIL_TO_RESET_PASSWORD: 'Check email to reset password',
  FORGOT_PASSWORD_IS_REQUIRED: 'Forgot password token is required',
  FORGOT_PASSWORD_TOKEN_INVALID: 'Forgot password token invalid',
  VERIFY_FORGOT_PASSWORD_SUCCESS: 'Verify forgot password success',
  RESET_PASSWORD_SUCCESS: 'Reset password success',
  EMAIL_VERIFY_TOKEN_INVALID: 'Email verify token invalid',
  GET_ME_SUCCESS: 'Get me success',
  VERIFY_USER_INVALID: 'Verify user invalid',
  BIO_MUST_BE_A_STRING: 'Bio must be a string',
  USERNAME_LENGTH: 'Username length must be from 1 to 50',
  LOCATION_MUST_BE_STRING: 'Location must be string',
  WEBSITE_MUST_BE_STRING: 'Website must be string',
  USERNAME_MUST_BE_STRING: 'Username must be string',
  IMAGE_URL_MUST_BE_STRING: 'Image url must be string',
  IMAGE_URL_LENGTH: 'Image length from 1 to 200',
  UPDATE_ME_SUCCESS: 'Update me success',
  GET_PROFILE_SUCCESS: 'Get profile success',
  USER_FOLLOWERED_SUCCESS: 'User followered success',
  USERNAME_INVALID: 'Username invalid',
  USERNAME_EXISTED: 'Username existed',
  USER_ID_INVALID: 'User id invalid',
  USER_IS_FOLLOWERED: 'User is followered',
  REFRESH_TOKEN_SUCCESS: 'Refresh token success',
  ALREADY_UNFOLLOWED: 'Already unfollowed',
  UNFOLLOW_SUCCESS: 'Unfollow success',
  OLD_PASSWORD_NOT_MATCH: 'Old password not match',
  CHANGE_PASSWORD_SUCCESS: 'Change password success',
  GMAIL_NOT_VERIFY: 'Gmail not verify',
  UPLOAD_SUCCESS: 'Upload success',
  GET_VIDEO_STATUS_SUCCESS: 'Get video status success'
} as const

export const TWEET_MESSAGE = {
  INVALID_TYPE: 'Invalid type',
  INVALID_AUDIENCE: 'Invalid audience',
  PARENT_ID_MUST_BE_A_VALID_TWEET_ID: 'Parent id must be a valid tweet id',
  PARENT_ID_MUST_BE_NULL: 'Parent id must be null',
  CONTENT_MUST_BE_A_NON_EMPTY_STRING: 'Content must be a non empty string',
  CONTENT_MUST_BE_A_EMPTY_STRING: 'Content must be a empty string',
  HASHTAGS_MUST_BE_ARRAY_STRING: 'Hashtags must be array string',
  MENTIONS_MUST_BE_ARRAY_USER_ID: 'Mentions must be array user_id',
  MEDIA_MUST_BE_ARRAY_OF_OBJECT_MEDIA: 'Media must be array of object media',
  CREATE_TWEET_SUCCESS: 'Create tweet success',
  INVALID_TWEET_ID: 'Invalid tweet id',
  TWEET_NOT_FOUND: 'Tweet not found',
  TWEET_IS_NOT_PUBLIC: 'Tweet is not public',
  GET_TWEET_DETAIL_SUCCESS: 'Get tweet detail success',
  TWEET_TYPE_INVALID: 'Tweet type invalid',
  GET_NEW_FEED_SUCCESS: 'Get new feed success',
  GET_TWEETS_SUCCESS: 'Get tweets success'
} as const

export const BOOKMARK_MESSAGE = {
  BOOKMARK_TWEET_SUCCESS: 'Bookmark tweet success',
  UNBOOKMARK_TWEET_SUCCESS: 'Unbookmark tweet success'
} as const

export const LIKE_MESSAGE = {
  LIKE_TWEET_SUCCESS: 'Like tweet success',
  UNLIKE_TWEET_SUCCESS: 'Unlike tweet success'
} as const

export const SEARCH_MESSAGE = {
  CONTENT_MUST_BE_STRING: 'Content must be string',
  PEOPLE_FOLLOW_MUST_BE_0_OR_1: 'People follow must be 0 or 1'
} as const
