from rest_framework import serializers

from .models import *

class Add_requestSerializer(serializers.HyperlinkedModelSerializer):
   
    project = serializers.PrimaryKeyRelatedField(queryset=Project.objects.all())

    class Meta:
        model = Add_request
        fields = ('id', 'sent_by', 'to', 'project', 'project_name')

class TaskSerializer(serializers.HyperlinkedModelSerializer):
    task_owner = serializers.CharField(read_only=True)
    project = serializers.PrimaryKeyRelatedField(queryset=Project.objects.all())

    class Meta:
        model = Task
        fields = ('id', 'task_description', 'creation_date', 'completed', 'task_owner', 'project')

class CollaboratorSerializer(serializers.HyperlinkedModelSerializer):
   
    project = serializers.PrimaryKeyRelatedField(queryset=Project.objects.all())

    class Meta:
        model = Collaborator
        fields = ('id', 'collaborator_name', 'project')

class ProjectSerializer(serializers.HyperlinkedModelSerializer):
    project_owner = serializers.CharField(read_only=True)
    tasks = TaskSerializer(many=True, read_only=True)
    collaborators = CollaboratorSerializer(many=True, read_only=True)
    add_requests = Add_requestSerializer(many=True, read_only=True)

    class Meta:
        model = Project
        fields = ('id', 'project_name', 'description', 'creation_date', 'due_date', 'completed', 'category', 'project_owner', 'tasks', 'collaborators', 'add_requests')

class UserSerializer(serializers.ModelSerializer):

    class Meta:
        model = User
        fields = ("__all__")

    def to_representation(self, obj):
        # get the original representation
        ret = super(UserSerializer, self).to_representation(obj)

        # remove fields
        ret.pop('password')
        ret.pop('is_superuser')
        ret.pop('first_name')
        ret.pop('last_name')
        ret.pop('is_staff')
        ret.pop('is_active')
        ret.pop('date_joined')
        ret.pop('groups')
        ret.pop('user_permissions')
        ret.pop('last_login')

        return ret  

class BoardSerializer(serializers.ModelSerializer):
    board_creator = serializers.CharField(read_only=True)

    class Meta:
        model = Board
        fields = ('id', 'board_name', 'projects', 'board_creator', 'color')

    def to_representation(self, instance):
        representation = super(BoardSerializer, self).to_representation(instance)
        representation['projects'] = ProjectSerializer(instance.projects.all(), many=True).data
        return representation 
