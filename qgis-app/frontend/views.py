from django.views.generic import TemplateView


class FrontendView(TemplateView):
    """
    Serves the React SPA shell. All URL routing is handled
    client-side by React Router.
    """

    template_name = "app.html"
