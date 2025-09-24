from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from .views import (
    ServiceAreaListView, 
    CategoryListView, 
    CarBrandListView,
    login,
    send_verification_email,
    verify_email,
    resend_verification_email,
    send_sms_verification,
    verify_sms_code,
    check_verification_status,
    forgot_password,
    reset_password,
    upload_avatar,
    request_vendor_upgrade,
    check_vendor_upgrade_status,
    get_profile,
    update_profile,
    FavoriteListView,
    FavoriteCreateView,
    remove_favorite,
    check_favorite,
    client_register,
    client_profile,
    client_set_password,
    refresh_access_token,
    logout,
    clear_notifications
)

urlpatterns = [
    path('auth/login/', login, name='login'),
    # Cookie-based refresh endpoint
    path('auth/token/refresh/', refresh_access_token, name='token_refresh'),
    path('auth/logout/', logout, name='logout'),
    path('notifications/clear/', clear_notifications, name='clear_notifications'),
    path('auth/send-verification/', send_verification_email, name='send_verification'),
    path('auth/verify-email/', verify_email, name='verify_email'),
    path('auth/resend-verification/', resend_verification_email, name='resend_verification'),
    path('auth/send-sms-verification/', send_sms_verification, name='send_sms_verification'),
    path('auth/verify-sms-code/', verify_sms_code, name='verify_sms_code'),
    path('auth/check-verification-status/', check_verification_status, name='check_verification_status'),
    path('auth/forgot-password/', forgot_password, name='forgot_password'),
    path('auth/reset-password/', reset_password, name='reset_password'),
    path('auth/reset-password-confirm/<str:uidb64>/<str:token>/', reset_password, name='reset_password_confirm'),
    path('avatar/upload/', upload_avatar, name='upload_avatar'),
    path('profile/', get_profile, name='get_profile'),
    path('profile/update/', update_profile, name='update_profile'),
    path('services/', ServiceAreaListView.as_view(), name='servicearea-list'),
    path('categories/', CategoryListView.as_view(), name='category-list'),
    path('car-brands/', CarBrandListView.as_view(), name='carbrand-list'),
    
    # Vendor upgrade endpoints
    path('vendor/upgrade/', request_vendor_upgrade, name='request_vendor_upgrade'),
    path('vendor/upgrade/status/', check_vendor_upgrade_status, name='check_vendor_upgrade_status'),
    
    # Favorite endpoints
    path('favorites/', FavoriteListView.as_view(), name='favorite-list'),
    path('favorites/add/', FavoriteCreateView.as_view(), name='favorite-create'),
    path('favorites/<int:vendor_id>/', remove_favorite, name='favorite-remove'),
    path('favorites/<int:vendor_id>/check/', check_favorite, name='favorite-check'),
    
    # Client endpoints (ClientProfile yerine CustomUser kullanıyor)
    path('clients/register/', client_register, name='client-register'),
    path('clients/profile/', client_profile, name='client-profile'),
    path('clients/set-password/', client_set_password, name='client-set-password'),
] 