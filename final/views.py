from django.shortcuts import render, redirect
from django.http import HttpResponse
from .models import *
from django.db import connections
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.decorators import login_required
from rest_framework import viewsets
from .serializers import *
from django.contrib import messages

from django.core.files.storage import FileSystemStorage
import xlsxwriter
import datetime

#Logo: logomakr.com/0gU2Nc

# Project API
class ProjectViewSet(viewsets.ModelViewSet):
    queryset = Project.objects.all().order_by('due_date')
    serializer_class = ProjectSerializer

    def perform_create(self, serializer):
        serializer.save(project_owner=self.request.user)

# Task API
class TaskViewSet(viewsets.ModelViewSet):
    queryset = Task.objects.all().order_by('-creation_date')
    serializer_class = TaskSerializer

    def perform_create(self, serializer):
        serializer.save(task_owner=self.request.user)

# Collaborator API
class CollaboratorViewSet(viewsets.ModelViewSet):
    queryset = Collaborator.objects.all().order_by('collaborator_name')
    serializer_class = CollaboratorSerializer

# User API
class UserViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer

# Add_request API
class Add_requestViewSet(viewsets.ModelViewSet):
    queryset = Add_request.objects.all()
    serializer_class = Add_requestSerializer

# Board API
class BoardViewSet(viewsets.ModelViewSet):
    queryset = Board.objects.all()
    serializer_class = BoardSerializer

    def perform_create(self, serializer):
        serializer.save(board_creator=self.request.user)

@login_required(login_url='/login')
def index(request):

    # Get current date 
    """
    current_date = datetime.datetime.now()

    current_date_formatted = current_date.strftime("%b-%d-%Y")

    # Create report - name should be current date...todo
    report = xlsxwriter.Workbook("/Users/michaeltobis/Documents/web50/projects/2020/x/capstone/final/static/report_{}_{}.xlsx".format(request.user.username, current_date_formatted))
    report_sheet = report.add_worksheet()

    # Get project names where user = project owner
    projects = Project.objects.filter(project_owner=request.user, completed=False).order_by('due_date').values('project_name', 'id')

    # Convert queryset to list
    projects_list = list(projects)

    # Get project names and ids where user = collaborator
    collaborator_project_ids = Collaborator.objects.filter(collaborator_name=request.user).values('project_id')
    collaborator_project_names = Collaborator.objects.filter(collaborator_name=request.user).select_related('project')

    collaborator_projects = []

    # Put the collaborator id and name together in a dict and then extend it to the projects_list
    for i in range(0, len(collaborator_project_ids)):
        collaborator_dict = {'project_name': str(collaborator_project_names[i]), 'id': collaborator_project_ids[i]['project_id']}
        collaborator_projects.append(collaborator_dict)
    
    projects_list.extend(collaborator_projects)

    # Get tasks
    tasks = Task.objects.all().order_by('-creation_date').values('task_description', 'completed', 'project', 'creation_date')

    # Format
    project_name_format = report.add_format({'bold': True})

    row = 1

    # Look through each project and output the project name and tasks on an Excel file
    for project in projects_list:

        # Header
        report_sheet.write(0, 1, "Creation Date")
        report_sheet.write(0, 2, "Completed")

        report_sheet.write(row, 0, project['project_name'], project_name_format)
        row += 1

        for task in tasks:
            if task['project'] == project['id']:
                report_sheet.write(row, 0, task['task_description'])
                report_sheet.write(row, 1, task['creation_date'].strftime("%m/%d/%Y"))
                report_sheet.write(row, 2, task['completed'])

                row += 1
        
        row += 1

    report.close()
    """

    return render(request, 'final/index.html', {
        "current_user": request.user,
        #"file_name": "static/report_{}_{}.xlsx".format(request.user.username, current_date_formatted)
    })

def register(request):

    # Log user out if previously logged in
    logout(request)
    
    if request.method == "GET":
        return render(request, "final/register.html")
    
    # Check if passwords match
    password = request.POST['password']
    if password != request.POST['confirm']:
        messages.warning(request, 'Error: Passwords do not match')

        return redirect(register)

    # Email
    email = ''

    # Check if username already exists
    username = request.POST['username']

    user = User.objects.filter(username=username)

    if user:
        messages.warning(request, 'Error: An account with this username already exists')

        return redirect(register)
    
    # Register user
    u = User.objects.create_user(username, email, password)
    u.save()

    # Log user in
    user = authenticate(request, username=username, password=password)

    login(request, user)

    # Redirect to index
    return redirect(index)

def login_view(request):

    # Log user out if previously logged in
    logout(request)

    if request.method == "GET":
        return render(request, "final/login.html")

    username = request.POST['username']
    password = request.POST['password']

    # Check if user exists
    user = authenticate(request, username=username, password=password)

    # If user exists log the user in
    if user is not None:
        login(request, user)

        return redirect(index)

    else:
        messages.warning(request, 'Error: Username or password is incorrect')

        return redirect(login_view)

def logout_view(request):
    logout(request)

    return redirect(login_view)

def files(request):

    if request.method == "POST":
        upload_file = request.FILES['document']

        fs = FileSystemStorage()
        fs.save(upload_file.name, upload_file)

        return HttpResponse(upload_file.name)

    return render(request, "final/file.html")
