<script>
	export default {
		globalData: {
			userInfo: null,
			favorites: []
		},
		async onLaunch() {
			try {
				// 使用微信原生登录获取 code
				const loginRes = await uni.login({
					provider: 'weixin'
				});

				if (loginRes.code) {
					// 使用 code 获取 openid
					const { result } = await uniCloud.callFunction({
						name: 'switchApi',
						data: {
							action: 'silentLogin',
							code: loginRes.code
						}
					});

					if (result.errCode === 0) {
						// 只保存必要的用户信息
						this.globalData.userInfo = {
							openid: result.openid
						};
						console.log('静默登录成功:', this.globalData.userInfo);

						// 获取用户收藏数据
						await this.fetchUserFavorites();
					}
				}
			} catch (e) {
				console.error('登录异常:', e);
			}
		},
		// 获取用户收藏数据
		async fetchUserFavorites() {
			try {
				if (!this.globalData.userInfo?.openid) return;

				const { result } = await uniCloud.callFunction({
					name: 'switchApi',
					data: {
						action: 'getUserFavorites',
						openid: this.globalData.userInfo.openid
					}
				});

				if (result.errCode === 0) {
					// 保存收藏数据到全局
					this.globalData.favorites = result.data;
					console.log('获取收藏数据成功:', result.data.length);
				}
			} catch (e) {
				console.error('获取收藏数据失败:', e);
			}
		},
		onShow: function() {
			console.log('App Show')
		},
		onHide: function() {
			console.log('App Hide')
		}
	}
</script>

<style lang="scss">
	/*每个页面公共css */
	@import '@/uni_modules/uni-scss/index.scss';
	/* #ifndef APP-NVUE */
	@import '@/static/customicons.css';
	// 设置整个项目的背景色
	page {
		background-color: #f5f5f5;
	}

	/* #endif */
	.example-info {
		font-size: 14px;
		color: #333;
		padding: 10px;
	}
</style>
