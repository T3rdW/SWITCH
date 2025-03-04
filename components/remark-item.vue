<template>
	<view class="remark-item">
		<view class="title">备注</view>
		<view class="content">{{ remark }}</view>
	</view>
</template>

<script>
	export default {
		name: 'RemarkItem',
		props: {
			remark: {
				type: String,
				default: '--'
			}
		}
	}
</script>

<style lang="scss">
.remark-item {
	background-color: #fff;
	padding: 12px 15px;
	display: flex;
	position: relative;
	border-top: 0.5px solid #eee;

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