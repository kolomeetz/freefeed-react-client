import {response, WHO_AM_I, SERVER_ERROR, UNAUTHENTICATED, HOME,
        SHOW_MORE_COMMENTS, SIGN_IN, SIGN_IN_CHANGE,
        SHOW_MORE_LIKES_SYNC, SHOW_MORE_LIKES_ASYNC} from './action-creators'
import _ from 'lodash'
import {userParser} from '../utils'

export function signInForm(state={username:'', password:'', error:''}, action) {
  switch(action.type) {
    case SIGN_IN_CHANGE: {
      return {
        ...state,
        username: action.username || state.username,
        password: action.password || state.password,
      }
    }
    case UNAUTHENTICATED: {
      return {...state, error: (action.payload || {}).err}
    }
  }
  return state
}

export function gotResponse(state = false, action) {
  switch (action.type) {
    case response(WHO_AM_I): {
      return true
    }
    case response(HOME): {
      return true
    }
  }
  return state
}

export function serverError(state = false, action) {
  switch (action.type) {
    case SERVER_ERROR: {
      return true
    }
  }
  return state
}

export function feedViewState(state = { feed: [] }, action) {
  switch (action.type) {
    case response(HOME): {
      const feed = action.payload.posts.map(post => post.id)
      return { ...state, feed }
    }
  }
  return state
}

export function postsViewState(state = {}, action) {
  switch (action.type) {
    case response(HOME): {
      const postsViewState = action.payload.posts.map(post => {
        const id = post.id

        const omittedComments = post.omittedComments
        const omittedLikes = post.omittedLikes

        return { omittedComments, omittedLikes, id }
      })
      return { ...state, ..._.indexBy(postsViewState, 'id') }
    }
    case response(SHOW_MORE_LIKES_ASYNC): {
      const id = action.payload.posts.id
      const omittedLikes = 0
     
      return { ...state, [id]: { ...state[id], omittedLikes} }
    }
    case response(SHOW_MORE_COMMENTS): {
      const id = action.payload.posts.id
      const omittedComments = 0
     
      return { ...state, [id]: { ...state[id], omittedComments} }
    }
    case SHOW_MORE_LIKES_SYNC: {
      const id = action.payload.postId
      const omittedLikes = 0

      return { ...state, [id]: { ...state[id], omittedLikes} }
    }
  }
  return state
}

function updatePostData(state, action) {
  const postId = action.payload.posts.id
  return { ...state, [postId]: action.payload.posts }
}

export function posts(state = {}, action) {
  switch (action.type) {
    case response(HOME): {
      return { ...state, ..._.indexBy(action.payload.posts, 'id') }
    }
    case response(SHOW_MORE_COMMENTS): {
      return updatePostData(state, action)
    }
    case response(SHOW_MORE_LIKES_ASYNC): {
      return updatePostData(state, action)
    }
  }

  return state
}

function updateCommentData(state, action) {
  return { ...state, ..._.indexBy(action.payload.comments, 'id') }
}

export function comments(state = {}, action) {
  switch (action.type) {
    case response(HOME): {
      return updateCommentData(state, action)
    }
    case response(SHOW_MORE_COMMENTS): {
      return updateCommentData(state, action)
    }
    case response(SHOW_MORE_LIKES_ASYNC): {
      return updateCommentData(state, action)
    }
  }
  return state
}

function mergeWithNewUsers(state, action) {
  return { ...state, ..._.indexBy(action.payload.users, 'id') }
}

export function users(state = {}, action) {
  switch (action.type) {
    case response(HOME): {
      const userData = _.indexBy(action.payload.users.map(userParser), 'id')
      return { ...state, ...userData }
    }
    case response(SHOW_MORE_COMMENTS): {
      return mergeWithNewUsers(state, action)
    }
    case response(SHOW_MORE_LIKES_ASYNC): {
      return mergeWithNewUsers(state, action)
    }

  }
  return state
}

import {getToken, getPersistedUser} from '../services/auth'

export function authenticated(state = !!getToken(), action) {
   switch (action.type) {
    case response(SIGN_IN): {
      return true
    }
    case UNAUTHENTICATED: {
      return false
    }
  }
  return state
}

//we're faking for now
import {user as defaultUserSettings} from '../config'

export function user(state = {settings: defaultUserSettings, ...getPersistedUser()}, action) {
  switch (action.type) {
    case response(WHO_AM_I): {
      return {...state, ...userParser(action.payload.users)}
    }
  }
  return state
}
