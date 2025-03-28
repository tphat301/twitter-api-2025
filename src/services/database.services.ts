import 'dotenv/config'
import { MongoClient, Db, Collection } from 'mongodb'
import { Bookmark } from '~/models/schemas/Bookmark.schemas'
import { Conversation } from '~/models/schemas/Conversation.schemas'
import Follower from '~/models/schemas/Follower.schemas'
import { Hashtag } from '~/models/schemas/Hashtag.schemas'
import { Like } from '~/models/schemas/Like.schemas'
import RefreshToken from '~/models/schemas/RefreshToken.schemas'
import { Tweet } from '~/models/schemas/Tweet.schemas'
import { User } from '~/models/schemas/Users.schemas'
import VideoStatus from '~/models/schemas/VideoStatus.schemas'

const uri = `mongodb+srv://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@twitterapi-cluster.qmand.mongodb.net/?retryWrites=true&w=majority&appName=${process.env.APP_NAME}`

class DatabaseService {
  private db: Db
  private client: MongoClient
  constructor() {
    this.client = new MongoClient(uri)
    this.db = this.client.db(process.env.DB_NAME)
  }

  async connect() {
    try {
      await this.db.command({ ping: 1 })
      console.log('Pinged your deployment. You successfully connected to MongoDB!')
    } catch (error) {
      console.log(error)
      throw error
    }
  }

  async indexUsers() {
    const isExistIndex = await this.users.indexExists(['email_1_username_1', 'email_1', 'username_1'])

    if (!isExistIndex) {
      this.users.createIndex({ email: 1, username: 1 })
      this.users.createIndex({ email: 1 }, { unique: true })
      this.users.createIndex({ username: 1 }, { unique: true })
    }
  }

  async indexRefreshTokens() {
    const isExistIndex = await this.refreshTokens.indexExists(['token_1', 'exp_1'])
    if (!isExistIndex) {
      this.refreshTokens.createIndex({ token: 1 })
      this.refreshTokens.createIndex({ exp: 1 }, { expireAfterSeconds: 0 })
    }
  }

  async indexVideoStatus() {
    const isExistIndex = await this.videoStatus.indexExists(['name_1'])
    if (!isExistIndex) {
      this.videoStatus.createIndex({ name: 1 })
    }
  }

  async indexTweet() {
    const isExistIndex = await this.tweets.indexExists(['content_text'])
    if (!isExistIndex) {
      this.tweets.createIndex({ content: 'text' }, { default_language: 'none' })
    }
  }

  async indexFollowers() {
    const isExistIndex = await this.followers.indexExists(['user_id_1_followed_user_id_1'])
    if (!isExistIndex) {
      this.followers.createIndex({ user_id: 1, followed_user_id: 1 })
    }
  }

  async indexHashtags() {
    const isExistIndex = await this.hashtags.indexExists(['name_1'])
    if (!isExistIndex) {
      this.hashtags.createIndex({ name: 1 }, { unique: true })
    }
  }

  async indexBookmarks() {
    const isExistIndex = await this.bookmarks.indexExists(['user_id_1_tweet_id_1'])
    if (!isExistIndex) {
      this.bookmarks.createIndex({ user_id: 1, tweet_id: 1 })
    }
  }

  async indexLikes() {
    const isExistIndex = await this.likes.indexExists(['user_id_1_tweet_id_1'])
    if (!isExistIndex) {
      this.likes.createIndex({ user_id: 1, tweet_id: 1 })
    }
  }

  get tweets(): Collection<Tweet> {
    return this.db.collection(process.env.DB_TWEETS_COLLECTION as string)
  }

  get users(): Collection<User> {
    return this.db.collection(process.env.DB_USERS_COLLECTION as string)
  }

  get refreshTokens(): Collection<RefreshToken> {
    return this.db.collection(process.env.DB_REFRESH_TOKENS_COLLECTION as string)
  }

  get followers(): Collection<Follower> {
    return this.db.collection(process.env.DB_FOLLOWERS_COLLECTION as string)
  }

  get videoStatus(): Collection<VideoStatus> {
    return this.db.collection(process.env.DB_VIDEO_STATUS_COLLECTION as string)
  }

  get hashtags(): Collection<Hashtag> {
    return this.db.collection(process.env.DB_HASHTAGS_COLLECTION as string)
  }

  get bookmarks(): Collection<Bookmark> {
    return this.db.collection(process.env.DB_BOOKMARKS_COLLECTION as string)
  }

  get likes(): Collection<Like> {
    return this.db.collection(process.env.DB_LIKES_COLLECTION as string)
  }

  get conversations(): Collection<Conversation> {
    return this.db.collection(process.env.DB_CONVERSATIONS_COLLECTION as string)
  }
}
const databaseService = new DatabaseService()
export default databaseService
