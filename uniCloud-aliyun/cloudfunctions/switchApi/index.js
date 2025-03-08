'use strict';
const db = uniCloud.database()
const collection = db.collection('switches')
const fs = require('fs')

exports.main = async (event, context) => {
	console.log('event : ', event)

	const { action, code } = event;

	switch (action) {
		case 'silentLogin':
			try {
				// 直接使用微信小程序API获取openid
				const appid = 'wx42b1bce7eb958f9d';
				const secret = 'd14617509df50df90f0c212988e8238c';

				if (!code) {
					return {
						errCode: -1,
						errMsg: '缺少code参数'
					};
				}

				// 调用微信接口获取openid
				const res = await uniCloud.httpclient.request(
					`https://api.weixin.qq.com/sns/jscode2session?appid=${appid}&secret=${secret}&js_code=${code}&grant_type=authorization_code`,
					{
						dataType: 'json'
					}
				);

				if (res.status === 200 && res.data && res.data.openid) {
					return {
						errCode: 0,
						openid: res.data.openid
					};
				} else {
					return {
						errCode: -1,
						errMsg: res.data.errmsg || '获取openid失败'
					};
				}
			} catch (e) {
				return {
					errCode: -1,
					errMsg: e.message
				};
			}
			break;
		case 'search':
			// 搜索不需要权限验证
			return await searchSwitches(event.params)
		case 'getSwitchById':
			// 获取详情不需要权限验证
			return await getSwitchById(event.id)
		case 'add':
			return await addSwitch(event.data)
		case 'updateSwitch':
			return await updateSwitch(event)
		case 'updateSwitchImages':
			return await updateSwitchImages(event)
		case 'getAll':
			console.log('执行获取所有数据操作');
			return await getAllSwitches()
		case 'delete':
			return await deleteSwitch(event.id)
		case 'uploadImage':
			return await uploadImage(event.tempFilePath, event.cloudPath)
		case 'updateSwitchImage':
			return await updateSwitchImage(event)
		case 'deleteCloudFile':
			return await deleteCloudFile(event)
		case 'deleteSwitchImage': {
			const { switchId, imageIndex, fileID } = event
			console.log('删除图片参数:', { switchId, imageIndex, fileID });

			// 参数验证
			if (!switchId || imageIndex === undefined || !fileID) {
				return {
					errCode: 1,
					errMsg: '参数不完整'
				}
			}

			try {
				// 1. 删除云存储中的文件
				await uniCloud.deleteFile({
					fileList: [fileID]
				})

				// 2. 更新数据库中的图片数组
				// 先获取当前数据
				const switchData = await collection.doc(switchId).get();
				console.log('获取到的轴体数据:', switchData.data[0]);

				if (!switchData.data || !switchData.data[0]) {
					throw new Error('未找到轴体数据');
				}

				// 获取当前图片数组
				let previewImages = switchData.data[0].preview_images || [];

				// 验证索引是否有效
				if (imageIndex < 0 || imageIndex >= previewImages.length) {
					throw new Error('无效的图片索引');
				}

				// 验证要删除的图片是否匹配
				if (previewImages[imageIndex].fileID !== fileID) {
					throw new Error('图片信息不匹配');
				}

				console.log('删除前的图片数组:', previewImages);

				// 移除指定索引的图片
				previewImages.splice(imageIndex, 1);
				console.log('删除后的图片数组:', previewImages);

				// 更新数据库
				const res = await collection.doc(switchId).update({
					preview_images: previewImages,
					update_time: new Date().toISOString(),
					updated_by: context.OPENID || 'system', // 记录操作者
					updated_at: Date.now() // 使用时间戳
				});

				return {
					errCode: 0,
					errMsg: '删除成功',
					data: {
						updated: res.updated,
						modifiedCount: res.modifiedCount,
						imageCount: previewImages.length,
						timestamp: Date.now()
					}
				}
			} catch (e) {
				console.error('删除图片失败:', e);
				return {
					errCode: 1,
					errMsg: e.message || '删除图片失败',
					error: {
						type: e.name,
						message: e.message,
						stack: process.env.NODE_ENV === 'development' ? e.stack : undefined
					}
				}
			}
		}
		case 'toggleFavorite': {
			const { switchId, openid } = event;

			// 参数验证
			if (!switchId || !openid) {
				return {
					errCode: 1,
					errMsg: '参数不完整'
				};
			}

			try {
				const favoriteDB = db.collection('user_favorites');

				// 查询是否已收藏
				const favoriteRecord = await favoriteDB.where({
					openid: openid,
					switch_id: switchId
				}).get();

				// 如果已收藏，则取消收藏
				if (favoriteRecord.data && favoriteRecord.data.length > 0) {
					await favoriteDB.doc(favoriteRecord.data[0]._id).remove();
					return {
						errCode: 0,
						isFavorited: false,
						errMsg: '取消收藏成功'
					};
				}
				// 如果未收藏，则添加收藏
				else {
					await favoriteDB.add({
						openid: openid,
						switch_id: switchId,
						create_time: new Date()
					});
					return {
						errCode: 0,
						isFavorited: true,
						errMsg: '收藏成功'
					};
				}
			} catch (e) {
				console.error('收藏操作失败:', e);
				return {
					errCode: 1,
					errMsg: '操作失败: ' + e.message
				};
			}
		}
		case 'checkFavorite': {
			const { switchId, openid } = event;

			// 参数验证
			if (!switchId || !openid) {
				return {
					errCode: 1,
					errMsg: '参数不完整'
				};
			}

			try {
				const favoriteDB = db.collection('user_favorites');

				// 查询是否已收藏
				const favoriteRecord = await favoriteDB.where({
					openid: openid,
					switch_id: switchId
				}).get();

				return {
					errCode: 0,
					isFavorited: favoriteRecord.data && favoriteRecord.data.length > 0
				};
			} catch (e) {
				console.error('检查收藏状态失败:', e);
				return {
					errCode: 1,
					errMsg: '查询失败: ' + e.message
				};
			}
		}
		case 'getUserFavorites': {
			const { openid } = event;

			// 参数验证
			if (!openid) {
				return {
					errCode: 1,
					errMsg: '参数不完整'
				};
			}

			try {
				const favoriteDB = db.collection('user_favorites');

				// 查询用户所有收藏
				const favoriteRecords = await favoriteDB.where({
					openid: openid
				}).get();

				// 提取收藏数据
				const favorites = favoriteRecords.data.map(item => ({
					switchId: item.switch_id,
					createTime: item.create_time
				}));

				return {
					errCode: 0,
					data: favorites
				};
			} catch (e) {
				console.error('获取收藏数据失败:', e);
				return {
					errCode: 1,
					errMsg: '查询失败: ' + e.message
				};
			}
		}
		default:
			return {
				errCode: -1,
				errMsg: '未知操作'
			}
	}
}

// 获取所有轴体数据
async function getAllSwitches() {
	try {
		const res = await collection.get()
		console.log('查询结果:', res)

		// 检查数据结构并提取轴体数据
		let switchesData = []
		if (res.data && res.data.length > 0) {
			// 如果数据是嵌套的，提取 switches 数组
			if (res.data[0].switches) {
				switchesData = res.data[0].switches
			} else {
				// 如果数据是直接的轴体数组
				switchesData = res.data
			}
		}

		return {
			code: 0,
			msg: '获取成功',
			data: switchesData
		}
	} catch (e) {
		console.error('查询出错:', e)
		return {
			code: -1,
			msg: '获取失败',
			error: e
		}
	}
}

// 搜索轴体
async function searchSwitches(params) {
	try {
		console.log('开始搜索，参数:', params)
		const dbCmd = db.command
		const query = {}

		if (params.keyword) {
			const keyword = params.keyword.trim()
			// 优化搜索逻辑
			query.$or = [
				{
					switch_name: new RegExp(keyword, 'i')
				},
				{
					switch_name_en: new RegExp(keyword, 'i')
				},
				{
					manufacturer: new RegExp(keyword, 'i')
				}
			]
		}

		console.log('构建的查询条件:', query)

		const res = await collection
			.where(query)
			.orderBy('update_time', 'desc')
			.get()

		console.log('搜索结果:', res)

		return {
			errCode: 0,
			errMsg: '搜索成功',
			data: res.data
		}
	} catch (e) {
		console.error('搜索失败:', e)
		return {
			errCode: 1,
			errMsg: e.message || '搜索失败'
		}
	}
}

// 根据ID获取轴体详情
async function getSwitchById(id) {
	try {
		if (!id) {
			return {
				errCode: -1,
				errMsg: 'ID不能为空'
			}
		}

		const res = await collection.doc(id).get()
		console.log('获取轴体详情:', res)

		if (!res.data || res.data.length === 0) {
			return {
				errCode: -1,
				errMsg: '轴体不存在'
			}
		}

		return {
			errCode: 0,
			errMsg: 'success',
			data: res.data[0]
		}
	} catch (e) {
		console.error('获取轴体详情失败:', e)
		return {
			errCode: -1,
			errMsg: '获取详情失败'
		}
	}
}

// 添加新轴体数据
async function addSwitch(data) {
	const now = new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })

	// 验证图片数据
	if (!data.preview_images || !data.preview_images.length || !data.preview_images[0].fileID) {
		return {
			errCode: -1,
			errMsg: '图片数据无效'
		}
	}

	const switchData = {
		...data,
		create_time: now,
		update_time: now,
		audit_status: '未审核' // 设置默认审核状态
	}

	try {
		const res = await collection.add(switchData)
		return {
			errCode: 0,
			errMsg: '添加成功',
			data: res
		}
	} catch (e) {
		return {
			errCode: -1,
			errMsg: '添加失败',
			error: e
		}
	}
}

// 更新轴体数据
async function updateSwitch(event) {
	const { id, data } = event

	try {
		if (!id) {
			return {
				errCode: -1,
				errMsg: 'ID不能为空'
			}
		}

		// 移除不允许修改的字段
		delete data._id
		delete data.create_time

		// 添加更新时间
		data.update_time = new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })

		const res = await collection.doc(id).update(data)

		return {
			errCode: 0,
			errMsg: '更新成功',
			data: res
		}
	} catch (e) {
		console.error('更新轴体数据失败:', e)
		return {
			errCode: -1,
			errMsg: '更新失败'
		}
	}
}

// 删除轴体数据
async function deleteSwitch(id) {
	try {
		const res = await collection.doc(id).remove()
		return {
			errCode: 0,
			errMsg: '删除成功',
			data: res
		}
	} catch (e) {
		return {
			errCode: -1,
			errMsg: '删除失败',
			error: e
		}
	}
}

// 上传图片处理
async function uploadImage(tempFilePath, cloudPath) {
	try {
		const uploadResult = await uniCloud.uploadFile({
			filePath: tempFilePath,
			cloudPath: cloudPath
		});
		return {
			errCode: 0,
			fileID: uploadResult.fileID
		};
	} catch (e) {
		return {
			errCode: -1,
			errMsg: '上传失败'
		};
	}
}

// 更新轴体图片
async function updateSwitchImage(event) {
	try {
		const { switchId, imageIndex, imageInfo } = event;
		console.log('接收到的参数:', { switchId, imageIndex, imageInfo });

		// 验证参数
		if (!switchId || imageIndex === undefined || !imageInfo) {
			console.error('参数验证失败:', { switchId, imageIndex, imageInfo });
			return {
				errCode: -1,
				errMsg: '参数错误'
			}
		}

		// 验证 fileID
		if (!imageInfo.fileID) {
			console.error('fileID 为空');
			return {
				errCode: -1,
				errMsg: '图片 fileID 不能为空'
			}
		}

		// 获取当前轴体数据
		const switchData = await collection.doc(switchId).get();
		console.log('查询到的轴体数据:', switchData);

		if (!switchData.data || !switchData.data[0]) {
			console.error('未找到轴体数据');
			return {
				errCode: -1,
				errMsg: '未找到轴体数据'
			}
		}

		// 确保 preview_images 是一个数组
		let previewImages = Array.isArray(switchData.data[0].preview_images) ?
			switchData.data[0].preview_images : [];

		// 如果 preview_images 为 null 或 undefined，初始化为空数组
		if (!previewImages) {
			previewImages = [];
		}

		console.log('当前图片数组:', previewImages);

		// 验证图片信息的完整性
		if (!imageInfo.uploadTime || !imageInfo.fileName || !imageInfo.type) {
			console.error('图片信息不完整:', imageInfo);
			return {
				errCode: -1,
				errMsg: '图片信息不完整'
			}
		}

		// 更新或添加图片信息
		if (imageIndex < previewImages.length) {
			// 更新现有图片
			previewImages[imageIndex] = imageInfo;
		} else {
			// 添加新图片
			previewImages.push(imageInfo);
		}

		console.log('更新后的图片数组:', previewImages);

		// 更新数据库
		const updateData = {
			preview_images: previewImages.map(img => ({
				fileID: img.fileID,
				type: img.type,
				fileName: img.fileName,
				uploadTime: img.uploadTime,
				updateTime: img.updateTime || ''
			})),
			update_time: new Date().toISOString()
		};
		console.log('准备更新的数据:', updateData);

		const res = await collection.doc(switchId).update(updateData);
		console.log('数据库更新结果:', res);

		if (!res.updated) {
			console.error('数据库更新失败');
			return {
				errCode: -1,
				errMsg: '数据库更新失败'
			}
		}

		return {
			errCode: 0,
			errMsg: '更新成功',
			data: res
		}
	} catch (e) {
		console.error('更新轴体图片失败:', e);
		return {
			errCode: -1,
			errMsg: '更新失败: ' + e.message,
			error: e
		}
	}
}

// 删除云存储文件
async function deleteCloudFile(event) {
	try {
		const { fileList } = event;

		if (!fileList || !Array.isArray(fileList) || fileList.length === 0) {
			return {
				errCode: -1,
				errMsg: '文件列表不能为空'
			}
		}

		const result = await uniCloud.deleteFile({
			fileList: fileList
		});

		console.log('删除文件结果:', result);

		return {
			errCode: 0,
			errMsg: '删除成功',
			data: result
		}
	} catch (e) {
		console.error('删除文件失败:', e);
		return {
			errCode: -1,
			errMsg: '删除失败: ' + e.message
		}
	}
}

// 更新轴体图片数组
async function updateSwitchImages(event) {
	const { switchId, images } = event;

	// 参数验证
	if (!switchId || !Array.isArray(images)) {
		return {
			errCode: 1,
			errMsg: '参数不完整或格式错误'
		}
	}

	try {
		// 获取北京时间的 ISO 字符串
		function getBeiJingISOString() {
			const now = new Date();
			// 获取时区偏移（北京时区 +08:00）
			const offset = 8 * 60;
			// 计算北京时间的时间戳
			const beijingTime = new Date(now.getTime() + (offset + now.getTimezoneOffset()) * 60000);
			// 返回 ISO 8601 格式的时间字符串（包含时区信息）
			return beijingTime.toISOString().replace('Z', '+08:00');
		}

		// 更新数据库
		const res = await collection.doc(switchId).update({
			preview_images: images,
			update_time: getBeiJingISOString()
		});

		return {
			errCode: 0,
			errMsg: '更新成功',
			data: {
				updated: res.updated,
				modifiedCount: res.modifiedCount
			}
		}
	} catch (e) {
		console.error('更新图片数组失败:', e);
		return {
			errCode: 1,
			errMsg: e.message || '更新失败'
		}
	}
}