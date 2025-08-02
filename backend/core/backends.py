from django.contrib.auth.backends import ModelBackend
from django.contrib.auth import get_user_model
from django.db.models import Q

User = get_user_model()

class EmailBackend(ModelBackend):
    def authenticate(self, request, username=None, password=None, **kwargs):
        # Email'i kwargs'dan al veya username'den al
        email = kwargs.get('email') or username
        try:
            # Email ile kullanıcıyı bul
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return None
        
        # Şifreyi kontrol et
        if user.check_password(password) and self.user_can_authenticate(user):
            return user
        return None

    def get_user(self, user_id):
        try:
            return User.objects.get(pk=user_id)
        except User.DoesNotExist:
            return None 