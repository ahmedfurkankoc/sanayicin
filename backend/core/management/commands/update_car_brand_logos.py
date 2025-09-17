import os
import re
from django.core.management.base import BaseCommand
from django.conf import settings
from core.models import CarBrand


class Command(BaseCommand):
    help = 'CarBrand modellerine logo resimlerini atar'

    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Sadece hangi resimlerin eşleşeceğini göster, gerçekte güncelleme yapma',
        )

    def handle(self, *args, **options):
        dry_run = options['dry_run']
        
        # Resim dosyalarının bulunduğu dizin
        images_dir = os.path.join(settings.BASE_DIR, '..', 'frontend', 'public', 'images', 'car-brands')
        
        if not os.path.exists(images_dir):
            self.stdout.write(
                self.style.ERROR(f'Resim dizini bulunamadı: {images_dir}')
            )
            return

        # Resim dosyalarını al
        image_files = [f for f in os.listdir(images_dir) if f.lower().endswith('.png')]
        
        self.stdout.write(f'Bulunan resim dosyası sayısı: {len(image_files)}')
        
        # Marka isimlerini normalize etme fonksiyonu
        def normalize_brand_name(name):
            """Marka ismini resim dosya adıyla eşleştirmek için normalize eder"""
            # Küçük harfe çevir
            name = name.lower()
            # Özel karakterleri kaldır ve tire ile değiştir
            name = re.sub(r'[^\w\s-]', '', name)
            # Boşlukları tire ile değiştir
            name = re.sub(r'\s+', '-', name)
            # Çoklu tireleri tek tire yap
            name = re.sub(r'-+', '-', name)
            # Başta ve sonda tire varsa kaldır
            name = name.strip('-')
            return name

        # Eşleşmeleri bul
        matches = []
        no_matches = []
        
        for brand in CarBrand.objects.all():
            normalized_name = normalize_brand_name(brand.name)
            
            # Resim dosyası ara
            matching_files = []
            for img_file in image_files:
                img_name = img_file.lower().replace('.png', '')
                if normalized_name == img_name or normalized_name in img_name or img_name in normalized_name:
                    matching_files.append(img_file)
            
            if matching_files:
                # En iyi eşleşmeyi seç (tam eşleşme varsa onu al)
                best_match = None
                for match in matching_files:
                    if normalized_name == match.lower().replace('.png', ''):
                        best_match = match
                        break
                
                if not best_match:
                    best_match = matching_files[0]
                
                matches.append({
                    'brand': brand,
                    'image_file': best_match,
                    'normalized_name': normalized_name
                })
            else:
                no_matches.append({
                    'brand': brand,
                    'normalized_name': normalized_name
                })

        # Sonuçları göster
        self.stdout.write('\n' + '='*50)
        self.stdout.write('EŞLEŞEN MARKALAR:')
        self.stdout.write('='*50)
        
        for match in matches:
            self.stdout.write(f'✓ {match["brand"].name} -> {match["image_file"]}')
        
        self.stdout.write('\n' + '='*50)
        self.stdout.write('EŞLEŞMEYEN MARKALAR:')
        self.stdout.write('='*50)
        
        for no_match in no_matches:
            self.stdout.write(f'✗ {no_match["brand"].name} (normalized: {no_match["normalized_name"]})')
        
        if dry_run:
            self.stdout.write('\n' + self.style.WARNING('DRY RUN - Gerçek güncelleme yapılmadı'))
            return

        # Gerçek güncellemeleri yap
        if matches:
            self.stdout.write(f'\n{len(matches)} marka için logo güncelleniyor...')
            
            updated_count = 0
            for match in matches:
                try:
                    brand = match['brand']
                    image_file = match['image_file']
                    
                    # Resim dosyasının tam yolu
                    image_path = os.path.join(images_dir, image_file)
                    
                    # Django FileField'a atama
                    with open(image_path, 'rb') as f:
                        brand.logo.save(image_file, f, save=True)
                    
                    updated_count += 1
                    self.stdout.write(f'✓ {brand.name} logosu güncellendi')
                    
                except Exception as e:
                    self.stdout.write(
                        self.style.ERROR(f'✗ {brand.name} logosu güncellenirken hata: {e}')
                    )
            
            self.stdout.write(
                self.style.SUCCESS(f'\nToplam {updated_count} marka logosu başarıyla güncellendi!')
            )
        else:
            self.stdout.write(self.style.WARNING('Güncellenecek marka bulunamadı!'))

