/**
 * 开发环境
 */
;(function () {
  window.SITE_CONFIG = {};

  // api接口请求地址
  var host = window.location.hostname;
  window.SITE_CONFIG['baseUrl'] = (host === 'localhost' || host === '127.0.0.1')
    ? 'http://localhost:8080/renren-fast'
    : 'http://192.168.0.36:8080/renren-fast';

  // cdn地址 = 域名 + 版本号
  window.SITE_CONFIG['domain']  = './'; // 域名
  window.SITE_CONFIG['version'] = '';   // 版本号(年月日时分)
  window.SITE_CONFIG['cdnUrl']  = window.SITE_CONFIG.domain + window.SITE_CONFIG.version;
})();
