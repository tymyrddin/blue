# -- Project information -----------------------------------------------------

project = 'Blue Team'
copyright = '2025, TyMyrddin'
author = 'TyMyrddin'
release = '0.1'

# -- General configuration ---------------------------------------------------
extensions = [
    'myst_parser',
    'sphinx_markdown_tables',
]

source_suffix = ['.rst', '.md']
templates_path = ['_templates']
exclude_patterns = []

# -- Options for HTML output -------------------------------------------------
html_theme = 'furo'

# Theme options are theme-specific and customize the look and feel of a theme
html_theme_options = {
    "sidebar_hide_name": True,
    "navigation_with_keys": True,
    # Add a dismissible announcement banner
    "announcement": "<em>New release v1.0!</em> 🎉",
}

html_title = "Blue Team"
html_logo = "img/logo.png"
html_favicon = "img/favicon.ico"

html_static_path = ['_static']
html_css_files = ['css/custom.css']

html_show_sphinx = False
html_show_copyright = False
