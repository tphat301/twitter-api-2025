import { NextFunction, Request, Response } from 'express'
import { ValidationChain, validationResult } from 'express-validator'
import { RunnableValidationChains } from 'express-validator/lib/middlewares/schema'
import HTTP_STATUS_CODE from '~/constants/httpStatusCode'
import { ErrorsEntity, ErrorsWithStatus } from '~/models/Errors'

export const validate = (validation: RunnableValidationChains<ValidationChain>) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    await validation.run(req)
    const errors = validationResult(req)
    if (errors.isEmpty()) {
      return next()
    }
    const errorsObject = errors.mapped()
    const entityErrorsObject = new ErrorsEntity({ errors: {} })
    for (const key in errorsObject) {
      const { msg } = errorsObject[key]
      if (msg instanceof ErrorsWithStatus && msg.status !== HTTP_STATUS_CODE.UNPROCESSABLE_ENTITY) {
        return next(msg)
      }
      entityErrorsObject['errors']['msg'] = errorsObject[key]
    }
    next(entityErrorsObject)
  }
}
