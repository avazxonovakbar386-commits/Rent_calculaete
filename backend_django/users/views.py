from rest_framework import generics, permissions, status, serializers
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView
from django.conf import settings
from .serializers import UserSerializer, CustomTokenObtainPairSerializer
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
import requests as http_requests

User = get_user_model()

class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    permission_classes = (permissions.AllowAny,)
    serializer_class = UserSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        
        try:
            serializer.is_valid(raise_exception=True)
            user = serializer.save()
            
            refresh = RefreshToken.for_user(user)
            
            return Response({
                "user": UserSerializer(user).data,
                "access": str(refresh.access_token),
                "refresh": str(refresh),
                "token": {
                    "refresh": str(refresh),
                    "access": str(refresh.access_token),
                }
            }, status=status.HTTP_201_CREATED)
        except serializers.ValidationError as e:
            return Response({
                "error": "Registration validation failed",
                "detail": e.detail
            }, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({
                "error": "An unexpected error occurred during registration",
                "detail": str(e)
            }, status=status.HTTP_400_BAD_REQUEST)


class LoginView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer
    permission_classes = (permissions.AllowAny,)

class GoogleLogin(APIView):
    """
    Firebase Google login endpoint.
    Verifies a Firebase ID token from the frontend,
    then returns JWT tokens for the local Django user.
    """
    permission_classes = (permissions.AllowAny,)

    def post(self, request, *args, **kwargs):
        firebase_token = request.data.get('firebase_token')

        if not firebase_token:
            return Response({
                "error": "Firebase token topilmadi",
                "detail": "Request body ichida 'firebase_token' yuborilishi kerak"
            }, status=status.HTTP_400_BAD_REQUEST)

        # Verify Firebase token
        try:
            import firebase_admin
            from firebase_admin import auth as firebase_auth, credentials

            # Initialize Firebase Admin SDK if not already done
            if not firebase_admin._apps:
                service_account_path = getattr(settings, 'FIREBASE_CREDENTIALS_PATH', None)
                if service_account_path and os.path.exists(service_account_path):
                    cred = credentials.Certificate(service_account_path)
                else:
                    # Try env variable with base64 encoded JSON
                    import json, base64
                    encoded = os.getenv('FIREBASE_CREDENTIALS_BASE64', '')
                    if encoded:
                        decoded = base64.b64decode(encoded).decode('utf-8')
                        cred_dict = json.loads(decoded)
                        cred = credentials.Certificate(cred_dict)
                    else:
                        return Response({
                            "error": "Firebase sozlamalari topilmadi",
                            "detail": "Server tomonida FIREBASE_CREDENTIALS_PATH yoki FIREBASE_CREDENTIALS_BASE64 kerak"
                        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
                firebase_admin.initialize_app(cred)

            decoded_token = firebase_auth.verify_id_token(firebase_token)

        except Exception as e:
            print(f"DEBUG: Firebase token verification failed: {e}")
            return Response({
                "error": "Firebase token noto'g'ri yoki muddati o'tgan",
                "detail": str(e)
            }, status=status.HTTP_400_BAD_REQUEST)

        # Extract user info from verified token
        email = decoded_token.get('email', '').strip().lower()
        full_name = decoded_token.get('name') or email.split('@')[0]

        if not email:
            return Response({
                "error": "Firebase tokenida email topilmadi"
            }, status=status.HTTP_400_BAD_REQUEST)

        # Get or create local Django user
        try:
            user, created = User.objects.get_or_create(
                email=email,
                defaults={
                    'username': email,
                    'name': full_name,
                    'role': 'owner',
                }
            )
            if not created and user.name != full_name:
                user.name = full_name
                user.save(update_fields=['name'])
            if not user.username:
                user.username = email
                user.save(update_fields=['username'])

            print(f"DEBUG: User {'created' if created else 'found'}: {email}")

        except Exception as e:
            print(f"DEBUG: User get_or_create failed: {e}")
            return Response({
                "error": "Foydalanuvchi yaratishda xatolik",
                "detail": str(e)
            }, status=status.HTTP_400_BAD_REQUEST)

        # Generate Django JWT tokens
        refresh = RefreshToken.for_user(user)
        return Response({
            "user": UserSerializer(user).data,
            "access": str(refresh.access_token),
            "refresh": str(refresh),
            "token": {
                "refresh": str(refresh),
                "access": str(refresh.access_token),
            }
        }, status=status.HTTP_200_OK)



class LogoutView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        try:
            refresh_token = request.data.get("refresh")
            if refresh_token:
                token = RefreshToken(refresh_token)
                token.blacklist()
            return Response({"message": "Successfully logged out"}, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)


class UserProfileView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        serializer = UserSerializer(request.user)
        return Response(serializer.data)

    def put(self, request):
        # Allow updating name/email/phone/role
        serializer = UserSerializer(request.user, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ChangePasswordView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        user = request.user
        old_password = request.data.get('old_password')
        new_password = request.data.get('new_password')

        if not old_password or not new_password:
            return Response({
                "error": "Both old_password and new_password are required"
            }, status=status.HTTP_400_BAD_REQUEST)

        if not user.check_password(old_password):
            return Response({
                "error": "Old password is incorrect"
            }, status=status.HTTP_400_BAD_REQUEST)

        try:
            validate_password(new_password, user)
            user.set_password(new_password)
            user.save()
            return Response({
                "message": "Password changed successfully"
            }, status=status.HTTP_200_OK)
        except ValidationError as e:
            return Response({
                "error": list(e.messages)
            }, status=status.HTTP_400_BAD_REQUEST)
