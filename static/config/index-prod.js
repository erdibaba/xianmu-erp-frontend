/**
 * Production environment
 */
;(function () {
  window.SITE_CONFIG = {}

  // API base URL
  var host = window.location.hostname
  var protocol = window.location.protocol || 'http:'
  if (host === 'localhost' || host === '127.0.0.1') {
    window.SITE_CONFIG['baseUrl'] = 'http://localhost:8080/renren-fast'
  } else if (host === '218.202.240.118') {
    window.SITE_CONFIG['baseUrl'] = 'http://218.202.240.118:8888/renren-fast'
  } else {
    window.SITE_CONFIG['baseUrl'] = protocol + '//' + host + ':8080/renren-fast'
  }

  // CDN = domain + version
  window.SITE_CONFIG['domain'] = './'
  window.SITE_CONFIG['version'] = ''
  window.SITE_CONFIG['cdnUrl'] = window.SITE_CONFIG.domain + window.SITE_CONFIG.version
})()
