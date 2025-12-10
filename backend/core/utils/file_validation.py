"""
File validation utilities for secure file uploads.
Validates files using magic bytes (file signatures) and MIME types.
"""

from typing import Tuple, List, Optional
from django.core.files.uploadedfile import UploadedFile

# Allowed MIME types for images
ALLOWED_IMAGE_MIME_TYPES = {
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
}

# Allowed file extensions (fallback)
ALLOWED_IMAGE_EXTENSIONS = {
    '.jpg',
    '.jpeg',
    '.png',
    '.gif',
    '.webp',
}


def get_file_signature(file: UploadedFile, num_bytes: int = 12) -> bytes:
    """
    Read the first N bytes of a file to check its signature.
    """
    current_position = file.tell()
    file.seek(0)
    signature = file.read(num_bytes)
    file.seek(current_position)  # Reset file pointer
    return signature


def validate_image_file_signature(file: UploadedFile) -> Tuple[bool, Optional[str]]:
    """
    Validate image file using magic bytes (file signature).
    """
    signature = get_file_signature(file, 12)

    # Check JPEG
    if signature.startswith(b'\xff\xd8\xff'):
        return True, 'jpeg'

    # Check PNG
    if signature.startswith(b'\x89\x50\x4e\x47\x0d\x0a\x1a\x0a'):
        return True, 'png'

    # Check GIF
    if signature.startswith(b'\x47\x49\x46\x38\x37\x61') or signature.startswith(b'\x47\x49\x46\x38\x39\x61'):
        return True, 'gif'

    # Check WebP (RIFF header + WEBP)
    if signature.startswith(b'\x52\x49\x46\x46'):
        # Read more bytes to check for WEBP (RIFF....WEBP)
        extended_signature = get_file_signature(file, 16)
        # WebP format: RIFF (4 bytes) + file size (4 bytes) + WEBP (4 bytes)
        if len(extended_signature) >= 12 and extended_signature[8:12] == b'WEBP':
            return True, 'webp'

    return False, None


def get_file_extension(filename: str) -> str:
    """
    Get file extension from filename (lowercase).
    """
    if '.' not in filename:
        return ''
    return '.' + filename.rsplit('.', 1)[1].lower()


def validate_image_upload(
    file: UploadedFile,
    max_size: int = 5 * 1024 * 1024,  # 5MB default
    allowed_types: Optional[List[str]] = None,
    strict_validation: bool = True
) -> Tuple[bool, Optional[str]]:
    """
    Comprehensive image file validation.

    Validates:
    1. File size
    2. Content-Type (MIME type)
    3. File extension (allowed_types'e göre)
    4. Magic bytes (file signature) - if strict_validation is True
    """
    if allowed_types is None:
        allowed_types = list(ALLOWED_IMAGE_MIME_TYPES)

    # 1. File size validation
    if file.size > max_size:
        return False, f'Dosya boyutu {max_size / (1024 * 1024):.1f}MB\'dan büyük olamaz'

    if file.size == 0:
        return False, 'Dosya boş olamaz'

    # 2. Content-Type validation
    content_type = getattr(file, 'content_type', '')
    if content_type not in allowed_types:
        return False, f'Geçersiz dosya türü. İzin verilen türler: {", ".join(allowed_types)}'

    # 3. File extension validation (allowed_types'a göre)
    filename = getattr(file, 'name', '')
    file_extension = get_file_extension(filename)

    allowed_extensions_map = {
        'image/jpeg': ['.jpg', '.jpeg'],
        'image/jpg': ['.jpg', '.jpeg'],  # image/jpg standart değil ama yine de kontrol edelim
        'image/png': ['.png'],
        'image/webp': ['.webp'],
        'image/gif': ['.gif'],
    }

    allowed_extensions = set()
    for mime_type in allowed_types:
        if mime_type in allowed_extensions_map:
            allowed_extensions.update(allowed_extensions_map[mime_type])

    if file_extension and file_extension not in allowed_extensions:
        return False, f'Geçersiz dosya uzantısı. İzin verilen uzantılar: {", ".join(sorted(allowed_extensions))}'

    # 4. Magic bytes validation (strict validation)
    if strict_validation:
        is_valid_signature, detected_format = validate_image_file_signature(file)
        if not is_valid_signature:
            return False, 'Dosya içeriği geçersiz. Dosya gerçek bir görsel dosyası değil.'

        # Verify that detected format matches content_type
        expected_format = content_type.split('/')[-1].lower()
        if expected_format == 'jpg':
            expected_format = 'jpeg'

        # Format mapping (esneklik için)
        format_mapping = {
            'jpeg': 'jpeg',
            'jpg': 'jpeg',
        }

        normalized_detected = format_mapping.get(detected_format, detected_format)
        normalized_expected = format_mapping.get(expected_format, expected_format)

        # WebP uyumu
        if normalized_expected == 'webp' and detected_format == 'webp':
            pass
        elif normalized_detected != normalized_expected:
            # JPEG varyasyonları
            if not (normalized_expected == 'jpeg' and normalized_detected == 'jpeg'):
                # WebP'yi de kabul et (herhangi bir görsel WebP'ye dönüştürülebilir)
                if detected_format != 'webp':
                    return False, f'Dosya içeriği ile bildirilen tür uyuşmuyor. Beklenen: {expected_format}, Tespit edilen: {detected_format}'

    return True, None


def validate_file_upload(
    file: UploadedFile,
    file_type: str = 'image',  # 'image', 'document', etc.
    max_size: int = 5 * 1024 * 1024,
    allowed_types: Optional[List[str]] = None,
    strict_validation: bool = True
) -> Tuple[bool, Optional[str]]:
    """
    Generic file upload validation.
    """
    if file_type == 'image':
        return validate_image_upload(
            file,
            max_size=max_size,
            allowed_types=allowed_types,
            strict_validation=strict_validation
        )

    # Basic validation for other file types
    if file.size > max_size:
        return False, f'Dosya boyutu {max_size / (1024 * 1024):.1f}MB\'dan büyük olamaz'

    if file.size == 0:
        return False, 'Dosya boş olamaz'

    if allowed_types and getattr(file, 'content_type', '') not in allowed_types:
        return False, f'Geçersiz dosya türü. İzin verilen türler: {", ".join(allowed_types)}'

    return True, None

