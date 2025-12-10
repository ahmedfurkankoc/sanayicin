from django.contrib import admin
from .models import AuditLog


@admin.register(AuditLog)
class AuditLogAdmin(admin.ModelAdmin):
    """Audit Log Admin - Asla silinmez"""
    
    list_display = ('timestamp', 'action', 'username', 'ip_address', 'get_metadata_summary')
    list_filter = ('action', 'timestamp', 'ip_address')
    search_fields = ('username', 'ip_address', 'action', 'metadata')
    readonly_fields = ('timestamp', 'user_id', 'username', 'ip_address', 'user_agent', 'action', 'metadata')
    date_hierarchy = 'timestamp'
    ordering = ('-timestamp',)
    
    # Asla silinmesin
    def has_delete_permission(self, request, obj=None):
        return False
    
    def get_metadata_summary(self, obj):
        """Metadata özeti göster"""
        if not obj.metadata:
            return '-'
        # İlk birkaç key'i göster
        keys = list(obj.metadata.keys())[:3]
        return ', '.join(keys) + ('...' if len(obj.metadata) > 3 else '')
    get_metadata_summary.short_description = 'Metadata'
    
    fieldsets = (
        ('Temel Bilgiler', {
            'fields': ('timestamp', 'action', 'user_id', 'username')
        }),
        ('İstek Bilgileri', {
            'fields': ('ip_address', 'user_agent')
        }),
        ('Detaylar', {
            'fields': ('metadata',),
            'classes': ('collapse',)
        }),
    )

