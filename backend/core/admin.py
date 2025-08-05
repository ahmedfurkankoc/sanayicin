from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import CustomUser, EmailVerification, ServiceArea, Category, CarBrand

class CustomUserAdmin(UserAdmin):
    list_display = ('username', 'email', 'role', 'email_verified', 'is_staff', 'is_active')
    list_filter = ('role', 'email_verified', 'is_staff', 'is_active')
    search_fields = ('username', 'email')
    ordering = ('username',)
    
    fieldsets = UserAdmin.fieldsets + (
        ('Özel Alanlar', {'fields': ('role', 'email_verified')}),
    )
    
    add_fieldsets = UserAdmin.add_fieldsets + (
        ('Özel Alanlar', {'fields': ('role', 'email_verified')}),
    )

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

admin.site.register(CustomUser, CustomUserAdmin)
admin.site.register(EmailVerification, EmailVerificationAdmin)
admin.site.register(ServiceArea, ServiceAreaAdmin)
admin.site.register(Category, CategoryAdmin)
admin.site.register(CarBrand, CarBrandAdmin)
