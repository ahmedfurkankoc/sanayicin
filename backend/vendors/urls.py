from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import *

router = DefaultRouter()
router.register(r'appointments', AppointmentViewSet, basename='appointment')
router.register(r'reviews', ReviewViewSet, basename='review')

urlpatterns = [
    path('profile/', VendorProfileView.as_view(), name='vendor-profile'),
    path('register/', VendorRegisterView.as_view(), name='vendor-register'),
    path('set-password/', SetVendorPasswordView.as_view(), name='vendor-set-password'),
    path('search/', VendorSearchView.as_view(), name='vendor-search'),
    path('car-brands/', CarBrandListView.as_view(), name='car-brands'),
    path('', include(router.urls)),
    path('<str:slug>/', VendorDetailView.as_view(), name='vendor-detail'),
    path('<str:slug>/appointments/', ClientAppointmentView.as_view(), name='client-appointment'),
    path('client/appointments/', ClientAppointmentListView.as_view(), name='client-appointment-list'),
    # Vendor'a özel değerlendirme endpoint'leri
    path('<str:vendor_slug>/reviews/', ReviewViewSet.as_view({
        'get': 'list',
        'post': 'create'
    }), name='vendor-reviews'),
] 