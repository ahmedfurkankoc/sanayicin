from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import VendorProfileView, VendorRegisterView, SetVendorPasswordView, VendorSearchView, VendorDetailView, AppointmentViewSet, CustomerAppointmentView, CarBrandListView

router = DefaultRouter()
router.register(r'appointments', AppointmentViewSet, basename='appointment')

urlpatterns = [
    path('profile/', VendorProfileView.as_view(), name='vendor-profile'),
    path('register/', VendorRegisterView.as_view(), name='vendor-register'),
    path('set-password/', SetVendorPasswordView.as_view(), name='vendor-set-password'),
    path('search/', VendorSearchView.as_view(), name='vendor-search'),
    path('car-brands/', CarBrandListView.as_view(), name='car-brands'),
    path('', include(router.urls)),
    path('<str:slug>/', VendorDetailView.as_view(), name='vendor-detail'),
    path('<str:slug>/appointments/', CustomerAppointmentView.as_view(), name='customer-appointment'),
] 