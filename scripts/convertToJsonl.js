const fs = require('fs');
const path = require('path');

// 读取原始文件内容
const inputPath = path.join(__dirname, '../uniCloud-aliyun/database/switch_data.json');
let fileContent;
try {
  fileContent = fs.readFileSync(inputPath, 'utf8');
  console.log('读取文件成功，文件大小:', fileContent.length, '字节');

  // 检查文件内容是否为空
  if (!fileContent.trim()) {
    console.error('错误: 文件内容为空');
    process.exit(1);
  }

  // 检查是否是有效的 JSON 数组
  if (!fileContent.trim().startsWith('[') || !fileContent.trim().endsWith(']')) {
    console.error('错误: 文件内容不是有效的 JSON 数组');
    process.exit(1);
  }

  // 尝试解析整个 JSON 文件
  const originalData = JSON.parse(fileContent);
  console.log('JSON 解析成功，数组长度:', originalData.length);

  // 直接使用解析后的数据
  const jsonLines = originalData.map(item => JSON.stringify(item)).join('\n');

  // 确保输出目录存在
  const outputDir = path.join(__dirname, '../uniCloud-aliyun/database');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // 写入新文件
  const outputPath = path.join(outputDir, 'switches.jsonl');
  fs.writeFileSync(outputPath, jsonLines);

  console.log('转换完成！文件已保存到:', outputPath);
  console.log('总共转换了', originalData.length, '条数据');

} catch (e) {
  if (e instanceof SyntaxError) {
    console.error('JSON 格式错误:', e.message);
    console.error('错误位置:', e.pos);
    // 显示错误附近的内容
    console.error('错误附近的内容:');
    console.error(fileContent.substr(Math.max(0, e.pos - 50), 100));
  } else {
    console.error('读取文件失败:', e);
  }
  process.exit(1);
}