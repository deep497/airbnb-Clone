from django.db import models
from django.contrib.auth.models import AbstractUser
from django.core.exceptions import ValidationError
from django.utils import timezone


# ─────────────────────────────────────────────────────────────────
# User
# ─────────────────────────────────────────────────────────────────

class User(AbstractUser):
    """
    Custom user model.
    Login is email-based (OTP). Username is auto-set to email on creation.
    Role determines host vs guest capabilities.
    """
    ROLE_HOST  = 'host'
    ROLE_GUEST = 'guest'
    ROLE_CHOICES = [
        (ROLE_HOST,  'Host'),
        (ROLE_GUEST, 'Guest'),
    ]

    # Core profile fields
    name  = models.CharField(max_length=150, blank=True)
    email = models.EmailField(unique=True)
    role  = models.CharField(max_length=10, choices=ROLE_CHOICES, default=ROLE_GUEST)

    # Use email as the login identifier
    USERNAME_FIELD  = 'email'
    REQUIRED_FIELDS = ['username']

    class Meta:
        db_table = 'users'

    def __str__(self):
        return f"{self.name or self.email} ({self.get_role_display()})"

    # ── Convenience properties ────────────────────────────────────
    @property
    def is_host(self):
        return self.role == self.ROLE_HOST

    @property
    def is_guest(self):
        return self.role == self.ROLE_GUEST

    def display_name(self):
        return self.name or self.email.split('@')[0]


# ─────────────────────────────────────────────────────────────────
# OTP
# ─────────────────────────────────────────────────────────────────

class OTPCode(models.Model):
    """Single-use 6-digit OTP for email authentication."""
    email      = models.EmailField(db_index=True)
    code       = models.CharField(max_length=6)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    is_used    = models.BooleanField(default=False)

    class Meta:
        db_table = 'otp_codes'
        ordering = ['-created_at']

    def __str__(self):
        return f"OTP for {self.email} (used={self.is_used})"

    def is_valid(self):
        return not self.is_used and self.expires_at > timezone.now()


# ─────────────────────────────────────────────────────────────────
# Listing
# ─────────────────────────────────────────────────────────────────

class Listing(models.Model):
    """A property listing created by a host."""

    PROPERTY_TYPES = [
        ('house',       'House'),
        ('apartment',   'Apartment'),
        ('villa',       'Villa'),
        ('cabin',       'Cabin'),
        ('cottage',     'Cottage'),
        ('beach_house', 'Beach House'),
        ('treehouse',   'Treehouse'),
        ('loft',        'Loft'),
        ('studio',      'Studio'),
        ('mansion',     'Mansion'),
    ]

    host            = models.ForeignKey(User, on_delete=models.CASCADE, related_name='listings')
    title           = models.CharField(max_length=255)
    description     = models.TextField(blank=True)
    location        = models.CharField(max_length=255, blank=True, help_text="e.g. Malibu, California, USA")
    city            = models.CharField(max_length=100, blank=True)
    country         = models.CharField(max_length=100, blank=True)
    property_type   = models.CharField(max_length=50, choices=PROPERTY_TYPES, default='house')
    price_per_night = models.DecimalField(max_digits=10, decimal_places=2)
    max_guests      = models.PositiveIntegerField(default=2)
    amenities       = models.JSONField(default=list, blank=True)
    created_at      = models.DateTimeField(auto_now_add=True)
    updated_at      = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'listings'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.title} ({self.location or self.city})"

    @property
    def cover_image_url(self):
        cover = self.images.filter(is_cover=True).first() or self.images.first()
        return cover.image.url if cover else None

    @property
    def average_rating(self):
        reviews = self.reviews.all()
        if not reviews:
            return None
        return round(sum(r.rating for r in reviews) / len(reviews), 2)


# ─────────────────────────────────────────────────────────────────
# Listing Image
# ─────────────────────────────────────────────────────────────────

class ListingImage(models.Model):
    """Images manually uploaded by hosts for a listing."""
    listing    = models.ForeignKey(Listing, on_delete=models.CASCADE, related_name='images')
    image      = models.ImageField(upload_to='listings/')
    is_cover   = models.BooleanField(default=False)
    uploaded_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'listing_images'

    def __str__(self):
        return f"Image for '{self.listing.title}' (cover={self.is_cover})"


# ─────────────────────────────────────────────────────────────────
# Booking
# ─────────────────────────────────────────────────────────────────

class Booking(models.Model):
    """A reservation by a guest for a listing."""

    STATUS_PENDING   = 'pending'
    STATUS_CONFIRMED = 'confirmed'
    STATUS_CANCELLED = 'cancelled'
    STATUS_CHOICES = [
        (STATUS_PENDING,   'Pending'),
        (STATUS_CONFIRMED, 'Confirmed'),
        (STATUS_CANCELLED, 'Cancelled'),
    ]

    guest        = models.ForeignKey(User, on_delete=models.CASCADE, related_name='bookings')
    listing      = models.ForeignKey(Listing, on_delete=models.CASCADE, related_name='bookings')
    check_in     = models.DateField()
    check_out    = models.DateField()
    total_price  = models.DecimalField(max_digits=10, decimal_places=2)
    guests_count = models.PositiveIntegerField(default=1)
    status       = models.CharField(max_length=20, choices=STATUS_CHOICES, default=STATUS_CONFIRMED)
    created_at   = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'bookings'
        ordering = ['-created_at']

    def clean(self):
        if self.check_in and self.check_out:
            if self.check_out <= self.check_in:
                raise ValidationError({'check_out': 'Check-out must be after check-in.'})

    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"Booking #{self.pk} — {self.guest} @ {self.listing}"

    @property
    def nights(self):
        return (self.check_out - self.check_in).days


# ─────────────────────────────────────────────────────────────────
# Review
# ─────────────────────────────────────────────────────────────────

class Review(models.Model):
    """A guest review for a listing they have stayed at."""
    listing    = models.ForeignKey(Listing, on_delete=models.CASCADE, related_name='reviews')
    guest      = models.ForeignKey(User, on_delete=models.CASCADE, related_name='reviews')
    rating     = models.PositiveSmallIntegerField(
        choices=[(i, str(i)) for i in range(1, 6)],
        help_text="Rating from 1 (worst) to 5 (best)"
    )
    comment    = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'reviews'
        ordering = ['-created_at']
        # A guest can only review a listing once
        unique_together = [('listing', 'guest')]

    def __str__(self):
        return f"{self.guest} → {self.listing} ({self.rating}★)"


# ─────────────────────────────────────────────────────────────────
# Favorite
# ─────────────────────────────────────────────────────────────────

class Favorite(models.Model):
    """A guest's saved/wishlisted listing."""
    guest     = models.ForeignKey(User, on_delete=models.CASCADE, related_name='favorites')
    listing   = models.ForeignKey(Listing, on_delete=models.CASCADE, related_name='favorited_by')
    saved_at  = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'favorites'
        ordering = ['-saved_at']
        unique_together = [('guest', 'listing')]

    def __str__(self):
        return f"{self.guest} ♥ {self.listing}"
