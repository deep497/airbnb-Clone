from rest_framework import serializers
from django.db import transaction
from .models import User, OTPCode, Listing, ListingImage, Booking, Review, Favorite


# ─────────────────────────────────────────────────────────────────
# User
# ─────────────────────────────────────────────────────────────────

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'name', 'email', 'role', 'date_joined']
        read_only_fields = ['id', 'email', 'date_joined']


class UserPublicSerializer(serializers.ModelSerializer):
    """Minimal public profile — exposed in nested contexts."""
    class Meta:
        model = User
        fields = ['id', 'name', 'email', 'role']


# ─────────────────────────────────────────────────────────────────
# OTP (no serializer needed — handled inline in views)
# ─────────────────────────────────────────────────────────────────

class RequestOTPSerializer(serializers.Serializer):
    email = serializers.EmailField()
    mode  = serializers.ChoiceField(choices=['signin', 'signup'], default='signin')


class VerifyOTPSerializer(serializers.Serializer):
    email = serializers.EmailField()
    otp   = serializers.CharField(min_length=6, max_length=6)
    mode  = serializers.ChoiceField(choices=['signin', 'signup'], default='signin')
    role  = serializers.ChoiceField(choices=['host', 'guest'], required=False)
    name  = serializers.CharField(max_length=150, required=False, allow_blank=True)



# ─────────────────────────────────────────────────────────────────
# Listing Image
# ─────────────────────────────────────────────────────────────────

class ListingImageSerializer(serializers.ModelSerializer):
    image = serializers.SerializerMethodField()

    class Meta:
        model  = ListingImage
        fields = ['id', 'image', 'is_cover', 'uploaded_at']

    def get_image(self, obj):
        request = self.context.get('request')
        if obj.image and hasattr(obj.image, 'url'):
            return request.build_absolute_uri(obj.image.url) if request else obj.image.url
        return None


# ─────────────────────────────────────────────────────────────────
# Listing
# ─────────────────────────────────────────────────────────────────

class ListingSerializer(serializers.ModelSerializer):
    images         = ListingImageSerializer(many=True, read_only=True)
    cover_image    = serializers.SerializerMethodField()
    host_name      = serializers.SerializerMethodField()
    average_rating = serializers.SerializerMethodField()
    review_count   = serializers.SerializerMethodField()

    class Meta:
        model = Listing
        fields = [
            'id', 'host', 'host_name',
            'title', 'description', 'location', 'city', 'country',
            'property_type', 'price_per_night', 'max_guests', 'amenities',
            'images', 'cover_image', 'average_rating', 'review_count',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def get_host_name(self, obj):
        return obj.host.display_name()

    def get_cover_image(self, obj):
        request = self.context.get('request')
        img = obj.images.filter(is_cover=True).first() or obj.images.first()
        if img and img.image:
            return request.build_absolute_uri(img.image.url) if request else img.image.url
        return None

    def get_average_rating(self, obj):
        return obj.average_rating

    def get_review_count(self, obj):
        return obj.reviews.count()

    def create(self, validated_data):
        request = self.context.get('request')
        with transaction.atomic():
            listing = Listing.objects.create(**validated_data)
            if request:
                for idx, img_file in enumerate(request.FILES.getlist('images')):
                    ListingImage.objects.create(
                        listing=listing,
                        image=img_file,
                        is_cover=(idx == 0),
                    )
        return listing

    def update(self, instance, validated_data):
        request = self.context.get('request')
        for attr, val in validated_data.items():
            setattr(instance, attr, val)
        instance.save()
        if request:
            for idx, img_file in enumerate(request.FILES.getlist('images')):
                is_cover = (idx == 0) and not instance.images.filter(is_cover=True).exists()
                ListingImage.objects.create(listing=instance, image=img_file, is_cover=is_cover)
        return instance


# ─────────────────────────────────────────────────────────────────
# Booking
# ─────────────────────────────────────────────────────────────────

class BookingSerializer(serializers.ModelSerializer):
    listing_title = serializers.SerializerMethodField()
    listing_city  = serializers.SerializerMethodField()
    listing_location = serializers.SerializerMethodField()
    guest_name    = serializers.SerializerMethodField()
    cover_image   = serializers.SerializerMethodField()
    nights        = serializers.SerializerMethodField()

    class Meta:
        model = Booking
        fields = [
            'id', 'guest', 'listing',
            'listing_title', 'listing_city', 'listing_location', 'cover_image',
            'guest_name',
            'check_in', 'check_out', 'nights',
            'total_price', 'guests_count', 'status',
            'created_at',
        ]
        read_only_fields = ['id', 'total_price', 'created_at']

    def get_listing_title(self, obj):    return obj.listing.title
    def get_listing_city(self, obj):     return obj.listing.city
    def get_listing_location(self, obj): return obj.listing.location or f"{obj.listing.city}, {obj.listing.country}"
    def get_guest_name(self, obj):       return obj.guest.display_name()
    def get_nights(self, obj):           return obj.nights

    def get_cover_image(self, obj):
        request = self.context.get('request')
        img = obj.listing.images.filter(is_cover=True).first() or obj.listing.images.first()
        if img and img.image:
            return request.build_absolute_uri(img.image.url) if request else img.image.url
        return None

    def validate(self, data):
        listing   = data.get('listing')
        check_in  = data.get('check_in')
        check_out = data.get('check_out')
        pk        = self.instance.id if self.instance else None

        if check_in and check_out:
            if check_out <= check_in:
                raise serializers.ValidationError({'check_out': 'Check-out must be after check-in.'})

            qs = Booking.objects.filter(
                listing=listing,
                status__in=[Booking.STATUS_PENDING, Booking.STATUS_CONFIRMED],
                check_in__lt=check_out,
                check_out__gt=check_in,
            )
            if pk:
                qs = qs.exclude(pk=pk)
            if qs.exists():
                raise serializers.ValidationError(
                    {'check_in': 'These dates overlap with an existing booking.'}
                )
        return data

    def create(self, validated_data):
        listing   = validated_data['listing']
        check_in  = validated_data['check_in']
        check_out = validated_data['check_out']
        nights    = (check_out - check_in).days
        validated_data['total_price'] = listing.price_per_night * nights
        return Booking.objects.create(**validated_data)


# ─────────────────────────────────────────────────────────────────
# Review
# ─────────────────────────────────────────────────────────────────

class ReviewSerializer(serializers.ModelSerializer):
    guest_name = serializers.SerializerMethodField()

    class Meta:
        model  = Review
        fields = ['id', 'listing', 'guest', 'guest_name', 'rating', 'comment', 'created_at']
        read_only_fields = ['id', 'created_at']

    def get_guest_name(self, obj):
        return obj.guest.display_name()

    def validate(self, data):
        guest   = data.get('guest')
        listing = data.get('listing')
        pk      = self.instance.id if self.instance else None
        qs = Review.objects.filter(listing=listing, guest=guest)
        if pk:
            qs = qs.exclude(pk=pk)
        if qs.exists():
            raise serializers.ValidationError('You have already reviewed this listing.')
        return data


# ─────────────────────────────────────────────────────────────────
# Favorite
# ─────────────────────────────────────────────────────────────────

class FavoriteSerializer(serializers.ModelSerializer):
    listing_detail = ListingSerializer(source='listing', read_only=True)

    class Meta:
        model  = Favorite
        fields = ['id', 'guest', 'listing', 'listing_detail', 'saved_at']
        read_only_fields = ['id', 'saved_at']

    def validate(self, data):
        if Favorite.objects.filter(guest=data['guest'], listing=data['listing']).exists():
            raise serializers.ValidationError('This listing is already in your favorites.')
        return data
