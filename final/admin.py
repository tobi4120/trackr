from django.contrib import admin
from .models import *

admin.site.register(User)
admin.site.register(Project)
admin.site.register(Task)
admin.site.register(Collaborator)
admin.site.register(Add_request)
admin.site.register(File)
admin.site.register(Board)

