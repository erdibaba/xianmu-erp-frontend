import Vue from 'vue'
import axios from 'axios'
import router from '@/router'
import qs from 'qs'
import merge from 'lodash/merge'
import { clearLoginInfo } from '@/utils'

const http = axios.create({
  timeout: 1000 * 30,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json; charset=utf-8'
  }
})

http.interceptors.request.use(config => {
  config.headers.token = Vue.cookie.get('token')
  return config
}, error => Promise.reject(error))

http.interceptors.response.use(response => {
  if (response.data && response.data.code === 401) {
    clearLoginInfo()
    const redirect = router.currentRoute && router.currentRoute.fullPath ? router.currentRoute.fullPath : '/home'
    router.push({ name: 'login', query: { redirect: encodeURIComponent(redirect) } })
  }
  return response
}, error => Promise.reject(error))

http.adornUrl = (actionName) => {
  return (process.env.NODE_ENV !== 'production' && process.env.OPEN_PROXY ? '/proxyApi/' : window.SITE_CONFIG.baseUrl) + actionName
}

http.adornParams = (params = {}, openDefaultParams = true) => {
  const defaults = {
    t: new Date().getTime()
  }
  return openDefaultParams ? merge(defaults, params) : params
}

http.adornData = (data = {}, openDefaultData = true, contentType = 'json') => {
  const defaults = {
    t: new Date().getTime()
  }
  const merged = openDefaultData ? merge(defaults, data) : data
  return contentType === 'json' ? JSON.stringify(merged) : qs.stringify(merged)
}

export default http
