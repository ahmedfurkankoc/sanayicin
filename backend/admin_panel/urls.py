from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    AdminLoginView, AdminLogoutView, AdminUserInfoView, DashboardStatsView, AdminAuthLogsView,
    UserViewSet, VendorProfileViewSet, BlogCategoryViewSet, BlogPostViewSet, ImageUploadView,
    ServiceAreaViewSet, CategoryViewSet, CarBrandViewSet, SupportTicketViewSet,
    SupportMessageViewSet, SystemLogViewSet,
    AdminNotificationViewSet, AdminSettingsViewSet, AdminUserViewSet
)

router = DefaultRouter()
router.register(r'users', UserViewSet)
router.register(r'admin-users', AdminUserViewSet)
router.register(r'vendors', VendorProfileViewSet)
router.register(r'blog-categories', BlogCategoryViewSet)
router.register(r'blog-posts', BlogPostViewSet)
router.register(r'service-areas', ServiceAreaViewSet)
router.register(r'categories', CategoryViewSet)
router.register(r'car-brands', CarBrandViewSet)
router.register(r'support-tickets', SupportTicketViewSet)
router.register(r'support-messages', SupportMessageViewSet)
router.register(r'system-logs', SystemLogViewSet)
router.register(r'notifications', AdminNotificationViewSet)
router.register(r'settings', AdminSettingsViewSet)

urlpatterns = [
    # Authentication endpoints
    path('auth/login/', AdminLoginView.as_view(), name='admin-login'),
    path('auth/logout/', AdminLogoutView.as_view(), name='admin-logout'),
    path('auth/user/', AdminUserInfoView.as_view(), name='admin-user-info'),
    path('logs/auth/', AdminAuthLogsView.as_view(), name='admin-auth-logs'),
    
    # Dashboard
    path('dashboard-stats/', DashboardStatsView.as_view(), name='dashboard-stats'),
    
    # Image upload
    path('upload-image/', ImageUploadView.as_view(), name='upload-image'),
    
    # API endpoints
    path('', include(router.urls)),
]