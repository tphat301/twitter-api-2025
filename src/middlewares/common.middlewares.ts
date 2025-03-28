import { pick } from 'lodash'
import { Request, Response, NextFunction } from 'express'
type Filters<T> = Array<keyof T>
export const filterMiddleware =
  <T>(filterKeys: Filters<T>) =>
  (req: Request, res: Response, next: NextFunction) => {
    req.body = pick(req.body, filterKeys)
    next()
  }
