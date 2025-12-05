from django.urls import path
from .views import public_blog_list, public_blog_detail, public_blog_related, public_blog_categories
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
    send_password_reset_otp,
    verify_password_reset_otp,
    check_verification_status,
    forgot_password,
    reset_password,
    upload_avatar,
    get_profile,
    update_profile,
    FavoriteListView,
    FavoriteCreateView,
    remove_favorite,
    check_favorite,
    client_register,
    verify_registration_otp,
    client_profile,
    client_set_password,
    refresh_access_token,
    logout,
    clear_notifications,
    create_support_ticket,
    get_support_ticket_status,
    list_my_support_tickets,
    get_support_ticket_details,
    send_support_message,
    VehicleListCreateView,
    VehicleDetailView
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
    # OTP endpoints (login OTP kaldırıldı - maliyet nedeniyle)
    path('auth/send-password-reset-otp/', send_password_reset_otp, name='send_password_reset_otp'),
    path('auth/verify-password-reset-otp/', verify_password_reset_otp, name='verify_password_reset_otp'),
    path('auth/forgot-password/', forgot_password, name='forgot_password'),
    path('auth/reset-password/', reset_password, name='reset_password'),
    path('auth/reset-password-confirm/<str:uidb64>/<str:token>/', reset_password, name='reset_password_confirm'),
    path('avatar/upload/', upload_avatar, name='upload_avatar'),
    path('profile/', get_profile, name='get_profile'),
    path('profile/update/', update_profile, name='update_profile'),
    path('services/', ServiceAreaListView.as_view(), name='servicearea-list'),
    path('categories/', CategoryListView.as_view(), name='category-list'),
    path('car-brands/', CarBrandListView.as_view(), name='carbrand-list'),
    # Public blog endpoints
    path('blog/posts/', public_blog_list, name='public-blog-list'),
    path('blog/posts/<slug:slug>/', public_blog_detail, name='public-blog-detail'),
    path('blog/posts/<slug:slug>/related/', public_blog_related, name='public-blog-related'),
    path('blog/categories/', public_blog_categories, name='public-blog-categories'),
    
    # Favorite endpoints
    path('favorites/', FavoriteListView.as_view(), name='favorite-list'),
    path('favorites/add/', FavoriteCreateView.as_view(), name='favorite-create'),
    path('favorites/<int:vendor_id>/', remove_favorite, name='favorite-remove'),
    path('favorites/<int:vendor_id>/check/', check_favorite, name='favorite-check'),
    
    # Client endpoints (ClientProfile yerine CustomUser kullanıyor)
    path('clients/register/', client_register, name='client-register'),
    path('clients/verify-registration-otp/', verify_registration_otp, name='verify-registration-otp'),
    path('clients/profile/', client_profile, name='client-profile'),
    path('clients/set-password/', client_set_password, name='client-set-password'),
    
    # Support Center
    path('support/tickets/', create_support_ticket, name='support-ticket-create'),
    path('support/tickets/<str:public_id>/', get_support_ticket_status, name='support-ticket-status'),
    path('support/my-tickets/', list_my_support_tickets, name='support-ticket-my-list'),
    path('support/tickets/<str:ticket_id>/details/', get_support_ticket_details, name='support-ticket-details'),
    path('support/tickets/<str:ticket_id>/reply/', send_support_message, name='support-ticket-reply'),

    # Vehicles
    path('vehicles/', VehicleListCreateView.as_view(), name='vehicle-list-create'),
    path('vehicles/<int:pk>/', VehicleDetailView.as_view(), name='vehicle-detail'),
] 