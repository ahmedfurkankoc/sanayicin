from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import *
from django.urls import re_path

router = DefaultRouter()
router.register(r'appointments', AppointmentViewSet, basename='appointment')
router.register(r'reviews', ReviewViewSet, basename='review')

urlpatterns = [
    path('profile/', VendorProfileView.as_view(), name='vendor-profile'),
    path('profile/images/', VendorImageListView.as_view(), name='vendor-images-list'),
    path('profile/images/<int:pk>/', VendorImageDetailView.as_view(), name='vendor-image-detail'),
    path('register/', VendorRegisterView.as_view(), name='vendor-register'),
    path('client-upgrade/', ClientToVendorUpgradeView.as_view(), name='client-to-vendor-upgrade'),
    path('set-password/', SetVendorPasswordView.as_view(), name='vendor-set-password'),
    path('search/', VendorSearchView.as_view(), name='vendor-search'),
    path('car-brands/', CarBrandListView.as_view(), name='car-brands'),
    path('', include(router.urls)),
    # Collection endpoints must come BEFORE slug routes
    path('service-requests/unread_count/', VendorServiceRequestUnreadCountView.as_view(), name='vendor-service-requests-unread'),
    path('service-requests/', VendorServiceRequestListView.as_view(), name='vendor-service-requests'),
    path('service-requests/<int:pk>/reply/', VendorServiceRequestReplyView.as_view(), name='vendor-service-request-reply'),
    path('service-requests/<int:pk>/mark_read/', VendorServiceRequestMarkReadView.as_view(), name='vendor-service-request-mark-read'),
    path('service-requests/<int:pk>/status/', VendorServiceRequestUpdateStatusView.as_view(), name='vendor-service-request-update-status'),
    # Client-side service requests
    path('client/service-requests/', ClientServiceRequestListView.as_view(), name='client-service-requests'),
    path('client/service-requests/<int:pk>/reply/', ClientServiceRequestReplyView.as_view(), name='client-service-request-reply'),
    path('client/appointments/', ClientAppointmentListView.as_view(), name='client-appointment-list'),
    # Dashboard summary
    path('dashboard/summary/', VendorDashboardSummaryView.as_view(), name='vendor-dashboard-summary'),
    # Location endpoints
    path('location/update/', VendorLocationUpdateView.as_view(), name='vendor-location-update'),
    path('nearby/', NearbyVendorsView.as_view(), name='nearby-vendors'),
    # Slug-scoped endpoints
    path('<str:slug>/service-requests/', ServiceRequestCreateView.as_view(), name='service-request-create'),
    path('<str:slug>/appointments/', ClientAppointmentView.as_view(), name='client-appointment'),
    path('<str:slug>/analytics/view/', VendorAnalyticsViewEvent.as_view(), name='vendor-analytics-view'),
    path('<str:slug>/analytics/call/', VendorAnalyticsCallEvent.as_view(), name='vendor-analytics-call'),
    path('<str:slug>/location/', VendorLocationGetView.as_view(), name='vendor-location-get'),
    path('<str:vendor_slug>/reviews/', ReviewViewSet.as_view({
        'get': 'list',
        'post': 'create'
    }), name='vendor-reviews'),
    path('<str:slug>/', VendorDetailView.as_view(), name='vendor-detail'),
]