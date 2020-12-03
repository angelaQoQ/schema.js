/*
 * @Description:
 * @FilePath: \webfic_other\static_file\js\schema\callapp.js
 * @Version: 1.0
 * @Autor: CuiGang
 * @Date: 2020-12-01 17:00:58
 * @LastEditors: CuiGang
 * @LastEditTime: 2020-12-02 20:43:22
 */
/**
 * 获取 ios 大版本号
 */
function getIOSVersion() {
  var version = navigator.appVersion.match(/OS (\d+)_(\d+)_?(\d+)?/);
  return parseInt(version[1], 10);
}

/**
 * 获取 微信 版本号
 */
function getWeChatVersion() {
  var version = navigator.appVersion.match(/micromessenger\/(\d+\.\d+\.\d+)/i);
  return version[1];
}

/**
 * 获取 browser 信息
 */
function getBrowser() {
  var ua = window.navigator.userAgent || "";
  var isAndroid = /android/i.test(ua);
  var isIos = /iphone|ipad|ipod/i.test(ua);
  var isWechat = /micromessenger\/([\d.]+)/i.test(ua);
  var isWeibo = /(weibo).*weibo__([\d.]+)/i.test(ua);
  var isQQ = /qq\/([\d.]+)/i.test(ua);
  var isQQBrowser = /(qqbrowser)\/([\d.]+)/i.test(ua);
  var isQzone = /qzone\/.*_qz_([\d.]+)/i.test(ua);
  // 安卓 chrome 浏览器，很多 app 都是在 chrome 的 ua 上进行扩展的
  var isOriginalChrome =
    /chrome\/[\d.]+ Mobile Safari\/[\d.]+/i.test(ua) && isAndroid;
  // chrome for ios 和 safari 的区别仅仅是将 Version/<VersionNum> 替换成了 CriOS/<ChromeRevision>
  // ios 上很多 app 都包含 safari 标识，但它们都是以自己的 app 标识开头，而不是 Mozilla
  var isSafari =
    /safari\/([\d.]+)$/i.test(ua) &&
    isIos &&
    ua.indexOf("Crios") < 0 &&
    ua.indexOf("Mozilla") === 0;
  return {
    isAndroid,
    isIos,
    isWechat,
    isWeibo,
    isQQ,
    isQQBrowser,
    isQzone,
    isOriginalChrome,
    isSafari,
  };
}
(function (window) {
  // 打开app封装方法
  function CallApp(option) {
    // schema协议
    this.schema = option.schema;
    // 备选schema
    this.choosedSchema = option.choosedSchema || "";
    // ios appstore地址
    this.appstore = option.appstore;
    // ios - universalLink
    this.universalLink = option.universalLink;
    // 下载地址
    this.downloadUrl = option.downloadUrl;
    this.iosDownloadUrl = option.iosDownloadUrl;
    this.andDownloadUrl = option.andDownloadUrl;
    // 安卓chrome浏览器打开地址
    this.intentUrl = option.intentUrl || option.schema;
    // 应用宝地址
    this.YingYongBaoUrl = option.YingYongBaoUrl || "";
    // 是否支付应用宝
    this.isSupportYingYongBao = option.isSupportYingYongBao || false;
    // 成功回调
    this.succCallback = option.succCallback;
    // 失败回调
    this.failCallback = option.failCallback || this.downloadCallback;
    this.failLogCallback = option.failLogCallback || function () {};
    // 微信浏览器的情况 - 如果不支持应用宝，会有 去外部浏览器打开的提示
    this.wxFailCallback = option.wxFailCallback || function () {};

    this.timeout = option.timeout || 3000;
    this.openApp();
  }

  CallApp.prototype = {
    /**
     * @desc: 打开app
     */
    openApp(isChoosed) {
      var browser = getBrowser();
      var checkOpenFall = null;
      var self = this;
      if (browser.isIos) {
        // 近期ios版本qq禁止了scheme和universalLink唤起app，安卓不受影响 - 18年12月23日
        // ios qq浏览器禁止了scheme和universalLink - 2019年5月1日
        // ios 微信自 7.0.5 版本放开了 Universal Link 的限制
        if (
          (browser.isWechat && getWeChatVersion() < "7.0.5") ||
          browser.isQQ ||
          browser.isQQBrowser
        ) {
          console.log("22");
          evokeByLocation(this.appstore);
        } else if (getIOSVersion() < 9) {
          evokeByIFrame(this.schema);
          console.log("33");
          checkOpenFall = this.fallToAppStore;
        }
        // else if (!supportUniversal) {
        //   evokeByLocation(this.schema);
        //   console.log("44");
        //   checkOpenFall = this.fallToAppStore;
        // }
        else {
          evokeByLocation(this.universalLink);
        }
        // Android
      } else if (browser.isWechat || browser.isQQ) {
        if (this.isSupportYingYongBao) {
          evokeByLocation(this.YingYongBaoUrl);
        } else {
          // 请到外部浏览器打开
          self.wxFailCallback();
        }
      } else if (browser.isOriginalChrome) {
        if (typeof intent !== "undefined") {
          console.log(2);
          checkOpenFall = this.failCallback;
        } else {
          // scheme 在 andriod chrome 25+ 版本上必须手势触发
          evokeByTagA(isChoosed ? this.choosedSchema : this.schema);

          console.log(3);
          checkOpenFall = this.failCallback;
        }
      } else {
        evokeByIFrame(isChoosed ? this.choosedSchema : this.schema);

        console.log(4);
        checkOpenFall = this.failCallback;
      }
      console.log("WTF");

      checkOpenFall && checkOpenFall.call(this);
    },
    /**
     * @desc: 检验app是否成功打开
     * @param {Function} cb :失败回调
     * @param {number} timeout ?: 时间间隔
     */
    checkOpen: function (cb, timeout) {
      timeout = timeout ? timeout : this.timeout;
      var self = this;
      var visibilityChangeProperty = getVisibilityChangeProperty();
      var currentTime = new Date().getTime();
      var timer = setTimeout(function () {
        console.log("???");
        var hidden = isPageHidden();
        console.log(hidden);
        var callbackTime = new Date().getTime();
        console.log(callbackTime - currentTime);
        if (!hidden) {
          if (callbackTime - currentTime >= timeout + 1000) {
          } else {
            cb();
          }
          self.failLogCallback();
        } else {
          self.succCallback();
        }
      }, timeout);

      var evFn = function () {
        clearTimeout(timer);
      };

      // 解绑事件
      if (document.listenVisibility) {
        document.removeEventListener(visibilityChangeProperty, evFn);
        document.listenVisibility = false;
      }
      if (visibilityChangeProperty && !document.listenVisibility) {
        document.addEventListener(visibilityChangeProperty, evFn);
        document.listenVisibility = true;
      }

      window.onpagehide = function () {
        clearTimeout(timer);
      };
    },
    // ios打开app失败的情况
    fallToAppStore: function (url) {
      this.checkOpen(function () {
        evokeByLocation(url);
      });
    },

    // 默认 - 安卓打开app失败的情况
    downloadCallback: function () {
      var self = this;
      this.checkOpen(function () {
        console.log("打开失败,跳转下载");
        if (getBrowser().isIos) {
          console.log("IOS");
          downloadFile(self.iosDownloadUrl);
        } else {
          console.log("AND");
          downloadFile(self.andDownloadUrl);
        }
      });
    },
  };

  /**
   * 获取页面隐藏属性的前缀
   * 如果页面支持 hidden 属性，返回 '' 就行
   * 如果不支持，各个浏览器对 hidden 属性，有自己的实现，不同浏览器不同前缀，遍历看支持哪个
   */
  function getPagePropertyPrefix() {
    var prefixes = ["webkit", "moz", "ms", "o"];
    var correctPrefix;

    if ("hidden" in document) return "";

    prefixes.forEach((prefix) => {
      if (prefix + "Hidden" in document) {
        correctPrefix = prefix;
      }
    });

    return correctPrefix || false;
  }

  /**
   * 判断页面是否隐藏（进入后台）
   */
  function isPageHidden() {
    var prefix = getPagePropertyPrefix();
    if (prefix === false) return false;

    var hiddenProperty = prefix ? prefix + "Hidden" : "hidden";
    console.log("hiddenProperty:" + hiddenProperty);
    console.log("document[hiddenProperty]" + document[hiddenProperty]);
    return document[hiddenProperty];
  }
  /**
   * 获取判断页面 显示|隐藏 状态改变的属性
   */
  function getVisibilityChangeProperty() {
    var prefix = getPagePropertyPrefix();
    if (prefix === false) return false;

    return prefix + "visibilitychange";
  }
  /**
   * 通过 top.location.href 跳转
   * 使用 top 是因为在 qq 中打开的页面不属于顶级页面(iframe级别)
   * 自身 url 变更无法触动唤端操作
   * @param {string}} [uri] - 需要打开的地址
   */
  function evokeByLocation(uri) {
    window.top.location.href = uri;
  }
  /**
   * 通过 iframe 唤起
   * @param {string}} [uri] - 需要打开的地址
   */
  function evokeByIFrame(uri) {
    var iframe = document.createElement("iframe");
    iframe.frameborder = "0";
    iframe.style.cssText = "display:none;border:0;width:0;height:0;";
    iframe.src = uri;
    setTimeout(function () {
      document.body.appendChild(iframe);
    }, 0);
  }

  /**
   * 通过 A 标签唤起
   * @param {string}} [uri] - 需要打开的地址
   */
  function evokeByTagA(uri) {
    var tagA = document.createElement("a");

    tagA.setAttribute("href", uri);
    tagA.style.display = "none";
    document.body.appendChild(tagA);

    tagA.click();
  }

  /**@param {string} url - 下载地址
   *
   */
  function downloadFile(url) {
    var a = document.createElement("a");
    a.download = "WEBFIC.apk";
    a.fileName = "WEBFIC.apk";
    console.log(url);
    a.href = url;
    document.body.appendChild(a); // 修复firefox中无法触发click
    a.click();
    document.body.removeChild(a);
  }

  window.CallApp = CallApp;
  window.getBrowser = getBrowser;
})(window);
