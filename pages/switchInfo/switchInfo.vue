<template>
	<view class="container">
		<!-- 图片轮播 -->
		<swiper class="swiper" circular :indicator-dots="true" :autoplay="true" :interval="3000" :duration="1000">
			<swiper-item v-for="(image, index) in switchImages" :key="index" class="swiper-item">
				<image
					:src="image.fileID || '/static/default_switch.webp'"
					mode="aspectFit"
					class="switch-image"
					@error="handleImageError(index)"
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
			<uni-list-item
				title="相关键盘"
				:right-text="getRelatedKeyboards(switchData.related_keyboards)"
				class="related-keyboards"
			/>
			<uni-list-item title="停产" :right-text="switchData.discontinued ? '是' : '否'" />
			<uni-list-item title="备注" :right-text="switchData.remark || '暂无'" />
			<uni-list-item title="审核状态" :right-text="switchData.audit_status || '暂无'" />
		</uni-list>
	</view>
</template>

<script>
	export default {
		data() {
			return {
				switchData: {}, // 轴体数据
				switchImages: [], // 轴体图片数组
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
			// 处理图片加载错误
			handleImageError(index) {
				console.log('图片加载失败:', index)
				// 将错误图片替换为默认图片
				if (this.switchImages[index]) {
					this.$set(this.switchImages[index], 'fileID', '/static/default_switch.webp')
				}
			},

			// 处理传递来的轴体数据
			handleSwitchData(data) {
				console.log('接收到轴体数据:', data)
				this.switchData = data
				// 处理图片数组，只保留有效的 fileID
				this.switchImages = Array.isArray(data.images) ? data.images.filter(img => img && img.fileID) : []
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
						this.switchImages = Array.isArray(this.switchData.images) ?
							this.switchData.images.filter(img => img && img.fileID) : []
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
				width: 100px;  // 固定宽度
			}

			.uni-list-item__content-title {
				font-size: 14px;
				color: #666;
				white-space: nowrap;
			}

			.uni-list-item__extra {
				flex: 1;
				overflow: visible;
				align-items: flex-start;
			}

			.uni-list-item__extra-text {
				font-size: 14px;
				color: #333;
				text-align: left;
				white-space: normal;
				word-break: break-all;
				line-height: 1.4;
				width: 100%;
			}

			&.related-keyboards {
				.uni-list-item__extra-text {
					padding: 8px 0;
					min-height: 44px;  // 确保有足够的空间显示多行文本
				}
			}
		}
	}
</style>
