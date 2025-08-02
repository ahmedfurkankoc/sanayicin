from django.contrib import admin
from .models import CustomUser, ServiceArea, Category
from django.contrib.auth.admin import UserAdmin

admin.site.register(CustomUser, UserAdmin)

@admin.register(ServiceArea)
class ServiceAreaAdmin(admin.ModelAdmin):
    list_display = ("id", "name", "description")
    search_fields = ("name",)
    ordering = ("name",)

@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ("id", "name", "service_area", "description")
    search_fields = ("name", "service_area__name")
    list_filter = ("service_area",)
    ordering = ("service_area", "name")
