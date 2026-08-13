from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    RequestOTPView, VerifyOTPView, MeView, LogoutView,
    UserViewSet, ListingViewSet, BookingViewSet, ReviewViewSet, FavoriteViewSet,
)

router = DefaultRouter()
router.register(r'users',     UserViewSet,    basename='user')
router.register(r'listings',  ListingViewSet, basename='listing')
router.register(r'bookings',  BookingViewSet, basename='booking')
router.register(r'reviews',   ReviewViewSet,  basename='review')
router.register(r'favorites', FavoriteViewSet, basename='favorite')

urlpatterns = [
    # ── Auth ──────────────────────────────────────────────────────
    path('auth/request-otp/', RequestOTPView.as_view(), name='request-otp'),
    path('auth/verify-otp/',  VerifyOTPView.as_view(),  name='verify-otp'),
    path('auth/me/',          MeView.as_view(),          name='me'),
    path('auth/logout/',      LogoutView.as_view(),      name='logout'),

    # ── REST resources ────────────────────────────────────────────
    path('', include(router.urls)),
]
