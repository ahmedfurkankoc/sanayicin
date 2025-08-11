from django.urls import path
from .views import ClientRegisterView, ClientProfileView, client_login
 
urlpatterns = [
    path('register/', ClientRegisterView.as_view(), name='client-register'),
    path('login/', client_login, name='client-login'),
    path('profile/', ClientProfileView.as_view(), name='client-profile'),
] 