from django.contrib.auth.models import AbstractUser
from django.db import models

class User(AbstractUser):
    pass

class Project(models.Model):
    project_name = models.CharField(max_length=64)
    description = models.CharField(max_length=300, null=True, blank=True)
    creation_date = models.DateTimeField(auto_now_add=True)
    due_date = models.DateTimeField()
    completed = models.BooleanField()
    category = models.CharField(max_length=64, null=True, blank=True)
    project_owner = models.ForeignKey(User, on_delete=models.CASCADE)

    def __str__(self):
        return f"{self.project_name}"

class Task(models.Model):
    task_description = models.CharField(max_length=250)
    creation_date = models.DateTimeField(auto_now_add=True)
    completed = models.BooleanField()
    task_owner = models.ForeignKey(User, on_delete=models.CASCADE)
    project = models.ForeignKey(Project, related_name='tasks', on_delete=models.CASCADE)

    def __str__(self):
        return f"{self.task_description}"

class Collaborator(models.Model):
    collaborator_name = models.ForeignKey(User, to_field="username", on_delete=models.CASCADE)
    project = models.ForeignKey(Project, related_name='collaborators', on_delete=models.CASCADE)

    def __str__(self):
        return f"{self.project}"

class Add_request(models.Model):
    sent_by = models.ForeignKey(User, related_name='sent_by', to_field="username", on_delete=models.CASCADE)
    to = models.ForeignKey(User, related_name='to', to_field="username", on_delete=models.CASCADE)
    project = models.ForeignKey(Project, related_name='add_requests', on_delete=models.CASCADE)
    project_name = models.CharField(max_length=64)

    def __str__(self):
        return f"Add {self.to} to {self.project}"

class File(models.Model):
    actual_file = models.FileField()

class Board(models.Model):
    board_name = models.CharField(max_length=64)
    projects = models.ManyToManyField(Project, blank=True)
    board_creator = models.ForeignKey(User, on_delete=models.CASCADE)
    color = models.CharField(max_length=64)

    def __str__(self):
        return f"{self.board_name}"
