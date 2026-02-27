from rest_framework import serializers
from payments.models import Payment

class PaymentSerializer(serializers.ModelSerializer):
    date = serializers.DateField(source='payment_date', required=False)
    note = serializers.CharField(source='notes', required=False, allow_blank=True)

    class Meta:
        model = Payment
        fields = ('id', 'user', 'tenant', 'property', 'amount', 'payment_date', 'notes', 'date', 'note', 'payment_method', 'status', 'created_at')
        read_only_fields = ('user',)

    def create(self, validated_data):
        # The user is passed via the ViewSet's perform_create, but we'll ensure it here too just in case
        if 'user' not in validated_data and self.context.get('request'):
            validated_data['user'] = self.context['request'].user
        return super().create(validated_data)
