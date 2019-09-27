# Web Image Builder

Weboberfläche und Server, um die Berliner Firmware zu bauen.

## Development

You need Python 3 and Git.
Git is not only needed for the development but also for running the application.

1. Clone the repository.
    ```bash
    git clone https://github.com/niccokunzmann/web-image-builder.git
    cd web-image-builder
    ```
2. Create a virtual environment (optional)
    ```bash
    pip install virtualenv
    virtualenv -p python3 ENV
    source ENV/bin/activate
    ```
3. Install the packages
    ```bash
    pip install -r requirements.txt
    ```

To run the web server, do this each time:
```bash
python3 -m builder.app
```

