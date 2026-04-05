# Batch Sound Effects Generator

使用 ElevenLabs API 批量生成音效的 Python 脚本。

## 安装

```bash
pip install -r requirements.txt
```

## 配置

创建 `.env` 文件，添加你的 ElevenLabs API Key：

```
ELEVENLABS_API_KEY=your_api_key_here
```

## 使用方法

### 批量生成

准备一个 CSV 文件，包含以下列：
- `id` - 音效唯一标识
- `name` - 音效名称
- `description_en` - 英文描述
- `duration_seconds` (可选) - 时长（秒）
- `loop` (可选) - 是否循环

运行：

```bash
python batch_sound_effects.py 你的音效列表.csv
```

### 单个生成

你也可以直接修改脚本中的 `generate_single_sound` 函数来生成单个音效。

## 输出

生成的 MP3 文件会保存在 `output/` 目录下。
