/**
 * 验收环境
 */
;(function () {
  window.SITE_CONFIG = {};

  // api接口请求地址
  var host = window.location.hostname;
  var protocol = window.location.protocol || 'http:';
  if (host === 'localhost' || host === '127.0.0.1') {
    window.SITE_CONFIG['baseUrl'] = 'http://localhost:8080/renren-fast';
  } else if (host === '218.202.240.118') {
    window.SITE_CONFIG['baseUrl'] = 'http://218.202.240.118:8888/renren-fast';
  } else {
    window.SITE_CONFIG['baseUrl'] = protocol + '//' + host + ':8080/renren-fast';
  }

  // cdn地址 = 域名 + 版本号
  window.SITE_CONFIG['domain']  = './'; // 域名
  window.SITE_CONFIG['version'] = '';   // 版本号(年月日时分)
  window.SITE_CONFIG['cdnUrl']  = window.SITE_CONFIG.domain + window.SITE_CONFIG.version;
})();
