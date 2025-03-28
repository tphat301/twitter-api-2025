import { Router } from 'express'
import { PATH } from '~/constants/path'
import {
  uploadImageController,
  uploadMultipleImageController,
  uploadMultipleVideoController,
  uploadVideoController,
  uploadVideoHlsController,
  uploadVideosHlsController,
  videoStatusController
} from '~/controllers/medias.controllers'
import { accessTokenValidator, verifiedUserValidator } from '~/middlewares/users.middlewares'
import { wrapRequestHandler } from '~/utils/handlers'
const mediasRouter = Router()

/**
 * Description route: Upload single image
 * Path: /upload-image
 * Method: POST
 * */
mediasRouter.post(
  PATH.UPLOAD_IMAGE,
  accessTokenValidator,
  verifiedUserValidator,
  wrapRequestHandler(uploadImageController)
)

/**
 * Description route: Upload multiple images
 * Path: /upload-images
 * Method: POST
 * */
mediasRouter.post(
  PATH.UPLOAD_IMAGES,
  accessTokenValidator,
  verifiedUserValidator,
  wrapRequestHandler(uploadMultipleImageController)
)

/**
 * Description route: Upload static video
 * Path: /upload-video
 * Method: POST
 * */
mediasRouter.post(
  PATH.UPLOAD_VIDEO,
  accessTokenValidator,
  verifiedUserValidator,
  wrapRequestHandler(uploadVideoController)
)

/**
 * Description route: Upload multiple video
 * Path: /upload-videos
 * Method: POST
 * */
mediasRouter.post(
  PATH.UPLOAD_VIDEOS,
  accessTokenValidator,
  verifiedUserValidator,
  wrapRequestHandler(uploadMultipleVideoController)
)

/**
 * Description route: Upload static video hls
 * Path: /upload-video-hls
 * Method: POST
 * */

mediasRouter.post(
  PATH.UPLOAD_VIDEO_HLS,
  accessTokenValidator,
  verifiedUserValidator,
  wrapRequestHandler(uploadVideoHlsController)
)

/**
 * Description route: Upload multiple video hls
 * Path: /upload-videos-hls
 * Method: POST
 * */
mediasRouter.post(
  PATH.UPLOAD_VIDEOS_HLS,
  accessTokenValidator,
  verifiedUserValidator,
  wrapRequestHandler(uploadVideosHlsController)
)

/**
 * Description route: Get video status
 * Path: /video-status
 * Method: GET
 * Request params: { id: string }
 * */
mediasRouter.get(
  PATH.VIDEO_STATUS,
  accessTokenValidator,
  verifiedUserValidator,
  wrapRequestHandler(videoStatusController)
)

export default mediasRouter
