from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from .views import (
    ServiceAreaListView, 
    CategoryListView, 
    login,
    send_verification_email,
    verify_email,
    resend_verification_email,
    forgot_password,
    reset_password,
    upload_avatar
)

urlpatterns = [
    path('auth/login/', login, name='login'),
    path('auth/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('auth/send-verification/', send_verification_email, name='send_verification'),
    path('auth/verify-email/', verify_email, name='verify_email'),
    path('auth/resend-verification/', resend_verification_email, name='resend_verification'),
    path('auth/forgot-password/', forgot_password, name='forgot_password'),
    path('auth/reset-password/', reset_password, name='reset_password'),
    path('avatar/upload/', upload_avatar, name='upload_avatar'),
    path('services/', ServiceAreaListView.as_view(), name='servicearea-list'),
    path('categories/', CategoryListView.as_view(), name='category-list'),
] 