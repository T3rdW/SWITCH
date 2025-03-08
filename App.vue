<script>
	// 定义一个全局函数来获取收藏数据
	function getFavorites(app) {
		return new Promise((resolve, reject) => {
			if (!app.globalData.userInfo?.openid) {
				console.log('没有 openid，无法获取收藏');
				resolve([]);
				return;
			}

			console.log('准备调用云函数获取收藏');
			uniCloud.callFunction({
				name: 'switchApi',
				data: {
					action: 'getUserFavorites',
					openid: app.globalData.userInfo.openid
				}
			}).then(({ result }) => {
				console.log('云函数返回结果:', result);
				if (result.errCode === 0) {
					app.globalData.favorites = result.data;
					console.log('获取收藏数据成功:', result.data.length);
					resolve(result.data);
				} else {
					resolve([]);
				}
			}).catch(e => {
				console.error('获取收藏数据失败:', e);
				reject(e);
			});
		});
	}

	export default {
		globalData: {
			userInfo: null,
			favorites: []
		},
		async onLaunch() {
			try {
				console.log('App onLaunch');
				// 使用微信原生登录获取 code
				const loginRes = await uni.login({
					provider: 'weixin'
				});

				console.log('登录结果:', loginRes);
				if (loginRes.code) {
					// 使用 code 获取 openid
					console.log('准备调用 silentLogin');
					const { result } = await uniCloud.callFunction({
						name: 'switchApi',
						data: {
							action: 'silentLogin',
							code: loginRes.code
						}
					});

					console.log('silentLogin 返回:', result);
					if (result.errCode === 0) {
						// 只保存必要的用户信息
						this.globalData.userInfo = {
							openid: result.openid
						};
						console.log('静默登录成功:', this.globalData.userInfo);

						// 获取用户收藏数据
						// 使用全局函数获取收藏
						try {
							await getFavorites(this);
						} catch (e) {
							console.error('获取收藏失败:', e);
						}
					}
				}
			} catch (e) {
				console.error('登录异常:', e);
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
