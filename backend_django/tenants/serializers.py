from rest_framework import serializers
from tenants.models import Tenant

class TenantSerializer(serializers.ModelSerializer):
    # Flatten property name for display if needed, but for now standard serializer is enough
    # Front-end expects 'propertyId', so we might need mapping or just use id.
    # The frontend uses standard camelCase vs snake_case. 
    # DRF defaults to snake_case. We might need djangorestframework-camel-case or manual mapping.
    # For now, I will assume we update frontend to handle snake_case or we add mapping here.
    # Let's start with standard snake_case and update frontend.
    
    class Meta:
        model = Tenant
        fields = '__all__'
        read_only_fields = ('user',)
