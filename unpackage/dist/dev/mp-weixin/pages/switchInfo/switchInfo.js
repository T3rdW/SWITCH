"use strict";
const common_vendor = require("../../common/vendor.js");
const RelatedKeyboardsItem = () => "../../components/related-keyboards-item.js";
const RemarkItem = () => "../../components/remark-item.js";
const AUDIT_STATUS_MAP = {
  "pending": "未审核",
  "reviewing": "审核中",
  "approved": "已审核"
};
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
      isLoading: false,
      // 是否正在加载数据
      imageTypeOptions: [
        { text: "官方图", value: "official" },
        { text: "详情图", value: "detail" },
        { text: "上盖图", value: "top" },
        { text: "轴心图", value: "stem" },
        { text: "弹簧图", value: "spring" },
        { text: "底壳图", value: "bottom" },
        { text: "侧图", value: "side" },
        { text: "外壳图", value: "housing" },
        { text: "其他视图", value: "other" }
      ],
      MAX_WIDTH: 1280,
      MAX_HEIGHT: 1280,
      QUALITY: 0.8,
      waitForData: null,
      // 用于等待数据传递的Promise竞争
      isFavorited: false
      // 是否已收藏
    };
  },
  computed: {
    currentImage() {
      return this.switchImages[this.currentImageIndex] || {};
    }
  },
  onLoad(options) {
    if (options.id) {
      this.loadSwitchData(options.id);
    }
  },
  // 在页面显示时检查收藏状态
  onShow() {
    if (this.switchData._id) {
      this.checkFavoriteStatus();
    }
  },
  onUnload() {
    common_vendor.index.$off("switchData", this.handleSwitchData);
    this.waitForData = null;
  },
  methods: {
    // 处理图片加载成功
    handleImageLoad(index) {
    },
    // 处理传递来的轴体数据
    handleSwitchData(data) {
      if (this.switchData._id === data._id) {
        common_vendor.index.__f__("log", "at pages/switchInfo/switchInfo.vue:214", "已有相同数据，跳过更新:", {
          switchName: data.switch_name,
          id: data._id
        });
        return;
      }
      common_vendor.index.__f__("log", "at pages/switchInfo/switchInfo.vue:221", "接收到首页传递的数据:", {
        switchName: data.switch_name,
        id: data._id,
        imageCount: Array.isArray(data.preview_images) ? data.preview_images.length : 0
      });
      this.switchData = data;
      if (Array.isArray(data.preview_images)) {
        this.switchImages = data.preview_images.map((img) => {
          if (!img || !img.fileID) {
            return {
              fileID: "/static/default_switch.webp",
              type: "detail",
              fileName: "default_switch.webp",
              uploadTime: "",
              updateTime: ""
            };
          }
          return img;
        });
      } else {
        this.switchImages = [{
          fileID: "/static/default_switch.webp",
          type: "detail",
          fileName: "default_switch.webp",
          uploadTime: "",
          updateTime: ""
        }];
      }
      if (data.switch_name) {
        common_vendor.wx$1.setNavigationBarTitle({
          title: data.switch_name
        });
      }
      if (this.waitForData) {
        this.waitForData("received");
        this.waitForData = null;
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
    // 获取北京时间的 ISO 字符串
    getBeiJingISOString() {
      const now = /* @__PURE__ */ new Date();
      const offset = 8 * 60;
      const beijingTime = new Date(now.getTime() + (offset + now.getTimezoneOffset()) * 6e4);
      return beijingTime.toISOString().replace("Z", "+08:00");
    },
    // 格式化时间显示
    formatTime(timeStr) {
      if (!timeStr)
        return "暂无数据";
      try {
        const date = new Date(timeStr);
        return date.toLocaleString("zh-CN", {
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: false
        });
      } catch (e) {
        common_vendor.index.__f__("error", "at pages/switchInfo/switchInfo.vue:327", "时间格式化失败:", e);
        return timeStr;
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
        common_vendor.index.__f__("log", "at pages/switchInfo/switchInfo.vue:348", "开始压缩图片:", tempFilePath);
        const ext = tempFilePath.split(".").pop().toLowerCase();
        common_vendor.index.__f__("log", "at pages/switchInfo/switchInfo.vue:352", "图片格式:", ext);
        const fs = common_vendor.wx$1.getFileSystemManager();
        if (!tempFilePath || typeof tempFilePath !== "string") {
          throw new Error("无效的文件路径");
        }
        common_vendor.index.__f__("log", "at pages/switchInfo/switchInfo.vue:363", "准备获取图片信息...");
        const imageInfo = await new Promise((resolve, reject) => {
          common_vendor.wx$1.getImageInfo({
            src: tempFilePath,
            success: (res) => {
              common_vendor.index.__f__("log", "at pages/switchInfo/switchInfo.vue:368", "获取图片信息成功:", res);
              resolve(res);
            },
            fail: (error) => {
              common_vendor.index.__f__("error", "at pages/switchInfo/switchInfo.vue:372", "获取图片信息失败:", error);
              reject(new Error("获取图片信息失败"));
            }
          });
        });
        common_vendor.index.__f__("log", "at pages/switchInfo/switchInfo.vue:377", "原始图片信息:", imageInfo);
        const originalFileInfo = await new Promise((resolve, reject) => {
          fs.getFileInfo({
            filePath: tempFilePath,
            success: (res) => {
              common_vendor.index.__f__("log", "at pages/switchInfo/switchInfo.vue:384", "获取文件大小成功:", res);
              resolve(res);
            },
            fail: reject
          });
        });
        const originalSize = (originalFileInfo.size / 1024).toFixed(2);
        common_vendor.index.__f__("log", "at pages/switchInfo/switchInfo.vue:391", `原始图片大小: ${originalSize}KB, 尺寸: ${imageInfo.width}x${imageInfo.height}`);
        let targetWidth = imageInfo.width;
        let targetHeight = imageInfo.height;
        const maxSize = 1024;
        const minSize = 800;
        const quality = 50;
        let scale = 1;
        if (targetWidth > maxSize || targetHeight > maxSize) {
          const maxDimension = Math.max(targetWidth, targetHeight);
          scale = maxSize / maxDimension;
          common_vendor.index.__f__("log", "at pages/switchInfo/switchInfo.vue:408", "图片需要缩小，缩放比例:", scale);
        }
        if (targetWidth < minSize && targetHeight < minSize) {
          const minDimension = Math.min(targetWidth, targetHeight);
          scale = minSize / minDimension;
          common_vendor.index.__f__("log", "at pages/switchInfo/switchInfo.vue:416", "图片需要放大，缩放比例:", scale);
        }
        if (scale !== 1) {
          targetWidth = Math.round(targetWidth * scale);
          targetHeight = Math.round(targetHeight * scale);
          common_vendor.index.__f__("log", "at pages/switchInfo/switchInfo.vue:423", "应用缩放后的尺寸:", {
            width: targetWidth,
            height: targetHeight,
            scale
          });
        }
        common_vendor.index.__f__("log", "at pages/switchInfo/switchInfo.vue:430", "计算后的尺寸:", { width: targetWidth, height: targetHeight });
        const compressedPath = await new Promise((resolve, reject) => {
          common_vendor.wx$1.compressImage({
            src: tempFilePath,
            quality,
            compressedWidth: targetWidth,
            compressHeight: targetHeight,
            success: (res) => {
              common_vendor.index.__f__("log", "at pages/switchInfo/switchInfo.vue:440", "压缩图片成功:", res);
              resolve(res);
            },
            fail: reject
          });
        });
        const compressedInfo = await new Promise((resolve, reject) => {
          common_vendor.wx$1.getImageInfo({
            src: compressedPath.tempFilePath,
            success: resolve,
            fail: reject
          });
        });
        const finalFileInfo = await new Promise((resolve, reject) => {
          fs.getFileInfo({
            filePath: compressedPath.tempFilePath,
            success: resolve,
            fail: reject
          });
        });
        const compressedSize = (finalFileInfo.size / 1024).toFixed(2);
        common_vendor.index.__f__("log", "at pages/switchInfo/switchInfo.vue:466", `压缩完成:
						原始大小: ${originalSize}KB (${imageInfo.width}x${imageInfo.height})
						压缩后大小: ${compressedSize}KB (${compressedInfo.width}x${compressedInfo.height})
						压缩率: ${((1 - finalFileInfo.size / originalFileInfo.size) * 100).toFixed(2)}%
					`);
        return compressedPath.tempFilePath;
      } catch (e) {
        common_vendor.index.__f__("error", "at pages/switchInfo/switchInfo.vue:474", "压缩图片失败:", e);
        return tempFilePath;
      }
    },
    // 生成图片文件名
    getImageFileName(type = "detail", originalExt = "jpg") {
      let switchName = this.switchData.switch_name_en || this.switchData.switch_name || "unknown";
      const safeSwitchName = switchName.replace(/\s+/g, "_").replace(/[^a-zA-Z0-9_]/g, "").replace(/_+/g, "_").replace(/^_|_$/g, "");
      const now = /* @__PURE__ */ new Date();
      const timeString = now.getFullYear() + String(now.getMonth() + 1).padStart(2, "0") + String(now.getDate()).padStart(2, "0") + "_" + String(now.getHours()).padStart(2, "0") + String(now.getMinutes()).padStart(2, "0") + String(now.getSeconds()).padStart(2, "0");
      const random = Math.random().toString(36).substring(2, 8);
      let typePrefix = "";
      if (type === "other") {
        const otherViewCount = this.switchImages.filter((img) => img.type === "other").length;
        typePrefix = `other${otherViewCount + 1}`;
      } else {
        const prefixMap = {
          detail: "detail",
          top: "top",
          stem: "stem",
          spring: "spring",
          bottom: "bottom",
          side: "side",
          housing: "housing"
        };
        typePrefix = prefixMap[type] || "other1";
      }
      return `${safeSwitchName}_${typePrefix}_${timeString}_${random}.${originalExt}`;
    },
    // 从文件名解析图片类型
    getTypeFromFileName(fileName) {
      if (!fileName)
        return "detail";
      const typeMatches = {
        "detail": "detail",
        "top": "top",
        "stem": "stem",
        "spring": "spring",
        "bottom": "bottom",
        "side": "side",
        "housing": "housing",
        "other1": "other",
        "other2": "other",
        "other3": "other"
      };
      for (const [typeId, type] of Object.entries(typeMatches)) {
        if (fileName.includes(`_${typeId}_`)) {
          return type;
        }
      }
      const legacyMatches = {
        "_dt_": "detail",
        "_tp_": "top",
        "_st_": "stem",
        "_sp_": "spring",
        "_bt_": "bottom",
        "_sd_": "side",
        "_hs_": "housing",
        "_ot1_": "other",
        "_ot2_": "other",
        "_ot3_": "other"
      };
      for (const [typeId, type] of Object.entries(legacyMatches)) {
        if (fileName.includes(typeId)) {
          return type;
        }
      }
      return "detail";
    },
    // 处理添加图片
    async handleAddImage() {
      try {
        const res = await common_vendor.index.chooseImage({
          count: 1,
          sizeType: ["compressed"],
          sourceType: ["album", "camera"]
        });
        if (!res || !res.tempFilePaths || !res.tempFilePaths.length) {
          common_vendor.index.__f__("log", "at pages/switchInfo/switchInfo.vue:590", "用户取消选择图片");
          return;
        }
        common_vendor.index.showLoading({
          title: "处理中...",
          mask: true
        });
        const compressedPath = await this.compressImage(res.tempFilePaths[0]);
        const fileName = this.getImageFileName("detail", compressedPath.split(".").pop());
        const uploadRes = await common_vendor.er.uploadFile({
          filePath: compressedPath,
          cloudPath: fileName
        });
        const imageInfo = {
          fileID: uploadRes.fileID,
          type: "detail",
          fileName,
          uploadTime: this.getBeiJingISOString(),
          updateTime: this.getBeiJingISOString()
        };
        await this.updateSwitchImage(imageInfo);
        common_vendor.index.hideLoading();
        common_vendor.index.showToast({
          title: "添加成功",
          icon: "success"
        });
      } catch (e) {
        if (e.errMsg === "chooseImage:fail cancel") {
          common_vendor.index.__f__("log", "at pages/switchInfo/switchInfo.vue:632", "用户取消选择图片");
          return;
        }
        common_vendor.index.__f__("error", "at pages/switchInfo/switchInfo.vue:636", "添加图片失败:", e);
        common_vendor.index.hideLoading();
        common_vendor.index.showToast({
          title: e.message || "添加失败",
          icon: "none"
        });
      }
    },
    // 删除云存储中的文件
    async deleteCloudFile(fileID) {
      if (!fileID || fileID.includes("default_switch.webp")) {
        return;
      }
      try {
        const result = await common_vendor.er.callFunction({
          name: "switchApi",
          data: {
            action: "deleteCloudFile",
            fileList: [fileID]
          }
        });
        if (result.result.errCode === 0) {
          common_vendor.index.__f__("log", "at pages/switchInfo/switchInfo.vue:661", "文件删除成功:", fileID, result);
          return true;
        } else {
          throw new Error(result.result.errMsg);
        }
      } catch (error) {
        common_vendor.index.__f__("error", "at pages/switchInfo/switchInfo.vue:667", "文件删除失败:", error);
        return false;
      }
    },
    // 处理编辑图片
    async handleEditConfirm() {
      try {
        const res = await new Promise((resolve, reject) => {
          common_vendor.wx$1.chooseImage({
            count: 1,
            sizeType: ["original", "compressed"],
            sourceType: ["album", "camera"],
            success: resolve,
            fail: (error) => {
              if (error.errMsg.includes("cancel")) {
                reject(new Error("cancel"));
              } else {
                reject(error);
              }
            }
          });
        });
        const tempFilePath = res.tempFilePaths[0];
        common_vendor.index.__f__("log", "at pages/switchInfo/switchInfo.vue:694", "选择的图片:", tempFilePath);
        const compressedPath = await this.compressImage(tempFilePath);
        const originalExt = "jpg";
        const fileName = this.getImageFileName("detail", originalExt);
        const cloudPath = fileName;
        common_vendor.index.showLoading({ title: "上传中..." });
        const oldFileID = this.switchImages[this.currentImageIndex].fileID;
        const uploadResult = await common_vendor.er.uploadFile({
          filePath: compressedPath,
          cloudPath
        });
        await this.deleteCloudFile(oldFileID);
        const imageInfo = {
          fileID: uploadResult.fileID,
          type: this.switchImages[this.currentImageIndex].type,
          fileName,
          uploadTime: this.getBeiJingISOString(),
          updateTime: this.getBeiJingISOString()
        };
        const { result: updateResult } = await common_vendor.er.callFunction({
          name: "switchApi",
          data: {
            action: "updateSwitchImage",
            switchId: this.switchData._id,
            imageIndex: this.currentImageIndex,
            imageInfo
          }
        });
        if (!updateResult || updateResult.errCode !== 0) {
          throw new Error((updateResult == null ? void 0 : updateResult.errMsg) || "更新失败");
        }
        this.$set(this.switchImages, this.currentImageIndex, imageInfo);
        this.switchData.preview_images = this.switchImages;
        this.$forceUpdate();
        common_vendor.index.showToast({ title: "更换成功" });
      } catch (e) {
        if (e.message === "cancel") {
          common_vendor.index.__f__("log", "at pages/switchInfo/switchInfo.vue:756", "用户取消选择图片");
          return;
        }
        common_vendor.index.__f__("error", "at pages/switchInfo/switchInfo.vue:760", "编辑图片失败:", e);
        common_vendor.index.showToast({
          title: "编辑图片失败",
          icon: "none"
        });
      } finally {
        common_vendor.index.hideLoading();
      }
    },
    // 处理删除图片
    async handleDeleteImage() {
      try {
        common_vendor.index.__f__("log", "at pages/switchInfo/switchInfo.vue:773", "开始删除图片操作");
        const currentImage = this.switchImages[this.currentImageIndex];
        common_vendor.index.__f__("log", "at pages/switchInfo/switchInfo.vue:776", "当前图片信息:", currentImage);
        if (!currentImage.fileID) {
          common_vendor.index.showToast({
            title: "默认图片不能删除",
            icon: "none"
          });
          return;
        }
        const confirmRes = await common_vendor.index.showModal({
          title: "确认删除",
          content: "确定要删除这张图片吗？",
          confirmText: "删除",
          confirmColor: "#f44336"
        });
        if (!confirmRes.confirm) {
          common_vendor.index.__f__("log", "at pages/switchInfo/switchInfo.vue:796", "用户取消删除");
          return;
        }
        common_vendor.index.__f__("log", "at pages/switchInfo/switchInfo.vue:800", "准备调用云函数删除图片:", {
          switchId: this.switchData._id,
          imageIndex: this.currentImageIndex,
          fileID: currentImage.fileID
        });
        const { result } = await common_vendor.er.callFunction({
          name: "switchApi",
          data: {
            action: "deleteSwitchImage",
            switchId: this.switchData._id,
            imageIndex: this.currentImageIndex,
            fileID: currentImage.fileID
          }
        });
        common_vendor.index.__f__("log", "at pages/switchInfo/switchInfo.vue:817", "云函数返回结果:", result);
        if (!result || result.errCode !== 0) {
          throw new Error((result == null ? void 0 : result.errMsg) || "删除失败");
        }
        const newImages = [...this.switchImages];
        newImages.splice(this.currentImageIndex, 1);
        this.switchImages = newImages;
        this.switchData.preview_images = newImages;
        if (this.switchImages.length > 0) {
          this.currentImageIndex = Math.min(this.currentImageIndex, this.switchImages.length - 1);
        } else {
          this.currentImageIndex = 0;
        }
        this.isEditing = false;
        common_vendor.index.showToast({
          title: "删除成功",
          icon: "success"
        });
      } catch (e) {
        common_vendor.index.__f__("error", "at pages/switchInfo/switchInfo.vue:847", "删除图片失败:", e);
        common_vendor.index.showToast({
          title: e.message || "删除失败",
          icon: "none"
        });
      }
    },
    // 处理图片加载错误
    handleImageError(index) {
      common_vendor.index.__f__("error", "at pages/switchInfo/switchInfo.vue:857", "图片加载失败:", index, {
        fileID: this.switchImages[index].fileID,
        type: this.switchImages[index].type
      });
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
    },
    // 获取图片类型文本
    getImageTypeText(type) {
      const option = this.imageTypeOptions.find((opt) => opt.value === type);
      return option ? option.text : type;
    },
    // 处理类型选择
    async handleTypeChange(e) {
      const selectedType = this.imageTypeOptions[e.detail.value].value;
      const currentImage = this.switchImages[this.currentImageIndex];
      try {
        const imageInfo = {
          ...currentImage,
          type: selectedType,
          updateTime: this.getBeiJingISOString()
        };
        const { result } = await common_vendor.er.callFunction({
          name: "switchApi",
          data: {
            action: "updateSwitchImage",
            switchId: this.switchData._id,
            imageIndex: this.currentImageIndex,
            imageInfo
          }
        });
        if (!result || result.errCode !== 0) {
          throw new Error((result == null ? void 0 : result.errMsg) || "更新失败");
        }
        this.$set(this.switchImages, this.currentImageIndex, imageInfo);
        common_vendor.index.showToast({
          title: "类型修改成功",
          icon: "success"
        });
      } catch (e2) {
        common_vendor.index.__f__("error", "at pages/switchInfo/switchInfo.vue:948", "修改图片类型失败:", e2);
        common_vendor.index.showToast({
          title: e2.message || "修改失败",
          icon: "none"
        });
      }
    },
    // 获取图片类型索引
    getTypeIndex(type) {
      return this.imageTypeOptions.findIndex((option) => option.value === type);
    },
    // 添加通过 ID 加载数据的方法
    async loadSwitchData(id) {
      try {
        this.isLoading = true;
        const { result } = await common_vendor.er.callFunction({
          name: "switchApi",
          data: {
            action: "getSwitchById",
            id
          }
        });
        if (result.errCode === 0 && result.data) {
          this.switchData = result.data;
          if (Array.isArray(this.switchData.preview_images)) {
            this.switchImages = [...this.switchData.preview_images];
          } else {
            this.switchImages = [];
          }
          this.$nextTick(() => {
            this.checkFavoriteStatus();
          });
        } else {
          common_vendor.index.showToast({
            title: "获取数据失败",
            icon: "none"
          });
        }
      } catch (e) {
        common_vendor.index.__f__("error", "at pages/switchInfo/switchInfo.vue:994", "加载轴体数据失败:", e);
        common_vendor.index.showToast({
          title: "加载失败",
          icon: "none"
        });
      } finally {
        this.isLoading = false;
      }
    },
    // 处理图片点击预览
    async handleImageTap(index) {
      if (this.isEditing) {
        return;
      }
      try {
        const urls = this.switchImages.filter((img) => img.fileID && img.fileID !== "/static/default_switch.webp").map((img) => img.fileID);
        if (urls.length === 0) {
          common_vendor.index.showToast({
            title: "无可预览图片",
            icon: "none"
          });
          return;
        }
        const currentFileID = this.switchImages[index].fileID;
        common_vendor.wx$1.previewImage({
          current: currentFileID,
          // 当前显示图片的URL
          urls,
          // 所有图片的URL列表
          success: () => {
            common_vendor.index.__f__("log", "at pages/switchInfo/switchInfo.vue:1034", "预览图片成功");
          },
          fail: (error) => {
            common_vendor.index.__f__("error", "at pages/switchInfo/switchInfo.vue:1037", "预览图片失败:", error);
            common_vendor.index.showToast({
              title: "预览失败",
              icon: "none"
            });
          }
        });
      } catch (error) {
        common_vendor.index.__f__("error", "at pages/switchInfo/switchInfo.vue:1045", "处理图片预览失败:", error);
        common_vendor.index.showToast({
          title: error.message || "预览失败",
          icon: "none"
        });
      }
    },
    // 处理设置主图
    async handleSetMainImage() {
      try {
        const currentIndex = this.currentImageIndex;
        const allImages = this.switchImages;
        if (currentIndex === 0) {
          common_vendor.index.showToast({
            title: "已经是主图",
            icon: "none"
          });
          return;
        }
        const confirmRes = await common_vendor.index.showModal({
          title: "设为主图",
          content: "确定要将当前图片设为主图吗？",
          confirmText: "确定",
          confirmColor: "#4CAF50"
        });
        if (!confirmRes.confirm) {
          return;
        }
        const currentImage = allImages[currentIndex];
        const newImages = [...allImages];
        newImages.splice(currentIndex, 1);
        newImages.unshift({
          ...currentImage,
          type: "detail",
          updateTime: this.getBeiJingISOString()
        });
        const { result: updateResult } = await common_vendor.er.callFunction({
          name: "switchApi",
          data: {
            action: "updateSwitchImages",
            switchId: this.switchData._id,
            images: newImages
          }
        });
        if (!updateResult || updateResult.errCode !== 0) {
          throw new Error((updateResult == null ? void 0 : updateResult.errMsg) || "设置失败");
        }
        this.switchImages = newImages;
        this.switchData.preview_images = [...this.switchImages];
        this.currentImageIndex = 0;
        this.$forceUpdate();
        common_vendor.index.showToast({
          title: "设置成功",
          icon: "success"
        });
      } catch (e) {
        common_vendor.index.__f__("error", "at pages/switchInfo/switchInfo.vue:1124", "设置主图失败:", e);
        common_vendor.index.showToast({
          title: "设置失败",
          icon: "none"
        });
      }
    },
    // 获取审核状态文本
    getAuditStatusText(status) {
      return AUDIT_STATUS_MAP[status] || "未审核";
    },
    // 处理收藏按钮点击
    async handleFavorite() {
      var _a;
      const app = getApp();
      if (!((_a = app.globalData.userInfo) == null ? void 0 : _a.openid)) {
        common_vendor.index.__f__("log", "at pages/switchInfo/switchInfo.vue:1143", "用户未登录");
        common_vendor.index.showToast({
          title: "请先登录",
          icon: "none"
        });
        return;
      }
      try {
        const { result } = await common_vendor.er.callFunction({
          name: "switchApi",
          data: {
            action: "toggleFavorite",
            switchId: this.switchData._id,
            openid: app.globalData.userInfo.openid
          }
        });
        if (result.errCode === 0) {
          this.isFavorited = result.isFavorited;
          if (result.isFavorited) {
            app.globalData.favorites.push({
              switchId: this.switchData._id,
              createTime: /* @__PURE__ */ new Date()
            });
            common_vendor.index.__f__("log", "at pages/switchInfo/switchInfo.vue:1171", "添加到全局收藏:", this.switchData._id);
          } else {
            const index = app.globalData.favorites.findIndex((item) => item.switchId === this.switchData._id);
            if (index !== -1) {
              app.globalData.favorites.splice(index, 1);
              common_vendor.index.__f__("log", "at pages/switchInfo/switchInfo.vue:1177", "从全局收藏中移除:", this.switchData._id);
            }
          }
          common_vendor.index.showToast({
            title: result.isFavorited ? "收藏成功" : "已取消收藏",
            icon: "success"
          });
        } else {
          common_vendor.index.showToast({
            title: result.errMsg || "操作失败",
            icon: "none"
          });
        }
      } catch (e) {
        common_vendor.index.__f__("error", "at pages/switchInfo/switchInfo.vue:1192", "收藏操作失败:", e);
        common_vendor.index.showToast({
          title: "操作失败",
          icon: "none"
        });
      }
    },
    // 检查收藏状态
    async checkFavoriteStatus() {
      var _a;
      const app = getApp();
      if (!((_a = app.globalData.userInfo) == null ? void 0 : _a.openid) || !this.switchData._id)
        return;
      if (app.globalData.favorites && app.globalData.favorites.length > 0) {
        const found = app.globalData.favorites.some((item) => item.switchId === this.switchData._id);
        if (found) {
          this.isFavorited = true;
          common_vendor.index.__f__("log", "at pages/switchInfo/switchInfo.vue:1210", "从全局数据中确认已收藏");
          return;
        }
      }
      try {
        const { result } = await common_vendor.er.callFunction({
          name: "switchApi",
          data: {
            action: "checkFavorite",
            switchId: this.switchData._id,
            openid: app.globalData.userInfo.openid
          }
        });
        if (result.errCode === 0) {
          this.isFavorited = result.isFavorited;
          common_vendor.index.__f__("log", "at pages/switchInfo/switchInfo.vue:1227", "收藏状态:", this.isFavorited);
        }
      } catch (e) {
        common_vendor.index.__f__("error", "at pages/switchInfo/switchInfo.vue:1230", "检查收藏状态失败:", e);
      }
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
    a: common_vendor.t($data.isFavorited ? "♥" : "♡"),
    b: common_vendor.n({
      "is-favorited": $data.isFavorited
    }),
    c: common_vendor.o((...args) => $options.handleFavorite && $options.handleFavorite(...args)),
    d: $data.isEditing
  }, $data.isEditing ? common_vendor.e({
    e: common_vendor.t($data.switchImages.length ? `(${$data.currentImageIndex + 1}/${$data.switchImages.length})` : ""),
    f: common_vendor.o(($event) => $data.isEditing = false),
    g: $options.currentImage.fileID
  }, $options.currentImage.fileID ? {
    h: common_vendor.t($options.currentImage.type ? $options.getImageTypeText($options.currentImage.type) : "选择类型"),
    i: $data.imageTypeOptions,
    j: $options.getTypeIndex($options.currentImage.type),
    k: common_vendor.o((...args) => $options.handleTypeChange && $options.handleTypeChange(...args))
  } : {}, {
    l: $data.switchImages.length > 1
  }, $data.switchImages.length > 1 ? {
    m: common_vendor.o((...args) => $options.handlePrevImage && $options.handlePrevImage(...args))
  } : {}, {
    n: $data.switchImages.length
  }, $data.switchImages.length ? {
    o: $options.currentImage.fileID || "/static/default_switch.webp"
  } : {}, {
    p: $data.switchImages.length > 1
  }, $data.switchImages.length > 1 ? {
    q: common_vendor.o((...args) => $options.handleNextImage && $options.handleNextImage(...args))
  } : {}, {
    r: common_vendor.o((...args) => $options.handleAddImage && $options.handleAddImage(...args)),
    s: $data.switchImages.length
  }, $data.switchImages.length ? {
    t: common_vendor.o((...args) => $options.handleEditConfirm && $options.handleEditConfirm(...args))
  } : {}, {
    v: $data.switchImages.length > 1 && $data.currentImageIndex !== 0
  }, $data.switchImages.length > 1 && $data.currentImageIndex !== 0 ? {
    w: common_vendor.o((...args) => $options.handleSetMainImage && $options.handleSetMainImage(...args))
  } : {}, {
    x: $data.switchImages.length
  }, $data.switchImages.length ? {
    y: common_vendor.o((...args) => $options.handleDeleteImage && $options.handleDeleteImage(...args))
  } : {}, {
    z: common_vendor.o(($event) => $data.isEditing = false),
    A: $data.switchImages.length > 1
  }, $data.switchImages.length > 1 ? {
    B: common_vendor.f($data.switchImages, (_, index, i0) => {
      return {
        a: index,
        b: common_vendor.n({
          active: index === $data.currentImageIndex
        }),
        c: common_vendor.o(($event) => $options.handleIndicatorTap(index), index)
      };
    })
  } : {}) : {}, {
    C: common_vendor.o((...args) => $options.handleTriggerTap && $options.handleTriggerTap(...args)),
    D: common_vendor.f($data.switchImages, (image, index, i0) => {
      return common_vendor.e({
        a: image.fileID ? image.fileID : "/static/default_switch.webp",
        b: common_vendor.o(($event) => $options.handleImageError(index), index),
        c: common_vendor.o(($event) => $options.handleImageLoad(index), index),
        d: common_vendor.o(($event) => $options.handleImageTap(index), index),
        e: image.type
      }, image.type ? {
        f: common_vendor.t($options.getImageTypeText(image.type))
      } : {}, {
        g: index
      });
    }),
    E: !$data.isEditing,
    F: common_vendor.o((...args) => $options.handleSwiperChange && $options.handleSwiperChange(...args)),
    G: common_vendor.p({
      title: "轴体名称",
      ["right-text"]: $data.switchData.switch_name || "暂无"
    }),
    H: common_vendor.p({
      title: "代工厂",
      ["right-text"]: $data.switchData.manufacturer || "暂无"
    }),
    I: common_vendor.p({
      title: "轴体分类",
      ["right-text"]: $data.switchData.switch_type || "暂无"
    }),
    J: common_vendor.p({
      title: "上市时间",
      ["right-text"]: $data.switchData.release_date || "暂无"
    }),
    K: common_vendor.p({
      title: "价格",
      ["right-text"]: $options.getPriceText($data.switchData.price)
    }),
    L: common_vendor.p({
      title: "轴心材质",
      ["right-text"]: $data.switchData.stem_material || "暂无"
    }),
    M: common_vendor.p({
      title: "上盖材质",
      ["right-text"]: $data.switchData.top_housing_material || "暂无"
    }),
    N: common_vendor.p({
      title: "底壳材质",
      ["right-text"]: $data.switchData.bottom_housing_material || "暂无"
    }),
    O: common_vendor.p({
      title: "触发压力",
      ["right-text"]: $options.getForceText($data.switchData.actuation_force)
    }),
    P: common_vendor.p({
      title: "触发行程",
      ["right-text"]: $options.getDistanceText($data.switchData.actuation_travel)
    }),
    Q: common_vendor.p({
      title: "触底压力",
      ["right-text"]: $options.getForceText($data.switchData.bottom_force)
    }),
    R: common_vendor.p({
      title: "触底行程",
      ["right-text"]: $options.getDistanceText($data.switchData.bottom_out_travel)
    }),
    S: common_vendor.p({
      title: "总行程",
      ["right-text"]: $options.getDistanceText($data.switchData.total_travel)
    }),
    T: common_vendor.p({
      title: "弹簧长度",
      ["right-text"]: $data.switchData.spring_length || "暂无"
    }),
    U: common_vendor.p({
      title: "出厂润滑",
      ["right-text"]: $data.switchData.factory_lube ? "是" : "否"
    }),
    V: common_vendor.p({
      title: "寿命",
      ["right-text"]: $data.switchData.lifespan || "暂无"
    }),
    W: common_vendor.p({
      title: "最后更新时间",
      ["right-text"]: $options.formatTime($data.switchData.update_time)
    }),
    X: common_vendor.p({
      title: "数据来源",
      ["right-text"]: $data.switchData.data_source || "互联网"
    }),
    Y: common_vendor.p({
      keyboards: $options.getRelatedKeyboards($data.switchData.related_keyboards)
    }),
    Z: common_vendor.p({
      title: "停产",
      ["right-text"]: $data.switchData.discontinued ? "是" : "否"
    }),
    aa: common_vendor.p({
      remark: $data.switchData.remark || ""
    }),
    ab: common_vendor.p({
      title: "审核状态",
      ["right-text"]: $options.getAuditStatusText($data.switchData.audit_status)
    })
  });
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/switchInfo/switchInfo.js.map
