from PIL import Image

for path in [r'C:\Users\dabiv\Downloads\images.jfif', r'C:\Users\dabiv\Downloads\nj2k8acllnah1.png']:
    try:
        im = Image.open(path)
        print(f"File: {path}")
        print(f"  Format: {im.format}, Mode: {im.mode}, Size: {im.size} (Width x Height)")
    except Exception as e:
        print(f"Error {path}: {e}")
