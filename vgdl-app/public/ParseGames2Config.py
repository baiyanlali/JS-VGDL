import os
import json

def get_txt_file_paths(root_folder):
    all_txt_file_paths = []

    for folder_name in os.listdir(root_folder):
        folder_path = os.path.join(root_folder, folder_name)

        if os.path.isdir(folder_path):
            txt_file_paths = []

            for root, dirs, files in os.walk(folder_path):
                for file in files:
                    if file.endswith(".txt"):
                        txt_file_paths.append(os.path.join(root, file))

            if txt_file_paths:
                all_txt_file_paths.append({
                    "folder_name": folder_name,
                    "txt_paths": txt_file_paths
                })

    return all_txt_file_paths

def write_to_json(data, output_file):
    with open(output_file, 'w') as json_file:
        json.dump(data, json_file, indent=2)

if __name__ == "__main__":
    games_folder = "games"  # 修改为你的games文件夹路径
    output_json_file = "txt_file_paths.json"  # 修改为你想要输出的JSON文件名

    txt_paths_data = get_txt_file_paths(games_folder)
    write_to_json(txt_paths_data, output_json_file)

    print(f"TXT文件路径已写入到 {output_json_file}")
