"use strict";
const common_vendor = require("../../common/vendor.js");
const _sfc_main = {
  data() {
    return {
      searchKeyword: "",
      // 搜索关键词
      switchList: [],
      // 搜索结果列表
      searchHistory: [],
      // 搜索历史
      hasSearch: false,
      // 是否已执行搜索
      showHistory: false,
      // 是否显示搜索历史
      isNavigating: false,
      // 添加导航状态标记
      isDeleting: false,
      // 添加删除操作标记
      // 新增缓存相关配置
      useCache: false,
      // 控制是否使用缓存
      searchCache: {},
      // 搜索结果缓存
      cacheExpireTime: 30 * 60 * 1e3
      // 缓存过期时间(30分钟)
    };
  },
  onLoad() {
    const history = common_vendor.index.getStorageSync("searchHistory");
    if (history) {
      this.searchHistory = JSON.parse(history);
    }
    const cache = common_vendor.index.getStorageSync("searchCache");
    if (cache) {
      this.searchCache = JSON.parse(cache);
      this.cleanExpiredCache();
    }
  },
  methods: {
    // 处理搜索框获得焦点
    handleFocus() {
      this.showHistory = true;
    },
    // 处理搜索框失去焦点
    handleBlur() {
      setTimeout(() => {
        if (this.isDeleting) {
          this.isDeleting = false;
          return;
        }
        this.showHistory = false;
      }, 200);
    },
    // 处理搜索确认
    async handleSearch() {
      var _a;
      const keyword = this.searchKeyword.trim();
      if (!keyword) {
        common_vendor.index.__f__("log", "at pages/index/index.vue:136", "搜索关键词为空");
        return;
      }
      const chineseCharCount = ((_a = keyword.match(/[\u4e00-\u9fa5]/g)) == null ? void 0 : _a.length) || 0;
      if (chineseCharCount < 2) {
        common_vendor.index.__f__("log", "at pages/index/index.vue:143", "搜索关键词过短,需要至少2个汉字", {
          keyword,
          chineseCharCount
        });
        common_vendor.index.showToast({
          title: "请输入至少2个汉字",
          icon: "none"
        });
        return;
      }
      this.showHistory = false;
      common_vendor.index.showLoading({
        title: "搜索中..."
      });
      try {
        if (this.useCache) {
          const cachedResult = this.getFromCache(keyword);
          if (cachedResult) {
            common_vendor.index.__f__("log", "at pages/index/index.vue:164", "使用缓存数据:", {
              keyword,
              resultCount: cachedResult.length
            });
            this.switchList = cachedResult;
            this.hasSearch = true;
            common_vendor.index.hideLoading();
            return;
          }
        }
        common_vendor.index.__f__("log", "at pages/index/index.vue:175", "开始云数据库搜索:", keyword);
        const db = common_vendor.er.database();
        const res = await db.collection("switches").where({ switch_name: new RegExp(keyword, "i") }).get();
        common_vendor.index.__f__("log", "at pages/index/index.vue:181", "云数据库搜索返回数据:", res);
        this.switchList = Array.isArray(res.result.data) ? res.result.data : [];
        this.hasSearch = true;
        if (this.switchList.length === 0) {
          common_vendor.index.__f__("log", "at pages/index/index.vue:187", "搜索成功但无结果:", keyword);
          common_vendor.index.showToast({
            title: "未找到相关轴体",
            icon: "none"
          });
        } else {
          common_vendor.index.__f__("log", "at pages/index/index.vue:193", "搜索成功, 找到记录数:", this.switchList.length);
          this.saveSearchHistory(keyword);
          if (this.useCache) {
            this.saveToCache(keyword, this.switchList);
          }
        }
      } catch (e) {
        common_vendor.index.__f__("error", "at pages/index/index.vue:202", "搜索失败:", e);
        this.switchList = [];
        common_vendor.index.showToast({
          title: "搜索失败",
          icon: "none"
        });
      } finally {
        common_vendor.index.hideLoading();
      }
    },
    // 处理清除搜索
    handleClear() {
      common_vendor.index.__f__("log", "at pages/index/index.vue:215", "清除搜索:", {
        oldKeyword: this.searchKeyword,
        oldResultCount: this.switchList.length
      });
      this.searchKeyword = "";
      this.switchList = [];
      this.hasSearch = false;
      this.showHistory = true;
      common_vendor.index.__f__("log", "at pages/index/index.vue:223", "搜索已清除");
    },
    // 处理搜索历史点击
    handleHistoryClick(keyword) {
      this.searchKeyword = keyword;
      this.handleSearch();
    },
    // 处理列表项点击
    async handleItemClick(item) {
      if (item.isClicking) {
        return;
      }
      if (this.isNavigating) {
        return;
      }
      this.isNavigating = true;
      this.$set(item, "isClicking", true);
      common_vendor.index.showLoading({
        title: "加载中...",
        mask: true
        // 使用遮罩防止重复点击
      });
      try {
        common_vendor.index.__f__("log", "at pages/index/index.vue:257", "点击轴体:", {
          name: item.switch_name,
          id: item._id,
          specs: {
            force: item.actuation_force,
            travel: item.actuation_travel
          }
        });
        await common_vendor.index.navigateTo({
          url: `/pages/switchInfo/switchInfo?id=${item._id}`,
          success: async () => {
            common_vendor.index.__f__("log", "at pages/index/index.vue:270", "跳转成功，准备传递数据");
            setTimeout(() => {
              common_vendor.index.$emit("switchData", item);
              common_vendor.index.hideLoading();
            }, 100);
          },
          fail: (err) => {
            common_vendor.index.__f__("error", "at pages/index/index.vue:280", "跳转失败:", err);
            common_vendor.index.hideLoading();
            common_vendor.index.showToast({
              title: "跳转失败",
              icon: "none"
            });
          }
        });
      } catch (e) {
        common_vendor.index.__f__("error", "at pages/index/index.vue:290", "跳转失败:", e);
        common_vendor.index.hideLoading();
        common_vendor.index.showToast({
          title: "跳转失败",
          icon: "none"
        });
      } finally {
        setTimeout(() => {
          this.isNavigating = false;
          this.$set(item, "isClicking", false);
          common_vendor.index.hideLoading();
        }, 500);
      }
    },
    // 保存搜索历史
    saveSearchHistory(keyword) {
      common_vendor.index.__f__("log", "at pages/index/index.vue:311", "保存搜索历史:", keyword);
      const index = this.searchHistory.indexOf(keyword);
      if (index > -1) {
        common_vendor.index.__f__("log", "at pages/index/index.vue:314", "关键词已存在,位置:", index);
        this.searchHistory.splice(index, 1);
      }
      this.searchHistory.unshift(keyword);
      if (this.searchHistory.length > 10) {
        common_vendor.index.__f__("log", "at pages/index/index.vue:321", "历史记录超过10条,移除最后一条");
        this.searchHistory.pop();
      }
      common_vendor.index.setStorageSync("searchHistory", JSON.stringify(this.searchHistory));
      common_vendor.index.__f__("log", "at pages/index/index.vue:327", "当前搜索历史:", this.searchHistory);
    },
    // 清空搜索历史
    clearHistory() {
      common_vendor.index.showModal({
        title: "提示",
        content: "确定要清空搜索历史吗？",
        success: (res) => {
          if (res.confirm) {
            this.searchHistory = [];
            common_vendor.index.removeStorageSync("searchHistory");
          }
        }
      });
    },
    // 获取规格文本
    getSpecText(item) {
      const force = item.actuation_force;
      const actuationForce = force ? `触发压力: ${force.toString().toLowerCase().includes("gf") ? force : `${force}gf`}` : "";
      const actuationTravel = item.actuation_travel ? ` 触发行程: ${item.actuation_travel}` : "";
      const text = actuationForce + actuationTravel;
      return text || "暂无规格信息";
    },
    // 获取价格文本
    getPriceText(item) {
      return item.price ? `¥${item.price}` : "暂无报价";
    },
    // 获取缩略图
    getThumbImage(item) {
      if (Array.isArray(item.preview_images) && item.preview_images.length > 0 && item.preview_images[0].fileID) {
        return item.preview_images[0].fileID;
      }
      return "/static/default_switch.webp";
    },
    // 删除单个搜索历史
    deleteHistoryItem(index, event) {
      this.isDeleting = true;
      event.stopPropagation();
      this.searchHistory.splice(index, 1);
      common_vendor.index.setStorageSync("searchHistory", JSON.stringify(this.searchHistory));
    },
    // 新增缓存相关方法
    getFromCache(keyword) {
      const cachedItem = this.searchCache[keyword];
      if (cachedItem && Date.now() - cachedItem.timestamp < this.cacheExpireTime) {
        return cachedItem.data;
      }
      return null;
    },
    saveToCache(keyword, data) {
      this.searchCache[keyword] = {
        data,
        timestamp: Date.now()
      };
      common_vendor.index.setStorageSync("searchCache", JSON.stringify(this.searchCache));
      common_vendor.index.__f__("log", "at pages/index/index.vue:395", "搜索结果已缓存:", {
        keyword,
        resultCount: data.length
      });
    },
    cleanExpiredCache() {
      const now = Date.now();
      let cleaned = false;
      Object.keys(this.searchCache).forEach((key) => {
        if (now - this.searchCache[key].timestamp > this.cacheExpireTime) {
          delete this.searchCache[key];
          cleaned = true;
        }
      });
      if (cleaned) {
        common_vendor.index.__f__("log", "at pages/index/index.vue:413", "已清理过期缓存");
        common_vendor.index.setStorageSync("searchCache", JSON.stringify(this.searchCache));
      }
    }
  }
};
if (!Array) {
  const _easycom_uni_search_bar2 = common_vendor.resolveComponent("uni-search-bar");
  const _easycom_uni_icons2 = common_vendor.resolveComponent("uni-icons");
  const _easycom_uni_list_item2 = common_vendor.resolveComponent("uni-list-item");
  const _easycom_uni_list2 = common_vendor.resolveComponent("uni-list");
  (_easycom_uni_search_bar2 + _easycom_uni_icons2 + _easycom_uni_list_item2 + _easycom_uni_list2)();
}
const _easycom_uni_search_bar = () => "../../uni_modules/uni-search-bar/components/uni-search-bar/uni-search-bar.js";
const _easycom_uni_icons = () => "../../uni_modules/uni-icons/components/uni-icons/uni-icons.js";
const _easycom_uni_list_item = () => "../../uni_modules/uni-list/components/uni-list-item/uni-list-item.js";
const _easycom_uni_list = () => "../../uni_modules/uni-list/components/uni-list/uni-list.js";
if (!Math) {
  (_easycom_uni_search_bar + _easycom_uni_icons + _easycom_uni_list_item + _easycom_uni_list)();
}
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return common_vendor.e({
    a: common_vendor.o($options.handleSearch),
    b: common_vendor.o($options.handleClear),
    c: common_vendor.o($options.handleFocus),
    d: common_vendor.o($options.handleBlur),
    e: common_vendor.o(($event) => $data.searchKeyword = $event),
    f: common_vendor.p({
      radius: 100,
      placeholder: "搜索轴体",
      clearButton: "auto",
      cancelButton: "none",
      modelValue: $data.searchKeyword
    }),
    g: $data.showHistory && $data.searchHistory.length > 0
  }, $data.showHistory && $data.searchHistory.length > 0 ? {
    h: common_vendor.o($options.clearHistory),
    i: common_vendor.p({
      type: "trash",
      size: "14",
      color: "#000000"
    }),
    j: common_vendor.f($data.searchHistory, (item, index, i0) => {
      return {
        a: common_vendor.t(item),
        b: common_vendor.o(($event) => $options.handleHistoryClick(item), index),
        c: common_vendor.o(($event) => $options.deleteHistoryItem(index, $event), index),
        d: index
      };
    })
  } : {}, {
    k: $data.switchList.length > 0
  }, $data.switchList.length > 0 ? {
    l: common_vendor.f($data.switchList, (item, k0, i0) => {
      return {
        a: item._id,
        b: common_vendor.o(($event) => $options.handleItemClick(item), item._id),
        c: "4540c6bf-3-" + i0 + ",4540c6bf-2",
        d: common_vendor.p({
          clickable: true,
          title: item.switch_name,
          note: $options.getSpecText(item),
          rightText: $options.getPriceText(item),
          border: true,
          thumb: $options.getThumbImage(item),
          ["thumb-size"]: "lg"
        })
      };
    })
  } : $data.hasSearch ? {} : {}, {
    m: $data.hasSearch
  });
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/index/index.js.map
