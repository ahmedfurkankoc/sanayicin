"""
Orphaned data temizleme komutu
VendorProfile_service_areas tablosundaki geçersiz foreign key'leri temizler
"""
from django.core.management.base import BaseCommand
from django.db import connection


class Command(BaseCommand):
    help = 'Orphaned VendorProfile_service_areas kayıtlarını temizler'

    def handle(self, *args, **options):
        with connection.cursor() as cursor:
            # VendorProfile tablosunu bul
            cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='VendorProfile'")
            result = cursor.fetchone()
            
            if not result:
                self.stdout.write(self.style.WARNING('VendorProfile tablosu bulunamadı'))
                return
            
            vendor_table = result[0]
            total_deleted = 0
            
            # Tüm VendorProfile many-to-many tablolarını temizle
            many_to_many_tables = [
                'VendorProfile_service_areas',
                'VendorProfile_categories',
                'VendorProfile_car_brands',
            ]
            
            for table_name in many_to_many_tables:
                # Tablo var mı kontrol et
                cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='%s'" % table_name)
                if not cursor.fetchone():
                    continue
                
                # Geçersiz foreign key'leri bul ve sil
                cursor.execute(f"""
                    DELETE FROM {table_name}
                    WHERE vendorprofile_id NOT IN (
                        SELECT id FROM {vendor_table}
                    )
                """)
                deleted_count = cursor.rowcount
                total_deleted += deleted_count
                
                if deleted_count > 0:
                    self.stdout.write(
                        self.style.SUCCESS(
                            f'✓ {table_name}: {deleted_count} adet geçersiz kayıt temizlendi'
                        )
                    )
            
            if total_deleted > 0:
                self.stdout.write(
                    self.style.SUCCESS(
                        f'\n✓ Toplam {total_deleted} adet geçersiz kayıt temizlendi'
                    )
                )
            else:
                self.stdout.write(
                    self.style.SUCCESS('✓ Geçersiz kayıt bulunamadı')
                )

