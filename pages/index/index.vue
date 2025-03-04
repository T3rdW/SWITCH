<template>
	<view class="container">
		<!-- 搜索栏 -->
		<uni-search-bar
			v-model="searchKeyword"
			:radius="100"
			placeholder="搜索轴体"
			clearButton="auto"
			cancelButton="none"
			@confirm="handleSearch"
			@clear="handleClear"
			@focus="handleFocus"
			@blur="handleBlur"
			class="search-bar"
		/>

		<!-- 搜索历史 -->
		<view class="search-history" v-if="showHistory && searchHistory.length > 0">
			<view class="history-header">
				<view class="header-left">
					<text class="history-title">搜索历史</text>
				</view>
				<view class="header-right">
					<uni-icons type="trash" size="14" color="#000000" @click="clearHistory" />
				</view>
			</view>
			<view class="history-list">
				<view
					class="history-item"
					v-for="(item, index) in searchHistory"
					:key="index"
				>
					<view class="item-content" @click="handleHistoryClick(item)">
						<text class="item-text">{{ item }}</text>
					</view>
					<text class="delete-btn" @click.stop="deleteHistoryItem(index, $event)">×</text>
				</view>
			</view>
		</view>

		<!-- 搜索结果列表 -->
		<view class="search-result" v-if="switchList.length > 0">
			<uni-list>
				<uni-list-item
					v-for="item in switchList"
					:key="item._id"
					clickable
					@tap="handleItemClick(item)"
					:title="item.switch_name"
					:note="getSpecText(item)"
					:rightText="getPriceText(item)"
					:border="true"
					:thumb="getThumbImage(item)"
					thumb-size="lg"
				>
				</uni-list-item>
			</uni-list>
		</view>

		<!-- 无搜索结果提示 -->
		<view class="no-result" v-else-if="hasSearch">
			<text>未找到相关轴体</text>
		</view>
	</view>
</template>

<script>
	export default {
		data() {
			return {
				searchKeyword: '', // 搜索关键词
				switchList: [], // 搜索结果列表
				searchHistory: [], // 搜索历史
				hasSearch: false, // 是否已执行搜索
				showHistory: false, // 是否显示搜索历史
				isNavigating: false, // 添加导航状态标记
				isDeleting: false, // 添加删除操作标记
			}
		},

		onLoad() {
			// 从本地存储加载搜索历史
			const history = uni.getStorageSync('searchHistory')
			if (history) {
				this.searchHistory = JSON.parse(history)
			}
		},

		methods: {
			// 处理搜索框获得焦点
			handleFocus() {
				this.showHistory = true
			},

			// 处理搜索框失去焦点
			handleBlur() {
				// 延迟关闭历史记录,让点击事件能够执行
				setTimeout(() => {
					// 如果正在删除操作中，不关闭搜索历史
					if (this.isDeleting) {
						this.isDeleting = false;
						return;
					}
					this.showHistory = false
				}, 200)
			},

			// 处理搜索确认
			async handleSearch() {
				const keyword = this.searchKeyword.trim()
				if (!keyword) {
					console.log('搜索关键词为空')
					return
				}

				// 检查搜索关键词长度
				const chineseCharCount = keyword.match(/[\u4e00-\u9fa5]/g)?.length || 0
				if (chineseCharCount < 2) {
					console.log('搜索关键词过短,需要至少2个汉字', {
						keyword,
						chineseCharCount
					})
					uni.showToast({
						title: '请输入至少2个汉字',
						icon: 'none'
					})
					return
				}

				this.showHistory = false
				uni.showLoading({
					title: '搜索中...'
				})

				try {
					console.log('开始搜索:', keyword)
					const db = uniCloud.database()
					const res = await db.collection('switches')
						.where({ switch_name: new RegExp(keyword, 'i') })
						.get()

					console.log('搜索返回数据:', res)

					this.switchList = Array.isArray(res.result.data) ? res.result.data : []
					this.hasSearch = true

					if (this.switchList.length === 0) {
						console.log('搜索成功但无结果:', keyword)
						uni.showToast({
							title: '未找到相关轴体',
							icon: 'none'
						})
					} else {
						console.log('搜索成功, 找到记录数:', this.switchList.length)
						// 只在有搜索结果时保存历史
						this.saveSearchHistory(keyword)
					}

				} catch (e) {
					console.error('搜索失败:', e)
					this.switchList = []
					uni.showToast({
						title: '搜索失败',
						icon: 'none'
					})
				} finally {
					uni.hideLoading()
					console.log('搜索完成, 当前状态:', {
						hasSearch: this.hasSearch,
						resultCount: this.switchList?.length || 0,
						keyword: keyword
					})
				}
			},

			// 处理清除搜索
			handleClear() {
				console.log('清除搜索:', {
					oldKeyword: this.searchKeyword,
					oldResultCount: this.switchList.length
				})
				this.searchKeyword = ''
				this.switchList = []
				this.hasSearch = false
				this.showHistory = true
				console.log('搜索已清除')
			},

			// 处理搜索历史点击
			handleHistoryClick(keyword) {
				this.searchKeyword = keyword
				this.handleSearch()
			},

			// 处理列表项点击
			async handleItemClick(item) {
				// 如果正在导航中，直接返回
				if (this.isNavigating) {
					console.log('导航进行中，跳过重复点击');
					return;
				}

				// 设置导航状态为true
				this.isNavigating = true;

				try {
					console.log('点击轴体项:', item)
					console.log('准备跳转到详情页, ID:', item._id)

					// 跳转到详情页
					await uni.navigateTo({
						url: `/pages/switchInfo/switchInfo?id=${item._id}`,
						success: async () => {
							console.log('跳转成功')
							// 等待页面准备完成后再传递数据
							setTimeout(() => {
								// 传递数据
								uni.$emit('switchData', item)
								console.log('数据已传递到详情页')
							}, 100)
						},
						fail: (err) => {
							console.error('跳转失败:', err)
							uni.showToast({
								title: '跳转失败',
								icon: 'none'
							})
						}
					})
				} catch (e) {
					console.error('跳转失败:', e)
					uni.showToast({
						title: '跳转失败',
						icon: 'none'
					})
				} finally {
					// 导航完成后重置状态
					setTimeout(() => {
						this.isNavigating = false;
					}, 500); // 添加500ms延迟，防止快速重复点击
				}
			},

			// 保存搜索历史
			saveSearchHistory(keyword) {
				console.log('保存搜索历史:', keyword)
				const index = this.searchHistory.indexOf(keyword)
				if (index > -1) {
					console.log('关键词已存在,位置:', index)
					this.searchHistory.splice(index, 1)
				}
				this.searchHistory.unshift(keyword)

				// 限制历史记录数量
				if (this.searchHistory.length > 10) {
					console.log('历史记录超过10条,移除最后一条')
					this.searchHistory.pop()
				}

				// 保存到本地存储
				uni.setStorageSync('searchHistory', JSON.stringify(this.searchHistory))
				console.log('当前搜索历史:', this.searchHistory)
			},

			// 清空搜索历史
			clearHistory() {
				uni.showModal({
					title: '提示',
					content: '确定要清空搜索历史吗？',
					success: (res) => {
						if (res.confirm) {
							this.searchHistory = []
							uni.removeStorageSync('searchHistory')
						}
					}
				})
			},

			// 获取规格文本
			getSpecText(item) {
				console.log('规格数据:', item)
				const force = item.actuation_force
				const actuationForce = force ?
					`触发压力: ${force.toString().toLowerCase().includes('gf') ? force : `${force}gf`}` : ''
				const actuationTravel = item.actuation_travel ? ` 触发行程: ${item.actuation_travel}` : ''
				const text = actuationForce + actuationTravel
				console.log('规格文本:', text)
				return text || '暂无规格信息'
			},

			// 获取价格文本
			getPriceText(item) {
				return item.price ? `¥${item.price}` : '暂无报价'
			},

			// 获取缩略图
			getThumbImage(item) {
				// 检查是否有图片数组且第一张图片有效
				if (Array.isArray(item.preview_images) && item.preview_images.length > 0 && item.preview_images[0].fileID) {
					return item.preview_images[0].fileID
				}
				// 返回默认图片
				return '/static/default_switch.webp'
			},

			// 删除单个搜索历史
			deleteHistoryItem(index, event) {
				this.isDeleting = true; // 标记正在删除
				// 阻止事件冒泡
				event.stopPropagation();
				this.searchHistory.splice(index, 1)
				// 保存到本地存储
				uni.setStorageSync('searchHistory', JSON.stringify(this.searchHistory))
			},
		}
	}
</script>

<style lang="scss">
	.container {
		padding: 10px;
		position: relative;  // 添加相对定位
	}

	.search-result {
		margin-top: 10px;
		:deep(.uni-list-item) {
			.uni-list-item__container {
				padding: 12px;
			}

			.uni-list-item__content-title {
				font-size: 14px;
				font-weight: 500;
			}

			.uni-list-item__content-note {
				font-size: 12px;
				color: #666;
				margin-top: 4px;
			}

			.uni-list-item__extra-text {
				font-size: 14px;
				color: #ff5a5f;
				font-weight: 500;

				&:empty::before {
					content: '暂无报价';
					color: #999;
				}
			}
		}
	}

	.no-result {
		padding: 30px 0;
		text-align: center;
		color: #999;
	}

	.search-history {
		margin-top: 10px;
		background-color: rgba(255, 255, 255, 0.8);
		padding: 0 12px;
		position: absolute;
		top: 54px;
		left: 0;
		right: 0;
		z-index: 100;
		box-shadow: 0 1px 2px rgba(0,0,0,0.03);

		.history-header {
			display: flex;
			justify-content: space-between;
			align-items: center;
			padding: 10px 0;
			border-bottom: 0.5px solid rgba(0, 0, 0, 0.05);

			.history-title {
				font-size: 14px;
				color: #000000;
				font-weight: 600;
			}

			.header-right {
				padding: 4px;

				&:active {
					opacity: 0.7;
				}
			}
		}

		.history-list {
			display: flex;
			flex-wrap: wrap;
			padding: 8px 0;
			gap: 10px;

			.history-item {
				background: rgba(0, 0, 0, 0.03);
				border-radius: 15px;
				font-size: 12px;
				color: #333;
				position: relative;
				display: flex;
				align-items: center;

				.item-content {
					padding: 8px 24px 8px 12px;

					&:active {
						opacity: 0.7;
					}
				}

				.item-text {
					line-height: 1;
				}

				.delete-btn {
					position: absolute;
					right: 6px;
					font-size: 16px;
					color: #999;
					width: 20px;
					height: 20px;
					display: flex;
					align-items: center;
					justify-content: center;

					&:active {
						opacity: 0.7;
					}
				}
			}
		}
	}
</style>
