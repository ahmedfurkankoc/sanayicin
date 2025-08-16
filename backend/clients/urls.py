from django.urls import path
from .views import ClientRegisterView, ClientProfileView, ClientSetPasswordView
 
urlpatterns = [
    path('register/', ClientRegisterView.as_view(), name='client-register'),
    path('profile/', ClientProfileView.as_view(), name='client-profile'),
    path('set-password/', ClientSetPasswordView.as_view(), name='client-set-password'),
] 