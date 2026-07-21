/**
 * Production environment
 */
;(function () {
  window.SITE_CONFIG = {}

  // API base URL
  var protocol = window.location.protocol || 'http:'
  window.SITE_CONFIG['baseUrl'] = window.ERP_API_BASE_URL ||
    protocol + '//' + window.location.host + '/renren-fast'

  // CDN = domain + version
  window.SITE_CONFIG['domain'] = './'
  window.SITE_CONFIG['version'] = ''
  window.SITE_CONFIG['cdnUrl'] = window.SITE_CONFIG.domain + window.SITE_CONFIG.version
})()
