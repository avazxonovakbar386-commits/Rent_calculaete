from rest_framework import serializers
from django.contrib.auth import get_user_model
from properties.models import Property

User = get_user_model()

class PropertySerializer(serializers.ModelSerializer):
    class Meta:
        model = Property
        fields = '__all__'
        read_only_fields = ('user',)
