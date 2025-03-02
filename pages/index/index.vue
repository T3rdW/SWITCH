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
					<uni-icons type="trash" size="16" @click="clearHistory" />
				</view>
			</view>
			<view class="history-list">
				<view
					class="history-item"
					v-for="(item, index) in searchHistory"
					:key="index"
					@click="handleHistoryClick(item)"
				>
					<text class="item-text">{{ item }}</text>
				</view>
			</view>
		</view>

		<!-- 搜索结果列表 -->
		<view class="search-result" v-if="searchList.length > 0">
			<uni-list>
				<uni-list-item
					v-for="item in searchList"
					:key="item._id"
					clickable
					@tap="handleItemClick(item)"
					:title="item.name"
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
				searchList: [], // 搜索结果列表
				searchHistory: [], // 搜索历史
				hasSearch: false, // 是否已执行搜索
				showHistory: false, // 是否显示搜索历史
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
					// 调用云函数搜索
					const res = await uniCloud.callFunction({
						name: 'switchApi',
						data: {
							action: 'search',
							params: {
								keyword: keyword,
								page: 1,
								pageSize: 20
							}
						}
					})

					// 详细打印搜索结果
					console.log('搜索详细信息:', {
						keyword,
						result: res.result,
						code: res.result.code,
						total: res.result.data?.total,
						listLength: res.result.data?.list?.length,
						firstItem: res.result.data?.list?.[0]
					})

					if (res.result.code === 0) {
						this.searchList = res.result.data.list
						this.hasSearch = true
						if (this.searchList.length === 0) {
							console.log('搜索成功但无结果:', keyword)
						} else {
							console.log('搜索成功, 找到记录数:', this.searchList.length)
						}

						// 保存搜索历史
						this.saveSearchHistory(keyword)
					} else {
						console.warn('搜索返回错误:', res.result.msg)
						uni.showToast({
							title: res.result.msg,
							icon: 'none'
						})
					}

				} catch (e) {
					console.error('搜索失败:', e)
					uni.showToast({
						title: '搜索失败',
						icon: 'none'
					})
				} finally {
					uni.hideLoading()
					console.log('搜索完成, 当前状态:', {
						hasSearch: this.hasSearch,
						resultCount: this.searchList.length,
						keyword: keyword
					})
				}
			},

			// 处理清除搜索
			handleClear() {
				console.log('清除搜索:', {
					oldKeyword: this.searchKeyword,
					oldResultCount: this.searchList.length
				})
				this.searchKeyword = ''
				this.searchList = []
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
			handleItemClick(item) {
				console.log('点击轴体项:', item)
				console.log('准备跳转到详情页, ID:', item._id)
				uni.navigateTo({
					url: `/pages/switchInfo/switchInfo?id=${item._id}`,
					success: () => {
						console.log('跳转成功')
						// 使用事件通道传递完整数据
						uni.$emit('switchData', item)
					},
					fail: (err) => {
						console.error('跳转失败:', err)
					}
				})
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
				console.log('规格数据:', item) // 添加调试日志
				const actuationForce = item.actuation_force ? `触发压力: ${item.actuation_force}` : ''
				const actuationDistance = item.actuation_distance ? ` 触发行程: ${item.actuation_distance}` : ''
				// 直接返回拼接后的文本
				const text = actuationForce + actuationDistance
				console.log('规格文本:', text) // 添加调试日志
				return text || '暂无规格信息'
			},

			// 获取价格文本
			getPriceText(item) {
				return item.price ? `¥${item.price}` : '暂无报价'
			},

			// 获取缩略图
			getThumbImage(item) {
				// 检查是否有图片数组且第一张图片有效
				if (Array.isArray(item.images) && item.images.length > 0 && item.images[0].fileID) {
					return item.images[0].fileID
				}
				// 返回默认图片
				return '/static/default_switch.webp'
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
		padding: 0 15px;
		position: absolute;
		top: 54px;
		left: 0;
		right: 0;
		z-index: 100;
		box-shadow: 0 2px 4px rgba(0,0,0,0.05);

		.history-header {
			display: flex;
			justify-content: space-between;
			align-items: center;
			padding: 15px 0;
			border-bottom: 1px solid rgba(245, 245, 245, 0.4);

			.history-title {
				font-size: 14px;
				color: #333;
			}
		}

		.history-list {
			display: flex;
			flex-wrap: wrap;
			padding: 15px 0;
			gap: 10px;

			.history-item {
				background: rgba(247, 247, 247, 0.4);
				padding: 8px 12px;
				border-radius: 4px;
				font-size: 14px;
				color: #333;

				.item-text {
					line-height: 1;
				}
			}
		}
	}
</style>
