"use strict";
const common_vendor = require("../../common/vendor.js");
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
      isLoading: false,
      // 是否正在加载数据
      imageTypeOptions: [
        { text: "官方图", value: "official" },
        { text: "详情图", value: "detail" },
        { text: "上盖图", value: "top" },
        { text: "轴心图", value: "stem" },
        { text: "弹簧图", value: "spring" },
        { text: "更多类型...", value: "more" }
      ],
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
    common_vendor.index.__f__("log", "at pages/switchInfo/switchInfo.vue:164", "详情页面加载, 参数:", options);
    common_vendor.index.$on("switchData", this.handleSwitchData);
    if (options.id) {
      common_vendor.index.__f__("log", "at pages/switchInfo/switchInfo.vue:170", "准备使用 ID 加载数据:", options.id);
      setTimeout(() => {
        if (!this.switchData._id) {
          common_vendor.index.__f__("log", "at pages/switchInfo/switchInfo.vue:174", "未收到数据，从服务器加载");
          this.loadSwitchDataById(options.id);
        }
      }, 200);
    }
  },
  onUnload() {
    common_vendor.index.$off("switchData", this.handleSwitchData);
  },
  methods: {
    // 处理图片加载成功
    handleImageLoad(index) {
      common_vendor.index.__f__("log", "at pages/switchInfo/switchInfo.vue:189", "图片加载成功:", index, {
        fileID: this.switchImages[index].fileID,
        type: this.switchImages[index].type
      });
    },
    // 处理传递来的轴体数据
    handleSwitchData(data) {
      common_vendor.index.__f__("log", "at pages/switchInfo/switchInfo.vue:197", "接收到轴体数据:", data);
      common_vendor.index.__f__("log", "at pages/switchInfo/switchInfo.vue:199", "原始 preview_images:", data.preview_images);
      if (this.switchData._id === data._id) {
        common_vendor.index.__f__("log", "at pages/switchInfo/switchInfo.vue:203", "已有相同数据，跳过更新");
        return;
      }
      this.switchData = data;
      if (Array.isArray(data.preview_images)) {
        this.switchImages = data.preview_images.map((img) => {
          if (!img || !img.fileID) {
            common_vendor.index.__f__("log", "at pages/switchInfo/switchInfo.vue:213", "发现无效图片数据，使用默认图片:", img);
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
        common_vendor.index.__f__("log", "at pages/switchInfo/switchInfo.vue:224", "处理后的图片数组:", this.switchImages);
      } else {
        common_vendor.index.__f__("log", "at pages/switchInfo/switchInfo.vue:226", "preview_images 不是数组:", data.preview_images);
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
    // 获取北京时间的 ISO 格式字符串
    getBeiJingISOString() {
      const now = /* @__PURE__ */ new Date();
      const beijingDate = new Date(now.getTime() + 8 * 60 * 60 * 1e3);
      return beijingDate.toISOString().slice(0, 19).replace("Z", "");
    },
    // 格式化时间
    formatTime(time) {
      if (!time)
        return "暂无数据";
      try {
        if (time.includes("T")) {
          return time.replace("T", " ").slice(0, 19);
        }
        const date = new Date(time);
        const beijingDate = new Date(date.getTime() + 8 * 60 * 60 * 1e3);
        return beijingDate.toISOString().slice(0, 19).replace("Z", "");
      } catch (e) {
        common_vendor.index.__f__("error", "at pages/switchInfo/switchInfo.vue:300", "时间格式化失败:", e);
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
        common_vendor.index.__f__("log", "at pages/switchInfo/switchInfo.vue:321", "开始压缩图片:", tempFilePath);
        const ext = tempFilePath.split(".").pop().toLowerCase();
        common_vendor.index.__f__("log", "at pages/switchInfo/switchInfo.vue:325", "图片格式:", ext);
        const fs = common_vendor.wx$1.getFileSystemManager();
        if (!tempFilePath || typeof tempFilePath !== "string") {
          throw new Error("无效的文件路径");
        }
        common_vendor.index.__f__("log", "at pages/switchInfo/switchInfo.vue:336", "准备获取图片信息...");
        const imageInfo = await new Promise((resolve, reject) => {
          common_vendor.wx$1.getImageInfo({
            src: tempFilePath,
            success: (res) => {
              common_vendor.index.__f__("log", "at pages/switchInfo/switchInfo.vue:341", "获取图片信息成功:", res);
              resolve(res);
            },
            fail: (error) => {
              common_vendor.index.__f__("error", "at pages/switchInfo/switchInfo.vue:345", "获取图片信息失败:", error);
              reject(new Error("获取图片信息失败"));
            }
          });
        });
        common_vendor.index.__f__("log", "at pages/switchInfo/switchInfo.vue:350", "原始图片信息:", imageInfo);
        const originalFileInfo = await new Promise((resolve, reject) => {
          fs.getFileInfo({
            filePath: tempFilePath,
            success: (res) => {
              common_vendor.index.__f__("log", "at pages/switchInfo/switchInfo.vue:357", "获取文件大小成功:", res);
              resolve(res);
            },
            fail: reject
          });
        });
        const originalSize = (originalFileInfo.size / 1024).toFixed(2);
        common_vendor.index.__f__("log", "at pages/switchInfo/switchInfo.vue:364", `原始图片大小: ${originalSize}KB, 尺寸: ${imageInfo.width}x${imageInfo.height}`);
        let targetWidth = imageInfo.width;
        let targetHeight = imageInfo.height;
        const maxSize = 1024;
        const minSize = 800;
        const quality = 50;
        let scale = 1;
        if (targetWidth > maxSize || targetHeight > maxSize) {
          const maxDimension = Math.max(targetWidth, targetHeight);
          scale = maxSize / maxDimension;
          common_vendor.index.__f__("log", "at pages/switchInfo/switchInfo.vue:381", "图片需要缩小，缩放比例:", scale);
        }
        if (targetWidth < minSize && targetHeight < minSize) {
          const minDimension = Math.min(targetWidth, targetHeight);
          scale = minSize / minDimension;
          common_vendor.index.__f__("log", "at pages/switchInfo/switchInfo.vue:389", "图片需要放大，缩放比例:", scale);
        }
        if (scale !== 1) {
          targetWidth = Math.round(targetWidth * scale);
          targetHeight = Math.round(targetHeight * scale);
          common_vendor.index.__f__("log", "at pages/switchInfo/switchInfo.vue:396", "应用缩放后的尺寸:", {
            width: targetWidth,
            height: targetHeight,
            scale
          });
        }
        common_vendor.index.__f__("log", "at pages/switchInfo/switchInfo.vue:403", "计算后的尺寸:", { width: targetWidth, height: targetHeight });
        const compressedPath = await new Promise((resolve, reject) => {
          common_vendor.wx$1.compressImage({
            src: tempFilePath,
            quality,
            compressedWidth: targetWidth,
            compressHeight: targetHeight,
            success: (res) => {
              common_vendor.index.__f__("log", "at pages/switchInfo/switchInfo.vue:413", "压缩图片成功:", res);
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
        common_vendor.index.__f__("log", "at pages/switchInfo/switchInfo.vue:439", `压缩完成:
						原始大小: ${originalSize}KB (${imageInfo.width}x${imageInfo.height})
						压缩后大小: ${compressedSize}KB (${compressedInfo.width}x${compressedInfo.height})
						压缩率: ${((1 - finalFileInfo.size / originalFileInfo.size) * 100).toFixed(2)}%
					`);
        return compressedPath.tempFilePath;
      } catch (e) {
        common_vendor.index.__f__("error", "at pages/switchInfo/switchInfo.vue:447", "压缩图片失败:", e);
        return tempFilePath;
      }
    },
    // 生成图片文件名
    getImageFileName(type, originalExt = "jpg") {
      const now = /* @__PURE__ */ new Date();
      const timeString = now.getFullYear() + String(now.getMonth() + 1).padStart(2, "0") + String(now.getDate()).padStart(2, "0") + "_" + String(now.getHours()).padStart(2, "0") + String(now.getMinutes()).padStart(2, "0") + String(now.getSeconds()).padStart(2, "0");
      const random = Math.random().toString(36).substring(2, 8);
      const typePrefix = type === "other" ? `other${this.switchImages.filter((img) => img.type === "other").length + 1}` : type;
      return `${typePrefix}_${timeString}_${random}.${originalExt}`;
    },
    // 获取图片类型文本
    getImageTypeText(type) {
      const option = this.imageTypeOptions.find((opt) => opt.value === type);
      return option ? option.text : "未知类型";
    },
    // 修改图片类型
    async handleChangeImageType() {
      try {
        const imageTypes = [
          { text: "官方图", value: "official" },
          { text: "详情图", value: "detail" },
          { text: "上盖图", value: "top" },
          { text: "轴心图", value: "stem" },
          { text: "弹簧图", value: "spring" },
          { text: "更多类型...", value: "more" }
        ];
        const result = await new Promise((resolve, reject) => {
          common_vendor.index.showActionSheet({
            itemList: imageTypes.map((t) => t.text),
            itemColor: "#000000",
            success: resolve,
            fail: (err) => {
              if (err.errMsg.includes("fail cancel")) {
                resolve({ tapIndex: -1 });
              } else {
                reject(err);
              }
            }
          });
        });
        if (result.tapIndex === -1) {
          return;
        }
        let selectedType = imageTypes[result.tapIndex].value;
        if (selectedType === "more") {
          const moreTypes = [
            { text: "底壳图", value: "bottom" },
            { text: "侧图", value: "side" },
            { text: "外壳图", value: "housing" },
            { text: "其他视图", value: "other" }
          ];
          const moreResult = await new Promise((resolve, reject) => {
            common_vendor.index.showActionSheet({
              itemList: moreTypes.map((t) => t.text),
              itemColor: "#000000",
              success: resolve,
              fail: (err) => {
                if (err.errMsg.includes("fail cancel")) {
                  resolve({ tapIndex: -1 });
                } else {
                  reject(err);
                }
              }
            });
          });
          if (moreResult.tapIndex === -1 || moreTypes[moreResult.tapIndex].value === "back") {
            this.handleChangeImageType();
            return;
          }
          selectedType = moreTypes[moreResult.tapIndex].value;
        }
        if (selectedType === "other" && this.currentImage.type !== "other") {
          const otherViewCount = this.switchImages.filter((img) => img.type === "other").length;
          if (otherViewCount >= 3) {
            common_vendor.index.showToast({
              title: "其他视图最多只能有3张",
              icon: "none"
            });
            return;
          }
        }
        const originalExt = "jpg";
        const newFileName = this.getImageFileName(selectedType, originalExt);
        const imageInfo = {
          ...this.currentImage,
          type: selectedType,
          fileName: newFileName,
          updateTime: this.getBeiJingISOString()
        };
        const { result: updateTypeResult } = await common_vendor.er.callFunction({
          name: "switchApi",
          data: {
            action: "updateSwitchImage",
            switchId: this.switchData._id,
            imageIndex: this.currentImageIndex,
            imageInfo
          }
        });
        if (!updateTypeResult || updateTypeResult.errCode !== 0) {
          throw new Error((updateTypeResult == null ? void 0 : updateTypeResult.errMsg) || "更新失败");
        }
        this.$set(this.switchImages, this.currentImageIndex, imageInfo);
        this.switchData.preview_images = this.switchImages;
        this.$forceUpdate();
        common_vendor.index.showToast({
          title: "类型修改成功",
          icon: "success"
        });
      } catch (e) {
        common_vendor.index.__f__("error", "at pages/switchInfo/switchInfo.vue:602", "修改图片类型失败:", e);
        common_vendor.index.showToast({
          title: "修改失败",
          icon: "none"
        });
      }
    },
    // 获取图片类型索引
    getTypeIndex(type) {
      return this.imageTypeOptions.findIndex((option) => option.value === type);
    },
    // 处理类型变化
    async handleTypeChange(e) {
      const index = e.detail.value;
      const newType = this.imageTypeOptions[index].value;
      const imageInfo = {
        ...this.currentImage,
        type: newType,
        updateTime: this.getBeiJingISOString()
      };
      const { result: updateTypeResult } = await common_vendor.er.callFunction({
        name: "switchApi",
        data: {
          action: "updateSwitchImage",
          switchId: this.switchData._id,
          imageIndex: this.currentImageIndex,
          imageInfo
        }
      });
      if (!updateTypeResult || updateTypeResult.errCode !== 0) {
        throw new Error((updateTypeResult == null ? void 0 : updateTypeResult.errMsg) || "更新失败");
      }
      this.$set(this.switchImages, this.currentImageIndex, imageInfo);
      this.switchData.preview_images = [...this.switchImages];
      this.$forceUpdate();
      common_vendor.index.showToast({
        title: "类型修改成功",
        icon: "success"
      });
    },
    // 添加通过 ID 加载数据的方法
    async loadSwitchDataById(id) {
      try {
        const { result } = await common_vendor.er.callFunction({
          name: "switchApi",
          data: {
            action: "getSwitchById",
            id
          }
        });
        if (result && result.errCode === 0 && result.data) {
          this.handleSwitchData(result.data);
        } else {
          throw new Error((result == null ? void 0 : result.errMsg) || "加载失败");
        }
      } catch (e) {
        common_vendor.index.__f__("error", "at pages/switchInfo/switchInfo.vue:673", "加载数据失败:", e);
        common_vendor.index.showToast({
          title: "加载失败",
          icon: "none"
        });
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
            common_vendor.index.__f__("log", "at pages/switchInfo/switchInfo.vue:711", "预览图片成功");
          },
          fail: (error) => {
            common_vendor.index.__f__("error", "at pages/switchInfo/switchInfo.vue:714", "预览图片失败:", error);
            common_vendor.index.showToast({
              title: "预览失败",
              icon: "none"
            });
          }
        });
      } catch (error) {
        common_vendor.index.__f__("error", "at pages/switchInfo/switchInfo.vue:722", "处理图片预览失败:", error);
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
          fileName: "main_image.jpg",
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
        common_vendor.index.__f__("error", "at pages/switchInfo/switchInfo.vue:802", "设置主图失败:", e);
        common_vendor.index.showToast({
          title: "设置失败",
          icon: "none"
        });
      }
    },
    // 处理添加图片
    async handleAddImage() {
      try {
        const chooseResult = await common_vendor.index.chooseImage({
          count: 1,
          sizeType: ["compressed"],
          sourceType: ["album", "camera"]
        });
        const compressedImage = await this.compressImage(chooseResult.tempFilePaths[0]);
        const fileName = `${Date.now()}_${this.switchData.switch_name}_image.jpg`;
        const uploadResult = await common_vendor.er.uploadFile({
          filePath: compressedImage,
          cloudPath: `switches/${this.switchData._id}/${fileName}`
        });
        common_vendor.index.__f__("log", "at pages/switchInfo/switchInfo.vue:832", "文件上传成功:", uploadResult);
        const imageInfo = {
          fileID: uploadResult.fileID,
          type: "detail",
          fileName,
          uploadTime: this.getBeiJingISOString(),
          updateTime: this.getBeiJingISOString()
        };
        const { result: updateResult } = await common_vendor.er.callFunction({
          name: "switchApi",
          data: {
            action: "updateSwitchImage",
            switchId: this.switchData._id,
            imageIndex: this.switchImages.length,
            imageInfo
          }
        });
        if (!updateResult || updateResult.errCode !== 0) {
          throw new Error((updateResult == null ? void 0 : updateResult.errMsg) || "更新失败");
        }
        this.switchImages.push(imageInfo);
        this.switchData.preview_images = [...this.switchImages];
        this.currentImageIndex = this.switchImages.length - 1;
        this.$forceUpdate();
        common_vendor.index.showToast({
          title: "添加成功",
          icon: "success"
        });
      } catch (e) {
        common_vendor.index.__f__("error", "at pages/switchInfo/switchInfo.vue:873", "添加图片失败:", e);
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
          common_vendor.index.__f__("log", "at pages/switchInfo/switchInfo.vue:897", "文件删除成功:", fileID, result);
          return true;
        } else {
          throw new Error(result.result.errMsg);
        }
      } catch (error) {
        common_vendor.index.__f__("error", "at pages/switchInfo/switchInfo.vue:903", "文件删除失败:", error);
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
        common_vendor.index.__f__("log", "at pages/switchInfo/switchInfo.vue:930", "选择的图片:", tempFilePath);
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
          common_vendor.index.__f__("log", "at pages/switchInfo/switchInfo.vue:992", "用户取消选择图片");
          return;
        }
        common_vendor.index.__f__("error", "at pages/switchInfo/switchInfo.vue:996", "编辑图片失败:", e);
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
        common_vendor.index.__f__("log", "at pages/switchInfo/switchInfo.vue:1009", "开始删除图片操作");
        const currentImage = this.switchImages[this.currentImageIndex];
        common_vendor.index.__f__("log", "at pages/switchInfo/switchInfo.vue:1012", "当前图片信息:", currentImage);
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
          common_vendor.index.__f__("log", "at pages/switchInfo/switchInfo.vue:1032", "用户取消删除");
          return;
        }
        common_vendor.index.__f__("log", "at pages/switchInfo/switchInfo.vue:1036", "准备调用云函数删除图片:", {
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
        common_vendor.index.__f__("log", "at pages/switchInfo/switchInfo.vue:1053", "云函数返回结果:", result);
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
        common_vendor.index.__f__("error", "at pages/switchInfo/switchInfo.vue:1083", "删除图片失败:", e);
        common_vendor.index.showToast({
          title: e.message || "删除失败",
          icon: "none"
        });
      }
    },
    // 处理图片加载错误
    handleImageError(index) {
      common_vendor.index.__f__("error", "at pages/switchInfo/switchInfo.vue:1093", "图片加载失败:", index, {
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
    d: $options.currentImage.fileID
  }, $options.currentImage.fileID ? {
    e: common_vendor.t($options.currentImage.type ? $options.getImageTypeText($options.currentImage.type) : "选择类型"),
    f: $data.imageTypeOptions,
    g: $options.getTypeIndex($options.currentImage.type),
    h: common_vendor.o((...args) => $options.handleTypeChange && $options.handleTypeChange(...args))
  } : {}, {
    i: $data.switchImages.length > 1
  }, $data.switchImages.length > 1 ? {
    j: common_vendor.o((...args) => $options.handlePrevImage && $options.handlePrevImage(...args))
  } : {}, {
    k: $data.switchImages.length
  }, $data.switchImages.length ? {
    l: $options.currentImage.fileID || "/static/default_switch.webp"
  } : {}, {
    m: $data.switchImages.length > 1
  }, $data.switchImages.length > 1 ? {
    n: common_vendor.o((...args) => $options.handleNextImage && $options.handleNextImage(...args))
  } : {}, {
    o: common_vendor.o((...args) => $options.handleAddImage && $options.handleAddImage(...args)),
    p: $data.switchImages.length
  }, $data.switchImages.length ? {
    q: common_vendor.o((...args) => $options.handleEditConfirm && $options.handleEditConfirm(...args))
  } : {}, {
    r: $data.switchImages.length > 1 && $data.currentImageIndex !== 0
  }, $data.switchImages.length > 1 && $data.currentImageIndex !== 0 ? {
    s: common_vendor.o((...args) => $options.handleSetMainImage && $options.handleSetMainImage(...args))
  } : {}, {
    t: $data.switchImages.length
  }, $data.switchImages.length ? {
    v: common_vendor.o((...args) => $options.handleDeleteImage && $options.handleDeleteImage(...args))
  } : {}, {
    w: common_vendor.o(($event) => $data.isEditing = false),
    x: $data.switchImages.length > 1
  }, $data.switchImages.length > 1 ? {
    y: common_vendor.f($data.switchImages, (_, index, i0) => {
      return {
        a: index,
        b: common_vendor.n({
          active: index === $data.currentImageIndex
        }),
        c: common_vendor.o(($event) => $options.handleIndicatorTap(index), index)
      };
    })
  } : {}) : {}, {
    z: common_vendor.o((...args) => $options.handleTriggerTap && $options.handleTriggerTap(...args)),
    A: common_vendor.f($data.switchImages, (image, index, i0) => {
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
    B: !$data.isEditing,
    C: common_vendor.o((...args) => $options.handleSwiperChange && $options.handleSwiperChange(...args)),
    D: common_vendor.p({
      title: "轴体名称",
      ["right-text"]: $data.switchData.switch_name || "暂无"
    }),
    E: common_vendor.p({
      title: "代工厂",
      ["right-text"]: $data.switchData.manufacturer || "暂无"
    }),
    F: common_vendor.p({
      title: "轴体分类",
      ["right-text"]: $data.switchData.switch_type || "暂无"
    }),
    G: common_vendor.p({
      title: "上市时间",
      ["right-text"]: $data.switchData.release_date || "暂无"
    }),
    H: common_vendor.p({
      title: "价格",
      ["right-text"]: $options.getPriceText($data.switchData.price)
    }),
    I: common_vendor.p({
      title: "轴心材质",
      ["right-text"]: $data.switchData.stem_material || "暂无"
    }),
    J: common_vendor.p({
      title: "上盖材质",
      ["right-text"]: $data.switchData.top_housing_material || "暂无"
    }),
    K: common_vendor.p({
      title: "底壳材质",
      ["right-text"]: $data.switchData.bottom_housing_material || "暂无"
    }),
    L: common_vendor.p({
      title: "触发压力",
      ["right-text"]: $options.getForceText($data.switchData.actuation_force)
    }),
    M: common_vendor.p({
      title: "触发行程",
      ["right-text"]: $options.getDistanceText($data.switchData.actuation_travel)
    }),
    N: common_vendor.p({
      title: "触底压力",
      ["right-text"]: $options.getForceText($data.switchData.bottom_force)
    }),
    O: common_vendor.p({
      title: "触底行程",
      ["right-text"]: $options.getDistanceText($data.switchData.bottom_out_travel)
    }),
    P: common_vendor.p({
      title: "总行程",
      ["right-text"]: $options.getDistanceText($data.switchData.total_travel)
    }),
    Q: common_vendor.p({
      title: "弹簧长度",
      ["right-text"]: $data.switchData.spring_length || "暂无"
    }),
    R: common_vendor.p({
      title: "出厂润滑",
      ["right-text"]: $data.switchData.factory_lube ? "是" : "否"
    }),
    S: common_vendor.p({
      title: "寿命",
      ["right-text"]: $data.switchData.lifespan || "暂无"
    }),
    T: common_vendor.p({
      title: "更新时间",
      ["right-text"]: $options.formatTime($data.switchData.update_time)
    }),
    U: common_vendor.p({
      title: "数据来源",
      ["right-text"]: $data.switchData.data_source || "暂无"
    }),
    V: common_vendor.p({
      keyboards: $options.getRelatedKeyboards($data.switchData.related_keyboards)
    }),
    W: common_vendor.p({
      title: "停产",
      ["right-text"]: $data.switchData.discontinued ? "是" : "否"
    }),
    X: common_vendor.p({
      remark: $data.switchData.remark || "暂无"
    }),
    Y: common_vendor.p({
      title: "审核状态",
      ["right-text"]: $data.switchData.audit_status || "暂无"
    })
  });
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/switchInfo/switchInfo.js.map
