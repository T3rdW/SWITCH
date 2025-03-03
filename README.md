"角色: 微信小程序工程师

要求:使用uni-app框架来编写小程序的代码以及使用uni-ui组件库来设计这个小程序的UI界面,使用unicloud云数据库来存储数据,使用uni-id来管理用户以及轴体数据库(大约有1000多个轴体数据库).我会使用Hbuilder来调试小程序进行编译.我已编写了首页的部分代码,并优化逻辑,减少代码的冗余,减少数据库读写操作次数来达到最优的效果
1.你是一个有着10多年开发经验的前后端工程师


2.我需要做一个微信小程序要求:
1)制作一个机械键盘的轴体的搜索工具.主页有搜索栏(search-bar),搜索显示数据库内的轴体,使用uni-list组件来显示轴体,使用uni-card组件来显示轴体信息,使用uni-grid组件来显示轴体预览图片
2)帮我设计一个数据库结构,方便以后扩展(轴体参数包含:名称;预览图片;代工厂;轴心材质;上盖材质;底壳材质;触发压力;触发行程;触底压力;触底行程;弹簧长度;价位;轴体分类;有无厂润;寿命;轴体上市时间;备注;数据来源;审核状态;)
3.你现在已经在微信小程序的目录中,无需创建或新建目录
我想使用unicloud云数据库模式来进行调用,优化逻辑,减少数据库读写操作次数来达到最优的效果
4.数据库结构是jsonline格式的

界面:
1.首页组件:
1)搜索栏(search-bar)
2)搜索结果(search-result)
3)搜索历史(search-history)
4)轴体列表(switch-list)
5)轴体详情(switch-detail)

界面简称:
1.首页:index
2.详情页:switchInfo
3.图片管理:imageManager

数据库:
1.数据库是jsonline格式的,因为需要存储大量的数据,所以使用jsonline格式,也是云存储数据库要求的上传格式
3.数据库是unicloud的阿里云的云数据库
4.图片保存在云存储中
5.对数据库一些返回非正常信息的错误进行处理或调试
6.对数据库的读写操作进行优化,减少数据库读写操作次数来达到最优的效果

数据库字段:
1.名称(switch_name): 轴体名称，通常为品牌名称。
2.英文名称(switch_name_en): 轴体英文名称，通常为品牌名称。
3.预览图片(preview_images): 轴体预览图片，通常为图片数组。
4.代工厂(manufacturer): 轴体制造商，通常为品牌名称。
5.轴芯材质(stem_material): 轴芯常用材料包括POM（自润滑尼龙）、改性塑料或透明PC（透光用）。
5.上盖材质(top_housing_material): 上盖材质通常为PC（透光用）、尼龙或POM。
6.底壳材质(bottom_housing_material): 底壳材质通常为尼龙或POM。
7.触发压力(actuation_force): 轴芯从初始位置到触发点的压力，单位为克力（gf）。示例：Cherry MX红轴触发压力45gf
8.触发行程(actuation_travel): 轴芯从初始位置到触发点的位移距离，单位毫米（mm）。示例：银轴触发行程1.2mm
9.触底压力(bottom_force): 轴芯从初始位置到完全触底（底部撞击）的压力，单位为克力（gf）。示例：Cherry MX红轴触底压力60gf
10.触底行程(bottom_out_travel): 轴芯从初始位置到完全触底（底部撞击）的位移距离，单位毫米（mm）。示例：Cherry MX红轴触底行程4mm
11.总行程(total_travel): 轴芯从初始位置到触底的总移动距离，包含触发行程和后续行程。示例：银轴总行程3.4mm
12.弹簧长度(spring_length): 弹簧长度，通常为毫米（mm）。
13.价位(price): 轴体价格，单位为元。
14.轴体类型(switch_type): 按结构分为线性轴（Linear）、段落轴（Tactile）、有声段落轴（Clicky）。
15.有无厂润(factory_lube): 是否添加了润滑油，通常用于线性轴。
16.寿命(lifespan): 轴体寿命，单位为次。
17.轴体上市时间(release_date): 轴体上市时间，通常为年份。
18.备注(remark): 轴体备注信息。
19.数据来源(data_source): 数据来源，通常为官方数据或用户反馈。
20.创建时间(create_time): 轴体数据创建时间。
21.更新时间(update_time): 轴体数据更新时间。
22.审核状态(audit_status): 轴体数据审核状态，通常为未审核、审核中或已审核。
23.相关键盘(related_keyboards): 与轴体相关的键盘型号数组。
24.停产(discontinued): 轴体是否停产，通常为true或false。

规则:
1.文件命名规则改为：轴体名称_图片类型_序号.webp
例如：Hyacinth_V2U_main_1.webp
或：Hyacinth_V2U_detail_2.webp

2.只需要对名称(name 字段)进行包含匹配搜索

3.使用 uni.showLoading 和 uni.hideLoading 来显示加载状态
4.使用 uni.showToast 来显示错误信息
5.使用 uni.showModal 来显示确认框
6.使用 uni.showActionSheet 来显示操作菜单
7.使用 uni.showTabBar 来显示底部导航栏
8.使用 uni.showToast 来显示提示信息
9.使用 uni.showToast 来显示提示信息
10.使用 uni.showToast 来显示提示信息

凡是涉及云函数、云存储的操作，都使用 uniCloud