from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import CustomUser, EmailVerification, ServiceArea, Category, CarBrand, Favorite
from django.utils import timezone

class CustomUserAdmin(UserAdmin):
    list_display = ('username', 'email', 'role', 'is_verified', 'can_provide_services', 'can_request_services', 'is_staff', 'is_active')
    list_filter = ('role', 'is_verified', 'can_provide_services', 'can_request_services', 'is_staff', 'is_active')
    search_fields = ('username', 'email')
    ordering = ('username',)
    
    fieldsets = UserAdmin.fieldsets + (
        ('Özel Alanlar', {'fields': ('role', 'is_verified', 'can_provide_services', 'can_request_services', 'phone_number')}),
    )
    
    add_fieldsets = UserAdmin.add_fieldsets + (
        ('Özel Alanlar', {'fields': ('role', 'is_verified', 'can_provide_services', 'can_request_services', 'phone_number')}),
    )
    
    actions = ['upgrade_to_vendor', 'downgrade_to_client']
    
    def upgrade_to_vendor(self, request, queryset):
        """Seçili kullanıcıları vendor'a yükselt"""
        updated = queryset.update(role='vendor', can_provide_services=True, can_request_services=True)
        self.message_user(request, f'{updated} kullanıcı vendor olarak yükseltildi.')
    upgrade_to_vendor.short_description = "Seçili kullanıcıları vendor'a yükselt"
    
    def downgrade_to_client(self, request, queryset):
        """Seçili kullanıcıları client'a düşür"""
        updated = queryset.update(role='client', can_provide_services=False, can_request_services=True)
        self.message_user(request, f'{updated} kullanıcı client olarak düşürüldü.')
    downgrade_to_client.short_description = "Seçili kullanıcıları client'a düşür"

class EmailVerificationAdmin(admin.ModelAdmin):
    list_display = ('user', 'token', 'created_at', 'expires_at', 'is_used', 'is_expired')
    list_filter = ('is_used', 'created_at')
    search_fields = ('user__email', 'token')
    readonly_fields = ('token', 'created_at')
    ordering = ('-created_at',)

class ServiceAreaAdmin(admin.ModelAdmin):
    list_display = ('name', 'description')
    search_fields = ('name',)
    ordering = ('name',)

class CategoryAdmin(admin.ModelAdmin):
    list_display = ('name', 'service_area', 'description')
    list_filter = ('service_area',)
    search_fields = ('name', 'description')
    ordering = ('service_area', 'name')

class CarBrandAdmin(admin.ModelAdmin):
    list_display = ('name', 'logo', 'is_active', 'created_at')
    list_filter = ('is_active', 'created_at')
    search_fields = ('name', 'description')
    ordering = ('name',)
    readonly_fields = ('created_at', 'updated_at')

class FavoriteAdmin(admin.ModelAdmin):
    list_display = ('user', 'vendor', 'created_at')
    list_filter = ('created_at',)
    search_fields = ('user__email', 'vendor__display_name', 'vendor__company_title')
    readonly_fields = ('created_at',)
    ordering = ('-created_at',)
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('user', 'vendor')


admin.site.register(CustomUser, CustomUserAdmin)
admin.site.register(EmailVerification, EmailVerificationAdmin)
admin.site.register(ServiceArea, ServiceAreaAdmin)
admin.site.register(Category, CategoryAdmin)
admin.site.register(CarBrand, CarBrandAdmin)
admin.site.register(Favorite, FavoriteAdmin)
