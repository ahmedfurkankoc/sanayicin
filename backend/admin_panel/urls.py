from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import *

router = DefaultRouter()
router.register(r'users', UserViewSet)
router.register(r'admin-users', AdminUserViewSet)
router.register(r'vendors', VendorProfileViewSet)
router.register(r'reviews', ReviewViewSet)
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
router.register(r'permissions', AdminPermissionViewSet)
router.register(r'domains', DomainViewSet)

urlpatterns = [
    # Authentication endpoints
    path('auth/login/', AdminLoginView.as_view(), name='admin-login'),
    path('auth/logout/', AdminLogoutView.as_view(), name='admin-logout'),
    path('auth/user/', AdminUserInfoView.as_view(), name='admin-user-info'),
    path('logs/auth/', AdminAuthLogsView.as_view(), name='admin-auth-logs'),
    
    # Dashboard
    path('dashboard-stats/', DashboardStatsView.as_view(), name='dashboard-stats'),
    path('recent-activities/', RecentActivitiesView.as_view(), name='recent-activities'),
    
    # Image upload
    path('upload-image/', ImageUploadView.as_view(), name='upload-image'),
    
    # Role management
    path('roles/', AdminRoleManagementView.as_view(), name='admin-roles'),
    
    # Server monitoring
    path('servers/', ServerMonitoringView.as_view(), name='server-monitoring'),
    path('servers/<str:server_id>/', ServerDetailView.as_view(), name='server-detail'),
    path('servers/<str:server_id>/action/', ServerActionView.as_view(), name='server-action'),
    
    # Hostinger subscriptions
    path('subscriptions/', HostingerSubscriptionsView.as_view(), name='hostinger-subscriptions'),
    path('subscriptions/<str:subscription_id>/', HostingerSubscriptionDetailView.as_view(), name='hostinger-subscription-detail'),
    
    # SMS Balance
    path('sms-balance/', SMSBalanceView.as_view(), name='sms-balance'),
    
    # API endpoints
    path('', include(router.urls)),
]