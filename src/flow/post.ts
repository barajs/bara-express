import { flow } from '@barajs/core'
import { Application, Request, Response } from 'express'

import {
  WhenRequest,
  ExpressMold,
  RouteConfig,
  WhenCustomRoute,
} from '../types'
import { hasQuery, hasPath, hasMountPoint } from '../seep'

export const whenAnyPost = flow<WhenRequest, Application, ExpressMold>({
  bootstrap: ({ context: expressApp, next }) => {
    expressApp.post('*', (request: Request, response: Response) => {
      next({ request, response })
    })
  },
  seep: { hasPostQuery: hasQuery, hasPostPath: hasPath },
})

export const whenCustomPost = flow<WhenCustomRoute, Application, ExpressMold>({
  bootstrap: ({ context: expressApp, mold, next }) => {
    if (!mold.routes) return
    const {
      routes: { post = [] },
    } = mold
    for (const route of post) {
      const isPureMountPoint = typeof route === 'string'
      const mountPoint: string = isPureMountPoint
        ? (route as string)
        : (route as RouteConfig).mountPoint

      const middleware =
        !isPureMountPoint && 'mountPoint' in (route as RouteConfig)
          ? (route as RouteConfig).uses
          : null

      if (middleware) {
        expressApp.use(
          mountPoint,
          middleware,
          (request: Request, response: Response) => {
            next({ request, response, mountPoint })
          },
        )
      } else {
        expressApp.get(mountPoint, (request: Request, response: Response) => {
          next({ request, response, mountPoint })
        })
      }
    }
  },
  seep: {
    hasPostMountPoint: hasMountPoint,
    hasPostQuery: hasQuery,
    hasPostPath: hasPath,
  },
})
