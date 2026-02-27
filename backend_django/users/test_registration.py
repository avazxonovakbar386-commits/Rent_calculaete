from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from django.contrib.auth import get_user_model

User = get_user_model()

class RegistrationTests(APITestCase):
    def test_successful_registration(self):
        url = reverse('register')
        data = {
            'name': 'Test User',
            'email': 'test@example.com',
            'password': 'StrongPassword123!',
            'role': 'owner'
        }
        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(User.objects.count(), 1)
        self.assertEqual(User.objects.get().email, 'test@example.com')
        self.assertIn('token', response.data)

    def test_duplicate_email_registration(self):
        User.objects.create_user(
            username='existing@example.com',
            email='existing@example.com',
            password='Password123!',
            name='Existing User'
        )
        
        url = reverse('register')
        data = {
            'name': 'New User',
            'email': 'existing@example.com',
            'password': 'StrongPassword123!',
            'role': 'owner'
        }
        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('error', response.data)
        self.assertIn('email', response.data['detail'])

    def test_weak_password_registration(self):
        url = reverse('register')
        data = {
            'name': 'Test User',
            'email': 'test@example.com',
            'password': '123',
            'role': 'owner'
        }
        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('error', response.data)
        # Check if the validation error detail contains password message
        self.assertTrue(any('password' in str(v).lower() for v in response.data['detail'].values()))
