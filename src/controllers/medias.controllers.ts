import { Request, Response, NextFunction } from 'express'
import path from 'path'
import fs from 'fs'
import { UPLOAD_IMAGES_DIR, UPLOAD_IMAGE_DIR, UPLOAD_VIDEOS_DIR, UPLOAD_VIDEO_DIR } from '~/constants/dir'
import HTTP_STATUS_CODE from '~/constants/httpStatusCode'
import { USER_MESSAGE } from '~/constants/messages'
import mediasService from '~/services/medias.services'
import {
  M3u8ReqParams,
  MultipleImageReqParams,
  MultipleVideoReqParams,
  ProgReqParams,
  SegmentReqParams,
  StaticImageReqParams,
  StaticVideoReqParams,
  VideoStatusReqParams
} from '~/models/requests/Media.requests'

export const uploadImageController = async (req: Request, res: Response, next: NextFunction) => {
  const data = await mediasService.uploadSingleImage(req)
  res.json({
    message: USER_MESSAGE.UPLOAD_SUCCESS,
    data
  })
  return
}

export const uploadMultipleImageController = async (req: Request, res: Response, next: NextFunction) => {
  const data = await mediasService.uploadMultipleImage(req)
  res.json({
    message: USER_MESSAGE.UPLOAD_SUCCESS,
    data
  })
  return
}

export const uploadVideoController = async (req: Request, res: Response, next: NextFunction) => {
  const data = await mediasService.uploadSingleVideo(req)
  res.json({
    message: USER_MESSAGE.UPLOAD_SUCCESS,
    data
  })
  return
}

export const uploadVideoHlsController = async (req: Request, res: Response, next: NextFunction) => {
  const data = await mediasService.uploadSingleVideoHls(req)
  res.json({
    message: USER_MESSAGE.UPLOAD_SUCCESS,
    data
  })
  return
}

export const uploadVideosHlsController = async (req: Request, res: Response, next: NextFunction) => {
  const data = await mediasService.uploadMultipleVideoHls(req)
  res.json({
    message: USER_MESSAGE.UPLOAD_SUCCESS,
    data
  })
  return
}

export const uploadMultipleVideoController = async (req: Request, res: Response, next: NextFunction) => {
  const data = await mediasService.uploadMultipleVideo(req)
  res.json({
    message: USER_MESSAGE.UPLOAD_SUCCESS,
    data
  })
  return
}

export const serveImageController = (req: Request<StaticImageReqParams>, res: Response, next: NextFunction) => {
  const { name } = req.params
  res.sendFile(path.resolve(UPLOAD_IMAGE_DIR, name), (err) => {
    if (err) {
      res.status((err as any).status).send('Not Found')
    }
  })
  return
}

export const serveM3u8Controller = (req: Request<M3u8ReqParams>, res: Response, next: NextFunction) => {
  const { id } = req.params
  res.sendFile(path.resolve(UPLOAD_VIDEO_DIR, id, 'master.m3u8'), (err) => {
    if (err) {
      res.status(HTTP_STATUS_CODE.NOT_FOUND).send('Not Found')
    }
  })
  return
}

export const serveMultipleM3u8Controller = (req: Request<M3u8ReqParams>, res: Response, next: NextFunction) => {
  const { id } = req.params
  res.sendFile(path.resolve(UPLOAD_VIDEOS_DIR, id, 'master.m3u8'), (err) => {
    if (err) {
      res.status(HTTP_STATUS_CODE.NOT_FOUND).send('Not Found')
    }
  })
  return
}

export const serveProgController = (req: Request<ProgReqParams>, res: Response, next: NextFunction) => {
  const { id, v, prog } = req.params
  res.sendFile(path.resolve(UPLOAD_VIDEO_DIR, id, v, prog), (err) => {
    if (err) {
      res.status(HTTP_STATUS_CODE.NOT_FOUND).send('Not Found')
    }
  })
  return
}

export const serveMultipleProgController = (req: Request<ProgReqParams>, res: Response, next: NextFunction) => {
  const { id, v, prog } = req.params
  res.sendFile(path.resolve(UPLOAD_VIDEOS_DIR, id, v, prog), (err) => {
    if (err) {
      res.status(HTTP_STATUS_CODE.NOT_FOUND).send('Not Found')
    }
  })
  return
}

export const serveSegmentController = (req: Request<SegmentReqParams>, res: Response, next: NextFunction) => {
  const { id, v, segment } = req.params
  res.sendFile(path.resolve(UPLOAD_VIDEO_DIR, id, v, segment), (err) => {
    if (err) {
      res.status(HTTP_STATUS_CODE.NOT_FOUND).send('Not Found')
    }
  })
  return
}

export const serveMultipleSegmentController = (req: Request<SegmentReqParams>, res: Response, next: NextFunction) => {
  const { id, v, segment } = req.params
  res.sendFile(path.resolve(UPLOAD_VIDEOS_DIR, id, v, segment), (err) => {
    if (err) {
      res.status(HTTP_STATUS_CODE.NOT_FOUND).send('Not Found')
    }
  })
  return
}

export const serveMultipleImageController = (
  req: Request<MultipleImageReqParams>,
  res: Response,
  next: NextFunction
) => {
  const { name } = req.params
  res.sendFile(path.resolve(UPLOAD_IMAGES_DIR, name), (err) => {
    if (err) {
      res.status(HTTP_STATUS_CODE.NOT_FOUND).send('Not Found')
    }
  })
  return
}

export const serveStreamStaticVideoController = async (
  req: Request<StaticVideoReqParams>,
  res: Response,
  next: NextFunction
) => {
  const mime = (await import('mime')).default
  const { range } = req.headers
  const { name, file } = req.params
  if (!range) {
    res.status(HTTP_STATUS_CODE.BAD_REQUEST).send('Range headers is require!')
    return
  }
  const videoPath = path.resolve(UPLOAD_VIDEO_DIR, name, file)
  // 1MB = 10^6 bytes nếu tính theo hệ thập phân
  // 1MB = 2^20 bytes nếu tính theo hệ nhị phân
  const videoSize = fs.statSync(videoPath).size // tong dung luong video
  const chunkSize = 10 ** 6 // 1MB la dung luong cua moi phan doan cua video
  const start = Number((range as string).replace(/\D/g, '')) // gia tri bat dau tu range headers
  const end = Math.min(start + chunkSize, videoSize - 1) // vuot qua videoSize thi lay videoSize
  const contentLength = end - start + 1 // Dung lượng thực tế cho mỗi đoạn stream video thường sẽ là chunksize trừ đoạn cuối ra
  const contentType = mime.getType(videoPath) || 'video/*'
  const headers = {
    'Content-Range': `bytes ${start}-${end}/${videoSize}`,
    'Accept-Ranges': 'bytes',
    'Content-Length': contentLength,
    'Content-Type': contentType
  }
  res.writeHead(HTTP_STATUS_CODE.PARTIAL_CONTENT, headers)
  const videoStream = fs.createReadStream(videoPath, { start, end })
  videoStream.pipe(res)
}

export const serveStreamMultipleVideoController = async (
  req: Request<MultipleVideoReqParams>,
  res: Response,
  next: NextFunction
) => {
  const mime = (await import('mime')).default
  const { range } = req.headers
  const { name, file } = req.params
  if (!range) {
    res.status(HTTP_STATUS_CODE.BAD_REQUEST).send('Range headers is require!')
    return
  }
  const videoPath = path.resolve(UPLOAD_VIDEOS_DIR, name, file)
  // 1MB = 10^6 bytes nếu tính theo hệ thập phân
  // 1MB = 2^20 bytes nếu tính theo hệ nhị phân
  const videoSize = fs.statSync(videoPath).size // tong dung luong video
  const chunkSize = 10 ** 6 // 1MB la dung luong cua moi phan doan cua video
  const start = Number((range as string).replace(/\D/g, '')) // gia tri bat dau tu range headers
  const end = Math.min(start + chunkSize, videoSize - 1) // vuot qua videoSize thi lay videoSize
  const contentLength = end - start + 1 // Dung lượng thực tế cho mỗi đoạn stream video thường sẽ là chunksize trừ đoạn cuối ra
  const contentType = mime.getType(videoPath) || 'video/*'
  const headers = {
    'Content-Range': `bytes ${start}-${end}/${videoSize}`,
    'Accept-Ranges': 'bytes',
    'Content-Length': contentLength,
    'Content-Type': contentType
  }
  res.writeHead(HTTP_STATUS_CODE.PARTIAL_CONTENT, headers)
  const videosStream = fs.createReadStream(videoPath, { start, end })
  videosStream.pipe(res)
}

export const videoStatusController = async (req: Request<VideoStatusReqParams>, res: Response, next: NextFunction) => {
  const { id } = req.params
  const data = await mediasService.videoStatus(id)
  res.json({
    message: USER_MESSAGE.GET_VIDEO_STATUS_SUCCESS,
    data
  })
  return
}
