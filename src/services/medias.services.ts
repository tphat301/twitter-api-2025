import { Request } from 'express'
import sharp from 'sharp'
import path from 'path'
import fs from 'fs'
import 'dotenv/config'
import { UPLOAD_IMAGES_DIR, UPLOAD_IMAGE_DIR } from '~/constants/dir'
import { isProduction } from '~/constants/config'
import { EncodingStatus, MediaType } from '~/constants/enums'
import { Media } from '~/models/Other'
import { encodeHLSWithMultipleVideoStreams } from '~/utils/video'
import fsPromise from 'fs/promises'
import {
  getExt,
  getNameFromFullname,
  handleUploadMultipleImage,
  handleUploadMultipleVideos,
  handleUploadSingleImage,
  handleUploadSingleVideo
} from '~/utils/file'
import databaseService from '~/services/database.services'
import VideoStatus from '~/models/schemas/VideoStatus.schemas'

class Queue {
  items: string[]
  encoding: boolean
  constructor() {
    this.items = []
    this.encoding = false
  }

  async enqueue(item: string) {
    this.items.push(item)
    const idName = getNameFromFullname(item.split('\\').pop() as string)
    await databaseService.videoStatus.insertOne(
      new VideoStatus({
        name: idName,
        status: EncodingStatus.Pending
      })
    )
    this.processEncode()
  }

  async processEncode() {
    if (this.encoding) return
    if (this.items.length > 0) {
      this.encoding = true
      const videoPath = this.items[0]
      const idName = getNameFromFullname(videoPath.split('\\').pop() as string)
      await databaseService.videoStatus.updateOne(
        {
          name: idName
        },
        {
          $set: {
            status: EncodingStatus.Processing
          },
          $currentDate: {
            updated_at: true
          }
        }
      )
      try {
        await encodeHLSWithMultipleVideoStreams(videoPath)
        this.items.shift()
        await fsPromise.unlink(videoPath)
        await databaseService.videoStatus.updateOne(
          {
            name: idName
          },
          {
            $set: {
              status: EncodingStatus.Success
            },
            $currentDate: {
              updated_at: true
            }
          }
        )
        console.log(`Encode ${videoPath} success`)
      } catch (error) {
        await databaseService.videoStatus
          .updateOne(
            {
              name: idName
            },
            {
              $set: {
                status: EncodingStatus.Failed
              },
              $currentDate: {
                updated_at: true
              }
            }
          )
          .catch((err) => {
            console.error('Update video status faild ', error)
          })
        console.error(`Encode ${videoPath} faild`)
        console.error(error)
      }
      this.encoding = false
      this.processEncode()
    } else {
      console.log(`Encode video not empty`)
    }
  }
}

const queue = new Queue()

class MediasService {
  async uploadSingleImage(req: Request) {
    const file = await handleUploadSingleImage(req)
    const nameFile = getNameFromFullname(file.newFilename)
    const newPath = path.resolve(UPLOAD_IMAGE_DIR, `${nameFile}.jpg`)
    await sharp(file.filepath).jpeg().toFile(newPath)
    fs.unlinkSync(file.filepath)
    const type = MediaType.Image
    const url = isProduction
      ? `${process.env.APP_HOST}/static/image/${nameFile}.jpg`
      : `${process.env.APP_URL}:${process.env.APP_PORT}/static/image/${nameFile}.jpg`
    return {
      url,
      type
    }
  }

  async uploadMultipleImage(req: Request) {
    const files = await handleUploadMultipleImage(req)
    const result: Media[] = await Promise.all(
      files.map(async (file) => {
        const nameFile = getNameFromFullname(file.newFilename)
        const newPath = path.resolve(UPLOAD_IMAGES_DIR, `${nameFile}.jpg`)
        await sharp(file.filepath).jpeg().toFile(newPath)
        fs.unlinkSync(file.filepath)
        const type = MediaType.Image
        const url = isProduction
          ? `${process.env.APP_HOST}/static/images/${nameFile}.jpg`
          : `${process.env.APP_URL}:${process.env.APP_PORT}/static/images/${nameFile}.jpg`
        return {
          url,
          type
        }
      })
    )
    return result
  }

  async uploadSingleVideo(req: Request) {
    const file = await handleUploadSingleVideo(req)
    const extension = getExt(file.originalFilename as string)
    const nameFile = file.newFilename + '.' + extension
    const type = MediaType.Video
    const url = isProduction
      ? `${process.env.APP_HOST}/static/video/${file.newFilename}/${nameFile}`
      : `${process.env.APP_URL}:${process.env.APP_PORT}/static/video/${file.newFilename}/${nameFile}`
    return {
      url,
      type
    }
  }

  async uploadMultipleVideo(req: Request) {
    const files = await handleUploadMultipleVideos(req)
    const result: Media[] = await Promise.all(
      files.map((file) => {
        const extension = getExt(file.originalFilename as string)
        const nameFile = file.newFilename + '.' + extension
        const type = MediaType.Video
        const url = isProduction
          ? `${process.env.APP_HOST}/static/videos/${file.newFilename}/${nameFile}`
          : `${process.env.APP_URL}:${process.env.APP_PORT}/static/videos/${file.newFilename}/${nameFile}`
        return {
          url,
          type
        }
      })
    )
    return result
  }

  async uploadSingleVideoHls(req: Request) {
    const file = await handleUploadSingleVideo(req)
    const extension = getExt(file.originalFilename as string)
    const filePath = file.filepath + '.' + extension
    queue.enqueue(filePath)
    const type = MediaType.HLS
    const url = isProduction
      ? `${process.env.APP_HOST}/static/video-hls/${file.newFilename}/master.m3u8`
      : `${process.env.APP_URL}:${process.env.APP_PORT}/static/video-hls/${file.newFilename}/master.m3u8`
    return {
      url,
      type
    }
  }

  async uploadMultipleVideoHls(req: Request) {
    const files = await handleUploadMultipleVideos(req)
    const result: Media[] = await Promise.all(
      files.map((file) => {
        const extension = getExt(file.originalFilename as string)
        const filePath = file.filepath + '.' + extension
        queue.enqueue(filePath)
        const type = MediaType.HLS
        const url = isProduction
          ? `${process.env.APP_HOST}/static/videos-hls/${file.newFilename}/master.m3u8`
          : `${process.env.APP_URL}:${process.env.APP_PORT}/static/videos-hls/${file.newFilename}/master.m3u8`
        return {
          url,
          type
        }
      })
    )
    return result
  }

  async videoStatus(id: string) {
    const result = await databaseService.videoStatus.findOne({ name: id })
    return result
  }
}

const mediasService = new MediasService()

export default mediasService
