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
			<uni-list-item title="轴体名称" :right-text="switchData.name || '暂无'" />
			<uni-list-item title="代工厂" :right-text="switchData.manufacturer || '暂无'" />
			<uni-list-item title="轴体分类" :right-text="switchData.category || '暂无'" />
			<uni-list-item title="上市时间" :right-text="switchData.release_date || '暂无'" />
			<uni-list-item title="价格" :right-text="getPriceText(switchData.price)" />

			<!-- 规格参数 -->
			<uni-list-item title="轴心材质" :right-text="getForceText(switchData.stem_material) || '暂无'" />
			<uni-list-item title="上盖材质" :right-text="getForceText(switchData.top_housing_material) || '暂无'" />
			<uni-list-item title="底壳材质" :right-text="getDistanceText(switchData.bottom_housing_material) || '暂无'" />
			<uni-list-item title="触发压力" :right-text="getForceText(switchData.actuation_force)" />
			<uni-list-item title="触发行程" :right-text="getDistanceText(switchData.actuation_distance)" />
			<uni-list-item title="触底压力" :right-text="getForceText(switchData.bottom_force)" />
			<uni-list-item title="总行程" :right-text="getDistanceText(switchData.total_travel)" />

			<!-- 其他信息 -->
			<uni-list-item title="更新时间" :right-text="formatTime(switchData.update_time)" />
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

					if (res.result.code === 0) {
						this.switchData = res.result.data
						// 处理图片数组，只保留有效的 fileID
						this.switchImages = Array.isArray(this.switchData.images) ?
							this.switchData.images.filter(img => img && img.fileID) : []
						console.log('加载后的图片数组:', this.switchImages)
					} else {
						uni.showToast({
							title: res.result.msg,
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
				return force ? `${force}gf` : '暂无数据'
			},

			// 格式化距离
			getDistanceText(distance) {
				return distance ? `${distance}mm` : '暂无数据'
			},

			// 格式化时间
			formatTime(time) {
				return time || '暂无数据'
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
			.uni-list-item__content-title {
				font-size: 14px;
				color: #666;
			}

			.uni-list-item__extra-text {
				font-size: 14px;
				color: #333;
				text-align: right;
			}
		}
	}
</style>
