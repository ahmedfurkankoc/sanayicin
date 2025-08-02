import uuid

def avatar_upload_path(instance, filename):
    """Avatar dosyası için upload path oluştur - merkezi fonksiyon"""
    # UUID ile benzersiz dosya adı oluştur
    file_uuid = str(uuid.uuid4())
    # Dosya uzantısını al
    ext = filename.split('.')[-1].lower()
    # Sadece jpg, jpeg, png kabul et
    if ext not in ['jpg', 'jpeg', 'png']:
        ext = 'jpg'
    return f'avatar/{file_uuid}_200x200.{ext}' 