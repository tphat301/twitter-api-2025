import { Router } from 'express'
import { PATH } from '~/constants/path'
import {
  serveImageController,
  serveM3u8Controller,
  serveMultipleImageController,
  serveMultipleM3u8Controller,
  serveMultipleProgController,
  serveMultipleSegmentController,
  serveProgController,
  serveSegmentController,
  serveStreamMultipleVideoController,
  serveStreamStaticVideoController
} from '~/controllers/medias.controllers'

const staticRouter = Router()

/**
 * Description route: Serve static image route
 * Path: /image/:name
 * Method: GET
 * Request param: { name: string }
 * */
staticRouter.get(PATH.STATIC_IMAGE, serveImageController)

/**
 * Description route: Serve Multiple images route
 * Path: /images/:name
 * Method: GET
 * Request params: { name: string }
 * */
staticRouter.get(PATH.MULTIPLE_IMAGE, serveMultipleImageController)

/**
 * Description route: Serve static video route
 * Path: /video/:name
 * Method: GET
 * Request params: { name: string }
 * */
staticRouter.get(PATH.STATIC_VIDEO, serveStreamStaticVideoController)

/**
 * Description route: Serve multiple video route
 * Path: /videos/:name
 * Method: GET
 * Request params: { name: string }
 * */
staticRouter.get(PATH.MULTIPLE_VIDEO, serveStreamMultipleVideoController)

/**
 * Description route: Serve static video hls m3u8
 * Path: /video-hls/:id/master.m3u8
 * Method: GET
 * Request params: { id: string }
 * */
staticRouter.get(PATH.STATIC_VIDEO_HLS, serveM3u8Controller)

/**
 * Description route: Serve multiple video hls m3u8
 * Path: /videos-hls/:id/master.m3u8
 * Method: GET
 * Request params: { id: string }
 * */
staticRouter.get(PATH.STATIC_VIDEOS_HLS, serveMultipleM3u8Controller)

/**
 * Description route: Serve static video hls prog_index
 * Path: /video-hls/:id/:v/prog_index.m3u8
 * Method: GET
 * Request params: { id: string, v:string }
 * */
staticRouter.get(PATH.STATIC_VIDEO_HLS_PROG, serveProgController)

/**
 * Description route: Serve multiple video hls prog_index
 * Path: /videos-hls/:id/:v/prog_index.m3u8
 * Method: GET
 * Request params: { id: string, v:string }
 * */
staticRouter.get(PATH.STATIC_VIDEOS_HLS_PROG, serveMultipleProgController)

/**
 * Description route: Serve static video hls prog_index
 * Path: /video-hls/:id/:v/:segment
 * Request params: { id: string, v:string, segment:string }
 * Method: GET
 * */
staticRouter.get(PATH.STATIC_VIDEO_HLS_SEGMENT, serveSegmentController)

/**
 * Description route: Serve multiple video hls prog_index
 * Path: /videos-hls/:id/:v/:segment
 * Request params: { id: string, v:string, segment:string }
 * Method: GET
 * */
staticRouter.get(PATH.STATIC_VIDEOS_HLS_SEGMENT, serveMultipleSegmentController)

export default staticRouter
