from django.urls import path, include
from rest_framework import routers
from . import views

router = routers.DefaultRouter()
router.register(r'projects', views.ProjectViewSet)
router.register(r'tasks', views.TaskViewSet)
router.register(r'collaborators', views.CollaboratorViewSet)
router.register(r'users', views.UserViewSet)
router.register(r'add_requests', views.Add_requestViewSet)
router.register(r'boards', views.BoardViewSet)

urlpatterns = [
    path('', views.index, name='index'),
    path('register', views.register, name='register'),
    path('login', views.login_view, name='login'),
    path('logout', views.logout_view, name='logout'),
    path("api", include(router.urls)),
]