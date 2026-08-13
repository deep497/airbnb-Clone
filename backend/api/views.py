import random
from datetime import timedelta

from django.utils import timezone
from django.core.mail import send_mail
from django.conf import settings as django_settings
from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.authtoken.models import Token

from .models import User, OTPCode, Listing, ListingImage, Booking, Review, Favorite
from .serializers import (
    UserSerializer, RequestOTPSerializer, VerifyOTPSerializer,
    ListingSerializer, BookingSerializer, ReviewSerializer, FavoriteSerializer,
)


# ─────────────────────────────────────────────────────────────────
# OTP Authentication Views
# ─────────────────────────────────────────────────────────────────

class RequestOTPView(APIView):
    """
    POST /api/auth/request-otp/
    Body: { "email": "user@example.com" }

    Generates a 6-digit OTP valid for 10 minutes.
    DEV MODE: OTP is returned in the response body and printed to the console.
    """
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = RequestOTPSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        email = serializer.validated_data['email'].lower().strip()
        mode  = serializer.validated_data.get('mode', 'signin')

        # ── Mode Validation ───────────────────────────────────────
        email_exists = User.objects.filter(email=email).exists()

        if mode == 'signin' and not email_exists:
            return Response(
                {'error': 'No account found with this email. Please sign up first.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        elif mode == 'signup' and email_exists:
            return Response(
                {'error': 'An account already exists with this email. Please sign in.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Generate and save OTP
        code  = f"{random.randint(100000, 999999)}"
        expires_at = timezone.now() + timedelta(minutes=10)

        # Invalidate any previous unused OTPs for this email
        OTPCode.objects.filter(email=email, is_used=False).update(is_used=True)

        OTPCode.objects.create(email=email, code=code, expires_at=expires_at)

        # Print OTP to the Django console
        print(f"\n{'='*50}")
        print(f"  [OTP] Email   : {email}")
        print(f"  [OTP] Code    : {code}")
        print(f"  [OTP] Expires : {expires_at.strftime('%H:%M:%S')}")
        print(f"{'='*50}\n")

        # Return OTP in the API response for development/testing
        return Response({
            'message': 'OTP generated successfully.',
            'dev_otp': code,
            'dev_note': 'Use the code above to sign in.',
            'expires_in_minutes': 10,
        })



class VerifyOTPView(APIView):
    """
    POST /api/auth/verify-otp/
    Body: { "email": "user@example.com", "otp": "123456" }

    Returns an auth token + user object on success.
    Creates the user account automatically on first login.
    """
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = VerifyOTPSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        email = serializer.validated_data['email'].lower().strip()
        code  = serializer.validated_data['otp']

        # Find the most recent valid OTP for this email
        otp = OTPCode.objects.filter(
            email=email, code=code, is_used=False,
            expires_at__gt=timezone.now(),
        ).order_by('-created_at').first()

        if not otp:
            return Response(
                {'error': 'Invalid or expired OTP. Please request a new one.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Mark OTP as consumed
        otp.is_used = True
        otp.save()

        mode  = serializer.validated_data.get('mode', 'signin')
        role  = serializer.validated_data.get('role', 'guest')
        name  = serializer.validated_data.get('name', '').strip()

        created = False
        if mode == 'signup':
            # Create a brand new user
            if User.objects.filter(email=email).exists():
                return Response(
                    {'error': 'An account already exists with this email. Please sign in.'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            user = User.objects.create_user(
                username=email,
                email=email,
                name=name or email.split('@')[0].replace('.', ' ').title(),
                role=role
            )
            created = True
        else:
            # Sign in existing user
            try:
                user = User.objects.get(email=email)
            except User.DoesNotExist:
                return Response(
                    {'error': 'No account found with this email. Please sign up first.'},
                    status=status.HTTP_404_NOT_FOUND
                )

        # Get or create DRF auth token
        token, _ = Token.objects.get_or_create(user=user)

        return Response({
            'token': token.key,
            'user': UserSerializer(user).data,
            'is_new_user': created,
        }, status=status.HTTP_200_OK)


class MeView(APIView):
    """
    GET  /api/auth/me/   → current user's profile
    PATCH /api/auth/me/  → update name / role
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(UserSerializer(request.user).data)

    def patch(self, request):
        serializer = UserSerializer(request.user, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class LogoutView(APIView):
    """DELETE /api/auth/logout/ — invalidate the current token."""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            request.user.auth_token.delete()
        except Exception:
            pass
        return Response({'message': 'Logged out successfully.'})


# ─────────────────────────────────────────────────────────────────
# User ViewSet
# ─────────────────────────────────────────────────────────────────

class UserViewSet(viewsets.ReadOnlyModelViewSet):
    """Read-only user list/detail (management done via admin or /auth/ endpoints)."""
    queryset           = User.objects.all()
    serializer_class   = UserSerializer
    permission_classes = [IsAuthenticated]

    def get_serializer_context(self):
        ctx = super().get_serializer_context()
        ctx['request'] = self.request
        return ctx


# ─────────────────────────────────────────────────────────────────
# Listing ViewSet
# ─────────────────────────────────────────────────────────────────

class ListingViewSet(viewsets.ModelViewSet):
    """Full CRUD for listings. Create/Update/Delete requires authentication."""
    queryset       = Listing.objects.prefetch_related('images', 'reviews').select_related('host').all()
    serializer_class = ListingSerializer
    parser_classes = [MultiPartParser, FormParser, JSONParser]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields   = ['title', 'city', 'country', 'location', 'property_type']
    ordering_fields = ['price_per_night', 'created_at']

    def get_permissions(self):
        if self.action in ('list', 'retrieve', 'booked_dates'):
            return [AllowAny()]
        return [IsAuthenticated()]

    def get_serializer_context(self):
        ctx = super().get_serializer_context()
        ctx['request'] = self.request
        return ctx

    def get_queryset(self):
        qs = super().get_queryset()
        params = self.request.query_params

        if host_id := params.get('host'):
            qs = qs.filter(host_id=host_id)
        if category := params.get('category'):
            qs = qs.filter(property_type=category)
        if city := params.get('city'):
            qs = qs.filter(city__icontains=city)
        if country := params.get('country'):
            qs = qs.filter(country__icontains=country)
        if location := params.get('location'):
            qs = qs.filter(location__icontains=location)
        if min_price := params.get('min_price'):
            qs = qs.filter(price_per_night__gte=min_price)
        if max_price := params.get('max_price'):
            qs = qs.filter(price_per_night__lte=max_price)
        if guests := params.get('guests'):
            qs = qs.filter(max_guests__gte=guests)
        return qs

    @action(detail=True, methods=['get'], url_path='booked-dates', permission_classes=[AllowAny])
    def booked_dates(self, request, pk=None):
        """Return confirmed/pending booking date ranges for the listing."""
        listing = self.get_object()
        bookings = Booking.objects.filter(
            listing=listing,
            status__in=[Booking.STATUS_PENDING, Booking.STATUS_CONFIRMED],
        ).values('check_in', 'check_out')
        return Response(list(bookings))

    @action(detail=True, methods=['post'], url_path='add-images', permission_classes=[IsAuthenticated])
    def add_images(self, request, pk=None):
        """Add additional images to an existing listing."""
        listing = self.get_object()
        images  = request.FILES.getlist('images')
        if not images:
            return Response({'error': 'No images provided.'}, status=status.HTTP_400_BAD_REQUEST)
        created = []
        for idx, img in enumerate(images):
            is_cover = (idx == 0) and not listing.images.filter(is_cover=True).exists()
            obj = ListingImage.objects.create(listing=listing, image=img, is_cover=is_cover)
            created.append({'id': obj.id, 'is_cover': obj.is_cover})
        return Response({'added': len(created), 'images': created})

    @action(detail=True, methods=['delete'], url_path='images/(?P<image_id>[0-9]+)',
            permission_classes=[IsAuthenticated])
    def delete_image(self, request, pk=None, image_id=None):
        """Delete a specific image from a listing."""
        listing = self.get_object()
        try:
            img = listing.images.get(pk=image_id)
            img.image.delete(save=False)  # Delete from filesystem
            img.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        except ListingImage.DoesNotExist:
            return Response({'error': 'Image not found.'}, status=status.HTTP_404_NOT_FOUND)


# ─────────────────────────────────────────────────────────────────
# Booking ViewSet
# ─────────────────────────────────────────────────────────────────

class BookingViewSet(viewsets.ModelViewSet):
    """Full CRUD for bookings. All operations require authentication."""
    queryset           = Booking.objects.select_related('guest', 'listing').prefetch_related('listing__images').all()
    serializer_class   = BookingSerializer
    permission_classes = [IsAuthenticated]

    def get_serializer_context(self):
        ctx = super().get_serializer_context()
        ctx['request'] = self.request
        return ctx

    def get_queryset(self):
        qs     = super().get_queryset()
        params = self.request.query_params
        if guest_id := params.get('guest'):
            qs = qs.filter(guest_id=guest_id)
        if listing_id := params.get('listing'):
            qs = qs.filter(listing_id=listing_id)
        if host_id := params.get('host'):
            qs = qs.filter(listing__host_id=host_id)
        return qs


# ─────────────────────────────────────────────────────────────────
# Review ViewSet
# ─────────────────────────────────────────────────────────────────

class ReviewViewSet(viewsets.ModelViewSet):
    """Reviews for listings. Read is public; write requires authentication."""
    queryset         = Review.objects.select_related('guest', 'listing').all()
    serializer_class = ReviewSerializer

    def get_permissions(self):
        if self.action in ('list', 'retrieve'):
            return [AllowAny()]
        return [IsAuthenticated()]

    def get_serializer_context(self):
        ctx = super().get_serializer_context()
        ctx['request'] = self.request
        return ctx

    def get_queryset(self):
        qs     = super().get_queryset()
        params = self.request.query_params
        if listing_id := params.get('listing'):
            qs = qs.filter(listing_id=listing_id)
        if guest_id := params.get('guest'):
            qs = qs.filter(guest_id=guest_id)
        return qs


# ─────────────────────────────────────────────────────────────────
# Favorite ViewSet
# ─────────────────────────────────────────────────────────────────

class FavoriteViewSet(viewsets.ModelViewSet):
    """Guest's favorite listings. All operations require authentication."""
    queryset           = Favorite.objects.select_related('guest', 'listing').prefetch_related('listing__images').all()
    serializer_class   = FavoriteSerializer
    permission_classes = [IsAuthenticated]

    def get_serializer_context(self):
        ctx = super().get_serializer_context()
        ctx['request'] = self.request
        return ctx

    def get_queryset(self):
        qs = super().get_queryset()
        if guest_id := self.request.query_params.get('guest'):
            qs = qs.filter(guest_id=guest_id)
        return qs
