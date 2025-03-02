"use strict";
const common_vendor = require("../../common/vendor.js");
const common_assets = require("../../common/assets.js");
const _sfc_main = {
  data() {
    return {
      switchData: {},
      // 轴体数据
      switchImages: []
      // 轴体图片数组
    };
  },
  onLoad(options) {
    common_vendor.index.__f__("log", "at pages/switchInfo/switchInfo.vue:53", "页面参数:", options);
    common_vendor.index.$on("switchData", this.handleSwitchData);
    if (options.id) {
      this.loadSwitchData(options.id);
    }
  },
  onUnload() {
    common_vendor.index.$off("switchData", this.handleSwitchData);
  },
  methods: {
    // 处理图片加载错误
    handleImageError(index) {
      common_vendor.index.__f__("log", "at pages/switchInfo/switchInfo.vue:69", "图片加载失败:", index);
      if (this.switchImages[index]) {
        this.$set(this.switchImages[index], "fileID", "/static/default_switch.webp");
      }
    },
    // 处理传递来的轴体数据
    handleSwitchData(data) {
      common_vendor.index.__f__("log", "at pages/switchInfo/switchInfo.vue:78", "接收到轴体数据:", data);
      this.switchData = data;
      this.switchImages = Array.isArray(data.images) ? data.images.filter((img) => img && img.fileID) : [];
      common_vendor.index.__f__("log", "at pages/switchInfo/switchInfo.vue:82", "处理后的图片数组:", this.switchImages);
    },
    // 加载轴体数据
    async loadSwitchData(id) {
      try {
        common_vendor.index.showLoading({
          title: "加载中..."
        });
        const res = await common_vendor.er.callFunction({
          name: "switchApi",
          data: {
            action: "getSwitchById",
            id
          }
        });
        common_vendor.index.__f__("log", "at pages/switchInfo/switchInfo.vue:100", "获取轴体数据结果:", res);
        if (res.result.code === 0) {
          this.switchData = res.result.data;
          this.switchImages = Array.isArray(this.switchData.images) ? this.switchData.images.filter((img) => img && img.fileID) : [];
          common_vendor.index.__f__("log", "at pages/switchInfo/switchInfo.vue:107", "加载后的图片数组:", this.switchImages);
        } else {
          common_vendor.index.showToast({
            title: res.result.msg,
            icon: "none"
          });
        }
      } catch (e) {
        common_vendor.index.__f__("error", "at pages/switchInfo/switchInfo.vue:115", "加载轴体数据失败:", e);
        common_vendor.index.showToast({
          title: "加载失败",
          icon: "none"
        });
      } finally {
        common_vendor.index.hideLoading();
      }
    },
    // 格式化价格
    getPriceText(price) {
      return price ? `¥${price}` : "暂无报价";
    },
    // 格式化力度
    getForceText(force) {
      return force ? `${force}gf` : "暂无数据";
    },
    // 格式化距离
    getDistanceText(distance) {
      return distance ? `${distance}mm` : "暂无数据";
    },
    // 格式化时间
    formatTime(time) {
      return time || "暂无数据";
    }
  }
};
if (!Array) {
  const _easycom_uni_list_item2 = common_vendor.resolveComponent("uni-list-item");
  const _easycom_uni_list2 = common_vendor.resolveComponent("uni-list");
  (_easycom_uni_list_item2 + _easycom_uni_list2)();
}
const _easycom_uni_list_item = () => "../../uni_modules/uni-list/components/uni-list-item/uni-list-item.js";
const _easycom_uni_list = () => "../../uni_modules/uni-list/components/uni-list/uni-list.js";
if (!Math) {
  (_easycom_uni_list_item + _easycom_uni_list)();
}
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return common_vendor.e({
    a: common_vendor.f($data.switchImages, (image, index, i0) => {
      return {
        a: image.fileID || "/static/default_switch.webp",
        b: common_vendor.o(($event) => $options.handleImageError(index), index),
        c: index
      };
    }),
    b: !$data.switchImages.length
  }, !$data.switchImages.length ? {
    c: common_assets._imports_0
  } : {}, {
    d: common_vendor.p({
      title: "轴体名称",
      ["right-text"]: $data.switchData.name || "暂无"
    }),
    e: common_vendor.p({
      title: "代工厂",
      ["right-text"]: $data.switchData.manufacturer || "暂无"
    }),
    f: common_vendor.p({
      title: "轴体分类",
      ["right-text"]: $data.switchData.category || "暂无"
    }),
    g: common_vendor.p({
      title: "上市时间",
      ["right-text"]: $data.switchData.release_date || "暂无"
    }),
    h: common_vendor.p({
      title: "价格",
      ["right-text"]: $options.getPriceText($data.switchData.price)
    }),
    i: common_vendor.p({
      title: "轴心材质",
      ["right-text"]: $options.getForceText($data.switchData.stem_material) || "暂无"
    }),
    j: common_vendor.p({
      title: "上盖材质",
      ["right-text"]: $options.getForceText($data.switchData.top_housing_material) || "暂无"
    }),
    k: common_vendor.p({
      title: "底壳材质",
      ["right-text"]: $options.getDistanceText($data.switchData.bottom_housing_material) || "暂无"
    }),
    l: common_vendor.p({
      title: "触发压力",
      ["right-text"]: $options.getForceText($data.switchData.actuation_force)
    }),
    m: common_vendor.p({
      title: "触发行程",
      ["right-text"]: $options.getDistanceText($data.switchData.actuation_distance)
    }),
    n: common_vendor.p({
      title: "触底压力",
      ["right-text"]: $options.getForceText($data.switchData.bottom_force)
    }),
    o: common_vendor.p({
      title: "总行程",
      ["right-text"]: $options.getDistanceText($data.switchData.total_travel)
    }),
    p: common_vendor.p({
      title: "更新时间",
      ["right-text"]: $options.formatTime($data.switchData.update_time)
    })
  });
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/switchInfo/switchInfo.js.map
