import { ParamsDictionary } from 'express-serve-static-core'

export interface StaticImageReqParams extends ParamsDictionary {
  name: string
}
export interface M3u8ReqParams extends ParamsDictionary {
  id: string
}
export interface ProgReqParams extends ParamsDictionary {
  id: string
  v: string
  prog: string
}
export interface SegmentReqParams extends ParamsDictionary {
  id: string
  v: string
  segment: string
}

export interface StaticVideoReqParams extends ParamsDictionary {
  name: string
}

export interface VideoStatusReqParams extends ParamsDictionary {
  id: string
}

export interface MultipleVideoReqParams extends ParamsDictionary {
  name: string
}

export interface MultipleImageReqParams extends ParamsDictionary {
  name: string
}
