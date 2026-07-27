import http from '@/utils/httpRequest'

let runtimeEnvironmentPromise = null

export function getRuntimeEnvironment () {
  if (!runtimeEnvironmentPromise) {
    runtimeEnvironmentPromise = http({
      url: http.adornUrl('/sys/runtime/environment'),
      method: 'get',
      params: http.adornParams()
    }).then(({ data }) => {
      if (data && data.code === 0) {
        return {
          testEnvironment: data.testEnvironment === true,
          label: data.label || ''
        }
      }
      return { testEnvironment: false, label: '' }
    }).catch(() => {
      return { testEnvironment: false, label: '' }
    })
  }
  return runtimeEnvironmentPromise
}
