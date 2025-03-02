'use strict';
const db = uniCloud.database()
const collection = db.collection('switches')

exports.main = async (event, context) => {
	const action = event.action

	switch (action) {
		case 'search':
			return await searchSwitches(event.params)
		case 'getSwitchById':
			return await getSwitchById(event.id)
		case 'add':
			return await addSwitch(event.data)
		case 'updateSwitch':
			return await updateSwitch(event)
		case 'getAll':
			console.log('执行获取所有数据操作');
			return await getAllSwitches()
		case 'delete':
			return await deleteSwitch(event.id)
		case 'uploadImage':
			return await uploadImage(event.tempFilePath, event.cloudPath)
		case 'updateSwitchImage':
			try {
				const { switchId, imageIndex, imageInfo } = event;

				// 验证参数
				if (!switchId || imageIndex === undefined || !imageInfo) {
					return {
						code: -1,
						msg: '参数错误'
					};
				}

				// 更新数据库
				const res = await db.collection('switches').doc(switchId).update({
					[`images.${imageIndex}`]: imageInfo
				});

				return {
					code: 0,
					msg: '更新成功',
					data: res
				};
			} catch (e) {
				console.error(e);
				return {
					code: -1,
					msg: e.message || '更新失败'
				};
			}
		default:
			return {
				code: -1,
				msg: '未知操作'
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
		const {keyword, page = 1, pageSize = 20} = params

		if (!keyword) {
			return {
				code: -1,
				msg: '搜索关键词不能为空'
			}
		}

		console.log('云函数开始搜索:', {
			keyword,
			page,
			pageSize
		})

		// 构建查询条件
		const query = {
			name: new RegExp(keyword)
		}

		console.log('查询条件:', query)

		// 先测试查询条件
		const testCount = await collection
			.where(query)
			.count()

		console.log('匹配记录数:', testCount)

		// 查询数据
		const list = await collection
			.where(query)
			.skip((page - 1) * pageSize)
			.limit(pageSize)
			.get()

		console.log('查询结果:', {
			total: testCount.total,
			listLength: list.data.length,
			firstItem: list.data[0]
		})

		return {
			code: 0,
			msg: 'success',
			data: {
				list: list.data,
				total: testCount.total,
				pageSize,
				page
			}
		}

	} catch (e) {
		console.error('搜索轴体失败:', e)
		return {
			code: -1,
			msg: '搜索失败: ' + e.message
		}
	}
}

// 根据ID获取轴体详情
async function getSwitchById(id) {
	try {
		if (!id) {
			return {
				code: -1,
				msg: 'ID不能为空'
			}
		}

		const res = await collection.doc(id).get()
		console.log('获取轴体详情:', res)

		if (!res.data || res.data.length === 0) {
			return {
				code: -1,
				msg: '轴体不存在'
			}
		}

		return {
			code: 0,
			msg: 'success',
			data: res.data[0]
		}
	} catch (e) {
		console.error('获取轴体详情失败:', e)
		return {
			code: -1,
			msg: '获取详情失败'
		}
	}
}

// 添加新轴体数据
async function addSwitch(data) {
	const now = new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })

	// 验证图片数据
	if (!data.preview_image || !data.preview_image.fileID) {
		return {
			code: -1,
			msg: '图片数据无效'
		}
	}

	const switchData = {
		...data,
		create_time: now,
		update_time: now
	}

	try {
		const res = await collection.add(switchData)
		return {
			code: 0,
			msg: '添加成功',
			data: res
		}
	} catch (e) {
		return {
			code: -1,
			msg: '添加失败',
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
				code: -1,
				msg: 'ID不能为空'
			}
		}

		// 移除不允许修改的字段
		delete data._id
		delete data.create_time

		// 添加更新时间
		data.update_time = new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })

		const res = await collection.doc(id).update(data)

		return {
			code: 0,
			msg: '更新成功',
			data: res
		}
	} catch (e) {
		console.error('更新轴体数据失败:', e)
		return {
			code: -1,
			msg: '更新失败'
		}
	}
}

// 删除轴体数据
async function deleteSwitch(id) {
	try {
		const res = await collection.doc(id).remove()
		return {
			code: 0,
			msg: '删除成功',
			data: res
		}
	} catch (e) {
		return {
			code: -1,
			msg: '删除失败',
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
			code: 0,
			fileID: uploadResult.fileID
		};
	} catch (e) {
		return {
			code: -1,
			msg: '上传失败'
		};
	}
}