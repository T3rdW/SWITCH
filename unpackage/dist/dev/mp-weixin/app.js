"use strict";
Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
const common_vendor = require("./common/vendor.js");
if (!Math) {
  "./pages/index/index.js";
  "./pages/switchInfo/switchInfo.js";
}
function getFavorites(app) {
  return new Promise((resolve, reject) => {
    var _a;
    if (!((_a = app.globalData.userInfo) == null ? void 0 : _a.openid)) {
      common_vendor.index.__f__("log", "at App.vue:6", "没有 openid，无法获取收藏");
      resolve([]);
      return;
    }
    common_vendor.index.__f__("log", "at App.vue:11", "准备调用云函数获取收藏");
    common_vendor.er.callFunction({
      name: "switchApi",
      data: {
        action: "getUserFavorites",
        openid: app.globalData.userInfo.openid
      }
    }).then(({ result }) => {
      common_vendor.index.__f__("log", "at App.vue:19", "云函数返回结果:", result);
      if (result.errCode === 0) {
        app.globalData.favorites = result.data;
        common_vendor.index.__f__("log", "at App.vue:22", "获取收藏数据成功:", result.data.length);
        resolve(result.data);
      } else {
        resolve([]);
      }
    }).catch((e) => {
      common_vendor.index.__f__("error", "at App.vue:28", "获取收藏数据失败:", e);
      reject(e);
    });
  });
}
const _sfc_main = {
  globalData: {
    userInfo: null,
    favorites: []
  },
  async onLaunch() {
    try {
      common_vendor.index.__f__("log", "at App.vue:41", "App onLaunch");
      const loginRes = await common_vendor.index.login({
        provider: "weixin"
      });
      common_vendor.index.__f__("log", "at App.vue:47", "登录结果:", loginRes);
      if (loginRes.code) {
        common_vendor.index.__f__("log", "at App.vue:50", "准备调用 silentLogin");
        const { result } = await common_vendor.er.callFunction({
          name: "switchApi",
          data: {
            action: "silentLogin",
            code: loginRes.code
          }
        });
        common_vendor.index.__f__("log", "at App.vue:59", "silentLogin 返回:", result);
        if (result.errCode === 0) {
          this.globalData.userInfo = {
            openid: result.openid
          };
          common_vendor.index.__f__("log", "at App.vue:65", "静默登录成功:", this.globalData.userInfo);
          try {
            await getFavorites(this);
          } catch (e) {
            common_vendor.index.__f__("error", "at App.vue:72", "获取收藏失败:", e);
          }
        }
      }
    } catch (e) {
      common_vendor.index.__f__("error", "at App.vue:77", "登录异常:", e);
    }
  },
  onShow: function() {
    common_vendor.index.__f__("log", "at App.vue:81", "App Show");
  },
  onHide: function() {
    common_vendor.index.__f__("log", "at App.vue:84", "App Hide");
  }
};
function createApp() {
  const app = common_vendor.createSSRApp(_sfc_main);
  return {
    app
  };
}
createApp().app.mount("#app");
exports.createApp = createApp;
//# sourceMappingURL=../.sourcemap/mp-weixin/app.js.map
