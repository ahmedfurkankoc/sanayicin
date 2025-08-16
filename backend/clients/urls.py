from django.urls import path
from .views import ClientRegisterView, ClientProfileView
 
urlpatterns = [
    path('register/', ClientRegisterView.as_view(), name='client-register'),
    path('profile/', ClientProfileView.as_view(), name='client-profile'),
] 