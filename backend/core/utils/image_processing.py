"""
Merkezi görsel işleme utility fonksiyonları
Tüm görsel işleme işlemleri burada toplanmıştır - performans odaklı, yüksek trafik için optimize edilmiş
"""
from PIL import Image
from io import BytesIO
from django.core.files.base import ContentFile
import os


def normalize_image_mode(img):
    """
    Görsel modunu normalize eder (RGBA/LA/P -> RGB)
    
    Args:
        img: PIL Image objesi
    
    Returns:
        PIL Image: RGB modunda normalize edilmiş görsel
    """
    if img.mode in ('RGBA', 'LA'):
        # Transparent arka plan için beyaz arka plan oluştur
        background = Image.new('RGB', img.size, (255, 255, 255))
        if img.mode == 'RGBA':
            background.paste(img, mask=img.split()[3])  # Alpha channel'ı mask olarak kullan
        else:
            background.paste(img)
        return background
    elif img.mode == 'P':
        # Palette modunu RGB'ye çevir
        return img.convert('RGB')
    elif img.mode not in ('RGB', 'L'):
        return img.convert('RGB')
    return img


def optimize_image_to_webp(image_file, max_size=(1920, 1920), quality=85, method=4):
    """
    Görseli WebP formatına dönüştürür ve optimize eder.
    Yüksek trafik için optimize edilmiş, kalite korunarak boyut minimize edilir.
    
    Args:
        image_file: Django UploadedFile veya file-like object
        max_size: Maksimum boyut (width, height) - aspect ratio korunur
        quality: WebP kalite ayarı (1-100, 85 önerilir - kalite/boyut dengesi)
        method: WebP compression method (0-6, 4 önerilir - performans/boyut dengesi)
    
    Returns:
        ContentFile: WebP formatında optimize edilmiş görsel
    
    Raises:
        ValueError: Görsel işleme hatası durumunda
    """
    try:
        # Görseli aç
        img = Image.open(image_file)
        
        # Orijinal boyutları al
        original_width, original_height = img.size
        
        # Modu normalize et
        img = normalize_image_mode(img)
        
        # Boyut kontrolü ve resize (aspect ratio korunarak)
        # Sadece gerekirse resize et (performans için)
        if original_width > max_size[0] or original_height > max_size[1]:
            img.thumbnail(max_size, Image.Resampling.LANCZOS)
        
        # WebP formatında optimize et
        buffer = BytesIO()
        img.save(
            buffer,
            format='WEBP',
            quality=quality,
            method=method
        )
        buffer.seek(0)
        
        return ContentFile(buffer.read(), name='optimized.webp')
        
    except Exception as e:
        # Hata durumunda exception fırlat (view'da handle edilecek)
        raise ValueError(f"Görsel işleme hatası: {str(e)}")


def process_image_to_jpeg(image_file, target_size=None, quality=85, crop_to_aspect=None):
    """
    Görseli JPEG formatına dönüştürür ve optimize eder.
    Belirli boyutlara resize edebilir veya aspect ratio'ya göre crop yapabilir.
    
    Args:
        image_file: Django UploadedFile veya file-like object
        target_size: Hedef boyut (width, height) - None ise resize yapılmaz
        quality: JPEG kalite ayarı (1-100, 85 önerilir)
        crop_to_aspect: Aspect ratio'ya göre crop yapılacaksa (width, height) tuple
    
    Returns:
        ContentFile: JPEG formatında optimize edilmiş görsel
    
    Raises:
        ValueError: Görsel işleme hatası durumunda
    """
    try:
        # Görseli aç
        img = Image.open(image_file)
        
        # Modu normalize et
        img = normalize_image_mode(img)
        
        # Aspect ratio'ya göre crop yap
        if crop_to_aspect:
            target_width, target_height = crop_to_aspect
            target_aspect = target_width / target_height
            original_width, original_height = img.size
            original_aspect = original_width / original_height
            
            if original_aspect > target_aspect:
                # Resim daha geniş, yükseklikten crop yap
                new_height = original_height
                new_width = int(original_height * target_aspect)
                left = (original_width - new_width) // 2
                img = img.crop((left, 0, left + new_width, new_height))
            elif original_aspect < target_aspect:
                # Resim daha yüksek, genişlikten crop yap
                new_width = original_width
                new_height = int(original_width / target_aspect)
                top = (original_height - new_height) // 2
                img = img.crop((0, top, new_width, top + new_height))
        
        # Resize yap
        if target_size:
            target_width, target_height = target_size
            # Eğer crop yapılmadıysa ve boyutlar farklıysa resize et
            if not crop_to_aspect or (img.size[0] != target_width or img.size[1] != target_height):
                img = img.resize((target_width, target_height), Image.Resampling.LANCZOS)
        
        # JPEG formatında optimize et
        buffer = BytesIO()
        img.save(
            buffer,
            format='JPEG',
            quality=quality,
            optimize=True
        )
        buffer.seek(0)
        
        return ContentFile(buffer.read(), name='optimized.jpg')
        
    except Exception as e:
        raise ValueError(f"Görsel işleme hatası: {str(e)}")


def process_avatar_image(image_file, size=(200, 200), quality=85):
    """
    Avatar görselini işler - belirli boyutta, kare formatında, ortalanmış.
    
    Args:
        image_file: Django UploadedFile veya file-like object
        size: Hedef boyut (width, height) - varsayılan (200, 200)
        quality: JPEG kalite ayarı (1-100, 85 önerilir)
    
    Returns:
        ContentFile: JPEG formatında optimize edilmiş avatar görseli
    
    Raises:
        ValueError: Görsel işleme hatası durumunda
    """
    try:
        # Görseli aç
        img = Image.open(image_file)
        
        # Modu normalize et
        img = normalize_image_mode(img)
        
        # Aspect ratio korunarak resize et
        img.thumbnail(size, Image.Resampling.LANCZOS)
        
        # Yeni canvas oluştur (kare)
        new_img = Image.new('RGB', size, (255, 255, 255))
        
        # Resmi ortala
        x = (size[0] - img.width) // 2
        y = (size[1] - img.height) // 2
        new_img.paste(img, (x, y))
        
        # JPEG formatında optimize et
        buffer = BytesIO()
        new_img.save(
            buffer,
            format='JPEG',
            quality=quality,
            optimize=True
        )
        buffer.seek(0)
        
        return ContentFile(buffer.read(), name='avatar.jpg')
        
    except Exception as e:
        raise ValueError(f"Avatar işleme hatası: {str(e)}")

