#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
批量生成音效脚本
根据处理CSV文件生成音效，每个描述生成1个文件

使用方法:
    python batch_sound_effects.py 处理_生成音效.csv
"""

import os
import sys
import csv
import argparse
from pathlib import Path
from dotenv import load_dotenv

from elevenlabs import ElevenLabs

load_dotenv()


def read_sounds_csv(file_path: str) -> list[dict]:
    """读取音效 CSV 文件"""
    rows = []
    with open(file_path, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            rows.append(row)
    return rows


def generate_single_sound(client: ElevenLabs, description: str,
                          duration: float = None, loop: bool = False,
                          prompt_influence: float = 0.5) -> bytes:
    """生成单个音效"""
    params = {
        "text": description,
        "prompt_influence": prompt_influence,
        "loop": loop,
    }
    if duration:
        params["duration_seconds"] = duration

    audio = client.text_to_sound_effects.convert(**params)

    chunks = []
    for chunk in audio:
        chunks.append(chunk)
    return b''.join(chunks)


def main():
    parser = argparse.ArgumentParser(description="批量生成 ElevenLabs 音效")
    parser.add_argument("input_file", help="输入 CSV 文件")
    parser.add_argument("-o", "--output", default="output", help="输出目录 (默认: output)")

    args = parser.parse_args()

    client = ElevenLabs()

    print(f"读取文件: {args.input_file}")
    rows = read_sounds_csv(args.input_file)
    print(f"共 {len(rows)} 条记录")

    output_path = Path(args.output)
    output_path.mkdir(parents=True, exist_ok=True)

    total_success = 0
    total_failed = 0

    for row in rows:
        sound_id = row['id']
        name = row['name']
        description = row['description_en']
        duration_str = row.get('duration_seconds', '').strip()
        loop_str = row.get('loop', 'false').lower()
        trigger_time = row.get('trigger_time', '')

        # 解析时长，None表示自动
        duration = None
        if duration_str and duration_str.upper() != 'N/A' and duration_str.upper() != 'NULL':
            try:
                duration = float(duration_str)
                if duration < 0.5:
                    duration = None  # API要求最少0.5秒
            except ValueError:
                duration = None

        # 解析循环
        loop = loop_str == 'true'

        # 生成文件名
        safe_name = "".join(c if c.isalnum() or c in ' -_' else '_' for c in name[:15])
        output_file = output_path / f"{sound_id}_{safe_name}.mp3"

        duration_info = f"{duration}s" if duration else "auto"
        print(f"[{sound_id}] {name} | 时长: {duration_info} | 循环: {loop} | {description[:35]}...")

        try:
            audio_data = generate_single_sound(
                client, description, duration, loop
            )

            with open(output_file, 'wb') as f:
                f.write(audio_data)

            print(f"    -> {output_file.name} ({len(audio_data)} bytes)")
            total_success += 1

        except Exception as e:
            print(f"    -> 错误: {e}")
            total_failed += 1

    print(f"\n{'='*50}")
    print(f"完成! 成功: {total_success}, 失败: {total_failed}")
    print(f"输出目录: {output_path.absolute()}")


if __name__ == "__main__":
    main()
