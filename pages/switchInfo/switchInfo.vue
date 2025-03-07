<template>
	<view class="container">
		<!-- 图片管理遮罩层 -->
		<view class="edit-overlay" v-if="isEditing">
			<view class="edit-container">
				<view class="edit-header">
					<text class="edit-title">图片管理 {{ switchImages.length ? `(${currentImageIndex + 1}/${switchImages.length})` : '' }}</text>
					<text class="close-btn" @tap="isEditing = false">×</text>
				</view>
				<view class="edit-image-container">
					<view class="type-selector" v-if="currentImage.fileID">
						<picker
							mode="selector"
							:range="imageTypeOptions"
							range-key="text"
							:value="getTypeIndex(currentImage.type)"
							@change="handleTypeChange"
						>
							<view class="picker-content">
								<text>{{ currentImage.type ? getImageTypeText(currentImage.type) : '选择类型' }}</text>
								<text class="picker-arrow">▼</text>
							</view>
						</picker>
					</view>
					<view class="nav-btn prev" @tap="handlePrevImage" v-if="switchImages.length > 1">
						<text class="nav-icon">‹</text>
					</view>
					<image
						v-if="switchImages.length"
						:src="currentImage.fileID || '/static/default_switch.webp'"
						mode="aspectFit"
						class="edit-image"
					/>
					<view v-else class="empty-image">
						<text>暂无图片</text>
					</view>
					<view class="nav-btn next" @tap="handleNextImage" v-if="switchImages.length > 1">
						<text class="nav-icon">›</text>
					</view>
				</view>
				<view class="edit-buttons">
					<view class="btn-row">
						<button class="btn add" @tap="handleAddImage">添加图片</button>
						<button class="btn" @tap="handleEditConfirm" v-if="switchImages.length">更换图片</button>
					</view>
					<view class="btn-row">
						<button
							class="btn set-main"
							@tap="handleSetMainImage"
							v-if="switchImages.length > 1 && currentImageIndex !== 0"
						>设为主图</button>
						<button class="btn delete" @tap="handleDeleteImage" v-if="switchImages.length">删除图片</button>
						<button class="btn cancel" @tap="isEditing = false">取消</button>
					</view>
				</view>
				<!-- 图片指示器 -->
				<view class="image-indicators" v-if="switchImages.length > 1">
					<view
						v-for="(_, index) in switchImages"
						:key="index"
						:class="['indicator-dot', { active: index === currentImageIndex }]"
						@tap="handleIndicatorTap(index)"
					></view>
				</view>
			</view>
		</view>

		<!-- 图片管理触发区域 -->
		<view class="image-manage-trigger" @tap="handleTriggerTap">
		</view>

		<!-- 图片轮播 -->
		<swiper class="swiper" circular :indicator-dots="true" :autoplay="!isEditing" :interval="3000" :duration="300" @change="handleSwiperChange">
			<swiper-item v-for="(image, index) in switchImages" :key="index" class="swiper-item">
				<view class="image-wrapper">
					<image
						:src="image.fileID ? image.fileID : '/static/default_switch.webp'"
						mode="aspectFit"
						class="switch-image"
						@error="handleImageError(index)"
						@load="handleImageLoad(index)"
						@tap="handleImageTap(index)"
					/>
					<view class="image-type-tag" v-if="image.type">
						{{ getImageTypeText(image.type) }}
					</view>
				</view>
			</swiper-item>
		</swiper>

		<!-- 轴体信息列表 -->
		<uni-list class="info-list">
			<!-- 基本信息 -->
			<uni-list-item title="轴体名称" :right-text="switchData.switch_name || '暂无'" />
			<uni-list-item title="代工厂" :right-text="switchData.manufacturer || '暂无'" />
			<uni-list-item title="轴体分类" :right-text="switchData.switch_type || '暂无'" />
			<uni-list-item title="上市时间" :right-text="switchData.release_date || '暂无'" />
			<uni-list-item title="价格" :right-text="getPriceText(switchData.price)" />

			<!-- 规格参数 -->
			<uni-list-item title="轴心材质" :right-text="switchData.stem_material || '暂无'" />
			<uni-list-item title="上盖材质" :right-text="switchData.top_housing_material || '暂无'" />
			<uni-list-item title="底壳材质" :right-text="switchData.bottom_housing_material || '暂无'" />
			<uni-list-item title="触发压力" :right-text="getForceText(switchData.actuation_force)" />
			<uni-list-item title="触发行程" :right-text="getDistanceText(switchData.actuation_travel)" />
			<uni-list-item title="触底压力" :right-text="getForceText(switchData.bottom_force)" />
			<uni-list-item title="触底行程" :right-text="getDistanceText(switchData.bottom_out_travel)" />
			<uni-list-item title="总行程" :right-text="getDistanceText(switchData.total_travel)" />
			<uni-list-item title="弹簧长度" :right-text="switchData.spring_length || '暂无'" />
			<uni-list-item title="出厂润滑" :right-text="switchData.factory_lube ? '是' : '否'" />
			<uni-list-item title="寿命" :right-text="switchData.lifespan || '暂无'" />

			<!-- 其他信息 -->
			<uni-list-item title="最后更新时间" :right-text="formatTime(switchData.update_time)" />
			<uni-list-item title="数据来源" :right-text="switchData.data_source || '互联网'" />
			<related-keyboards-item
				:keyboards="getRelatedKeyboards(switchData.related_keyboards)"
			/>
			<uni-list-item title="停产" :right-text="switchData.discontinued ? '是' : '否'" />
			<remark-item :remark="switchData.remark || ''" />
			<uni-list-item title="审核状态" :right-text="getAuditStatusText(switchData.audit_status)" />
		</uni-list>
	</view>
</template>

<script>
	import RelatedKeyboardsItem from '@/components/related-keyboards-item.vue'
	import RemarkItem from '@/components/remark-item.vue'

	// 审核状态映射
	const AUDIT_STATUS_MAP = {
		'pending': '未审核',
		'reviewing': '审核中',
		'approved': '已审核'
	};

	export default {
		components: {
			RelatedKeyboardsItem,
			RemarkItem
		},
		data() {
			return {
				switchData: {}, // 轴体数据
				switchImages: [], // 轴体图片数组
				triggerCount: 0, // 触发计数器
				currentImageIndex: 0, // 当前显示的图片索引
				isEditing: false, // 是否正在编辑图片
				isLoading: false, // 是否正在加载数据
				imageTypeOptions: [
					{ text: '官方图', value: 'official' },
					{ text: '详情图', value: 'detail' },
					{ text: '上盖图', value: 'top' },
					{ text: '轴心图', value: 'stem' },
					{ text: '弹簧图', value: 'spring' },
					{ text: '底壳图', value: 'bottom' },
					{ text: '侧图', value: 'side' },
					{ text: '外壳图', value: 'housing' },
					{ text: '其他视图', value: 'other' }
				],
				MAX_WIDTH: 1280,
				MAX_HEIGHT: 1280,
				QUALITY: 0.8
			}
		},

		computed: {
			currentImage() {
				return this.switchImages[this.currentImageIndex] || {};
			}
		},

		onLoad(options) {
			console.log('详情页面加载, 参数:', options)
			// 监听数据传递事件
			uni.$on('switchData', this.handleSwitchData)

			// 如果没有立即收到数据，可以使用 ID 加载
			if (options.id) {
				console.log('准备使用 ID 加载数据:', options.id)
				// 给事件监听一些时间来接收数据
				setTimeout(() => {
					if (!this.switchData._id) {
						console.log('未收到数据，从服务器加载')
						this.loadSwitchDataById(options.id)
					}
				}, 200)
			}
		},

		onUnload() {
			// 页面卸载时移除事件监听
			uni.$off('switchData', this.handleSwitchData)
		},

		methods: {
			// 处理图片加载成功
			handleImageLoad(index) {
				// console.log('图片加载成功:', index, {
				// 	fileID: this.switchImages[index].fileID,
				// 	type: this.switchImages[index].type
				// });
			},

			// 处理传递来的轴体数据
			handleSwitchData(data) {
				console.log('接收到轴体数据:', data)
				// 打印完整的图片数组信息
				console.log('原始 preview_images:', data.preview_images)

				// 如果已经有相同的数据，不需要重新设置
				if (this.switchData._id === data._id) {
					console.log('已有相同数据，跳过更新');
					return;
				}

				this.switchData = data
				// 处理图片数组，只保留有效的 fileID
				if (Array.isArray(data.preview_images)) {
					// 如果图片数据无效，使用默认图片
					this.switchImages = data.preview_images.map(img => {
						if (!img || !img.fileID) {
							console.log('发现无效图片数据，使用默认图片:', img);
							return {
								fileID: '/static/default_switch.webp',
								type: 'detail',
								fileName: 'default_switch.webp',
								uploadTime: '',
								updateTime: ''
							};
						}
						return img;
					});
					console.log('处理后的图片数组:', this.switchImages);
				} else {
					console.log('preview_images 不是数组:', data.preview_images);
					// 如果没有图片数组，使用默认图片
					this.switchImages = [{
						fileID: '/static/default_switch.webp',
						type: 'detail',
						fileName: 'default_switch.webp',
						uploadTime: '',
						updateTime: ''
					}];
				}

				// 更新页面标题为轴体名称
				if (data.switch_name) {
					wx.setNavigationBarTitle({
						title: data.switch_name
					});
				}
			},

			// 格式化价格
			getPriceText(price) {
				return price ? `¥${price}` : '暂无报价'
			},

			// 格式化力度
			getForceText(force) {
				if (!force) return '暂无数据'
				// 如果已经包含 'gf' 就直接返回，否则添加 'gf'
				return force.toString().toLowerCase().includes('gf') ? force : `${force}gf`
			},

			// 格式化距离 mm
			getDistanceText(distance) {
				// 如果值为空，返回暂无数据
				if (!distance) return '暂无数据'

				const distanceStr = distance.toString().toLowerCase()

				// 如果已经包含 mm，直接返回
				if (distanceStr.includes('mm')) {
					return distance
				}

				// 如果不包含数字，直接返回原值
				if (!/\d/.test(distanceStr)) {
					return distance
				}

				// 包含数字但不包含 mm，添加 mm
				return `${distance}mm`
			},

			// 获取北京时间的 ISO 字符串
			getBeiJingISOString() {
				const now = new Date();
				// 获取时区偏移（北京时区 +08:00）
				const offset = 8 * 60;
				// 计算北京时间的时间戳
				const beijingTime = new Date(now.getTime() + (offset + now.getTimezoneOffset()) * 60000);
				// 返回 ISO 8601 格式的时间字符串（包含时区信息）
				return beijingTime.toISOString().replace('Z', '+08:00');
			},

			// 格式化时间显示
			formatTime(timeStr) {
				if (!timeStr) return '暂无数据';

				try {
					// 解析 ISO 8601 时间字符串
					const date = new Date(timeStr);
					// 格式化为本地时间字符串
					return date.toLocaleString('zh-CN', {
						year: 'numeric',
						month: '2-digit',
						day: '2-digit',
						hour: '2-digit',
						minute: '2-digit',
						second: '2-digit',
						hour12: false
					});
				} catch (e) {
					console.error('时间格式化失败:', e);
					return timeStr;
				}
			},

			// 处理相关键盘字段的数据
			getRelatedKeyboards(keyboards) {
				if (!keyboards || !Array.isArray(keyboards) || keyboards.length === 0) {
					return '--'
				}
				return keyboards.join(', ')
			},

			// 处理轮播图切换
			handleSwiperChange(e) {
				this.currentImageIndex = e.detail.current
			},

			// 压缩图片
			async compressImage(tempFilePath) {
				try {
					console.log('开始压缩图片:', tempFilePath);

					// 检查图片格式
					const ext = tempFilePath.split('.').pop().toLowerCase();
					console.log('图片格式:', ext);

					// 获取文件系统管理器
					const fs = wx.getFileSystemManager();

					// 检查文件路径是否有效
					if (!tempFilePath || typeof tempFilePath !== 'string') {
						throw new Error('无效的文件路径');
					}

					// 先获取图片信息
					console.log('准备获取图片信息...');
					const imageInfo = await new Promise((resolve, reject) => {
						wx.getImageInfo({
							src: tempFilePath,
							success: (res) => {
								console.log('获取图片信息成功:', res);
								resolve(res);
							},
							fail: (error) => {
								console.error('获取图片信息失败:', error);
								reject(new Error('获取图片信息失败'));
							}
						});
					});
					console.log('原始图片信息:', imageInfo);

					// 获取原始图片大小
					const originalFileInfo = await new Promise((resolve, reject) => {
						fs.getFileInfo({
							filePath: tempFilePath,
							success: (res) => {
								console.log('获取文件大小成功:', res);
								resolve(res);
							},
							fail: reject
						});
					});
					const originalSize = (originalFileInfo.size / 1024).toFixed(2);
					console.log(`原始图片大小: ${originalSize}KB, 尺寸: ${imageInfo.width}x${imageInfo.height}`);

					// 计算压缩后的尺寸
					let targetWidth = imageInfo.width;
					let targetHeight = imageInfo.height;
					const maxSize = 1024; // 设置最大边长为1024px
					const minSize = 800; // 设置最小边长为800px
					const quality = 50; // 降低质量以减小文件大小

					// 计算缩放比例
					let scale = 1;

					// 如果图片太大，需要缩小
					if (targetWidth > maxSize || targetHeight > maxSize) {
						// 找出最大的边，计算缩放比例
						const maxDimension = Math.max(targetWidth, targetHeight);
						scale = maxSize / maxDimension;
						console.log('图片需要缩小，缩放比例:', scale);
					}

					// 如果图片太小，需要放大
					if (targetWidth < minSize && targetHeight < minSize) {
						// 找出最小的边，计算放大比例
						const minDimension = Math.min(targetWidth, targetHeight);
						scale = minSize / minDimension;
						console.log('图片需要放大，缩放比例:', scale);
					}

					// 应用缩放
					if (scale !== 1) {
						targetWidth = Math.round(targetWidth * scale);
						targetHeight = Math.round(targetHeight * scale);
						console.log('应用缩放后的尺寸:', {
							width: targetWidth,
							height: targetHeight,
							scale: scale
						});
					}

					console.log('计算后的尺寸:', { width: targetWidth, height: targetHeight });

					// 使用微信小程序的压缩API
					const compressedPath = await new Promise((resolve, reject) => {
						wx.compressImage({
							src: tempFilePath,
							quality: quality,
							compressedWidth: targetWidth,
							compressHeight: targetHeight,
							success: (res) => {
								console.log('压缩图片成功:', res);
								resolve(res);
							},
							fail: reject
						});
					});

					// 获取压缩后的图片信息
					const compressedInfo = await new Promise((resolve, reject) => {
						wx.getImageInfo({
							src: compressedPath.tempFilePath,
							success: resolve,
							fail: reject
						});
					});

					// 获取压缩后的文件大小
					const finalFileInfo = await new Promise((resolve, reject) => {
						fs.getFileInfo({
							filePath: compressedPath.tempFilePath,
							success: resolve,
							fail: reject
						});
					});

					const compressedSize = (finalFileInfo.size / 1024).toFixed(2);
					console.log(`压缩完成:
						原始大小: ${originalSize}KB (${imageInfo.width}x${imageInfo.height})
						压缩后大小: ${compressedSize}KB (${compressedInfo.width}x${compressedInfo.height})
						压缩率: ${((1 - finalFileInfo.size / originalFileInfo.size) * 100).toFixed(2)}%
					`);

					return compressedPath.tempFilePath;
				} catch (e) {
					console.error('压缩图片失败:', e);
					return tempFilePath;
				}
			},

			// 生成图片文件名
			getImageFileName(type = 'detail', originalExt = 'jpg') {
				// 优先使用英文名，如果没有则使用中文名
				let switchName = this.switchData.switch_name_en || this.switchData.switch_name || 'unknown';

				// 移除特殊字符，只保留字母、数字、下划线
				const safeSwitchName = switchName
					.replace(/\s+/g, '_')
					.replace(/[^a-zA-Z0-9_]/g, '')
					.replace(/_+/g, '_')
					.replace(/^_|_$/g, '');

				// 生成格式化的时间字符串：YYYYMMDD_HHMMSS
				const now = new Date();
				const timeString = now.getFullYear() +
					String(now.getMonth() + 1).padStart(2, '0') +
					String(now.getDate()).padStart(2, '0') + '_' +
					String(now.getHours()).padStart(2, '0') +
					String(now.getMinutes()).padStart(2, '0') +
					String(now.getSeconds()).padStart(2, '0');

				// 生成随机字符串，避免文件名冲突
				const random = Math.random().toString(36).substring(2, 8);

				// 如果是其他视图类型，添加序号
				let typePrefix = '';
				if (type === 'other') {
					// 获取当前其他视图的数量
					const otherViewCount = this.switchImages.filter(img => img.type === 'other').length;
					// 序号从1开始
					typePrefix = `other${otherViewCount + 1}`;
				} else {
					// 其他类型使用原有的前缀
					const prefixMap = {
						detail: 'detail',
						top: 'top',
						stem: 'stem',
						spring: 'spring',
						bottom: 'bottom',
						side: 'side',
						housing: 'housing'
					};
					typePrefix = prefixMap[type] || 'other1';
				}

				// 构建文件名：轴体名_类型_时间_随机码.jpg
				return `${safeSwitchName}_${typePrefix}_${timeString}_${random}.${originalExt}`;
			},

			// 从文件名解析图片类型
			getTypeFromFileName(fileName) {
				if (!fileName) return 'detail';

				// 解析文件名中的类型标识
				const typeMatches = {
					'detail': 'detail',
					'top': 'top',
					'stem': 'stem',
					'spring': 'spring',
					'bottom': 'bottom',
					'side': 'side',
					'housing': 'housing',
					'other1': 'other',
					'other2': 'other',
					'other3': 'other'
				};

				// 遍历所有可能的类型标识
				for (const [typeId, type] of Object.entries(typeMatches)) {
					if (fileName.includes(`_${typeId}_`)) {
						return type;
					}
				}

				// 兼容旧的缩写格式
				const legacyMatches = {
					'_dt_': 'detail',
					'_tp_': 'top',
					'_st_': 'stem',
					'_sp_': 'spring',
					'_bt_': 'bottom',
					'_sd_': 'side',
					'_hs_': 'housing',
					'_ot1_': 'other',
					'_ot2_': 'other',
					'_ot3_': 'other'
				};

				// 遍历所有旧格式的类型标识
				for (const [typeId, type] of Object.entries(legacyMatches)) {
					if (fileName.includes(typeId)) {
						return type;
					}
				}

				// 默认返回详情图类型
				return 'detail';
			},

			// 处理添加图片
			async handleAddImage() {
				try {
					const res = await uni.chooseImage({
						count: 1,
						sizeType: ['compressed'],
						sourceType: ['album', 'camera']
					});

					const tempFilePath = res.tempFilePaths[0];

					// 压缩图片
					const compressedPath = await this.compressImage(tempFilePath);

					// 获取原始文件扩展名
					const originalExt = 'jpg'; // 统一使用 jpg 格式

					// 使用规范的文件命名
					const fileName = this.getImageFileName('detail', originalExt);
					const cloudPath = fileName;

					// 上传到云存储
					const uploadRes = await uniCloud.uploadFile({
						filePath: compressedPath,
						cloudPath: cloudPath,
					});

					console.log('文件上传成功:', uploadRes);

					// 构建图片信息对象
					const imageInfo = {
						fileID: uploadRes.fileID,
						type: 'detail',
						fileName: fileName,
						uploadTime: this.getBeiJingISOString(),
						updateTime: this.getBeiJingISOString()
					};

					// 更新数据库
					const { result: updateResult } = await uniCloud.callFunction({
						name: 'switchApi',
						data: {
							action: 'updateSwitchImage',
							switchId: this.switchData._id,
							imageIndex: this.switchImages.length,
							imageInfo: imageInfo
						}
					});

					if (!updateResult || updateResult.errCode !== 0) {
						throw new Error(updateResult?.errMsg || '更新失败');
					}

					// 更新本地数据
					this.switchImages.push(imageInfo);
					this.switchData.preview_images = [...this.switchImages];

					// 切换到新添加的图片
					this.currentImageIndex = this.switchImages.length - 1;

					// 强制更新视图
					this.$forceUpdate();

					uni.showToast({
						title: '添加成功',
						icon: 'success'
					});
				} catch (e) {
					console.error('添加图片失败:', e);
					uni.showToast({
						title: e.message || '添加失败',
						icon: 'none'
					});
				}
			},

			// 删除云存储中的文件
			async deleteCloudFile(fileID) {
				if (!fileID || fileID.includes('default_switch.webp')) {
					return;
				}

				try {
					const result = await uniCloud.callFunction({
						name: 'switchApi',
						data: {
							action: 'deleteCloudFile',
							fileList: [fileID]
						}
					});

					if (result.result.errCode === 0) {
						console.log('文件删除成功:', fileID, result);
						return true;
					} else {
						throw new Error(result.result.errMsg);
					}
				} catch (error) {
					console.error('文件删除失败:', error);
					return false;
				}
			},

			// 处理编辑图片
			async handleEditConfirm() {
				try {
					// 选择图片
					const res = await new Promise((resolve, reject) => {
						wx.chooseImage({
							count: 1,
							sizeType: ['original', 'compressed'],
							sourceType: ['album', 'camera'],
							success: resolve,
							fail: (error) => {
								// 用户取消选择时不显示错误提示
								if (error.errMsg.includes('cancel')) {
									reject(new Error('cancel'));
								} else {
									reject(error);
								}
							}
						});
					});

					const tempFilePath = res.tempFilePaths[0];
					console.log('选择的图片:', tempFilePath);

					// 压缩图片
					const compressedPath = await this.compressImage(tempFilePath);

					// 获取原始文件扩展名
					const originalExt = 'jpg'; // 统一使用 jpg 格式

					// 使用规范的文件命名
					const fileName = this.getImageFileName('detail', originalExt);
					const cloudPath = fileName;

					uni.showLoading({ title: '上传中...' });

					// 保存旧图片的 fileID，用于后续删除
					const oldFileID = this.switchImages[this.currentImageIndex].fileID;

					// 上传新图片
					const uploadResult = await uniCloud.uploadFile({
						filePath: compressedPath,
						cloudPath
					});

					// 如果存在旧图片且不是默认图片，则删除
					await this.deleteCloudFile(oldFileID);

					// 构建新的图片信息对象
					const imageInfo = {
						fileID: uploadResult.fileID,
						type: this.switchImages[this.currentImageIndex].type,
						fileName: fileName,
						uploadTime: this.getBeiJingISOString(),
						updateTime: this.getBeiJingISOString()
					};

					// 更新数据库
					const { result: updateResult } = await uniCloud.callFunction({
						name: 'switchApi',
						data: {
							action: 'updateSwitchImage',
							switchId: this.switchData._id,
							imageIndex: this.currentImageIndex,
							imageInfo: imageInfo
						}
					});

					// 检查返回结果
					if (!updateResult || updateResult.errCode !== 0) {
						throw new Error(updateResult?.errMsg || '更新失败');
					}

					// 更新本地数据
					this.$set(this.switchImages, this.currentImageIndex, imageInfo);
					this.switchData.preview_images = this.switchImages;

					// 强制更新视图
					this.$forceUpdate();

					uni.showToast({ title: '更换成功' });
				} catch (e) {
					// 用户取消选择时不显示错误提示
					if (e.message === 'cancel') {
						console.log('用户取消选择图片');
						return;
					}

					console.error('编辑图片失败:', e);
					uni.showToast({
						title: '编辑图片失败',
						icon: 'none'
					});
				} finally {
					uni.hideLoading();
				}
			},

			// 处理删除图片
			async handleDeleteImage() {
				try {
					console.log('开始删除图片操作');
					// 获取当前图片信息
					const currentImage = this.switchImages[this.currentImageIndex];
					console.log('当前图片信息:', currentImage);

					// 如果是默认图片，不允许删除
					if (!currentImage.fileID) {
						uni.showToast({
							title: '默认图片不能删除',
							icon: 'none'
						});
						return;
					}

					// 确认删除
					const confirmRes = await uni.showModal({
						title: '确认删除',
						content: '确定要删除这张图片吗？',
						confirmText: '删除',
						confirmColor: '#f44336'
					});

					if (!confirmRes.confirm) {
						console.log('用户取消删除');
						return;
					}

					console.log('准备调用云函数删除图片:', {
						switchId: this.switchData._id,
						imageIndex: this.currentImageIndex,
						fileID: currentImage.fileID
					});

					// 调用云函数删除图片
					const { result } = await uniCloud.callFunction({
						name: 'switchApi',
						data: {
							action: 'deleteSwitchImage',
							switchId: this.switchData._id,
							imageIndex: this.currentImageIndex,
							fileID: currentImage.fileID
						}
					});

					console.log('云函数返回结果:', result);

					// 检查返回结果
					if (!result || result.errCode !== 0) {
						throw new Error(result?.errMsg || '删除失败');
					}

					// 创建新的数组引用
					const newImages = [...this.switchImages];
					newImages.splice(this.currentImageIndex, 1);

					// 更新数据
					this.switchImages = newImages;
					this.switchData.preview_images = newImages;

					// 如果删除后还有图片，调整当前索引
					if (this.switchImages.length > 0) {
						this.currentImageIndex = Math.min(this.currentImageIndex, this.switchImages.length - 1);
					} else {
						this.currentImageIndex = 0;
					}

					// 关闭编辑模式
					this.isEditing = false;

					uni.showToast({
						title: '删除成功',
						icon: 'success'
					});
				} catch (e) {
					console.error('删除图片失败:', e);
					uni.showToast({
						title: e.message || '删除失败',
						icon: 'none'
					});
				}
			},

			// 处理图片加载错误
			handleImageError(index) {
				console.error('图片加载失败:', index, {
					fileID: this.switchImages[index].fileID,
					type: this.switchImages[index].type
				});
				// 将错误图片替换为默认图片
				if (this.switchImages[index]) {
					this.$set(this.switchImages[index], 'fileID', '/static/default_switch.webp')
				}
			},

			// 开始编辑图片
			startEditing() {
				if (!this.switchImages.length) {
					uni.showToast({
						title: '暂无图片',
						icon: 'none'
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
				if (this.switchImages.length <= 1) return;
				this.currentImageIndex = (this.currentImageIndex - 1 + this.switchImages.length) % this.switchImages.length;
			},

			// 切换到下一张图片
			handleNextImage() {
				if (this.switchImages.length <= 1) return;
				this.currentImageIndex = (this.currentImageIndex + 1) % this.switchImages.length;
			},

			// 点击指示器切换图片
			handleIndicatorTap(index) {
				this.currentImageIndex = index;
			},

			// 获取图片类型文本
			getImageTypeText(type) {
				const option = this.imageTypeOptions.find(opt => opt.value === type)
				// 如果找不到对应的类型，返回类型值本身
				return option ? option.text : type
			},

			// 处理类型选择
			async handleTypeChange(e) {
				const selectedType = this.imageTypeOptions[e.detail.value].value;
				const currentImage = this.switchImages[this.currentImageIndex];

				try {
					// 更新图片信息
					const imageInfo = {
						...currentImage,
						type: selectedType,
						updateTime: this.getBeiJingISOString()
					};

					// 调用云函数更新数据库
					const { result } = await uniCloud.callFunction({
						name: 'switchApi',
						data: {
							action: 'updateSwitchImage',
							switchId: this.switchData._id,
							imageIndex: this.currentImageIndex,
							imageInfo: imageInfo
						}
					});

					if (!result || result.errCode !== 0) {
						throw new Error(result?.errMsg || '更新失败');
					}

					// 更新本地数据
					this.$set(this.switchImages, this.currentImageIndex, imageInfo);

					uni.showToast({
						title: '类型修改成功',
						icon: 'success'
					});
				} catch (e) {
					console.error('修改图片类型失败:', e);
					uni.showToast({
						title: e.message || '修改失败',
						icon: 'none'
					});
				}
			},

			// 获取图片类型索引
			getTypeIndex(type) {
				return this.imageTypeOptions.findIndex(option => option.value === type);
			},

			// 添加通过 ID 加载数据的方法
			async loadSwitchDataById(id) {
				try {
					const { result } = await uniCloud.callFunction({
						name: 'switchApi',
						data: {
							action: 'getSwitchById',
							id: id
						}
					})

					if (result && result.errCode === 0 && result.data) {
						this.handleSwitchData(result.data)
					} else {
						throw new Error(result?.errMsg || '加载失败')
					}
				} catch (e) {
					console.error('加载数据失败:', e)
					uni.showToast({
						title: '加载失败',
						icon: 'none'
					})
				}
			},

			// 处理图片点击预览
			async handleImageTap(index) {
				// 如果正在编辑模式，不进行预览
				if (this.isEditing) {
					return;
				}

				try {
					// 过滤有效的图片URL
					const urls = this.switchImages
						.filter(img => img.fileID && img.fileID !== '/static/default_switch.webp')
						.map(img => img.fileID);

					// 如果没有有效的图片URL
					if (urls.length === 0) {
						uni.showToast({
							title: '无可预览图片',
							icon: 'none'
						});
						return;
					}

					// 获取当前图片的URL
					const currentFileID = this.switchImages[index].fileID;

					// 使用微信的预览图片API
					wx.previewImage({
						current: currentFileID, // 当前显示图片的URL
						urls: urls, // 所有图片的URL列表
						success: () => {
							console.log('预览图片成功');
						},
						fail: (error) => {
							console.error('预览图片失败:', error);
							uni.showToast({
								title: '预览失败',
								icon: 'none'
							});
						}
					});
				} catch (error) {
					console.error('处理图片预览失败:', error);
					uni.showToast({
						title: error.message || '预览失败',
						icon: 'none'
					});
				}
			},

			// 处理设置主图
			async handleSetMainImage() {
				try {
					// 获取当前图片的索引
					const currentIndex = this.currentImageIndex;

					// 获取所有图片
					const allImages = this.switchImages;

					// 如果当前图片是主图，不需要设置
					if (currentIndex === 0) {
						uni.showToast({
							title: '已经是主图',
							icon: 'none'
						});
						return;
					}

					// 确认设置
					const confirmRes = await uni.showModal({
						title: '设为主图',
						content: '确定要将当前图片设为主图吗？',
						confirmText: '确定',
						confirmColor: '#4CAF50'
					});

					if (!confirmRes.confirm) {
						return;
					}

					// 将当前图片设置为主图
					const currentImage = allImages[currentIndex];
					// 创建新的图片数组
					const newImages = [...allImages];
					// 移除当前图片
					newImages.splice(currentIndex, 1);
					// 将当前图片插入到数组开头
					newImages.unshift({
						...currentImage,
						type: 'detail',
						updateTime: this.getBeiJingISOString()
					});

					// 更新数据库
					const { result: updateResult } = await uniCloud.callFunction({
						name: 'switchApi',
						data: {
							action: 'updateSwitchImages',
							switchId: this.switchData._id,
							images: newImages
						}
					});

					if (!updateResult || updateResult.errCode !== 0) {
						throw new Error(updateResult?.errMsg || '设置失败');
					}

					// 更新本地数据
					this.switchImages = newImages;
					this.switchData.preview_images = [...this.switchImages];
					// 更新当前索引为0（主图位置）
					this.currentImageIndex = 0;

					// 强制更新视图
					this.$forceUpdate();

					uni.showToast({
						title: '设置成功',
						icon: 'success'
					});
				} catch (e) {
					console.error('设置主图失败:', e);
					uni.showToast({
						title: '设置失败',
						icon: 'none'
					});
				}
			},

			// 获取审核状态文本
			getAuditStatusText(status) {
				return AUDIT_STATUS_MAP[status] || '未审核';
			}
		}
	}
</script>

<style lang="scss">
	.container {
		min-height: 100vh;
		background-color: #f5f5f5;
	}

	.swiper {
		height: 300px;
		background-color: #fff;

		.swiper-item {
			display: flex;
			justify-content: center;
			align-items: center;
			background-color: #fff;

			.image-wrapper {
				position: relative;
				width: 100%;
				height: 100%;
				display: flex;
				justify-content: center;
				align-items: center;

				.image-type-tag {
					position: absolute;
					top: 10px;
					right: 10px;
					background-color: rgba(0, 0, 0, 0.6);
					color: #fff;
					padding: 4px 8px;
					border-radius: 4px;
					font-size: 12px;
					z-index: 2;
					display: flex;
					align-items: center;
					gap: 4px;
					cursor: pointer;

					&:active {
						opacity: 0.8;
					}

					.edit-icon {
						font-size: 12px;
						margin-left: 4px;
					}
				}

				.switch-image {
					width: 100%;
					height: 100%;
					object-fit: contain;
				}
			}
		}
	}

	.info-list {
		margin-top: 10px;

		:deep(.uni-list-item) {
			.uni-list-item__container {
				flex: 1;
				flex-direction: row;
				padding: 12px 15px;
			}

			.uni-list-item__content {
				flex: none;
				width: 100px;
			}

			.uni-list-item__content-title {
				font-size: 14px;
				color: #666;
				white-space: nowrap;
			}

			.uni-list-item__extra {
				flex: 1;
				overflow: visible;
				align-items: flex-end;
			}

			.uni-list-item__extra-text {
				font-size: 14px;
				color: #333;
				text-align: right;
				white-space: normal;
				word-break: break-all;
				line-height: 1.4;
				width: 100%;
				padding-left: 15px;
				padding-right: 15px;
			}
		}
	}

	.image-manage-trigger {
		position: fixed;
		top: 0;
		right: 0;
		width: 50px;
		height: 50px;
		z-index: 100;

		&:active {
			background-color: rgba(255, 0, 0, 0.1);
		}
	}

	.empty-image {
		width: 100%;
		height: 200px;
		display: flex;
		justify-content: center;
		align-items: center;
		background-color: #f5f5f5;
		margin-bottom: 15px;
		color: #999;
	}

	.edit-overlay {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background-color: rgba(0, 0, 0, 0.7);
		z-index: 1000;
		display: flex;
		justify-content: center;
		align-items: center;

		.edit-container {
			background-color: #fff;
			border-radius: 8px;
			width: 90%;
			max-width: 600px;
			padding: 20px;

			.edit-header {
				display: flex;
				justify-content: space-between;
				align-items: center;
				margin-bottom: 15px;

				.edit-title {
					font-size: 16px;
					font-weight: bold;
				}

				.close-btn {
					font-size: 24px;
					color: #999;
					padding: 0 10px;
					cursor: pointer;

					&:active {
						opacity: 0.7;
					}
				}
			}

			.edit-image-container {
				position: relative;
				width: 100%;
				height: 200px;
				margin-bottom: 15px;
				background-color: #f5f5f5;
				display: flex;
				align-items: center;
				justify-content: center;

				.type-selector {
					position: absolute;
					top: 10px;
					right: 10px;
					z-index: 2;

					.picker-content {
						background-color: rgba(0, 0, 0, 0.6);
						color: #fff;
						padding: 4px 8px;
						border-radius: 4px;
						font-size: 12px;
						display: flex;
						align-items: center;
						gap: 4px;
						min-width: 50px;
						height: 18px;
						justify-content: center;
					}

					&:active {
						opacity: 0.8;
					}

					.picker-arrow {
						font-size: 12px;
						margin-left: 4px;
						color: #fff;
					}
				}

				.nav-btn {
					position: absolute;
					top: 50%;
					transform: translateY(-50%);
					width: 40px;
					height: 40px;
					background-color: rgba(0, 0, 0, 0.5);
					border-radius: 50%;
					display: flex;
					align-items: center;
					justify-content: center;
					cursor: pointer;
					z-index: 1;

					&.prev {
						left: 10px;
					}

					&.next {
						right: 10px;
					}

					.nav-icon {
						color: #fff;
						font-size: 24px;
						font-weight: bold;
					}

					&:active {
						background-color: rgba(0, 0, 0, 0.7);
					}
				}

				.edit-image {
					width: 100%;
					height: 100%;
					object-fit: contain;
				}
			}

			.edit-buttons {
				display: flex;
				flex-direction: column;
				gap: 12px;

				.btn-row {
					display: flex;
					gap: 10px;

					.btn {
						flex: 1;
					}
				}

				.btn {
					margin: 0;
					font-size: 14px;
					height: 40px;
					line-height: 40px;

					&.add {
						background-color: #4CAF50;
					}

					&.delete {
						background-color: #f44336;
					}

					&.cancel {
						background-color: #999;
					}

					&:active {
						opacity: 0.8;
					}
				}
			}

			.image-indicators {
				display: flex;
				justify-content: center;
				gap: 8px;
				margin-bottom: 15px;

				.indicator-dot {
					width: 8px;
					height: 8px;
					border-radius: 50%;
					background-color: #ddd;
					cursor: pointer;

					&.active {
						background-color: #4CAF50;
						transform: scale(1.2);
					}

					&:active {
						opacity: 0.8;
					}
				}
			}
		}
	}

	.switch-image {
		width: 100%;
		height: 100%;
		/* 添加点击反馈 */
		&:active {
			opacity: 0.8;
		}
	}
</style>
