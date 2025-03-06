<template>
	<view class="related-keyboards-item">
		<view class="title">相关键盘</view>
		<view class="content">{{ keyboards }}</view>
	</view>
</template>

<script>
	export default {
		name: 'RelatedKeyboardsItem',
		props: {
			keyboards: {
				type: String,
				default: '--'
			}
		}
	}
</script>

<style lang="scss">
.related-keyboards-item {
	background-color: #fff;
	padding: 12px 15px;
	display: flex;
	position: relative;
	border-top: 1px solid #EBEEF5;

	.title {
		flex: none;
		width: 100px;
		font-size: 14px;
		color: #666;
	}

	.content {
		flex: 1;
		font-size: 14px;
		color: #333;
		text-align: left;
		padding-left: 15px;
		line-height: 1.4;
		word-break: break-all;
		min-height: 20px;
	}
}
</style>