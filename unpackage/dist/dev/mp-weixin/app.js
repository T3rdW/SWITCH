"use strict";
Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
const common_vendor = require("./common/vendor.js");
if (!Math) {
  "./pages/index/index.js";
  "./pages/switchInfo/switchInfo.js";
}
const _sfc_main = {
  globalData: {
    userInfo: null,
    favorites: []
  },
  async onLaunch() {
    try {
      const loginRes = await common_vendor.index.login({
        provider: "weixin"
      });
      if (loginRes.code) {
        const { result } = await common_vendor.er.callFunction({
          name: "switchApi",
          data: {
            action: "silentLogin",
            code: loginRes.code
          }
        });
        if (result.errCode === 0) {
          this.globalData.userInfo = {
            openid: result.openid
          };
          common_vendor.index.__f__("log", "at App.vue:29", "静默登录成功:", this.globalData.userInfo);
          await this.fetchUserFavorites();
        }
      }
    } catch (e) {
      common_vendor.index.__f__("error", "at App.vue:36", "登录异常:", e);
    }
  },
  // 获取用户收藏数据
  async fetchUserFavorites() {
    var _a;
    try {
      if (!((_a = this.globalData.userInfo) == null ? void 0 : _a.openid))
        return;
      const { result } = await common_vendor.er.callFunction({
        name: "switchApi",
        data: {
          action: "getUserFavorites",
          openid: this.globalData.userInfo.openid
        }
      });
      if (result.errCode === 0) {
        this.globalData.favorites = result.data;
        common_vendor.index.__f__("log", "at App.vue:55", "获取收藏数据成功:", result.data.length);
      }
    } catch (e) {
      common_vendor.index.__f__("error", "at App.vue:58", "获取收藏数据失败:", e);
    }
  },
  onShow: function() {
    common_vendor.index.__f__("log", "at App.vue:62", "App Show");
  },
  onHide: function() {
    common_vendor.index.__f__("log", "at App.vue:65", "App Hide");
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
