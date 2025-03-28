import { ObjectId } from 'mongodb'

interface HashtagConstructorType {
  _id?: ObjectId
  name: string
  created_at?: Date
}

export class Hashtag {
  _id: ObjectId
  name: string
  created_at: Date
  constructor({ _id, name, created_at }: HashtagConstructorType) {
    this._id = _id || new ObjectId()
    this.name = name
    this.created_at = created_at || new Date()
  }
}
