from allauth.socialaccount.adapter import DefaultSocialAccountAdapter
from django.contrib.auth import get_user_model

User = get_user_model()

class CustomSocialAccountAdapter(DefaultSocialAccountAdapter):
    def _build_unique_username(self, base: str) -> str:
        max_len = 150
        candidate = (base or "google_user").strip()[:max_len]
        if not candidate:
            candidate = "google_user"

        if not User.objects.filter(username=candidate).exists():
            return candidate

        index = 1
        while True:
            suffix = f"_{index}"
            trimmed = candidate[: max_len - len(suffix)]
            unique_candidate = f"{trimmed}{suffix}"
            if not User.objects.filter(username=unique_candidate).exists():
                return unique_candidate
            index += 1

    def populate_user(self, request, sociallogin, data):
        """
        Populates user data from social provider
        """
        user = super().populate_user(request, sociallogin, data)

        # Google data usually contains name/given_name/family_name.
        first_name = data.get('given_name') or data.get('first_name', '')
        last_name = data.get('family_name') or data.get('last_name', '')
        full_name = data.get('name') or f"{first_name} {last_name}".strip()
        social_email = ''
        for email_address in sociallogin.email_addresses:
            if getattr(email_address, 'email', None):
                social_email = email_address.email
                break

        email = (data.get('email') or social_email or getattr(user, 'email', '') or '').strip().lower()
        if not email:
            raise ValueError("Google account email topilmadi")

        user.email = email

        # Our custom User model requires name.
        if not full_name:
            full_name = email.split('@')[0]

        if full_name:
            user.name = full_name

        # Our model still has username field from AbstractUser.
        if not getattr(user, 'username', None):
            base_username = email or full_name or f"google_user_{sociallogin.account.uid}"
            user.username = self._build_unique_username(base_username)

        return user
