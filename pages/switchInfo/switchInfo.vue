<template>
	<view class="container">
		<!-- 图片管理按钮 - 隐藏式触发区域 -->
		<view class="image-manage-trigger" @tap="triggerCount++">
			<view v-if="showImageManage" class="manage-buttons">
				<button class="btn" @tap="handleAddImage">添加图片</button>
				<button class="btn" @tap="handleEditImage">修改图片</button>
				<button class="btn delete" @tap="handleDeleteImage">删除图片</button>
			</view>
		</view>

		<!-- 图片轮播 -->
		<swiper class="swiper" circular :indicator-dots="true" :autoplay="true" :interval="3000" :duration="1000" @change="handleSwiperChange">
			<swiper-item v-for="(image, index) in switchImages" :key="index" class="swiper-item">
				<image
					:src="image.fileID ? image.fileID : '/static/default_switch.webp'"
					mode="aspectFit"
					class="switch-image"
					@error="handleImageError(index)"
					@load="handleImageLoad(index)"
				/>
			</swiper-item>
			<!-- 无图片时显示默认图片 -->
			<swiper-item v-if="!switchImages.length" class="swiper-item">
				<image src="/static/default_switch.webp" mode="aspectFit" class="switch-image" />
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
			<uni-list-item title="更新时间" :right-text="formatTime(switchData.update_time)" />
			<uni-list-item title="数据来源" :right-text="switchData.data_source || '暂无'" />
			<related-keyboards-item
				:keyboards="getRelatedKeyboards(switchData.related_keyboards)"
			/>
			<uni-list-item title="停产" :right-text="switchData.discontinued ? '是' : '否'" />
			<remark-item :remark="switchData.remark || '暂无'" />
			<uni-list-item title="审核状态" :right-text="switchData.audit_status || '暂无'" />
		</uni-list>
	</view>
</template>

<script>
	import RelatedKeyboardsItem from '@/components/related-keyboards-item.vue'
	import RemarkItem from '@/components/remark-item.vue'

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
				showImageManage: false, // 是否显示图片管理按钮
				currentImageIndex: 0, // 当前显示的图片索引
				MAX_WIDTH: 1280,
				MAX_HEIGHT: 1280,
				QUALITY: 0.8
			}
		},

		watch: {
			// 监听触发计数器
			triggerCount(val) {
				if (val >= 5) { // 连续点击5次触发
					this.showImageManage = true
					this.triggerCount = 0
					uni.showToast({
						title: '已启用图片管理',
						icon: 'none'
					})
				}
			}
		},

		onLoad(options) {
			console.log('页面参数:', options)
			// 监听数据传递事件
			uni.$on('switchData', this.handleSwitchData)
			if (options.id) {
				this.loadSwitchData(options.id)
			}
		},

		onUnload() {
			// 页面卸载时移除事件监听
			uni.$off('switchData', this.handleSwitchData)
		},

		methods: {
			// 处理图片加载成功
			handleImageLoad(index) {
				console.log('图片加载成功:', index, this.switchImages[index]);
			},

			// 处理传递来的轴体数据
			handleSwitchData(data) {
				console.log('接收到轴体数据:', data)
				this.switchData = data
				// 处理图片数组，只保留有效的 fileID
				this.switchImages = Array.isArray(data.preview_images) ? data.preview_images : []
				console.log('处理后的图片数组:', this.switchImages)
			},

			// 加载轴体数据
			async loadSwitchData(id) {
				try {
					uni.showLoading({
						title: '加载中...'
					})

					const res = await uniCloud.callFunction({
						name: 'switchApi',
						data: {
							action: 'getSwitchById',
							id: id
						}
					})

					console.log('获取轴体数据结果:', res)

					if (res.result.errCode === 0) {
						this.switchData = res.result.data
						// 处理图片数组，只保留有效的 fileID
						this.switchImages = Array.isArray(this.switchData.preview_images) ? this.switchData.preview_images : []
						console.log('加载后的图片数组:', this.switchImages)
					} else {
						uni.showToast({
							title: res.result.errMsg || '加载失败',
							icon: 'none'
						})
					}
				} catch (e) {
					console.error('加载轴体数据失败:', e)
					uni.showToast({
						title: '加载失败',
						icon: 'none'
					})
				} finally {
					uni.hideLoading()
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

			// 格式化时间
			formatTime(time) {
				if (!time) return '暂无数据'
				try {
					const date = new Date(time)
					const year = date.getFullYear()
					const month = String(date.getMonth() + 1).padStart(2, '0')
					const day = String(date.getDate()).padStart(2, '0')
					const hours = String(date.getHours()).padStart(2, '0')
					const minutes = String(date.getMinutes()).padStart(2, '0')
					const seconds = String(date.getSeconds()).padStart(2, '0')
					return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
				} catch (e) {
					console.error('时间格式化失败:', e)
					return time
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
					// 获取图片信息
					const imageInfo = await new Promise((resolve, reject) => {
						uni.getImageInfo({
							src: tempFilePath,
							success: resolve,
							fail: reject
						});
					});

					// 计算压缩后的尺寸
					let { width, height } = imageInfo;
					if (width > this.MAX_WIDTH || height > this.MAX_HEIGHT) {
						const ratio = Math.min(this.MAX_WIDTH / width, this.MAX_HEIGHT / height);
						width = Math.floor(width * ratio);
						height = Math.floor(height * ratio);
					}

					// 压缩图片
					const compressedPath = await new Promise((resolve, reject) => {
						uni.compressImage({
							src: tempFilePath,
							quality: this.QUALITY,
							compressedWidth: width,
							compressedHeight: height,
							success: (res) => resolve(res.tempFilePath),
							fail: reject
						});
					});

					return compressedPath;
				} catch (e) {
					console.error('压缩图片失败:', e);
					throw e;
				}
			},

			// 生成图片文件名
			getImageFileName(type = 'detail', index) {
				// 优先使用英文名，如果没有则使用中文名
				let switchName = this.switchData.switch_name_en || this.switchData.switch_name || 'unknown';

				// 移除特殊字符，只保留字母、数字、下划线
				const safeSwitchName = switchName
					.replace(/\s+/g, '_') // 空格替换为下划线
					.replace(/[^a-zA-Z0-9_]/g, '') // 移除其他特殊字符
					.replace(/_+/g, '_') // 多个下划线替换为单个
					.replace(/^_|_$/g, ''); // 移除首尾下划线

				return `${safeSwitchName}_${type}_${index + 1}.webp`;
			},

			// 添加图片
			async handleAddImage() {
				try {
					const now = new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' });
					// 检查是否已有图片数组
					if (!this.switchData.preview_images) {
						this.switchData.preview_images = [];
					}

					const res = await uni.chooseImage({
						count: 1,
						sizeType: ['original'],
						sourceType: ['album', 'camera']
					});

					const tempFilePath = res.tempFilePaths[0];
					// 压缩图片
					const compressedPath = await this.compressImage(tempFilePath);

					// 使用规范的文件命名
					const fileName = this.getImageFileName('detail', this.switchImages.length);
					const cloudPath = fileName; // 直接使用文件名

					uni.showLoading({ title: '上传中...' });

					// 上传图片
					const uploadRes = await uniCloud.uploadFile({
						filePath: compressedPath,
						cloudPath
					});

					console.log('上传结果:', uploadRes); // 添加日志

					if (!uploadRes.fileID) {
						throw new Error('上传失败：未获取到 fileID');
					}

					// 构建图片信息对象
					const imageInfo = {
						fileID: uploadRes.fileID,
						type: 'detail',
						fileName: fileName,
						uploadTime: now,
						updateTime: ''
					};

					console.log('图片信息:', imageInfo); // 添加日志

					// 更新数据库
					const updateRes = await uniCloud.callFunction({
						name: 'switchApi',
						data: {
							action: 'updateSwitchImage',
							switchId: this.switchData._id,
							imageIndex: this.switchImages.length,
							imageInfo: imageInfo
						}
					});

					console.log('数据库更新结果:', updateRes); // 添加日志

					if (updateRes.result.errCode !== 0) {
						throw new Error('更新数据库失败：' + updateRes.result.errMsg);
					}

					// 深拷贝图片信息
					const newImageInfo = JSON.parse(JSON.stringify(imageInfo));
					this.switchImages.push(newImageInfo);
					this.switchData.preview_images = JSON.parse(JSON.stringify(this.switchImages));

					// 强制更新视图
					this.$forceUpdate();

					// 刷新数据以确保同步
					await this.loadSwitchData(this.switchData._id);

					uni.showToast({ title: '添加成功' });
				} catch (e) {
					console.error('添加图片失败:', e);
					uni.showToast({
						title: '添加失败',
						icon: 'none'
					});
				} finally {
					uni.hideLoading();
				}
			},

			// 修改图片
			async handleEditImage() {
				if (!this.switchImages.length) {
					uni.showToast({
						title: '没有可修改的图片',
						icon: 'none'
					})
					return
				}

				try {
					const now = new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' });
					const res = await uni.chooseImage({
						count: 1,
						sizeType: ['original'],
						sourceType: ['album', 'camera']
					})

					const tempFilePath = res.tempFilePaths[0]
					// 压缩并转换图片
					const compressedPath = await this.compressImage(tempFilePath)

					// 使用规范的文件命名
					const fileName = this.getImageFileName('detail', this.currentImageIndex);
					const cloudPath = fileName; // 直接使用文件名

					uni.showLoading({ title: '上传中...' });

					const uploadRes = await uniCloud.uploadFile({
						filePath: compressedPath,
						cloudPath
					});

					// 构建新的图片信息对象
					const imageInfo = {
						fileID: uploadRes.fileID,
						type: 'detail',
						fileName: fileName,
						uploadTime: this.switchImages[this.currentImageIndex].uploadTime,
						updateTime: now
					};

					await uniCloud.callFunction({
						name: 'switchApi',
						data: {
							action: 'updateSwitchImage',
							switchId: this.switchData._id,
							imageIndex: this.currentImageIndex,
							imageInfo: imageInfo
						}
					});

					// 更新本地数据
					this.$set(this.switchImages, this.currentImageIndex, imageInfo);
					this.switchData.preview_images = this.switchImages;

					// 刷新数据以确保同步
					this.loadSwitchData(this.switchData._id);

					uni.showToast({ title: '修改成功' });
				} catch (e) {
					console.error('修改图片失败:', e);
					uni.showToast({
						title: '修改失败',
						icon: 'none'
					});
				} finally {
					uni.hideLoading();
				}
			},

			// 删除图片
			async handleDeleteImage() {
				if (!this.switchImages.length) {
					uni.showToast({
						title: '没有可删除的图片',
						icon: 'none'
					});
					return;
				}

				uni.showModal({
					title: '确认删除',
					content: '是否删除当前图片？',
					success: async (res) => {
						if (res.confirm) {
							try {
								uni.showLoading({ title: '删除中...' });

								await uniCloud.callFunction({
									name: 'switchApi',
									data: {
										action: 'updateSwitchImage',
										switchId: this.switchData._id,
										imageIndex: this.currentImageIndex,
										imageInfo: null
									}
								});

								this.loadSwitchData(this.switchData._id);

								uni.showToast({ title: '删除成功' });
							} catch (e) {
								console.error('删除图片失败:', e);
								uni.showToast({
									title: '删除失败',
									icon: 'none'
								});
							} finally {
								uni.hideLoading();
							}
						}
					}
				});
			},

			// 处理图片加载错误
			handleImageError(index) {
				console.log('图片加载失败:', index)
				// 将错误图片替换为默认图片
				if (this.switchImages[index]) {
					this.$set(this.switchImages[index], 'fileID', '/static/default_switch.webp')
				}
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

			.switch-image {
				width: 100%;
				height: 100%;
				object-fit: contain;
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
		border: 1px solid rgba(255, 0, 0, 0.3);

		.manage-buttons {
			position: absolute;
			top: 0;
			right: 0;
			padding: 10px;
			background-color: rgba(0, 0, 0, 0.8);
			box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
			border-radius: 0 0 0 10px;

			.btn {
				margin: 8px 0;
				padding: 5px 10px;
				font-size: 12px;
				background-color: #4CAF50;
				color: white;
				border: none;
				border-radius: 4px;
				width: 100%;
				min-width: 80px;

				&.delete {
					background-color: #f44336;
				}

				&:active {
					opacity: 0.8;
				}
			}
		}

		&:active {
			background-color: rgba(255, 0, 0, 0.1);
		}
	}
</style>
