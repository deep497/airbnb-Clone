from django.contrib import admin
from django.utils.html import format_html
from .models import User, OTPCode, Listing, ListingImage, Booking, Review, Favorite


# ─────────────────────────────────────────────────────────────────
# User
# ─────────────────────────────────────────────────────────────────

@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    list_display  = ['id', 'email', 'name', 'role', 'is_active', 'date_joined']
    list_filter   = ['role', 'is_active']
    search_fields = ['email', 'name', 'username']
    ordering      = ['-date_joined']
    fieldsets = (
        ('Identity', {'fields': ('email', 'username', 'name', 'role')}),
        ('Permissions', {'fields': ('is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions')}),
        ('Dates', {'fields': ('last_login', 'date_joined')}),
    )


# ─────────────────────────────────────────────────────────────────
# OTP Code
# ─────────────────────────────────────────────────────────────────

@admin.register(OTPCode)
class OTPCodeAdmin(admin.ModelAdmin):
    list_display  = ['email', 'code', 'created_at', 'expires_at', 'is_used']
    list_filter   = ['is_used']
    search_fields = ['email']
    readonly_fields = ['created_at']
    ordering      = ['-created_at']


# ─────────────────────────────────────────────────────────────────
# Listing Images (inline)
# ─────────────────────────────────────────────────────────────────

class ListingImageInline(admin.TabularInline):
    model   = ListingImage
    extra   = 1
    fields  = ['image', 'is_cover', 'image_preview']
    readonly_fields = ['image_preview', 'uploaded_at']

    def image_preview(self, obj):
        if obj.image:
            return format_html('<img src="{}" height="60" style="border-radius:6px" />', obj.image.url)
        return '—'
    image_preview.short_description = 'Preview'


# ─────────────────────────────────────────────────────────────────
# Listing
# ─────────────────────────────────────────────────────────────────

@admin.register(Listing)
class ListingAdmin(admin.ModelAdmin):
    list_display  = ['id', 'title', 'host', 'property_type', 'location', 'price_per_night', 'max_guests', 'created_at']
    list_filter   = ['property_type', 'country']
    search_fields = ['title', 'city', 'country', 'location', 'host__email']
    ordering      = ['-created_at']
    inlines       = [ListingImageInline]
    fieldsets = (
        ('Basic Info', {'fields': ('host', 'title', 'description', 'property_type')}),
        ('Location',   {'fields': ('location', 'city', 'country')}),
        ('Pricing',    {'fields': ('price_per_night', 'max_guests')}),
        ('Extras',     {'fields': ('amenities',)}),
    )


# ─────────────────────────────────────────────────────────────────
# Listing Image (standalone)
# ─────────────────────────────────────────────────────────────────

@admin.register(ListingImage)
class ListingImageAdmin(admin.ModelAdmin):
    list_display  = ['id', 'listing', 'is_cover', 'image_preview', 'uploaded_at']
    list_filter   = ['is_cover']
    search_fields = ['listing__title']
    readonly_fields = ['image_preview', 'uploaded_at']

    def image_preview(self, obj):
        if obj.image:
            return format_html('<img src="{}" height="60" style="border-radius:6px" />', obj.image.url)
        return '—'
    image_preview.short_description = 'Preview'


# ─────────────────────────────────────────────────────────────────
# Booking
# ─────────────────────────────────────────────────────────────────

@admin.register(Booking)
class BookingAdmin(admin.ModelAdmin):
    list_display  = ['id', 'guest', 'listing', 'check_in', 'check_out', 'nights_display', 'total_price', 'status', 'created_at']
    list_filter   = ['status']
    search_fields = ['guest__email', 'listing__title']
    ordering      = ['-created_at']
    readonly_fields = ['total_price', 'created_at']

    def nights_display(self, obj):
        return f"{obj.nights} nights"
    nights_display.short_description = 'Duration'


# ─────────────────────────────────────────────────────────────────
# Review
# ─────────────────────────────────────────────────────────────────

@admin.register(Review)
class ReviewAdmin(admin.ModelAdmin):
    list_display  = ['id', 'guest', 'listing', 'rating', 'comment_preview', 'created_at']
    list_filter   = ['rating']
    search_fields = ['guest__email', 'listing__title']
    ordering      = ['-created_at']

    def comment_preview(self, obj):
        return obj.comment[:60] + '...' if len(obj.comment) > 60 else obj.comment
    comment_preview.short_description = 'Comment'


# ─────────────────────────────────────────────────────────────────
# Favorite
# ─────────────────────────────────────────────────────────────────

@admin.register(Favorite)
class FavoriteAdmin(admin.ModelAdmin):
    list_display  = ['id', 'guest', 'listing', 'saved_at']
    search_fields = ['guest__email', 'listing__title']
    ordering      = ['-saved_at']
