"use strict";
const common_vendor = require("../../common/vendor.js");
const common_assets = require("../../common/assets.js");
const RelatedKeyboardsItem = () => "../../components/related-keyboards-item.js";
const _sfc_main = {
  components: {
    RelatedKeyboardsItem
  },
  data() {
    return {
      switchData: {},
      // 轴体数据
      switchImages: []
      // 轴体图片数组
    };
  },
  onLoad(options) {
    common_vendor.index.__f__("log", "at pages/switchInfo/switchInfo.vue:69", "页面参数:", options);
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
      common_vendor.index.__f__("log", "at pages/switchInfo/switchInfo.vue:85", "图片加载失败:", index);
      if (this.switchImages[index]) {
        this.$set(this.switchImages[index], "fileID", "/static/default_switch.webp");
      }
    },
    // 处理传递来的轴体数据
    handleSwitchData(data) {
      common_vendor.index.__f__("log", "at pages/switchInfo/switchInfo.vue:94", "接收到轴体数据:", data);
      this.switchData = data;
      this.switchImages = Array.isArray(data.images) ? data.images.filter((img) => img && img.fileID) : [];
      common_vendor.index.__f__("log", "at pages/switchInfo/switchInfo.vue:98", "处理后的图片数组:", this.switchImages);
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
        common_vendor.index.__f__("log", "at pages/switchInfo/switchInfo.vue:116", "获取轴体数据结果:", res);
        if (res.result.errCode === 0) {
          this.switchData = res.result.data;
          this.switchImages = Array.isArray(this.switchData.images) ? this.switchData.images.filter((img) => img && img.fileID) : [];
          common_vendor.index.__f__("log", "at pages/switchInfo/switchInfo.vue:123", "加载后的图片数组:", this.switchImages);
        } else {
          common_vendor.index.showToast({
            title: res.result.errMsg || "加载失败",
            icon: "none"
          });
        }
      } catch (e) {
        common_vendor.index.__f__("error", "at pages/switchInfo/switchInfo.vue:131", "加载轴体数据失败:", e);
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
      if (!force)
        return "暂无数据";
      return force.toString().toLowerCase().includes("gf") ? force : `${force}gf`;
    },
    // 格式化距离 mm
    getDistanceText(distance) {
      if (!distance)
        return "暂无数据";
      const distanceStr = distance.toString().toLowerCase();
      if (distanceStr.includes("mm")) {
        return distance;
      }
      if (!/\d/.test(distanceStr)) {
        return distance;
      }
      return `${distance}mm`;
    },
    // 格式化时间
    formatTime(time) {
      if (!time)
        return "暂无数据";
      try {
        const date = new Date(time);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");
        const hours = String(date.getHours()).padStart(2, "0");
        const minutes = String(date.getMinutes()).padStart(2, "0");
        const seconds = String(date.getSeconds()).padStart(2, "0");
        return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
      } catch (e) {
        common_vendor.index.__f__("error", "at pages/switchInfo/switchInfo.vue:187", "时间格式化失败:", e);
        return time;
      }
    },
    // 处理相关键盘字段的数据
    getRelatedKeyboards(keyboards) {
      if (!keyboards || !Array.isArray(keyboards) || keyboards.length === 0) {
        return "--";
      }
      return keyboards.join(", ");
    }
  }
};
if (!Array) {
  const _easycom_uni_list_item2 = common_vendor.resolveComponent("uni-list-item");
  const _component_related_keyboards_item = common_vendor.resolveComponent("related-keyboards-item");
  const _easycom_uni_list2 = common_vendor.resolveComponent("uni-list");
  (_easycom_uni_list_item2 + _component_related_keyboards_item + _easycom_uni_list2)();
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
      ["right-text"]: $data.switchData.switch_name || "暂无"
    }),
    e: common_vendor.p({
      title: "代工厂",
      ["right-text"]: $data.switchData.manufacturer || "暂无"
    }),
    f: common_vendor.p({
      title: "轴体分类",
      ["right-text"]: $data.switchData.switch_type || "暂无"
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
      ["right-text"]: $data.switchData.stem_material || "暂无"
    }),
    j: common_vendor.p({
      title: "上盖材质",
      ["right-text"]: $data.switchData.top_housing_material || "暂无"
    }),
    k: common_vendor.p({
      title: "底壳材质",
      ["right-text"]: $data.switchData.bottom_housing_material || "暂无"
    }),
    l: common_vendor.p({
      title: "触发压力",
      ["right-text"]: $options.getForceText($data.switchData.actuation_force)
    }),
    m: common_vendor.p({
      title: "触发行程",
      ["right-text"]: $options.getDistanceText($data.switchData.actuation_travel)
    }),
    n: common_vendor.p({
      title: "触底压力",
      ["right-text"]: $options.getForceText($data.switchData.bottom_force)
    }),
    o: common_vendor.p({
      title: "触底行程",
      ["right-text"]: $options.getDistanceText($data.switchData.bottom_out_travel)
    }),
    p: common_vendor.p({
      title: "总行程",
      ["right-text"]: $options.getDistanceText($data.switchData.total_travel)
    }),
    q: common_vendor.p({
      title: "弹簧长度",
      ["right-text"]: $data.switchData.spring_length || "暂无"
    }),
    r: common_vendor.p({
      title: "出厂润滑",
      ["right-text"]: $data.switchData.factory_lube ? "是" : "否"
    }),
    s: common_vendor.p({
      title: "寿命",
      ["right-text"]: $data.switchData.lifespan || "暂无"
    }),
    t: common_vendor.p({
      title: "更新时间",
      ["right-text"]: $options.formatTime($data.switchData.update_time)
    }),
    v: common_vendor.p({
      title: "数据来源",
      ["right-text"]: $data.switchData.data_source || "暂无"
    }),
    w: common_vendor.p({
      keyboards: $options.getRelatedKeyboards($data.switchData.related_keyboards)
    }),
    x: common_vendor.p({
      title: "停产",
      ["right-text"]: $data.switchData.discontinued ? "是" : "否"
    }),
    y: common_vendor.p({
      title: "备注",
      ["right-text"]: $data.switchData.remark || "暂无"
    }),
    z: common_vendor.p({
      title: "审核状态",
      ["right-text"]: $data.switchData.audit_status || "暂无"
    })
  });
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/switchInfo/switchInfo.js.map
