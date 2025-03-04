"use strict";
const common_vendor = require("../../common/vendor.js");
const common_assets = require("../../common/assets.js");
const RelatedKeyboardsItem = () => "../../components/related-keyboards-item.js";
const RemarkItem = () => "../../components/remark-item.js";
const _sfc_main = {
  components: {
    RelatedKeyboardsItem,
    RemarkItem
  },
  data() {
    return {
      switchData: {},
      // 轴体数据
      switchImages: [],
      // 轴体图片数组
      triggerCount: 0,
      // 触发计数器
      currentImageIndex: 0,
      // 当前显示的图片索引
      isEditing: false,
      // 是否正在编辑图片
      MAX_WIDTH: 1280,
      MAX_HEIGHT: 1280,
      QUALITY: 0.8
    };
  },
  computed: {
    currentImage() {
      return this.switchImages[this.currentImageIndex] || {};
    }
  },
  onLoad(options) {
    common_vendor.index.__f__("log", "at pages/switchInfo/switchInfo.vue:134", "页面参数:", options);
    common_vendor.index.$on("switchData", this.handleSwitchData);
    if (options.id) {
      this.loadSwitchData(options.id);
    }
  },
  onUnload() {
    common_vendor.index.$off("switchData", this.handleSwitchData);
  },
  methods: {
    // 处理图片加载成功
    handleImageLoad(index) {
      common_vendor.index.__f__("log", "at pages/switchInfo/switchInfo.vue:150", "图片加载成功:", index, this.switchImages[index]);
    },
    // 处理传递来的轴体数据
    handleSwitchData(data) {
      common_vendor.index.__f__("log", "at pages/switchInfo/switchInfo.vue:155", "接收到轴体数据:", data);
      this.switchData = data;
      this.switchImages = Array.isArray(data.preview_images) ? data.preview_images : [];
      common_vendor.index.__f__("log", "at pages/switchInfo/switchInfo.vue:159", "处理后的图片数组:", this.switchImages);
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
        common_vendor.index.__f__("log", "at pages/switchInfo/switchInfo.vue:177", "获取轴体数据结果:", res);
        if (res.result.errCode === 0) {
          this.switchData = res.result.data;
          this.switchImages = Array.isArray(this.switchData.preview_images) ? this.switchData.preview_images : [];
          common_vendor.index.__f__("log", "at pages/switchInfo/switchInfo.vue:183", "加载后的图片数组:", this.switchImages);
        } else {
          common_vendor.index.showToast({
            title: res.result.errMsg || "加载失败",
            icon: "none"
          });
        }
      } catch (e) {
        common_vendor.index.__f__("error", "at pages/switchInfo/switchInfo.vue:191", "加载轴体数据失败:", e);
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
        common_vendor.index.__f__("error", "at pages/switchInfo/switchInfo.vue:247", "时间格式化失败:", e);
        return time;
      }
    },
    // 处理相关键盘字段的数据
    getRelatedKeyboards(keyboards) {
      if (!keyboards || !Array.isArray(keyboards) || keyboards.length === 0) {
        return "--";
      }
      return keyboards.join(", ");
    },
    // 处理轮播图切换
    handleSwiperChange(e) {
      this.currentImageIndex = e.detail.current;
    },
    // 压缩图片
    async compressImage(tempFilePath) {
      try {
        common_vendor.index.__f__("log", "at pages/switchInfo/switchInfo.vue:268", "开始压缩图片:", tempFilePath);
        const imageInfo = await new Promise((resolve, reject) => {
          common_vendor.index.getImageInfo({
            src: tempFilePath,
            success: resolve,
            fail: reject
          });
        });
        common_vendor.index.__f__("log", "at pages/switchInfo/switchInfo.vue:279", "获取到图片信息:", imageInfo);
        if (!imageInfo || !imageInfo.width || !imageInfo.height) {
          throw new Error("获取图片信息失败");
        }
        let width = imageInfo.width;
        let height = imageInfo.height;
        if (width > this.MAX_WIDTH) {
          height = Math.round(height * this.MAX_WIDTH / width);
          width = this.MAX_WIDTH;
        }
        if (height > this.MAX_HEIGHT) {
          width = Math.round(width * this.MAX_HEIGHT / height);
          height = this.MAX_HEIGHT;
        }
        common_vendor.index.__f__("log", "at pages/switchInfo/switchInfo.vue:300", "计算后的尺寸:", { width, height });
        if (common_vendor.index.getSystemInfoSync().platform === "mp-weixin") {
          const compressRes = await new Promise((resolve, reject) => {
            common_vendor.index.compressImage({
              src: tempFilePath,
              quality: Math.round(this.QUALITY * 100),
              success: resolve,
              fail: reject
            });
          });
          common_vendor.index.__f__("log", "at pages/switchInfo/switchInfo.vue:313", "压缩结果:", compressRes);
          return compressRes.tempFilePath;
        }
        const compressedPath = await new Promise((resolve, reject) => {
          common_vendor.index.compressImage({
            src: tempFilePath,
            quality: Math.round(this.QUALITY * 100),
            width,
            height,
            success: resolve,
            fail: reject
          });
        });
        common_vendor.index.__f__("log", "at pages/switchInfo/switchInfo.vue:329", "压缩完成:", compressedPath);
        return compressedPath.tempFilePath;
      } catch (e) {
        common_vendor.index.__f__("error", "at pages/switchInfo/switchInfo.vue:332", "压缩图片失败:", e);
        common_vendor.index.__f__("log", "at pages/switchInfo/switchInfo.vue:334", "返回原图:", tempFilePath);
        return tempFilePath;
      }
    },
    // 生成图片文件名
    getImageFileName(type = "detail", index) {
      let switchName = this.switchData.switch_name_en || this.switchData.switch_name || "unknown";
      const safeSwitchName = switchName.replace(/\s+/g, "_").replace(/[^a-zA-Z0-9_]/g, "").replace(/_+/g, "_").replace(/^_|_$/g, "");
      return `${safeSwitchName}_${type}_${index + 1}.webp`;
    },
    // 添加图片
    async handleAddImage() {
      try {
        const now = (/* @__PURE__ */ new Date()).toLocaleString("zh-CN", { timeZone: "Asia/Shanghai" });
        if (!this.switchData.preview_images) {
          this.switchData.preview_images = [];
        }
        const res = await common_vendor.index.chooseImage({
          count: 1,
          sizeType: ["original"],
          sourceType: ["album", "camera"]
        });
        if (!res || !res.tempFilePaths || !res.tempFilePaths.length) {
          common_vendor.index.__f__("log", "at pages/switchInfo/switchInfo.vue:371", "用户取消选择图片");
          return;
        }
        const tempFilePath = res.tempFilePaths[0];
        const compressedPath = await this.compressImage(tempFilePath);
        const fileName = this.getImageFileName("detail", this.switchImages.length);
        const cloudPath = fileName;
        common_vendor.index.showLoading({ title: "上传中..." });
        const uploadRes = await common_vendor.er.uploadFile({
          filePath: compressedPath,
          cloudPath
        });
        common_vendor.index.__f__("log", "at pages/switchInfo/switchInfo.vue:391", "上传结果:", uploadRes);
        if (!uploadRes.fileID) {
          throw new Error("上传失败：未获取到 fileID");
        }
        const imageInfo = {
          fileID: uploadRes.fileID,
          type: "detail",
          fileName,
          uploadTime: now,
          updateTime: ""
        };
        common_vendor.index.__f__("log", "at pages/switchInfo/switchInfo.vue:406", "图片信息:", imageInfo);
        const updateRes = await common_vendor.er.callFunction({
          name: "switchApi",
          data: {
            action: "updateSwitchImage",
            switchId: this.switchData._id,
            imageIndex: this.switchImages.length,
            imageInfo
          }
        });
        common_vendor.index.__f__("log", "at pages/switchInfo/switchInfo.vue:419", "数据库更新结果:", updateRes);
        if (updateRes.result.errCode !== 0) {
          throw new Error("更新数据库失败：" + updateRes.result.errMsg);
        }
        const newImageInfo = JSON.parse(JSON.stringify(imageInfo));
        this.switchImages.push(newImageInfo);
        this.switchData.preview_images = JSON.parse(JSON.stringify(this.switchImages));
        this.$forceUpdate();
        await this.loadSwitchData(this.switchData._id);
        common_vendor.index.showToast({ title: "添加成功" });
      } catch (e) {
        if (e.errMsg === "chooseImage:fail cancel") {
          common_vendor.index.__f__("log", "at pages/switchInfo/switchInfo.vue:440", "用户取消选择图片");
          return;
        }
        common_vendor.index.__f__("error", "at pages/switchInfo/switchInfo.vue:444", "添加图片失败:", e);
        common_vendor.index.showToast({
          title: "添加失败",
          icon: "none"
        });
      } finally {
        common_vendor.index.hideLoading();
      }
    },
    // 修改图片
    async handleEditImage() {
      if (!this.switchImages.length) {
        common_vendor.index.showToast({
          title: "没有可修改的图片",
          icon: "none"
        });
        return;
      }
      try {
        const now = (/* @__PURE__ */ new Date()).toLocaleString("zh-CN", { timeZone: "Asia/Shanghai" });
        const res = await common_vendor.index.chooseImage({
          count: 1,
          sizeType: ["original"],
          sourceType: ["album", "camera"]
        });
        if (!res || !res.tempFilePaths || !res.tempFilePaths.length) {
          common_vendor.index.__f__("log", "at pages/switchInfo/switchInfo.vue:474", "用户取消选择图片");
          return;
        }
        const tempFilePath = res.tempFilePaths[0];
        const compressedPath = await this.compressImage(tempFilePath);
        const fileName = this.getImageFileName("detail", this.currentImageIndex);
        const cloudPath = fileName;
        common_vendor.index.showLoading({ title: "上传中..." });
        const uploadRes = await common_vendor.er.uploadFile({
          filePath: compressedPath,
          cloudPath
        });
        const imageInfo = {
          fileID: uploadRes.fileID,
          type: "detail",
          fileName,
          uploadTime: this.switchImages[this.currentImageIndex].uploadTime,
          updateTime: now
        };
        await common_vendor.er.callFunction({
          name: "switchApi",
          data: {
            action: "updateSwitchImage",
            switchId: this.switchData._id,
            imageIndex: this.currentImageIndex,
            imageInfo
          }
        });
        this.$set(this.switchImages, this.currentImageIndex, imageInfo);
        this.switchData.preview_images = this.switchImages;
        this.loadSwitchData(this.switchData._id);
        common_vendor.index.showToast({ title: "修改成功" });
      } catch (e) {
        if (e.errMsg === "chooseImage:fail cancel") {
          common_vendor.index.__f__("log", "at pages/switchInfo/switchInfo.vue:523", "用户取消选择图片");
          return;
        }
        common_vendor.index.__f__("error", "at pages/switchInfo/switchInfo.vue:527", "修改图片失败:", e);
        common_vendor.index.showToast({
          title: "修改失败",
          icon: "none"
        });
      } finally {
        common_vendor.index.hideLoading();
      }
    },
    // 删除图片
    async handleDeleteImage() {
      if (!this.switchImages.length) {
        common_vendor.index.showToast({
          title: "没有可删除的图片",
          icon: "none"
        });
        return;
      }
      common_vendor.index.showModal({
        title: "确认删除",
        content: "是否删除当前图片？",
        success: async (res) => {
          if (res.confirm) {
            try {
              common_vendor.index.showLoading({ title: "删除中..." });
              await common_vendor.er.callFunction({
                name: "switchApi",
                data: {
                  action: "updateSwitchImage",
                  switchId: this.switchData._id,
                  imageIndex: this.currentImageIndex,
                  imageInfo: null
                }
              });
              this.loadSwitchData(this.switchData._id);
              common_vendor.index.showToast({ title: "删除成功" });
            } catch (e) {
              common_vendor.index.__f__("error", "at pages/switchInfo/switchInfo.vue:569", "删除图片失败:", e);
              common_vendor.index.showToast({
                title: "删除失败",
                icon: "none"
              });
            } finally {
              common_vendor.index.hideLoading();
            }
          }
        }
      });
    },
    // 处理图片加载错误
    handleImageError(index) {
      common_vendor.index.__f__("log", "at pages/switchInfo/switchInfo.vue:584", "图片加载失败:", index);
      if (this.switchImages[index]) {
        this.$set(this.switchImages[index], "fileID", "/static/default_switch.webp");
      }
    },
    // 开始编辑图片
    startEditing() {
      if (!this.switchImages.length) {
        common_vendor.index.showToast({
          title: "暂无图片",
          icon: "none"
        });
        return;
      }
      this.isEditing = true;
    },
    // 确认编辑图片
    async handleEditConfirm() {
      try {
        await this.handleEditImage();
        this.isEditing = false;
      } catch (e) {
        common_vendor.index.__f__("error", "at pages/switchInfo/switchInfo.vue:609", "编辑图片失败:", e);
      }
    },
    // 添加图片并关闭编辑框
    async handleAddAndClose() {
      try {
        await this.handleAddImage();
        this.isEditing = false;
      } catch (e) {
        common_vendor.index.__f__("error", "at pages/switchInfo/switchInfo.vue:619", "添加图片失败:", e);
      }
    },
    // 处理触发区域点击
    handleTriggerTap() {
      this.triggerCount++;
      if (this.triggerCount >= 5) {
        this.triggerCount = 0;
        this.isEditing = true;
      }
    },
    // 切换到上一张图片
    handlePrevImage() {
      if (this.switchImages.length <= 1)
        return;
      this.currentImageIndex = (this.currentImageIndex - 1 + this.switchImages.length) % this.switchImages.length;
    },
    // 切换到下一张图片
    handleNextImage() {
      if (this.switchImages.length <= 1)
        return;
      this.currentImageIndex = (this.currentImageIndex + 1) % this.switchImages.length;
    },
    // 点击指示器切换图片
    handleIndicatorTap(index) {
      this.currentImageIndex = index;
    }
  }
};
if (!Array) {
  const _easycom_uni_list_item2 = common_vendor.resolveComponent("uni-list-item");
  const _component_related_keyboards_item = common_vendor.resolveComponent("related-keyboards-item");
  const _component_remark_item = common_vendor.resolveComponent("remark-item");
  const _easycom_uni_list2 = common_vendor.resolveComponent("uni-list");
  (_easycom_uni_list_item2 + _component_related_keyboards_item + _component_remark_item + _easycom_uni_list2)();
}
const _easycom_uni_list_item = () => "../../uni_modules/uni-list/components/uni-list-item/uni-list-item.js";
const _easycom_uni_list = () => "../../uni_modules/uni-list/components/uni-list/uni-list.js";
if (!Math) {
  (_easycom_uni_list_item + _easycom_uni_list)();
}
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return common_vendor.e({
    a: $data.isEditing
  }, $data.isEditing ? common_vendor.e({
    b: common_vendor.t($data.switchImages.length ? `(${$data.currentImageIndex + 1}/${$data.switchImages.length})` : ""),
    c: common_vendor.o(($event) => $data.isEditing = false),
    d: $data.switchImages.length > 1
  }, $data.switchImages.length > 1 ? {
    e: common_vendor.o((...args) => $options.handlePrevImage && $options.handlePrevImage(...args))
  } : {}, {
    f: $data.switchImages.length
  }, $data.switchImages.length ? {
    g: $options.currentImage.fileID || "/static/default_switch.webp"
  } : {}, {
    h: $data.switchImages.length > 1
  }, $data.switchImages.length > 1 ? {
    i: common_vendor.o((...args) => $options.handleNextImage && $options.handleNextImage(...args))
  } : {}, {
    j: common_vendor.o((...args) => $options.handleAddAndClose && $options.handleAddAndClose(...args)),
    k: $data.switchImages.length
  }, $data.switchImages.length ? {
    l: common_vendor.o((...args) => $options.handleEditConfirm && $options.handleEditConfirm(...args))
  } : {}, {
    m: $data.switchImages.length
  }, $data.switchImages.length ? {
    n: common_vendor.o((...args) => $options.handleDeleteImage && $options.handleDeleteImage(...args))
  } : {}, {
    o: common_vendor.o(($event) => $data.isEditing = false),
    p: $data.switchImages.length > 1
  }, $data.switchImages.length > 1 ? {
    q: common_vendor.f($data.switchImages, (_, index, i0) => {
      return {
        a: index,
        b: common_vendor.n({
          active: index === $data.currentImageIndex
        }),
        c: common_vendor.o(($event) => $options.handleIndicatorTap(index), index)
      };
    })
  } : {}) : {}, {
    r: common_vendor.o((...args) => $options.handleTriggerTap && $options.handleTriggerTap(...args)),
    s: common_vendor.f($data.switchImages, (image, index, i0) => {
      return {
        a: image.fileID ? image.fileID : "/static/default_switch.webp",
        b: common_vendor.o(($event) => $options.handleImageError(index), index),
        c: common_vendor.o(($event) => $options.handleImageLoad(index), index),
        d: index
      };
    }),
    t: !$data.switchImages.length
  }, !$data.switchImages.length ? {
    v: common_assets._imports_0
  } : {}, {
    w: !$data.isEditing,
    x: common_vendor.o((...args) => $options.handleSwiperChange && $options.handleSwiperChange(...args)),
    y: common_vendor.p({
      title: "轴体名称",
      ["right-text"]: $data.switchData.switch_name || "暂无"
    }),
    z: common_vendor.p({
      title: "代工厂",
      ["right-text"]: $data.switchData.manufacturer || "暂无"
    }),
    A: common_vendor.p({
      title: "轴体分类",
      ["right-text"]: $data.switchData.switch_type || "暂无"
    }),
    B: common_vendor.p({
      title: "上市时间",
      ["right-text"]: $data.switchData.release_date || "暂无"
    }),
    C: common_vendor.p({
      title: "价格",
      ["right-text"]: $options.getPriceText($data.switchData.price)
    }),
    D: common_vendor.p({
      title: "轴心材质",
      ["right-text"]: $data.switchData.stem_material || "暂无"
    }),
    E: common_vendor.p({
      title: "上盖材质",
      ["right-text"]: $data.switchData.top_housing_material || "暂无"
    }),
    F: common_vendor.p({
      title: "底壳材质",
      ["right-text"]: $data.switchData.bottom_housing_material || "暂无"
    }),
    G: common_vendor.p({
      title: "触发压力",
      ["right-text"]: $options.getForceText($data.switchData.actuation_force)
    }),
    H: common_vendor.p({
      title: "触发行程",
      ["right-text"]: $options.getDistanceText($data.switchData.actuation_travel)
    }),
    I: common_vendor.p({
      title: "触底压力",
      ["right-text"]: $options.getForceText($data.switchData.bottom_force)
    }),
    J: common_vendor.p({
      title: "触底行程",
      ["right-text"]: $options.getDistanceText($data.switchData.bottom_out_travel)
    }),
    K: common_vendor.p({
      title: "总行程",
      ["right-text"]: $options.getDistanceText($data.switchData.total_travel)
    }),
    L: common_vendor.p({
      title: "弹簧长度",
      ["right-text"]: $data.switchData.spring_length || "暂无"
    }),
    M: common_vendor.p({
      title: "出厂润滑",
      ["right-text"]: $data.switchData.factory_lube ? "是" : "否"
    }),
    N: common_vendor.p({
      title: "寿命",
      ["right-text"]: $data.switchData.lifespan || "暂无"
    }),
    O: common_vendor.p({
      title: "更新时间",
      ["right-text"]: $options.formatTime($data.switchData.update_time)
    }),
    P: common_vendor.p({
      title: "数据来源",
      ["right-text"]: $data.switchData.data_source || "暂无"
    }),
    Q: common_vendor.p({
      keyboards: $options.getRelatedKeyboards($data.switchData.related_keyboards)
    }),
    R: common_vendor.p({
      title: "停产",
      ["right-text"]: $data.switchData.discontinued ? "是" : "否"
    }),
    S: common_vendor.p({
      remark: $data.switchData.remark || "暂无"
    }),
    T: common_vendor.p({
      title: "审核状态",
      ["right-text"]: $data.switchData.audit_status || "暂无"
    })
  });
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/switchInfo/switchInfo.js.map
