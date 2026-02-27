from rest_framework import serializers
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError

User = get_user_model()

class UserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=False)

    class Meta:
        model = User
        fields = ('id', 'name', 'email', 'password', 'role', 'phone')
        extra_kwargs = {'password': {'write_only': True, 'required': False}}

    def create(self, validated_data):
        email = validated_data.get('email')
        password = validated_data.pop('password')
        
        # Ensure username is always the same as email for consistency
        validated_data['username'] = email
        
        user = User.objects.create_user(
            password=password,
            **validated_data
        )
        return user
    
    def validate_password(self, value):
        try:
            validate_password(value)
        except ValidationError as e:
            raise serializers.ValidationError(list(e.messages))
        return value


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        data = super().validate(attrs)
        
        # Add user data to the response
        data['user'] = {
            'id': self.user.id,
            'name': self.user.name,
            'email': self.user.email,
            'role': self.user.role,
            'phone': self.user.phone,
        }
        
        return data
