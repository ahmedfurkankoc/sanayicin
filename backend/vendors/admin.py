from django.contrib import admin
from .models import VendorProfile

@admin.register(VendorProfile)
class VendorProfileAdmin(admin.ModelAdmin):
    list_display = ("id", "display_name", "user", "business_type", "phone", "city", "district", "subdistrict")
    search_fields = ("display_name", "user__email", "company_title", "manager_name", "city", "district", "subdistrict")
    list_filter = ("business_type",)
