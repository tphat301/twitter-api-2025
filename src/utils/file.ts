import fs from 'fs'
import { Request } from 'express'
import { File } from 'formidable'
import { UPLOAD_IMAGES_TEMP_DIR, UPLOAD_IMAGE_TEMP_DIR, UPLOAD_VIDEO_DIR, UPLOAD_VIDEOS_DIR } from '~/constants/dir'
import path from 'path'

export const getNameFromFullname = (fullname: string) => {
  const fullnameArray = fullname.split('.')
  fullnameArray.pop()
  return fullnameArray.join('')
}

export const getExt = (fullname: string) => {
  const nameArray = fullname.split('.')
  return nameArray[nameArray.length - 1]
}

export const initFolder = () => {
  const directTemps = [UPLOAD_IMAGE_TEMP_DIR, UPLOAD_IMAGES_TEMP_DIR, UPLOAD_VIDEO_DIR, UPLOAD_VIDEOS_DIR]
  directTemps.forEach((directTemp) => {
    if (!fs.existsSync(directTemp)) {
      fs.mkdirSync(directTemp, {
        recursive: true
      })
    }
  })
}

export const handleUploadSingleImage = async (req: Request) => {
  const formidable = (await import('formidable')).default
  const uploadDir = UPLOAD_IMAGE_TEMP_DIR
  const form = formidable({
    uploadDir,
    maxFiles: 1,
    maxFileSize: 500 * 1024, // 500Kb
    keepExtensions: true,
    filter: function ({ name, originalFilename, mimetype }) {
      const valid = name === 'image' && Boolean(mimetype?.includes('image/'))
      if (!valid) {
        form.emit('error' as any, new Error('File type is not valid') as any)
      }
      return valid
    }
  })
  return new Promise<File>((resolve, reject) => {
    form.parse(req, (err, fields, files) => {
      if (err) {
        return reject(err)
      }
      // eslint-disable-next-line no-extra-boolean-cast
      if (!Boolean(files.image)) {
        return reject(new Error('File not empty'))
      }
      resolve((files.image as File[])[0])
    })
  })
}

export const handleUploadMultipleImage = async (req: Request) => {
  const formidable = (await import('formidable')).default
  const uploadDir = UPLOAD_IMAGES_TEMP_DIR
  const form = formidable({
    uploadDir,
    maxFiles: 4,
    maxFileSize: 800 * 1024, // 800KB
    maxTotalFileSize: 800 * 1024 * 4,
    keepExtensions: true,
    filter: function ({ name, originalFilename, mimetype }) {
      const valid = name === 'images' && Boolean(mimetype?.includes('image/'))
      if (!valid) {
        form.emit('error' as any, new Error('File type is not valid') as any)
      }
      return valid
    }
  })
  return new Promise<File[]>((resolve, reject) => {
    form.parse(req, (err, fields, files) => {
      if (err) {
        return reject(err)
      }
      // eslint-disable-next-line no-extra-boolean-cast
      if (!Boolean(files.images)) {
        return reject(new Error('File not empty'))
      }
      resolve(files.images as File[])
    })
  })
}

export const handleUploadSingleVideo = async (req: Request) => {
  const formidable = (await import('formidable')).default
  const nanoId = (await import('nanoid')).nanoid
  const idName = nanoId()
  const folderPath = path.resolve(UPLOAD_VIDEO_DIR, idName)
  fs.mkdirSync(folderPath)
  const form = formidable({
    uploadDir: folderPath,
    maxFiles: 1,
    maxFileSize: 100 * 1024 * 1024, // 100MB
    filter: function ({ name, originalFilename, mimetype }) {
      const valid = name === 'video' && Boolean(mimetype?.includes('mp4') || mimetype?.includes('quicktime'))
      if (!valid) {
        form.emit('error' as any, new Error('File type is not valid') as any)
      }
      return valid
    },
    filename: function () {
      return idName
    }
  })
  return new Promise<File>((resolve, reject) => {
    form.parse(req, (err, fields, files) => {
      if (err) {
        return reject(err)
      }

      // eslint-disable-next-line no-extra-boolean-cast
      if (!Boolean(files.video)) {
        return reject(new Error('File not empty'))
      }
      const videoInfo = (files.video as File[])[0]
      const extension = getExt(videoInfo.originalFilename as string)
      fs.renameSync(videoInfo.filepath, videoInfo.filepath + '.' + extension)
      resolve(videoInfo)
    })
  })
}

export const handleUploadMultipleVideos = async (req: Request) => {
  const formidable = (await import('formidable')).default
  const nanoId = (await import('nanoid')).nanoid
  const idName = nanoId()
  const folderPath = path.resolve(UPLOAD_VIDEOS_DIR, idName)
  fs.mkdirSync(folderPath)
  const form = formidable({
    uploadDir: folderPath,
    maxFiles: 4,
    maxFileSize: 100 * 1024 * 1024, // 100MB
    maxTotalFileSize: 100 * 1024 * 1024 * 4, // 1200MB
    filter: function ({ name, originalFilename, mimetype }) {
      const valid = name === 'videos' && Boolean(mimetype?.includes('mp4') || mimetype?.includes('quicktime'))
      if (!valid) {
        form.emit('error' as any, new Error('File type is not valid') as any)
      }
      return valid
    },
    filename: function () {
      return idName
    }
  })
  return new Promise<File[]>((resolve, reject) => {
    form.parse(req, (err, fields, files) => {
      if (err) {
        return reject(err)
      }
      // eslint-disable-next-line no-extra-boolean-cast
      if (!Boolean(files.videos)) {
        return reject(new Error('File not empty'))
      }
      const videoArray = files.videos as File[]
      videoArray.forEach((videoItem) => {
        const extension = getExt(videoItem.originalFilename as string)
        fs.renameSync(videoItem.filepath, videoItem.filepath + '.' + extension)
      })
      resolve(videoArray)
    })
  })
}
