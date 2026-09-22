from django.urls import path
from . import views

urlpatterns = [
    path('health/', views.health_check, name='health_check'),
    path('plan-trip/', views.plan_trip, name='plan_trip'),
]
