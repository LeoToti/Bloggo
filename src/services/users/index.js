import express from "express"
import createError from "http-errors"
import passport from 'passport'

import UserModel from "./schema.js"
import { JWTAuthMiddleware } from "../../auth/middlewares.js"
import { adminOnly } from "../../auth/admin.js"
import { JWTAuthenticate } from "../../auth/tools.js"

const usersRouter = express.Router()

usersRouter.post("/register", async (req, res, next) => {
  try {
    const newUser = new UserModel(req.body)

    const { _id } = await newUser.save()

    res.status(201).send({ _id })
  } catch (error) {
    next(error)
  }
})

usersRouter.get("/", JWTAuthMiddleware, adminOnly, async (req, res, next) => {
  try {
    const users = await UserModel.find()
    res.send(users)
  } catch (error) {
    next(error)
  }
})

usersRouter.get("/me", JWTAuthMiddleware, async (req, res, next) => {
  try {
    res.send(req.user)
  } catch (error) {
    next(error)
  }
})

usersRouter.delete("/me", JWTAuthMiddleware, async (req, res, next) => {
  try {
    await req.user.deleteOne()
  } catch (error) {
    next(error)
  }
})

usersRouter.put("/me", JWTAuthMiddleware, async (req, res, next) => {
  try {
    // modifiy the user with the fields coming from req.body

    req.user.name = "Whatever"

    await req.user.save()
  } catch (error) {
    next(error)
  }
})

usersRouter.post("/login", async (req, res, next) => {
  try {
    const { email, password } = req.body

    // 1. Verify credentials

    const user = await UserModel.checkCredentials(email, password)

    if (user) {
      // 2. Generate token if credentials are ok

      const accessToken = await JWTAuthenticate(user)

      // 3. Send token as a response

      res.send({ accessToken })
    } else {
      next(createError(401))
    }
  } catch (error) {
    next(error)
  }
})

usersRouter.post("/refreshToken", async (req, res, next) => {
  try {
    // actual refresh token is coming from req.body

    // 1. Check the validity and integrity of the actual refresh token, if everything is ok we are generating a new pair of access + refresh tokens
    const { newAccessToken, newRefreshToken } = await refreshTokens(req.body.actualRefreshToken)
    // 2. Send back tokens as response

    res.send({ newAccessToken, newRefreshToken })
  } catch (error) {
    next(error)
  }
})

usersRouter.get("/googleLogin", passport.authenticate("google", {scope: ["profile", "email"]})) // This endpoint redirects automagically to Google

usersRouter.get("/googleRedirect", passport.authenticate("google"), async(req,res,next) => {
  try {
    console.log(req.user)
    res.send("OK")
  } catch (error) {
    next(error)
  }
})




export default usersRouter
