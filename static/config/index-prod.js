/**
 * Production environment
 */
;(function () {
  window.SITE_CONFIG = {}

  // API base URL
  var host = window.location.hostname
  window.SITE_CONFIG['baseUrl'] = (host === 'localhost' || host === '127.0.0.1')
    ? 'http://localhost:8080/renren-fast'
    : 'http://192.168.0.36:8080/renren-fast'

  // CDN = domain + version
  window.SITE_CONFIG['domain'] = './'
  window.SITE_CONFIG['version'] = ''
  window.SITE_CONFIG['cdnUrl'] = window.SITE_CONFIG.domain + window.SITE_CONFIG.version
})()
