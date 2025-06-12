from django.http import HttpResponseRedirect
from django.urls import reverse

class RedirectAdminLoginMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        if request.path == '/admin/login/' and request.GET.get('next') == '/admin/':
            return HttpResponseRedirect(reverse('login') + '?next=/admin/')
        return self.get_response(request)