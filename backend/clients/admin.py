from django.contrib import admin
from .models import ClientProfile

@admin.register(ClientProfile)
class ClientProfileAdmin(admin.ModelAdmin):
    list_display = ('full_name', 'user_email', 'phone', 'city', 'district', 'created_at')
    list_filter = ('city', 'district', 'created_at')
    search_fields = ('first_name', 'last_name', 'user__email', 'phone')
    readonly_fields = ('created_at', 'updated_at')
    
    def user_email(self, obj):
        return obj.user.email
    user_email.short_description = 'Email'
    
    fieldsets = (
        ('Kullanıcı Bilgileri', {
            'fields': ('user',)
        }),
        ('Kişisel Bilgiler', {
            'fields': ('first_name', 'last_name', 'phone')
        }),
        ('Konum Bilgileri', {
            'fields': ('city', 'district', 'address')
        }),
        ('Ek Bilgiler', {
            'fields': ('profile_photo', 'about')
        }),
        ('Sistem Bilgileri', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
